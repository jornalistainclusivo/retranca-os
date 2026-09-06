'use client';

import React from 'react';
import { ActiveView, CategoryTag, TimeFilter, Article } from '@/types/editorial';
import { 
  Kanban, 
  ListFilter, 
  CalendarDays, 
  BarChart3, 
  FileText, 
  Clock, 
  Tag, 
  CheckSquare, 
  Sparkles,
  AlertCircle,
  Calendar,
  Layers
} from 'lucide-react';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  timeFilter: TimeFilter;
  setTimeFilter: (tf: TimeFilter) => void;
  selectedCategories: CategoryTag[];
  setSelectedCategories: (cats: CategoryTag[]) => void;
  articles: Article[];
}

const CATEGORY_OPTIONS: CategoryTag[] = [
  'IA',
  'Acessibilidade',
  'Inclusão',
  'SEO',
  'Docs',
  'Blog',
  'Social',
  'Linguagem Simples',
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  timeFilter,
  setTimeFilter,
  selectedCategories,
  setSelectedCategories,
  articles,
}) => {
  // Counts calculation
  const todayStr = new Date().toISOString().slice(0, 10);

  const counts = {
    todas: articles.length,
    hoje: articles.filter(a => a.publishDate === todayStr).length,
    semana: articles.filter(a => {
      const diff = (new Date(a.publishDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
      return diff >= -1 && diff <= 7;
    }).length,
    mes: articles.filter(a => {
      const artDate = new Date(a.publishDate);
      const now = new Date();
      return artDate.getMonth() === now.getMonth() && artDate.getFullYear() === now.getFullYear();
    }).length,
    atrasados: articles.filter(a => a.status !== 'publicado' && a.publishDate < todayStr).length,
  };

  const toggleCategory = (cat: CategoryTag) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const selectAllCategories = () => {
    if (selectedCategories.length === CATEGORY_OPTIONS.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories([...CATEGORY_OPTIONS]);
    }
  };

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 space-y-5">
      
      {/* View Selector Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5 px-2">
          Visões do OS
        </h2>
        <nav className="space-y-1">
          <button
            onClick={() => setActiveView('kanban')}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all ${
              activeView === 'kanban'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <span className="flex items-center gap-2">
              <Kanban className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Quadro Kanban
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono font-bold">
              {articles.length}
            </span>
          </button>

          <button
            onClick={() => setActiveView('lista')}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all ${
              activeView === 'lista'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <span className="flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              CMS Editorial (Lista)
            </span>
          </button>

          <button
            onClick={() => setActiveView('calendario')}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all ${
              activeView === 'calendario'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <span className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              Calendário
            </span>
          </button>

          <button
            onClick={() => setActiveView('estatisticas')}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all ${
              activeView === 'estatisticas'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <span className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Estatísticas & Badges
            </span>
          </button>

          <button
            onClick={() => setActiveView('documentos')}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all ${
              activeView === 'documentos'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              <span className="flex-1 text-left">
                Bloco de notas
              </span>
            </span>
          </button>
        </nav>
      </div>

      {/* Period Filter Side Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5 px-2 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Painel Lateral de Prazos
        </h2>
        <div className="space-y-1">
          <button
            onClick={() => setTimeFilter('todas')}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all ${
              timeFilter === 'todas'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" />
              Todas as Pautas
            </span>
            <span className="text-[10px] font-mono opacity-80">{counts.todas}</span>
          </button>

          <button
            onClick={() => setTimeFilter('hoje')}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all ${
              timeFilter === 'hoje'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              Hoje
            </span>
            <span className="text-[10px] font-mono opacity-80">{counts.hoje}</span>
          </button>

          <button
            onClick={() => setTimeFilter('semana')}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all ${
              timeFilter === 'semana'
                ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Esta semana
            </span>
            <span className="text-[10px] font-mono opacity-80">{counts.semana}</span>
          </button>

          <button
            onClick={() => setTimeFilter('mes')}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all ${
              timeFilter === 'mes'
                ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
              Este mês
            </span>
            <span className="text-[10px] font-mono opacity-80">{counts.mes}</span>
          </button>

          <button
            onClick={() => setTimeFilter('atrasados')}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all ${
              timeFilter === 'atrasados'
                ? 'bg-red-600 text-white font-semibold'
                : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
            }`}
          >
            <span className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5" />
              Atrasados
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
              {counts.atrasados}
            </span>
          </button>
        </div>
      </div>

      {/* Category Tag Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-2.5 px-2">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            Filtros por Categoria
          </h2>
          <button
            onClick={selectAllCategories}
            className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            {selectedCategories.length === CATEGORY_OPTIONS.length ? 'Limpar' : 'Todos'}
          </button>
        </div>

        <div className="space-y-1">
          {CATEGORY_OPTIONS.map((cat) => {
            const isChecked = selectedCategories.includes(cat);
            return (
              <label
                key={cat}
                className="flex items-center justify-between px-2 py-1 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCategory(cat)}
                    className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`text-slate-700 dark:text-slate-300 font-medium ${isChecked ? 'font-bold text-blue-700 dark:text-blue-300' : ''}`}>
                    {cat}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {articles.filter(a => a.categoryTag === cat).length}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Editorial OS Philosophy Banner */}
      <div className="p-3.5 bg-slate-900 text-white rounded-xl text-xs space-y-2 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Retranca</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
          &quot;Organizando o jornalismo antes que ele vire notícia&quot;
        </p>
      </div>

    </aside>
  );
};
