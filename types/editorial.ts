export type ArticleStatus = 'ideia' | 'pesquisa' | 'escrita' | 'revisao' | 'publicado';

export type CategoryTag = 'IA' | 'Acessibilidade' | 'Inclusão' | 'SEO' | 'Docs' | 'Blog' | 'Social' | 'Linguagem Simples';

export type TimeFilter = 'todas' | 'hoje' | 'semana' | 'mes' | 'atrasados';

export type ActiveView = 'kanban' | 'lista' | 'calendario' | 'estatisticas' | 'documentos';

// ──────────────────────────────────────────────────────
// Phase 6.4: Domain Vocabulary
// ──────────────────────────────────────────────────────

/** Approved semantic classification values (BR-AI-001). Recommendation-only. */
export type SemanticClassification = 'IDEA' | 'RESEARCH' | 'DRAFTING' | 'REVIEW' | 'PUBLISHED';

/** Phase 6.4 lifecycle role. Independent of semantic classification. */
export type WorkflowLifecycleRole = 'PUBLICATION';

/** Category provenance — 'standard' for Free baseline, 'custom' for Pro. */
export type CategoryOrigin = 'standard' | 'custom';

// ──────────────────────────────────────────────────────
// Phase 6.4: Domain Entities
// ──────────────────────────────────────────────────────

export interface WorkflowStage {
  id: string;
  displayName: string;
  orderIndex: number;
  semanticClassification: SemanticClassification | null;
  lifecycleRole: WorkflowLifecycleRole | null;
  isActive: boolean;
  createdAt?: string;
}

export interface CategoryEntity {
  id: string;
  name: string;
  origin: CategoryOrigin;
  isActive: boolean;
  createdAt?: string;
}

export interface ChecklistTemplateItem {
  label: string;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  items: ChecklistTemplateItem[];
  createdAt?: string;
}

// ──────────────────────────────────────────────────────
// Existing Domain
// ──────────────────────────────────────────────────────

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
  status: ArticleStatus; // legacy — preserved during transition
  categoryTag: CategoryTag; // legacy — preserved during transition
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

  // Phase 6.4 EXPAND: nullable during transition, required after Slice 2 CUTOVER
  workflowStageId?: string;
  categoryId?: string;
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
