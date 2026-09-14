---
jinc-sdd-version: 1.1.0
project-name: Jornalista Inclusivo OS
project-context: desktop
status: approved
related-branch: main
tech-stack: Next.js 16, React, Tauri v2, SQLite, Drizzle ORM, Rust
created-at: 2026-08-10
last-updated: 2026-09-13
authors: AI Assistant (Orchestrator)
---

> **CURRENT BASELINE NOTE:**
> This SDD originated from an earlier platform baseline (Tauri/SQLite migration). It documents historical context and initial architectural decisions.
> As of Phase 6.3, the system has evolved to a **100% Provisioned Local AI** orchestration model (Ollama / Rust backend).
> **Approved phase-specific specifications and ADRs (e.g., `docs/specifications/phase-6.3/`, `ADR-008-EDITORIAL-AI-ORCHESTRATION-BOUNDARY.md`) supersede conflicting historical implementation details below.**

# 📐 Software Design Document (SDD): Jornalista Inclusivo OS

## 1. North Star
O Jornalista Inclusivo OS elimina a fricção técnica da acessibilidade web (WCAG) operando como um aplicativo desktop ultrarrápido. O foco absoluto nesta fase é a **Soberania de Dados** e **Operação Offline** via arquitetura Local-First, empacotando o frontend já estabelecido (historicamente restrito pelo "UI Freeze" durante a migração inicial).

## 2. Escopo Funcional
*   **Kanban Editorial:** Sistema de estados offline-first.
*   **CMS de Pauta e Checklists:** Armazenamento ACID seguro localmente.
*   **Gestão de Governança:** Módulo CRUD offline para documentação técnica e estratégica (BRD/PRD) utilizando a tabela preexistente `governance_docs`.
*   **Orquestração de IA Local:** Serviços de IA orquestrados exclusivamente pelo backend nativo em Rust comunicando-se com Ollama.
*   **Adapter Pattern de Isolamento:** Os componentes React UI desconhecem a fonte de dados e os detalhes de orquestração de IA, mantendo fronteiras claras de responsabilidade.

## 3. Arquitetura C4 (Desktop App)
A topologia Client-Server HTTP tradicional é substituída pela topologia Desktop (Tauri). O frontend construído em Next.js é exportado de forma estática e roda no WebView do OS hospedeiro. A aplicação acessa o backend em Rust utilizando IPC (Inter-Process Communication) estruturado.

*   [Diagrama de Contexto](./diagrams/c4-context.md)
*   [Diagrama de Container](./diagrams/c4-container.md)

## 4. Contratos de Dados (API & Estado Local)

### 4.1. O "Adapter Pattern"
A comunicação entre o banco relacional (SQLite), o supervisor de IA em Rust, e a UI é mediada por adapters mapeadores. O banco de dados retorna linhas desnormalizadas, e a função `toArticleProps` reestrutura no formato esperado:

```typescript
// Exemplo de contrato de Adapter (lib/adapters/articleAdapter.ts)
export const toArticleProps = (
  dbArticle: DbArticle,
  dbChecklists: DbChecklist[],
  dbHistory: DbHistory[]
): Article => {
  return {
    id: dbArticle.id,
    title: dbArticle.title,
    status: dbArticle.status as ArticleStatus,
    categoryTag: dbArticle.categoryTag as CategoryTag,
    tags: JSON.parse(dbArticle.tags),
    // ... mapeamentos diretos 1:1 ...
    checklists: dbChecklists.map(c => ({
      id: c.id,
      label: c.label,
      completed: Boolean(c.completed),
      category: c.category
    })),
    history: dbHistory.map(h => ({
      id: h.id,
      date: h.date,
      action: h.action
    }))
  }
}
```

## 5. Tech Stack & ADRs
*   **Desktop Container:** Tauri v2 gerenciando janelas, Rust IPC, e Sidecars.
*   **Frontend:** React, Next.js 16 compilado como Static Site Generation (`output: 'export'`).
*   **Banco de Dados Embutido:** SQLite utilizando `@tauri-apps/plugin-sql` acionado a partir do cliente.
*   **ORM e Tipagem:** `drizzle-orm/tauri-sqlite` com `zod` para schema declarations e validações seguras das entradas.
*   **ADR 003 - Tauri IPC:** Chamadas de banco não usam proxy Node/Express.
*   **ADR 004 - UI Freeze (Histórico):** O diretório `components/` foi tratado como inviolável durante a migração SQLite para garantir que as refatorações estruturais em página se limitassem a trocar os disparadores.
*   **ADR 005 - Governança Segura (UX):** Edição de documentos de governança exige Markdown sobre `<textarea>` para prevenir Keyboard Traps.
*   **ADR 008 - Editorial AI Orchestration Boundary:** Delega orquestração de IA para Rust.

## 6. Definition of Done (DoD)
*   ✅ Executável `.exe` (Tauri) final gerado com sucesso, contendo frontend webview e backend SQLite embutido.
*   ✅ Fluxos core executam perfeitamente sem conectividade de internet (dependendo de modelos locais provicionados).

## 7. Fases de Entrega
*   **V1 (Migração Tauri MVP):** Desktop wrapper Tauri, SQLite (Drizzle), Adapter Pattern preservando interface.
*   **V2 (Local AI Orchestration):** Integração via Phase 6.3 de um modelo autoritativo em Rust para fluxos de IA.
