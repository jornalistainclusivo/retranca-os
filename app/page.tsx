"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Article,
  ActiveView,
  TimeFilter,
  WorkflowStage,
  CategoryEntity,
} from "@/types/editorial";
import { getStoredArticles, saveArticles } from "@/lib/storage";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ListView } from "@/components/ListView";
import { CalendarView } from "@/components/CalendarView";
import { StatsView } from "@/components/StatsView";
import { GovernanceView } from "@/components/GovernanceView";
import { WorkflowEditor } from "@/components/WorkflowEditor";
import { HomeView } from "@/components/HomeView";
import { ArticleModal } from "@/components/ArticleModal";
import { MotivationalModal } from "@/components/MotivationalModal";
import { AiAssistantModal } from "@/components/AiAssistantModal";
import { ModelDownloadModal } from "@/components/ModelDownloadModal";
import {
  canProvisionDevelopmentModel,
  DevelopmentProvisioningDisabledError,
  downloadLocalModel,
  ModelProvisioningUnavailableError,
  provisionedModelStatus,
} from "@/lib/api/modelProvisioning";
import type {
  ModelStatus,
  LocalAiCapabilities,
  ProviderType,
} from "@/types/ai";

import {
  fetchAllRawArticles,
  saveRawArticle,
  deleteRawArticle,
  assignArticleStage,
  assignArticleCategory,
} from "@/lib/api/articles";
import {
  toArticleProps,
  fromArticleProps,
} from "@/lib/adapters/articleAdapter";
import { loadEditorialWorkspace, projectArticleCategories, reconcileCategorySelection } from "@/lib/api/editorialWorkspace";
import { filterWorkspaceArticles, matchesTimeFilter } from "@/lib/utils/editorialOverview";
import {
  browserAssignArticleStage,
  browserAssignArticleCategory,
  createNewArticle,
  mergeBrowserSaveArticle,
} from "@/lib/storage";

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [workflowStages, setWorkflowStages] = useState<WorkflowStage[]>([]);
  const [categories, setCategories] = useState<CategoryEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState<ActiveView>("inicio");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creationError, setCreationError] = useState<string | null>(null);
  const viewHeadingRef = useRef<HTMLHeadingElement>(null);
  const didLoadRef = useRef(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("todas");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // Modals state
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isMotivationalModalOpen, setIsMotivationalModalOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [modelStatus, setModelStatus] = useState<ModelStatus>("MISSING");
  const [modelDownloadError, setModelDownloadError] = useState<string | null>(null);
  const downloadInProgressRef = useRef(false);
  const [isDownloadModalDismissed, setIsDownloadModalDismissed] =
    useState(false);
  const [capabilities, setCapabilities] = useState<LocalAiCapabilities | null>(
    null,
  );
  const [selectedProvider, setSelectedProvider] =
    useState<ProviderType>("NONE");

  const initializeApp = useCallback(async () => {
      try {
        const { stages, categories: cats, articles: loadedArticles } = await loadEditorialWorkspace();
        setWorkflowStages(stages);
        setCategories(cats);
        setSelectedCategories(cats.map((c) => c.id));
        setArticles(loadedArticles);
        didLoadRef.current = true;

        // Preflight Check for AI Model
        if (
          typeof window !== "undefined" &&
          (window as any).__TAURI_INTERNALS__
        ) {
          const { invoke } = await import("@tauri-apps/api/core");
          try {
            const result = await invoke<LocalAiCapabilities>("preflight_check");
            const caps = { ...result };

            setModelStatus(provisionedModelStatus(caps));

            // Use provider selection from the Rust backend directly.
            // OLLAMA is the normal supported route, not a cached readiness grant.
            // Do NOT override selected_provider in the frontend.
            setCapabilities(caps);
            setSelectedProvider(caps.selected_provider);
          } catch (e) {
            console.error("Preflight check failed:", e);
            setModelStatus("MISSING");
          }
        }
      } catch (e) {
        console.error("Error loading editorial workspace: ", e);
        didLoadRef.current = false;
        setLoadError("Não foi possível carregar seu ambiente. Suas pautas foram preservadas. Tente novamente.");
      } finally {
        setIsLoading(false);
        setIsMounted(true);
      }
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => { if (active) return initializeApp(); });
    return () => { active = false; };
  }, [initializeApp]);

  useEffect(() => {
    if (!isLoading && !loadError) viewHeadingRef.current?.focus();
  }, [activeView, isLoading, loadError]);

  const refreshWorkspace = async () => {
    const workspace = await loadEditorialWorkspace();
    setSelectedCategories(selected => reconcileCategorySelection(
      categories.map(c => c.id), selected, workspace.categories.map(c => c.id),
    ));
    setWorkflowStages(workspace.stages);
    setCategories(workspace.categories);
    setArticles(workspace.articles);
    setCreationError(null);
  };

  const navigate = (view: ActiveView) => {
    setActiveView(view);
    setIsFocusMode(false);
  };

  const openArticle = (article: Article) => {
    setSelectedArticle(article);
    setIsArticleModalOpen(true);
  };

  const viewLabels: Record<ActiveView, string> = {
    inicio: 'Início', kanban: 'Quadro Kanban', lista: 'CMS Editorial', calendario: 'Calendário',
    estatisticas: 'Estatísticas e conquistas', documentos: 'Bloco de notas', configuracoes: 'Configurações Editoriais',
  };

  // Sync storage listener
  useEffect(() => {
    const handleStorageChange = () => {
      if (
        typeof window !== "undefined" &&
        !(window as any).__TAURI_INTERNALS__
      ) {
        setArticles(projectArticleCategories(getStoredArticles(), categories));
      }
    };
    window.addEventListener("jinc_storage_updated", handleStorageChange);
    return () =>
      window.removeEventListener("jinc_storage_updated", handleStorageChange);
  }, [categories]);

  // Update DOM dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Handler de atualização otimista (Atualizado para refletir no SQLite)
  const updateArticlesState = async (
    newArticles: Article[],
    savedArticle?: Article,
    deletedId?: string,
  ) => {
    setArticles(projectArticleCategories(newArticles, categories));

    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      if (savedArticle) {
        await saveRawArticle(fromArticleProps(savedArticle));
      }
      if (deletedId) {
        await deleteRawArticle(deletedId);
      }
    } else {
      saveArticles(newArticles);
    }
  };

  const handleUpdateStage = async (id: string, newStageId: string) => {
    const previous = articles.find((a) => a.id === id);
    if (!previous) return;

    const stage = workflowStages.find((s) => s.id === newStageId);
    if (!stage) return;

    const isPublished = stage.lifecycleRole === "PUBLICATION";

    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      await assignArticleStage(id, newStageId);
      const rawData = await fetchAllRawArticles();
      const adaptedArticles = rawData.map((raw) =>
        toArticleProps(raw.article, raw.checklists, raw.history),
      );
      setArticles(projectArticleCategories(adaptedArticles, categories));
    } else {
      browserAssignArticleStage(id, newStageId);
      setArticles(projectArticleCategories(getStoredArticles(), categories));
    }

    if (previous.workflowStageId !== newStageId && isPublished) {
      setIsMotivationalModalOpen(true);
    }
  };

  // Handler for toggling checklist items on cards
  const handleToggleChecklist = (articleId: string, checklistId: string) => {
    let changedArticle: Article | undefined;
    const updated = articles.map((art) => {
      if (art.id === articleId) {
        const updatedChecklists = art.checklists.map((chk) =>
          chk.id === checklistId ? { ...chk, completed: !chk.completed } : chk,
        );
        changedArticle = {
          ...art,
          checklists: updatedChecklists,
          updatedAt: new Date().toISOString(),
        };
        return changedArticle;
      }
      return art;
    });
    setArticles(updated);

    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      if (changedArticle) {
        saveRawArticle(fromArticleProps(changedArticle));
      }
    } else {
      saveArticles(updated);
    }
  };

  const handleSaveArticle = async (savedArticle: Article) => {
    const previous = articles.find((a) => a.id === savedArticle.id);
    const exists = previous !== undefined;

    const stage = workflowStages.find(
      (s) => s.id === savedArticle.workflowStageId,
    );
    const isPublished = stage ? stage.lifecycleRole === "PUBLICATION" : false;

    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      // Normal metadata save (native save protects domain fields)
      
      const historyToSave = previous ? [...previous.history] : [];
      const prevHistoryIds = new Set(historyToSave.map(h => h.id));
      for (const h of savedArticle.history) {
        if (!prevHistoryIds.has(h.id)) {
          historyToSave.push(h);
        }
      }

      await saveRawArticle(fromArticleProps({
        ...savedArticle,
        history: historyToSave
      }));

      // Explicit IPC domain transitions
      if (
        previous &&
        previous.workflowStageId !== savedArticle.workflowStageId &&
        savedArticle.workflowStageId
      ) {
        await assignArticleStage(savedArticle.id, savedArticle.workflowStageId);
      }

      if (
        previous &&
        previous.categoryId !== savedArticle.categoryId &&
        savedArticle.categoryId
      ) {
        await assignArticleCategory(savedArticle.id, savedArticle.categoryId);
      }

      const rawData = await fetchAllRawArticles();
      const adaptedArticles = rawData.map((raw) =>
        toArticleProps(raw.article, raw.checklists, raw.history),
      );
      setArticles(projectArticleCategories(adaptedArticles, categories));
    } else {
      // Browser fallback transitions
      const metadataArticle = mergeBrowserSaveArticle(previous, savedArticle);

      let updated: Article[];
      if (exists) {
        updated = articles.map((a) =>
          a.id === metadataArticle.id ? metadataArticle : a,
        );
      } else {
        updated = [metadataArticle, ...articles];
      }
      saveArticles(updated);

      if (
        previous &&
        previous.workflowStageId !== savedArticle.workflowStageId &&
        savedArticle.workflowStageId
      ) {
        browserAssignArticleStage(
          savedArticle.id,
          savedArticle.workflowStageId,
        );
      }
      if (
        previous &&
        previous.categoryId !== savedArticle.categoryId &&
        savedArticle.categoryId
      ) {
        browserAssignArticleCategory(savedArticle.id, savedArticle.categoryId);
      }
      setArticles(projectArticleCategories(getStoredArticles(), categories));
    }

    if (
      previous &&
      previous.workflowStageId !== savedArticle.workflowStageId &&
      isPublished
    ) {
      setIsMotivationalModalOpen(true);
    }
  };

  // Handler for deleting an article
  const handleDeleteArticle = (id: string) => {
    if (confirm("Excluir esta pauta da Agenda JINC?")) {
      const updated = articles.filter((a) => a.id !== id);
      updateArticlesState(updated, undefined, id);
      setIsArticleModalOpen(false);
    }
  };

  // Open New Article Modal
  const handleOpenNewArticleModal = () => {
    if (isLoading || loadError || !didLoadRef.current) return;
    const newArt = createNewArticle(workflowStages, categories);

    if (!newArt) {
      setCreationError("Para criar uma pauta, mantenha pelo menos uma etapa de fluxo e uma categoria ativa nas Configurações Editoriais.");
      navigate('configuracoes');
      return;
    }

    setCreationError(null);
    setSelectedArticle(newArt);
    setIsArticleModalOpen(true);
  };

  const scopedArticles = filterWorkspaceArticles(articles, searchTerm, selectedCategories, categories);
  const filteredArticles = scopedArticles.filter(art => matchesTimeFilter(art, timeFilter, workflowStages));

  const publishedCount = articles.filter((a) => {
    const isPub =
      workflowStages.find((s) => s.id === a.workflowStageId)?.lifecycleRole ===
      "PUBLICATION";
    return isPub;
  }).length;

  const showDownloadModal =
    canProvisionDevelopmentModel(capabilities) &&
    modelStatus !== "READY" && !isDownloadModalDismissed;

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 motion-reduce:transition-none">
      {/* Header */}
      <Header
        articles={articles}
        workflowStages={workflowStages}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        isFocusMode={isFocusMode}
        setIsFocusMode={setIsFocusMode}
        onOpenNewModal={handleOpenNewArticleModal}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onArticlesUpdated={(updated) => updateArticlesState(updated)}
        workspaceReady={!isLoading && !loadError}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-full w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          {!isFocusMode && (
            <Sidebar
              activeView={activeView}
              setActiveView={navigate}
              timeFilter={timeFilter}
              setTimeFilter={(filter) => { setTimeFilter(filter); navigate('kanban'); }}
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              articles={scopedArticles}
              categories={categories}
              workflowStages={workflowStages}
            />
          )}

          {/* View Container */}
          <div className="flex-1 overflow-hidden min-w-0">
            {isLoading ? (
              <div role="status" className="flex justify-center items-center h-full min-h-[400px]">
                <span className="sr-only">Carregando pautas...</span>
                <div aria-hidden="true" className="animate-spin motion-reduce:animate-none rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-slate-100"></div>
              </div>
            ) : loadError ? (
              <section className="rounded-xl bg-white dark:bg-slate-900 border border-slate-300 p-6 space-y-4">
                <p role="alert">{loadError}</p>
                <button type="button" onClick={() => { setIsLoading(true); setLoadError(null); didLoadRef.current = false; void initializeApp(); }} className="rounded-lg bg-blue-600 text-white px-4 py-3 focus-visible:ring-2 focus-visible:ring-blue-500">Tentar carregar novamente</button>
              </section>
            ) : (
              <>
                <h2 ref={viewHeadingRef} tabIndex={-1} className="text-xl font-bold mb-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">{viewLabels[activeView]}</h2>
                {creationError && <p role="alert" className="mb-4 text-red-700 dark:text-red-300">{creationError}</p>}
                {activeView === 'inicio' && <HomeView articles={articles} workflowStages={workflowStages} categories={categories} onNavigate={navigate} onCreateArticle={handleOpenNewArticleModal} onSelectArticle={openArticle} />}
                {['kanban', 'lista', 'calendario'].includes(activeView) && <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
                  <p role="status">Exibindo {filteredArticles.length} de {articles.length} pauta(s). O total geral inclui todas as pautas salvas.</p>
                  <button type="button" onClick={() => { setSearchTerm(''); setTimeFilter('todas'); setSelectedCategories(categories.map(c => c.id)); }} className="underline text-blue-700 dark:text-blue-300 rounded p-2 focus-visible:ring-2 focus-visible:ring-blue-500">Mostrar todas as pautas</button>
                </div>}
                {activeView === "kanban" && (
                  <KanbanBoard
                    articles={filteredArticles}
                    workflowStages={workflowStages}
                    categories={categories}
                    searchTerm={searchTerm}
                    onSelectArticle={(art) => {
                      setSelectedArticle(art);
                      setIsArticleModalOpen(true);
                    }}
                    onUpdateArticleStage={handleUpdateStage}
                    onToggleChecklist={handleToggleChecklist}
                  />
                )}

                {activeView === "lista" && (
                  <ListView
                    articles={filteredArticles}
                    workflowStages={workflowStages}
                    searchTerm={searchTerm}
                    onSelectArticle={(art) => {
                      setSelectedArticle(art);
                      setIsArticleModalOpen(true);
                    }}
                    onUpdateStage={handleUpdateStage}
                  />
                )}

                {activeView === "calendario" && (
                  <CalendarView
                    articles={filteredArticles}
                    workflowStages={workflowStages}
                    onSelectArticle={(art) => {
                      setSelectedArticle(art);
                      setIsArticleModalOpen(true);
                    }}
                  />
                )}

                {activeView === "estatisticas" && (
                  <StatsView articles={articles} workflowStages={workflowStages} />
                )}

                {activeView === "documentos" && <GovernanceView />}

                {activeView === "configuracoes" && (
                  <WorkflowEditor
                    workflowStages={workflowStages}
                    categories={categories}
                    onUpdateStages={refreshWorkspace}
                    onUpdateCategories={refreshWorkspace}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      {!isFocusMode && (
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500 dark:text-slate-400 mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              © 2026 <strong>Retranca</strong> — Organizando o jornalismo antes
              que ele vire notícia
            </span>
            <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
              IA local • Revisão humana
            </span>
          </div>
        </footer>
      )}

      {/* Modals */}
      <ArticleModal
        article={selectedArticle}
        workflowStages={workflowStages}
        categories={categories}
        isOpen={isArticleModalOpen}
        onClose={() => setIsArticleModalOpen(false)}
        onSave={handleSaveArticle}
        onDelete={handleDeleteArticle}
        provider={capabilities?.selected_provider ?? "NONE"}
        isFocusMode={isFocusMode}
        setIsFocusMode={setIsFocusMode}
      />

      <MotivationalModal
        isOpen={isMotivationalModalOpen}
        onClose={() => setIsMotivationalModalOpen(false)}
        publishedCount={publishedCount}
      />

      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        provider={selectedProvider}
      />

      <ModelDownloadModal
        isOpen={showDownloadModal}
        developmentFixturesEnabled={canProvisionDevelopmentModel(capabilities)}
        modelStatus={modelStatus}
        errorMessage={modelDownloadError}
        onStartDownload={async () => {
          if (!canProvisionDevelopmentModel(capabilities) || downloadInProgressRef.current) return;
          downloadInProgressRef.current = true;
          setModelDownloadError(null);
          setModelStatus("DOWNLOADING");
          try {
            const caps = await downloadLocalModel(() => setModelStatus("VERIFYING"));
            setCapabilities(caps);
            setSelectedProvider(caps.selected_provider);
            setModelStatus(provisionedModelStatus(caps));
          } catch (error) {
            setModelDownloadError(error instanceof ModelProvisioningUnavailableError || error instanceof DevelopmentProvisioningDisabledError ? error.message : null);
            setModelStatus("FAILED");
          } finally {
            downloadInProgressRef.current = false;
          }
        }}
        onDismiss={() => setIsDownloadModalDismissed(true)}
      />
    </div>
  );
}
