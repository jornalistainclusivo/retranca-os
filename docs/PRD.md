---
jinc-prd-version: 1.1.0
project-name: Jornalista Inclusivo OS
feature-name: Core Platform Local-First Migration
status: approved
related-branch: main
product-context: desktop
created-at: 2026-08-10
last-updated: 2026-08-15
authors: AI Assistant (Orchestrator)
---

# 📄 Product Requirements Document (PRD): Jornalista Inclusivo OS

## 1. O Problema
Jornalistas e criadores de conteúdo enfrentam dificuldades para produzir materiais acessíveis (WCAG 2.2) e livres de vieses. O protótipo validou a necessidade, mas a operação diária de uma redação exige altíssima privacidade e segurança sobre os dados brutos e pautas em andamento. Aplicativos baseados em Cloud não atendem ao requisito estrito de segurança jornalística local.

## 2. Usuários-Alvo (Personas)
- **Jornalista/Redator(a):** Profissional de conteúdo que precisa criar textos, proteger suas fontes/dados e garantir acessibilidade antes da publicação final.
- **Editor(a)/Revisor(a):** Foco em qualidade, fluxo, Linguagem Simples e acompanhamento visual sem latência.

## 3. Solução Proposta e Requisitos Funcionais
O **Jornalista Inclusivo OS** é um sistema completo de gestão editorial operando **100% offline** (Local-First). 

### Funcionalidades Core
- **Soberania de Dados:** Todo o processamento (exceto chamadas explicitas de IA generativa) e armazenamento ocorrem na máquina do usuário via SQLite integrado ao Desktop App. Operação 100% offline para todas as views e edições.
- **Quadro Kanban Editorial:** Gestão visual de pautas (Ideia, Pesquisa, Escrita, Revisão, Publicado).
- **CMS Local Integrado:** Mini-CMS completo em cada card de pauta.

### Restrição Crítica: "UI Freeze" (Congelamento de Interface)
- **Regra de Ouro:** Nenhum componente visual existente, classe CSS Tailwind, ou marcação semântica HTML pode ser alterado durante a migração para Desktop/SQLite. 
- A fidelidade visual, de animações e a estrutura de "props" do protótipo atual devem ser mantidas de forma estrita.

### Assistente IA de Redação (Gemini Flash)
- **Operação Híbrida/Opcional:** A integração da IA é a única feature que consome rede externa. Se o usuário estiver offline, a aplicação principal continuará funcionando perfeitamente.

## 4. Requisitos de Acessibilidade (Mandatório)
- **WCAG 2.2 AAA preservado:** Interface protegida via UI Freeze garantindo suporte a focus-visible com anéis de foco, alta taxa de contraste e atalhos de teclado.

## 5. Non-Goals (O que não faremos)
- Não é um CMS com banco de dados em nuvem.
- Não requer login ou sincronização multi-dispositivo nesta versão.
- **Não haverá refatoração do Layout/UI.**

## 6. Métricas de Sucesso (SMART)
- Tempo de inicialização do app desktop nativo Tauri abaixo de 2s.
- Executar todas as funções editoriais (CRUD) sem conexão à internet.
- 0% de quebras visuais ao migrar do Mock LocalStorage para o SQLite Tauri.

## 7. Considerações Técnicas (SDD Handoff)
- **Frontend/Shell:** Next.js (SSG Export estático) empacotado via Tauri v2.
- **Backend/Data:** SQLite local via Drizzle ORM comunicado por Tauri IPC (Inter-Process Communication).
- **Adapter Pattern:** Camada de serviço intermediária responsável por formatar dados do SQLite exatamente no formato das interfaces (types) já esperadas pela UI congelada.

---

## Downstream Pipeline
- **SDD (Architecture):** Arquitetura C4 Desktop e Adapter Pattern.
- **TSD (Technical Spec):** Integração Tauri + SQLite + Next.js estático.

**PRD Status:** approved
**Ready for SDD:** yes
