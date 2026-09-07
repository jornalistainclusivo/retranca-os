# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to Semantic Versioning.

## [Unreleased]

### Added
- **Phase 5.1 - Native Rust Core & Security:** Implementação de módulos nativos em Rust (`src-tauri/src/hardware.rs` e `src-tauri/src/provisioning.rs`) para detecção de capacidades de Hardware (RAM e CPU) e validação da Supply Chain de modelos locais via PKI (Ed25519) e SHA-256.
- **Phase 5.2 - Sidecar IPC Supervisor:** Implementação de `src-tauri/src/ai_supervisor.rs` com Job Registry thread-safe (`Mutex<HashMap<String, Child>>`), Tauri Commands assíncronos (`start_inference`, `cancel_inference`), streaming de tokens via `ai-stream-token` events e cancelamento cooperativo via `child.kill()`.

## [1.1.0] - 2026-09-07

### Added
- **Proxy SQLite Local (Tauri v2):** Implementação de persistência de dados local-first offline. Comunicação direta via Tauri IPC utilizando o driver nativo `@tauri-apps/plugin-sql` em conjunto com o `drizzle-orm`.
- **Módulo de Governança (Offline CRUD):** Interface própria e estrita para edição e visualização de documentos de governança (PRD, SDD, TSD) via `GovernanceEditor` e `GovernanceList`.
- **Bloco de Notas Editoriais:** Adição de funcionalidades de rascunho acopladas diretamente na pauta da interface.
- **Lógica Freemium e IA:** Proteção semântica e congelamento de interface (UI Freeze) ao invocar o assistente Gemini (bloqueio de funcionalidades premium na tier grátis). A acessibilidade WCAG AAA foi mantida nestes estados.

### Changed
- **Padrão Bidirecional de Adapters (`articleAdapter.ts`, `governanceAdapter.ts`):** O armazenamento da aplicação foi completamente desacoplado da interface visual para garantir o UI Freeze. Os componentes não recebem estruturas de banco, apenas os Props estritamente tipados mapeados.
- **Integração de Testes Unitários:** Implementação de testes robustos (Jest) para assegurar a correspondência perfeita das abstrações Drizzle para os mocks de UI (`adapters/__tests__/articleAdapter.test.ts`).

## [1.0.0] - 2026-08-10

### Added
- **Kanban Editorial Board:** Full drag-and-drop support with states (Ideia, Pesquisa, Escrita, Revisão, Publicado).
- **Local CMS Entity:** Individual article modal featuring metadata input, checklists, and summary fields.
- **Multimodal AI Assistant Modal:** 
  - Integration with `@google/genai` (Gemini 3.5 Flash).
  - Prompts dedicated to Plain Language, SEO, Alt Text (WCAG 2.2), Accessibility, and Inclusivity Validation.
  - Image upload support to generate Alt Text via computer vision.
  - File upload support (`.md`, `.txt`, `.csv`, `.json`) to pass large context to the AI model.
- **Rich AI Output Rendering:** Added `react-markdown` and `remark-gfm` + `@tailwindcss/typography` to properly format Gemini's responses in the UI.
- **Gamification:** Publish celebration triggers when moving articles to the final pipeline step.
- **Advanced Documentation:** Added PRD, SDD, C4 model diagrams, and technical specifications tailored for both human developers and autonomous AI agents.
