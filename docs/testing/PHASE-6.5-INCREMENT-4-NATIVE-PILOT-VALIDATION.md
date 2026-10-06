# Phase 6.5 Increment 4 — Native runtime pilot validation

Date: 2026-10-06 (America/Sao_Paulo). Scope: the [bounded native pilot](../specifications/phase-6.5/PHASE-6.5-INCREMENT-4-NATIVE-PILOT.md), following the [metadata validation](PHASE-6.5-INCREMENT-4-RUNTIME-EVIDENCE-VALIDATION.md). Status: one Windows debug native sequence passed its operational checks; the owner accepted both completed synthetic suggestions. The cancelled partial suggestion remains unreviewed. No installed-package, Tauri event/CMS, general model quality or production acceptance is claimed.

## Verified baseline

Published metadata commit `82d1a0007c3d04e3e1375870f946ddac0709006a` remains the head of clean/synchronized `codex/phase-6.5-runtime-pilot` at resumption. GitHub API confirmed [CI #26 / run 37530233063](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37530233063) completed successfully on that exact branch/SHA: frontend, Rust Ubuntu, Rust Windows and required `rust` aggregate. The owner separately authorized its commit, push and manual dispatch, then authorized continuing development after all four jobs passed. These results apply to the metadata delivery, not the subsequent pilot harness.

## Prepared method and actual checks

Follow the responsible-ai-evaluation protocol: fixed case/model/source identities, explicit attempt/time/output limits, local synthetic data only, separate operational/review states and all failed/not-run attempts retained. The harness composes existing native preparation, transport and registered-cancellation functions under `cfg(test)`; it is not an installed desktop or event-delivery test. No production function body, dependency, model configuration, IPC, UI, schema, workflow or real article change is intended.

| Check | Result |
| --- | --- |
| `cargo fmt --manifest-path src-tauri/Cargo.toml --check` | **Pass** on final source. |
| `cargo test --manifest-path src-tauri/Cargo.toml --locked --lib live_runtime_pilot --quiet` | **Pass — 5 tests, 1 ignored**. Explicit opt-in/no fixtures; frozen native case preparation/escaping; stop budgets; rejected empty/overflow/wrong-outcome/teardown results and safe review rendering; changed/blocked identity. No daemon calls in these five tests. |
| Same focused test command with `--release` | **Pass — 5 tests, 1 ignored**. Release test binary compiled/linked and ran the non-daemon checks; actual model sequence below ran only in debug. |
| Opt-in exact `ollama_gateway::live_runtime_pilot::installed_gemma4_native_pilot` with `--ignored --exact --nocapture` | **Pass — 1 test, 3 planned/attempted tasks**, one attempt per task, no retry. Advertised native runtime `0.35.1`, exact selected/resolved `gemma4:latest`, `READY / LOCAL_REQUEST_ENFORCED` and unchanged sampled manifest identity. |
| Local artifact isolation | **Pass** — `git check-ignore` confirmed the attempts ledger, human-review Markdown and all three retained synthetic source files are ignored. Generated outputs/raw manifest identity are absent from the tracked diff. |
| Documentation links and diff | **Pass** — 132 local link targets in the updated handoff set exist, tracked `git diff --check` passes and the three new files have no trailing whitespace/conflict markers/missing final newline. Local link existence does not validate anchors or remote pages. |
| Human output review | **Owner-reported acceptance — 2 completed suggestions reviewed / 2 completed, 2 accepted / 2 reviewed** on 2026-10-06. The cancelled partial suggestion remains unreviewed; no comparative model recommendation. |
| New-source CI, actual Tauri events/CMS, installed Windows/Linux, broader accessibility/quality/license/security gates | Not executed by this pilot. Preserve accepted historical checks without extending their scope. |

The live run `2fb04735-7983-43f9-aeb6-1e68585cf3e8` was executed once outside the filesystem/network sandbox using the same native fixed loopback policy. Its source baseline is `82d1a00` plus the locally prepared test harness; compiled native/harness and actual prompt hashes are retained with raw metadata only locally. No alternate provider, readiness bypass, request option tuning, daemon/model preference change, download or agent inspection of owner articles/databases/model files occurred.

| Task | Operational result | Native attempt elapsed | First response fragment | Local evidence |
| --- | --- | --- | --- | --- |
| `PL-01` | `completed`; expected checks passed | 36.969 s | 33.697 s | 321 captured bytes; native completion marker; released registry; preserved synthetic source; identity stable. |
| `CANCEL-01` | `cancelled`; expected checks passed | 25.790 s | 25.789 s | 3 captured bytes; cancellation triggered on first response; acknowledged client teardown; released registry; preserved source; identity stable. |
| `RECOVER-01` | `completed`; expected checks passed | 31.772 s | 29.481 s | 374 captured bytes; a new request completed after cancellation; released registry; preserved source; identity stable. |

Total observed pilot time: **94.639 s** from the initial metadata query through final ledger preparation, excluding compilation/initial artifact preparation and human review. Native attempt times start after context/client/registration preparation, include fresh readiness and transport, and exclude the extra post-attempt identity query/file writes. Three of three planned tasks were attempted; three of three met their predefined operational checks. No errors, timeouts, capture overflows or not-run tasks occurred. This is one sequential convenience sample, not a benchmark, statistical model comparison or representative quality estimate.

Human review, recorded after execution: **2 reviewed / 2 completed suggestions; 2 accepted / 2 reviewed**, or **2 reviewed / 3 planned tasks**. On 2026-10-06 the owner replied `1 OK, 2 OK` to the two bounded review checks below. `CANCEL-01` remains an unreviewed partial suggestion, not an accepted editorial result. The original execution ledger retains its historical **0 reviewed / 3 planned** snapshot; a separate ignored `human-review.json` receipt and the local readable report record the later owner acceptance without changing runtime observations. This is an aggregate owner report, not an independent or blind editorial evaluation. No external API was called by the harness; local compute/energy, human review time and costs were not measured, so cost per accepted task cannot be calculated from this sample.

Default tests skip the live test and the pilot requires both explicit opt-in variables and no development fixtures. Source inspection confirmed the only change in the production gateway file is its four-line `cfg(test)` module declaration. Existing `unused_mut` in provisioning download and `unused_variables` for the provisioning test signing key remain; no warning cleanup or unchanged frontend/UI suite rerun was included. No independent agent/security review is claimed.

## Owner handoff and limits

The owner does not need to repeat previous startup/settings/CMS/cancellation acceptance scripts. After an actual pilot, review the local report's completed suggestions against their synthetic originals: preserve facts and uncertainty, reject invented sources/quotes and assess respectful useful language. Generated suggestions are not saved as owner articles or committed to Git. The source-text invariant here covers synthetic inputs only; SQLite/restart persistence remains supported by the earlier accepted evidence, not a new observation.

Actual review artifact: `.retranca-local/phase65-runtime-pilot/2fb04735-7983-43f9-aeb6-1e68585cf3e8/review.md`. The agent requested two owner checks: `PL-01` retains 12 people, two proposals, the unconfirmed 30-day estimate and pending decision without invented facts/sources; `RECOVER-01` uses respectful language and preserves the absence of interviews/evidence without inventing them. The owner reported `1 OK, 2 OK` on 2026-10-06; that message supplies bounded acceptance of these two suggestions. No detailed scores, independent quality judgment or acceptance of the cancelled fragment were supplied. No new article creation, repeated generation or repetition of earlier desktop acceptance is needed. The earlier open-in-Codex request was queued; the acceptance evidence is the owner's reply, not opening a tab.

Optional AntiGravity commands to read the already executed results, without rerunning inference:

```powershell
cd C:\Users\RFERRAZ\Documents\retranca-editorial-os
Get-Content -LiteralPath .retranca-local\phase65-runtime-pilot\2fb04735-7983-43f9-aeb6-1e68585cf3e8\review.md -Encoding UTF8
```

For maintainers, the manual opt-in command used was scoped to a child PowerShell session:

```powershell
$env:RETRANCA_PHASE65_PILOT = '1'
$env:RETRANCA_PHASE65_MODEL = 'gemma4:latest'
cargo test --manifest-path src-tauri/Cargo.toml --locked --lib ollama_gateway::live_runtime_pilot::installed_gemma4_native_pilot -- --ignored --exact --nocapture
```

This creates a new bounded run; the current sample must not be repeated automatically or silently used to select a better output. A future run needs its own recorded reason/source/config/budget. After accepting the two completed suggestions, the owner explicitly authorized the local commit of the prepared 11-file native-pilot round on 2026-10-06: `Sim, autorizo criar o commit local.` The intended message is `test(phase-6.5): add bounded native runtime pilot`. Generated outputs, raw metadata and editorial data stay excluded. Push, manual CI, merge and release require their own authorization; the metadata CI does not cover the later harness.

Raw model identity and output artifacts stay under ignored `.retranca-local/phase65-runtime-pilot/`. A final result must name every planned task, attempted/not-run state, expected or unexpected operation, runtime identity stability and human review status. Model capability metadata alone, an automated green result or one local sequence cannot establish general editorial quality, hardware sufficiency, packaged behavior, WCAG conformance or server-side compute cessation.

The adversarial fragment is escaped by native context preparation, as checked automatically. Because that task deliberately stopped after its first response fragment, it does not evaluate complete model resistance to prompt injection. General security/dependency maintenance, full interface accessibility, real-data editorial evaluation, licensing, embedded-engine delivery and Windows/Linux installers retain their separate scope.

Provider reference consulted 2026-10-06: the [official Ollama generate API](https://docs.ollama.com/api/generate) documents the model/prompt/stream request and generated response/completion fields. This is general endpoint documentation, not evidence of exact daemon integrity or a substitute for the pinned source/version policy in ADR-016. This pilot retains the existing native request defaults and reports observed wall times; provider thinking/token/load telemetry was not collected.
