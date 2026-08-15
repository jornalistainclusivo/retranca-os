---
jinc-sdd-version: 1.1.0
project-name: Jornalista Inclusivo OS
project-context: desktop
status: draft
related-branch: main
tech-stack: Next.js, React, Tauri v2, SQLite, Drizzle ORM
created-at: 2026-08-10
last-updated: 2026-08-15
authors: AI Assistant (Orchestrator)
---

# 📐 Software Design Document (SDD): Jornalista Inclusivo OS

## 1. North Star
O Jornalista Inclusivo OS elimina a fricção técnica da acessibilidade web (WCAG) operando como um aplicativo desktop ultrarrápido. O foco absoluto nesta fase é a **Soberania de Dados** e **Operação Offline** via arquitetura Local-First, empacotando o frontend já estabelecido sem alterar a interface (UI Freeze).

## 2. Escopo Funcional
*   **Kanban Editorial:** Sistema de estados offline-first.
*   **CMS de Pauta e Checklists:** Armazenamento ACID seguro localmente.
*   **Adapter Pattern de Isolamento:** Os componentes React UI continuam desconhecendo a fonte de dados, mantendo as `props` idênticas.

## 3. Arquitetura C4 (Desktop App)
A topologia Client-Server HTTP tradicional é substituída pela topologia Desktop (Tauri). O frontend construído em Next.js é exportado de forma estática e roda no WebView do OS hospedeiro. Em vez de requisições web, a aplicação acessa o backend em Rust utilizando IPC (Inter-Process Communication).

*   [Diagrama de Contexto](./diagrams/c4-context.md)
*   [Diagrama de Container](./diagrams/c4-container.md)

## 4. Contratos de Dados (API & Estado Local)

### 4.1. O "Adapter Pattern" (Garantia do UI Freeze)
Como os componentes React e os tipos originais (em `types/editorial.ts`) estão congelados, a comunicação entre o banco relacional (SQLite) e a UI é mediada por adapters mapeadores. O banco de dados retorna linhas desnormalizadas, e a função `toArticleProps` reestrutura no formato esperado:

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
*   **Desktop Container:** Tauri v2 gerenciando janelas e Rust IPC.
*   **Frontend:** React, Next.js 15 compilado como Static Site Generation (`output: 'export'`).
*   **Banco de Dados Embutido:** SQLite utilizando `@tauri-apps/plugin-sql` acionado a partir do cliente.
*   **ORM e Tipagem:** `drizzle-orm/tauri-sqlite` com `zod` para schema declarations e validações seguras das entradas.
*   **ADR 003 - Tauri IPC:** Chamadas de banco não usam proxy Node/Express. Tudo corre através do plugin SQL embutido no Tauri Core, protegendo a base de dados de exposição de portas localhost.
*   **ADR 004 - UI Freeze:** O diretório `components/` é inviolável. Refatorações estruturais em página limitar-se-ão a trocar os disparadores (`localStorage` getters) pelas invocações `drizzle` no Client encapsulado.

## 6. Definition of Done (DoD)
*   ✅ Executável `.exe` (Tauri) final gerado com sucesso, contendo frontend webview e backend SQLite embutido.
*   ✅ Fluxos core (CRUD de artigos, manipulação de Kanban) executam perfeitamente sem conectividade de internet.
*   ✅ Identidade visual e marcação semântica dos componentes provados intactos após a integração via Adapters.

## 7. Fases de Entrega
*   **V1 (Migração Tauri MVP):** Desktop wrapper Tauri, SQLite (Drizzle), Adapter Pattern preservando interface. IAC e Setup completo para ambiente Desktop.
