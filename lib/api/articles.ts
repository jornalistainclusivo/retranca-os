import { getDb } from '@/db/client';
import { articles, checklistItems, historyEntries, DbArticle, DbChecklistItem, DbHistoryEntry } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { invoke } from '@tauri-apps/api/core';
import { WorkflowStage, CategoryEntity, WorkflowLifecycleRole, SemanticClassification, CategoryOrigin, ChecklistTemplate } from '@/types/editorial';

export interface RawChecklistTemplateItem {
  label: string;
}

export interface RawChecklistTemplate {
  id: string;
  name: string;
  items: RawChecklistTemplateItem[];
  created_at: string;
}

export interface GetChecklistTemplatesResponse {
  templates: RawChecklistTemplate[];
}

export interface RawWorkflowStage {
  id: string;
  display_name: string;
  order_index: number;
  semantic_classification: string;
  lifecycle_role: string | null;
  is_active: boolean;
  created_at: string;
}

export interface RawCategory {
  id: string;
  name: string;
  origin: string;
  is_active: boolean;
  created_at: string;
}

export interface GetWorkflowStagesResponse {
  stages: RawWorkflowStage[];
}

export interface GetCategoriesResponse {
  categories: RawCategory[];
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
    
    // History is NOT deleted to prevent wiping out native transition history.
    // We only insert genuinely new history entries.
    if (raw.history.length > 0) {
      const existingHistory = await db.select().from(historyEntries).where(eq(historyEntries.articleId, raw.article.id));
      const existingHistoryIds = new Set(existingHistory.map((h: DbHistoryEntry) => h.id));
      const newHistory = raw.history.filter((h: DbHistoryEntry) => !existingHistoryIds.has(h.id));
      if (newHistory.length > 0) {
        await db.insert(historyEntries).values(newHistory);
      }
    }
  } else {
    await db.insert(articles).values(raw.article);
    if (raw.history.length > 0) {
      await db.insert(historyEntries).values(raw.history);
    }
  }
  
  if (raw.checklists.length > 0) {
    await db.insert(checklistItems).values(raw.checklists);
  }
};

export const deleteRawArticle = async (id: string): Promise<void> => {
  const db = await getDb();
  await db.delete(articles).where(eq(articles.id, id));
  await db.delete(checklistItems).where(eq(checklistItems.articleId, id));
  await db.delete(historyEntries).where(eq(historyEntries.articleId, id));
};

import {
  getStoredWorkflowStages,
  saveWorkflowStages,
  getStoredCategories,
  saveCategories,
  getStoredChecklistTemplates,
  saveChecklistTemplates,
  getStoredArticles,
  saveArticles,
  browserAssignArticleStage,
  browserAssignArticleCategory
} from '@/lib/storage';

const isTauri = () => typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__;

export const fetchWorkflowStages = async (): Promise<WorkflowStage[]> => {
  if (!isTauri()) return getStoredWorkflowStages();
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
  if (!isTauri()) return getStoredCategories();
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
  if (!isTauri()) {
    browserAssignArticleStage(articleId, workflowStageId);
    return;
  }
  await invoke('assign_article_stage', {
    request: {
      article_id: articleId,
      workflow_stage_id: workflowStageId,
    }
  });
};

export async function assignArticleCategory(articleId: string, categoryId: string): Promise<void> {
  if (!isTauri()) {
    browserAssignArticleCategory(articleId, categoryId);
    return;
  }
  await invoke('assign_article_category', {
    request: {
      article_id: articleId,
      category_id: categoryId
    }
  });
}

export const fetchChecklistTemplates = async (): Promise<ChecklistTemplate[]> => {
  if (!isTauri()) return getStoredChecklistTemplates();
  try {
    const response = await invoke<GetChecklistTemplatesResponse>('get_checklist_templates');
    return response.templates.map(t => ({
      id: t.id,
      name: t.name,
      items: t.items.map(i => ({ label: i.label })),
      createdAt: t.created_at,
    }));
  } catch (error) {
    console.error('Error fetching checklist templates via IPC:', error);
    throw error;
  }
};

export const createWorkflowStage = async (displayName: string, orderIndex: number, semanticClassification?: string): Promise<void> => {
  if (!isTauri()) {
    const stages = getStoredWorkflowStages();
    stages.push({
      id: `ws_${Date.now()}`,
      displayName,
      orderIndex,
      semanticClassification: semanticClassification as SemanticClassification || null,
      lifecycleRole: null,
      isActive: true,
      createdAt: new Date().toISOString()
    });
    saveWorkflowStages(stages);
    return;
  }
  await invoke('create_workflow_stage', {
    request: {
      display_name: displayName,
      order_index: orderIndex,
      semantic_classification: semanticClassification || null
    }
  });
};

export const updateWorkflowStage = async (id: string, displayName?: string, semanticClassification?: string): Promise<void> => {
  if (!isTauri()) {
    const stages = getStoredWorkflowStages();
    const idx = stages.findIndex(s => s.id === id);
    if (idx !== -1) {
      if (displayName) stages[idx].displayName = displayName;
      if (semanticClassification !== undefined) stages[idx].semanticClassification = semanticClassification as SemanticClassification || null;
      saveWorkflowStages(stages);
    }
    return;
  }
  await invoke('update_workflow_stage', {
    request: {
      id,
      display_name: displayName || null,
      semantic_classification: semanticClassification || null
    }
  });
};

