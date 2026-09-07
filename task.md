# Phase 5 Production Implementation (Native Rust LLM)

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
