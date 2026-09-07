# ADR 007: Local LLM Runtime Selection

## Status
Proposed

## Context
The application needs to execute Generative AI capabilities (GGUF format) 100% locally on the user's machine to adhere to strict offline-first and privacy requirements. The runtime must be integrated into a Tauri v2 (Rust) desktop application.

## Evaluated Options

### Option 1: `candle-core` (Hugging Face)
A minimalist ML framework written entirely in Rust.
*   **Pros:** Pure Rust (no C++ toolchain requirements for compilation), memory-safe by default, excellent integration with the Rust ecosystem.
*   **Cons:** GGUF support can be incomplete for newer architectures; hardware acceleration (CUDA/Metal) setup is more complex and less universally distributed out-of-the-box compared to C++ counterparts.

### Option 2: `llama.cpp` (via `llama_cpp_rs` bindings)
The industry standard C++ inference engine for GGUF models.
*   **Pros:** Best-in-class GGUF compatibility, highly optimized memory mapping (mmap), automatic fallback to CPU if GPU acceleration fails, broad hardware acceleration (Metal, Vulkan, CUDA).
*   **Cons:** Requires C++ toolchains during the build process; relies on FFI (Foreign Function Interface) which introduces potential unsafe blocks in Rust.

## Decision Criteria
1.  **GGUF Support & Maintenance:** Must support quantization formats (Q4_K_M) flawlessly.
2.  **Platform Support & Acceleration:** Must run on Windows/Mac/Linux with graceful fallback from GPU to CPU.
3.  **Integration Complexity:** Ability to bundle within a Tauri app.
4.  **Cancellation & Streaming:** Must support granular cancellation at the token generation level.

## Decision
We will use **`llama.cpp` (Option 2)**. 
Despite the compilation overhead of C++, `llama.cpp`'s maturity in handling edge-case hardware (crucial for consumer desktop apps), its robust memory mapping, and its superior token-level control make it the most viable engine for a production-grade local AI assistant.

## Consequences
*   The CI/CD pipeline must be updated to include C++ build tools (CMake, MSVC/Clang).
*   Rust code interacting with the engine will require `unsafe` blocks, which must be strictly isolated and reviewed.
*   We must implement our own thread management to ensure `llama.cpp` does not block the Tauri async runtime.
