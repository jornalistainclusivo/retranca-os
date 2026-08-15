# 🗞️ Jornalista Inclusivo OS (Retranca)

> Sistema Operacional Editorial Desktop focado em acessibilidade digital (WCAG 2.2), linguagem simples (Plain Language) e jornalismo anti-capacitista/antirracista.

O Jornalista Inclusivo OS é um Kanban e mini-CMS desktop nativo desenhado para eliminar a fricção técnica na criação de conteúdo acessível. Com soberania local total (offline-first), a plataforma integra a inclusão diretamente no fluxo de concepção.

## 🚀 Quick Start

### Pré-requisitos
- Node.js (v18+)
- Rust e Cargo (para compilação nativa)
- NPM

### Instalação e Execução

1. Clone o repositório e instale as dependências:
   ```bash
   npm install
   ```
2. (Opcional) Configure variáveis de ambiente copiando `.env.example` para `.env` se for utilizar funcionalidades externas.
3. Inicie o ambiente de desenvolvimento desktop (Next.js + Tauri):
   ```bash
   npx tauri dev
   ```
4. Para gerar o build nativo de produção (.msi / .exe):
   ```bash
   npm run build
   npx tauri build
   ```

## ✨ Features

- **Arquitetura Desktop Nativa**: Construído com Tauri v2, garantindo soberania local, segurança e alta performance.
- **Armazenamento Offline-First**: Banco de dados SQLite local, orquestrado via Drizzle ORM e integração IPC direta (sem servidores Node.js embarcados).
- **Quadro Kanban Editorial**: Workflow visual (Ideia → Pesquisa → Escrita → Revisão → Publicado).
- **CMS Local & Metadados**: Formulários estendidos por pauta para gestão de checklists, personas e links.
- **Gamificação Leve**: Sistema de conquistas ativado na transição de pautas para "Publicado".
- **Garantia de Acessibilidade (Frozen UI)**: Interface visual blindada para preservar aderência estrita à WCAG 2.2 AAA.

## ⚙️ Configuration

A aplicação é projetada para rodar de forma autônoma e offline. Variáveis de ambiente são utilizadas estritamente para integrações opcionais (como as antigas funções de IA via Web).

| Variável | Descrição | Padrão |
| -------- | ----------- | ------- |
| `GEMINI_API_KEY` | Chave de API do Google Gemini (se aplicável a plugins de IA) | - |

## 📚 Documentation (Humans & AI Agents)

Toda a documentação arquitetural e de produto reside no diretório `/docs`. Nossos documentos seguem rigorosos padrões de governança, servindo como *Single Source of Truth* (SSOT).

- **[PRD (Product Requirements Document)](./docs/PRD.md):** Visão do produto, problemas resolvidos e personas.
- **[SDD (Software Design Document)](./docs/SDD.md):** Arquitetura técnica e contratos (C4 Model).
- **[TSD (Technical Specification Document)](./docs/TSD.md):** Detalhes da implementação técnica atual (Tauri, IPC, Drizzle, SQLite).
- **[Blueprint](./retranca-fullstack-blueprint.md):** Blueprint da arquitetura fullstack desktop.

### 🤖 LLM & AI Developer Context (llms.txt compatível)

- **Tech Stack:** Next.js 15 (App Router - Static Export), Tauri v2, Rust, SQLite, Drizzle ORM, TailwindCSS v4, Lucide React.
- **Arquitetura IPC:** Não há Server Actions (Node.js backend). O banco de dados SQLite é gerido localmente via Rust/Tauri IPC e abstraído no client-side via Drizzle ORM.
- **Core Files:**
  - `src-tauri/src/lib.rs`: Entrypoint minimalista do core nativo (Tauri), utilizando capacidades Zero-Trust.
  - `db/schema.ts` e `db/index.ts`: Definições do schema e singleton de conexão SQLite/IPC.
  - `lib/api/articles.ts`: Camada DAO cliente para operações de banco via IPC.
  - `lib/adapters/articleAdapter.ts`: Adapter pattern que traduz entidades de banco para as propriedades congeladas de interface.

## 🤝 Contributing

O desenvolvimento segue as diretrizes metodológicas da iniciativa JINC Apps. 
As alterações visuais (`components/`) estão sob **UI Freeze** para garantir conformidade contínua com a WCAG 2.2 AAA. Ao contribuir para o Core Nativo ou camada DAO, exija cobertura de testes unitários e respeite o modelo Zero-Trust de capabilities do Tauri.

## 📄 License

MIT
