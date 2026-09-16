import { describe, it, expect } from 'vitest';
import type {
  SemanticClassification,
  WorkflowLifecycleRole,
  CategoryOrigin,
  WorkflowStage,
  CategoryEntity,
  ChecklistTemplate,
  ChecklistTemplateItem,
  Article,
  ArticleStatus,
  CategoryTag,
} from '@/types/editorial';

// ──────────────────────────────────────────────────────
// Phase 6.4 Domain Foundation Tests (Slice 1)
// ──────────────────────────────────────────────────────

describe('Phase 6.4 Semantic Classification', () => {
  it('accepts all approved values', () => {
    const valid: SemanticClassification[] = ['IDEA', 'RESEARCH', 'DRAFTING', 'REVIEW', 'PUBLISHED'];
    expect(valid).toHaveLength(5);
    valid.forEach(v => expect(typeof v).toBe('string'));
  });
});

describe('Phase 6.4 Lifecycle Role', () => {
  it('PUBLICATION is the only approved value', () => {
    const role: WorkflowLifecycleRole = 'PUBLICATION';
    expect(role).toBe('PUBLICATION');
  });
});

describe('Phase 6.4 WorkflowStage Domain', () => {
  const stage: WorkflowStage = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    displayName: 'Publicado',
    orderIndex: 4,
    semanticClassification: 'PUBLISHED',
    lifecycleRole: 'PUBLICATION',
    isActive: true,
  };

  it('has required fields', () => {
    expect(stage.id).toBeTruthy();
    expect(stage.displayName).toBe('Publicado');
    expect(stage.orderIndex).toBe(4);
    expect(stage.isActive).toBe(true);
  });

  it('supports PUBLICATION lifecycle role', () => {
    expect(stage.lifecycleRole).toBe('PUBLICATION');
  });

  it('supports PUBLISHED semantic classification independently', () => {
    expect(stage.semanticClassification).toBe('PUBLISHED');
  });

  it('supports null lifecycle role', () => {
    const ideaStage: WorkflowStage = {
      ...stage,
      displayName: 'Ideia',
      orderIndex: 0,
      semanticClassification: 'IDEA',
      lifecycleRole: null,
    };
    expect(ideaStage.lifecycleRole).toBeNull();
    expect(ideaStage.semanticClassification).toBe('IDEA');
  });

  it('supports null semantic classification', () => {
    const customStage: WorkflowStage = {
      ...stage,
      displayName: 'Custom Stage',
      orderIndex: 5,
      semanticClassification: null,
      lifecycleRole: null,
    };
    expect(customStage.semanticClassification).toBeNull();
    expect(customStage.lifecycleRole).toBeNull();
  });
});

describe('Phase 6.4 Category Domain', () => {
  it('standard origin represents Free baseline', () => {
    const category: CategoryEntity = {
      id: '223e4567-e89b-12d3-a456-426614174000',
      name: 'IA',
      origin: 'standard',
      isActive: true,
    };
    expect(category.origin).toBe('standard');
  });

  it('custom origin represents Pro categories', () => {
    const category: CategoryEntity = {
      id: '323e4567-e89b-12d3-a456-426614174000',
      name: 'My Custom Category',
      origin: 'custom',
      isActive: true,
    };
    expect(category.origin).toBe('custom');
  });
});

describe('Phase 6.4 ChecklistTemplate Domain', () => {
  it('template items contain label only (no taxonomy)', () => {
    const item: ChecklistTemplateItem = { label: 'Check SEO metadata' };
    expect(item.label).toBe('Check SEO metadata');
    expect(Object.keys(item)).toEqual(['label']);
  });

  it('template has ordered items', () => {
    const template: ChecklistTemplate = {
      id: '423e4567-e89b-12d3-a456-426614174000',
      name: 'Editorial Review',
      items: [
        { label: 'Check title' },
        { label: 'Check summary' },
        { label: 'Check accessibility' },
      ],
    };
    expect(template.items).toHaveLength(3);
    expect(template.items[0].label).toBe('Check title');
    expect(template.items[2].label).toBe('Check accessibility');
  });
});

describe('Phase 6.4 Article EXPAND Compatibility', () => {
  const legacyArticle: Article = {
    id: 'test-1',
    title: 'Test Article',
    status: 'publicado',
    categoryTag: 'IA',
    tags: ['test'],
    publishDate: '2026-01-15',
    summary: '',
    objective: '',
    keyword: '',
    persona: '',
    cta: '',
    internalLinks: '',
    externalLinks: '',
    estimatedTime: '',
    spentTime: '',
    notes: '',
    checklists: [],
    history: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    completedAt: '2026-01-15T12:00:00Z',
  };

  it('preserves legacy status field', () => {
    expect(legacyArticle.status).toBe('publicado');
  });

  it('preserves legacy categoryTag field', () => {
    expect(legacyArticle.categoryTag).toBe('IA');
  });

  it('new reference fields are optional (undefined by default)', () => {
    expect(legacyArticle.workflowStageId).toBeUndefined();
    expect(legacyArticle.categoryId).toBeUndefined();
  });

  it('new reference fields can be set during EXPAND', () => {
    const expandedArticle: Article = {
      ...legacyArticle,
      workflowStageId: '523e4567-e89b-12d3-a456-426614174000',
      categoryId: '623e4567-e89b-12d3-a456-426614174000',
    };
    expect(expandedArticle.workflowStageId).toBeTruthy();
    expect(expandedArticle.categoryId).toBeTruthy();
    // Legacy fields still present
    expect(expandedArticle.status).toBe('publicado');
    expect(expandedArticle.categoryTag).toBe('IA');
  });

  it('preserves completedAt', () => {
    expect(legacyArticle.completedAt).toBe('2026-01-15T12:00:00Z');
  });

  it('all legacy ArticleStatus values remain valid', () => {
    const statuses: ArticleStatus[] = ['ideia', 'pesquisa', 'escrita', 'revisao', 'publicado'];
    statuses.forEach(s => expect(typeof s).toBe('string'));
  });

  it('all legacy CategoryTag values remain valid', () => {
    const tags: CategoryTag[] = ['IA', 'Acessibilidade', 'Inclusão', 'SEO', 'Docs', 'Blog', 'Social', 'Linguagem Simples'];
    expect(tags).toHaveLength(8);
  });
});
