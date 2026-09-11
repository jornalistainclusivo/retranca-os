'use client';

import React, { useRef } from 'react';
import { Article } from '@/types/editorial';
import { useEntitlement } from '@/lib/contexts/EntitlementContext';
import { exportArticlesJSON, importArticlesJSON, resetToSeedData } from '@/lib/storage';
import { 
  Search, 
  Plus, 
  Sparkles, 
  Download, 
  Upload, 
  RotateCcw, 
  Sun, 
  Moon, 
  BookOpenCheck,
  CheckCircle2,
  TrendingUp,
  Maximize,
  Minimize
} from 'lucide-react';

interface HeaderProps {
  articles: Article[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  isFocusMode: boolean;
  setIsFocusMode: (focus: boolean) => void;
  onOpenNewModal: () => void;
  onOpenAiModal: () => void;
  onArticlesUpdated: (articles: Article[]) => void;
}

export const Header: React.FC<HeaderProps> = ({
  articles,
  searchTerm,
  setSearchTerm,
  darkMode,
  setDarkMode,
  isFocusMode,
  setIsFocusMode,
  onOpenNewModal,
  onOpenAiModal,
  onArticlesUpdated,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isPremium: isPremiumMode } = useEntitlement();

  // Calculate overall metrics
  const total = articles.length;
  const publishedCount = articles.filter(a => a.status === 'publicado').length;
  const overallPercentage = total > 0 ? Math.round((publishedCount / total) * 100) : 0;

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const updated = await importArticlesJSON(file);
        onArticlesUpdated(updated);
        alert('Pautas importadas com sucesso!');
      } catch (err: any) {
        alert(err.message || 'Erro ao importar arquivo.');
      }
    }
  };

  const handleReset = () => {
    if (confirm('Tem certeza que deseja restaurar as pautas originais? Suas alterações locais serão redefinidas.')) {
      const resetArticles = resetToSeedData();
      onArticlesUpdated(resetArticles);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col gap-4">
          
          {/* Top Line: Branding & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Branding & App Title */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-slate-900 dark:bg-slate-100 rounded-lg flex items-center justify-center text-white dark:text-slate-900 shadow-sm">
                  <BookOpenCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      Retranca <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">OS</span>
                    </h1>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Organizando o jornalismo antes que ele vire notícia
                  </p>
                </div>
              </div>

              {/* Mobile Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                aria-label="Alternar modo escuro"
              >
                {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>

            {/* AI, New & Controls */}
            <div className="flex items-center flex-wrap gap-2 justify-between md:justify-end">
              
              {/* Focus Mode Button */}
              <button
                onClick={() => setIsFocusMode(!isFocusMode)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all flex items-center gap-1.5 shadow-2xs ${
                  isFocusMode 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="Modo de Escrita Minimalista"
                aria-pressed={isFocusMode}
                aria-label="Alternar Modo de Escrita"
              >
                {isFocusMode ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Modo Escrita</span>
              </button>

              {/* AI Assistant Button */}
              <button
                onClick={isPremiumMode ? onOpenAiModal : undefined}
                aria-disabled={!isPremiumMode}
                tabIndex={isPremiumMode ? 0 : -1}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 shadow-2xs ${
                  isPremiumMode 
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" 
                    : "bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-60"
                }`}
                title={isPremiumMode ? "Assistente IA de Redação Acessível" : "Assistente IA (Recurso Premium)"}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>IA Assistant</span>
              </button>

              {/* Create New Article */}
              <button
                onClick={onOpenNewModal}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200 dark:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="w-5 h-5" />
                <span>Nova Pauta</span>
              </button>

              {/* Storage Controls (Export, Import, Reset) */}
              <div className="hidden sm:flex items-center space-x-1 pl-1 border-l border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => exportArticlesJSON(articles)}
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                  title="Exportar dados em JSON (Backup offline)"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={handleImportClick}
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                  title="Importar dados JSON"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  className="hidden"
                />

                <button
                  onClick={handleReset}
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                  title="Restaurar pautas iniciais"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="hidden md:flex p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors ml-1"
                  title="Alternar tema escuro/claro"
                >
                  {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Middle Line: Search */}
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar pautas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
              aria-label="Pesquisar pautas"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Bottom Line: Global Progress Bar */}
          <div className="w-full bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-tight text-slate-500 dark:text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Produção Geral: <strong className="text-slate-900 dark:text-slate-100">{total} pautas</strong>
              </span>
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-mono font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {publishedCount}/{total} ({overallPercentage}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${overallPercentage}%` }}
              />
            </div>
          </div>
          
        </div>
      </div>
    </header>
  );
};
