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
- [ ] Slice 8 acceptance closure: real-runtime/cancellation, manual accessibility, packaged runtime, and exact-commit remote CI evidence.
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
