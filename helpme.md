# MIFECO Hub Help Center & User Manual

Welcome to **MIFECO Hub**, your mission-critical assistant for accelerated project planning and execution. Designed around the principles of the **Hyper-Agile Management Process (HMAP)**, this workspace lets you draft, validate, and track complex projects in record time.

---

## 🧭 System Operations Manual

### 1. Account Settings & Authentication
MIFECO Hub is fully multi-user. All account actions are processed by our secure backend database:
- **Workspace Isolation**: Projects are securely tied to your user ID.
- **Session Persistence**: Closing your tab or browser will not log you out. Your credentials and session state are managed by a local-session token verified against the database.
- **Gemini API Configuration**: To power the AI engines, configure your personal Google Gemini API key on the Landing Page. If your administrator has enabled the promotional internal key, you can toggle it on from the dashboard settings.

### 2. The 7 HMAP Planning Phases
To design a flawless project plan, expand each of the 7 consecutive phases inside the **Project Phases View**:
1. **Concept Proposal**: Initiate the draft with high-level mission ideas.
2. **Feasibility Study & SWOT Analysis**: Determine critical risks, constraints, and success boundaries.
3. **Resources & Skills List (WRS)**: Define the primary technical team profiles and labor rules.
4. **Statement of Work (SOW)**: Lay down precise legal boundaries and client expectations.
5. **Work Breakdown Structure (WBS)**: Deconstruct deliverables into high-level logical groups.
6. **Milestone Plan**: Establish chronological check-points and delivery targets.
7. **Develop Detailed Plans & Timeline**: Initiates a multi-layered parsing operation, analyzing all approved planning documents to construct your interactive tracking database.

*Note: You must edit and mark each document as "Approved" to unlock the subsequent phase card.*

### 3. Execution & Project Tracking
Once Phase 7 completes, your project workspace transitions from Planning to Execution, unlocking these views:
- **Gantt Chart**: Visualizes task durations and sequential dependencies. Blocked tasks (tasks awaiting prerequisite completion) are marked with distinctive red stripe overlays.
- **Kanban Board**: Drag tasks between workflow columns (`To Do`, `In Progress`, `Done`) to instantly synchronize state across the workspace.
- **Workload Map**: A resource scheduling grid highlighting weekly hour distributions for team roles to keep members from being over-allocated.
- **Team Panel**: Manage user profile roles parsed directly from your WRS document. The workspace creator can transfer project ownership here.
- **Milestones View**: Real-time progress bars and budget tracking for all key contract delivery dates.
- **Alert Center**: Click the bell icon in the top header to view unread alerts triggered when preceding tasks are completed and your assigned deliverables become unblocked.

### 4. Revision & Change Control
Safely model the real-world impact of delays, materials price hikes, or scope additions:
1. Navigate to **Revision Control**.
2. Submit a formal **Change Request** or hypothetical **What-If Scenario**.
3. Inspect the **Auto Impact Analysis** matrix to instantly compare differences in project cost, duration, and final delivery dates before merging changes into your active timeline.

---

## 💡 What is HMAP?

The **Hyper-Agile Management Process (HMAP)** is an accelerated engineering planning framework inspired by rapid-prototyping workflows. It minimizes unproductive document-writing overhead by using AI as a highly structured strategic partner:
- **Zero Blank Pages**: AI generates industry-standard drafts instantly, letting managers focus on strategic adjustments rather than writing.
- **Rigorous Consistency**: The system compresses previous decisions into a dense "Compacted Context" block, feeding it into successive AI prompts so that early guidelines carry seamlessly into task breakdowns.
- **Continuous Integration**: When a scope change is approved, the downstream timeline, task list, and workload maps are updated automatically.

---

## 🛠️ Workspace Diagnostics & Log Sync
If you encounter unexpected errors, white screens, or API key issues:
1. Try refreshing your page to force a background reload from the SQLite server.
2. Use the **Download Debug Logs** action below to package your in-memory session traces for technical support.
3. Your workspace is synchronized across all active browser tabs using a real-time `BroadcastChannel` update system.
