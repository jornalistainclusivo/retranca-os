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
