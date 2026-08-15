# Retranca OS — Fullstack Blueprint v3

> **⚠️ DIRETRIZ DE CONGELAMENTO DE UI/UX EM VIGOR**
>
> Nenhum agente (incluindo `frontend-specialist` e `project-planner`) está autorizado a alterar o design visual, paleta de cores, classes de estilização, semântica HTML5 ou lógica interativa dos componentes existentes no diretório `components/`. A integração com dados reais DEVE ocorrer exclusivamente via Adapter Pattern na camada client-side. Os componentes de apresentação continuarão recebendo a mesma estrutura de props que os mocks atuais fornecem.

**Tipo de Projeto:** WEB → DESKTOP (via Tauri v2)
**Arquitetura:** Next.js Static Export + SQLite via Tauri IPC (Drizzle ORM)
**Princípio Operacional:** Execução em Dois Cliques — soberania local total offline-first.

---

## 1. Product Owner — Estratégia e Produto

### 1.1. Fluxo de Usuário (Inalterado do Protótipo)

1. **Dashboard Inicial:** Visualização multi-perspectiva (Kanban, Lista, Calendário, Estatísticas, Documentos de Governança).
2. **Gestão de Pauta (Article CRUD):** Criação e edição de pautas com metadados editoriais completos.
3. **Execução Editorial:** Checklists categorizados com toggle atômico.
4. **Auditoria e Gamificação:** Histórico de ações rastreável por pauta.
5. **Assistente IA:** Modal de IA integrado (o único ponto de contato web opcional).

### 1.2. Requisitos do MVP (Versão Conectada)

**Funcionais:**
- RF-01: CRUD completo de Articles com persistência em SQLite local (comunicado via Tauri IPC).
- RF-02: Toggle de checklist items com atualização otimista.
- RF-03: Mudança de status com registro automático.
- RF-04: Busca full-text e filtros.
- RF-05: Seed dinâmico do banco na primeira execução.

**Não Funcionais:**
- RNF-01: Tempo de inicialização < 2s.
- RNF-02: Dados 100% locais e persistidos no Filesystem do OS. Sem Node.js de proxy atuando como server.
- RNF-03: WCAG 2.2 AAA compliance mantido (herdado do protótipo congelado).

---

## 2. Project Planner — Engenharia e Arquitetura

### 2.1. Stack Tecnológica Estrita (Soberania Local)

| Camada        | Tecnologia              | Justificativa                                              |
| :------------ | :---------------------- | :--------------------------------------------------------- |
| **Frontend**  | Next.js 15 (SSG)        | Configuração `output: 'export'`. Operará 100% no client-side via WebView. |
| **ORM**       | `drizzle-orm`           | Integrado via driver `tauri-sqlite`.                       |
| **Banco**     | SQLite IPC              | Plugin nativo do Rust (`@tauri-apps/plugin-sql`). Zero Node.js embarcado. |
| **Desktop**   | Tauri v2                | WebView nativo do OS. Segurança e performance.             |
| **Validação** | Zod                     | Validação estrita de Adapters e inputs.                    |
| **Estilo / UI**| Tailwind CSS v4        | 🔒 Congelado. Sem alterações permitidas.                   |

### 2.2. Modelagem de Dados (Drizzle Schema — SQLite)

Derivado de `editorial.ts`:

- **`articles`**: `id` (TEXT, PK), `title` (TEXT), `status` (TEXT), `categoryTag` (TEXT), `tags` (TEXT json), `publishDate` (TEXT), `summary` (TEXT), `objective` (TEXT), `keyword` (TEXT), `persona` (TEXT), `cta` (TEXT), `internalLinks` (TEXT), `externalLinks` (TEXT), `estimatedTime` (TEXT), `spentTime` (TEXT), `notes` (TEXT), `createdAt` (TEXT), `updatedAt` (TEXT), `completedAt` (TEXT).
- **`checklist_items`**: `id` (TEXT, PK), `articleId` (TEXT, FK references articles.id), `label` (TEXT), `completed` (INTEGER 0|1), `category` (TEXT).
- **`history_entries`**: `id` (TEXT, PK), `articleId` (TEXT, FK references articles.id), `date` (TEXT), `action` (TEXT).

### 2.3. Adapter Pattern (Obrigatoriedade)

A camada de integração NÃO toca nos componentes visuais. O acesso ao banco ocorre no próprio client side invocando comandos assíncronos do Tauri IPC e passando por Adapters de validação.

```typescript
// Component Action -> api/dao.ts -> db.select() via Drizzle (Tauri IPC) -> Adapter -> UI Props
```

