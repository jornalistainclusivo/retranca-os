import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WorkflowEditor } from '@/components/WorkflowEditor';
import { WorkflowStage } from '@/types/editorial';

vi.mock('@/lib/api/articles', () => ({ fetchChecklistTemplates: vi.fn() }));

const stages: WorkflowStage[] = [
  { id: 'review', displayName: 'Revisão Jurídica', orderIndex: 1, semanticClassification: 'REVIEW', lifecycleRole: null, isActive: true },
  { id: 'publication', displayName: 'No Ar', orderIndex: 0, semanticClassification: null, lifecycleRole: 'PUBLICATION', isActive: true },
];

function render() {
  return renderToStaticMarkup(React.createElement(WorkflowEditor, {
    workflowStages: stages, categories: [], onUpdateStages: vi.fn(), onUpdateCategories: vi.fn(),
  }));
}

function button(html: string, label: string) {
  const match = html.match(new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`));
  expect(match).not.toBeNull();
  return match![0];
}

describe('WorkflowEditor real rendering', () => {
  beforeEach(() => vi.clearAllMocks());

  it('enables customization without an entitlement provider and exposes the full semantic vocabulary', () => {
    const html = render();
    expect(button(html, 'Editar etapa No Ar')).not.toContain('disabled=""');
    expect(button(html, 'Mover etapa No Ar para baixo')).not.toContain('disabled=""');
    expect(html).toContain('Nome da nova etapa');
    for (const semantic of ['IDEA', 'RESEARCH', 'DRAFTING', 'REVIEW', 'PUBLISHED']) {
      expect(html).toContain(`value="${semantic}"`);
    }
    expect(html).toContain('Sem classificação');
  });

  it('renders contiguous visual ordering and accessible tab/panel relationships', () => {
    const html = render();
    expect(html.indexOf('<h3 class="font-semibold text-slate-900 dark:text-slate-100">No Ar')).toBeLessThan(html.indexOf('<h3 class="font-semibold text-slate-900 dark:text-slate-100">Revisão Jurídica'));
    expect(html).toContain('role="tablist"');
    expect(html.match(/role="tab"/g)).toHaveLength(3);
    expect(html.match(/tabindex="-1"/g)).toHaveLength(2);
    const panel = html.match(/role="tabpanel" id="([^"]+)" aria-labelledby="([^"]+)"/)!;
    expect(panel).not.toBeNull();
    expect(html).toContain(`aria-controls="${panel[1]}"`);
    expect(html).toContain(`id="${panel[2]}"`);
    expect(html).toContain('role="status" aria-atomic="true"');
  });

  it('does not display commercial locks', () => {
    expect(render()).not.toContain('PRO');
    expect(render()).not.toContain('Premium');
  });
});
