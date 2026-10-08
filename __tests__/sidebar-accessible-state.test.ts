import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Sidebar } from '@/components/Sidebar';
import { ActiveView, TimeFilter } from '@/types/editorial';

const views: [ActiveView, string][] = [
  ['inicio', 'Início'], ['kanban', 'Quadro Kanban'], ['lista', 'CMS Editorial (Lista)'],
  ['calendario', 'Calendário'], ['estatisticas', 'Estatísticas e conquistas'],
  ['documentos', 'Bloco de notas'], ['configuracoes', 'Configurações Editoriais'],
];
const filters: [TimeFilter, string][] = [
  ['todas', 'Todas as Pautas'], ['hoje', 'Hoje'], ['semana', 'Próximos 7 dias'],
  ['mes', 'Este mês'], ['atrasados', 'Atrasados'],
];
function render(activeView: ActiveView, timeFilter: TimeFilter) {
  return renderToStaticMarkup(React.createElement(Sidebar, {
    activeView, timeFilter, setActiveView: () => {}, setTimeFilter: () => {},
    selectedCategories: [], setSelectedCategories: () => {}, articles: [], categories: [], workflowStages: [],
  }));
}
function buttons(html: string) {
  return [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map(match => ({
    attributes: match[1], name: match[2].replace(/<[^>]+>/g, '').trim(),
  }));
}
describe('Sidebar accessible selection state', () => {
  it.each(views)('exposes exactly the active %s view as the current page', (view, name) => {
    const current = buttons(render(view, 'todas')).filter(button => button.attributes.includes('aria-current="page"'));
    expect(current).toHaveLength(1);
    expect(current[0].name).toContain(name);
  });
  it.each(filters)('exposes exactly the selected %s deadline filter as pressed', (filter, name) => {
    const options = buttons(render('inicio', filter)).filter(button => button.attributes.includes('aria-pressed='));
    expect(options).toHaveLength(5);
    const selected = options.filter(button => button.attributes.includes('aria-pressed="true"'));
    expect(selected).toHaveLength(1);
    expect(selected[0].name).toContain(name);
    expect(options.filter(button => button.attributes.includes('aria-pressed="false"'))).toHaveLength(4);
  });
});
