# Phase 5: Model Supply Chain & Security Threat Model

## 1. Supply Chain & Model Trust (Authenticity vs Integrity)
The model file (`.gguf`) MUST NOT be trusted simply because it exists in the filesystem or because its SHA-256 matches a manifest. Hashes only prove integrity (resistance to corruption). To prove authenticity (resistance to malicious replacement/MITM), cryptographic signatures are mandatory.

### 1.1 Cryptographic Trust Anchor
1.  **Embedded Public Key:** The Tauri Rust binary will contain a hardcoded Ed25519 public key.
2.  **Signed Manifest:** The application downloads a `manifest.json` which includes a base64-encoded signature of its contents, signed by JINC Apps' private key.
3.  **Validation Chain:**
    *   Rust downloads `manifest.json`.
    *   Rust verifies the signature against the embedded public key. If it fails, abort.
    *   Rust trusts the `sha256_checksum` inside the verified manifest.
    *   Rust downloads the `.gguf` to a `.tmp` file.
    *   Rust hashes the `.tmp` file. If it matches the trusted hash, it atomically renames it to `.gguf`.

```json
{
  "version": "1.0.0",
  "model_id": "jinc-inclusivity-q4_k_m",
  "expected_size_bytes": 2147483648,
  "sha256_checksum": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "source_urls": [
    "https://cdn.jornalistainclusivo.com/models/v1/model.gguf"
  ],
  "signature": "base64_ed25519_signature_here"
}
```

## 2. FFI & Crash Isolation (Sidecar Architecture)
*   **Risk:** `llama.cpp` parsing a malformed or adversarial `.gguf` file can lead to buffer overflows or arbitrary code execution (ACE). In an in-process FFI model, this compromises the main application memory.
*   **Mitigation:** `llama.cpp` will run isolated as a Subprocess (Tauri Sidecar). The main Tauri process interacts with it only via strict `stdio` IPC. A crash in the inference engine terminates the child process but leaves the main Tauri application and UI fully intact and able to recover.

## 3. Red Team Risk Assessment

### 3.1 Path Traversal & Filesystem Handling
*   **Risk:** A malicious frontend payload could attempt to pass `../../windows/system32/secret.gguf` to the `load_model` IPC command.
*   **Mitigation:** The frontend MUST NOT pass file paths to the backend. The backend strictly resolves the model path using Tauri's `app_data_dir()` combined with a hardcoded filename.

### 3.2 Resource Exhaustion (DoS)
*   **Risk:** Spawning multiple inference subprocesses could exhaust system RAM and CPU, freezing the OS.
*   **Mitigation:** The Rust backend enforces a singleton child process. Concurrent requests are rejected with `BUSY`.

### 3.3 Freemium Security (Entitlement Enforcement)
*   **Risk:** Local inference executes on the client, removing the ability to enforce Cloud API limits. Clients could bypass UI constraints to use the Local AI indefinitely for free.
*   **Mitigation:** Entitlement is inherently bifurcated. Cloud API (Gemini) usage is metered and gated server-side. Local AI usage is unmetered by definition (costs no API credits), but access to the local feature requires a valid offline JWT license embedded at login.

## 4. Recovery from Interrupted Downloads
*   HTTP Range requests will be utilized for the download. If the app closes or the network drops, the `.tmp` file remains. 
*   On the next download attempt, Rust checks the `.tmp` file size and resumes the download using the `Range: bytes=X-` HTTP header.
*   If a `.tmp` file is older than 24 hours or throws a hash mismatch upon completion, it is deleted and the download restarts.
