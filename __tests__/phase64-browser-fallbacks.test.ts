import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createWorkflowStage,
  updateWorkflowStage,
  reorderWorkflowStages,
  removeWorkflowStage,
  createCategory,
  renameCategory,
  removeCategory,
  createChecklistTemplate,
  updateChecklistTemplate,
  deleteChecklistTemplate,
  applyChecklistTemplate
} from '@/lib/api/articles';
import {
  getStoredWorkflowStages,
  getStoredCategories,
  getStoredChecklistTemplates,
  getStoredArticles,
  saveArticles,
  saveChecklistTemplates,
  saveCategories,
  saveWorkflowStages
} from '@/lib/storage';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; }
  };
})();

describe('Phase 6.4 Browser Fallback Parity', () => {
  beforeEach(() => {
    Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });
    Object.defineProperty(global, 'window', {
      value: {
        dispatchEvent: vi.fn(),
        __TAURI_INTERNALS__: false
      },
      writable: true
    });
    localStorage.clear();

    // Seed initial stages
    saveWorkflowStages([
      { id: 'ws_1', displayName: 'Stage 1', orderIndex: 0, semanticClassification: null, lifecycleRole: null, isActive: true, createdAt: new Date().toISOString() },
      { id: 'ws_2', displayName: 'Stage 2', orderIndex: 1, semanticClassification: null, lifecycleRole: 'PUBLICATION', isActive: true, createdAt: new Date().toISOString() }
    ]);

    // Seed initial categories
    saveCategories([
      { id: 'cat_standard', name: 'Standard', origin: 'standard', isActive: true, createdAt: new Date().toISOString() },
      { id: 'cat_custom', name: 'Custom', origin: 'custom', isActive: true, createdAt: new Date().toISOString() }
    ]);

    // Seed initial templates
    saveChecklistTemplates([
      { id: 'tmpl_1', name: 'Existing Template', items: [{ label: 'Task 1' }], createdAt: new Date().toISOString() }
    ]);

    // Seed articles
    saveArticles([
      { id: 'art_1', title: 'Art 1', workflowStageId: 'ws_1', categoryId: 'cat_custom', checklists: [] } as any
    ]);
  });

  describe('WORKFLOW', () => {
    it('canonical stable IDs and unique active names', async () => {
      await createWorkflowStage(' New Stage ', 2);
      const stages = getStoredWorkflowStages();
      const newStage = stages.find(s => s.displayName === 'New Stage');
      expect(newStage).toBeDefined();
      expect(newStage?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

      await expect(createWorkflowStage('new stage', 3)).rejects.toThrow('Duplicate active stage name');
      await expect(createWorkflowStage('   ', 3)).rejects.toThrow('Invalid stage name');
    });

    it('complete contiguous ordering and minimum stage invariant', async () => {
      let stages = getStoredWorkflowStages();
      await removeWorkflowStage('ws_1', 'ws_2');
      stages = getStoredWorkflowStages();
      const activeStages = stages.filter(s => s.isActive);
      expect(activeStages).toHaveLength(1);
      expect(activeStages[0].orderIndex).toBe(0);

      await expect(removeWorkflowStage('ws_2', 'ws_2')).rejects.toThrow('ERR_LAST_STAGE_REMOVAL');
    });

    it('stage order insertion parity', async () => {
      await expect(createWorkflowStage('Negative', -1)).rejects.toThrow('ERR_INVALID_WORKFLOW');
      await expect(createWorkflowStage('Out of bounds', 3)).rejects.toThrow('ERR_INVALID_WORKFLOW');

      await createWorkflowStage('Append', 2);
      let stages = getStoredWorkflowStages().filter(s => s.isActive).sort((a,b) => a.orderIndex - b.orderIndex);
      expect(stages[2].displayName).toBe('Append');
      expect(stages[2].orderIndex).toBe(2);

      await createWorkflowStage('Prepend', 0);
      stages = getStoredWorkflowStages().filter(s => s.isActive).sort((a,b) => a.orderIndex - b.orderIndex);
      expect(stages[0].displayName).toBe('Prepend');
      expect(stages[0].orderIndex).toBe(0);
      expect(stages[1].displayName).toBe('Stage 1');
      expect(stages[1].orderIndex).toBe(1);

      await createWorkflowStage('Middle', 2);
      stages = getStoredWorkflowStages().filter(s => s.isActive).sort((a,b) => a.orderIndex - b.orderIndex);
      expect(stages[2].displayName).toBe('Middle');
      expect(stages[2].orderIndex).toBe(2);
      expect(stages[3].displayName).toBe('Stage 2');
      expect(stages[3].orderIndex).toBe(3);
    });

    it('workflow removal target validation', async () => {
      await createWorkflowStage('ws_3', 2);

      await expect(removeWorkflowStage('ws_1', 'ws_1')).rejects.toThrow('ERR_INVALID_WORKFLOW');
      await expect(removeWorkflowStage('ws_1', 'nonexistent')).rejects.toThrow('ERR_INVALID_WORKFLOW');

      await removeWorkflowStage('ws_1', 'ws_2');
      await expect(removeWorkflowStage('ws_2', 'ws_1')).rejects.toThrow('ERR_INVALID_WORKFLOW');
    });

    it('PUBLICATION role transfer and article reassignment', async () => {
      await removeWorkflowStage('ws_2', 'ws_1');
      const stages = getStoredWorkflowStages();
      const ws1 = stages.find(s => s.id === 'ws_1');
      const ws2 = stages.find(s => s.id === 'ws_2');

      expect(ws1?.lifecycleRole).toBe('PUBLICATION');
      expect(ws2?.lifecycleRole).toBeNull();
      expect(ws2?.isActive).toBe(false);

      const activePubs = stages.filter(s => s.isActive && s.lifecycleRole === 'PUBLICATION');
      expect(activePubs).toHaveLength(1);
    });

    it('stage soft-delete name reuse', async () => {
      await createWorkflowStage('To Delete', 2);
      const stages1 = getStoredWorkflowStages();
      const toDelete = stages1.find(s => s.displayName === 'To Delete')!;

      await removeWorkflowStage(toDelete.id, 'ws_1');

      const stages2 = getStoredWorkflowStages();
      const deletedStage = stages2.find(s => s.id === toDelete.id);
      expect(deletedStage?.isActive).toBe(false);
      expect(deletedStage?.displayName).toBe(`__deleted__${toDelete.id}`);

      await createWorkflowStage('To Delete', 2);
      const stages3 = getStoredWorkflowStages();
      expect(stages3.filter(s => s.isActive && s.displayName === 'To Delete')).toHaveLength(1);
    });
  });

  describe('CATEGORIES', () => {
    it('canonical stable IDs and unique active names', async () => {
      await createCategory(' New Cat ');
      const cats = getStoredCategories();
      const newCat = cats.find(c => c.name === 'New Cat');
      expect(newCat).toBeDefined();
      expect(newCat?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

      await expect(createCategory('new cat')).rejects.toThrow('Duplicate category name');
      await expect(createCategory('   ')).rejects.toThrow('Invalid category name');
    });

    it('standard category protection', async () => {
      await expect(renameCategory('cat_standard', 'Renamed')).rejects.toThrow('Cannot rename standard category');
      await expect(removeCategory('cat_standard')).rejects.toThrow('ERR_INVALID_CATEGORY');
    });

    it('category removal target validation', async () => {
      await expect(removeCategory('cat_custom', 'cat_custom')).rejects.toThrow('ERR_INVALID_CATEGORY');
      await expect(removeCategory('cat_custom', 'nonexistent')).rejects.toThrow('ERR_INVALID_CATEGORY');

      await createCategory('Temp');
      const cats = getStoredCategories();
      const tempCat = cats.find(c => c.name === 'Temp')!;
      await removeCategory(tempCat.id);

      await expect(removeCategory('cat_custom', tempCat.id)).rejects.toThrow('ERR_INVALID_CATEGORY');

      await expect(removeCategory('cat_custom')).rejects.toThrow('ERR_INVALID_CATEGORY');

      await removeCategory('cat_custom', 'cat_standard');
      const catsAfter = getStoredCategories();
      expect(catsAfter.find(c => c.id === 'cat_custom')?.isActive).toBe(false);

      const articles = getStoredArticles();
      expect(articles[0].categoryId).toBe('cat_standard');
    });

    it('category soft-delete name reuse', async () => {
      await createCategory('Cat To Delete');
      const cats1 = getStoredCategories();
      const catToDelete = cats1.find(c => c.name === 'Cat To Delete')!;

      await removeCategory(catToDelete.id, 'cat_standard');

      const cats2 = getStoredCategories();
      const deletedCat = cats2.find(c => c.id === catToDelete.id);
      expect(deletedCat?.isActive).toBe(false);
      expect(deletedCat?.name).toBe(`__deleted__${catToDelete.id}`);

      await createCategory('Cat To Delete');
      const cats3 = getStoredCategories();
      expect(cats3.filter(c => c.isActive && c.name === 'Cat To Delete')).toHaveLength(1);
    });
  });

  describe('CHECKLIST TEMPLATES', () => {
    it('canonical stable IDs and unique names', async () => {
      await createChecklistTemplate(' New Tmpl ', [{label: 'Item'}]);
      const tmpls = getStoredChecklistTemplates();
      const newTmpl = tmpls.find(t => t.name === 'New Tmpl');
      expect(newTmpl).toBeDefined();
      expect(newTmpl?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

      await expect(createChecklistTemplate('new tmpl', [{label: 'x'}])).rejects.toThrow('Duplicate template name');
      await expect(createChecklistTemplate('   ', [{label: 'x'}])).rejects.toThrow('Invalid template name');
    });

    it('applied copies receive fresh IDs and preserve isolation', async () => {
      await applyChecklistTemplate('art_1', 'tmpl_1');
      const articles = getStoredArticles();
      const art = articles.find(a => a.id === 'art_1');

      expect(art?.checklists).toHaveLength(1);
      const appliedItem = art?.checklists[0]!;
      expect(appliedItem.label).toBe('Task 1');
      expect(appliedItem.completed).toBe(false);
      expect(appliedItem.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

      // Editing template does not affect article
      await updateChecklistTemplate('tmpl_1', 'Edited', [{label: 'Edited Task'}]);
      const tmpls = getStoredChecklistTemplates();
      expect(tmpls.find(t => t.id === 'tmpl_1')?.items[0].label).toBe('Edited Task');

      const articlesAfter = getStoredArticles();
      expect(articlesAfter.find(a => a.id === 'art_1')?.checklists[0].label).toBe('Task 1');
    });
  });
});
