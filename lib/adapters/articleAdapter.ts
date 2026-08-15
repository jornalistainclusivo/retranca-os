import { Article, ChecklistItem, HistoryEntry } from '@/types/editorial';
import { DbArticle, DbChecklistItem, DbHistoryEntry } from '@/db/schema';

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
  };
};

export const fromArticleProps = (article: Article): { article: DbArticle; checklists: DbChecklistItem[]; history: DbHistoryEntry[] } => {
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
