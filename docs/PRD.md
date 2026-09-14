---
jinc-prd-version: 1.1.0
project-name: Jornalista Inclusivo OS
feature-name: Core Platform Local-First Migration
status: approved
related-branch: main
product-context: desktop
created-at: 2026-08-10
last-updated: 2026-09-13
authors: AI Assistant (Orchestrator)
---

> **CURRENT BASELINE NOTE:**
> This PRD originated from an earlier platform baseline (Tauri/SQLite migration). It documents historical context and initial product requirements.
> As of Phase 6.3, the system has evolved to a **100% Provisioned Local AI** orchestration model (Ollama / Rust backend).
> **Approved phase-specific specifications and ADRs (e.g., `docs/specifications/phase-6.3/`, `ADR-008-EDITORIAL-AI-ORCHESTRATION-BOUNDARY.md`) supersede conflicting historical implementation details below.**

# 📄 Product Requirements Document (PRD): Jornalista Inclusivo OS

## 1. O Problema
Jornalistas e criadores de conteúdo enfrentam dificuldades para produzir materiais acessíveis (WCAG 2.2) e livres de vieses. O protótipo validou a necessidade, mas a operação diária de uma redação exige altíssima privacidade e segurança sobre os dados brutos e pautas em andamento. Aplicativos baseados em Cloud não atendem ao requisito estrito de segurança jornalística local.

## 2. Usuários-Alvo (Personas)
- **Jornalista/Redator(a):** Profissional de conteúdo que precisa criar textos, proteger suas fontes/dados e garantir acessibilidade antes da publicação final.
- **Editor(a)/Revisor(a):** Foco em qualidade, fluxo, Linguagem Simples e acompanhamento visual sem latência.

## 3. Solução Proposta e Requisitos Funcionais
O **Jornalista Inclusivo OS** é um sistema completo de gestão editorial operando **100% offline** (Local-First). 

### Funcionalidades Core
- **Soberania de Dados:** Todo o processamento (incluindo IA Generativa via inferência local em Rust) e armazenamento ocorrem na máquina do usuário.
- **Quadro Kanban Editorial:** Gestão visual de pautas (Ideia, Pesquisa, Escrita, Revisão, Publicado).
- **CMS Local Integrado:** Mini-CMS completo em cada card de pauta.
- **Módulo de Governança:** CRUD completo para documentos de governança (BRD, PRD, SDD, TSD). Edição baseada em `<textarea>` Markdown puro (sem WYSIWYG) e salvamento explícito (sem auto-save) para segurança e acessibilidade.

### Padrão Arquitetural: "UI Freeze" (Histórico)
- **Regra de Transição:** Durante a migração inicial para Desktop/SQLite, definiu-se um "UI Freeze" onde nenhum componente visual existente poderia ser alterado, forçando o uso de um Adapter Pattern. Hoje, o design system evolui de forma controlada através de fluxos de governança específicos.

### Assistente IA de Redação (100% Provisioned Local AI)
- A aplicação utiliza inferência local via backend Rust (`ollama-gateway`) garantindo privacidade absoluta (Context-Aware Editorial AI Orchestration).
- O acesso a recursos e orquestração de identidade é tratado progressivamente (detalhes de login e autenticação distribuída são explicitamente deferidos para a Fase 6.4).

## 4. Requisitos de Acessibilidade (Mandatório)
- **Aderência a padrões elevados:** Componentes de interface desenhados para garantir suporte a `focus-visible` com anéis de foco, alta taxa de contraste e atalhos de teclado de forma estrita. (Embora a conformidade AAA total exija avaliações adicionais dependendo do caso de uso final).

## 5. Non-Goals (O que não faremos)
- Não é um CMS com banco de dados em nuvem.
- Implementações de autenticação distribuída (login/identidade) são diferidas explicitamente para a Fase 6.4.

## 6. Métricas de Sucesso (SMART)
- Tempo de inicialização do app desktop nativo Tauri abaixo de 2s.
- Executar todas as funções editoriais (CRUD e inferência AI) sem conexão à internet.

## 7. Considerações Técnicas (SDD Handoff)
- **Frontend/Shell:** Next.js (SSG Export estático) empacotado via Tauri v2.
- **Backend/Data/AI:** SQLite local via Drizzle ORM comunicado por Tauri IPC. Orquestração editorial local via backend Rust.
- **Adapter Pattern:** Camada de serviço intermediária responsável por formatar dados do SQLite exatamente no formato das interfaces (types).

---

## Downstream Pipeline
- **SDD (Architecture):** Arquitetura C4 Desktop e Adapter Pattern.
- **TSD (Technical Spec):** Integração Tauri + SQLite + Next.js estático.

**PRD Status:** approved
**Ready for SDD:** yes