export const reorderWorkflowStages = async (stageOrders: {id: string, orderIndex: number}[]): Promise<void> => {
  if (!isTauri()) {
    const stages = getStoredWorkflowStages();
    stageOrders.forEach(o => {
      const stage = stages.find(s => s.id === o.id);
      if (stage) stage.orderIndex = o.orderIndex;
    });
    saveWorkflowStages(stages);
    return;
  }
  await invoke('reorder_workflow_stages', {
    request: { stage_orders: stageOrders.map(s => ({ id: s.id, order_index: s.orderIndex })) }
  });
};

export const removeWorkflowStage = async (id: string, targetStageId: string): Promise<void> => {
  if (!isTauri()) {
    const stages = getStoredWorkflowStages();
    const idx = stages.findIndex(s => s.id === id);
    if (idx !== -1) {
      stages[idx].isActive = false;
      saveWorkflowStages(stages);

      const articles = getStoredArticles();
      let changed = false;
      articles.forEach(a => {
        if (a.workflowStageId === id) {
          a.workflowStageId = targetStageId;
          changed = true;
        }
      });
      if (changed) saveArticles(articles);
    }
    return;
  }
  await invoke('remove_workflow_stage', {
    request: {
      id,
      reassign_to_stage_id: targetStageId
    }
  });
};

export const createCategory = async (name: string): Promise<void> => {
  if (!isTauri()) {
    const cats = getStoredCategories();
    cats.push({
      id: `cat_${Date.now()}`,
      name,
      origin: 'custom',
      isActive: true,
      createdAt: new Date().toISOString()
    });
    saveCategories(cats);
    return;
  }
  await invoke('create_category', {
    request: { name }
  });
};

export const renameCategory = async (id: string, name: string): Promise<void> => {
  if (!isTauri()) {
    const cats = getStoredCategories();
    const idx = cats.findIndex(c => c.id === id);
    if (idx !== -1) {
      cats[idx].name = name;
      saveCategories(cats);
    }
    return;
  }
  await invoke('rename_category', {
    request: { id, name }
  });
};

export const removeCategory = async (id: string, targetCategoryId?: string): Promise<void> => {
  if (!isTauri()) {
    const cats = getStoredCategories();
    const idx = cats.findIndex(c => c.id === id);
    if (idx !== -1) {
      cats[idx].isActive = false;
      saveCategories(cats);

      if (targetCategoryId) {
        const articles = getStoredArticles();
        let changed = false;
        articles.forEach(a => {
          if (a.categoryId === id) {
            a.categoryId = targetCategoryId;
            changed = true;
          }
        });
        if (changed) saveArticles(articles);
      }
    }
    return;
  }
  await invoke('remove_category', {
    request: {
      id,
      reassign_to_category_id: targetCategoryId || null
    }
  });
};

export const createChecklistTemplate = async (name: string, items: {label: string}[]): Promise<void> => {
  if (!isTauri()) {
    const tmpls = getStoredChecklistTemplates();
    tmpls.push({
      id: `tmpl_${Date.now()}`,
      name,
      items,
      createdAt: new Date().toISOString()
    });
    saveChecklistTemplates(tmpls);
    return;
  }
  await invoke('create_checklist_template', {
    request: { name, items }
  });
};

export const updateChecklistTemplate = async (id: string, name: string, items: {label: string}[]): Promise<void> => {
  if (!isTauri()) {
    const tmpls = getStoredChecklistTemplates();
    const idx = tmpls.findIndex(t => t.id === id);
    if (idx !== -1) {
      tmpls[idx].name = name;
      tmpls[idx].items = items;
      saveChecklistTemplates(tmpls);
    }
    return;
  }
  await invoke('update_checklist_template', {
    request: { id, name, items }
  });
};

export const deleteChecklistTemplate = async (id: string): Promise<void> => {
  if (!isTauri()) {
    let tmpls = getStoredChecklistTemplates();
    tmpls = tmpls.filter(t => t.id !== id);
    saveChecklistTemplates(tmpls);
    return;
  }
  await invoke('delete_checklist_template', {
    request: { id }
  });
};

export const applyChecklistTemplate = async (articleId: string, templateId: string): Promise<void> => {
  if (!isTauri()) {
    const tmpls = getStoredChecklistTemplates();
    const template = tmpls.find(t => t.id === templateId);
    if (!template) return;

    const articles = getStoredArticles();
    const article = articles.find(a => a.id === articleId);
    if (!article) return;

    template.items.forEach((item: any) => {
      article.checklists.push({
        id: `ci_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        label: item.label,
        completed: false,
        category: 'editorial'
      });
    });
    saveArticles(articles);
    return;
  }
  await invoke('apply_checklist_template', {
    request: {
      article_id: articleId,
      template_id: templateId
    }
  });
};
