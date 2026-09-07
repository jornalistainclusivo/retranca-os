# Phase 5: Existing Architecture Reconciliation

## Contradictions Identified & Resolved

### 1. Cloud API vs Local IPC Paradigm
*   **Contradiction:** The current codebase utilizes Next.js Serverless API routes (`app/api/gemini/editorial/route.ts`) to communicate with Google Gemini via stateless HTTP POST requests. However, local inference requires a stateful worker thread, model memory allocation, and asynchronous streaming via Tauri IPC.
*   **Decision:** The Next.js API route will be completely deprecated. The frontend AI adapters will be refactored to invoke Tauri IPC commands (`invoke('infer_prompt')`). This shifts the AI logic from the cloud edge to the local desktop environment.

### 2. Definition of "Offline-First"
*   **Contradiction:** The PRD states the app is "100% offline". However, the local AI requires a 2GB+ model download on first use.
*   **Decision:** The definition of "Offline-First" in the SDD and PRD must be updated. The core application (Kanban, CMS, Governance) remains 100% offline out-of-the-box. The AI module is an *opt-in freemium feature* that requires a one-time onboarding download, after which it becomes permanently offline.

### 3. Cancellation Mechanics
*   **Contradiction:** Cancelling a Gemini HTTP request simply aborts the `fetch` signal. Cancelling a local LLM requires stopping a CPU-bound thread.
*   **Decision:** The architecture will introduce `job_id` correlation and Cancellation Tokens (`Arc<AtomicBool>`) in the Rust backend. The frontend must explicitly call a new IPC command `cancel_job(job_id)` instead of just dropping the UI component.

### 4. State Management
*   **Contradiction:** Current AI UI assumes binary states: `loading` or `success`/`error`. Local LLMs have complex lifecycles (downloading, verifying, loading model into VRAM).
*   **Decision:** The frontend must implement the full Model State Machine (`MISSING`, `DOWNLOADING`, `VERIFYING`, `READY`, etc.) as defined in the Phase 5 Specification, ensuring the UI accurately reflects the granular local status.
