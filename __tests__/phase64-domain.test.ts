import { describe, it, expect, vi, beforeEach } from 'vitest';
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

import { fetchWorkflowStages, fetchCategories, assignArticleStage, assignArticleCategory } from '@/lib/api/articles';
import { invoke } from '@tauri-apps/api/core';
import { getStoredArticles, saveArticles, browserAssignArticleStage, browserAssignArticleCategory, getStoredWorkflowStages } from '@/lib/storage';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('Phase 6.4 IPC Contracts', () => {
  it('get_workflow_stages unwraps { stages } correctly', async () => {
    vi.mocked(invoke).mockResolvedValueOnce({ stages: [{ id: 's1', display_name: 'Stage 1' }] });
    const res = await fetchWorkflowStages();
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('s1');
  });

  it('get_categories unwraps { categories } correctly', async () => {
    vi.mocked(invoke).mockResolvedValueOnce({ categories: [{ id: 'c1', name: 'Cat 1' }] });
    const res = await fetchCategories();
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('c1');
  });

  it('assign_article_stage sends required request envelope', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined);
    await assignArticleStage('art1', 'st1');
    expect(invoke).toHaveBeenCalledWith('assign_article_stage', { request: { article_id: 'art1', workflow_stage_id: 'st1' } });
  });

  it('assign_article_category sends required request envelope', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined);
    await assignArticleCategory('art1', 'cat1');
    expect(invoke).toHaveBeenCalledWith('assign_article_category', { request: { article_id: 'art1', category_id: 'cat1' } });
  });
});

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; }
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });
Object.defineProperty(global, 'window', { value: { dispatchEvent: vi.fn() } });

