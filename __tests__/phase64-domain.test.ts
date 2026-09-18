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

import { saveRawArticle, RawArticleData } from '@/lib/api/articles';
import { getDb } from '@/db/client';
import { createNewArticle, mergeBrowserSaveArticle } from '@/lib/storage';

vi.mock('@/db/client', () => ({
  getDb: vi.fn(),
}));

describe('Phase 6.4 Authoritative History and Save Logic', () => {
  const mockDb: any = {};
  mockDb.select = vi.fn(() => mockDb);
  mockDb.from = vi.fn(() => mockDb);
  mockDb.where = vi.fn(() => mockDb);
  mockDb.insert = vi.fn(() => mockDb);
  mockDb.values = vi.fn(() => mockDb);
  mockDb.update = vi.fn(() => mockDb);
  mockDb.set = vi.fn(() => mockDb);
  mockDb.delete = vi.fn(() => mockDb);

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getDb).mockResolvedValue(mockDb as any);
  });

  const baseRaw: RawArticleData = {
    article: {
      id: 'art1',
      title: 'T',
      status: 'ideia',
      categoryTag: 'IA',
      tags: '[]',
      publishDate: '2020',
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
      createdAt: '2020',
      updatedAt: '2020',
      completedAt: null,
      workflowStageId: 'st1',
      categoryId: 'cat1',
    },
    checklists: [],
    history: [],
  };

  it('A. saveRawArticle performs idempotent history merge when article exists', async () => {
    mockDb.where.mockResolvedValueOnce([baseRaw.article]) // 1. select article
                .mockResolvedValueOnce([]) // 2. update article
                .mockResolvedValueOnce([]) // 3. delete checklists
                .mockResolvedValueOnce([{ id: 'h1' }]); // 4. select history

    const newRaw = {
      ...baseRaw,
      history: [{ id: 'h1', articleId: 'art1', date: '2020', action: 'Old' }, { id: 'h2', articleId: 'art1', date: '2021', action: 'New' }],
    };

    await saveRawArticle(newRaw);
    
    // Only h2 should be inserted
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.values).toHaveBeenCalledWith([{ id: 'h2', articleId: 'art1', date: '2021', action: 'New' }]);
  });

  it('B. saveRawArticle prevents native history overwrites (preserves IDs on conflict)', async () => {
    mockDb.where.mockResolvedValueOnce([baseRaw.article]) // 1. select article
                .mockResolvedValueOnce([]) // 2. update article
                .mockResolvedValueOnce([]) // 3. delete checklists
                .mockResolvedValueOnce([{ id: 'h1' }, { id: 'h2' }]); // 4. select history

    const newRaw = {
      ...baseRaw,
      history: [{ id: 'h1', articleId: 'art1', date: '2020', action: 'Stale overwrite' }], // frontend tries to overwrite
    };

    await saveRawArticle(newRaw);
    
    // No history insert should be called because h1 is already in native db
    expect(mockDb.insert).not.toHaveBeenCalledWith(expect.anything()); // It might be called for checklists, but raw.checklists is []
  });

  it('C. saveRawArticle protects authoritative domain fields from stale overwrite', async () => {
    mockDb.where.mockResolvedValueOnce([{ ...baseRaw.article, workflowStageId: 'native-stage', categoryId: 'native-cat', completedAt: 'native-date' }]); 
    mockDb.where.mockResolvedValueOnce([]); // no history

    const newRaw = {
      ...baseRaw,
      article: { ...baseRaw.article, workflowStageId: 'stale-stage', categoryId: 'stale-cat', completedAt: 'stale-date' }
    };

    await saveRawArticle(newRaw);
    
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({
      workflowStageId: 'native-stage',
      categoryId: 'native-cat',
      completedAt: 'native-date'
    }));
  });

  it('D. saveRawArticle successfully updates checklists alongside article', async () => {
    mockDb.where.mockResolvedValueOnce([baseRaw.article]);
    mockDb.where.mockResolvedValueOnce([]);

    const newRaw = {
      ...baseRaw,
      checklists: [{ id: 'c1', articleId: 'art1', label: 'C1', completed: 1, category: 'seo' }]
    };

    await saveRawArticle(newRaw);
    expect(mockDb.delete).toHaveBeenCalled(); // deletes old checklists
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.values).toHaveBeenCalledWith(newRaw.checklists); // inserts new checklists
  });

  it('E. saveRawArticle inserts new article with initial history correctly', async () => {
    mockDb.where.mockResolvedValueOnce([]); // New article, does not exist

    const newRaw = {
      ...baseRaw,
      history: [{ id: 'h1', articleId: 'art1', date: '2020', action: 'Created' }],
    };

    await saveRawArticle(newRaw);
    expect(mockDb.insert).toHaveBeenCalledTimes(2); // one for article, one for history
    expect(mockDb.values).toHaveBeenCalledWith(newRaw.article);
    expect(mockDb.values).toHaveBeenCalledWith(newRaw.history);
  });

  it('F. saveRawArticle handles empty history arrays gracefully', async () => {
    mockDb.where.mockResolvedValueOnce([baseRaw.article]);
    mockDb.where.mockResolvedValueOnce([]);
    
    await saveRawArticle(baseRaw);
    expect(mockDb.update).toHaveBeenCalled();
    // Insert for history should not be called
    expect(mockDb.insert).not.toHaveBeenCalled();
  });
});

