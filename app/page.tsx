"use client";

import React, { useState, useEffect } from "react";
import {
  Article,
  ArticleStatus,
  ActiveView,
  TimeFilter,
  CategoryTag,
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
import { ArticleModal } from "@/components/ArticleModal";
import { MotivationalModal } from "@/components/MotivationalModal";
import { AiAssistantModal } from "@/components/AiAssistantModal";
import { ModelDownloadModal } from "@/components/ModelDownloadModal";
import type {
  ModelStatus,
  LocalAiCapabilities,
  ProviderType,
} from "@/types/ai";

import {
  fetchAllRawArticles,
  saveRawArticle,
  deleteRawArticle,
  fetchWorkflowStages,
  fetchCategories,
  assignArticleStage,
  assignArticleCategory,
} from "@/lib/api/articles";
import {
  toArticleProps,
  fromArticleProps,
} from "@/lib/adapters/articleAdapter";
import { getDb } from "@/db/client";
import { seedDatabase, setDbInstanceForSeed } from "@/lib/api/seed";
import { articles as articlesSchema } from "@/db/schema";
import {
  getStoredWorkflowStages,
  getStoredCategories,
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
  const [activeView, setActiveView] = useState<ActiveView>("kanban");
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
  const [isDownloadModalDismissed, setIsDownloadModalDismissed] =
    useState(false);
  const [capabilities, setCapabilities] = useState<LocalAiCapabilities | null>(
    null,
  );
  const [selectedProvider, setSelectedProvider] =
    useState<ProviderType>("NONE");

  // Montagem Inicial: Conexão, Seed e Fetch
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const db = await getDb();
        setDbInstanceForSeed(db);

        const existingArticles = await db.select().from(articlesSchema);
        if (existingArticles.length === 0) {
          console.log("Database empty. Running seed...");
          await seedDatabase();
        }

        const rawData = await fetchAllRawArticles();
        const adaptedArticles = rawData.map((raw) =>
          toArticleProps(raw.article, raw.checklists, raw.history),
        );

        const stages = await fetchWorkflowStages();
        const cats = await fetchCategories();

        setWorkflowStages(stages);
        setCategories(cats);
        // default select all categories
        setSelectedCategories(cats.map((c) => c.id));
        setArticles(adaptedArticles);

        // Preflight Check for AI Model
        if (
          typeof window !== "undefined" &&
          (window as any).__TAURI_INTERNALS__
        ) {
          const { invoke } = await import("@tauri-apps/api/core");
          try {
            const result = await invoke<LocalAiCapabilities>("preflight_check");
            const caps = { ...result };

            if (caps.hardware && !caps.hardware.local_ai_supported) {
              setModelStatus("INCOMPATIBLE");
            } else if (caps.model_exists) {
              setModelStatus("READY");
            } else {
              setModelStatus("MISSING");
            }

            // Use provider selection from the Rust backend directly.
            // The backend enforces: ollama.reachable && !ollama.models.is_empty() → OLLAMA
            // Do NOT override selected_provider in the frontend.
            setCapabilities(caps);
            setSelectedProvider(caps.selected_provider);
          } catch (e) {
            console.error("Preflight check failed:", e);
            setModelStatus("MISSING");
          }
        }
      } catch (e) {
        console.error("Error initializing Tauri SQLite Database: ", e);
      } finally {
        setIsLoading(false);
        setIsMounted(true);
      }
    };

    // Certificar-se de executar apenas no client e no ambiente Tauri
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      initializeApp();
    } else {
      const initFallback = async () => {
        const stages = getStoredWorkflowStages();
        const cats = getStoredCategories();
        setWorkflowStages(stages);
        setCategories(cats);
        setSelectedCategories(cats.map((c) => c.id));
        setArticles(getStoredArticles());
        setIsLoading(false);
        setIsMounted(true);
      };
      initFallback();
    }
  }, []);

  // Sync storage listener
  useEffect(() => {
    const handleStorageChange = () => {
      if (
        typeof window !== "undefined" &&
        !(window as any).__TAURI_INTERNALS__
      ) {
        setArticles(getStoredArticles());
      }
    };
    window.addEventListener("jinc_storage_updated", handleStorageChange);
    return () =>
      window.removeEventListener("jinc_storage_updated", handleStorageChange);
  }, []);

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
    setArticles(newArticles);

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
      setArticles(adaptedArticles);
    } else {
      browserAssignArticleStage(id, newStageId);
      setArticles(getStoredArticles());
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
      setArticles(adaptedArticles);
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
      setArticles(getStoredArticles());
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
    const newArt = createNewArticle(workflowStages, categories);

    if (!newArt) {
      alert("Não é possível criar a pauta: nenhuma etapa de fluxo ou categoria ativa encontrada.");
      return;
    }

    setSelectedArticle(newArt);
    setIsArticleModalOpen(true);
  };

  // Filtered articles calculation
  const todayStr = new Date().toISOString().slice(0, 10);

  const filteredArticles = articles.filter((art) => {
    // Search Term Filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = art.title.toLowerCase().includes(term);
      const matchSummary = art.summary.toLowerCase().includes(term);
      const matchKeyword = art.keyword.toLowerCase().includes(term);
      const matchNotes = art.notes.toLowerCase().includes(term);
      const matchTag = art.tags.some((t) => t.toLowerCase().includes(term));
      if (
        !matchTitle &&
        !matchSummary &&
        !matchKeyword &&
        !matchNotes &&
        !matchTag
      ) {
        return false;
      }
    }

    // Category ID Filter
    if (
      selectedCategories.length > 0 &&
      art.categoryId &&
      !selectedCategories.includes(art.categoryId)
    ) {
      return false;
    }

    // Period Filter
    if (timeFilter === "hoje") {
      return art.publishDate === todayStr;
    }
    if (timeFilter === "semana") {
      const diff =
        (new Date(art.publishDate).getTime() - new Date().getTime()) /
        (1000 * 3600 * 24);
      return diff >= -1 && diff <= 7;
    }
    if (timeFilter === "mes") {
      const artDate = new Date(art.publishDate);
      const now = new Date();
      return (
        artDate.getMonth() === now.getMonth() &&
        artDate.getFullYear() === now.getFullYear()
      );
    }
    if (timeFilter === "atrasados") {
      const isPub =
        workflowStages.find((s) => s.id === art.workflowStageId)
          ?.lifecycleRole === "PUBLICATION";
      return !isPub && art.publishDate < todayStr;
    }

    return true;
  });

  const publishedCount = articles.filter((a) => {
    const isPub =
      workflowStages.find((s) => s.id === a.workflowStageId)?.lifecycleRole ===
      "PUBLICATION";
    return isPub;
  }).length;

  const showDownloadModal =
    modelStatus !== "READY" && !isDownloadModalDismissed;

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Header */}
      <Header
        articles={articles}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        isFocusMode={isFocusMode}
        setIsFocusMode={setIsFocusMode}
        onOpenNewModal={handleOpenNewArticleModal}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onArticlesUpdated={(updated) => updateArticlesState(updated)}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-full w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          {!isFocusMode && (
            <Sidebar
              activeView={activeView}
              setActiveView={setActiveView}
              timeFilter={timeFilter}
              setTimeFilter={setTimeFilter}
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              articles={articles}
              categories={categories}
              workflowStages={workflowStages}
            />
          )}

          {/* View Container */}
          <div className="flex-1 overflow-hidden min-w-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-full min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-slate-100"></div>
              </div>
            ) : (
              <>
                {activeView === "kanban" && (
                  <KanbanBoard
                    articles={filteredArticles}
                    workflowStages={workflowStages}
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
              WCAG 2.2 AA • Geometric Balance Design • Gemini 3.6 Flash
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
        modelStatus={modelStatus}
        onStartDownload={async () => {
          setModelStatus("DOWNLOADING");
          if (
            typeof window !== "undefined" &&
            (window as any).__TAURI_INTERNALS__
          ) {
            try {
              const { invoke } = await import("@tauri-apps/api/core");
              const { listen } = await import("@tauri-apps/api/event");

              const unlistenVerifying = await listen(
                "download-verifying",
                () => {
                  setModelStatus("VERIFYING");
                },
              );

              // The actual command blocks until success (atomic rename) or fails
              await invoke("download_model", {
                jobId: `download_${Date.now()}`,
              });

              unlistenVerifying();
              setModelStatus("READY");
              setSelectedProvider("SIDECAR");
            } catch (e) {
              console.error("Download failed:", e);
              setModelStatus("FAILED");
            }
          } else {
            // Fallback for non-Tauri dev environment
            setTimeout(() => setModelStatus("VERIFYING"), 5000);
            setTimeout(() => {
              setModelStatus("READY");
              setSelectedProvider("SIDECAR");
            }, 8000);
          }
        }}
        onDismiss={() => setIsDownloadModalDismissed(true)}
      />
    </div>
  );
}
