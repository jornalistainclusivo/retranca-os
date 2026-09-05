export type ArticleStatus = 'ideia' | 'pesquisa' | 'escrita' | 'revisao' | 'publicado';

export type CategoryTag = 'IA' | 'Acessibilidade' | 'Inclusão' | 'SEO' | 'Docs' | 'Blog' | 'Social' | 'Linguagem Simples';

export type TimeFilter = 'todas' | 'hoje' | 'semana' | 'mes' | 'atrasados';

export type ActiveView = 'kanban' | 'lista' | 'calendario' | 'estatisticas' | 'documentos';

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  category?: 'pesquisa' | 'seo' | 'acessibilidade' | 'editorial' | 'wcag' | 'ia' | 'distribuicao';
}

export interface HistoryEntry {
  id: string;
  date: string; // ISO string
  action: string;
}

export interface Article {
  id: string;
  title: string;
  status: ArticleStatus;
  categoryTag: CategoryTag;
  tags: string[];
  publishDate: string; // YYYY-MM-DD
  
  // Editorial OS Details
  summary: string; // Resumo
  objective: string; // Objetivo
  keyword: string; // Palavra-chave
  persona: string; // Persona
  cta: string; // Call to Action
  internalLinks: string; // Links internos
  externalLinks: string; // Links externos
  estimatedTime: string; // Tempo estimado
  spentTime: string; // Tempo gasto
  notes: string; // Notas
  
  // Checklists
  checklists: ChecklistItem[];
  
  // Audit history
  history: HistoryEntry[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface GovernanceDoc {
  id: string;
  type: 'BRD' | 'PRD' | 'SDD' | 'TSD' | string;
  title: string;
  description: string;
  lastUpdated: string;
  content: string;
}

export interface GamificationBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}
