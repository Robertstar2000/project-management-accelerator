# MIFECO Hub: AI-System Emulation & Reconstruction Blueprint

This document serves as a high-density, multi-agent-compatible technical specification. It contains all the context, schemas, architectural rules, aesthetic variables, and functional pipelines required for LLMs or code generators (e.g., Hermes, OpenClaw, Claude, Codex) to fully understand, emulate, recreate, or maintain the **MIFECO Hub** application.

---

## 🌌 1. Visual Identity & Aesthetic Spec

To successfully emulate MIFECO Hub, the interface must strictly reject generic component libraries in favor of a cohesive, high-contrast, premium **Deep Slate Cyberpunk / Command Center** design.

### A. Color Tokens
- **Canvas Base**: Slate-950 (`#020617` to `#0f172a` linear gradient).
- **Surface Panels (Glass Cards)**: Semi-transparent Slate-900/800 (`rgba(15, 23, 42, 0.6)`) with high backdrop-blur (`backdrop-filter: blur(16px)`).
- **Text Hierarchy**:
  - Ice White (`#f8fafc` / `text-slate-50`) for titles and high-priority labels.
  - Classic Slate (`#94a3b8` / `text-slate-400`) for primary body copy.
  - Muted Charcoal (`#475569` / `text-slate-600`) for low-priority descriptors and background grid lines.
- **Neon Accents**:
  - **MIFECO Rainbow Gradient**: Linear gradient from Cyan (`#00f2ff`) through Pink (`#ff00ff`) to Violet (`#7000ff`).
  - **Neon Cyan**: `#00f2ff` (Active states, navigation borders, primary focus indicators).
  - **Neon Pink**: `#ff00ff` (Primary action buttons, wizards, high-impact buttons).
- **Interactive States**:
  - **Approved / Complete**: `#10b981` (Emerald/Green).
  - **In Progress**: `#f59e0b` (Amber/Yellow).
  - **Blocked / Error**: `#ef4444` (Rose/Red).

### B. Typography Pairings
- **Display Typography**: `Space Grotesk` (Google Font), styled with bold tracking-tighter margins. Used for hero headings, titles, and branding.
- **Body & Controls**: `Inter` (Sans-serif). Crisp tracking, optimized for readability in dense configurations.
- **Diagnostic / Metadata Accent**: `JetBrains Mono`. Used for counters, timestamps, IDs, status states, and budget numbers.

---

## 📦 2. Full-Stack Architecture & Databases

MIFECO Hub utilizes a decoupled full-stack model that binds React client-side interfaces to a Node.js + Express backend running a local database.

### A. Database Layer (`database.sqlite`)
The persistence schema consists of two tables designed for zero-data-loss workspace caching:

```sql
-- Users and credential accounts
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- Hashed on server via bcrypt
  geminiKey TEXT          -- Encrypted/Plain Gemini API Key stored securely
);

-- Serialized Workspace Projects
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  ownerId TEXT NOT NULL,
  data TEXT NOT NULL      -- Complete compressed JSON serialization of the project document tree
);
```

### B. Express Routing Interface (`server.ts`)
The backend manages session tokens, password security, and active syncing over standard HTTP/JSON routes:

| Route | Method | Description | Payload Expected |
|---|---|---|---|
| `/api/auth/signup` | `POST` | Registers a new profile. Salts and hashes passwords (`bcrypt` 10 rounds). | `{username, email, password}` |
| `/api/auth/login` | `POST` | Authenticates credentials, returning the user state. | `{email, password}` |
| `/api/users/:id/geminikey`| `POST` | Updates the workspace Gemini key. | `{geminiKey}` |
| `/api/projects` | `GET` | Retrieves projects (optionally scoped by `userId` query parameter). | *None* |
| `/api/projects` | `POST` | Syncs workspace states, performing bulk `INSERT OR REPLACE` actions. | `[Project]` |
| `/api/projects/:id` | `DELETE` | Hard-purges a designated project file. | *None* |

### C. Client State Engine & Synchronization
1. **React State Flow**: Managed in `App.tsx` as a centralized parent state. Changes to individual phases, Gantt bars, or team structures trigger state mutation handlers that serialise and flush updates to `/api/projects` asynchronously.
2. **Synchronous Broadcast Channel (`syncService.ts`)**:
   - A browser-level communication socket `BroadcastChannel('hmap_sync_channel')` coordinates multi-tab operation.
   - When Tab A commits a change, it triggers a `'hmap_state_updated'` event.
   - Hearing this, Tab B blocks internal write timers, syncs its cache with the database, and rerenders the interface seamlessly.
