import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { parseArticleImport, mergeArticleImport, MAX_ARTICLE_IMPORT_BYTES } from '@/lib/utils/articleImport';
import { createNewArticle } from '@/lib/storage';
import { DEFAULT_CATEGORIES, DEFAULT_WORKFLOW_STAGES } from '@/lib/initialData';
import type { Article } from '@/types/editorial';

const native = vi.hoisted(() => ({ invoke: vi.fn(), getDb: vi.fn(), fetch: vi.fn() }));
vi.mock('@tauri-apps/api/core', () => ({ invoke: native.invoke }));
vi.mock('@/db/client', () => ({ getDb: native.getDb }));
vi.mock('@/lib/api/articles', () => ({ fetchAllRawArticles: native.fetch }));
import { importArticleFile, articleImportErrorMessage } from '@/lib/api/articleImport';
import { fromArticleProps } from '@/lib/adapters/articleAdapter';

function article(id = 'synthetic-article'): Article {
  return { ...createNewArticle(DEFAULT_WORKFLOW_STAGES, DEFAULT_CATEGORIES)!, id, title: 'Synthetic import fixture', analysisContent: 'Disposable test text' };
}

describe('Local article import boundary', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it('accepts an edited category label with its stable ID, while rejecting unknown references and unmapped legacy labels', () => {
    const renamed = { ...article(), categoryTag: 'Ciência e tecnologia' };
    const parsed = parseArticleImport(JSON.stringify([renamed]));
    expect(parsed[0].categoryTag).toBe('Ciência e tecnologia');
    expect(mergeArticleImport([], parsed, DEFAULT_WORKFLOW_STAGES, DEFAULT_CATEGORIES).imported).toBe(1);
    expect(() => mergeArticleImport([], [{ ...parsed[0], categoryId: 'missing' }], DEFAULT_WORKFLOW_STAGES, DEFAULT_CATEGORIES)).toThrow();
    expect(() => parseArticleImport(JSON.stringify([{ ...renamed, categoryId: undefined }]))).toThrow('inválido');
  });

  it('preserves every local field and skips matching IDs even when the file is newer', () => {
    const local = article('local');
    const incoming = [ { ...local, title: 'Replacement attempt', updatedAt: '2099-01-01', workflowStageId: 'unknown' }, article('new') ];
    const result = mergeArticleImport([local], incoming, DEFAULT_WORKFLOW_STAGES, DEFAULT_CATEGORIES);
    expect(result).toEqual({ articles: [local, incoming[1]], imported: 1, skipped: 1 });
    expect(result.articles[0]).toBe(local);
  });

  it('rejects an unknown new reference without partially merging the valid preceding article', () => {
    const current = [article('local')];
    expect(() => mergeArticleImport(current, [article('valid'), { ...article('bad'), categoryId: 'missing' }], DEFAULT_WORKFLOW_STAGES, DEFAULT_CATEGORIES)).toThrow('Nenhuma pauta');
    expect(current.map(item => item.id)).toEqual(['local']);
  });

  it('normalizes missing legacy content and strips unowned fields from JSON', () => {
    const { analysisContent: _content, ...legacy } = article();
    const parsed = parseArticleImport(JSON.stringify([{ ...legacy, executable: 'untrusted', __proto__: 'unused' }]));
    expect(parsed[0].analysisContent).toBe('');
    expect(parsed[0]).not.toHaveProperty('executable');
  });

  it.each([
    { input: [{ ...article(), title: {} }] },
    { input: [{ ...article(), tags: 'tag' }] },
    { input: [{ ...article(), checklists: [{ id: 'c', label: 'Check', completed: 'true' }] }] },
    { input: [{ ...article(), history: [{ id: 'h', date: 'date', action: {} }] }] },
    { input: [article('duplicate'), article('duplicate')] },
  ])('rejects malformed or duplicate articles before mutation', ({ input }) => {
    expect(() => parseArticleImport(JSON.stringify(input))).toThrow('inválido');
  });

  it('rejects duplicate checklist/history IDs and oversized JSON', () => {
    const source = article();
    expect(() => parseArticleImport(JSON.stringify([{ ...source, checklists: [source.checklists[0], source.checklists[0]] }]))).toThrow();
    expect(() => parseArticleImport(JSON.stringify([{ ...source, history: [source.history[0], source.history[0]] }]))).toThrow();
    expect(() => parseArticleImport(' '.repeat(MAX_ARTICLE_IMPORT_BYTES + 1))).toThrow('5 MiB');
  });

  function fileWith(input: unknown) {
    vi.stubGlobal('FileReader', class {
      onload?: (event: { target: { result: string } }) => void;
      readAsText() { this.onload?.({ target: { result: JSON.stringify(input) } }); }
    });
    return { size: JSON.stringify(input).length } as File;
  }

  it('uses native transactional IPC and reloads SQLite, without browser writes', async () => {
    const localStorage = { setItem: vi.fn(), getItem: vi.fn() };
    vi.stubGlobal('window', { __TAURI_INTERNALS__: true });
    vi.stubGlobal('localStorage', localStorage);
    const imported = article();
    native.invoke.mockResolvedValue({ imported: 1, skipped: 0 });
    native.fetch.mockResolvedValue([fromArticleProps(imported)]);
    const result = await importArticleFile(fileWith([imported]));
    expect(native.getDb).toHaveBeenCalledOnce();
    expect(native.invoke).toHaveBeenCalledWith('import_articles', { request: { articles: [fromArticleProps(imported)] } });
    expect(result.articles[0].analysisContent).toBe(imported.analysisContent);
    expect(result.imported).toBe(1);
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  it('does not report native success or update UI data when IPC rejects', async () => {
    vi.stubGlobal('window', { __TAURI_INTERNALS__: true });
    native.invoke.mockRejectedValue({ code: 'ERR_IMPORT_REFERENCE', retryable: false, details: {} });
    await expect(importArticleFile(fileWith([article()]))).rejects.toMatchObject({ code: 'ERR_IMPORT_REFERENCE' });
    expect(native.fetch).not.toHaveBeenCalled();
    expect(articleImportErrorMessage({ code: 'ERR_IMPORT_REFERENCE' })).toContain('Nenhuma pauta');
  });

  it('distinguishes a committed import from failure to reload its list', async () => {
    vi.stubGlobal('window', { __TAURI_INTERNALS__: true });
    native.invoke.mockResolvedValue({ imported: 1, skipped: 0 });
    native.fetch.mockRejectedValue(new Error('Synthetic reload failure'));
    await expect(importArticleFile(fileWith([article()]))).rejects.toThrow('importação foi gravada');
  });

  it('rejects files above the size limit before reading or native IPC', async () => {
    const reader = vi.fn();
    vi.stubGlobal('FileReader', reader);
    await expect(importArticleFile({ size: MAX_ARTICLE_IMPORT_BYTES + 1 } as File)).rejects.toThrow('5 MiB');
    expect(reader).not.toHaveBeenCalled();
    expect(native.invoke).not.toHaveBeenCalled();
  });
});
