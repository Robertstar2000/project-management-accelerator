
# HMAP Application Logs

This file serves as a reference for the in-memory logging system implemented in the application.

## Debugging Instructions

The application now includes a robust in-memory logging buffer to trace state updates, API calls, and component lifecycles. This is designed to diagnose the "white screen" or "overlay" issues reported during AI operations.

### How to Access Logs

1.  Open the application.
2.  Click the floating `?` button in the bottom right corner to open the **Help Modal**.
3.  Click the **"Download Debug Logs (logs.md)"** button at the bottom of the modal.
4.  A `.md` file containing the session's logs will be downloaded to your device.

### Log Format

Each log entry follows this structure:
`- **[Timestamp]** `Action` @ *Element*: { details }`

### Key Trace Areas

The following critical paths have been instrumented:

-   **App.tsx**:
    -   `reloadStateFromStorage`: Logs when the app attempts to sync from `localStorage`.
    -   `saveProjectsToStorage`: Logs when data is persisted.
    -   `isInternalUpdate`: Logs when a sync event is ignored because it originated from the current tab (preventing loops).

-   **ProjectDashboard.tsx**:
    -   `Mount/Unmount`: Logs when the dashboard component is created or destroyed. Frequent unmounts indicate a `key` prop issue or parent state instability.
    -   `handleGenerateContent`: Logs the start, progress (step), and completion of AI generation tasks.
    -   `handleSave`: Logs attempts to save project data, noting if the component was unmounted during the process.

### Common Issues Diagnosed

-   **Infinite Loops**: If `reloadStateFromStorage` triggers `saveProjectsToStorage`, which triggers `reload...`, the logs will show a rapid cascade of these events.
-   **Unmount during Async**: If `handleGenerateContent` logs "Start" but never "Success" or "Error", and an `Unmount` log appears in between, the component is being destroyed prematurely (likely due to a key change in `App.tsx`).
-   **Empty AI Responses**: Logs will capture specific error messages if the AI returns empty strings or fails.
