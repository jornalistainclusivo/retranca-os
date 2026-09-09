'use client';

import React, { useState, useEffect } from 'react';
import { Article, ArticleStatus, ActiveView, TimeFilter, CategoryTag } from '@/types/editorial';
import { getStoredArticles, saveArticles } from '@/lib/storage';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { KanbanBoard } from '@/components/KanbanBoard';
import { ListView } from '@/components/ListView';
import { CalendarView } from '@/components/CalendarView';
import { StatsView } from '@/components/StatsView';
import { GovernanceView } from '@/components/GovernanceView';
import { ArticleModal } from '@/components/ArticleModal';
import { MotivationalModal } from '@/components/MotivationalModal';
import { AiAssistantModal } from '@/components/AiAssistantModal';
import { ModelDownloadModal } from '@/components/ModelDownloadModal';
import type { ModelStatus } from '@/types/ai';

import { fetchAllRawArticles, saveRawArticle, deleteRawArticle } from '@/lib/api/articles';
import { toArticleProps, fromArticleProps } from '@/lib/adapters/articleAdapter';
import { getDb } from '@/db/client';
import { seedDatabase, setDbInstanceForSeed } from '@/lib/api/seed';
import { articles as articlesSchema } from '@/db/schema';

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState<ActiveView>('kanban');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('todas');
  const [selectedCategories, setSelectedCategories] = useState<CategoryTag[]>([
    'IA', 'Acessibilidade', 'Inclusão', 'SEO', 'Docs', 'Blog', 'Social', 'Linguagem Simples'
  ]);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
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
  const [modelStatus, setModelStatus] = useState<ModelStatus>('MISSING');

  // Montagem Inicial: Conexão, Seed e Fetch
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const db = await getDb();
        setDbInstanceForSeed(db);
        
        const existingArticles = await db.select().from(articlesSchema);
        if (existingArticles.length === 0) {
          console.log('Database empty. Running seed...');
          await seedDatabase();
        }

        const rawData = await fetchAllRawArticles();
        const adaptedArticles = rawData.map(raw => toArticleProps(raw.article, raw.checklists, raw.history));
        
        setArticles(adaptedArticles);

        // Preflight Check for AI Model
        if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
          const { invoke } = await import('@tauri-apps/api/core');
          try {
            const result: any = await invoke('preflight_check');
            if (result.hardware && !result.hardware.local_ai_supported) {
              setModelStatus('INCOMPATIBLE');
            } else if (result.model_exists) {
              setModelStatus('READY');
            } else {
              setModelStatus('MISSING');
            }
          } catch (e) {
            console.error('Preflight check failed:', e);
            setModelStatus('MISSING');
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
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      initializeApp();
    } else {
      const initFallback = async () => {
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
      if (typeof window !== 'undefined' && !(window as any).__TAURI_INTERNALS__) {
        setArticles(getStoredArticles());
      }
    };
    window.addEventListener('jinc_storage_updated', handleStorageChange);
    return () => window.removeEventListener('jinc_storage_updated', handleStorageChange);
  }, []);

  // Update DOM dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handler de atualização otimista (Atualizado para refletir no SQLite)
  const updateArticlesState = async (newArticles: Article[], savedArticle?: Article, deletedId?: string) => {
    setArticles(newArticles);
    
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
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

  // Handler for changing an article status
  const handleUpdateStatus = (id: string, newStatus: ArticleStatus) => {
    const previous = articles.find((a) => a.id === id);
    let changedArticle: Article | undefined;
    
    const updated = articles.map((art) => {
      if (art.id === id) {
        changedArticle = {
          ...art,
          status: newStatus,
          completedAt: newStatus === 'publicado' ? new Date().toISOString() : art.completedAt,
          updatedAt: new Date().toISOString(),
          history: [
            {
              id: `h_${Date.now()}`,
              date: new Date().toISOString(),
              action: `Status alterado de ${art.status.toUpperCase()} para ${newStatus.toUpperCase()}`,
            },
            ...art.history,
          ],
        };
        return changedArticle;
      }
      return art;
    });

    updateArticlesState(updated, changedArticle);

    // Trigger motivational celebration pop-up when an article becomes 'publicado'
    if (previous && previous.status !== 'publicado' && newStatus === 'publicado') {
      setIsMotivationalModalOpen(true);
    }
  };

  // Handler for toggling checklist items on cards
  const handleToggleChecklist = (articleId: string, checklistId: string) => {
    let changedArticle: Article | undefined;
    const updated = articles.map((art) => {
      if (art.id === articleId) {
        const updatedChecklists = art.checklists.map((chk) =>
          chk.id === checklistId ? { ...chk, completed: !chk.completed } : chk
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
    updateArticlesState(updated, changedArticle);
  };

  // Handler for saving an article from CMS modal
  const handleSaveArticle = (savedArticle: Article) => {
    const exists = articles.some((a) => a.id === savedArticle.id);
    let updated: Article[];
    if (exists) {
      updated = articles.map((a) => (a.id === savedArticle.id ? savedArticle : a));
    } else {
      updated = [savedArticle, ...articles];
    }
    updateArticlesState(updated, savedArticle);
  };

  // Handler for deleting an article
  const handleDeleteArticle = (id: string) => {
    if (confirm('Excluir esta pauta da Agenda JINC?')) {
      const updated = articles.filter((a) => a.id !== id);
      updateArticlesState(updated, undefined, id);
      setIsArticleModalOpen(false);
    }
  };

  // Open New Article Modal
  const handleOpenNewArticleModal = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const newArt: Article = {
      id: `art_${Date.now()}`,
      title: '',
      status: 'ideia',
      categoryTag: 'Acessibilidade',
      tags: ['Acessibilidade', 'Jornalismo'],
      publishDate: todayStr,
      summary: '',
      objective: '',
      keyword: '',
      persona: 'Leitores do Jornalista Inclusivo',
      cta: 'Saiba mais no nosso portal',
      internalLinks: '',
      externalLinks: '',
      estimatedTime: '2h',
      spentTime: '0m',
      notes: '',
      checklists: [
        { id: 'c1', label: 'Pesquisa e checagem de fontes', completed: false, category: 'pesquisa' },
        { id: 'c2', label: 'Linguagem Simples (fácil leitura)', completed: false, category: 'editorial' },
        { id: 'c3', label: 'Otimização SEO e palavra-chave no H1', completed: false, category: 'seo' },
        { id: 'c4', label: 'Descrição Alt Text WCAG 2.2', completed: false, category: 'wcag' },
        { id: 'c5', label: 'Auditoria Ética de IA', completed: false, category: 'ia' },
        { id: 'c6', label: 'Divulgação nas redes sociais e newsletter', completed: false, category: 'distribuicao' },
      ],
      history: [{ id: `h_${Date.now()}`, date: new Date().toISOString(), action: 'Pauta criada' }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
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
      if (!matchTitle && !matchSummary && !matchKeyword && !matchNotes && !matchTag) {
        return false;
      }
    }

    // Category Tag Filter
    if (selectedCategories.length > 0 && !selectedCategories.includes(art.categoryTag)) {
      return false;
    }

    // Period Filter
    if (timeFilter === 'hoje') {
      return art.publishDate === todayStr;
    }
    if (timeFilter === 'semana') {
      const diff = (new Date(art.publishDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
      return diff >= -1 && diff <= 7;
    }
    if (timeFilter === 'mes') {
      const artDate = new Date(art.publishDate);
      const now = new Date();
      return artDate.getMonth() === now.getMonth() && artDate.getFullYear() === now.getFullYear();
    }
    if (timeFilter === 'atrasados') {
      return art.status !== 'publicado' && art.publishDate < todayStr;
    }

    return true;
  });

  const publishedCount = articles.filter((a) => a.status === 'publicado').length;

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
                {activeView === 'kanban' && (
                  <KanbanBoard
                    articles={filteredArticles}
                    searchTerm={searchTerm}
                    onSelectArticle={(art) => {
                      setSelectedArticle(art);
                      setIsArticleModalOpen(true);
                    }}
                    onUpdateArticleStatus={handleUpdateStatus}
                    onToggleChecklist={handleToggleChecklist}
                  />
                )}

                {activeView === 'lista' && (
                  <ListView
                    articles={filteredArticles}
                    searchTerm={searchTerm}
                    onSelectArticle={(art) => {
                      setSelectedArticle(art);
                      setIsArticleModalOpen(true);
                    }}
                    onUpdateStatus={handleUpdateStatus}
                  />
                )}

                {activeView === 'calendario' && (
                  <CalendarView
                    articles={filteredArticles}
                    onSelectArticle={(art) => {
                      setSelectedArticle(art);
                      setIsArticleModalOpen(true);
                    }}
                  />
                )}

                {activeView === 'estatisticas' && (
                  <StatsView articles={articles} />
                )}

                {activeView === 'documentos' && (
                  <GovernanceView />
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
              © 2026 <strong>Retranca</strong> — Organizando o jornalismo antes que ele vire notícia
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
        isOpen={isArticleModalOpen}
        onClose={() => setIsArticleModalOpen(false)}
        onSave={handleSaveArticle}
        onDelete={handleDeleteArticle}
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
      />

      <ModelDownloadModal 
        modelStatus={modelStatus}
        onStartDownload={async () => {
          setModelStatus('DOWNLOADING');
          if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
            try {
              const { invoke } = await import('@tauri-apps/api/core');
              const { listen } = await import('@tauri-apps/api/event');
              
              const unlistenVerifying = await listen('download-verifying', () => {
                setModelStatus('VERIFYING');
              });

              // The actual command blocks until success (atomic rename) or fails
              await invoke('download_model', {
                jobId: `download_${Date.now()}`,
              });

              unlistenVerifying();
              setModelStatus('READY');
            } catch (e) {
              console.error('Download failed:', e);
              setModelStatus('FAILED');
            }
          } else {
            // Fallback for non-Tauri dev environment
            setTimeout(() => setModelStatus('VERIFYING'), 5000);
            setTimeout(() => setModelStatus('READY'), 8000);
          }
        }}
        onDismiss={() => setModelStatus('READY')}
      />

    </div>
  );
}
