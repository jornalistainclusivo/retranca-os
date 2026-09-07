# Phase 5: Test Matrix

## 1. Frontend (Vitest / React Testing Library)

| Component / Flow | Test Scenario | Expected Outcome |
| :--- | :--- | :--- |
| **Model States** | Render UI when status is `MISSING` | Download button visible, AI features locked. |
| | Render UI when status is `INCOMPATIBLE` | Tooltip explains hardware limits, AI locked. |
| **Download** | Receive `download-progress` events | Progress bar updates without re-rendering entire app. |
| **Streaming** | Receive `ai-stream-token` events | Text accumulates with Typewriter effect. |
| **Cancellation** | User clicks "Stop Generating" | Emits `cancel_job` IPC command, UI resets to IDLE. |
| **Accessibility** | Focus management during download | Focus is trapped in the download modal (A11y). |
| | Screen reader announcements | "Gerando resposta..." is announced via `aria-live`. |

## 2. Backend (Rust / Cargo Test)

| Component | Test Scenario | Expected Outcome |
| :--- | :--- | :--- |
| **Supply Chain** | Manifest validation | Rejects manifest missing fields or incorrect signatures. |
| | Checksum validation (Valid) | `.tmp` file is renamed to `.gguf`. |
| | Checksum validation (Invalid) | Deletes `.tmp` file, returns `CORRUPTED` state. |
| **Download** | Interrupted download resume | Calculates byte offset and resumes via HTTP Range. |
| **Inference** | Worker lifecycle | Thread spawns, loads model, emits tokens, and cleans up. |
| | Corrupted model load | Catches `llama.cpp` initialization error gracefully without panicking the app. |
| **Cancellation** | Cancellation during loop | Checks atomic flag, breaks loop instantly, returns CANCELLED. |

## 3. Integration & System (Playwright / Tauri WebDriver)

| Scenario | Description | Expected Outcome |
| :--- | :--- | :--- |
| **Event Correlation** | Emit tokens for `job_1` while UI waits for `job_2` | UI ignores `job_1` tokens, prevents state corruption. |
| **Race Conditions** | User spams "Generate" and "Cancel" 10 times | Backend Mutex handles queue; no deadlocks or OOM. |
| **Application Close** | User closes the window during active generation | Tauri `RunEvent::ExitRequested` caught, signals cancellation, waits 500ms for thread join, exits cleanly. |
