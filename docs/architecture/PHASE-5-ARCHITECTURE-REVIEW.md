# Phase 5: Architecture Review

## 1. Runtime Selection (Candle vs Llama.cpp)
**Decision:** Llama.cpp (via Rust bindings, e.g., `llama_cpp_rs` or custom `bindgen`)
**Rationale:** While `candle-core` offers a pure-Rust ecosystem, `llama.cpp` provides the most battle-tested GGUF support, optimal memory mapping (mmap), and broader hardware acceleration (Metal, CUDA, Vulkan). For desktop apps targeting heterogeneous hardware, `llama.cpp` handles edge cases (like RAM limits and CPU instruction sets) more gracefully.

## 2. CPU-Bound Execution Model & Tauri Async Runtime
*   **Tauri Main Thread:** Must NEVER block. It handles the WebView event loop and window management.
*   **I/O Tasks (Downloads, File Hashes):** Must run on the Tokio async runtime (`tauri::async_runtime::spawn`), which is optimized for non-blocking I/O.
*   **Inference Tasks (CPU-Bound):** Must run on a dedicated OS thread (`std::thread::spawn`). Tokio's thread pool is not meant for heavy, long-running CPU calculations. Blocking Tokio workers will stall other asynchronous IPC commands.

## 3. Worker Lifecycle & Concurrency
*   **Model Loading:** Loading a 2GB+ model into RAM is slow. The architecture must support maintaining the model context in memory across multiple prompts (warm start) rather than loading it per-request.
*   **Concurrency:** Only ONE generation job can run at a time per model instance to prevent OOM (Out Of Memory) errors. A strict queue (Mutex-protected) must govern access to the model worker.
*   **Backpressure:** Emitting thousands of tokens per second to the WebView can overwhelm the React renderer. The Rust worker will buffer tokens and emit them in chunks (e.g., every 50ms) to reduce IPC overhead and React renders.

## 4. Cancellation Mechanism
*   **Token-based Cancellation:** The IPC `cancel_job(job_id)` command will flip an `Arc<AtomicBool>`.
*   **Worker Check:** The inference loop inside the C++/Rust worker MUST check this atomic flag at every token generation step. If `true`, the loop safely breaks, frees context, and returns a `CANCELLED` status. 
*   **Tauri `listen` Unsubscribing:** Is merely a UI cleanup. True cancellation must stop the CPU work.

## 5. Event Correlation & IPC Contracts
Every asynchronous event emitted to the frontend must carry a unique `job_id` (UUID). Global events like `ai_token` without identifiers cause race conditions if multiple tabs or windows are open.

*   **Contract Design:**
    ```typescript
    interface StreamEvent {
      job_id: string;
      sequence: number; // For ordering guarantee
      chunk: string;
      status: GenerationState;
    }
    ```

## 6. Application Shutdown
The Tauri application lifecycle (`tauri::RunEvent::ExitRequested`) must intercept the shutdown signal, signal the cancellation token to all active workers, and wait (with a short timeout) for threads to join and memory to free safely, preventing zombie processes or corrupted state.
