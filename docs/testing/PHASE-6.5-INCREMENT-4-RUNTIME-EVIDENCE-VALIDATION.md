# Phase 6.5 Increment 4 — Runtime evidence validation

Date: 2026-10-06 (America/Sao_Paulo). Scope: the first read-only metadata delivery in the [Increment 4 specification](../specifications/phase-6.5/PHASE-6.5-INCREMENT-4-RUNTIME-EVIDENCE.md). This is evidence preparation, not an installed-package or inference/quality acceptance report.

## Verified integrated baseline

GitHub API confirmed [main CI #25](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37523157693) completed successfully on `1b7de720ff8f87060cd2f945b8c65ec598679471`: frontend, Rust Ubuntu, Rust Windows and the required Rust aggregate. [PR #6](https://github.com/jornalistainclusivo/retranca-os/pull/6) is merged. The published annotated tag `milestone-phase-6.5-increments-2-3` has object `a794672b5420f32b74279d1dbeef55058e7a42d0` and targets that exact merge SHA. This completes the earlier four authorized source-integration steps. No GitHub Release, version bump, installer or private data was published.

The owner authorized continuing development. A clean new branch `codex/phase-6.5-runtime-pilot` starts at that integrated baseline. The responsible-ai-evaluation skill/protocol was read to preserve bounded scope, local evidence, explicit model choice and the separation between operational results and human quality review. The next round's commit/push/CI/merge/release is not implied by the previous milestone authorization.

Local consolidation authorization — 2026-10-06: after the verified result was presented, the owner explicitly authorized a local commit of the 10 prepared source/documentation files, with message `feat(phase-6.5): add local runtime metadata probe`. This includes the developer example and Cargo target, specification/validation, current plan/task/README/changelog and integration receipts. Raw observations, manifest digests and actual editorial data remain ignored/local. Push, manual CI, merge and release retain separate authorization gates; no new-source remote CI is claimed.

## Implementation and check scope

The new developer example reuses `get_ollama_models` / `get_local_ai_readiness`; no production function, IPC, frontend, dependency, lockfile, schema, workflow or daemon/model configuration changes. It emits a local JSON metadata observation and distinct usage/query/not-ready exit states. It accepts no prompt, endpoint or article/file input and does not invoke Tauri startup, SQL initialization, generation or download. The explicit example target runs its unit tests through normal Cargo tests but is outside default application packaging.

| Check | Result |
| --- | --- |
| `cargo fmt --manifest-path src-tauri/Cargo.toml --check` | **Pass** on final source. |
| `cargo test --manifest-path src-tauri/Cargo.toml --locked --example local_ai_readiness_probe --quiet` | **Pass — 5 tests** in the Windows debug example harness: explicit/non-ambiguous operation, exact-name preservation, rejected prompt/endpoint/download options without echo, inventory/help and blocked-readiness exit policy. No daemon calls in tests. The conditional invalid-encoding test is Unix-only and was not run locally. |
| `cargo check --manifest-path src-tauri/Cargo.toml --locked --release --example local_ai_readiness_probe --quiet` | **Pass** — release type checking; no claim of a linked release executable or installer. |
| `cargo run --manifest-path src-tauri/Cargo.toml --locked --quiet --example local_ai_readiness_probe -- --help` | **Pass** — exit 0 and the supported-operation help, without invoking a metadata query. |
| Actual installed-model inventory | **Pass** on the permitted native query: 5 validated catalog entries; the exact owner-chosen tag exists. Raw inventory remains ignored/local. One prior sandbox attempt failed and is not counted as a successful observation. |
| Owner-chosen exact-model readiness | **Pass** on one permitted query for `gemma4:latest`, chosen explicitly by the owner. Native report: server `0.35.1`, exact resolved tag, `READY`, `LOCAL_REQUEST_ENFORCED`, textual completion and a valid-shaped manifest digest. Raw digest/observation remain ignored/local. No generation, model substitution or download. One prior sandbox query returned `SERVER_UNREACHABLE / UNKNOWN`; the permitted retry resolved it. |
| Documentation local links and final diff | **Pass** — 114 local link targets in the updated handoff documents exist; tracked `git diff --check` passes. The three new files have no trailing whitespace, conflict markers or missing final newline. Link existence does not verify anchors or remote pages. |
| Real inference/cancellation, quality review, installed Windows/Linux, new-source CI | Not executed in this metadata delivery. Preserve earlier accepted UI/CMS/generation observations without extending their scope. |

Unchanged frontend and accepted desktop scripts are not rerun solely for confirmation. The existing native authority was validated by main CI on the baseline; only the new example needs bounded compile/test checks here. No independent agent/security review is claimed for this new round.

The initial debug/release compilation found that this project's Tokio configuration does not enable the `main` macro. The final example instead constructs the already available current-thread runtime after argument/help validation. No Tokio feature or dependency was added; final checks above passed. The existing `unused_mut` warning in provisioning is retained.

Two initial sandbox metadata attempts failed, with Windows path-canonicalization warnings and unreachable/invalid-catalog diagnostics. The approved outside-sandbox retry used the same bounded native functions and no relaxed policy: inventory and chosen-model queries each returned exit 0. All attempts remain separate local captures. The successful observations took 281 ms (inventory) and 233 ms (readiness) excluding compilation; these are single metadata observations, not inference latency measurements or performance/quality comparisons.

The actual daemon advertised other capability labels alongside completion. They do not enable image/audio uploads, tools or other protocols in Retranca. This collector consumes only the existing textual readiness contract. No executable/process attestation, immutable model binding or model-file inspection was performed. No owner article, database, image, export, backup, credentials or daemon/cloud preference was inspected or changed.

## Owner handoff

No new article or UI test is required for the metadata collector. From the repository, list actual model tags:

```powershell
cd C:\Users\RFERRAZ\Documents\retranca-editorial-os
git status --short --branch
cargo run --manifest-path src-tauri/Cargo.toml --locked --example local_ai_readiness_probe -- --inventory
```

The owner chose `gemma4:latest`. To repeat only that metadata observation when needed:

```powershell
cargo run --manifest-path src-tauri/Cargo.toml --locked --example local_ai_readiness_probe -- --model gemma4:latest
```

Both metadata queries already passed in this delivery; repetition is optional. Keep the resulting JSON local and share only the state/message if blocked. Do not upload the inventory, manifest digest, filesystem paths or actual editorial content to GitHub. Exit 2 with a non-READY report is expected blocking evidence, not permission to relax the native gate or change Ollama.

The next generation pilot remains separately bounded: identified synthetic cases, fixed version/model/source, limits on attempts/time, local retained outputs and human review. A metadata READY report alone does not approve it or prove installed-runtime integrity, hardware sufficiency, actual generation/cancellation or editorial quality.
