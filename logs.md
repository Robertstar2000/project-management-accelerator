# MIFECO Hub System & Debugging Logs

This document serves as a reference for the diagnostic, in-memory logging system implemented in the application. It captures critical events, asynchronous pipelines, and background database synchronizations to help diagnose system latency, rate limits, or rendering issues.

---

## 🧭 How to Retrieve logs

If you encounter unexpected errors, network exceptions, or empty AI generation fields during operations:
1. Locate the floating `?` support button in the bottom right corner of the workspace.
2. Click to reveal the **Mission Support** (Help Modal) overlay.
3. Click the amber **"Download Debug Logs"** action button in the footer.
4. A standard Markdown log file (`logs.md`) will automatically download to your local machine, capturing all system traces recorded since your session started.

---

## 🛠️ Traced Systems & Events

The in-memory logger actively monitors these core functional areas:

### A. Authentication & Session Management (`App.tsx`)
- `Auth`: Records registration (`/api/auth/signup`) and session initialization (`/api/auth/login`).
- `Sync`: Logs the status of tab reloading, identifying whether local updates or external changes prompted a database refresh.

### B. Remote Synchronization & Persistence (`storage.ts`)
- `Storage`: Captures database-saving queries and updates pushed to `/api/projects`.
- `Remote Changes`: Tracks the polling engine status every 10 seconds, logging incoming record sizes to ensure background changes are merged smoothly.

### C. Gemini AI Client Pipelines (`ProjectDashboard.tsx` / `geminiClient.ts`)
- `AI Start`: Captures when an AI-prompt compilation begins, detailing the relevant context items parsed.
- `AI Compaction`: Traces the background compression routines (`PROMPTS.compactContent`) that condense completed templates to save API tokens.
- `AI Retry`: Logs rate-limit errors (HTTP 429) or transient timeouts, tracking exponential backoff retry counts (up to 2 iterations).

### D. Layout Lifecycle Tracing
- `Mount/Unmount`: Tracks component instantiations. Frequent unmounting suggests state volatility or key-prop collisions in the routing tree.
- `Parsing Errors`: Logs any structural exceptions encountered by the Markdown table extractor during Phase 7 conversions.

---

## 📝 Diagnostic Format

Log entries are captured in a structured stream:
```markdown
- **[Timestamp]** `Action/Module` @ *Component*: { details }
```

### Common Debug Scenarios
- **Polling Conflict**: High frequency of overlapping reads suggests polling triggers are active during heavy user-editing blocks.
- **Empty AI Responses**: Log blocks capture exact HTTP error states or empty string returns from the Google Gemini API to pinpoint invalid API keys or token limits.