3. **Storage Polling (`storage.ts`)**:
   - Pulls data from `/api/projects` every 10 seconds to detect concurrent database modifications on other terminals or collaborators' nodes.

---

## 🧠 3. AI Planning Engine & Prompt Strategy

Reconstructing the core automation engine requires hooking the `@google/genai` client into a gated HMAP (Hyper-Agile Management Process) pipeline.

### A. The 7 gated HMAP Planning Phases
The planning workspace requires consecutive document generation:
1. **Concept Proposal**: Raw scope ideas.
2. **Feasibility Study (SWOT)**: AI validation of market risks, cost assumptions, and technological obstacles.
3. **Workload Requirements Sheet (WRS)**: Human role profiling and capacity allocation schedules.
4. **Statement of Work (SOW)**: Codified legal constraints, milestones, and deliverable service levels.
5. **Work Breakdown Structure (WBS)**: Logically deconstructing the plan into distinct work scopes.
6. **Milestone Schedule**: Formulating calendar goals and gate criteria.
7. **Detailed Plans & Timeline**: Compiles all approved documents into a final, highly structured tabular plan.

*Rule: Phase N+1 is locked until Phase N's document state has been changed to "Approved" (Complete).*

### B. Prompt Compaction & Context Loops
To prevent context drift and rate-limit timeouts, the generation loop performs background compaction:
- **Generation Phase**: AI produces high-density Markdown text based on the HMAP prompts.
- **Compaction Hook**: On completion, a background request fires `PROMPTS.compactContent`, returning a short bulleted list of raw planning facts.
- **Drill-Down feeding**: Subsequent prompts ingest these compacted bullets instead of the massive source documents, optimizing token usage.

### C. Gemini API Retry and Guard Routines
- **Adaptive Truncation**: Inputs exceeding model token capacities are cropped automatically from the bottom up.
- **Exponential Backoff (`withRetry`)**: Catches HTTP 429 and transient errors, retrying up to 2 times with backoff timers.
- **Spacing Safeguard**: Implements a forced 3-second sleep cycle between sequential automated generations to prevent API key congestion.

---

## 📊 4. Structural Table Parsing & Gantt Calculations

To translate Phase 7's raw AI text output into functional Gantt charts, Kanban boards, and workload grids, you must parse its tables into database structures.

### A. Markdown Parser Logic (`markdownParser.ts`)
The parser identifies Markdown table rows using regex or string splits (`|`):
1. **Column Normalization**: Scans for headers representing *Task Name, Assigned Role, Duration, and Prerequisites*.
2. **Relative Indexing**: Translates text duration offsets (e.g., "Day 5", "Week 2") into actual millisecond offsets added to the project's start timestamp.
3. **Relationship Mapping**: Traces prerequisite task names and links them to the generated target ID arrays (`task-${Date.now()}-${random}`).

### B. Prerequisite & Block Check Logic
The system evaluates real-time task blockages on-the-fly:
- A task is flagged as **Blocked** if it has prerequisites listed whose parent tasks do not possess a `status === 'done'` state.
- In-app visualizers render blocked nodes with distinct **red-stripe overlays** and warn users when double-clicked.
- When Task A changes state to `done`, the app traverses child tasks, updates statuses, and dispatches UI alerts to team members.

---

## 🛠️ 5. Environmental Requirements & Build Pipelines

### A. Build Manifest (`package.json` extract)
```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx server.ts",
    "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
    "start": "node dist/server.cjs"
  },
  "dependencies": {
    "@google/genai": "^0.1.1",
    "bcrypt": "^5.1.1",
    "better-sqlite3": "^11.0.0",
    "express": "^4.19.0",
    "lucide-react": "^0.400.0",
    "motion": "^11.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "recharts": "^2.12.0",
    "vite": "^5.2.0"
  },
  "devDependencies": {
    "esbuild": "^0.20.0",
    "tsx": "^4.7.0",
    "typescript": "^5.2.0"
  }
}
```

### B. Compiles & Startup Pipeline
1. **Dev Mode**: Booted via `tsx server.ts`. Runs on port `3000` using Vite middleware inside Express for standard Hot Module Replacement.
2. **Production Bundler**:
   - Client is compiled to static files in `dist/`.
   - Node backend is bundled via `esbuild` into a standalone CommonJS file: `dist/server.cjs`. This bundles local files while leaving external libraries (Express, SQLite) unpackaged.
3. **Runtime Execution**: Launched using `node dist/server.cjs` on host `0.0.0.0` at port `3000`.