describe('Phase 6.4 Storage and Migration Logic', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('unknown legacy status fails with ERR_MIGRATION_UNKNOWN_LEGACY_VALUE', () => {
    localStorage.setItem('jinc_editorial_os_articles_v1', JSON.stringify([{ id: '1', status: 'unknown_status', categoryTag: 'IA' }]));
    expect(() => getStoredArticles()).toThrow('ERR_MIGRATION_UNKNOWN_LEGACY_VALUE');
  });

  it('unknown legacy category fails with ERR_MIGRATION_UNKNOWN_LEGACY_VALUE', () => {
    localStorage.setItem('jinc_editorial_os_articles_v1', JSON.stringify([{ id: '1', status: 'ideia', categoryTag: 'unknown_cat' }]));
    expect(() => getStoredArticles()).toThrow('ERR_MIGRATION_UNKNOWN_LEGACY_VALUE');
  });

  it('failed migration leaves original localStorage article data unchanged', () => {
    const raw = JSON.stringify([{ id: '1', status: 'unknown_status', categoryTag: 'IA' }]);
    localStorage.setItem('jinc_editorial_os_articles_v1', raw);
    try { getStoredArticles(); } catch {}
    expect(localStorage.getItem('jinc_editorial_os_articles_v1')).toBe(raw);
  });

  it('browser migration is idempotent', () => {
    const raw = JSON.stringify([{ id: '1', status: 'ideia', categoryTag: 'IA' }]);
    localStorage.setItem('jinc_editorial_os_articles_v1', raw);
    const arts = getStoredArticles();
    expect(arts[0].workflowStageId).toBeTruthy();

    // simulate a second load
    const arts2 = getStoredArticles();
    expect(arts2).toEqual(arts);
  });

  it('invalid publication-role configuration fails closed without replacing stored configuration', () => {
    const raw = JSON.stringify([{ id: 's1', lifecycleRole: null, isActive: true }]); // no PUBLICATION
    localStorage.setItem('jinc_editorial_os_workflows_v1', raw);
    expect(() => getStoredWorkflowStages()).toThrow('ERR_PUBLICATION_ROLE_INVARIANT');
    expect(localStorage.getItem('jinc_editorial_os_workflows_v1')).toBe(raw);
  });

  it('same-stage browser assignment is strict no-op', () => {
    const raw = JSON.stringify([{ id: '1', workflowStageId: 'st1', categoryId: 'cat1', history: [] }]);
    localStorage.setItem('jinc_editorial_os_articles_v1', raw);
    const stages = JSON.stringify([
      { id: 'st1', isActive: true, lifecycleRole: null },
      { id: 'st2', isActive: true, lifecycleRole: 'PUBLICATION' }
    ]);
    localStorage.setItem('jinc_editorial_os_workflows_v1', stages);

    browserAssignArticleStage('1', 'st1');
    const saved = JSON.parse(localStorage.getItem('jinc_editorial_os_articles_v1')!);
    expect(saved[0].history).toHaveLength(0); // no history added
  });

  it('browser publication entry sets completedAt', () => {
    const raw = JSON.stringify([{ id: '1', workflowStageId: 'st1', categoryId: 'cat1', history: [] }]);
    localStorage.setItem('jinc_editorial_os_articles_v1', raw);
    const stages = JSON.stringify([
      { id: 'st1', isActive: true, lifecycleRole: null },
      { id: 'st2', isActive: true, lifecycleRole: 'PUBLICATION' }
    ]);
    localStorage.setItem('jinc_editorial_os_workflows_v1', stages);

    browserAssignArticleStage('1', 'st2');
    const saved = JSON.parse(localStorage.getItem('jinc_editorial_os_articles_v1')!);
    expect(saved[0].completedAt).toBeTruthy();
  });

  it('browser publication exit preserves completedAt', () => {
    const raw = JSON.stringify([{ id: '1', workflowStageId: 'st2', categoryId: 'cat1', completedAt: '2020', history: [] }]);
    localStorage.setItem('jinc_editorial_os_articles_v1', raw);
    const stages = JSON.stringify([
      { id: 'st1', isActive: true, lifecycleRole: null },
      { id: 'st2', isActive: true, lifecycleRole: 'PUBLICATION' }
    ]);
    localStorage.setItem('jinc_editorial_os_workflows_v1', stages);

    browserAssignArticleStage('1', 'st1');
    const saved = JSON.parse(localStorage.getItem('jinc_editorial_os_articles_v1')!);
    expect(saved[0].completedAt).toBe('2020');
  });

  it('browser re-entry refreshes completedAt', () => {
    const raw = JSON.stringify([{ id: '1', workflowStageId: 'st2', categoryId: 'cat1', completedAt: '2020', history: [] }]);
    localStorage.setItem('jinc_editorial_os_articles_v1', raw);
    const stages = JSON.stringify([
      { id: 'st1', isActive: true, lifecycleRole: null },
      { id: 'st2', isActive: true, lifecycleRole: 'PUBLICATION' }
    ]);
    localStorage.setItem('jinc_editorial_os_workflows_v1', stages);

    // must exit then enter due to strict no-op
    browserAssignArticleStage('1', 'st1');
    browserAssignArticleStage('1', 'st2');
    const saved = JSON.parse(localStorage.getItem('jinc_editorial_os_articles_v1')!);
    expect(saved[0].completedAt).not.toBe('2020');
    expect(saved[0].completedAt).toBeTruthy();
  });

  it('inactive/unknown browser category is rejected', () => {
    const raw = JSON.stringify([{ id: '1', workflowStageId: 'st1', categoryId: 'cat1' }]);
    localStorage.setItem('jinc_editorial_os_articles_v1', raw);
    const cats = JSON.stringify([{ id: 'cat2', isActive: false }]);
    localStorage.setItem('jinc_editorial_os_categories_v1', cats);

    browserAssignArticleCategory('1', 'cat2');
    const saved = JSON.parse(localStorage.getItem('jinc_editorial_os_articles_v1')!);
    expect(saved[0].categoryId).toBe('cat1'); // unchanged
  });
});
