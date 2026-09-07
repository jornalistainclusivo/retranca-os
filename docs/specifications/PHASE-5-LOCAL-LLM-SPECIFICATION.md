# Phase 5: Local LLM Specification

## 1. Offline-First Semantics
The Jornalista Inclusivo OS remains fundamentally **offline-first**.
*   **Core App:** The Kanban, CMS, and Governance modules require zero internet connection at any point.
*   **AI Module (Freemium):** The AI feature requires a one-time onboarding download of the model (`.gguf`). Once downloaded, the AI module becomes permanently offline-first. The application is fully usable without the AI model.

## 2. Model Lifecycle State Machine
Instead of a simple boolean check, the UI and Backend will synchronize around a typed model state:

*   `MISSING`: No model file exists, or the existing file size is zero.
*   `DOWNLOADING`: An active download is transferring bytes.
*   `VERIFYING`: Download complete; calculating SHA-256 checksum.
*   `READY`: Model matches manifest and is ready for inference.
*   `CORRUPTED`: Checksum mismatch. File must be deleted.
*   `INCOMPATIBLE`: Hardware lacks basic instructions (e.g., AVX2) to run the model.
*   `FAILED`: Network error during download.
*   `OUTDATED`: Manifest requires a newer version of the model.

**Transitions:**
`MISSING` -> (User Clicks Download) -> `DOWNLOADING` -> (Complete) -> `VERIFYING` -> (Match) -> `READY`

## 3. Generation State Machine
For a specific `job_id`, the generation lifecycle follows:

*   `IDLE`: Worker thread is asleep.
*   `QUEUED`: Job received, waiting for previous job to finish or model to load into RAM.
*   `LOADING_MODEL`: First-time mapping of the model into RAM (mmap).
*   `GENERATING`: Actively emitting tokens.
*   `COMPLETED`: Generation finished successfully.
*   `CANCELLING`: Cancellation requested, waiting for worker to break the loop.
*   `CANCELLED`: Worker successfully aborted the job.
*   `ERROR`: Inference failed (e.g., context window exceeded, OOM).

## 4. Hardware Capability Validation
Before attempting to download a 2GB+ model, the application will perform pre-flight checks:
1.  **Disk Space:** Ensure at least `model_size * 2` is available on the target drive (for `.tmp` and final file).
2.  **RAM:** Ensure the system has at least 8GB of total RAM.
3.  **CPU Architecture:** Verify AVX2 support (or equivalent on ARM) via Rust `std::arch`.
If capabilities are unmet, the UI will disable the AI features with an informative tooltip preventing download.

## 5. First-Run Experience & UX
*   When a user clicks an AI tool (e.g., "Otimização SEO"), if state is `MISSING`, a modal intercepts the action.
*   The modal displays disk requirements and requests permission to download.
*   Progress is shown via a deterministic progress bar (using HTTP Content-Length).
*   The user can pause/cancel the download (saving the `.tmp` file for later resumption).
