# Phase 5: Human Gate & Architectural Spikes Authorization

## 1. Executive Decision
**GOVERNANCE VERDICT:** READY FOR HUMAN GATE

The Phase 5 architectural package (Local LLM via Tauri Sidecar + Hybrid Provider) has been rigorously reviewed. The proposed architecture replaces unsafe FFI bindings with Subprocess Isolation, implements Ed25519 model supply-chain authenticity, and provides a CloudProvider (Gemini) fallback for unsupported devices or Web clients. The technical specification is mature enough for a human decision.

## 2. Repository Baseline
* **Target Branch:** `main`
* **Commit:** `cf7f613`
* **Architecture Packages:** `PHASE-5-ARCHITECTURE-DECISION.md`, `ADR-007-LOCAL-LLM-RUNTIME.md`, `PHASE-5-MODEL-SUPPLY-CHAIN-REVIEW.md`, `PHASE-5-LOCAL-LLM-SPECIFICATION.md`

## 3. Current Architecture Summary
* **Provider Abstraction (Hybrid):** The frontend will route requests to either `CloudProvider` (Gemini API) or `LocalProvider` (Local LLM), preserving Web build compatibility.
* **Sidecar Isolation:** Local inference utilizes a spawned C++ `llama.cpp` subprocess rather than an in-memory Rust FFI binding, isolating the Tauri main thread from GGUF parsing segmentation faults.
* **Model Provisioning:** Models are discovered via an Ed25519-signed manifest, downloaded locally, hash-verified, and atomic-renamed into the App Data Directory.
* **Entitlements:** Cloud inference is metered via the backend; local inference is unmetered but gated via an offline JWT license (Freemium feature).

## 4. Decisions Already Resolved
* **FFI Crash Risk:** Eliminated via Subprocess isolation.
* **Cancellation Reliability:** Eliminated blocking FFI calls. Cancellation now utilizes OS-level `SIGTERM`/`SIGKILL` to cleanly reap the sidecar process.
* **Supply-Chain Attacks:** Prevented by enforcing an embedded Ed25519 public key that verifies the downloaded manifest before downloading the model.
* **Backpressure IPC Flooding:** Replaced arbitrary timing with a bounded channel capacity (10 tokens or `\n`) to prevent Tauri event queue saturation.
* **Web Breakage:** Reverted purely local design in favor of the Hybrid Provider Abstraction.

## 5. Remaining Risks
* **Anti-Virus False Positives:** Sidecar executables (`llama-cli.exe` or macOS equivalent) or large `.gguf` payloads downloaded at runtime might trigger Windows Defender or macOS Gatekeeper.
* **Process Zombies:** Improper handling of Tauri's `RunEvent::ExitRequested` could orphan the `llama.cpp` subprocess if the app is force-closed.
* **OOM Killer:** Large models on 8GB machines might trigger OS out-of-memory killers for the sidecar process; the Rust backend must gracefully handle unexpected `EOF`/exit codes.

## 6. Product Implications
* The application remains "Local-First" but AI is explicitly "Provisioned Offline" (requires one-time model download).
* Users who decline the download or use incompatible hardware will default to the CloudProvider (Gemini), maintaining access but consuming server quotas.
* The Freemium model is logically split: Cloud AI = Metered, Local AI = Unmetered but requires license verification. This is a deliberate business strategy, acknowledging that strong client-side DRM for a local binary is mostly security theater against determined attackers, but sufficient for standard consumers.

## 7. Security Implications
* **Subprocess Security:** `llama.cpp` will run with standard user privileges. It reduces the crash blast radius (Tauri won't crash) but does not provide a strict sandbox against malicious model exploitation.
* **Authenticity:** The trust anchor is the embedded Ed25519 public key in the Rust binary. Compromise of the CDN alone is insufficient to serve malicious models.

## 8. Cross-Platform Implications
* **Cancellation:** `SIGTERM` on Linux/macOS works gracefully. On Windows, `taskkill` or `TerminateProcess` may be required for equivalent behavior. This will be validated in Spike B.

## 9. Required Spikes
Before committing to full production implementation, the following Architectural Spikes must be executed and approved.

### Spike B: Process Isolation
Prove that Tauri can reliably spawn `llama-cli`, stream JSON over `stdout` using a bounded queue, and gracefully reap the process via `SIGTERM` / `TerminateProcess` on user cancellation or app exit.

### Spike C: Model Provisioning
Prove that the Rust backend can securely fetch a manifest, verify its Ed25519 signature against a hardcoded public key, download a large file with resume capability, verify its SHA-256 hash, and atomically rename it.

### Spike D: Hardware Capability
Prove that the application can dynamically detect available RAM and AVX2 support at runtime, accurately selecting the default Provider without panicking.

## 10. Spike Acceptance Criteria
Each Spike must produce a measurable report outlining the environment, hypothesis, and actual observed behavior. Production integration cannot begin until all three Spikes pass.

## 11. Explicit Implementation Boundary
> **NO PRODUCTION IMPLEMENTATION WAS AUTHORIZED BY THIS STAGE.**
This document validates the theoretical architecture. Moving beyond this document requires explicit Human Authorization for the Spikes.

## 12. Human Authorization Section

> **Human Gate Required:** YES
> **Implementation Authorization:** NOT GRANTED

---
*Signed: DevOps / Architecture Governance Board (Simulated)*
