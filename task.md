# Current work — Phase 6.4

- [x] Slice 6 corrective delivered in `6ce03fd`.
- [x] Human decision: open single edition, recorded in ADR-013 (2026-09-30).
- [x] Slice 7: dynamic AI recommendation semantics and removal of commercial capability gates implemented locally.
- [x] Current validation recorded: frontend 192, Rust debug/release 96, lint/build/security registration checks passed.
- [x] User-reported Windows desktop development smoke check (`npx tauri dev`) documented.
- [x] Local consolidation authorized by the product owner on 2026-09-30; review and contributor handoff recorded with this checkpoint.
- [ ] Slice 8: phase-wide integration/security hardening.
- [ ] Independent technical/security review (Gate B).
- [ ] Human merge authorization (Gate C).
- [ ] Human release/tag authorization (Gate D).

See [current validation and contributor handoff](docs/testing/PHASE-6.4-SLICE-7-OPEN-EDITION-VALIDATION.md). The product owner explicitly authorized review and a local commit for this round. Push, merge, tag, and release require separate authorization; this checklist does not grant them.

## Historical Phase 5 checklist

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
