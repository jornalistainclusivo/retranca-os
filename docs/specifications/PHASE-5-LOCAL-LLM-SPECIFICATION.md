# Phase 5: Hybrid AI & Local LLM Specification

## 1. Provider Abstraction (Hybrid Strategy)
The application will utilize an AI Provider Abstraction to dynamically switch between **Cloud AI** (Gemini) and **Local AI** (`llama.cpp` subprocess) based on platform, hardware capability, user consent, and Freemium tier.

*   **CloudProvider (Gemini):** Used in web builds, on incompatible hardware, or before the user consents to the local model download. Metered and gated by server-side Freemium limits.
*   **LocalProvider (Tauri Sidecar):** Used when running the desktop app, assuming hardware compatibility and model provisioning. Operation is unmetered but requires an embedded offline license for access.

## 2. Offline-First Semantics (Refined)
The Core Application (Kanban, CMS, Governance) remains strictly offline-first. The AI Module is now designated as **Provisioned Offline**.
1. It defaults to the CloudProvider.
2. The user is prompted to download the model for privacy and unlimited local usage.
3. Upon successful provisioning (download + signature validation), the Provider switches to LocalProvider, at which point the AI becomes fully offline.

## 3. Model Lifecycle State Machine
The Model Manager tracks the following states for provisioning:

*   `MISSING`: No model file exists.
*   `PREFLIGHT`: Checking disk space and network reachability.
*   `DOWNLOADING`: Active download in progress.
*   `PAUSED`: Download manually paused or interrupted by network.
*   `VERIFYING`: Validating Ed25519 signature on manifest and SHA-256 on `.tmp` file.
*   `INSTALLING`: Atomically renaming `.tmp` to `.gguf`.
*   `READY`: Model matches manifest and is ready for inference.
*   `CORRUPTED`: Hash mismatch or signature failure. `.tmp` deleted.
*   `OUTDATED`: Manifest requires a newer version of the model.
*   `INCOMPATIBLE`: Hardware lacks required instruction sets.
*   `INSUFFICIENT_DISK_SPACE`: Less than required space available.
*   `NETWORK_INTERRUPTED`: Download dropped unexpectedly.
*   `PERMISSION_DENIED`: OS blocked writing to AppData.
*   `FAILED`: Fatal unrecoverable error.

## 4. Generation State Machine
For a specific `job_id`, the generation lifecycle follows:

*   `IDLE`: Inference subprocess is dormant or unspawned.
*   `QUEUED`: Job received, waiting for subprocess startup.
*   `LOADING_MODEL`: Subprocess is mapping the GGUF into RAM.
*   `GENERATING`: Subprocess is actively emitting tokens to `stdout`.
*   `CANCELLING`: User requested cancellation. Sending `SIGTERM` to subprocess.
*   `CANCELLED`: Subprocess successfully terminated.
*   `COMPLETED`: Generation finished and `EOF` received.
*   `ERROR`: Subprocess crashed (e.g., OOM, segfault).

## 5. Backpressure & IPC IPC Streaming
The Tauri backend reads tokens from the subprocess `stdout`. Instead of arbitrary timing constants (e.g., 50ms):
*   **Buffer Limit:** The Rust backend buffers up to `MAX_TOKENS = 10`.
*   **Flush:** Once the buffer hits 10 tokens, it flushes an IPC event to the frontend.
*   **Terminal Flush:** If `EOF` or a newline is reached, the buffer flushes immediately regardless of token count.
*   **Renderer Backpressure:** If the frontend IPC channel is saturated, older events for the same `job_id` are dropped or coalesced to prevent OOM in the WebView.

## 6. Hardware Capability Validation
Hardware requirements are guidelines to trigger the Cloud fallback, not hard crashes:
1.  **RAM Check:** Heuristic check for >8GB total RAM. If <8GB, warn user of potential system freezing, but allow attempt (or fallback to Cloud).
2.  **CPU Check:** Rust `std::arch` checks for AVX2/NEON. If missing, silently default to CloudProvider.
3.  **Disk Check:** Hard requirement. If `free_space < (model_size * 2)`, block download and emit `INSUFFICIENT_DISK_SPACE`.
