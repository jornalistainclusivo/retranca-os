---
jinc-tsd-version: 1.1.0
project-name: Jornalista Inclusivo OS
status: approved
related-branch: main
last-updated: 2026-09-13
---

> **CURRENT BASELINE NOTE:**
> This TSD originated from an earlier platform baseline (Tauri/SQLite migration). It documents historical context and initial implementation details.
> As of Phase 6.3, the system has evolved to a **100% Provisioned Local AI** orchestration model (Ollama / Rust backend).
> **Approved phase-specific specifications and ADRs (e.g., `docs/specifications/phase-6.3/`, `ADR-008-EDITORIAL-AI-ORCHESTRATION-BOUNDARY.md`) supersede conflicting historical implementation details below.**

# Technical Specification Document (TSD)
## Especificação de Código e Acessibilidade

### 1. Padrões de Acessibilidade (Histórico do Frozen State)
Durante a migração para a arquitetura Desktop, estabeleceu-se uma regra de "UI Freeze" para proteger a marcação semântica e acessibilidade da interface, mantendo as conquistas do protótipo inicial:
- Ratios de contraste superiores a 7:1 (objetivo AAA).
- Suporte a navegação integral por teclado (focus ring visível `focus-visible:ring-2`).
- Atributos `aria-label`, `aria-expanded` e `role="region"` em modais e gavetas.
*(Nota: O "UI Freeze" foi uma técnica de migração. Componentes podem evoluir via processos formais de governança, mantendo rigorosos padrões WCAG).*

### 2. Stack Técnica Estrita e Integração Desktop
A aplicação abandonou componentes Node.js server-side em favor de uma integração Desktop nativa e IA local:
- **Frontend App:** Next.js (SSG).
- **Runtime:** Tauri v2 orquestrando uma janela Webview e um sidecar de backend em Rust.
- **Persistência Local:** SQLite integrado via ponte IPC.
- **ORM e Plugins:** Uso das bibliotecas `drizzle-orm` e `@tauri-apps/plugin-sql` + `drizzle-orm/tauri-sqlite`.

### 3. Modelagem de Dados Drizzle (SQLite)
Normalização do estado JSON do protótipo para schema relacional leve no SQLite:

- **`articles`**: `id` (TEXT, PK), `title` (TEXT), `status` (TEXT), `categoryTag` (TEXT), `tags` (TEXT json), `publishDate` (TEXT), `summary` (TEXT), `objective` (TEXT), `keyword` (TEXT), `persona` (TEXT), `cta` (TEXT), `internalLinks` (TEXT), `externalLinks` (TEXT), `estimatedTime` (TEXT), `spentTime` (TEXT), `notes` (TEXT), `createdAt` (TEXT), `updatedAt` (TEXT), `completedAt` (TEXT).
- **`checklist_items`**: `id` (TEXT, PK), `articleId` (TEXT, FK references articles.id), `label` (TEXT), `completed` (INTEGER 0|1), `category` (TEXT).
- **`history_entries`**: `id` (TEXT, PK), `articleId` (TEXT, FK references articles.id), `date` (TEXT), `action` (TEXT).

### 4. Tauri IPC Database Setup
A conexão ocorre no client (Webview) conectando ao Rust de forma assíncrona:
```typescript
import Database from '@tauri-apps/plugin-sql';
import { drizzle } from 'drizzle-orm/tauri-sqlite';
import * as schema from '@/db/schema';

export const initializeDb = async () => {
  const sqlite = await Database.load('sqlite:retranca.db');
  return drizzle(sqlite, { schema });
};
```

### 5. Rust Core Orchestration (lib.rs)
Historicamente focada apenas no SQLite, a inicialização em `lib.rs` foi expandida na Fase 6.3 para gerenciar a orquestração de IA de forma autoritativa. O backend Rust atua como supervisor, invocando Ollama, controlando orçamentos de contexto e impondo limites rígidos de segurança, mantendo a política de Zero-Trust no cliente web.
