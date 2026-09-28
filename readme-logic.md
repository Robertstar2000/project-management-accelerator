# Technical Architecture & Application Logic Outline

This document details the underlying software architecture, data flow, API endpoints, and AI optimization systems implemented within MIFECO Hub.

---

## 💾 1. Backend & Database Architecture

MIFECO Hub is configured as a full-stack Node.js + Express application using a local, file-based SQL database for performance, persistence, and simple offline/containerized operations.

### A. Database Schema (`database.sqlite`)
The system initializes an SQLite database with two highly indexed tables:

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT,
  email TEXT UNIQUE,
  password TEXT, -- Hashed with bcrypt
  geminiKey TEXT  -- User-specific encryption key or API key
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  ownerId TEXT,
  data TEXT -- Complete JSON serialized project schema (tasks, documents, milestones)
);
```

### B. Express Routing Layer (`server.ts`)
The server exposes structured JSON API endpoints:
- **`POST /api/auth/signup`**: Registers users, hashes passwords securely using `bcrypt` (10 salt rounds), and writes them to the SQLite database.
- **`POST /api/auth/login`**: Authenticates credentials, returning a user context (excluding password hashes) to be held in client session state.
- **`POST /api/users/:id/geminikey`**: Overwrites or registers a custom Gemini API key for a specified user profile.
- **`GET /api/projects`**: Retreives workspaces. If a `userId` query parameter is supplied, it isolates results to that user's projects.
- **`POST /api/projects`**: Expects an array of serialized project objects, performing an `INSERT OR REPLACE` transaction inside the SQLite DB.
- **`DELETE /api/projects/:id`**: Completely purges a specific project by workspace ID.
- **`DELETE /api/projects`**: Performs a cascade deletion of projects.

---

## 🎛️ 2. Frontend State Management & Syncing

### A. Core React State Engine (`App.tsx`)
The application is governed by a **single source of truth** pattern managed inside `App.tsx`:
1. **Authentication Observer**: The hook `authService.onAuthStateChanged` listens for active session changes. When a user is detected, it loads their workspace list from `/api/projects?userId=...` and updates React state.
2. **Top-Down Prop Drilling**: Child views (Dashboard, Phases, Tracking) receive state read access and update actions via drilled callbacks (`saveProject`, `handleSave`, etc.), which serialize and flush the entire updated project tree back to the Express endpoint.
3. **Local Cache Mirror**: To ensure near-instantaneous page transitions, key configurations (like `selectedProjectId` or active user flags) are mirrored in browser `localStorage`.

### B. Synchronous Multi-Tab Orchestration (`syncService.ts`)
To prevent concurrent editing collisions when a user has multiple tabs open on the same machine:
- A `BroadcastChannel` named `'hmap_sync_channel'` is established on page mount.
- Whenever a tab executes a write transaction, it broadcasts a `'hmap_state_updated'` event.
- Sister tabs capture this frame, bypass internal update loops, and trigger a background fetch to the SQLite server, instantly keeping all view canvases in sync.

### C. Remote Database Synchronization (`storage.ts`)
- In addition to local broadcasts, `subscribeToRemoteChanges` runs a lightweight **polling engine** that checks `/api/projects` every 10 seconds.
- This merges any server-side state edits made by collaborators or other systems into the active React view, enabling real-time cooperative tracking.

---

## 🧠 3. Advanced AI Engine & Prompt Engineering

The core automation mechanics are executed client-side via the `@google/genai` TypeScript SDK, routed through optimized prompt context generators.

### A. Intelligent Context Compaction
To minimize token consumption and maintain extreme logical alignment over a long planning cycle, the app uses a dual-step pipeline:
1. **Initial Generation**: The AI generates a lengthy, natural-language document (e.g. Feasibility Study) matching a highly formatted HMAP template.
2. **Context Compaction**: The app immediately fires a background request (`PROMPTS.compactContent`) to the AI, instructing it to summarize the newly generated document into a condensed, information-dense Markdown bullet list.
3. **Feeding the Context Loop**: In downstream phases, the AI is fed these compacted summaries instead of the full natural-language logs, preventing context drift while avoiding rate limits or token overflow.

### B. Prompt Token Guarding & Retries
- **Intelligent Truncation (`truncatePrompt`)**: Prevents API crashes when input variables grow too large by automatically parsing character limits and trimming prompts cleanly from the bottom up.
- **Resilient API Calls (`withRetry`)**: Wraps all generation pipelines. If the Gemini API fails due to standard networking drops, temporary 503 overflows, or rate-limits, the helper automatically retries the query up to 2 times with an exponential backoff curve.
- **Rate Limit Safeguards**: A forced **3-second delay** is inserted between sequential automated generations (Phase 1-7 loops) to prevent standard `HTTP 429` (Too Many Requests) failures on free-tier Gemini API keys.

---

## 📊 4. Structural Plan Parsing & Execution

Once Phase 7 ("Develop Detailed Plans & Timeline") is marked complete, the application bridges natural-language planning into structured visual tools using the following parser chain:

### A. Markdown Table Extractor (`markdownParser.ts`)
The AI-generated planning document output for Phase 7 includes structured Markdown tables representing tasks and milestones:

```markdown
| Task Name | Role | Start Day | Duration (Days) | Prerequisites | Sprint | Description |
|-----------|------|-----------|-----------------|---------------|--------|-------------|
```

The frontend parses these lines, isolates the table rows, and parses cell values:
1. **Sanitization**: Standardizes column names, cell delimiters, and handles empty values.
2. **Dependency Mapping**: Maps textual prerequisites (e.g., "Write SOW") to generated ID strings.
3. **ID Generation**: Assigns consistent, unique entity IDs (`task-${Date.now()}-${random}`) to each row.
4. **Dates Initialization**: Translates relative start offsets (e.g., "Day 5") into actual Gregorian dates offset from the project's baseline start date.

### B. Gantt & Blocked Task Diagnostics
- Tasks that have prerequisite IDs listed but whose prerequisite tasks have not been marked `done` are flagged as **Blocked**.
- In the Gantt and Task lists, these are visually styled with warning states (red striped overlays) so team members immediately know what work is stuck.
- **Action Chains**: Marking a task `done` triggers a search through dependent items, resolving their prerequisites, and firing unread alerts to the user profiles assigned to those roles.

---

## 🔍 5. Diagnostic Logging Buffer (`logging.ts`)

To inspect complex asynchronous operations and prevent rendering failures:
- The app maintains an in-memory ring buffer capturing timestamps, module tags, action keys, and state objects.
- This buffer can be exported as a standard `logs.md` file from the floating in-app Help Modal for debugging and compliance.
