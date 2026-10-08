import type { Article, CategoryEntity, WorkflowStage } from '@/types/editorial';

export const MAX_ARTICLE_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_ARTICLE_IMPORT_COUNT = 1000;

const invalid = () => new Error('Arquivo de pautas inválido. Nenhuma pauta foi alterada.');
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid();
  return value as Record<string, unknown>;
};
const text = (value: unknown, optional = false): string => {
  if (optional && value == null) return '';
  if (typeof value !== 'string') throw invalid();
  return value;
};
const identity = (value: unknown): string => {
  const result = text(value);
  if (!result.trim() || result.length > 256) throw invalid();
  return result;
};
const array = (value: unknown): unknown[] => {
  if (!Array.isArray(value)) throw invalid();
  return value;
};

/** Whitelist the exported article shape before any storage or IPC mutation. */
export function parseArticleImport(content: string): Article[] {
  if (new TextEncoder().encode(content).length > MAX_ARTICLE_IMPORT_BYTES) {
    throw new Error('O arquivo excede o limite de 5 MiB. Nenhuma pauta foi alterada.');
  }
  const values = array(JSON.parse(content));
  if (values.length > MAX_ARTICLE_IMPORT_COUNT) throw invalid();
  const articleIds = new Set<string>();
  return values.map(value => {
    const source = record(value);
    if (source.analysisContent != null && typeof source.analysisContent !== 'string') {
      throw new Error('Conteúdo para análise inválido: o campo deve conter texto.');
    }
    const id = identity(source.id);
    if (articleIds.has(id)) throw invalid();
    articleIds.add(id);
    const checkIds = new Set<string>();
    const historyIds = new Set<string>();
    const optionalFields = Object.fromEntries([
      'summary', 'objective', 'analysisContent', 'keyword', 'persona', 'cta',
      'internalLinks', 'externalLinks', 'estimatedTime', 'spentTime', 'notes',
    ].map(key => [key, text(source[key], true)]));
    const status = text(source.status);
    const categoryTag = text(source.categoryTag);
    if (!['ideia', 'pesquisa', 'escrita', 'revisao', 'publicado'].includes(status)
      || (source.categoryId == null && !['IA', 'Acessibilidade', 'Inclusão', 'SEO', 'Docs', 'Blog', 'Social', 'Linguagem Simples'].includes(categoryTag))) {
      throw invalid();
    }
    return {
      ...optionalFields,
      id, title: text(source.title), status: status as Article['status'],
      categoryTag: categoryTag as Article['categoryTag'],
      tags: array(source.tags).map(tag => text(tag)),
      publishDate: text(source.publishDate), createdAt: text(source.createdAt), updatedAt: text(source.updatedAt),
      completedAt: source.completedAt == null ? undefined : text(source.completedAt),
      workflowStageId: source.workflowStageId == null ? undefined : identity(source.workflowStageId),
      categoryId: source.categoryId == null ? undefined : identity(source.categoryId),
      checklists: array(source.checklists).map(value => {
        const item = record(value);
        const id = identity(item.id);
        if (checkIds.has(id) || typeof item.completed !== 'boolean') throw invalid();
        checkIds.add(id);
        const category = item.category == null ? undefined : text(item.category);
        if (category && !['pesquisa', 'seo', 'acessibilidade', 'editorial', 'wcag', 'ia', 'distribuicao'].includes(category)) throw invalid();
        return { id, label: text(item.label), completed: item.completed, category: category as Article['checklists'][number]['category'] };
      }),
      history: array(source.history).map(value => {
        const item = record(value);
        const id = identity(item.id);
        if (historyIds.has(id)) throw invalid();
        historyIds.add(id);
        return { id, date: text(item.date), action: text(item.action) };
      }),
    } as Article;
  });
}

export function mergeArticleImport(
  current: Article[], incoming: Article[], stages: WorkflowStage[], categories: CategoryEntity[],
) {
  const existing = new Set(current.map(article => article.id));
  const additions = incoming.filter(article => !existing.has(article.id));
  if (stages.filter(stage => stage.isActive && stage.lifecycleRole === 'PUBLICATION').length !== 1) {
    throw new Error('ERR_PUBLICATION_ROLE_INVARIANT');
  }
  for (const article of additions) {
    if (!stages.some(stage => stage.isActive && stage.id === article.workflowStageId)
      || !categories.some(category => category.isActive && category.id === article.categoryId)) {
      throw new Error('Etapa ou categoria não encontrada neste aplicativo. Nenhuma pauta foi importada.');
    }
  }
  return { articles: [...current, ...additions], imported: additions.length, skipped: incoming.length - additions.length };
}
