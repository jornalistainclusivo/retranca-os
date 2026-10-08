import { getDb } from '@/db/client';
import { fetchAllRawArticles, fetchCategories, fetchWorkflowStages } from './articles';
import { toArticleProps } from '@/lib/adapters/articleAdapter';
import { getStoredArticles, getStoredCategories, getStoredWorkflowStages } from '@/lib/storage';
import { Article, CategoryEntity, WorkflowStage } from '@/types/editorial';

export interface EditorialWorkspace {
  articles: Article[];
  stages: WorkflowStage[];
  categories: CategoryEntity[];
}

export function projectArticleCategories(articles: Article[], categories: CategoryEntity[]): Article[] {
  const names = new Map(categories.filter(c => c.isActive).map(c => [c.id, c.name]));
  return articles.map(article => ({
    ...article,
    categoryTag: names.get(article.categoryId ?? '') ?? article.categoryTag,
  }));
}

export async function loadEditorialWorkspace(): Promise<EditorialWorkspace> {
  const native = typeof window !== 'undefined' &&
    (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
  // Initialize once, then publish a complete snapshot. Never seed sample articles.
  if (native) await getDb();
  const [allStages, allCategories, articles] = native
    ? await Promise.all([
      fetchWorkflowStages(), fetchCategories(),
      fetchAllRawArticles().then(rows => rows.map(row => toArticleProps(row.article, row.checklists, row.history))),
    ])
    : [getStoredWorkflowStages(), getStoredCategories(), getStoredArticles()];
  const stages = allStages.filter(s => s.isActive).sort((a, b) => a.orderIndex - b.orderIndex);
  const categories = allCategories.filter(c => c.isActive);
  return { stages, categories, articles: projectArticleCategories(articles, categories) };
}

export function reconcileCategorySelection(previous: string[], selected: string[], next: string[]): string[] {
  const wasAll = selected.length === 0 || previous.every(id => selected.includes(id));
  if (wasAll) return next;
  return next.filter(id => selected.includes(id) || !previous.includes(id));
}
