# Phase 6.5 — Production Provider and Model Experience

Date: 2026-10-02. Status: draft for product/architecture review, not an approved specification or completed phase.

## Entry conditions

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
