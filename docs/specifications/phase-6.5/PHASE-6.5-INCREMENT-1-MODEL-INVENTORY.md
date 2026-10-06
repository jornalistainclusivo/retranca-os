# Phase 6.5 — Increment 1: Local model inventory recovery

Date: 2026-10-03. Status: implemented, owner desktop handoff accepted (`1 ok; 2 ok; 3 ok`) and successful exact-source CI verified on `32e64a56084a5d42cef3275e00195c3262563e86`; evidence and limits are recorded in the [validation report](../../testing/PHASE-6.5-INCREMENT-1-VALIDATION.md). This narrow acceptance does not approve the complete Phase 6.5 draft or amend the runtime decision in ADR-007.

## Verified entry checkpoint

Integration update — 2026-10-05: this increment is included in `main` merge `37b272c1ae048c5aa004211fd9d09178bd41709c` through [PR #5](https://github.com/jornalistainclusivo/retranca-os/pull/5). All four jobs passed [main CI 37248233721](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37248233721). The [6.4 closure](../../testing/PHASE-6.4-CLOSURE-2026-10-04.md) closes Gate B for bounded code integration; comprehensive accessibility and distribution remain open. Preserve the accepted behavior below in the [new continuation](../../testing/PHASE-6.5-RESUMPTION-2026-10-05.md). This update adds no implementation or runtime-test claim.

The owner accepted both desktop X/Escape checks. [CI 37080317950](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37080317950) completed successfully on application source `08218bf6c05d510904686d3a89c56d7bfe8826ae`: frontend, Rust Windows, Rust Linux and the stable required Rust aggregate. This is not CI on later documentation or this increment. The last published handoff is `bb7b82064d32df26fa9bbab59e60cabedc4cbc9f`.

The CI annotation concerns `actions/checkout@v4` and `actions/setup-node@v4` declaring Node 20 while the runner executes them with Node 24. The [GitHub deprecation notice](https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/) was consulted on 2026-10-03. Updating Actions and the frontend Node version is a separate CI change requiring review/authorization; no workflow change is part of this increment.

## Problem and resulting behavior

Before this increment, the settings panel queried models only when opened. A failed or empty query required closing/reopening the panel; it did not expose an explicit retry/refresh control. The frontend model choice is session state, not a persisted preference. The current native command and provider orchestration stay in place under [ADR-008](../../decisions/ADR-008-EDITORIAL-AI-ORCHESTRATION-BOUNDARY.md) and [ADR-013](../../decisions/ADR-013-OPEN-SINGLE-EDITION.md).

| ID | Requirement |
| --- | --- |
| RE-65.1-001 | Expose a named native **Atualizar modelos** button inside local settings. Distinguish loading, ready, empty and error states with readable status text; prevent overlapping user refresh requests. While loading, keep it focusable with `aria-disabled` and reject repeat activation in the handler. |
| RE-65.1-002 | Read the actual installed tags through existing `get_ollama_models` IPC. Preserve exact names/order, remove duplicate names and reject malformed or oversized payloads. Non-desktop environments return a truthful desktop-required error; never synthesize available models. |
| RE-65.1-003 | Query failure clears the displayed inventory, without changing the selected model in session state. Refresh/empty/error/close never automatically select, clear, download or substitute a model. A missing selected tag receives an availability warning; choosing an available tag or explicitly clearing selection remains a user action. Rust still validates generation requests. |
| RE-65.1-004 | Ignore late results after settings closes/unmounts or a subsequent view replaces the request. Reopening queries again and can recover from an earlier failure. Refresh leaves focus on its control; initial opening still focuses the model selector. |
| RE-65.1-005 | Preserve first-Tab entry, labelled model selector, named X, Escape/focus return and foreground-dialog precedence. Status updates use the existing status region. No new dependency, database migration, provider-routing change or production model download. |

## Unchanged IPC boundary

`get_ollama_models` continues to take no frontend arguments and return `string[]` or a native command error. The native implementation uses the existing loopback Ollama endpoint. The frontend validates a maximum of 1,000 nonempty names of at most 256 UTF-16 code units, with no surrounding whitespace; this bounds rendering without modifying the native DTO. Inventory presence does not establish generation/vision capability or local-only execution provenance.

The provider's [GET /api/tags documentation](https://docs.ollama.com/api/tags) supplies inventory guidance. Future capability contracts must inspect exact-model metadata using [POST /api/show](https://docs.ollama.com/api-reference/show-model-details). Both were consulted on 2026-10-03. Ollama can also expose cloud-backed models through a local server ([API introduction](https://docs.ollama.com/api/introduction)); loopback transport alone is not proof of local inference. This increment does not implement or certify cloud rejection or vision support.

## Validation matrix

| ID | Required evidence |
| --- | --- |
| TEST-65.1-001 | Native-bridge tests: SSR/non-desktop rejection without IPC; native command/arguments; exact names and duplicate handling; malformed/oversized results; propagation of native failure and later successful retry. Fixtures use synthetic tags only. |
| TEST-65.1-002 | Compiled-browser keyboard sample: early settings trigger, selector focus, named refresh activation, truthful browser error/retry, X/Escape focus return and neighboring-modal precedence. A browser without Tauri cannot establish native inventory success. |
| TEST-65.1-003 | Owner desktop: refresh the existing installed inventory; retain chosen `gemma4:latest`; close/reopen and verify the choice remains within the same running session. No model download or restart-persistence claim. |
| TEST-65.1-004 | Execute frontend tests, lint, types and static build. Native code/contracts are unchanged; prior successful Rust CI remains historical, with the new published revision's CI verified separately. |

## Remaining architecture and acceptance work

Broader accessibility and distribution acceptance remain open; the subsequent 6.4 closure accepted Gate B only for bounded code integration and PR #5 completed that merge. Phase 6.5 still needs a reviewed production-provider decision reconciling ADR-007 with current Ollama selection, local/remote model provenance, capability enforcement, persisted preferences and Windows/Linux packaged acceptance. Shipping a new engine, changing phase acceptance, migration, CI configuration, future merge or release are separate actions. Preserve real articles, models and credentials locally and the open single edition.
