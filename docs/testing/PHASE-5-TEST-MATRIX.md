# Phase 5: Test Matrix & QA Revision

## 1. Frontend (Vitest / React Testing Library)

| Component / Flow | Test Scenario | Expected Outcome | Type |
| :--- | :--- | :--- | :--- |
| **Model States** | Render UI when status is `MISSING` | Download button visible, AI features fallback to CloudProvider if available. | Unit |
| | Render UI when status is `INCOMPATIBLE` | Tooltip explains hardware limits, AI defaults to CloudProvider. | Unit |
| **Download** | Receive `download-progress` events | Progress bar updates without re-rendering entire app. | Integration |
| **Streaming** | Receive `ai-stream-token` events | Text accumulates with Typewriter effect. | Integration |
| **Cancellation** | User clicks "Stop Generating" | Emits `cancel_job` IPC command, UI resets to IDLE. | Unit |
| **Accessibility** | Focus management during download | Focus is trapped in the download modal (A11y). | Unit |
| | Screen reader announcements | "Gerando resposta..." is announced via `aria-live`. | Unit |

## 2. Backend (Rust / Cargo Test)

| Component | Test Scenario | Expected Outcome | Type |
| :--- | :--- | :--- | :--- |
| **Supply Chain** | Manifest authenticity | Rejects manifest missing Ed25519 signature or invalid signature. | Security |
| | Checksum validation (Valid) | `.tmp` file is renamed to `.gguf` atomically. | Integration |
| | Checksum validation (Invalid) | Deletes `.tmp` file, returns `CORRUPTED` state. | Integration |
| | Disk full during download | Returns `INSUFFICIENT_DISK_SPACE`, leaves `.tmp` for resume. | Integration |
| **Download** | Interrupted download resume | Calculates byte offset and resumes via HTTP Range. | Integration |
| **Inference (Sidecar)**| Worker lifecycle | Subprocess spawns, loads model, emits tokens via `stdout`, and cleans up on `EOF`. | Integration |
| | Corrupted model load | Subprocess crashes, Rust backend catches non-zero exit code gracefully without panicking the Tauri app. | Integration |
| **Cancellation** | Cancellation during loop | Sends `SIGTERM` to subprocess, reaps child process instantly, returns CANCELLED. | Integration |

## 3. Integration & System (Playwright / Tauri WebDriver)

| Scenario | Description | Expected Outcome | Type |
| :--- | :--- | :--- | :--- |
| **Event Correlation** | Emit tokens for `job_1` while UI waits for `job_2` | UI ignores `job_1` tokens, prevents state corruption. | E2E |
| **Race Conditions** | User spams "Generate" and "Cancel" 10 times | Backend prevents concurrent subprocesses; no deadlocks or OOM. | E2E |
| **Renderer Disconnect** | User closes the window during active generation | Tauri `RunEvent::ExitRequested` caught, signals cancellation (`SIGTERM`), reaps child process, exits cleanly. | E2E |
| **OOM Resilience** | Subprocess exceeds memory limit (OOM Killer) | Subprocess killed, backend reports `ERROR` cleanly, app remains alive. | E2E / Fault Injection |
| **Hybrid Fallback** | User declines local download | App seamlessly routes inference payload to Gemini API (CloudProvider). | E2E |