**Regra:** A função `toArticleProps()` DEVE retornar um objeto com a **exata mesma shape** da interface `Article` definida em `types/editorial.ts`. O componente UI desconhece a estrutura relacional do SQLite.

---

## 3. Orchestrator — Plano de Execução em Milestones

---

### Fase 1: Fundação & Infraestrutura (P0)

**Objetivo:** Estabelecer a base do Next.js exportado, projeto Tauri v2 e driver IPC.

**Tarefas Atômicas:**
- [ ] 1.1 — Configurar Next.js: Alterar `next.config.ts` para `output: 'export'` (remoção de Server Actions).
- [ ] 1.2 — Inicializar Tauri: Instalar Tauri CLI e inicializar diretório `src-tauri` (`npx tauri init`).
- [ ] 1.3 — Dependências Tauri: Instalar plugin no NPM (`@tauri-apps/plugin-sql`) e registrar `tauri-plugin-sql` no `Cargo.toml`.
- [ ] 1.4 — Instalar Drizzle: `drizzle-orm`, `drizzle-orm/tauri-sqlite`, `drizzle-kit`, `zod`.
- [ ] 1.5 — Configurar Schema: Criar `db/schema.ts` com tabelas normalizadas (`articles`, `checklist_items`, `history_entries`).
- [ ] 1.6 — Drizzle Kit: Gerar e rodar migrações SQL para desenvolvimento/uso embarcado.

---

### Fase 2: Integração & Adapters (Client-Side IPC) (P1)

**Objetivo:** Eliminar Node.js Server Actions. Implementar a ponte client-side com Tauri IPC e Adapters, substituindo o localStorage.

**Tarefas Atômicas:**
- [ ] 2.1 — Banco de Dados Singleton: Criar `db/index.ts` inicializando via `@tauri-apps/plugin-sql` (`Database.load('sqlite:retranca.db')`).
- [ ] 2.2 — Criar Camada de Adapters (`lib/adapters/articleAdapter.ts`):
  - Ex: `toArticleProps(dbArticle, dbChecklists, dbHistory)` que devolve tipo `Article`.
- [ ] 2.3 — Implementar Client-Side Data Access (`lib/api/`):
  - Funções CRUD assíncronas que invocam o Drizzle/Tauri IPC.
- [ ] 2.4 — Seed Dinâmico: Lógica na API para ler `lib/initialData.ts` e realizar INSERT relacional caso o banco retorne vazio na primeira execução.
- [ ] 2.5 — Refatorar `app/page.tsx` (App State):
  - Substituir leitura/gravação do localStorage por invocações aos métodos de API IPC.
  - O gerenciamento de estado react (useState) pode se manter, sendo inicializado via hook/useEffect.

---

### Fase 3: Empacotamento Desktop (P2)

**Objetivo:** Compilar Tauri e resolver caminhos de sistema operacional.

**Tarefas Atômicas:**
- [ ] 3.1 — Configurar `tauri.conf.json` definindo restrições de permissões (Capabilities) e paths do banco (acesso nativo a AppData e assets).
- [ ] 3.2 — Validar dev build com frontend integrado executando `npx tauri dev`.
- [ ] 3.3 — Compilar release via `npx tauri build` produzindo binários standalone `.exe` e/ou `.msi`.

---

### Fase 4: Auditoria de Integridade & Verificação (P3)

**Objetivo:** Validar que a transição não causou quebras na UX congelada.

**Tarefas Atômicas:**
- [ ] 4.1 — **Regressão Visual:** UX inalterada. Semântica mantida com `focus-visible`.
- [ ] 4.2 — **Soberania Total:** Aplicativo DEVE conseguir persistir pautas com Wi-Fi/rede desligados.
- [ ] 4.3 — **Auditoria Desktop:** Binário Tauri não expõe portas. Dados ficam seguros dentro do FS da máquina (`%APPDATA%` ou `~/.config`).
- [ ] 4.4 — **Git Tag:** Registrar `v1.0.0-mvp`.

---

## Apêndice A: Glossário de Decisões Arquiteturais

| Decisão | Escolha (v3) | Motivo |
|:--------|:-------------|:-------|
| Backend | Tauri IPC | Elimina totalmente servidor Node.js/Server Actions embarcado. |
| Renderização | Static Export (SSG) | O Next.js apenas compila HTML/JS/CSS estáticos, consumidos pelo WebView do Tauri. |
| ORM | Drizzle `tauri-sqlite` | Driver específico que faz as consultas relacionalmente enviando payloads via IPC p/ o Rust. |
| UI | 🔒 CONGELADA | Diretriz inegociável de acessibilidade e consistência visual herdada. |
