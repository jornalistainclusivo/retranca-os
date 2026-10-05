# Phase 6.5 — Production Provider and Model Experience

Date: 2026-10-02. Status: draft for product/architecture review, not an approved specification or completed phase.

## Current integrated baseline / continuation — 2026-10-05

Phase 6.4 was merged through [PR #5](https://github.com/jornalistainclusivo/retranca-os/pull/5) into `main` as `37b272c1ae048c5aa004211fd9d09178bd41709c`. All four jobs passed [main CI 37248233721](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37248233721) on that merge SHA. The accepted Increment 1 is included and must be preserved. Continue from that baseline in `codex/phase-6.5-production-provider-contract`; [resumption evidence](../testing/PHASE-6.5-RESUMPTION-2026-10-05.md) records the checks and boundaries.

The owner-approved [6.4 closure](../testing/PHASE-6.4-CLOSURE-2026-10-04.md) supersedes historical open Gate B wording below for bounded source integration. It does not accept distribution, comprehensive accessibility or installed real-engine behavior. Remaining dependencies/licensing/packaging criteria stay explicit; do not repeat already accepted corrective checks merely for confirmation.

The owner accepted external local Ollama for the first production path and expressly retained **an embedded engine as the preferred future delivery**. [ADR-016](../decisions/ADR-016-PRODUCTION-LOCAL-AI-PROVIDER.md) records that bounded direction. The authorized [Increment 2 native contract](../specifications/phase-6.5/PHASE-6.5-INCREMENT-2-PROVIDER-READINESS.md), corresponding to steps 1–2 below, implements bounded version/catalog/capability checks and a per-request `:local` dispatch constraint for audited server `0.35.1`. The native round was committed and pushed as `d944a114f935cbab7222068c22fe22bc26f12fb1`; all four jobs passed [CI 37356369629](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37356369629) on that exact SHA. Commit, push and manual dispatch had separate explicit owner authorization. [Native validation](../testing/PHASE-6.5-INCREMENT-2-NATIVE-VALIDATION.md) records those results separately from the locally implemented UI, runtime/model identity evidence and installers. Neither native nor UI Increment 2 is integrated into `main` yet. No engine replacement, model download, preference migration, CI configuration change or release is included. The embedded-engine preference remains in the roadmap; no particular engine is selected or distributed now.

## Authorized preparation / increment — 2026-10-03

Current 2026-10-05 follow-up: the owner reported completed simplification without perceived inconsistencies, after earlier cancellation/original-CMS-text preservation observations. Preserve these three bounded functional acceptances. After native CI passed, the owner authorized continuing development and confirmed the app was already closed. The [readiness diagnostic and recovery UI](../specifications/phase-6.5/PHASE-6.5-INCREMENT-2-READINESS-UI.md) is implemented and validated locally: 338 tests / 27 files, including 49 bridge fixtures, types, lint and Next.js 16.3.4 static build passed, plus 11 actual compiled-component/bridge checks with synthetic IPC in isolated Chrome 154.0.8037.98. Its [separate validation](../testing/PHASE-6.5-INCREMENT-2-UI-VALIDATION.md) records the browser sample and bounded owner handoff. The owner reported all three diagnostic/recheck/focus desktop checks passing (`1 OK; 2 OK; 3 OK`, 2026-10-05). Broader desktop/NVDA, local publication/CI, exact runtime/model identity and packaged distribution remain pending. The passed native CI applies only to `d944a11`; app-closure confirmation is not a functional test. No new ADR is needed for this consumer of accepted ADR-016/008 authority.

The owner reported successful CI and authorized continuing into the next phase, then explicitly accepted both settings X/Escape desktop checks. The GitHub API confirmed all four jobs of [CI 37080317950](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37080317950) on `08218bf6c05d510904686d3a89c56d7bfe8826ae`. Its Node 20 Actions warning is a separate reviewed CI-maintenance item.

The bounded [Increment 1 inventory/recovery specification](../specifications/phase-6.5/PHASE-6.5-INCREMENT-1-MODEL-INVENTORY.md) uses the existing Ollama IPC, provider policy and session state. Refresh/retry usability passed 287 frontend tests, lint/types/build and a compiled-browser keyboard sample. The owner subsequently accepted all three desktop handoff checks, and [CI 37141777120 passed all four jobs on implementation `32e64a5`](../testing/PHASE-6.5-INCREMENT-1-VALIDATION.md). No new engine/dependency/migration is included. The owner confirmed closing the app before interface edits. This authorizes that increment and preparation of production contracts; it does not declare Phase 6.4 accessibility/Gate B complete, approve the entire draft, amend ADR-007 or grant merge/release authorization.

## Entry conditions

The following 2026-10-04 paragraphs retain the earlier intake snapshot. The integrated baseline and bounded Gate B closure above are current; remaining distribution requirements are not marked passed.

Update 2026-10-04: the explicitly authorized Firebase removal and js-yaml/Vitest patches passed local clean installation, types, 287 frontend tests, lint, build and independent candidate review. The [dependency validation checkpoint](../testing/PHASE-6.4-RESUMPTION-2026-10-04.md) records the final remaining Next/lint audit entries and warnings. Linux glib and the accessibility queue below remain unresolved; new-revision CI must be verified separately. This correction does not choose a production engine or close Gate B.

The [2026-10-03 Gate B review](../security/PHASE-6.4-GATE-B-REVIEW-2026-10-03.md) completed the immutable changed-source security review through `0d2f5e9`, without new reported vulnerabilities. Its initial queue included unused Firebase tooling and retained npm patch levels, addressed by the subsequent correction above, plus unresolved Linux glib compatibility, CMS labels/template naming and Calendar keyboard activation. The owner confirmed the intended current workflow is Tauri/Ollama only. Complete the remaining queue before treating static review as full product acceptance; no production-engine choice is implied by removing unused development tooling.

Preserve Phase 6.4's open single edition (ADR-013), article-owned text (ADR-014), local preserving import (ADR-015) and Rust evidence authority (ADR-008). Gate C for the 6.4 integration was completed through PR #5; future phase merges require their own authorization and checks. Broader desktop/accessibility/distribution requirements and Gate D remain open. Successful automated tests alone do not close these gates.

## Proposed sequence

| Step | Deliverable | Evidence required |
| --- | --- | --- |
| 1 | Decide the production provider/engine contract. Reconcile the earlier production-sidecar architecture with current normal-build Ollama selection. | Review existing ADR-007/008, actual installed runtime, licensing and distribution terms; record a new ADR before changing authority or shipping an engine. |
| 2 | Specify model inventory, session selection, readiness and recoverable failure states. | Use exact installed model tags; clear messages for absent runtime/model, startup, cancellation and retry. No invented model or automatic download/substitution. |
| 3 | Implement the chosen engine adapter and model binding. | A real engine consumes the verified model and implements the declared action/prompt/stream/cancel protocol; do not treat the bundled mock-sidecar fixture as an inference engine. |
| 4 | Validate packaged desktop behavior on Windows/Linux. | Install/start outside the repository, resolve the bundled executable, persist/reopen synthetic articles, run real inference and cancellation, record binary/version/model identities and integrity checks. Build/CI is distinct from installer acceptance. |
| 5 | Complete accessibility and release readiness. | Keyboard/NVDA, focus and status/error announcements, reflow/zoom, contrast/reduced motion, documented recovery; no conformance claim from automated scans alone. |

## Product boundaries

- One open edition, no account, subscription or commercial gate.
- Actual articles, images, files, SQLite and backups stay local. GitHub receives code/docs/synthetic fixtures.
- Preserve the owner's current Ollama/model configuration during development. A different production engine, new dependency or download requires an explicit reviewed decision.
- Owner-preferred model candidates are Gemma 4 currently used and DeepSeek, based on informal experience reported 2026-10-05. Keep arbitrary valid installed-model selection; verify exact tags/configuration and evaluate representative synthetic cases before a comparative recommendation. This preference does not mandate a default or certify local/vision capability.
- Image/text/document utilities remain in [attachment discovery](../specifications/ARTICLE-ATTACHMENTS-DISCOVERY.md). Define file ownership, limits, local storage, preview/alt text, deletion/export and recovery before implementing. Image inference requires a provider capability contract; a model name alone does not establish vision support.
- Article-only JSON import/export does not replace a full backup/restore design.
- Confirm the project's code and engine/model distribution licensing before public release; this draft does not select a license.

## Next review

Review the [Increment 2 UI specification](../specifications/phase-6.5/PHASE-6.5-INCREMENT-2-READINESS-UI.md) and its [validation/handoff](../testing/PHASE-6.5-INCREMENT-2-UI-VALIDATION.md) for the locally implemented settings/status/retry diagnostic. Preserve Increment 1 and the accepted native handoff. The [native contract and matrix](../specifications/phase-6.5/PHASE-6.5-INCREMENT-2-PROVIDER-READINESS.md) remain authoritative for dispatch; a UI report cannot authorize inference. Automated local UI checks passed; browser observations, bounded owner acceptance and separately authorized UI publication/CI retain their own evidence. Later actual-daemon synthetic evaluation, exact runtime/model identity, installer/license/runtime integrity and real embedded-engine binding remain separate. Historical [local import validation](../testing/PHASE-6.4-LOCAL-IMPORT-VALIDATION.md) and [acceptance closure](../testing/PHASE-6.4-SLICE-8-ACCEPTANCE-CLOSURE-PLAN.md) remain bounded evidence, not distribution acceptance.
