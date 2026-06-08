import express from "express";
import { createServer as createViteServer } from "vite";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import cors from "cors";
import bcrypt from "bcrypt";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors({
  origin: [
    'https://mifeco.com',
    'https://www.mifeco.com',
    'http://localhost:3002',
    'http://localhost:5173',
  ],
  credentials: true,
}));
  app.use(express.json({ limit: "50mb" }));

  // Setup SQLite
  const db = await open({
    filename: "./database.sqlite",
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      ownerId TEXT,
      data TEXT
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT,
      email TEXT UNIQUE,
      password TEXT,
      geminiKey TEXT
    );
  `);

  try {
    await db.exec(`ALTER TABLE users ADD COLUMN geminiKey TEXT;`);
  } catch (e: any) {
    // Ignore error if column already exists
  }

  // Add tier / billing columns to users table
  const userColumns = [
    `tier TEXT DEFAULT 'free'`,
    `stripeCustomerId TEXT`,
    `subscriptionStatus TEXT`,
    `subscriptionEndsAt TEXT`,
  ];
  for (const col of userColumns) {
    try {
      await db.exec(`ALTER TABLE users ADD COLUMN ${col};`);
    } catch (e: any) {
      // Ignore error if column already exists
    }
  }

  // Stripe webhook secret (set via env in production)
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? 'whsec_placeholder';

  // ─── Health endpoint ───────────────────────────────────────────
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', product: 'mifeco-pm-accelerator', tier: 'free|pro' });
  });

  // ─── User tier endpoint ───────────────────────────────────────
  app.get('/api/user/tier', async (req, res) => {
    const { userId } = req.query;
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Missing userId' });
    }
    try {
      const user = await db.get(
        'SELECT id, username, email, tier, subscriptionStatus, subscriptionEndsAt FROM users WHERE id = ?',
        [userId],
      );
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      console.error('Failed to fetch user tier:', error);
      res.status(500).json({ error: 'Failed to fetch user tier' });
    }
  });

  // ─── Stripe webhook endpoint ──────────────────────────────────
  // NOTE: In production, verify the Stripe-Signature header:
  //   import Stripe from 'stripe';
  //   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  //   const sig = req.headers['stripe-signature'] as string;
  //   const event = stripe.webhooks.constructEvent(req.rawBody, sig, STRIPE_WEBHOOK_SECRET);
  app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const event = req.body;

    switch (event.type) {
      case 'checkout.session.completed': {
        const customerId = event.data?.object?.customer;
        const clientRefId = event.data?.object?.client_reference_id;
        if (clientRefId) {
          try {
            await db.run(
              "UPDATE users SET tier = 'pro', stripeCustomerId = ?, subscriptionStatus = 'active' WHERE id = ?",
              [customerId, clientRefId],
            );
            console.log(`[Stripe] Upgraded user ${clientRefId} to pro`);
          } catch (err) {
            console.error('[Stripe] Failed to upgrade user:', err);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const customerId = event.data?.object?.customer;
        const status = event.data?.object?.status;
        const currentPeriodEnd = event.data?.object?.current_period_end;
        if (customerId) {
          try {
            const endsAt = currentPeriodEnd
              ? new Date(currentPeriodEnd * 1000).toISOString()
              : null;
            await db.run(
              'UPDATE users SET subscriptionStatus = ?, subscriptionEndsAt = ? WHERE stripeCustomerId = ?',
              [status, endsAt, customerId],
            );
            console.log(`[Stripe] Updated subscription for ${customerId}: ${status}`);
          } catch (err) {
            console.error('[Stripe] Failed to update subscription:', err);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const customerId = event.data?.object?.customer;
        if (customerId) {
          try {
            await db.run(
              "UPDATE users SET tier = 'free', subscriptionStatus = 'canceled' WHERE stripeCustomerId = ?",
              [customerId],
            );
            console.log(`[Stripe] Downgraded user ${customerId} to free`);
          } catch (err) {
            console.error('[Stripe] Failed to downgrade user:', err);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const customerId = event.data?.object?.customer;
        if (customerId) {
          try {
            await db.run(
              "UPDATE users SET subscriptionStatus = 'past_due' WHERE stripeCustomerId = ?",
              [customerId],
            );
            console.log(`[Stripe] Payment failed for ${customerId}`);
          } catch (err) {
            console.error('[Stripe] Failed to mark past_due:', err);
          }
        }
        break;
      }

      default:
        console.log(`[Stripe] Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  });
  app.post("/api/auth/signup", async (req, res) => {
    const { username, email, password, geminiKey } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    try {
      const id = `user-${Date.now()}`;
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.run(
        "INSERT INTO users (id, username, email, password, geminiKey) VALUES (?, ?, ?, ?, ?)",
        [id, username, email, hashedPassword, geminiKey || null]
      );
      res.json({ id, username, email, geminiKey: geminiKey || null, tier: 'free', notificationPrefs: {} });
    } catch (error: any) {
      if (error.message.includes("UNIQUE constraint failed")) {
        return res.status(409).json({ error: "Email already exists" });
      }
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email/username or password" });
    }
    try {
      const user = await db.get(
        "SELECT id, username, email, password as hashedPassword, geminiKey FROM users WHERE email = ? OR username = ?",
        [email, email]
      );
      
      if (user && await bcrypt.compare(password, user.hashedPassword)) {
        const { hashedPassword, ...userWithoutPassword } = user;
        res.json({ ...userWithoutPassword, tier: user.tier || 'free', notificationPrefs: {} });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/users/:id/geminikey", async (req, res) => {
    const { id } = req.params;
    const { geminiKey } = req.body;
    try {
      await db.run("UPDATE users SET geminiKey = ? WHERE id = ?", [geminiKey, id]);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to update Gemini key:", error);
      res.status(500).json({ error: "Failed to update Gemini key" });
    }
  });

  // API Routes
  app.get("/api/projects", async (req, res) => {
    const { userId } = req.query;
    try {
      let rows;
      if (userId) {
        rows = await db.all("SELECT data FROM projects WHERE ownerId = ?", [userId]);
      } else {
        rows = await db.all("SELECT data FROM projects");
      }
      const projects = rows.map((row) => JSON.parse(row.data));
      res.json(projects);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const projects = req.body; // Expecting an array of projects to sync
      if (!Array.isArray(projects)) {
        return res.status(400).json({ error: "Expected an array of projects" });
      }
      for (const project of projects) {
        await db.run(
          "INSERT OR REPLACE INTO projects (id, ownerId, data) VALUES (?, ?, ?)",
          [project.id, project.ownerId, JSON.stringify(project)]
        );
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to save projects:", error);
      res.status(500).json({ error: "Failed to save projects" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await db.run("DELETE FROM projects WHERE id = ?", [id]);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete project:", error);
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  app.delete("/api/projects", async (req, res) => {
    const { userId } = req.query;
    try {
      if (userId) {
        await db.run("DELETE FROM projects WHERE ownerId = ?", [userId]);
      } else {
        await db.run("DELETE FROM projects");
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete projects:", error);
      res.status(500).json({ error: "Failed to delete projects" });
    }
  });

  // Vite middleware for development
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Vite in middleware mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static files from dist...");
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
