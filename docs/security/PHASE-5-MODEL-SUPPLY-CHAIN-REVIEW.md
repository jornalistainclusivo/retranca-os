# Phase 5: Model Supply Chain & Security Review

## 1. Supply Chain & Model Trust
The model file (`.gguf`) MUST NOT be trusted simply because it exists in the filesystem. Models can be swapped by malware, corrupted by disk errors, or downloaded incompletely.

### 1.1 Model Manifest
The application will bundle a `model_manifest.json` defining the exact, immutable requirements for the local AI:
```json
{
  "version": "1.0.0",
  "model_id": "jinc-inclusivity-q4_k_m",
  "expected_size_bytes": 2147483648,
  "sha256_checksum": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "source_urls": [
    "https://huggingface.co/jinc/models/resolve/main/model.gguf"
  ],
  "license": "apache-2.0"
}
```

### 1.2 Integrity Verification
1.  **On Download:** The model is downloaded to a `.tmp` file. Once finished, Rust computes the SHA-256 hash. Only if the hash matches the manifest is the file atomically renamed to `.gguf`.
2.  **On Startup/Load:** Before passing the file path to `llama.cpp`, the system verifies the file size. A fast hash check (or a signature verification if implemented) is recommended, though full SHA-256 on a 2GB file per startup is too slow. File size and OS-level file permissions will act as the first line of defense.

## 2. Red Team Risk Assessment

### 2.1 Malicious/Corrupted Model Scenarios
*   **Risk:** `llama.cpp` parsing a malformed `.gguf` file could lead to buffer overflows or arbitrary code execution (ACE).
*   **Mitigation:** Strict SHA-256 validation before the file is ever loaded by the C++ runtime. The Rust wrapper must run in a constrained environment and catch panics where possible.

### 2.2 Path Traversal & Filesystem Handling
*   **Risk:** A malicious frontend payload could attempt to pass `../../windows/system32/secret.gguf` to the `load_model` IPC command.
*   **Mitigation:** The frontend MUST NOT pass file paths to the backend. The backend strictly resolves the model path using Tauri's `app_data_dir()` combined with a hardcoded filename.

### 2.3 Resource Exhaustion (DoS)
*   **Risk:** Spawning multiple inference threads could exhaust system RAM and CPU, freezing the OS.
*   **Mitigation:** A centralized `ModelManager` (Mutex-protected) ensures only one model instance and one inference job exist concurrently. Subsequent requests are QUEUED or REJECTED.

### 2.4 Race Conditions & Event Correlation
*   **Risk:** Emitting generic `generation_done` events could allow an attacker (or a bug) to inject tokens into the wrong UI component.
*   **Mitigation:** Cryptographic UUIDs for every `job_id`. The UI strictly ignores events that do not match the active `job_id`.

## 3. Recovery from Interrupted Downloads
*   HTTP Range requests will be utilized for the download. If the app closes or the network drops, the `.tmp` file remains. 
*   On the next download attempt, Rust checks the `.tmp` file size and resumes the download using the `Range: bytes=X-` HTTP header.
