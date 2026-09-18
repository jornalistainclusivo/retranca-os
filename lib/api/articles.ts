import { getDb } from '@/db/client';
import { articles, checklistItems, historyEntries, DbArticle, DbChecklistItem, DbHistoryEntry } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { invoke } from '@tauri-apps/api/core';
import { WorkflowStage, CategoryEntity, WorkflowLifecycleRole, SemanticClassification, CategoryOrigin } from '@/types/editorial';

export interface GetWorkflowStagesResponse {
  stages: any[];
}

export interface GetCategoriesResponse {
  categories: any[];
}

export interface RawArticleData {
  article: DbArticle;
  checklists: DbChecklistItem[];
  history: DbHistoryEntry[];
}

export const fetchAllRawArticles = async (): Promise<RawArticleData[]> => {
  const db = await getDb();
  
  const allArticles = await db.select().from(articles);
  const allChecklists = await db.select().from(checklistItems);
  const allHistory = await db.select().from(historyEntries);

  return allArticles.map((art: any) => ({
    article: art,
    checklists: allChecklists.filter((c: any) => c.articleId === art.id),
    history: allHistory.filter((h: any) => h.articleId === art.id),
  }));
};

export const saveRawArticle = async (raw: RawArticleData): Promise<void> => {
  const db = await getDb();
  const existing = await db.select().from(articles).where(eq(articles.id, raw.article.id));
  
  if (existing.length > 0) {
    // PROTECT AUTHORITATIVE DOMAIN FIELDS FROM STALE FRONTEND OVERWRITE
    const current = existing[0];
    const updateData = { ...raw.article };
    updateData.workflowStageId = current.workflowStageId;
    updateData.categoryId = current.categoryId;
    updateData.completedAt = current.completedAt;

    await db.update(articles).set(updateData).where(eq(articles.id, raw.article.id));
    await db.delete(checklistItems).where(eq(checklistItems.articleId, raw.article.id));
    // History is NOT deleted/overwritten to prevent wiping out native transition history
    // We only insert new history if provided
  } else {
    await db.insert(articles).values(raw.article);
  }
  
  if (raw.checklists.length > 0) {
    await db.insert(checklistItems).values(raw.checklists);
  }
  
  if (raw.history.length > 0 && existing.length === 0) {
    await db.insert(historyEntries).values(raw.history);
  }
};

export const deleteRawArticle = async (id: string): Promise<void> => {
  const db = await getDb();
  await db.delete(articles).where(eq(articles.id, id));
  await db.delete(checklistItems).where(eq(checklistItems.articleId, id));
  await db.delete(historyEntries).where(eq(historyEntries.articleId, id));
};

export const fetchWorkflowStages = async (): Promise<WorkflowStage[]> => {
  try {
    const response = await invoke<GetWorkflowStagesResponse>('get_workflow_stages');
    return response.stages.map(s => ({
      id: s.id,
      displayName: s.display_name,
      orderIndex: s.order_index,
      semanticClassification: s.semantic_classification as SemanticClassification,
      lifecycleRole: s.lifecycle_role as WorkflowLifecycleRole,
      isActive: s.is_active,
      createdAt: s.created_at,
    }));
  } catch (error) {
    console.error('Error fetching workflow stages via IPC:', error);
    throw error;
  }
};

export const fetchCategories = async (): Promise<CategoryEntity[]> => {
  try {
    const response = await invoke<GetCategoriesResponse>('get_categories');
    return response.categories.map(c => ({
      id: c.id,
      name: c.name,
      origin: c.origin as CategoryOrigin,
      isActive: c.is_active,
      createdAt: c.created_at,
    }));
  } catch (error) {
    console.error('Error fetching categories via IPC:', error);
    throw error;
  }
};

export const assignArticleStage = async (articleId: string, workflowStageId: string): Promise<void> => {
  await invoke('assign_article_stage', {
    request: {
      article_id: articleId,
      workflow_stage_id: workflowStageId,
    }
  });
};

export async function assignArticleCategory(articleId: string, categoryId: string): Promise<void> {
  await invoke('assign_article_category', {
    request: {
      article_id: articleId,
      category_id: categoryId
    }
  });
}
