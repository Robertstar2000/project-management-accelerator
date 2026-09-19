import express from "express";
import helmet from "helmet";
import { createServer as createViteServer } from "vite";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { installSecureAuth, type AuthDb } from "./secureAuth.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);


  app.use(express.json({ limit: "50mb" }));
  app.use(helmet());

  app.post("/api/artifacts", async (req, res) => {
    try {
      const { app: appName, projectId, source, prompt, timestamp, generator, model, data, mimeType, structuredData } = req.body || {};
      if (appName !== "Project Accelerator" || !projectId || !source || !prompt || !data || generator !== "Designer/Gemini") return res.status(400).json({ error: "Invalid artifact payload" });
      const safeProjectId = String(projectId).replace(/[^a-zA-Z0-9_-]/g, "_");
      const safeSource = String(source).replace(/[^a-zA-Z0-9_-]/g, "_");
      const dir = path.join(__dirname, "artifacts", safeProjectId);
      await fs.mkdir(dir, { recursive: true });
      const imagePath = path.join(dir, `${Date.now()}-${safeSource}.png`);
      const tempPath = `${imagePath}.tmp`;
      await fs.writeFile(tempPath, Buffer.from(String(data).replace(/^data:image\/[^;]+;base64,/, ""), "base64"));
      await fs.rename(tempPath, imagePath);
      const provenance = { app: appName, projectId: safeProjectId, source, prompt, timestamp: timestamp || new Date().toISOString(), generator, model, mimeType: mimeType || "image/png", path: imagePath, structuredData };
      await fs.writeFile(`${imagePath}.provenance.json`, JSON.stringify(provenance, null, 2));
      res.status(201).json(provenance);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Gemini same-origin proxy for restricted browser environments
  app.use('/gapi', async (req: any, res: any) => {
    try {
      const targetPath = req.originalUrl.replace(/^\/gapi/, '');
      const url = 'https://generativelanguage.googleapis.com' + targetPath;
      const fetchOpts: any = { method: req.method, headers: { 'Content-Type': 'application/json' } };
      const apiKey = req.headers['x-goog-api-key'] || req.query.key;
      if (apiKey) fetchOpts.headers['x-goog-api-key'] = apiKey;
      if (req.method !== 'GET' && req.method !== 'HEAD') fetchOpts.body = JSON.stringify(req.body);
      const r = await fetch(url, fetchOpts);
      const text = await r.text();
      res.status(r.status).set('Content-Type', r.headers.get('content-type') || 'application/json').send(text);
    } catch (e: any) {
      res.status(502).json({ error: 'gemini proxy failed: ' + e.message });
    }
  });

  // Setup SQLite
  const db = await open({
    filename: process.env.AUTH_DB_PATH || path.join(__dirname, "database.sqlite"),
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

  // Lightweight liveness/readiness endpoint for deployment probes.
  app.get("/health", async (_req, res) => {
    try {
      await db.get("SELECT 1 AS ok");
      res.status(200).json({ status: "ok", service: "pm-accelerator" });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(503).json({ status: "error", service: "pm-accelerator" });
    }
  });

  try {
    await db.exec(`ALTER TABLE users ADD COLUMN geminiKey TEXT;`);
  } catch (e: any) {
    // Ignore error if column already exists
  }

  const authDb: AuthDb = {
    exec: (sql) => db.exec(sql),
    get: (sql, params = []) => db.get(sql, params),
    all: (sql, params = []) => db.all(sql, params),
    run: async (sql, params = []) => { const r = await db.run(sql, params); return { changes: r.changes, lastID: r.lastID }; },
  };
  await installSecureAuth(app, authDb, 'password');


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

  // Serve help.md and other root static files for modals
  app.get("/helpme.md", (req, res) => {
    res.sendFile(path.join(__dirname, "helpme.md"));
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

  app.listen(PORT, "127.0.0.1", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
