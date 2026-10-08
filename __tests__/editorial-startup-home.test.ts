import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Article, CategoryEntity, WorkflowStage } from '@/types/editorial';
import { HomeView } from '@/components/HomeView';
import { KanbanBoard } from '@/components/KanbanBoard';
import { editorialAchievements, localDateKey, matchesTimeFilter, unresolvedArticles, filterWorkspaceArticles } from '@/lib/utils/editorialOverview';
import { projectArticleCategories, reconcileCategorySelection } from '@/lib/api/editorialWorkspace';
import { getStoredArticles, saveArticles } from '@/lib/storage';

const native = vi.hoisted(() => ({ db: vi.fn(), stages: vi.fn(), categories: vi.fn(), articles: vi.fn() }));
vi.mock('@/db/client', () => ({ getDb: native.db }));
vi.mock('@/lib/api/articles', () => ({ fetchWorkflowStages: native.stages, fetchCategories: native.categories, fetchAllRawArticles: native.articles }));

const stages: WorkflowStage[] = [
  { id: 'idea', displayName: 'Ideia', orderIndex: 0, semanticClassification: 'IDEA', lifecycleRole: null, isActive: true },
  { id: 'pub', displayName: 'Concluído', orderIndex: 1, semanticClassification: 'REVIEW', lifecycleRole: 'PUBLICATION', isActive: true },
];
const categories: CategoryEntity[] = [{ id: 'cat', name: 'Ciência', origin: 'standard', isActive: true }];
const article = (id = 'synthetic-article'): Article => ({ id, title: `EXERCÍCIO SINTÉTICO ${id}`, status: 'ideia', categoryTag: 'IA', tags: [], publishDate: '2026-10-07', summary: '', objective: '', keyword: '', persona: '', cta: '', internalLinks: '', externalLinks: '', estimatedTime: '', spentTime: '', notes: '', checklists: [], history: [], createdAt: '2026-10-07', updatedAt: '2026-10-07', workflowStageId: 'idea', categoryId: 'cat' });

beforeEach(() => {
  vi.clearAllMocks();
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) });
  vi.stubGlobal('window', { dispatchEvent: vi.fn(), __TAURI_INTERNALS__: false });
});
afterEach(() => vi.unstubAllGlobals());

