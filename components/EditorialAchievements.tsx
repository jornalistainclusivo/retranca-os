import React from 'react';
import { Article, WorkflowStage } from '@/types/editorial';
import { editorialAchievements } from '@/lib/utils/editorialOverview';

export function EditorialAchievements({ articles, workflowStages }: { articles: Article[]; workflowStages: WorkflowStage[] }) {
  return <section aria-label="Suas conquistas" className="space-y-3">
    <h3 className="text-lg font-bold">Suas conquistas</h3>
    <p className="text-sm text-slate-600 dark:text-slate-300">Progresso registrado nas pautas atuais. Marcar um checklist não certifica acessibilidade nem qualidade editorial.</p>
    <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {editorialAchievements(articles, workflowStages).map(badge => <li key={badge.id} className={`rounded-xl border p-4 space-y-2 ${badge.unlocked ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}>
        <span aria-hidden="true" className="text-2xl">{badge.icon}</span>
        <h4 className="font-semibold">{badge.title}</h4>
        <p className="text-sm text-slate-600 dark:text-slate-300">{badge.description}</p>
        <p className="text-sm font-semibold">{badge.unlocked ? 'Conquistada' : 'Em andamento'}</p>
      </li>)}
    </ul>
  </section>;
}
