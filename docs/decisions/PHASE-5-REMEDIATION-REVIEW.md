# Phase 5: Remediation Review & Architecture Remediation

## 1. Executive Verdict
**Verdict:** READY FOR TECHNICAL RE-REVIEW

The architectural revisions performed in the previous cycle have successfully addressed the blocking CRITICAL and HIGH findings from the initial Governance Review. The architecture has shifted from an unsafe in-process local execution model to a safer Subprocess Isolation model (Sidecar), and a Hybrid Provider strategy has resolved the contradictions with the Web build and low-end hardware.

## 2. Repository Baseline
* **Target Branch:** `main`
* **Baseline Commit:** `cf7f613` (Governance Revision Commit)

## 3. Finding-by-Finding Resolution Matrix

| Finding | Previous Severity | Status | Evidence | Remaining Risk |
| :--- | :--- | :--- | :--- | :--- |
| **F-001** (Manifest Authenticity) | CRITICAL | **RESOLVED** | `PHASE-5-MODEL-SUPPLY-CHAIN-REVIEW.md` documents Ed25519 signature validation against a hardcoded public key trust anchor in the Rust binary, followed by SHA-256 integrity checks and atomic renaming. | Key rotation and revocation strategy is currently undefined. If the private key is compromised, a binary update is required to rotate the trust anchor. |
| **F-004** (FFI Isolation Risk) | CRITICAL | **RESOLVED** | `PHASE-5-ARCHITECTURE-DECISION.md` replaces in-process `llama.cpp` bindings with Tauri Sidecar (Subprocess) isolation. | Subprocess isolation reduces the crash blast radius but does not sandbox the process. Malicious models exploiting a `llama.cpp` CVE would still run with user privileges. |
| **F-002** (Native Cancellation) | HIGH | **RESOLVED** | `ADR-007-LOCAL-LLM-RUNTIME.md` replaces cooperative FFI cancellation with deterministic OS-level `SIGTERM`/`SIGKILL` to reap the Sidecar process. | Translating `SIGTERM` semantics robustly to Windows (`TerminateProcess` / `taskkill`) and handling orphaned zombie processes if the Tauri app crashes. |
| **F-003** (Hybrid vs Local) | HIGH | **RESOLVED** | `PHASE-5-RECONCILIATION.md` defines a Hybrid Provider Abstraction. The app uses `LocalProvider` when provisioned, and falls back to `CloudProvider` (Gemini) on Web builds or unsupported hardware. | UI complexity increases to handle fallback states gracefully without confusing the user about their privacy guarantees. |
| **F-005** (Streaming Backpressure) | MEDIUM | **RESOLVED** | `PHASE-5-LOCAL-LLM-SPECIFICATION.md` replaces arbitrary 50ms timers with a bounded token queue / channel capacity limit. | Tuning the exact channel buffer size to prevent Tauri IPC flooding during extremely fast generation on high-end hardware. |
| **F-006** (State Machines) | MEDIUM | **RESOLVED** | `PHASE-5-RECONCILIATION.md` mandates the implementation of explicit terminal and recoverable states for both Model Lifecycle and Generation Lifecycle. | Edge cases around concurrent job submission while the model state is transitioning (e.g., generating while the model is being verified/deleted). |

## 4. Security Assessment
* **Supply Chain:** The Ed25519-signed manifest protects against CDN compromise.
* **Isolation:** The Sidecar architecture prevents `llama.cpp` segmentation faults from crashing the main Tauri application. However, it does **not** provide complete security isolation. A zero-day in `llama.cpp` could still lead to RCE as the local user.

## 5. Architecture Assessment
The shift to a Subprocess Sidecar fundamentally changes the IPC flow. Tauri now acts as a supervisor, reading `stdout` and sending `SIGTERM` for cancellation. This is vastly more stable than unsafe Rust FFI bindings.

## 6. Product Assessment
The definition of "Offline-First" has been correctly scoped to "Provisioned Offline / Local-First". The application remains functional (using CloudProvider) even if the user refuses the 2GB+ model download.

## 7. Freemium Assessment
* **Cloud Inference:** Metered and server-gated.
* **Local Inference:** Intentionally unmetered (costs no API credits) but access to the feature requires an offline JWT license verified locally.
* **Assessment:** The offline JWT enforcement is fundamentally client-side and can theoretically be bypassed by a reverse engineer. This is accepted as a **business decision** (security theater against casual circumvention) rather than a cryptographic guarantee, as local inference costs the business nothing.

## 8. Supply-Chain Assessment
The trust model is well-defined:
1. Fetch `manifest.json`.
2. Verify Ed25519 signature using embedded public key.
3. Download `.gguf` to `.tmp`.
4. Verify SHA-256 against manifest.
5. Atomic rename `.tmp` to `.gguf`.

## 9. QA Assessment
`PHASE-5-TEST-MATRIX.md` has been expanded to explicitly test for OOM boundaries, Ed25519 signature rejection, subprocess cancellation timeouts, and Hybrid fallback flows.

## 10. Documentation Consistency Matrix
| Document | Consistent? | Notes / Required Actions |
| :--- | :--- | :--- |
| `docs/architecture/*` | YES | Subprocess, Hybrid Provider, and Ed25519 defined. |
| `docs/decisions/*` | YES | ADR-007 updated for Subprocess Sidecar. |
| `docs/testing/*` | YES | Matrix updated with new states and tests. |
| `docs/PRD.md` | **NO** | Needs update to reflect "Provisioned Local AI" and Hybrid Provider (Post-Gate). |
| `docs/SDD.md` | **NO** | Needs update to incorporate the Provider Abstraction (Post-Gate). |
| `README.md` | **NO** | Terminology needs correction from strictly "Offline-first" to "Local-First" (Post-Gate). |

## 11. Remaining Risks
* **Hardware Capability Detection:** Dynamic detection of AVX2 / RAM limits at runtime must be robust enough not to crash when querying OS APIs across Windows/macOS/Linux.
* **Anti-Virus Flaggings:** Standard OS protections might quarantine the downloaded `.gguf` or the `llama-cli` executable.

## 12. Required Architectural Spikes
To mitigate the remaining risks before production integration, the following Spikes are strictly required:
* **Spike B:** Process Isolation (Validate Tauri launching, streaming stdout, and SIGTERM cancellation across Windows/macOS/Linux).
* **Spike C:** Model Provisioning (Validate Ed25519 signature check, resumable download, and atomic rename).
* **Spike D:** Hardware Capability (Validate runtime CPU/RAM detection and Hybrid Provider fallback).

## 13. Human Gate Status

**Technical Review Status:** READY FOR TECHNICAL RE-REVIEW
**Implementation Authorization:** NOT GRANTED
**Human Gate:** REQUIRED

> No production implementation was authorized by this stage.
