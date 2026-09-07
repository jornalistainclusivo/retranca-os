# PHASE 5 GOVERNANCE REVIEW

## Executive Verdict
`NEEDS REVISION`

## 1. Repository Baseline
* **Commit SHA:** `77ffa9a`
* **Branch:** `main`
* **Relevant Baseline Documents:** `README.md`, `docs/PRD.md`, `docs/SDD.md`, `docs/TSD.md`, `CHANGELOG.md`
* **Relevant Implementation Areas:** `app/api/gemini/editorial/route.ts`, `components/AiAssistantModal.tsx`, `components/ArticleModal.tsx`, `docs/specs/core-platform/spec.openapi.yaml`

## 2. Findings

### F-001: Confusion between Integrity and Authenticity
* **Severity:** CRITICAL
* **Category:** Security
* **Affected Document:** `docs/security/PHASE-5-MODEL-SUPPLY-CHAIN-REVIEW.md`
* **Finding:** The security model relies on SHA-256 hashes to validate the downloaded GGUF file. However, without a cryptographic signature (authenticity) on the manifest itself (verified against a hardcoded public key), a Man-in-the-Middle (MITM) attack or compromised CDN could swap both the model and the hash.
* **Evidence:** The documentation specifies SHA-256 checksums but lacks a PKI/signature strategy.
* **Consequence:** Malicious actors could distribute backdoored GGUF models leading to RCE via FFI vulnerabilities in `llama.cpp`.
* **Required Action:** Introduce cryptographic signature verification for the manifest file.

### F-002: Inadequate Cancellation Guarantee over FFI
* **Severity:** HIGH
* **Category:** Architecture
* **Affected Document:** `docs/architecture/PHASE-5-ARCHITECTURE-REVIEW.md`, `ADR-007-LOCAL-LLM-RUNTIME.md`
* **Finding:** The proposal uses an `Arc<AtomicBool>` in Rust to signal cancellation. However, `llama.cpp` inference is a blocking C++ FFI call. Unless the specific Rust binding exposes a mechanism to pass an interrupt token *into* the C++ evaluation loop, the thread will block until the FFI call returns.
* **Evidence:** ADR-007 selects `llama.cpp` but does not prove the Rust bindings support cooperative cancellation mid-generation.
* **Consequence:** "Cancel" UI button will not halt CPU/GPU usage immediately, leading to resource exhaustion, locked models, and broken UX.
* **Required Action:** Prove or mandate that the chosen `llama.cpp` Rust binding supports native cancellation callbacks.

### F-003: Deprecation of Gemini API breaks Web Fallback
* **Severity:** HIGH
* **Category:** Product / Architecture
* **Affected Document:** `docs/decisions/PHASE-5-RECONCILIATION.md`, `app/api/gemini/editorial/route.ts`
* **Finding:** Phase 5 proposes "completely deprecating" the Next.js API route (`/api/gemini/editorial`). However, if the frontend is served as a web app (outside Tauri), or if the user refuses the multi-GB local model download, there is no AI fallback.
* **Evidence:** Current Next.js components (`AiAssistantModal.tsx`) use standard HTTP `fetch`. Replacing this completely with Tauri IPC breaks the web build and leaves lower-end devices without AI.
* **Consequence:** Product regression for users unable to run local models (e.g., insufficient RAM, web-only access).
* **Required Action:** Define a Hybrid strategy (Local LLM via IPC when in Tauri, fallback to Gemini API when in web/unsupported hardware).

### F-004: FFI Panic and Isolation Risks
* **Severity:** CRITICAL
* **Category:** Security / Architecture
* **Affected Document:** `ADR-007-LOCAL-LLM-RUNTIME.md`
* **Finding:** `llama.cpp` parsing a malformed GGUF file can segfault. Because it runs in the same process space as the Tauri backend via `unsafe` Rust FFI, a segfault crashes the entire application.
* **Evidence:** The security doc treats "checksum validation" as the main mitigation, ignoring that bugs in `llama.cpp` itself can cause memory corruption.
* **Consequence:** Denial of Service and potential arbitrary code execution.
* **Required Action:** Detail isolation strategies (e.g., running inference in a separate child process rather than a thread) or explicitly accept the crash risk.

### F-005: Arbitrary Backpressure Parameters
* **Severity:** MEDIUM
* **Category:** Architecture
* **Affected Document:** `docs/specifications/PHASE-5-LOCAL-LLM-SPECIFICATION.md`
* **Finding:** IPC chunking is specified at arbitrary time intervals (e.g., 50ms) rather than being bounded by token counts, max payload sizes, or actual renderer backpressure logic.
* **Evidence:** Streaming specs mandate a 50ms buffer.
* **Consequence:** Suboptimal streaming on slow hardware (empty chunks) or fast hardware (too large chunks).
* **Required Action:** Specify buffer limits based on token accumulation and channel capacity.

