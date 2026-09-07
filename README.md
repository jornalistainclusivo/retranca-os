# 🗞️ Jornalista Inclusivo OS (Retranca)

> Sistema Operacional Editorial Desktop (Offline-First) focado em acessibilidade digital (WCAG 2.2), linguagem simples e jornalismo inclusivo.

O Retranca OS é um Kanban e mini-CMS desktop construído em Tauri v2 e Next.js. Com soberania local total via banco SQLite nativo, ele elimina a fricção técnica para criar conteúdo acessível de maneira privada e segura.

## 🚀 Quick Start

### Pré-requisitos
- Node.js (v18+)
- Rust e Cargo (para compilação nativa)

### Instalação e Execução

1. Clone o repositório e instale as dependências:
   ```bash
   npm install
   ```

2. (Opcional) Copie `.env.example` para `.env` se for utilizar os recursos freemium do Assistente de IA:
   ```bash
   cp .env.example .env
   ```

3. Inicie o ambiente de desenvolvimento desktop (Next.js + Tauri):
   ```bash
   npx tauri dev
   ```

## ✨ Features

- **Arquitetura Desktop Nativa**: App standalone super-rápido empacotado via Tauri v2.
- **Offline-First Absoluto**: Seus dados ficam na sua máquina. O banco SQLite opera diretamente sobre o disco (via Tauri IPC), sem expor portas ou servidores locais.
- **Workflow Editorial (Kanban)**: Gestão de pautas fluida (Ideia → Pesquisa → Escrita → Revisão → Publicado).
- **Módulo de Governança Seguro**: Documentação estrita utilizando editores Markdown simples, evitando "Keyboard Traps" (WCAG 2.2 AAA).
- **Assistente IA Multimodal (Opcional)**: Validação de linguagem inclusiva, alt texts para imagens e SEO, utilizando o Google Gemini.
- **Gamificação Leve**: Sistema de recompensas e comemoração por publicações.

## ⚙️ Configuration

A aplicação é autossuficiente e funciona totalmente offline. As variáveis de ambiente são utilizadas estritamente para desbloquear recursos premium/híbridos (IA).

| Variável | Descrição | Padrão |
| -------- | ----------- | ------- |
| `GEMINI_API_KEY` | Chave de API do Google Gemini (para assistente editorial) | - |

## 📚 Documentação Oficial (Single Source of Truth)

Toda a documentação arquitetural, especificações técnicas e regras de negócio **residem exclusivamente na pasta `/docs`**. Consultas fora dessa pasta para arquitetura são desencorajadas.

- **[PRD (Product Requirements Document)](./docs/PRD.md):** Visão, escopo e requisitos (incluindo Freemium e Inclusão).
- **[SDD (Software Design Document)](./docs/SDD.md):** Arquitetura C4, Tauri IPC, Banco e Adapters.
- **[TSD (Technical Specification Document)](./docs/TSD.md):** Setup técnico e implementação de integração contínua (Jest, SQLite).
- **[Blueprint da Arquitetura](./retranca-fullstack-blueprint.md):** O mapa mestre para a fundação e milestones do projeto Desktop.

> **Importante para Agentes Autônomos:** Não procure ou recrie o arquivo `ARCHITECTURE.md` na raiz do projeto. Toda a inteligência arquitetural foi unificada no SDD e Blueprint.

## 🤝 Contribuições e UI Freeze

Este projeto encontra-se sob estrita governança da iniciativa JINC Apps. 
A pasta de componentes visuais (`components/`) está sob **UI Freeze** (Congelamento). Todas as integrações com o banco de dados devem ocorrer na camada client-side por meio de **Adapters** tipados (`lib/adapters/`), garantindo que os componentes mantenham adesão intransigente à acessibilidade (WCAG 2.2 AAA).

## 📄 License

MIT
