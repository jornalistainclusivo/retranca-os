# ADR 007: Local LLM Runtime Selection

## Status
Revised (Post-Governance Review)

## Context
The application needs to execute Generative AI capabilities (GGUF format) 100% locally on the user's machine to adhere to strict offline-first and privacy requirements. The runtime must be integrated into a Tauri v2 (Rust) desktop application. A prior review identified critical crash isolation (FFI panic) and cancellation risks with in-process C++ inference.

## Evaluated Options

### Option 1: `candle-core` (Hugging Face)
A minimalist ML framework written entirely in Rust.
*   **Pros:** Pure Rust, memory-safe by default, excellent integration with the Rust ecosystem.
*   **Cons:** GGUF support can be incomplete for newer architectures; hardware acceleration (CUDA/Metal) setup is more complex.

### Option 2: `llama.cpp` (In-Process via FFI)
*   **Pros:** Best-in-class GGUF compatibility, highly optimized memory mapping (mmap).
*   **Cons:** Unsafe FFI boundaries. A malformed GGUF or engine bug causes a segfault that crashes the entire Tauri application. Cooperative cancellation across blocking C++ evaluation loops is difficult to guarantee without specific token callbacks.

### Option 3: `llama.cpp` (Subprocess / Sidecar)
Running `llama.cpp` as a standalone binary or dedicated Rust child process communicating via standard I/O (JSON-RPC or line-delimited JSON).
*   **Pros:** 100% crash isolation. If the engine segfaults or hangs, the main Tauri app remains unaffected. Guaranteed cancellation via OS-level process termination (`SIGTERM`/`SIGKILL`).
*   **Cons:** IPC overhead (negligible for text streaming), requires packaging an additional sidecar executable.

## Decision Criteria
1.  **GGUF Support & Maintenance:** Must support quantization formats (Q4_K_M) flawlessly.
2.  **Platform Support & Acceleration:** Must run on Windows/Mac/Linux.
3.  **Security & Stability:** Must survive malformed models and prevent RCE blast radius from compromising the main app.
4.  **Cancellation:** Must support immediate, deterministic cancellation to free CPU/GPU resources.

## Decision
We will use **`llama.cpp` via Subprocess Isolation (Option 3)**. 
While `llama.cpp` is the superior engine for consumer hardware, embedding it directly into the Tauri process via `unsafe` FFI introduces unacceptable stability and security risks (DoS via segfault). Isolating it in a sidecar guarantees that the UI thread remains unblocked and cancellation is deterministically enforced by terminating the child process.

## Consequences
*   The build pipeline must compile `llama.cpp` as a standalone binary and bundle it using Tauri's Sidecar feature.
*   The main Rust backend will manage child process lifecycles (`std::process::Command`).
*   IPC backpressure will be handled by reading from the child's `stdout` into a bounded channel.