describe('editorial startup and discoverability', () => {
  it('starts browser articles empty and keeps deletion of the last article empty on reopen', () => {
    expect(getStoredArticles()).toEqual([]);
    saveArticles([article()]);
    expect(getStoredArticles()).toHaveLength(1);
    saveArticles([]);
    expect(getStoredArticles()).toEqual([]);
    expect(getStoredArticles()).toEqual([]);
  });

  it('preserves malformed storage and reports failure instead of injecting samples', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('jinc_editorial_os_articles_v1', '{}');
    expect(() => getStoredArticles()).toThrow('ERR_ARTICLE_STORAGE_INVALID');
    expect(localStorage.getItem('jinc_editorial_os_articles_v1')).toBe('{}');
    log.mockRestore();
  });

  it('loads native catalogs after database initialization without seeding articles', async () => {
    vi.stubGlobal('window', { __TAURI_INTERNALS__: true });
    let initialized = false;
    native.db.mockImplementation(async () => { initialized = true; });
    native.stages.mockImplementation(async () => { expect(initialized).toBe(true); return stages; });
    native.categories.mockResolvedValue(categories);
    native.articles.mockResolvedValue([]);
    const { loadEditorialWorkspace } = await import('@/lib/api/editorialWorkspace');
    expect(await loadEditorialWorkspace()).toEqual({ articles: [], stages, categories });
    expect(native.db).toHaveBeenCalledTimes(1);
    native.articles.mockRejectedValueOnce(new Error('Read failed'));
    await expect(loadEditorialWorkspace()).rejects.toThrow('Read failed');
    expect((await loadEditorialWorkspace()).articles).toEqual([]);
  });

  it('projects renamed category by identity and keeps new categories selected on refresh', () => {
    expect(projectArticleCategories([article()], categories)[0].categoryTag).toBe('Ciência');
    expect(article().categoryTag).toBe('IA');
    expect(reconcileCategorySelection(['a'], ['a'], ['a', 'b'])).toEqual(['a', 'b']);
    expect(reconcileCategorySelection(['a', 'b'], ['a'], ['a', 'b', 'c'])).toEqual(['a', 'c']);
  });

  it('renders every unresolved article in the recovery section without duplicating regular cards', () => {
    const records = [article('saved'), { ...article('missing-stage'), workflowStageId: undefined }, { ...article('missing-category'), categoryId: undefined }];
    expect(unresolvedArticles(records, stages, categories)).toHaveLength(2);
    const html = renderToStaticMarkup(React.createElement(KanbanBoard, { articles: records, workflowStages: stages, categories, searchTerm: '', onSelectArticle: vi.fn(), onUpdateArticleStage: vi.fn(), onToggleChecklist: vi.fn() }));
    expect(html).toContain('Pautas para conferir (2)');
    expect(html).toContain('missing-stage');
    expect(html).toContain('missing-category');
    expect(html.match(/EXERCÍCIO SINTÉTICO missing-category/g)).toHaveLength(1);
    expect(filterWorkspaceArticles(records, '', ['cat'], categories)).toHaveLength(3);
  });

  it('uses local dates for deadlines, including month and next-seven-days boundaries', () => {
    const now = new Date(2026, 9, 7, 23, 30);
    expect(localDateKey(now)).toBe('2026-10-07');
    expect(matchesTimeFilter(article(), 'hoje', stages, now)).toBe(true);
    expect(matchesTimeFilter({ ...article(), publishDate: '2026-10-06' }, 'semana', stages, now)).toBe(false);
    expect(matchesTimeFilter({ ...article(), publishDate: '2026-10-13' }, 'semana', stages, now)).toBe(true);
    expect(matchesTimeFilter({ ...article(), publishDate: '2026-10-14' }, 'semana', stages, now)).toBe(false);
    expect(matchesTimeFilter({ ...article(), publishDate: '2026-10-01' }, 'mes', stages, now)).toBe(true);
    expect(matchesTimeFilter({ ...article(), publishDate: '2026-10-06' }, 'atrasados', stages, now)).toBe(true);
    expect(matchesTimeFilter({ ...article(), publishDate: '2026-10-06', workflowStageId: 'pub' }, 'atrasados', stages, now)).toBe(false);
  });
});

describe('Início and actual achievements', () => {
  it('offers creation, customization and optional AI guidance without granting empty-workspace achievements', () => {
    expect(editorialAchievements([], stages).every(b => !b.unlocked)).toBe(true);
    const html = renderToStaticMarkup(React.createElement(HomeView, { articles: [], workflowStages: stages, categories, onNavigate: vi.fn(), onCreateArticle: vi.fn(), onSelectArticle: vi.fn() }));
    expect(html).toContain('Criar minha primeira pauta');
    expect(html).toContain('Personalizar etapas, categorias e checklists');
    expect(html).toContain('A IA é opcional');
    expect(html).not.toContain('Conquistada');
    expect(html).toContain('não certifica');
  });

  it('requires actual relevant checklist items, all completed, and the publication role for completion', () => {
    const partial = { ...article(), checklists: [{ id: '1', label: 'Alt text', category: 'wcag' as const, completed: true }, { id: '2', label: 'Contraste', category: 'acessibilidade' as const, completed: false }] };
    const badge = (records: Article[]) => editorialAchievements(records, stages).find(b => b.id === 'accessibility-checklist');
    expect(badge([article()])?.unlocked).toBe(false);
    expect(badge([partial])?.unlocked).toBe(false);
    expect(badge([{ ...partial, checklists: partial.checklists.map(c => ({ ...c, completed: true })) }])?.unlocked).toBe(true);
    expect(editorialAchievements([{ ...article(), status: 'publicado' }], stages).at(-1)?.unlocked).toBe(false);
    expect(editorialAchievements([{ ...article(), workflowStageId: 'pub' }], stages).at(-1)?.unlocked).toBe(true);
  });
});
