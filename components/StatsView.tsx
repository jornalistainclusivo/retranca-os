'use client';

import React from 'react';
import { Article, WorkflowStage } from '@/types/editorial';
import { EditorialAchievements } from './EditorialAchievements';
import { matchesTimeFilter } from '@/lib/utils/editorialOverview';
import { 
  Trophy, 
  CheckCircle2, 
  BarChart3, 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  Award, 
  TrendingUp, 
  FileCheck2,
  Zap,
  Star
} from 'lucide-react';

interface StatsViewProps {
  articles: Article[];
  workflowStages: WorkflowStage[];
}

export const StatsView: React.FC<StatsViewProps> = ({ articles, workflowStages }) => {
  const total = articles.length;

  const publicados = articles.filter((a) => {
    const stage = workflowStages.find(s => s.id === a.workflowStageId);
    return stage?.lifecycleRole === 'PUBLICATION';
  }).length;

  const emRevisao = articles.filter((a) => {
    const stage = workflowStages.find(s => s.id === a.workflowStageId);
    return stage?.lifecycleRole !== 'PUBLICATION' && stage?.semanticClassification === 'REVIEW';
  }).length;

  const emEscrita = articles.filter((a) => {
    const stage = workflowStages.find(s => s.id === a.workflowStageId);
    return stage?.lifecycleRole !== 'PUBLICATION' && stage?.semanticClassification === 'DRAFTING';
  }).length;

  const emPesquisa = articles.filter((a) => {
    const stage = workflowStages.find(s => s.id === a.workflowStageId);
    return stage?.lifecycleRole !== 'PUBLICATION' && stage?.semanticClassification === 'RESEARCH';
  }).length;

  const emIdeia = articles.filter((a) => {
    const stage = workflowStages.find(s => s.id === a.workflowStageId);
    return stage?.lifecycleRole !== 'PUBLICATION' && stage?.semanticClassification === 'IDEA';
  }).length;

  const atrasados = articles.filter(a => matchesTimeFilter(a, 'atrasados', workflowStages)).length;

  const percentPublished = total > 0 ? Math.round((publicados / total) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Top Banner Metric */}
      <div className="bg-slate-900 rounded-xl p-6 text-white border border-slate-800 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-base font-bold">Estatísticas Gerais & Desempenho Editorial</h2>
              <p className="text-xs text-slate-400 font-medium">
                Conhecimento e acessibilidade técnica no ecossistema do Retranca.
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-mono font-bold text-blue-400">{percentPublished}%</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Concluído</div>
          </div>
        </div>

        {/* Big Progress Bar */}
        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-500 shadow-2xs"
            style={{ width: `${percentPublished}%` }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs text-center">
          <div className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100">{total}</div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Total Pautas</div>
        </div>

        <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-2xs text-center">
          <div className="text-2xl font-mono font-bold text-emerald-700 dark:text-emerald-400">{publicados}</div>
          <div className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase tracking-widest mt-1">Publicados</div>
        </div>

        <div className="bg-orange-50/60 dark:bg-orange-950/40 p-4 rounded-xl border border-orange-200 dark:border-orange-800 shadow-2xs text-center">
          <div className="text-2xl font-mono font-bold text-orange-700 dark:text-orange-400">{emRevisao}</div>
          <div className="text-[10px] text-orange-800 dark:text-orange-300 font-bold uppercase tracking-widest mt-1">Em Revisão</div>
        </div>

        <div className="bg-amber-50/60 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200 dark:border-amber-800 shadow-2xs text-center">
          <div className="text-2xl font-mono font-bold text-amber-700 dark:text-amber-400">{emEscrita}</div>
          <div className="text-[10px] text-amber-800 dark:text-amber-300 font-bold uppercase tracking-widest mt-1">Em Escrita</div>
        </div>

        <div className="bg-blue-50/60 dark:bg-blue-950/40 p-4 rounded-xl border border-blue-200 dark:border-blue-800 shadow-2xs text-center">
          <div className="text-2xl font-mono font-bold text-blue-700 dark:text-blue-400">{emPesquisa}</div>
          <div className="text-[10px] text-blue-800 dark:text-blue-300 font-bold uppercase tracking-widest mt-1">Em Pesquisa</div>
        </div>

        <div className="bg-red-50/60 dark:bg-red-950/40 p-4 rounded-xl border border-red-200 dark:border-red-800 shadow-2xs text-center">
          <div className="text-2xl font-mono font-bold text-red-700 dark:text-red-400">{atrasados}</div>
          <div className="text-[10px] text-red-800 dark:text-red-300 font-bold uppercase tracking-widest mt-1">Atrasados</div>
        </div>
      </div>

      {/* Gamification Achievements / Badges Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5 text-yellow-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Conquistas de Acessibilidade & Gamificação
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="col-span-full"><EditorialAchievements articles={articles} workflowStages={workflowStages} /></div>
        </div>
      </div>

      {/* Motivational Inspirational Quote */}
      <div className="bg-slate-900 text-slate-100 rounded-xl p-6 border border-slate-800 flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
            Mensagem Editorial
          </div>
          <p className="text-xs font-medium italic text-slate-300">
            Confira fontes, contexto e acessibilidade antes de concluir sua pauta. Os indicadores registram seu trabalho e não substituem a revisão humana.
          </p>
        </div>
        <Sparkles className="w-6 h-6 text-yellow-400 flex-shrink-0 ml-4" />
      </div>

    </div>
  );
};
