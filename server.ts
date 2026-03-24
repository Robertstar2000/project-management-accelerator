import express from "express";
import { createServer as createViteServer } from "vite";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import cors from "cors";
import bcrypt from "bcrypt";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
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

  // Auth Routes
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
      res.json({ id, username, email, geminiKey: geminiKey || null, notificationPrefs: {} });
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
        res.json({ ...userWithoutPassword, notificationPrefs: {} });
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
