# MIFECO Hub: Project Management Accelerator

MIFECO Hub is a high-fidelity, full-stack, AI-powered project management platform styled with a premium **Cyberpunk / Deep Slate Tech** aesthetic. It guides teams and individual users through the complete lifecycle of their initiatives using the proven **Hyper-Agile Management Process (HMAP)**.

By pairing advanced AI-driven documentation engines (powered by the Google Gemini API) with robust local-and-cloud execution tools, MIFECO Hub compresses months of traditional project planning into hours of tactical alignment.

---

## 🚀 Key Architectural & Functional Highlights

1. **Full-Stack Execution**: Built on a modular **Express + React (Vite)** architecture. All authentication, session storage, and workspace configurations are backed by a persistent **SQLite Database** (`database.sqlite`).
2. **Premium Cyberpunk Aesthetics**: Custom glassmorphic cards (`rgba(30, 41, 59, 0.6)`), custom radial background glow effects, **Rainbow Gradient Typography** (Space Grotesk + Inter), and neon-accent elements that bring enterprise-grade tooling into a sleek, technical workspace.
3. **Multi-User Collaboration**: Users can register and authenticate securely via hashed credentials. Workspace isolation ensures projects are only visible to the project owner and assigned team members.
4. **Structured HMAP Lifecycle**: Enforces a chronological, stage-gated review of the 7 project phases. Documents must be consecutively authored, customized, and approved before unlocking successive phases.
5. **Interactive Project Tracking**: Once planning is complete, the application parses the natural-language Statement of Work and WBS/WRS into a structured database schema containing Sprints, Tasks, and Milestones. It automatically unlocks and populates:
   - **Interactive Gantt Timeline** with task dependency arrows.
   - **Kanban Board** for live status dragging.
   - **Workload Heat Map** for role capacity visualization.
   - **Cost & Resource Allocation Panel**.
6. **Advanced Simulation & Change Control**: Lets you request changes and perform "What-If" cost and schedule calculations side-by-side across multiple hypothetical scenarios before committing.

---

## 📂 Tech Stack & Architecture

- **Frontend**: React 18 with Vite, styled with Tailwind CSS, custom CSS theme tokens, and dynamic SVG vectors (Lucide React). Animated transitions are powered by `motion/react`.
- **Backend API**: Node.js Express server (`server.ts`) handling JSON payload proxies, user accounts, and project syncing.
- **Database**: SQLite database file (`database.sqlite`) containing `projects` and `users` tables, ensuring zero data loss upon browser cache clearing.
- **AI Core**: `@google/genai` client utilizing the latest Google Gemini API. Key management supports custom user-configured key submission or internal promotional fallback toggling.

---

## 🧭 User Operations Guide

### 1. Unified Authentication Protocol
Upon launching the application, you will greet the split-screen **MIFECO Hub Auth Console**:
- **Sign Up / Sign In**: Create an account with a secure username, email, and password. You can optionally pre-provision your custom Gemini API Key.
- **Aesthetic Left Panel**: Highlights the 5 core acceleration standards of the HMAP protocol with numbered neon blocks (01-05).
- **Security**: Passwords are securely salted and hashed (`bcrypt`) on the backend before insertion into the database.

### 2. Mission Control Landing Page
Once authenticated, you enter your personal dashboard:
- **Active Projects**: View total workspace count and load your personal project list.
- **Initiate Protocol**: Create a brand new project. Choose between "Internal" or "Subcontracted" scopes. The subcontracted scope automatically adds an RFP (Request for Proposal) and formal Contract milestones to the sequence.
- **AI Engine Config**: Enter your Google Gemini API key or toggle the promo credentials option. This configuration is securely synchronized with your profile in the database.

### 3. Chronological HMAP Phase Progression
The system guides you through 7 planning phases inside the **Project Phases View**:
1. **Concept Proposal**: Outlines high-level target parameters and basic project directives.
2. **Feasibility Study & SWOT Analysis**: Formally validates risks, market opportunities, and critical threats.
3. **Resources & Skills List (WRS)**: Extracts required project profiles, roles, and labor estimates.
4. **Statement of Work (SOW)**: Codifies absolute project boundaries, deliverables, and service levels.
5. **Work Breakdown Structure (WBS)**: Logically decomposes deliverables into high-level activities.
6. **Milestone Plan**: Determines timeline milestones and validation constraints.
7. **Develop Detailed Plans & Timeline**: A powerful multi-pass AI routine parses all approved preceding artifacts to automatically build your tracking database!

*Note: In obedience to HMAP rigor, each Phase is locked until the document immediately preceding it has been marked as "Approved" (Status: `Complete`).*

### 4. Interactive Project Tracking & Diagnostics
Once the final plan is generated, the `Dashboard`, `Project Tracking`, and `Revision Control` tabs unlock:
- **Gantt Chart**: Drag-and-drop or view start/end durations. Highlight stripes visually identify "Blocked" tasks whose preceding prerequisites are incomplete.
- **Kanban Flow**: Move tasks between `To Do`, `In Progress`, and `Done` states.
- **Workload Map**: Displays color-coded allocation cells per team member per week, letting managers quickly spot and fix resource overallocation.
- **Task Detail Modals**: Support multi-line descriptions, recurring schedule intervals (daily, weekly, monthly), file uploads, and collaborative comments with team `@` mentions.
- **Status Alerts**: A notification bell in the main header alerts users when a task they are assigned to becomes "unblocked" by prerequisite completions.

### 5. Change Control & Scenarios
Model major scope variations safely using the Change Request manager:
- Define a baseline change or a potential delay.
- Create multiple hypothetical **What-If Scenarios**.
- Review the **Auto Impact Analysis** matrix, displaying side-by-side differences in project cost, resources, and final completion dates before executing a live deploy to your baseline plan.

---

## 🛠️ Installation & Execution

To run MIFECO Hub in your workspace environment:

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
The application will boot in hybrid mode, launching the Express API routing server alongside Vite middleware on port `3000`.

### 3. Build & Package for Production
```bash
npm run build
```
This script bundles the client-side SPA bundle (`dist/`) and compiles the backend code into a single, highly-optimized CommonJS file (`dist/server.cjs`) using esbuild.

### 4. Run Standalone Production Build
```bash
npm start
```
This launches the compiled production backend server, serving static assets and managing SQLite queries.

---

## 📄 Documentation Manifest
- `readme.md`: Main repository overview, feature breakdown, and quickstart guide.
- `helpme.md`: Interactive, user-facing manual fetched directly by the in-app Help Modal.
- `readme-logic.md`: Deep dive into core software logic, rate limits, sync handlers, and AI context builders.
- `spec.md`: Original and revised product design specification, covering aesthetics, grid templates, and mock-to-real transitions.
- `logs.md`: Overview of the in-memory debugging logs buffer, accessible via the floating help button to trace API and lifecycle failures.
