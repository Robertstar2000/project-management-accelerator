# Application Specification: MIFECO Hub & HMAP Companion

## 1. Objective & Product Scope
Recreate and maintain a high-fidelity, full-stack project accelerator workspace named **MIFECO Hub** that unifies the aesthetic and security requirements of a premium corporate workspace with the rapid, automated planning power of the **Hyper-Agile Management Process (HMAP)**.

The system replaces manual project planning documentation with secure, AI-powered generation modules, compiling text proposals directly into interactive task boards, timelines, resource calendars, and change simulators.

---

## 2. Aesthetic & Visual Identity (The "MIFECO" Style)

All UI elements must adhere to a premium, dark-mode **"Technical/Cyberpunk"** design philosophy. High contrast, generous negative space, and typographic hierarchies are used to convey extreme professional craftsmanship.

### A. Color Palette
- **Primary Canvas Background**: Deep Slate (`#0f172a` to `#020617` via subtle linear or radial gradients).
- **Primary Text**: Ice White (`#f8fafc`).
- **Secondary Text**: Muted Slate (`#94a3b8`).
- **Borders & Dividers**: Dark Slate (`rgba(255, 255, 255, 0.08)` or `#1e293b`).
- **Accents & Glows**:
  - **MIFECO Rainbow Gradient**: Left-to-right neon spectrum (`#00f2ff` to `#ff00ff`) applied to branding titles and display tags.
  - **Neon Cyan**: Active elements, selected tabs, and focus outlines (`#00f2ff`).
  - **Neon Pink**: Important primary triggers, button highlights, and special indicators (`#ff00ff`).
  - **Status States**: Emerald/Green (`#10b981`) for completed/approved, Amber/Yellow (`#f59e0b`) for working, and Rose/Red (`#ef4444`) for blocked/rejected items.

### B. Glassmorphism & UI Accents
- Cards are styled as semi-transparent panels (`background: rgba(30, 41, 59, 0.6)`) bounded by thin borders (`border: 1px solid rgba(255, 255, 255, 0.08)`) with heavy backdrop blur filters (`backdrop-filter: blur(20px)`).
- Buttons use high-contrast outlines or full solid blocks with clean scale transitions on cursor hover (`transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)`).

### C. Typography
- **Display Headings**: 'Space Grotesk' (Bold, heavy tracking-tighter, uppercase).
- **Core UI & Body**: 'Inter' (Regular/Medium).
- **Technical & Monospace Accents**: 'JetBrains Mono' (For IDs, parameters, dates, and versioning tags).

---

## 3. Page Structure & Component Hierarchy

The application layout shifts fluidly between two primary modes:
1. **Unauthenticated Auth Console** (`AuthView.tsx`)
2. **Mission Control Dashboard** (`LandingPage.tsx` and `ProjectDashboard.tsx`)

### Phase A: Authentication View (`AuthView.tsx`)
A split layout that adapts fluidly across responsive breakpoints (stacked on mobile, 50/50 horizontal on desktop):
- **Left Side (HMAP Standard Showcase)**:
  - Large rainbow gradient header "MIFECO".
  - Subtext: "Project Acceleration Protocol".
  - 5 high-contrast feature blocks numbered "01" through "05" with colored neon labels.
- **Right Side (Secure Auth Entry)**:
  - Centered glass card containing active "Sign In" or "Sign Up" tabs.
  - High-density form inputs with neon focus glow states.
  - Standard action buttons with bold text.
  - Version footer in monospace display: `MIFECO © 2026 V4.03`.

### Phase B: Mission Control Landing Page (`LandingPage.tsx`)
Once authenticated, the main viewport renders the user's active portal:
- **Welcome Title**: Custom welcome card addressing the user by name with a gradient accent.
- **Grid Layout**: 2-column bento box:
  - **Active Projects Card**: Displays the total count of active workspaces, with an "OPEN DATABASE" button that reveals the user's projects.
  - **Initiate Protocol Card**: Bounded by a Neon Pink border, this launches the New Project wizard.
- **AI Engine Configuration**: A dedicated password-masked input where users register their Gemini API keys, syncable with the backend user record.

### Phase C: Primary Project Dashboard (`ProjectDashboard.tsx`)
The workspace for an active project, featuring the following tabs:
1. **Planning Phases (HMAP Workflows)**: Chronologically gated list of the 7 HMAP phases (Concept, SWOT, Resources, SOW, WBS, Milestones, Plans). Users generate text blocks using Gemini, make manual edits, and approve them.
2. **Project Tracking (Gantt, Kanban, Workload, Milestones, Team)**: Unlocks only when planning is complete. Uses natural-language parsing routines to populate the interactive database tables.
3. **Documents Center**: Manages official deliverables, export functions (ZIP downloads), and advanced AI simulation prompts.
4. **Revision Control (What-If Analysis)**: Simulates schedule and cost fluctuations across multiple scenarios side-by-side.

---

## 4. Key Functional Rules & Backend Integration

### A. Full-Stack Data Handshake
- **SQLite Storage**: All user records and project states are written directly to a standalone database file (`database.sqlite`).
- **Bcrypt Security**: All authentication passwords are encrypted using strong bcrypt hashing on the server side.
- **Polling Synchronization**: Active clients poll `/api/projects` every 10 seconds to pull down database changes from other tabs or devices.
- **BroadcastChannel**: Browser-level state syncing coordinates real-time updates across multiple open browser tabs.

### B. Natural Language parsing (Phase 7 Generation)
The transition from planning text into interactive tracker nodes relies on strict Markdown processing:
- The engine scans the approved "Detailed Plans (WBS/WRS)" document for tables.
- It parses headers, tasks, roles, relative start times, and durations.
- It automatically maps prerequisites to unique IDs and marks tasks whose preceding criteria are incomplete as blocked.

### C. Change Request Impact Logic
- baseline values (duration, budget) are stored as constants.
- Change requests introduce delta multipliers.
- The system computes new completion dates and resource costs on-the-fly, displaying them inside an impact comparison table.
