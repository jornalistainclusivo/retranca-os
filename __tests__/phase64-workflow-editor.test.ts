import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WorkflowEditor } from '@/components/WorkflowEditor';
import { useEntitlement, EntitlementState } from '@/lib/contexts/EntitlementContext';
import { WorkflowStage } from '@/types/editorial';

vi.mock('@/lib/contexts/EntitlementContext', () => ({ useEntitlement: vi.fn() }));
vi.mock('@/lib/api/articles', () => ({ fetchChecklistTemplates: vi.fn() }));

const stages: WorkflowStage[] = [
  { id: 'review', displayName: 'Revisão Jurídica', orderIndex: 1, semanticClassification: 'REVIEW', lifecycleRole: null, isActive: true },
  { id: 'publication', displayName: 'No Ar', orderIndex: 0, semanticClassification: null, lifecycleRole: 'PUBLICATION', isActive: true },
];

function render(state: EntitlementState) {
  vi.mocked(useEntitlement).mockReturnValue({ state } as ReturnType<typeof useEntitlement>);
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

  it.each(['Unknown', 'FreeConfirmed', 'ProUnavailable'] as const)('preserves existing stages and denies structural controls in %s', state => {
    const html = render(state);
    expect(html).toContain('Revisão Jurídica');
    expect(html).toContain('No Ar');
    expect(button(html, 'Editar etapa No Ar')).toContain('disabled=""');
    expect(button(html, 'Excluir etapa Revisão Jurídica')).toContain('disabled=""');
    expect(button(html, 'Mover etapa No Ar para baixo')).toContain('disabled=""');
    expect(html).not.toContain('Nome da nova etapa');
  });

  it.each(['ProActive', 'ProTemporarilyUnverifiable'] as const)('enables customization and exposes the full semantic vocabulary in %s', state => {
    const html = render(state);
    expect(button(html, 'Editar etapa No Ar')).not.toContain('disabled=""');
    expect(button(html, 'Mover etapa No Ar para baixo')).not.toContain('disabled=""');
    expect(html).toContain('Nome da nova etapa');
    for (const semantic of ['IDEA', 'RESEARCH', 'DRAFTING', 'REVIEW', 'PUBLISHED']) {
      expect(html).toContain(`value="${semantic}"`);
    }
    expect(html).toContain('Sem classificação');
  });

  it('renders contiguous visual ordering and accessible tab/panel relationships', () => {
    const html = render('ProActive');
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

  it('distinguishes unconfirmed access from a confirmed downgrade', () => {
    expect(render('Unknown')).toContain('Acesso PRO não confirmado');
    expect(render('ProUnavailable')).toContain('Acesso PRO não confirmado');
    expect(render('FreeConfirmed')).toContain('Alterações requerem PRO');
  });
});
