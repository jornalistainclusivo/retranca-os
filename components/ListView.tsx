'use client';

import React, { useState } from 'react';
import { Article, ArticleStatus } from '@/types/editorial';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  ChevronRight, 
  Edit3, 
  Filter, 
  ArrowUpDown 
} from 'lucide-react';

interface ListViewProps {
  articles: Article[];
  searchTerm: string;
  onSelectArticle: (article: Article) => void;
  onUpdateStatus: (id: string, status: ArticleStatus) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  articles,
  searchTerm,
  onSelectArticle,
  onUpdateStatus,
}) => {
  const [sortField, setSortField] = useState<'title' | 'status' | 'publishDate' | 'progress'>('publishDate');
  const [sortAsc, setSortAsc] = useState(true);

  const getProgress = (art: Article) => {
    if (!art.checklists || art.checklists.length === 0) return 0;
    const completed = art.checklists.filter((c) => c.completed).length;
    return Math.round((completed / art.checklists.length) * 100);
  };

  const sortedArticles = [...articles].sort((a, b) => {
    if (sortField === 'title') {
      return sortAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
    }
    if (sortField === 'publishDate') {
      return sortAsc ? a.publishDate.localeCompare(b.publishDate) : b.publishDate.localeCompare(a.publishDate);
    }
    if (sortField === 'status') {
      return sortAsc ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status);
    }
    if (sortField === 'progress') {
      return sortAsc ? getProgress(a) - getProgress(b) : getProgress(b) - getProgress(a);
    }
    return 0;
  });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-[600px]">
      
      {/* Table Bar Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            CMS Editorial — Visão em Tabela Compacta
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {sortedArticles.length} pautas listadas ({articles.filter(a => a.status === 'publicado').length} concluídas)
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full text-left text-xs min-w-[800px]">
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest shadow-sm">
            <tr>
              <th className="py-3 px-4">
                <button
                  type="button"
                  onClick={() => toggleSort('title')}
                  className="w-full flex items-center gap-1 font-bold uppercase tracking-widest hover:text-slate-900 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                >
                  <span>Pauta / Título</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-3 px-3">
                <button
                  type="button"
                  onClick={() => toggleSort('status')}
                  className="w-full flex items-center gap-1 font-bold uppercase tracking-widest hover:text-slate-900 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                >
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-3 px-3">Categoria</th>
              <th className="py-3 px-3">
                <button
                  type="button"
                  onClick={() => toggleSort('publishDate')}
                  className="w-full flex items-center gap-1 font-bold uppercase tracking-widest hover:text-slate-900 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                >
                  <span>Data Publicação</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-3 px-3">
                <button
                  type="button"
                  onClick={() => toggleSort('progress')}
                  className="w-full flex items-center gap-1 font-bold uppercase tracking-widest hover:text-slate-900 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                >
                  <span>Checklists</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-3 px-3 text-right">Ação</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
            {sortedArticles.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Nenhuma pauta encontrada.
                </td>
              </tr>
            ) : (
              sortedArticles.map((art) => {
                const progress = getProgress(art);
                return (
                  <tr
                    key={art.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500"
                    onClick={() => onSelectArticle(art)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectArticle(art);
                      }
                    }}
                    tabIndex={0}
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100 max-w-xs truncate">
                      {art.title}
                      {art.keyword && (
                        <span className="block text-[10px] text-slate-400 font-mono font-normal">
                          SEO: {art.keyword}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={art.status}
                        onChange={(e) => onUpdateStatus(art.id, e.target.value as ArticleStatus)}
                        className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        aria-label="Atualizar Status"
                      >
                        <option value="ideia">Ideia</option>
                        <option value="pesquisa">Pesquisa</option>
                        <option value="escrita">Escrita</option>
                        <option value="revisao">Revisão</option>
                        <option value="publicado">Publicado</option>
                      </select>
                    </td>

                    <td className="py-3 px-3 font-medium">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                        {art.categoryTag}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {art.publishDate}
                    </td>

                    <td className="py-3 px-3 w-36">
                      <div className="flex items-center space-x-2">
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="font-bold font-mono text-[10px] text-slate-600 dark:text-slate-300">
                          {progress}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectArticle(art);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1 ml-auto"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Abrir</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
