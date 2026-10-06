# Phase 6.5 Increment 4 — Runtime evidence preparation

Date: 2026-10-06. Scope: the first operational evidence step before the installed Windows/Linux journey in the [production plan](../../architecture/PHASE-6.5-PRODUCTION-EXPERIENCE-PLAN.md). The owner authorized continuing after main CI #25. Preserve [ADR-016](../../decisions/ADR-016-PRODUCTION-LOCAL-AI-PROVIDER.md), existing model choice, native readiness and all accepted desktop checks.

## Baseline and delivery

[PR #6](https://github.com/jornalistainclusivo/retranca-os/pull/6) integrated Increments 2 and 3 as `1b7de720ff8f87060cd2f945b8c65ec598679471`. All four jobs passed [main CI #25](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37523157693) on that exact SHA. The annotated tag `milestone-phase-6.5-increments-2-3`, object `a794672b5420f32b74279d1dbeef55058e7a42d0`, targets that merge and has been published. Continue on `codex/phase-6.5-runtime-pilot`; the tag is not an installer release or completion of all Phase 6.5.

This first delivery adds a developer-only Rust metadata probe that calls the existing native catalog/readiness functions directly. It opens no Tauri window/database and takes no editorial text, prompt, file path or endpoint override. The [Cargo example target](https://doc.rust-lang.org/cargo/reference/cargo-targets.html#examples), consulted 2026-10-06, uses existing dependencies and is not a default application/installer binary. Explicit example tests participate in normal `cargo test` through `test = true`; no workflow change is included.

## Requirements

| ID | Required behavior |
| --- | --- |
| EV-65.4-001 | `--inventory` calls the existing bounded native catalog and reports exact installed tags. Empty inventory is an availability observation, not readiness. No auto-selection. |
| EV-65.4-002 | `--model <exact tag>` calls the existing native readiness query without duplicating its version, metadata, capability or local-selector policy. Preserve input byte-for-byte; native validation/alias resolution remains authoritative. |
| EV-65.4-003 | Emit one JSON observation with schema version, operation, optional observation timestamp, metadata elapsed time and the existing sanitized result. Reject absent/ambiguous/unknown arguments, invalid encoding and endpoint/prompt/download options before invoking native queries; do not echo rejected input. |
| EV-65.4-004 | Return 0 for a successful inventory or READY observation, 2 for usage or a non-READY result, 1 for query/runtime/serialization failure. Automation must not treat blocked readiness as passed. |
| EV-65.4-005 | Keep the fixed loopback/native client, proxy/redirect restrictions, ten-second deadline, response limits and audited server requirement unchanged. No model load/generation/download, daemon launch/configuration change or fixture activation. |
| EV-65.4-006 | Preserve observations locally. Do not commit inventory, digest/output captures, owner configuration, model files or editorial data. Git receives the probe, specification and validation documentation only. |

Metadata latency excludes compilation and is not inference latency. A native READY result remains conditional on a trusted daemon; a version string/digest is not executable/process attestation, atomic model identity, hardware/quality evidence or installed-package acceptance. An unsupported server blocks rather than triggering an update/downgrade or relaxed gate.

## Pilot sequence and acceptance

1. Compile/test the new probe using synthetic arguments without daemon calls; check debug and release compilation. Do not repeat unchanged frontend/accepted desktop suites solely for confirmation.
2. Query the actual catalog once. The owner chooses one exact existing tag, preferably the Gemma model already in use. Query readiness once for that choice and retain the raw observation only locally. A blocked result is valid diagnostic evidence, not successful runtime acceptance.
3. After metadata is established, define separate disposable synthetic editorial cases for normal completion, registered-request cancellation, original-text preservation and recovery. Execute those through the actual desktop/native orchestration, not raw generation from this probe. Preserve prior accepted scripts; this later pilot addresses missing identity/evidence rather than re-accepting unchanged UI.
4. Freeze exact runtime/model/manifest identity and native source revision for later attempts. Record all completed/failed/timeout/cancelled/not-run and accepted/rejected/pending states; reject fabricated facts/citations or material meaning changes. Compare with human editing as a baseline. Start with one model; a Gemma/DeepSeek comparison requires the same cases, exact installed identities and separate bounded runs.

No inference is executed by this metadata delivery. The later pilot must define call/attempt/time budgets and human review before generation, use identified synthetic cases, keep outputs local and stop on failed native readiness or missing evidence. No paid/external-service calls are included. Local compute/review cost is not automatically zero merely because no hosted API is used.

## Boundaries and next gates

No frontend/IPC/production readiness change, dependency, lockfile, schema, engine replacement, cloud preference, CI configuration or installer is included. No new ADR is needed for this consumer of existing authority. New-round commit/push/CI/merge/release requires its own explicit scope; the earlier authorization covered the Increments 2–3 milestone.

Windows checkout metadata is one operational sample. Installed Windows/Linux startup, persistence/recovery, actual synthetic inference/cancellation, runtime/model licensing and identity/integrity, relevant NVDA/zoom/contrast and residual dependency maintenance remain open. A real embedded engine is still the preferred future delivery, requiring its own specific engine/protocol/model-binding decision. Results belong in the [validation report](../../testing/PHASE-6.5-INCREMENT-4-RUNTIME-EVIDENCE-VALIDATION.md).
