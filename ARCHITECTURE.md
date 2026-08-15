# Arquitetura do Retranca OS

## Stack Tecnológico
- **Framework**: Next.js 15 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS v4
- **Ícones**: Lucide React
- **IA**: `@google/genai` (Gemini)

## Estrutura de Diretórios
- `app/`: Configuração das rotas do Next.js e página principal (`page.tsx`).
- `components/`: Componentes de UI reutilizáveis (KanbanBoard, ListView, CalendarView, StatsView, etc.).
- `lib/`: Lógica de utilitários, dados iniciais (`initialData.ts`) e gerenciamento de armazenamento (`storage.ts`).
- `types/`: Definições de tipos do TypeScript.
- `docs/`: Documentos do projeto (PRD, SDD).

## Gerenciamento de Estado e Persistência
- O estado das pautas é gerenciado globalmente na página principal e persistido via `localStorage`.
- Um fallback para `initialData` é utilizado na ausência de dados locais.
