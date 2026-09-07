# Phase 5: Existing Architecture Reconciliation

## Contradictions Identified & Resolved

### 1. Cloud API vs Local IPC Paradigm
*   **Contradiction:** The current codebase utilizes Next.js Serverless API routes (`app/api/gemini/editorial/route.ts`) to communicate with Google Gemini via stateless HTTP POST requests. Previously, Phase 5 proposed deprecating this entirely, which would break the Web build and low-end hardware.
*   **Decision:** We will adopt a **Hybrid AI Strategy (Provider Abstraction)**. The Gemini API route will **not** be deprecated. The frontend AI adapters will be refactored to support dependency injection: invoking Tauri IPC commands (`invoke('infer_prompt')`) when in the Desktop environment with a downloaded model, and falling back to standard `fetch` when in the Web environment or if the user declines the local download.

### 2. Definition of "Offline-First"
*   **Contradiction:** The PRD states the app is "100% offline". However, the local AI requires a 2GB+ model download on first use.
*   **Decision:** The terminology in the PRD and SDD must be updated. The core application (Kanban, CMS, Governance) remains 100% offline out-of-the-box. The AI module is a **Provisioned Offline** feature that requires a one-time download (and signature validation) before operating entirely locally.

### 3. Cancellation Mechanics
*   **Contradiction:** Cancelling a Gemini HTTP request simply aborts the `fetch` signal. Cancelling an in-process local LLM requires stopping a CPU-bound C++ FFI thread, which is unsafe and blocking.
*   **Decision:** Local AI will execute in a **Subprocess (Tauri Sidecar)**. The frontend explicitly calls `cancel_job(job_id)`. The Rust backend then issues a `SIGTERM` to the child process, guaranteeing immediate and safe resource cleanup without blocking the Tauri main thread or risking an FFI panic.

### 4. Freemium Entitlements
*   **Contradiction:** Freemium AI access currently relies on server-side limits enforced via the Gemini API. A purely local LLM runs on the client, making server-side metering impossible without ruining offline capability.
*   **Decision:** Entitlements will be split. CloudProvider (Gemini) usage remains metered and gated server-side. LocalProvider usage is unmetered (costs no API credits) but access to the feature itself requires an offline JWT license verified locally at login.

### 5. State Management
*   **Contradiction:** Current AI UI assumes binary states: `loading` or `success`/`error`. Local LLMs have complex lifecycles (downloading, verifying, loading model into VRAM).
*   **Decision:** The frontend must implement the full Model State Machine (`MISSING`, `DOWNLOADING`, `VERIFYING`, `READY`, etc.) to accurately reflect granular local status, while keeping the UI unified regardless of the underlying Provider.