### F-006: Incomplete State Machines
* **Severity:** MEDIUM
* **Category:** Architecture
* **Affected Document:** `docs/specifications/PHASE-5-LOCAL-LLM-SPECIFICATION.md`
* **Finding:** Missing critical download states (e.g., `INSUFFICIENT_DISK_SPACE`, `NETWORK_DISCONNECTED`, `CANCELED_BY_USER`).
* **Evidence:** State machine definitions in the spec do not account for physical device failures.
* **Consequence:** The UI could hang indefinitely or fail ungracefully during edge cases.
* **Required Action:** Expand the Download and Generation state machines.

## 3. Contradiction Matrix

| Source A | Source B | Conflict | Severity | Required Decision / Amendment |
|----------|----------|----------|----------|-------------------------------|
| `docs/PRD.md` (Assistente IA Opcional via Gemini) | Phase 5 Docs (Deprecate Gemini) | PRD implies cloud AI is the baseline; Phase 5 eliminates it entirely, stranding low-end devices. | HIGH | Decide if Retranca is *Local Only* or *Hybrid* for AI. Update PRD/SDD. |
| `docs/SDD.md` (Camada Freemium) | Phase 5 Specs (Local LLM) | Freemium logic for AI relies on server-side validation. Local IPC bypasses backend enforcement. | HIGH | Define how local model usage is metered or gated for Free tier users. |
| `app/api/gemini/editorial` | Phase 5 Specifications | Current codebase relies on stateless HTTP POST. Phase 5 requires stateful Tauri IPC. | MEDIUM | Refactor frontend adapters to inject either `fetch` or `invoke` based on environment. |
| `README.md` (Offline-first) | Phase 5 (Model Supply Chain) | A feature requiring a 3GB+ initial download is not strictly "offline-first". | LOW | Adjust terminology to "Local-First / Provisioned Offline". |

## 4. Architecture Assessment
* **llama.cpp Decision:** Pragmatic for hardware reach (CPU/Apple Silicon), but ADR-007 underestimates the cost of `unsafe` FFI and lack of true native cancellation.
* **Worker Model:** `std::thread::spawn` is insufficient. Needs a robust channel-based actor model capable of handling dropped receivers, thread panics, and deterministic shutdown.
* **IPC:** Does not fully specify event ordering guarantees or stale event discarding (e.g., user clicks generate, cancels, and generates again rapidly).

## 5. Security Assessment
* **Model Provenance:** Inadequate. SHA-256 validates integrity against corruption, not authenticity. Requires signed manifests.
* **GGUF / FFI:** High risk of full application crashes on malformed models due to in-process FFI.
* **Filesystem:** Download atomicity and temporary file cleanup (`.tmp` to `.gguf`) are loosely specified.

## 6. Product Assessment
* **Offline-first Semantics:** Needs refinement. Users must be aware of the bandwidth and storage cost *before* the download begins.
* **UX / Onboarding:** The "first AI activation" requires a progress modal, but what if the user closes the app mid-download? Background resuming is unspecified.
* **Freemium Implications:** Major gap. Transitioning to local inference removes the recurring API cost, but makes Freemium tier enforcement vulnerable to client-side bypass.

## 7. QA Assessment
**Missing Test Scenarios:**
* Renderer process crash/disconnect during generation.
* Concurrent job submission (double-clicking the Generate button).
* Model download interruption and resume.
* In-process OOM (Out Of Memory) during model loading.
* Zero-byte or corrupted `.gguf` file remaining on disk.

## 8. Required Revisions

### MUST FIX BEFORE IMPLEMENTATION
1. Implement Manifest Authenticity (Cryptographic Signature Verification).
2. Validate and prove cooperative cancellation over the `llama.cpp` Rust FFI boundary.
3. Resolve the Gemini deprecation conflict (Define Hybrid vs Local-Only strategy and its impact on Freemium logic).
4. Add robust error states (`INSUFFICIENT_DISK_SPACE`, `NETWORK_INTERRUPTED`) to the state machines.

### SHOULD FIX BEFORE IMPLEMENTATION
1. Replace arbitrary 50ms backpressure with a token-count/channel-capacity bounded queue.
2. Expand the Test Matrix to cover E2E download interruption and UI disconnects.
3. Update PRD/README to reflect "Provisioned Local AI" terminology.

### CAN BE DEFERRED
1. Out-of-process sandboxing for `llama.cpp` (Accept the risk of app crashes for v1).

## 9. Human Gate
Technical review status: NEEDS REVISION
Implementation authorization: NOT GRANTED
Human Gate: REQUIRED
