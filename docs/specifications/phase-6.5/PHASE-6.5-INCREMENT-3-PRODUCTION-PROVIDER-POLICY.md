# Phase 6.5 Increment 3 — Production provider policy

Date: 2026-10-05. Scope: the first bounded delivery of step 3 in the [production experience plan](../../architecture/PHASE-6.5-PRODUCTION-EXPERIENCE-PLAN.md), implementing the external-Ollama direction accepted in [ADR-016](../../decisions/ADR-016-PRODUCTION-LOCAL-AI-PROVIDER.md). This does not implement the preferred future embedded engine or claim installer acceptance.

## Baseline and authorization

The owner authorized continuing after CI #23 and confirmed the application was already closed. GitHub API verified all four jobs of [run 37389383428](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37389383428) completed successfully on published Increment 2 UI commit `34bf047781e63e2f55f82600b99cff9686204b82`. That CI does not validate subsequent Increment 3 changes. The initial development handoff did not authorize publication. After the owner accepted all three new desktop checks on 2026-10-05, a subsequent explicit instruction authorized consolidation, push, existing CI, reviewed PR/merge and a technical milestone tag for this source scope. See the [integration checkpoint](../../testing/PHASE-6.5-INCREMENTS-2-3-INTEGRATION.md); a distributable release remains outside that authorization.

The existing `mock-sidecar/src/main.rs` emits fixed synthetic tokens and does not consume a verified model. At intake, preflight could select it when Ollama was unavailable, orchestrated IPC accepted SIDECAR in release, and the default Tauri bundle included it. A downloaded and verified file cannot turn this fixture into a real engine.

## Required behavior

| ID | Requirement |
| --- | --- |
| PP-65.3-001 | Normal development and release use the approved Ollama adapter. Native preflight selects OLLAMA as the supported route even when the daemon/catalog is absent; availability remains diagnostic, never dispatch permission. Starting Ollama later and refreshing models must not leave generation stuck behind a cached NONE provider. |
| PP-65.3-002 | Rust rejects SIDECAR dispatch and subprocess startup unless both debug assertions and the explicit `dev-fixtures` Cargo feature are enabled. File presence, renderer provider values and download state cannot enable it. Release remains blocked even if the feature is specified. Preserve native editorial validation, prompt authority, the fresh readiness gate, exact session choice, streaming and registered-request cancellation. |
| PP-65.3-003 | Native preflight exposes `development_fixtures_enabled: boolean`. In normal builds it is false, with `model_exists` and `sidecar_ready` false; skip inspection/hashing of the legacy fixture manifest/model. Existing fixture files and editorial data are preserved. |
| PP-65.3-004 | Native download rejects outside explicit debug-fixture mode before accessing app data, registering a job, reading trust configuration or making a request. Keep the command name for a clear compatibility error. The renderer checks fresh native policy before subscribing/downloading; no simulated browser/production readiness. |
| PP-65.3-005 | Show the fixture provisioning dialog only with an explicit true native flag; absent, failed or legacy preflight must not expose it. Label its model/output as tests. Normal settings explain separately installed Ollama and user-chosen models; the CMS remains usable without AI. No automatic download, provider fallback or model replacement in normal builds. |
| PP-65.3-006 | Default `tauri.conf.json` includes no external test binary. An explicit debug fixture configuration may include the existing sidecar, using a distinct application identifier to separate its app-data namespace. Keep the fixture helper operational through explicit feature/config arguments. No workflow change, binary deletion, new dependency or installer publication. |

Tauri documents [`externalBin`](https://v2.tauri.app/reference/config/#externalbin) as binaries embedded in the application and [CLI `--config` / `--features`](https://v2.tauri.app/reference/cli/#dev) as explicit configuration merge/Cargo feature inputs, consulted 2026-10-05. Default builds must work without preparing a sidecar. Arbitrary downstream build configuration is outside this default-config guarantee; native production denial still applies regardless of a stray executable.

## Compatibility and boundaries

`selected_provider` identifies the supported route, while `ollama` remains an availability hint and `get_local_ai_readiness` / the per-generation Rust check remain authoritative. A missing daemon/model blocks generation with recoverable diagnostics rather than switching engines. The `dev-fixtures` feature is not a production provider or a supported release configuration. Explicit fixture tests must not be described as model execution, runtime attestation or quality evidence.

The external daemon remains independently installed and trusted within the exact server-version/local-request contract. Do not alter the owner's daemon/model/cloud settings, inspect private articles/database/model files, add production dependencies, migrate preferences/schema or broaden into attachments/full backup. Real engine/model binding, licensing, installed Windows/Linux packages and representative runtime/model evaluation remain separate gates.

## Verification and owner handoff

- Rust policy/preflight/dispatch tests in default debug, release and explicit debug-fixture mode. Verify release rejects SIDECAR even with the feature and that the default bundle configuration has no test binary.
- Frontend tests protect missing/false policy hiding, fresh native download denial before subscriptions, retained fixture lifecycle cleanup and truthful settings text. Run types, lint, static build and the affected keyboard/reflow fixture sample.
- Record executed results and limits in the [Increment 3 validation report](../../testing/PHASE-6.5-INCREMENT-3-PRODUCTION-POLICY-VALIDATION.md). Human handoff covers only normal startup without the fixture notice, explicit Ollama guidance/model choice and editorial editing without selecting AI. Do not repeat the accepted generation/cancel/CMS script merely for confirmation.

No actual installer, real model download or new inference is required for this bounded handoff. A successful local build is not Windows/Linux packaged acceptance or new-source remote CI.
