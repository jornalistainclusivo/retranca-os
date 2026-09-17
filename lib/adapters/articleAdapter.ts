import { Article, ChecklistItem, HistoryEntry } from '@/types/editorial';
import { DbArticle, DbChecklistItem, DbHistoryEntry } from '@/db/schema';
import { STANDARD_WORKFLOW_IDS, STANDARD_CATEGORY_IDS } from '@/db/migrations/phase64StandardIds';

/**
 * Adapter Pattern: Isola os componentes React da estrutura do banco SQLite.
 */
export const toArticleProps = (
  dbArticle: DbArticle,
  dbChecklists: DbChecklistItem[],
  dbHistory: DbHistoryEntry[]
): Article => {
  return {
    id: dbArticle.id,
    title: dbArticle.title,
    status: dbArticle.status as Article['status'],
    categoryTag: dbArticle.categoryTag as Article['categoryTag'],
    tags: JSON.parse(dbArticle.tags),
    publishDate: dbArticle.publishDate,
    summary: dbArticle.summary || '',
    objective: dbArticle.objective || '',
    keyword: dbArticle.keyword || '',
    persona: dbArticle.persona || '',
    cta: dbArticle.cta || '',
    internalLinks: dbArticle.internalLinks || '',
    externalLinks: dbArticle.externalLinks || '',
    estimatedTime: dbArticle.estimatedTime || '',
    spentTime: dbArticle.spentTime || '',
    notes: dbArticle.notes || '',
    checklists: dbChecklists.map(c => ({
      id: c.id,
      label: c.label,
      completed: Boolean(c.completed),
      category: c.category as ChecklistItem['category'],
    })),
    history: dbHistory.map(h => ({
      id: h.id,
      date: h.date,
      action: h.action,
    })),
    createdAt: dbArticle.createdAt,
    updatedAt: dbArticle.updatedAt,
    completedAt: dbArticle.completedAt || undefined,
    workflowStageId: dbArticle.workflowStageId || undefined,
    categoryId: dbArticle.categoryId || undefined,
  };
};

export const fromArticleProps = (article: Article): { article: DbArticle; checklists: DbChecklistItem[]; history: DbHistoryEntry[] } => {
  const mapLegacyWorkflow = (status: string) => {
    switch (status) {
      case 'ideia': return STANDARD_WORKFLOW_IDS.IDEIA;
      case 'pesquisa': return STANDARD_WORKFLOW_IDS.PESQUISA;
      case 'escrita': return STANDARD_WORKFLOW_IDS.PRODUCAO;
      case 'revisao': return STANDARD_WORKFLOW_IDS.REVISAO;
      case 'publicado': return STANDARD_WORKFLOW_IDS.PUBLICADO;
      default: throw new Error(`ERR_MIGRATION_UNKNOWN_LEGACY_VALUE: Unknown status ${status}`);
    }
  };

  const mapLegacyCategory = (categoryTag: string) => {
    switch (categoryTag) {
      case 'IA': return STANDARD_CATEGORY_IDS.IA;
      case 'Acessibilidade': return STANDARD_CATEGORY_IDS.ACESSIBILIDADE;
      case 'Inclusão': return STANDARD_CATEGORY_IDS.INCLUSAO;
      case 'SEO': return STANDARD_CATEGORY_IDS.SEO;
      case 'Docs': return STANDARD_CATEGORY_IDS.DOCS;
      case 'Blog': return STANDARD_CATEGORY_IDS.BLOG;
      case 'Social': return STANDARD_CATEGORY_IDS.SOCIAL;
      case 'Linguagem Simples': return STANDARD_CATEGORY_IDS.LINGUAGEM_SIMPLES;
      default: throw new Error(`ERR_MIGRATION_UNKNOWN_LEGACY_VALUE: Unknown categoryTag ${categoryTag}`);
    }
  };

  return {
    article: {
      id: article.id,
      title: article.title,
      status: article.status,
      categoryTag: article.categoryTag,
      tags: JSON.stringify(article.tags),
      publishDate: article.publishDate,
      summary: article.summary,
      objective: article.objective,
      keyword: article.keyword,
      persona: article.persona,
      cta: article.cta,
      internalLinks: article.internalLinks,
      externalLinks: article.externalLinks,
      estimatedTime: article.estimatedTime,
      spentTime: article.spentTime,
      notes: article.notes,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      completedAt: article.completedAt || null,
      workflowStageId: article.workflowStageId || mapLegacyWorkflow(article.status),
      categoryId: article.categoryId || mapLegacyCategory(article.categoryTag),
    },
    checklists: article.checklists.map(c => ({
      id: c.id,
      articleId: article.id,
      label: c.label,
      completed: c.completed ? 1 : 0,
      category: c.category || null,
    })),
    history: article.history.map(h => ({
      id: h.id,
      articleId: article.id,
      date: h.date,
      action: h.action,
    })),
  };
};
