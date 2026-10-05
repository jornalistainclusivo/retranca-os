# Phase 6.5 — Production Provider and Model Experience

Date: 2026-10-02. Status: draft for product/architecture review, not an approved specification or completed phase.

## Authorized preparation / increment — 2026-10-03

The owner reported successful CI and authorized continuing into the next phase, then explicitly accepted both settings X/Escape desktop checks. The GitHub API confirmed all four jobs of [CI 37080317950](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37080317950) on `08218bf6c05d510904686d3a89c56d7bfe8826ae`. Its Node 20 Actions warning is a separate reviewed CI-maintenance item.

The bounded [Increment 1 inventory/recovery specification](../specifications/phase-6.5/PHASE-6.5-INCREMENT-1-MODEL-INVENTORY.md) uses the existing Ollama IPC, provider policy and session state. Refresh/retry usability passed 287 frontend tests, lint/types/build and a compiled-browser keyboard sample. The owner subsequently accepted all three desktop handoff checks, and [CI 37141777120 passed all four jobs on implementation `32e64a5`](../testing/PHASE-6.5-INCREMENT-1-VALIDATION.md). No new engine/dependency/migration is included. The owner confirmed closing the app before interface edits. This authorizes that increment and preparation of production contracts; it does not declare Phase 6.4 accessibility/Gate B complete, approve the entire draft, amend ADR-007 or grant merge/release authorization.

## Entry conditions

Update 2026-10-04: the explicitly authorized Firebase removal and js-yaml/Vitest patches passed local clean installation, types, 287 frontend tests, lint, build and independent candidate review. The [dependency validation checkpoint](../testing/PHASE-6.4-RESUMPTION-2026-10-04.md) records the final remaining Next/lint audit entries and warnings. Linux glib and the accessibility queue below remain unresolved; new-revision CI must be verified separately. This correction does not choose a production engine or close Gate B.

The [2026-10-03 Gate B review](../security/PHASE-6.4-GATE-B-REVIEW-2026-10-03.md) completed the immutable changed-source security review through `0d2f5e9`, without new reported vulnerabilities. Its initial queue included unused Firebase tooling and retained npm patch levels, addressed by the subsequent correction above, plus unresolved Linux glib compatibility, CMS labels/template naming and Calendar keyboard activation. The owner confirmed the intended current workflow is Tauri/Ollama only. Complete the remaining queue before treating static review as full product acceptance; no production-engine choice is implied by removing unused development tooling.

Preserve Phase 6.4's open single edition (ADR-013), article-owned text (ADR-014), local preserving import (ADR-015) and Rust evidence authority (ADR-008). Close the remaining Phase 6.4 desktop/accessibility and independent review scope; prepare a reviewable PR. Merge remains Gate C; tag/release remains Gate D. Successful automated tests alone do not close these gates.

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
- Image/text/document utilities remain in [attachment discovery](../specifications/ARTICLE-ATTACHMENTS-DISCOVERY.md). Define file ownership, limits, local storage, preview/alt text, deletion/export and recovery before implementing. Image inference requires a provider capability contract; a model name alone does not establish vision support.
- Article-only JSON import/export does not replace a full backup/restore design.
- Confirm the project's code and engine/model distribution licensing before public release; this draft does not select a license.

## Next review

Use [Phase 6.4 local import validation](../testing/PHASE-6.4-LOCAL-IMPORT-VALIDATION.md) and the [acceptance closure plan](../testing/PHASE-6.4-SLICE-8-ACCEPTANCE-CLOSURE-PLAN.md). Resolve the production engine/model binding first, then approve the concrete specification and test matrix. This draft does not defer a mandatory Phase 6.4 criterion by declaring it passed.
