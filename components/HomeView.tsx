'use client';

import React from 'react';
import { Article, WorkflowStage, CategoryEntity, ActiveView } from '@/types/editorial';
import { EditorialAchievements } from './EditorialAchievements';
import { unresolvedArticles } from '@/lib/utils/editorialOverview';

interface HomeViewProps {
  articles: Article[];
  workflowStages: WorkflowStage[];
  categories: CategoryEntity[];
  onNavigate: (view: ActiveView) => void;
  onCreateArticle: () => void;
  onSelectArticle: (article: Article) => void;
}

const actionClass = 'inline-flex items-center justify-center min-h-11 px-4 py-2 rounded-lg font-semibold text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

export function HomeView({ articles, workflowStages, categories, onNavigate, onCreateArticle, onSelectArticle }: HomeViewProps) {
  const unresolved = unresolvedArticles(articles, workflowStages, categories);
  const recent = [...articles].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3);
  return <div className="space-y-6">
    <section className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 space-y-4 border border-slate-800">
      <p className="text-sm font-semibold text-blue-300">Início • Seu espaço editorial</p>
      <h3 className="text-2xl sm:text-3xl font-bold">Organize a pauta, acompanhe a produção e revise com cuidado.</h3>
      <p className="text-slate-200 max-w-2xl">O Retranca é uma edição única, gratuita e aberta. Suas pautas ficam neste ambiente local. A IA é opcional e as decisões editoriais continuam com você.</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onCreateArticle} className={`${actionClass} bg-blue-600! text-white! border-blue-500! hover:bg-blue-700!`}>{articles.length ? 'Criar nova pauta' : 'Criar minha primeira pauta'}</button>
        <button type="button" onClick={() => onNavigate('kanban')} className={actionClass}>Abrir quadro Kanban</button>
      </div>
      <p className="text-sm text-slate-200">{articles.length} pauta(s) salva(s) neste ambiente.</p>
    </section>

    <section className="rounded-xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-700 space-y-3">
      <h3 className="text-lg font-bold">Comece com o fluxo sugerido ou personalize</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">Você já tem {workflowStages.length} etapas e {categories.length} categorias ativas. Pode usar essa configuração agora ou adaptá-la nas Configurações Editoriais.</p>
      <p className="text-sm text-slate-600 dark:text-slate-300">O nome da etapa é livre. A classificação indica sua função editorial. Uma etapa mantém a função de publicação, usada para registrar a conclusão; isso não publica a matéria na internet. Ao remover uma etapa ou categoria, escolha para onde suas pautas irão.</p>
      <button type="button" onClick={() => onNavigate('configuracoes')} className={actionClass}>Personalizar etapas, categorias e checklists</button>
    </section>

    {unresolved.length > 0 && <section aria-label="Pautas para conferir" className="rounded-xl border border-amber-400 bg-amber-50 dark:bg-amber-950/30 p-6 space-y-3">
      <h3 className="font-bold">{unresolved.length} pauta(s) precisam de etapa ou categoria válida</h3>
      <p className="text-sm">Esses registros continuam preservados e entram nos totais. Abra o CMS para conferir os vínculos; nenhuma pauta foi apagada ou reclassificada automaticamente.</p>
      <button type="button" onClick={() => onNavigate('kanban')} className={actionClass}>Conferir pautas no quadro</button>
    </section>}

    <section className="space-y-3">
      <h3 className="text-lg font-bold">Como funciona</h3>
      <ol className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-none">
        {[
          ['1. Crie sua pauta', 'Defina título, prazo e categoria. Salve no CMS para manter o rascunho.'],
          ['2. Acompanhe o fluxo', 'Mova a pauta entre as etapas no Kanban. No CMS, edite resumo, objetivo e conteúdo completo, cada um vinculado à sua pauta.'],
          ['3. Revise com os checklists', 'Registre pesquisa, revisão e acessibilidade. Um item marcado registra sua avaliação; verifique fontes e conteúdo antes de concluir.'],
          ['4. Use IA local se quiser', 'Em “IA local”, escolha um modelo que você já instalou no Ollama. Salve o texto original, revise a sugestão e aplique o que fizer sentido. A pauta pode ser trabalhada sem IA.'],
        ].map(([title, text]) => <li key={title} className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 space-y-2">
          <h4 className="font-semibold">{title}</h4><p className="text-sm text-slate-600 dark:text-slate-300">{text}</p>
        </li>)}
      </ol>
    </section>

    <section className="space-y-3">
      <h3 className="text-lg font-bold">Continue seu trabalho</h3>
      {recent.length ? <ul className="space-y-2">{recent.map(article => <li key={article.id}>
        <button type="button" onClick={() => onSelectArticle(article)} className={`${actionClass} w-full justify-start text-left`}>Abrir no CMS: {article.title || 'Pauta sem título'}</button>
      </li>)}</ul> : <p className="text-sm text-slate-600 dark:text-slate-300">Seu ambiente começa sem pautas de exemplo. Sua primeira pauta salva aparecerá aqui.</p>}
    </section>
    <EditorialAchievements articles={articles} workflowStages={workflowStages} />
  </div>;
}
