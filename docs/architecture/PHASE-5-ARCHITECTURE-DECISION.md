# Phase 5 Architecture Decision Record (Central)

## Status
Proposed

## Context
Following the Phase 5 Governance Review (`docs/decisions/PHASE-5-GOVERNANCE-REVIEW.md`), the architecture for integrating local AI into Retranca OS required comprehensive resolution across Product, Architecture, Security, and QA vectors. The critical constraints involve true offline operability, cancellation limits over Rust/C++ FFI boundaries, model supply chain security (Authenticity), and the preservation of low-end hardware support.

## Decision Register

| Decision | Options | Recommendation | Confidence | Evidence Required |
|---|---|---|---|---|
| **AI Strategy** | Local Only / Hybrid / Cloud Only | **Hybrid** (Tauri uses Local LLM, Web fallback to Gemini) | High | E2E test of dynamic AI provider injection. |
| **Runtime** | `candle-core` / `llama.cpp` | **`llama.cpp`** (Best hardware/GGUF support) | High | Spike A (llama.cpp token-level cancel). |
| **Isolation** | In-Process FFI / Subprocess Sidecar | **Subprocess Sidecar** (Crash/Panic isolation) | High | Spike B (Subprocess IPC/Cancel). |
| **Cancellation** | AtomicBool FFI / Process `SIGTERM` | **Process `SIGTERM`** (Subprocess) | High | Spike B. |
| **Model Trust** | SHA-256 Hash / Signed Manifest | **Signed Manifest** (Ed25519) | High | Spike C (Verify Ed25519 signature in Rust). |
| **Freemium** | Client Gating / Backend Quota | **Hybrid Entitlement** (Local is free/unlimited, Cloud metered) | Medium | Product review of offline business model. |
| **Backpressure** | Arbitrary 50ms / Bounded Token Queue | **Bounded Token Queue** (Max 10 tokens or channel cap) | High | Spike A (Streaming performance). |

## Architectural Resolutions

### 1. Hybrid AI Architecture
Retranca OS will implement a **Provider Abstraction** (`LocalProvider` and `CloudProvider`). The Gemini Next.js API route (`/api/gemini/editorial`) will **not** be deprecated. It remains the backend for the Web build and the fallback for Tauri users who decline the 3GB+ local model download or have incompatible hardware.

### 2. Subprocess Isolation (Sidecar)
Due to the security risks of parsing malformed GGUF files (RCE/Buffer Overflows) and the inability to guarantee cooperative cancellation across blocking C++ FFI calls, `llama.cpp` will **not** run in the main Tauri process. It will be compiled as a standalone binary (Sidecar) or a dedicated Rust subprocess interacting via `stdio` (JSON-RPC or line-delimited JSON). Cancellation is guaranteed by terminating the child process (`SIGKILL`/`SIGTERM`).

### 3. Model Authenticity
SHA-256 checksums provide integrity against disk corruption but not authenticity against MITM attacks. The Model Supply Chain will utilize a **Signed Manifest**. A public key (Ed25519) will be hardcoded into the Tauri Rust binary. The downloaded `manifest.json` will include a cryptographic signature. The Tauri backend will verify the signature before trusting the SHA-256 hashes contained within the manifest.

### 4. Backpressure and Streaming
Arbitrary timing constants (e.g., 50ms) are removed. The IPC pipeline will use a bounded channel queue. The subprocess writes tokens to `stdout`. The Tauri backend buffers up to $N$ tokens or flushes immediately if a terminal event occurs, preventing IPC flooding.

## Required Architectural Spikes
Implementation is blocked until the following Proofs of Concept (Spikes) are validated:

*   **Spike B (Process Isolation):** Prove Tauri sidecar startup, line-delimited JSON streaming over `stdout`, and deterministic process termination (`SIGTERM`) on user cancellation.
*   **Spike C (Model Provisioning):** Prove Ed25519 signature verification in Rust against a hosted `manifest.json`, followed by a resumable GGUF download with atomic `.tmp` to `.gguf` renaming upon successful SHA-256 hash validation.
*   **Spike D (Hardware Capability):** Prove dynamic RAM/AVX2 detection to toggle the UI from `LocalProvider` to `CloudProvider` without crashing.

## Amendments Required
The following baseline documents require amendment once this package clears the Human Gate:
*   `docs/PRD.md`: Redefine AI as "Hybrid Provisioned" (Cloud fallback).
*   `docs/SDD.md`: Add AI Provider Abstraction and Subprocess Sidecar topology.
*   `README.md`: Update terminology from strictly "Offline-first" to "Local-First / Provisioned Offline".
