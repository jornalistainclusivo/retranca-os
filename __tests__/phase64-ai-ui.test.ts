import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ArticleModal } from '@/components/ArticleModal';
import { AiAssistantModal } from '@/components/AiAssistantModal';
import { useAiRuntime } from '@/lib/contexts/AiRuntimeContext';
import type { Article, WorkflowStage } from '@/types/editorial';

vi.mock('@/lib/contexts/AiRuntimeContext', () => ({ useAiRuntime: vi.fn() }));
vi.mock('@/lib/api/articles', () => ({ fetchChecklistTemplates: vi.fn() }));

const stage: WorkflowStage = {
  id: 'custom-stage', displayName: 'Apuração especial', orderIndex: 0,
  semanticClassification: null, lifecycleRole: 'PUBLICATION', isActive: true,
};
const article: Article = {
  id: 'article', title: 'Title', status: 'revisao', categoryTag: 'Blog', workflowStageId: stage.id,
  categoryId: 'category', tags: [], publishDate: '', summary: 'Summary', objective: 'Objective',
  keyword: 'Keyword', persona: '', cta: '', internalLinks: '', externalLinks: '', estimatedTime: '',
  spentTime: '', notes: '', checklists: [], history: [], createdAt: '', updatedAt: '',
};


function renderArticle(overrides: Partial<WorkflowStage> = {}, data: Article = article) {
  return renderToStaticMarkup(React.createElement(ArticleModal, {
    article: data, workflowStages: [{ ...stage, ...overrides }], categories: [], isOpen: true,
    onClose: vi.fn(), onSave: vi.fn(), onDelete: vi.fn(), isFocusMode: false, setIsFocusMode: vi.fn(),
  }));
}

function button(html: string, text: string) {
  const match = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].find(entry => entry[2].includes(text));
  expect(match, text).toBeDefined();
  return { attributes: match![1], content: match![2] };
}

describe('Phase 6.4 AI controls in real modal markup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAiRuntime).mockReturnValue({ selectedModel: null, setSelectedModel: vi.fn() });
  });

  it('keeps evidence-valid article actions open without an entitlement provider', () => {
    const html = renderArticle();
    for (const label of ['Pesquisar Lacunas', 'Simplificar Linguagem', 'Validar Inclusividade', 'Otimizar Meta Tags SEO']) {
      const control = button(html, label);
      expect(control.attributes).not.toContain('disabled=""');
      expect(control.attributes).toContain('tabindex="0"');
      expect(control.attributes).toContain('focus-visible:ring-2');
      expect(control.content).not.toContain('Recomendado');
    }
    // Pasted content and visual description are empty on modal entry.
    for (const label of ['Alt Text WCAG', 'Revisão Editorial']) {
      expect(button(html, label).attributes).toContain('disabled=""');
      expect(button(html, label).content).toContain('Falta');
    }
    expect(html).not.toContain('Recurso Premium');
  });

  it('keeps the assistant submit control open without an entitlement provider', () => {
    const html = renderToStaticMarkup(React.createElement(AiAssistantModal, { isOpen: true, onClose: vi.fn() }));
    expect(button(html, 'Gerar com IA').attributes).not.toContain('disabled=""');
    expect(button(html, 'Gerar com IA').attributes).not.toContain('tabindex="-1"');
    expect(html).not.toContain('Premium');
  });

  it('recommends from current classification despite stale legacy status and publication role', () => {
    const data = { ...article, status: 'ideia' as const };
    const html = renderArticle({ semanticClassification: 'REVIEW' }, data);
    expect(button(html, 'Otimizar Meta Tags SEO').content).toContain('Recomendado');
    expect(button(html, 'Pesquisar Lacunas').content).not.toContain('Recomendado');
    expect(button(html, 'Revisão Editorial').attributes).toContain('disabled=""');
  });

  it('ignores stage names, ordering, and lifecycle roles when evaluating AI', () => {
    const original = renderArticle({ semanticClassification: 'DRAFTING' });
    const renamed = renderArticle({ semanticClassification: 'DRAFTING', displayName: 'Revisão', orderIndex: 42, lifecycleRole: null });
    for (const label of ['Pesquisar Lacunas', 'Simplificar Linguagem', 'Alt Text WCAG', 'Otimizar Meta Tags SEO', 'Revisão Editorial']) {
      expect(button(renamed, label)).toEqual(button(original, label));
    }
  });

  it('does not infer recommendations from legacy status when the stage is unresolved', () => {
    const html = renderArticle({}, { ...article, workflowStageId: 'missing' });
    expect(button(html, 'Otimizar Meta Tags SEO').attributes).not.toContain('disabled=""');
    expect(button(html, 'Otimizar Meta Tags SEO').content).not.toContain('Recomendado');
  });

  it('does not treat PUBLISHED semantics as an availability restriction', () => {
    const html = renderArticle({ semanticClassification: 'PUBLISHED', lifecycleRole: null });
    expect(button(html, 'Otimizar Meta Tags SEO').attributes).not.toContain('disabled=""');
    expect(button(html, 'Otimizar Meta Tags SEO').content).not.toContain('Recomendado');
  });
});
