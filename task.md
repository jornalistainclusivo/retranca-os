# Current work — Phase 6.4

- [x] Slice 6 corrective delivered in `6ce03fd`.
- [x] Human decision: open single edition, recorded in ADR-013 (2026-09-30).
- [x] Slice 7: dynamic AI recommendation semantics and removal of commercial capability gates implemented locally.
- [x] Current validation recorded: frontend 192, Rust debug/release 96, lint/build/security registration checks passed.
- [x] User-reported Windows desktop development smoke check (`npx tauri dev`) documented.
- [x] Local consolidation authorized by the product owner on 2026-09-30; review and contributor handoff recorded with this checkpoint.
- [x] Slice 8 automated checkpoint: publication metrics, semantic error parity, active-name validation, and AI Markdown resource hardening.
- [x] Current working-tree validation: frontend 201, Rust debug/release 97, lint/build/security registration checks passed.
- [x] Slice 8 manual smoke script approved by the product owner: stage creation/duplicate rejection, real local Linguagem Simples inference, and keyboard article close (`1 OK; 2 OK; 3 OK`, 2026-09-30).
- [ ] Slice 8 acceptance closure: remaining all-action runtime evidence, manual accessibility, packaged-runtime acceptance and independent review. Cancellation smoke and source-commit remote CI are recorded separately below.
- [x] Approved Slice 8 checkpoint saved locally as `ac453e8` (2026-10-01).
- [x] Slice 8 follow-up implemented locally: native Ollama cancellation, session start/close race handling, UTF-8/terminal stream errors and native AI dialogs.
- [x] Follow-up local checks: frontend 211; Rust debug/release 102; lint/types/build/fmt/native check/security registration; sampled browser keyboard focus.
- [x] Follow-up owner desktop checks: cancellation/retry, close/reopen/article cancel and keyboard dialogs; owner reported `1 ok; 2 ok; 3 ok` on 2026-10-01. Exact model tag/runtime traces were not supplied.
- [x] Explicit owner authorization for this follow-up's local consolidation commit on 2026-10-01, including reviewed Next-generated guidance files.
- [x] Separate owner-authorized push delivered `9fd6960`, `ac453e8`, and `8e22c18` to the feature branch.
- [x] Owner-authorized manual CI on exact SHA `8e22c18f37648322187727c0d5c56e7b1e734213`: all four jobs passed (frontend, Rust Linux, Rust Windows, required Rust aggregate), [run 36892534647](https://github.com/jornalistainclusivo/retranca-os/actions/runs/36892534647), 2026-10-01.
- [x] Separate owner authorization for local consolidation of the remote CI evidence in this checklist and its validation report on 2026-10-01 (`docs(phase-6.4): record successful cross-platform CI`).
- [ ] Separate explicit confirmation before pushing or creating another commit.
- [ ] Independent technical/security review (Gate B).
- [ ] Human merge authorization (Gate C).
- [ ] Human release/tag authorization (Gate D).

See the [Slice 8 checkpoint and contributor handoff](docs/testing/PHASE-6.4-SLICE-8-HARDENING-VALIDATION.md) and the [saved Slice 7 validation](docs/testing/PHASE-6.4-SLICE-7-OPEN-EDITION-VALIDATION.md). The product owner authorized the local Slice 8 consolidation and continued implementation on 2026-10-01. Ask again before each subsequent commit or push, and before merge, tag, or release; implementation authorization does not grant those actions.

## Next execution — Slice 8 closure

### Immediate corrective — article CMS content

- [x] Owner decision: save full analysis text with each article, recorded in ADR-014.
- [x] Implement article-owned text, explicit CMS persistence, legacy adapter/browser compatibility and article-scoped session visual descriptions.
- [x] Prepare native schema-2 migration with backup, transactional upgrade, validation and serialized initialization; no agent-run migration on the actual editorial database.
- [x] Local checks: frontend 219; native Windows debug/release 106; lint/types/build/Rust format/check and security registration enforcement.
- [x] Implementer isolated-browser A/B save/reload observations, recorded separately from owner acceptance.
- [x] Owner confirmed saving/closing the running application to unblock compilation; owner clarified that A/B was not tested. This does not authorize migration or count as desktop acceptance.
- [x] Owner subsequently reported all three supplied checks as passing (`1 OK; 2 OK; 3 OK`, 2026-10-01) and authorized continued development. No further migration is scheduled; actual schema/backup files were not independently inspected.
- [x] Owner-reported acceptance: A/B separation, save/cancel/clear behavior and restart persistence. This does not request commit or authorize push.
- [x] Corrective diff reviewed with Codex Security: two low-severity malformed-import render failures reproduced and then fixed. Frontend independently reviewed; native/database review completed by the parent after worker artifact-access failure. The sealed scan retains a partial coverage flag; full Gate B remains open.
- [x] Final frontend follow-up: safe visual draft keys, imported content type checks and save-session callback isolation; 236 tests/20 files, lint/types/build passed. Native code unchanged since the executed 106 debug/release tests.
- [x] Owner explicitly authorized the local consolidation commit of this corrective round's 32 prepared files; authorization recorded in this checkpoint.
- [ ] Full independent review (Gate B), separate push authorization and CI on the published corrective revision.
- [x] Requested image/text/document utilities preserved in attachment discovery; no upload implementation or binary-storage architecture approved.

Current corrective report and AntiGravity handoff: [article content validation](docs/testing/PHASE-6.4-ARTICLE-CONTENT-VALIDATION.md). Functional owner acceptance is recorded; review/consolidation remain before the broader closure below.

### Broader acceptance sequence

The [acceptance closure plan](docs/testing/PHASE-6.4-SLICE-8-ACCEPTANCE-CLOSURE-PLAN.md) records the published checkpoint, remaining evidence, owner desktop script and Phase 6.5 boundary. Preparing this plan does not establish new test results or acceptance.

- [ ] Record all six real-model editorial actions and recoverable evidence/runtime failures.
- [ ] Complete desktop accessibility checks beyond the accepted keyboard smoke.
- [ ] Resolve packaged-runtime acceptance scope and complete independent technical/security review (Gate B).
- [ ] After separately authorized consolidation/publication, prepare PR readiness and verify its published revision through the existing CI.
- [ ] Obtain human merge authorization (Gate C); define and approve Phase 6.5 specifications before its implementation. Release/tag requires separate Gate D authorization.

## Historical Phase 5 checklist

Current follow-up evidence and AntiGravity script: [Slice 8 cancellation/focus validation](docs/testing/PHASE-6.4-SLICE-8-CANCELLATION-FOCUS-VALIDATION.md). Prior reports preserve their historical test counts and acceptance limits.

- [x] ETAPA 0: GITOPS & PRESERVAÇÃO DE HISTÓRICO
  - [x] Commit `docs/GOVERNANCE.md`
  - [x] Commit `spikes/`

- [/] Fase 5.1: O Núcleo Nativo (Rust Core & Security)
  - [x] Implementar PKI (Ed25519, SHA-256, Atomic Rename) em `src-tauri/src/`
  - [x] Implementar Detecção de Hardware (RAM, CPU) em `src-tauri/src/`
  - [ ] Escrever `cargo test` para os módulos da Fase 5.1
  - [ ] Atualizar `CHANGELOG.md`
  - [ ] Commit da Fase 5.1 localmente

- [ ] Fase 5.2: O Supervisor de IA (Sidecar IPC)
  - [ ] Comando Tauri para spawn do Sidecar
  - [ ] Leitura de `stdout` e emissão de eventos
  - [ ] Comando Tauri `cancel_inference` com `kill` via Job ID

- [ ] Fase 5.3: Adapters & Máquina de Estados (TypeScript)
  - [ ] Definir Enums `ModelStatus` e `GenerationStatus`
  - [ ] Refatorar Adapters de IA do frontend (remover Gemini fallback)
  - [ ] Lógica de Graceful Degradation baseada em hardware

- [ ] Fase 5.4: Interface e UX (React)
  - [ ] Modal de Provisionamento com barra de progresso
  - [ ] Typewriter effect nos eventos Tauri
  - [ ] Bloqueio Freemium (`aria-disabled="true"`)
