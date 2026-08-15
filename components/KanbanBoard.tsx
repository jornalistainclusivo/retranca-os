'use client';

import React from 'react';
import { Article, ArticleStatus } from '@/types/editorial';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  CheckSquare, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  MoreHorizontal
} from 'lucide-react';

interface KanbanBoardProps {
  articles: Article[];
  searchTerm: string;
  onSelectArticle: (article: Article) => void;
  onUpdateArticleStatus: (id: string, newStatus: ArticleStatus) => void;
  onToggleChecklist: (articleId: string, checklistId: string) => void;
}

const STATUS_COLUMNS: {
  id: ArticleStatus;
  title: string;
  badgeBg: string;
  badgeText: string;
  leftBorder: string;
  dotColor: string;
}[] = [
  {
    id: 'ideia',
    title: 'Ideia',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-700 dark:text-slate-300',
    leftBorder: 'border-l-4 border-l-slate-400',
    dotColor: 'bg-slate-400',
  },
  {
    id: 'pesquisa',
    title: 'Pesquisa',
    badgeBg: 'bg-blue-50 dark:bg-blue-950',
    badgeText: 'text-blue-700 dark:text-blue-300',
    leftBorder: 'border-l-4 border-l-blue-500',
    dotColor: 'bg-blue-500',
  },
  {
    id: 'escrita',
    title: 'Escrita',
    badgeBg: 'bg-yellow-50 dark:bg-amber-950',
    badgeText: 'text-yellow-800 dark:text-amber-300',
    leftBorder: 'border-l-4 border-l-yellow-500',
    dotColor: 'bg-yellow-500',
  },
  {
    id: 'revisao',
    title: 'Revisão',
    badgeBg: 'bg-orange-50 dark:bg-orange-950',
    badgeText: 'text-orange-800 dark:text-orange-300',
    leftBorder: 'border-l-4 border-l-orange-500',
    dotColor: 'bg-orange-500',
  },
  {
    id: 'publicado',
    title: 'Publicado',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    leftBorder: 'border-l-4 border-l-emerald-500',
    dotColor: 'bg-emerald-500',
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  articles,
  searchTerm,
  onSelectArticle,
  onUpdateArticleStatus,
  onToggleChecklist,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);

  // Helper to compute checklist completion percentage
  const getProgress = (art: Article) => {
    if (!art.checklists || art.checklists.length === 0) return 0;
    const completed = art.checklists.filter((c) => c.completed).length;
    return Math.round((completed / art.checklists.length) * 100);
  };

  // Helper to format date badge
  const getDateBadge = (art: Article) => {
    if (art.status === 'publicado') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center gap-1 font-mono">
          <CheckCircle2 className="w-3 h-3" /> Publicado
        </span>
      );
    }
    if (art.publishDate < todayStr) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 dark:bg-red-950/80 dark:text-red-300 flex items-center gap-1 font-mono">
          <AlertTriangle className="w-3 h-3" /> Atrasado ({art.publishDate.slice(8, 10)}/{art.publishDate.slice(5, 7)})
        </span>
      );
    }
    if (art.publishDate === todayStr) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 flex items-center gap-1 font-mono">
          <Clock className="w-3 h-3 text-blue-600 animate-pulse" /> Hoje ({art.publishDate.slice(8, 10)}/{art.publishDate.slice(5, 7)})
        </span>
      );
    }
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
        Dia {art.publishDate.slice(8, 10)}
      </span>
    );
  };

  // Helper to highlight matching search term
  const renderTitle = (title: string) => {
    if (!searchTerm.trim()) return title;
    const parts = title.split(new RegExp(`(${searchTerm})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 dark:bg-amber-900/80 text-slate-900 dark:text-white px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 h-[calc(100vh-140px)] min-h-[600px] snap-x">
      {STATUS_COLUMNS.map((col) => {
        const colArticles = articles.filter((a) => a.status === col.id);

        return (
          <div
            key={col.id}
            className="flex flex-col bg-slate-100/60 dark:bg-slate-900/40 rounded-xl p-3 border border-slate-200 dark:border-slate-800 w-[85vw] sm:w-[320px] lg:flex-1 lg:min-w-[240px] shrink-0 h-full overflow-hidden snap-start"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1 shrink-0">
              <div className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                <h3 className="text-[11px] font-bold tracking-widest uppercase text-slate-700 dark:text-slate-300">
                  {col.title}
                </h3>
              </div>
              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${col.badgeBg} ${col.badgeText}`}>
                {colArticles.length}
              </span>
            </div>

            {/* Column Cards Container */}
            <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
              {colArticles.length === 0 ? (
                <div className="p-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-400">
                  Nenhuma pauta em {col.title}
                </div>
              ) : (
                colArticles.map((art) => {
                  const progress = getProgress(art);

                  return (
                    <div
                      key={art.id}
                      className={`bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 ${col.leftBorder} shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all group`}
                    >
                      {/* Top Bar: Date + Category */}
                      <div className="flex items-center justify-between mb-2">
                        {getDateBadge(art)}
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {art.categoryTag}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-semibold leading-snug mb-2.5">
                        <button
                          type="button"
                          onClick={() => onSelectArticle(art)}
                          className="text-left text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded transition-colors w-full"
                        >
                          {renderTitle(art.title)}
                        </button>
                      </h4>

                      {/* Status Selector Dots */}
                      <div className="mb-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                          Status
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                          {STATUS_COLUMNS.map((sc) => {
                            const isSelected = art.status === sc.id;
                            return (
                              <button
                                key={sc.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateArticleStatus(art.id, sc.id);
                                }}
                                className={`flex items-center gap-0.5 px-1 py-0.5 rounded transition-all ${
                                  isSelected
                                    ? 'font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-700 shadow-2xs'
                                    : 'hover:text-slate-700 dark:hover:text-slate-300 opacity-60'
                                }`}
                                title={`Mover para ${sc.title}`}
                              >
                                <span>{isSelected ? '●' : '○'}</span>
                                <span className="hidden sm:inline">{sc.title.slice(0, 3)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Mini Checklist Preview */}
                      {art.checklists && art.checklists.length > 0 && (
                        <div className="space-y-1 mb-3 bg-slate-50/80 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800/80 text-[11px]">
                          {art.checklists.slice(0, 4).map((chk) => (
                            <label
                              key={chk.id}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                            >
                              <input
                                type="checkbox"
                                checked={chk.completed}
                                onChange={() => onToggleChecklist(art.id, chk.id)}
                                className="w-3 h-3 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                              />
                              <span className={`truncate ${chk.completed ? 'line-through opacity-50' : ''}`}>
                                {chk.label}
                              </span>
                            </label>
                          ))}
                          {art.checklists.length > 4 && (
                            <div className="text-[10px] text-slate-400 font-medium pt-0.5">
                              + {art.checklists.length - 4} mais no CMS...
                            </div>
                          )}
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          <span>Progresso</span>
                          <span className="text-blue-600 dark:text-blue-400 font-mono">{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              progress === 100
                                ? 'bg-emerald-500'
                                : progress > 50
                                ? 'bg-blue-600'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Card Footer Action */}
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                        <button
                          onClick={() => onSelectArticle(art)}
                          className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <span>Abrir no CMS</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {art.spentTime || art.estimatedTime}
                        </span>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
