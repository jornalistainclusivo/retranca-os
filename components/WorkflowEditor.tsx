"use client";

import React, { useState, useEffect } from "react";
import { WorkflowStage, CategoryEntity, ChecklistTemplate, SemanticClassification } from "@/types/editorial";
import { useEntitlement } from "@/lib/contexts/EntitlementContext";
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
  deleteChecklistTemplate
} from "@/lib/api/articles";
import { validateStageA11y, validateCategoryA11y, canExecuteProAction } from "@/lib/utils/workflowValidation";
import { Lock, Plus, GripVertical, Edit2, Trash2, Check, X, ShieldAlert } from "lucide-react";

interface WorkflowEditorProps {
  workflowStages: WorkflowStage[];
  categories: CategoryEntity[];
  onUpdateStages: () => Promise<void>;
  onUpdateCategories: () => Promise<void>;
}

export const WorkflowEditor: React.FC<WorkflowEditorProps> = ({
  workflowStages,
  categories,
  onUpdateStages,
  onUpdateCategories,
}) => {
  const { isPremium } = useEntitlement();
  const [activeTab, setActiveTab] = useState<"stages" | "categories" | "templates">("stages");
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New stage form
  const [newStageName, setNewStageName] = useState("");
  const [newStageClass, setNewStageClass] = useState<SemanticClassification | "">("");

  // New category form
  const [newCategoryName, setNewCategoryName] = useState("");

  // New template form
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateItems, setNewTemplateItems] = useState<{label: string}[]>([{ label: "" }]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const data = await fetchChecklistTemplates();
      setTemplates(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTemplates();
  }, []);

  const handleCreateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canExecuteProAction(isPremium) || !newStageClass) return;

    const a11yCheck = validateStageA11y(newStageName, workflowStages);
    if (!a11yCheck.isValid) {
      alert(a11yCheck.errors.join("\n"));
      return;
    }

    try {
      await createWorkflowStage(newStageName, workflowStages.length, newStageClass);
      setNewStageName("");
      setNewStageClass("");
      await onUpdateStages();
    } catch (e) {
      alert("Erro ao criar etapa.");
      console.error(e);
    }
  };

  const handleDeleteStage = async (id: string) => {
    if (!canExecuteProAction(isPremium)) return;
    // Basic UI guard (backend enforces actual constraints)
    const active = workflowStages.filter(s => s.isActive);
    if (active.length <= 1) {
      alert("Aviso: O domínio requer ao menos uma etapa ativa.");
      return;
    }

    // In a real UX we'd prompt for target stage, for now we just delete
    // Wait, the API requires a target_stage_id to move articles to.
    const target = active.find(s => s.id !== id);
    if (!target) return;

    if (confirm("Mover pautas desta etapa para '" + target.displayName + "' e excluir?")) {
      try {
        await removeWorkflowStage(id, target.id);
        await onUpdateStages();
      } catch (e) {
        alert("Erro ao excluir etapa.");
        console.error(e);
      }
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canExecuteProAction(isPremium)) return;

    const a11yCheck = validateCategoryA11y(newCategoryName, categories);
    if (!a11yCheck.isValid) {
      alert(a11yCheck.errors.join("\n"));
      return;
    }

    try {
      await createCategory(newCategoryName);
      setNewCategoryName("");
      await onUpdateCategories();
    } catch (e) {
      alert("Erro ao criar categoria.");
      console.error(e);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!isPremium) return;
    if (confirm("Excluir categoria?")) {
      try {
        await removeCategory(id);
        await onUpdateCategories();
      } catch (e) {
        alert("Erro ao excluir categoria.");
        console.error(e);
      }
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPremium || !newTemplateName.trim()) return;
    const validItems = newTemplateItems.filter(i => i.label.trim().length > 0);
    if (validItems.length === 0) return;
    try {
      await createChecklistTemplate(newTemplateName, validItems);
      setNewTemplateName("");
      setNewTemplateItems([{ label: "" }]);
      await loadTemplates();
    } catch (e) {
      alert("Erro ao criar template.");
      console.error(e);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!isPremium) return;
    if (confirm("Excluir template? (Isso não afeta pautas existentes)")) {
      try {
        await deleteChecklistTemplate(id);
        await loadTemplates();
      } catch (e) {
        alert("Erro ao excluir template.");
        console.error(e);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full max-h-[85vh] overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Configurações PRO</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personalize fluxos de trabalho, categorias e checklists editoriais.
          </p>
        </div>
        {!isPremium && (
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-4 py-2 rounded-lg border border-amber-200 dark:border-amber-800/50">
            <ShieldAlert className="w-5 h-5" />
            <span className="text-sm font-semibold">Funcionalidades bloqueadas (Requer PRO)</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 mt-2" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === "stages"}
          onClick={() => setActiveTab("stages")}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "stages"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Etapas do Fluxo
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "categories"}
          onClick={() => setActiveTab("categories")}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "categories"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Categorias
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "templates"}
          onClick={() => setActiveTab("templates")}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "templates"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Templates de Checklist
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950/50 relative">
        {!isPremium && (
          <div className="absolute inset-0 z-10 bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-[1px] pointer-events-none flex flex-col items-center justify-center">
            <Lock className="w-12 h-12 text-slate-400 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Exclusivo para usuários PRO</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm text-center mt-2">
              Assine o plano PRO para customizar seu fluxo de trabalho editorial, criar categorias próprias e usar templates avançados.
            </p>
          </div>
        )}

        <div className={`space-y-8 ${!isPremium ? "opacity-40 pointer-events-none select-none" : ""}`}>

          {/* TAB: STAGES */}
          {activeTab === "stages" && (
            <div className="max-w-3xl">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Gerenciar Etapas</h2>
              <div className="space-y-3 mb-8">
                {workflowStages.filter(s => s.isActive).map((stage, i) => (
                  <div key={stage.id} className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm group">
                    <div className="flex items-center gap-4">
                      <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-grab active:cursor-grabbing" aria-label="Reordenar etapa">
                        <GripVertical className="w-5 h-5" />
                      </button>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{stage.displayName}</h3>
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase mt-1">
                          {stage.semanticClassification || "CUSTOMIZADO"}
                          {stage.lifecycleRole === "PUBLICATION" && " • (PUBLICAÇÃO)"}
                        </p>
                      </div>
                    </div>
                    {stage.lifecycleRole !== "PUBLICATION" && (
                      <button
                        onClick={() => handleDeleteStage(stage.id)}
                        className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Excluir etapa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-slate-100 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Adicionar Nova Etapa</h3>
                <form onSubmit={handleCreateStage} className="flex gap-3">
                  <input
                    type="text"
                    required
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    placeholder="Nome da etapa"
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <select
                    required
                    value={newStageClass}
                    onChange={(e) => setNewStageClass(e.target.value as SemanticClassification)}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="" disabled>Classe Semântica...</option>
                    <option value="IDEA">Ideia (Backlog)</option>
                    <option value="RESEARCH">Pesquisa/Apuração</option>
                    <option value="DRAFTING">Redação/Escrita</option>
                    <option value="REVIEW">Revisão</option>
                  </select>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB: CATEGORIES */}
          {activeTab === "categories" && (
            <div className="max-w-2xl">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Gerenciar Categorias</h2>
              <div className="grid gap-3 mb-8">
                {categories.filter(c => c.isActive).map(cat => (
                  <div key={cat.id} className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{cat.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Origem: <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{cat.origin}</span>
                      </p>
                    </div>
                    {cat.origin === 'custom' && (
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-slate-100 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Adicionar Categoria</h3>
                <form onSubmit={handleCreateCategory} className="flex gap-3">
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nome da categoria"
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB: TEMPLATES */}
          {activeTab === "templates" && (
            <div className="max-w-3xl">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Templates de Checklist</h2>

              {isLoading ? (
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 mb-8">
                  {templates.map(tpl => (
                    <div key={tpl.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100">{tpl.name}</h3>
                        <button
                          onClick={() => handleDeleteTemplate(tpl.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <ul className="space-y-2">
                        {tpl.items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                            <span>{item.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {templates.length === 0 && (
                    <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      Nenhum template criado ainda.
                    </div>
                  )}
                </div>
              )}

              <div className="bg-slate-100 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Criar Novo Template</h3>
                <form onSubmit={handleCreateTemplate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nome do Template</label>
                    <input
                      type="text"
                      required
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="Ex: Padrão SEO & Acessibilidade"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Itens do Checklist</label>
                    <div className="space-y-2">
                      {newTemplateItems.map((item, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            required={idx === 0}
                            value={item.label}
                            onChange={(e) => {
                              const newItems = [...newTemplateItems];
                              newItems[idx].label = e.target.value;
                              setNewTemplateItems(newItems);
                            }}
                            placeholder={`Item ${idx + 1}`}
                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                          {newTemplateItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newItems = newTemplateItems.filter((_, i) => i !== idx);
                                setNewTemplateItems(newItems);
                              }}
                              className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewTemplateItems([...newTemplateItems, { label: "" }])}
                      className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Adicionar item
                    </button>
                  </div>
                  <div className="pt-2">
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
                      <Check className="w-4 h-4" />
                      Salvar Template
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
