"use client";

import React, { useState, useEffect, useRef, useId, useCallback } from "react";
import { WorkflowStage, CategoryEntity, ChecklistTemplate, SemanticClassification } from "@/types/editorial";
import {
  createWorkflowStage,
  updateWorkflowStage,
  reorderWorkflowStages,
  removeWorkflowStage,
  createCategory,
  renameCategory,
  removeCategory,
  fetchChecklistTemplates,
  createChecklistTemplate,
  updateChecklistTemplate,
  deleteChecklistTemplate,
  applyChecklistTemplate
} from "@/lib/api/articles";
import { validateStageA11y, validateCategoryA11y } from "@/lib/utils/workflowValidation";
import { Plus, Edit2, Trash2, Check, X, ArrowUp, ArrowDown } from "lucide-react";

interface WorkflowEditorProps {
  workflowStages: WorkflowStage[];
  categories: CategoryEntity[];
  onUpdateStages: () => Promise<void>;
  onUpdateCategories: () => Promise<void>;
  currentArticleId?: string;
}

export const WorkflowEditor: React.FC<WorkflowEditorProps> = ({
  workflowStages,
  categories,
  onUpdateStages,
  onUpdateCategories,
  currentArticleId
}) => {
  const panelId = useId();
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null);
  const notify = useCallback((text: string, error = false) => setFeedback({ text, error }), []);

  const [activeTab, setActiveTab] = useState<"stages" | "categories" | "templates">("stages");
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const focusRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLSelectElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const reorderFocusRef = useRef<{ name: string; direction: 'up' | 'down' } | null>(null);
  const tabRef = useRef<HTMLButtonElement>(null);
  const rememberFocus = () => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
  };

  // Stages
  const [newStageName, setNewStageName] = useState("");
  const [newStageClass, setNewStageClass] = useState<SemanticClassification | "">("");
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [editStageName, setEditStageName] = useState("");
  const [editStageClass, setEditStageClass] = useState<SemanticClassification | "">("");

  const [deletingStage, setDeletingStage] = useState<string | null>(null);
  const [reassignStageTarget, setReassignStageTarget] = useState<string>("");

  // Categories
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");

  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
  const [reassignCategoryTarget, setReassignCategoryTarget] = useState<string>("");

  // Templates
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateItems, setNewTemplateItems] = useState<{label: string}[]>([{ label: "" }]);

  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editTemplateName, setEditTemplateName] = useState("");
  const [editTemplateItems, setEditTemplateItems] = useState<{label: string}[]>([]);

  const loadTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchChecklistTemplates();
      setTemplates(data);
    } catch (e) {
      notify("Erro ao carregar templates. Tente novamente.", true);
      console.error(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTemplates().catch(() => undefined);
  }, [loadTemplates]);

  useEffect(() => {
    if (editingStage || editingCategory || editingTemplate) {
      focusRef.current?.focus();
    }
  }, [editingStage, editingCategory, editingTemplate]);

  const handleCreateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    const a11yCheck = validateStageA11y(newStageName, workflowStages);
    if (!a11yCheck.isValid) { notify(a11yCheck.errors.join(" "), true); return; }
    try {
      await createWorkflowStage(newStageName, workflowStages.filter(s => s.isActive).length, newStageClass || undefined);
      setNewStageName("");
      setNewStageClass("");
      await onUpdateStages();
      notify("Etapa criada.");
    } catch (e) { notify("Erro ao criar etapa.", true); console.error(e); }
  };

  const handleUpdateStage = async () => {
    if (!editingStage) return;
    const a11yCheck = validateStageA11y(editStageName, workflowStages.filter(s => s.id !== editingStage));
    if (!a11yCheck.isValid) { notify(a11yCheck.errors.join(" "), true); return; }
    try {
      await updateWorkflowStage(editingStage, editStageName, editStageClass || null);
      setEditingStage(null);
      await onUpdateStages();
      notify("Etapa atualizada.");
    } catch (e) { notify("Erro ao atualizar etapa.", true); console.error(e); }
  };

  const handleMoveStage = async (index: number, direction: 'up' | 'down') => {
    const activeStages = workflowStages.filter(s => s.isActive).sort((a, b) => a.orderIndex - b.orderIndex);
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === activeStages.length - 1) return;

    const newStages = [...activeStages];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newStages[index];
    newStages[index] = newStages[swapIndex];
    newStages[swapIndex] = temp;

    const orders = newStages.map((s, i) => ({ id: s.id, orderIndex: i }));
    reorderFocusRef.current = { name: activeStages[index].displayName, direction };
    try {
      await reorderWorkflowStages(orders);
      await onUpdateStages();
      notify("Ordem das etapas atualizada.");
    } catch(e) { reorderFocusRef.current = null; notify("Erro ao reordenar.", true); console.error(e); }
  };

  const confirmDeleteStage = async () => {
    if (!deletingStage || !reassignStageTarget) return;
    try {
      await removeWorkflowStage(deletingStage, reassignStageTarget);
      setDeletingStage(null);
      setReassignStageTarget("");
      await onUpdateStages();
      notify("Etapa excluída e artigos reatribuídos.");
    } catch (e) { notify("Erro ao excluir etapa.", true); console.error(e); }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const a11yCheck = validateCategoryA11y(newCategoryName, categories);
    if (!a11yCheck.isValid) { notify(a11yCheck.errors.join(" "), true); return; }
    try {
      await createCategory(newCategoryName);
      setNewCategoryName("");
      await onUpdateCategories();
      notify("Categoria criada.");
    } catch (e) { notify("Erro ao criar categoria.", true); console.error(e); }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    const a11yCheck = validateCategoryA11y(editCategoryName, categories.filter(c => c.id !== editingCategory));
    if (!a11yCheck.isValid) { notify(a11yCheck.errors.join(" "), true); return; }
    try {
      await renameCategory(editingCategory, editCategoryName);
      setEditingCategory(null);
      await onUpdateCategories();
      notify("Categoria atualizada.");
    } catch (e) { notify("Erro ao renomear categoria.", true); console.error(e); }
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCategory || !reassignCategoryTarget) return;
    try {
      await removeCategory(deletingCategory, reassignCategoryTarget);
      setDeletingCategory(null);
      setReassignCategoryTarget("");
      await onUpdateCategories();
      notify("Categoria excluída e artigos reatribuídos.");
    } catch (e) { notify("Erro ao excluir categoria.", true); console.error(e); }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim() || !newTemplateItems.length || newTemplateItems.some(i => !i.label.trim())) {
      notify("Preencha o nome do template e todos os itens.", true);
      return;
    }
    try {
      await createChecklistTemplate(newTemplateName, newTemplateItems);
      setNewTemplateName("");
      setNewTemplateItems([{ label: "" }]);
      await loadTemplates();
      notify("Template criado.");
    } catch (e) { notify("Erro ao criar template.", true); console.error(e); }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;
    if (!editTemplateName.trim() || !editTemplateItems.length || editTemplateItems.some(i => !i.label.trim())) {
      notify("Preencha o nome do template e todos os itens.", true);
      return;
    }
    try {
      await updateChecklistTemplate(editingTemplate, editTemplateName, editTemplateItems);
      await loadTemplates();
      setEditingTemplate(null);
      notify("Template atualizado.");
    } catch (e) { notify("Erro ao atualizar template.", true); console.error(e); }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm("Excluir template? (Isso não afeta pautas existentes)")) {
      try {
        await deleteChecklistTemplate(id);
        await loadTemplates();
        tabRef.current?.focus();
        notify("Template excluído. Checklists das pautas preservados.");
      } catch (e) { notify("Erro ao excluir template.", true); console.error(e); }
    }
  };

  const moveTemplateItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...editTemplateItems];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newItems.length) return;
    const temp = newItems[index];
    newItems[index] = newItems[swapIndex];
    newItems[swapIndex] = temp;
    setEditTemplateItems(newItems);
  };

  const applyTemplate = async (id: string) => {
    if (!currentArticleId) return;
    try {
      await applyChecklistTemplate(currentArticleId, id);
      notify("Template aplicado com sucesso!");
    } catch (e) {
      notify("Erro ao aplicar template.", true);
      console.error(e);
    }
  };

  useEffect(() => {
    if (deletingStage || deletingCategory) {
      targetRef.current?.focus();
    } else if (!editingStage && !editingCategory && !editingTemplate && returnFocusRef.current) {
      const target = returnFocusRef.current;
      const label = target.getAttribute('aria-label');
      const replacement = label ? Array.from(containerRef.current?.querySelectorAll<HTMLButtonElement>('button') || [])
        .find(button => button.getAttribute('aria-label') === label && !button.disabled) : undefined;
      (target.isConnected ? target : replacement || tabRef.current)?.focus();
      returnFocusRef.current = null;
    }
  }, [deletingStage, deletingCategory, editingStage, editingCategory, editingTemplate]);

  useEffect(() => {
    const moved = reorderFocusRef.current;
    if (!moved) return;
    const buttons = Array.from(containerRef.current?.querySelectorAll<HTMLButtonElement>('button') || []);
    const directions = moved.direction === 'up' ? ['cima', 'baixo'] : ['baixo', 'cima'];
    for (const direction of directions) {
      const button = buttons.find(button => button.getAttribute('aria-label') === `Mover etapa ${moved.name} para ${direction}` && !button.disabled);
      if (button) { button.focus(); break; }
    }
    reorderFocusRef.current = null;
  }, [workflowStages]);

  const tabs = ["stages", "categories", "templates"] as const;
  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const index = tabs.indexOf(activeTab);
    const next = event.key === "ArrowRight" ? (index + 1) % tabs.length
      : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length
      : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
    if (next < 0) return;
    event.preventDefault();
    setActiveTab(tabs[next]);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  };

  const activeStages = workflowStages.filter(s => s.isActive).sort((a, b) => a.orderIndex - b.orderIndex);
  const activeCategories = categories.filter(c => c.isActive);

  return (
    <div ref={containerRef} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full max-h-[85vh] overflow-hidden [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-2 [&_:focus-visible]:outline-blue-600">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Configurações Editoriais</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personalize fluxos de trabalho, categorias e checklists editoriais.
          </p>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 mt-2" role="tablist">
        {tabs.map((tab, index) => (
          <button key={tab} ref={activeTab === tab ? tabRef : undefined} role="tab" id={`${panelId}-tab-${tab}`} aria-controls={`${panelId}-panel-${tab}`} aria-selected={activeTab === tab} tabIndex={activeTab === tab ? 0 : -1} onKeyDown={handleTabKeyDown} onClick={() => setActiveTab(tab)} className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
            {["Etapas do Fluxo", "Categorias", "Templates de Checklist"][index]}
          </button>
        ))}
      </div>
      <div role={feedback?.error ? "alert" : "status"} aria-atomic="true" className="px-6 pt-2 text-sm">
        {feedback?.text}
      </div>
      <div role="tabpanel" id={`${panelId}-panel-${activeTab}`} aria-labelledby={`${panelId}-tab-${activeTab}`} tabIndex={0} className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950/50">

        {activeTab === "stages" && (
          <div className="max-w-3xl space-y-8">
            <div className="space-y-3">
              {activeStages.map((stage, i) => (
                <div key={stage.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  {editingStage === stage.id ? (
                    <div className="flex gap-2 items-center">
                      <input ref={focusRef} type="text" value={editStageName} onChange={e => setEditStageName(e.target.value)} className="flex-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 outline-none text-sm" aria-label="Nome da etapa"/>
                      <select value={editStageClass} onChange={e => setEditStageClass(e.target.value as SemanticClassification)} className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 outline-none text-sm" aria-label="Classe semântica">
                        <option value="">Sem classificação</option>
                        <option value="IDEA">Ideia (Backlog)</option>
                        <option value="RESEARCH">Pesquisa</option>
                        <option value="DRAFTING">Redação</option>
                        <option value="REVIEW">Revisão</option>
                        <option value="PUBLISHED">Publicado (recomendação de IA)</option>
                      </select>
                      <button onClick={handleUpdateStage} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50" aria-label="Salvar">Salvar</button>
                      <button onClick={() => setEditingStage(null)} className="bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2 rounded-lg text-sm font-semibold" aria-label="Cancelar">Cancelar</button>
                    </div>
                  ) : deletingStage === stage.id ? (
                    <div className="flex flex-wrap gap-2 items-center">
                      {stage.lifecycleRole === "PUBLICATION" && (
                        <p className="w-full text-sm" id={`${panelId}-publication-transfer`}>O destino receberá a função de publicação. Pautas já publicadas mantêm a data de conclusão; pautas que já estiverem no destino também passam a ser consideradas publicadas.</p>
                      )}
                      <span className="text-sm font-semibold text-red-600 dark:text-red-400">Reatribuir artigos para:</span>
                      <select ref={targetRef} value={reassignStageTarget} onChange={e => setReassignStageTarget(e.target.value)} aria-describedby={stage.lifecycleRole === "PUBLICATION" ? `${panelId}-publication-transfer` : undefined} className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 outline-none flex-1 text-sm" aria-label="Selecione a etapa de destino">
                        <option value="" disabled>Selecione...</option>
                        {activeStages.filter(s => s.id !== stage.id).map(s => (
                          <option key={s.id} value={s.id}>{s.displayName}</option>
                        ))}
                      </select>
                      <button onClick={confirmDeleteStage} disabled={!reassignStageTarget} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">Confirmar Exclusão</button>
                      <button onClick={() => setDeletingStage(null)} className="bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2 rounded-lg text-sm font-semibold">Cancelar</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <button disabled={i === 0} onClick={() => handleMoveStage(i, 'up')} aria-label={`Mover etapa ${stage.displayName} para cima`} className="text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400 p-1"><ArrowUp className="w-4 h-4" /></button>
                          <button disabled={i === activeStages.length - 1} onClick={() => handleMoveStage(i, 'down')} aria-label={`Mover etapa ${stage.displayName} para baixo`} className="text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400 p-1"><ArrowDown className="w-4 h-4" /></button>
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{stage.displayName}</h3>
                          <p className="text-xs font-mono text-slate-500 uppercase mt-1">
                            {stage.semanticClassification || "CUSTOMIZADO"}
                            {stage.lifecycleRole === "PUBLICATION" && " • (PUBLICAÇÃO)"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { rememberFocus(); setEditingStage(stage.id); setEditStageName(stage.displayName); setEditStageClass(stage.semanticClassification || ""); }} aria-label={`Editar etapa ${stage.displayName}`} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg disabled:opacity-50"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => { rememberFocus(); setDeletingStage(stage.id); }} disabled={activeStages.length <= 1} aria-label={`Excluir etapa ${stage.displayName}`} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {(
              <div className="bg-slate-100 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Adicionar Nova Etapa</h3>
                <form onSubmit={handleCreateStage} className="flex gap-3">
                  <input type="text" required aria-label="Nome da nova etapa" value={newStageName} onChange={(e) => setNewStageName(e.target.value)} placeholder="Nome da etapa" className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  <select aria-label="Classificação da nova etapa" value={newStageClass} onChange={(e) => setNewStageClass(e.target.value as SemanticClassification)} className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Sem classificação</option>
                    <option value="IDEA">Ideia (Backlog)</option>
                    <option value="RESEARCH">Pesquisa</option>
                    <option value="DRAFTING">Redação</option>
                    <option value="REVIEW">Revisão</option>
                    <option value="PUBLISHED">Publicado (recomendação de IA)</option>
                  </select>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4" />Adicionar</button>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab === "categories" && (
          <div className="max-w-2xl space-y-8">
            <div className="grid gap-3">
              {activeCategories.map(cat => (
                <div key={cat.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  {editingCategory === cat.id ? (
                    <div className="flex gap-2 items-center">
                      <input ref={focusRef} type="text" value={editCategoryName} onChange={e => setEditCategoryName(e.target.value)} className="flex-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 outline-none text-sm" aria-label="Nome da categoria" />
                      <button onClick={handleUpdateCategory} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">Salvar</button>
                      <button onClick={() => setEditingCategory(null)} className="bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2 rounded-lg text-sm font-semibold">Cancelar</button>
                    </div>
                  ) : deletingCategory === cat.id ? (
                    <div className="flex gap-2 items-center">
                      <span className="text-sm font-semibold text-red-600 dark:text-red-400">Reatribuir para:</span>
                      <select ref={targetRef} value={reassignCategoryTarget} onChange={e => setReassignCategoryTarget(e.target.value)} className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 outline-none flex-1 text-sm" aria-label="Categoria de destino">
                        <option value="" disabled>Selecione...</option>
                        {activeCategories.filter(c => c.id !== cat.id).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <button onClick={confirmDeleteCategory} disabled={!reassignCategoryTarget} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">Confirmar Exclusão</button>
                      <button onClick={() => setDeletingCategory(null)} className="bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2 rounded-lg text-sm font-semibold">Cancelar</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{cat.name}</h3>
                        <p className="text-xs text-slate-500 mt-1">Origem: <span className="font-mono bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5">{cat.origin}</span></p>
                      </div>
                      {cat.origin === 'custom' && (
                        <div className="flex gap-2">
                          <button onClick={() => { rememberFocus(); setEditingCategory(cat.id); setEditCategoryName(cat.name); }} aria-label={`Editar categoria ${cat.name}`} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg disabled:opacity-50"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => { rememberFocus(); setDeletingCategory(cat.id); }} aria-label={`Excluir categoria ${cat.name}`} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {(
              <div className="bg-slate-100 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Adicionar Categoria</h3>
                <form onSubmit={handleCreateCategory} className="flex gap-3">
                  <input type="text" required aria-label="Nome da nova categoria" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Nome da categoria" className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4" />Adicionar</button>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab === "templates" && (
          <div className="max-w-3xl space-y-8">
            {isLoading ? (
              <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div></div></div>
            ) : (
              <div className="grid gap-4">
                {templates.map(tpl => (
                  <div key={tpl.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    {editingTemplate === tpl.id ? (
                      <div className="space-y-4">
                        <input ref={focusRef} type="text" value={editTemplateName} onChange={e => setEditTemplateName(e.target.value)} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 font-bold outline-none focus:ring-2 focus:ring-blue-500" aria-label="Nome do template" />
                        <div className="space-y-2">
                          {editTemplateItems.map((item, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <div className="flex flex-col gap-1">
                                <button disabled={idx === 0} onClick={() => moveTemplateItem(idx, 'up')} type="button" aria-label={`Mover item ${idx + 1} para cima`} className="text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400 p-1"><ArrowUp className="w-3 h-3" /></button>
                                <button disabled={idx === editTemplateItems.length - 1} onClick={() => moveTemplateItem(idx, 'down')} type="button" aria-label={`Mover item ${idx + 1} para baixo`} className="text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400 p-1"><ArrowDown className="w-3 h-3" /></button>
                              </div>
                              <input type="text" required value={item.label} onChange={e => setEditTemplateItems(editTemplateItems.map((it, i) => i === idx ? { label: e.target.value } : it))} className="flex-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 outline-none text-sm focus:ring-2 focus:ring-blue-500" aria-label={`Item ${idx+1}`} />
                              <button type="button" onClick={() => setEditTemplateItems(editTemplateItems.filter((_, i) => i !== idx))} disabled={editTemplateItems.length <= 1} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50" aria-label={`Remover item ${idx + 1}`}><Trash2 className="w-4 h-4" /></button>
                            </div>
                          ))}
                        </div>
                        <button type="button" onClick={() => setEditTemplateItems([...editTemplateItems, {label:""}])} className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"><Plus className="w-4 h-4" />Adicionar item</button>
                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                          <button onClick={handleUpdateTemplate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">Salvar Alterações</button>
                          <button onClick={() => setEditingTemplate(null)} className="bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-semibold">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-bold text-slate-900 dark:text-slate-100">{tpl.name}</h3>
                          <div className="flex gap-2">
                            {currentArticleId && (
                              <button onClick={() => applyTemplate(tpl.id)} className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 px-3 py-1 rounded-lg text-sm font-semibold transition-colors" aria-label={`Aplicar template ${tpl.name}`}>Aplicar no Artigo</button>
                            )}
                            <button onClick={() => { rememberFocus(); setEditingTemplate(tpl.id); setEditTemplateName(tpl.name); setEditTemplateItems(tpl.items.map(item => ({ ...item }))); }} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg disabled:opacity-50" aria-label={`Editar template ${tpl.name}`}><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteTemplate(tpl.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50" aria-label={`Excluir template ${tpl.name}`}><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <ul className="space-y-2">
                          {tpl.items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                              <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /><span>{item.label}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                ))}
                {templates.length === 0 && (
                  <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    Nenhum template criado ainda.
                  </div>
                )}
              </div>
            )}

            {(
              <div className="bg-slate-100 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800 mt-8">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Criar Novo Template</h3>
                <form onSubmit={handleCreateTemplate} className="space-y-4">
                  <input type="text" required aria-label="Nome do novo template" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} placeholder="Nome do Template" className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  <div className="space-y-2">
                    {newTemplateItems.map((item, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input type="text" required aria-label={`Novo item ${idx + 1}`} value={item.label} onChange={(e) => setNewTemplateItems(newTemplateItems.map((it, i) => i === idx ? { label: e.target.value } : it))} placeholder={`Item ${idx + 1}`} className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                        {newTemplateItems.length > 1 && (
                          <button type="button" aria-label={`Remover novo item ${idx + 1}`} onClick={() => setNewTemplateItems(newTemplateItems.filter((_, i) => i !== idx))} className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"><X className="w-4 h-4" /></button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => setNewTemplateItems([...newTemplateItems, { label: "" }])} className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"><Plus className="w-4 h-4" /> Adicionar item</button>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 mt-4"><Check className="w-4 h-4" />Salvar Template</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
