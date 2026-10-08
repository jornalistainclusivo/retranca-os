import { Article, CategoryEntity, GamificationBadge, TimeFilter, WorkflowStage } from '@/types/editorial';

export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function matchesTimeFilter(article: Article, filter: TimeFilter, stages: WorkflowStage[], now = new Date()): boolean {
  const today = localDateKey(now);
  if (filter === 'hoje') return article.publishDate === today;
  if (filter === 'semana') {
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6);
    return article.publishDate >= today && article.publishDate <= localDateKey(end);
  }
  if (filter === 'mes') return article.publishDate.slice(0, 7) === today.slice(0, 7);
  if (filter === 'atrasados') return Boolean(article.publishDate) && article.publishDate < today &&
    !stages.some(s => s.isActive && s.id === article.workflowStageId && s.lifecycleRole === 'PUBLICATION');
  return true;
}

export function unresolvedArticles(articles: Article[], stages: WorkflowStage[], categories?: CategoryEntity[]): Article[] {
  return articles.filter(a => !stages.some(s => s.isActive && s.id === a.workflowStageId) ||
    (categories !== undefined && !categories.some(c => c.isActive && c.id === a.categoryId)));
}

export function filterWorkspaceArticles(articles: Article[], search: string, selected: string[], categories: CategoryEntity[]): Article[] {
  const term = search.trim().toLocaleLowerCase('pt-BR');
  const allSelected = selected.length === 0 || categories.every(c => selected.includes(c.id));
  return articles.filter(a => {
    if (!allSelected && a.categoryId && !selected.includes(a.categoryId)) return false;
    return !term || [a.title, a.summary, a.keyword, a.notes, ...a.tags]
      .some(value => value.toLocaleLowerCase('pt-BR').includes(term));
  });
}

export function editorialAchievements(articles: Article[], stages: WorkflowStage[]): GamificationBadge[] {
  const completeGroup = (groups: string[]) => articles.some(a => {
    const items = a.checklists.filter(c => c.category && groups.includes(c.category));
    return items.length > 0 && items.every(c => c.completed);
  });
  return [
    { id: 'first-article', title: 'Primeira pauta', description: 'Salvar pelo menos uma pauta neste ambiente.', icon: '📝', unlocked: articles.length > 0 },
    { id: 'research-checklist', title: 'Checagem registrada', description: 'Marcar todos os itens de pesquisa de uma pauta que tenha esses itens.', icon: '🔎', unlocked: completeGroup(['pesquisa']) },
    { id: 'accessibility-checklist', title: 'Acessibilidade registrada', description: 'Marcar todos os itens de acessibilidade e WCAG de uma pauta que tenha esses itens.', icon: '🌟', unlocked: completeGroup(['acessibilidade', 'wcag']) },
    { id: 'first-publication', title: 'Primeira conclusão', description: 'Mover uma pauta para a etapa com função de publicação.', icon: '🎉', unlocked: articles.some(a => stages.some(s => s.isActive && s.id === a.workflowStageId && s.lifecycleRole === 'PUBLICATION')) },
  ];
}