describe('Phase 6.4 Article Creation and Browser History Merge', () => {
  const activeStages: WorkflowStage[] = [
    { id: 'st1', displayName: 'S1', orderIndex: 1, semanticClassification: 'IDEA', lifecycleRole: null, isActive: true },
    { id: 'st2', displayName: 'S2', orderIndex: 2, semanticClassification: 'PUBLISHED', lifecycleRole: 'PUBLICATION', isActive: true },
  ];
  const activeCats: CategoryEntity[] = [
    { id: 'cat1', name: 'C1', origin: 'standard', isActive: true },
  ];

  it('G. new article chooses the lowest-order ACTIVE workflow stage', () => {
    const art = createNewArticle([{ ...activeStages[1], orderIndex: 0 }, activeStages[0]], activeCats);
    expect(art?.workflowStageId).toBe('st2'); // st2 has orderIndex 0 now
  });

  it('H. new article chooses an ACTIVE category', () => {
    const inactiveCats: CategoryEntity[] = [{ id: 'cat2', name: 'C2', origin: 'custom', isActive: false }];
    const art = createNewArticle(activeStages, [...inactiveCats, ...activeCats]);
    expect(art?.categoryId).toBe('cat1');
  });

  it('I. no active workflow stage prevents creation', () => {
    const inactiveStages = activeStages.map(s => ({ ...s, isActive: false }));
    const art = createNewArticle(inactiveStages, activeCats);
    expect(art).toBeNull();
  });

  it('J. no active category prevents creation', () => {
    const inactiveCats = activeCats.map(c => ({ ...c, isActive: false }));
    const art = createNewArticle(activeStages, inactiveCats);
    expect(art).toBeNull();
  });

  it('K. mergeBrowserSaveArticle preserves the browser domain transition rather than overwriting it with stale metadata', () => {
    const prev: Article = {
      id: 'a1', title: 'T', status: 'ideia', categoryTag: 'IA', tags: [], publishDate: '2020',
      summary: '', objective: '', keyword: '', persona: '', cta: '', internalLinks: '', externalLinks: '',
      estimatedTime: '', spentTime: '', notes: '', checklists: [],
      history: [{ id: 'h1', date: '2020', action: 'Move' }],
      createdAt: '2020', updatedAt: '2020',
      workflowStageId: 'new-stage', // domain transition happened in browser
      categoryId: 'new-cat',
      completedAt: '2020'
    };

    const staleSaved: Article = {
      ...prev,
      workflowStageId: 'old-stage', // UI sent stale stage
      categoryId: 'old-cat',
      completedAt: 'old-date',
      history: [{ id: 'h2', date: '2021', action: 'Edit' }]
    };

    const merged = mergeBrowserSaveArticle(prev, staleSaved);
    expect(merged.workflowStageId).toBe('new-stage');
    expect(merged.categoryId).toBe('new-cat');
    expect(merged.completedAt).toBe('2020');
  });

  it('L. mergeBrowserSaveArticle performs non-destructive merge of history', () => {
    const prev: Article = {
      id: 'a1', title: 'T', status: 'ideia', categoryTag: 'IA', tags: [], publishDate: '2020',
      summary: '', objective: '', keyword: '', persona: '', cta: '', internalLinks: '', externalLinks: '',
      estimatedTime: '', spentTime: '', notes: '', checklists: [],
      history: [{ id: 'h1', date: '2020', action: 'A' }, { id: 'h2', date: '2020', action: 'B' }],
      createdAt: '2020', updatedAt: '2020',
    };

    const saved: Article = {
      ...prev,
      history: [{ id: 'h2', date: '2020', action: 'B' }, { id: 'h3', date: '2021', action: 'C' }]
    };

    const merged = mergeBrowserSaveArticle(prev, saved);
    expect(merged.history).toHaveLength(3);
    expect(merged.history.map(h => h.id)).toEqual(['h1', 'h2', 'h3']);
  });

  it('M. mergeBrowserSaveArticle handles undefined previous article gracefully', () => {
    const saved: Article = {
      id: 'a1', title: 'T', status: 'ideia', categoryTag: 'IA', tags: [], publishDate: '2020',
      summary: '', objective: '', keyword: '', persona: '', cta: '', internalLinks: '', externalLinks: '',
      estimatedTime: '', spentTime: '', notes: '', checklists: [],
      history: [{ id: 'h1', date: '2020', action: 'A' }],
      createdAt: '2020', updatedAt: '2020',
    };

    const merged = mergeBrowserSaveArticle(undefined, saved);
    expect(merged).toEqual(saved);
  });
});

