# 🗞️ Jornalista Inclusivo OS (Retranca)

> Sistema Operacional Editorial focado em acessibilidade digital (WCAG 2.2), linguagem simples (Plain Language) e jornalismo anti-capacitista/antirracista, empoderado por IA Generativa.

O Jornalista Inclusivo OS é um Kanban e mini-CMS local desenhado para eliminar a fricção técnica na criação de conteúdo acessível. Em vez de tratar a inclusão como uma etapa corretiva final, a plataforma a integra diretamente no fluxo de concepção através de um Assistente de IA avançado (Google Gemini).

## 🚀 Quick Start

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Configure as chaves de API (veja a seção **Configuração**).
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. Acesse `http://localhost:3000`.

## ✨ Funcionalidades

- **Quadro Kanban Editorial**: Workflow visual (Ideia → Pesquisa → Escrita → Revisão → Publicado).
- **Assistente IA Multimodal**: 
  - Gerador de Esboço de Pauta (Linguagem Simples)
  - Gerador de Alt Text WCAG 2.2 (Suporte a upload de imagens)
  - Otimização SEO (Title, Meta, LSI)
  - Auditoria de Acessibilidade
  - **Validador Inclusivo**: Identificação de viés cognitivo/capacitista e aderência a neurodiversidade.
- **Upload de Contexto**: Envie `.md`, `.txt`, `.csv` ou `.json` diretamente para a IA analisar.
- **CMS Local & Metadados**: Formulários estendidos por pauta para gestão de checklists, personas e links.
- **Gamificação Leve**: Sistema de conquistas ativado na transição de pautas para "Publicado".
- **Local First**: Armazenamento focado em privacidade usando `localStorage`.

## ⚙️ Configuração

Para o assistente de IA funcionar, defina a seguinte variável de ambiente em um arquivo `.env` na raiz do projeto:

| Variável | Descrição | Obrigatório |
| -------- | ----------- | ------- |
| `GEMINI_API_KEY` | Chave de API do Google Gemini (usado no modelo 3.5 Flash) | Sim |

*Copie `.env.example` para `.env` se disponível e insira sua chave.*

## 📚 Documentação (Humans & AI Agents)

Toda a documentação arquitetural e de produto reside no diretório `/docs`. Esses documentos seguem formatos amigáveis tanto para desenvolvedores humanos quanto para LLMs/Agentes (Módulos C4 e Gherkin integrados).

- **[PRD (Product Requirements Document)](./docs/PRD.md):** Visão do produto, problemas resolvidos e personas.
- **[SDD (Software Design Document)](./docs/SDD.md):** Arquitetura técnica e contratos (C4 Model).
- **[Especificações Técnicas](./docs/specs/core-platform/spec.md):** Contratos da API (`spec.openapi.yaml`), esquemas tipados (`spec.types.ts`) e diagramas de estado.

### 🤖 LLM & AI Developer Context (llms.txt compatível)
- **Tech Stack:** React 19, Next.js 15 (App Router), TailwindCSS v4, Lucide React, Google Gen AI SDK.
- **Backend/AI:** As chamadas para a API do Gemini ocorrem **exclusivamente via Server-Side Route Handlers** (`app/api/gemini/editorial/route.ts`). Nunca exponha a API Key no frontend.
- **Core Files:**
  - `components/AiAssistantModal.tsx`: Interface do Assistente IA (suporta uploads multimodais via `FileReader` base64).
  - `app/api/gemini/editorial/route.ts`: Endpoint orquestrador da IA, injeta o System Prompt especializado em Jornalismo Inclusivo.
  - `components/ArticleModal.tsx`: O CMS local / Formulário de edição da pauta.

## 📄 License

MIT
