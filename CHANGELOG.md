# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to Semantic Versioning.

## [Unreleased]

### Added
- **Phase 6.3 - Context-Aware Editorial AI Orchestration:** Implementação da fronteira de autoridade de orquestração em Rust, removendo a inferência bruta do IPC frontend (release raw inference IPC restriction).
- **Phase 6.3 - Seis Ações Editoriais Formais:** Research Gaps, Plain Language, Inclusive Validator, Alt Text WCAG, SEO, e Editorial Review (implementadas na política estática do orchestrator em Rust separada dos dados do CMS).
- **Phase 6.3 - Context Projection & Budget:** Projeções estritas do contexto do editor (Title, Content, Notes, etc.) com orçamentos de caracteres (Budget) possuindo um limite fixo (fallback de 8.000 caracteres de input quando a capacidade for desconhecida), protegendo contra excesso de tokens.
- **Phase 6.3 - Milestone:** Integração do PR #1 e geração da tag de milestone da Fase 6.3.
- **Phase 6.2 - Developer Runtime & Ollama Selection:** Suporte ao runtime de desenvolvedor via Ollama local, com capacidade de seleção explícita de provedores para desenvolvimento (capacidade manual local sem política automática de fallback em produção).
- **Phase 5.1 - Native Rust Core & Security:** Implementação de módulos nativos em Rust (`src-tauri/src/hardware.rs` e `src-tauri/src/provisioning.rs`) para detecção de capacidades de Hardware (RAM e CPU) e validação da Supply Chain de modelos locais via PKI (Ed25519) e SHA-256.
- **Phase 5.2 - Sidecar IPC Supervisor:** Implementação de `src-tauri/src/ai_supervisor.rs` com Job Registry thread-safe (`Mutex<HashMap<String, Child>>`), Tauri Commands assíncronos (`start_inference`, `cancel_inference`), streaming de tokens via `ai-stream-token` events e cancelamento cooperativo via `child.kill()`.
- **Phase 5.3 - Frontend State Machine & IPC Adapter:** Criação de `types/ai.ts` (6 estados Model + 8 estados Generation), `lib/adapters/localAiAdapter.ts` (SSR-safe Tauri IPC bridge) e 11 testes Vitest para validação de tipos e isolamento de Jobs.

### Changed
- **Ollama Gateway:** Evolução do provisionamento e runtime de IA local.
- **AiAssistantModal:** Removida a chamada `fetch('/api/gemini/editorial')` e substituída por streaming local via Tauri IPC com typewriter effect (requestAnimationFrame) e botão de cancelamento.
- **ArticleModal:** Mesma migração de Gemini para IPC local nas Quick AI Actions.

### Removed
- **`app/api/gemini/editorial/route.ts`:** Rota de API do Gemini deletada. O Retranca OS agora opera com uma arquitetura de orquestração de IA local suportando caminhos de Sidecar e Ollama.

## [1.1.0] - 2026-09-07

### Added
- **Proxy SQLite Local (Tauri v2):** Implementação de persistência de dados local-first offline. Comunicação direta via Tauri IPC utilizando o driver nativo `@tauri-apps/plugin-sql` em conjunto com o `drizzle-orm`.
- **Módulo de Governança (Offline CRUD):** Interface própria e estrita para edição e visualização de documentos de governança (PRD, SDD, TSD) via `GovernanceEditor` e `GovernanceList`.
- **Bloco de Notas Editoriais:** Adição de funcionalidades de rascunho acopladas diretamente na pauta da interface.
- **Lógica Freemium e IA (Histórico):** Proteção semântica da interface via padrão histórico (UI Freeze). A acessibilidade WCAG AAA é mantida como norte arquitetural durante estes estados.

### Changed
- **Padrão Bidirecional de Adapters (`articleAdapter.ts`, `governanceAdapter.ts`):** O armazenamento da aplicação foi completamente desacoplado da interface visual para garantir o encapsulamento. Os componentes não recebem estruturas de banco, apenas os Props estritamente tipados mapeados.
- **Integração de Testes Unitários:** Implementação de testes robustos (Jest) para assegurar a correspondência perfeita das abstrações Drizzle para os mocks de UI (`adapters/__tests__/articleAdapter.test.ts`).

## [1.0.0] - 2026-08-10

### Added
- **Kanban Editorial Board:** Full drag-and-drop support with states (Ideia, Pesquisa, Escrita, Revisão, Publicado).
- **Local CMS Entity:** Individual article modal featuring metadata input, checklists, and summary fields.
- **Multimodal AI Assistant Modal (Histórico):**
  - Integração histórica inicial em nuvem (Gemini 3.5 Flash) que validou a necessidade de IA na ferramenta, agora suplantada pela capacidade de orquestração de IA local suportada pelo Rust.
- **Rich AI Output Rendering:** Added `react-markdown` e `remark-gfm` + `@tailwindcss/typography` para formatar adequadamente as respostas da IA na UI.
- **Gamification:** Publish celebration triggers when moving articles to the final pipeline step.
- **Advanced Documentation:** Added PRD, SDD, C4 model diagrams, and technical specifications tailored for both human developers and autonomous AI agents.
