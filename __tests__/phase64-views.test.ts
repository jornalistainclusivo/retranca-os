import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StatsView } from '@/components/StatsView';
import { CalendarView } from '@/components/CalendarView';
import { Article, WorkflowStage } from '@/types/editorial';

vi.mock('lucide-react', () => {
  return {
    Trophy: () => React.createElement('span', null, 'Trophy'),
    CheckCircle2: () => React.createElement('span', null, 'Check'),
    BarChart3: () => React.createElement('span', null, 'Chart'),
    Sparkles: () => React.createElement('span', null, 'Sparkles'),
    Clock: () => React.createElement('span', null, 'Clock'),
    AlertTriangle: () => React.createElement('span', null, 'Alert'),
    Award: () => React.createElement('span', null, 'Award'),
    TrendingUp: () => React.createElement('span', null, 'Trend'),
    FileCheck2: () => React.createElement('span', null, 'File'),
    Zap: () => React.createElement('span', null, 'Zap'),
    Star: () => React.createElement('span', null, 'Star'),
    ChevronLeft: () => React.createElement('span', null, 'Left'),
    ChevronRight: () => React.createElement('span', null, 'Right'),
    CalendarIcon: () => React.createElement('span', null, 'CalendarIcon'),
    Calendar: () => React.createElement('span', null, 'CalendarIcon'),
  };
});

describe('Phase 6.4 - StatsView Integration', () => {
  const baseArticle: Article = {
    id: 'art-1',
    title: 'Test Article',
    status: 'ideia',
    categoryTag: 'IA',
    tags: [],
    publishDate: '2026-08-01',
    summary: '',
    objective: '',
    keyword: '',
    persona: '',
    cta: '',
    internalLinks: '',
    externalLinks: '',
    estimatedTime: '',
    spentTime: '',
    notes: '',
    checklists: [],
    history: [],
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
    workflowStageId: 'stage-idea',
  };

  const stages: WorkflowStage[] = [
    {
      id: 'stage-idea',
      displayName: 'Ideia',
      orderIndex: 0,
      semanticClassification: 'IDEA',
      lifecycleRole: null,
      isActive: true,
    },
    {
      id: 'stage-pub',
      displayName: 'Publicado',
      orderIndex: 5,
      semanticClassification: 'PUBLISHED',
      lifecycleRole: 'PUBLICATION',
      isActive: true,
    },
    {
      id: 'stage-fake-pub',
      displayName: 'Fake Pub',
      orderIndex: 6,
      semanticClassification: 'PUBLISHED',
      lifecycleRole: null,
      isActive: true,
    }
  ];

  it('StatsView publication count uses lifecycleRole, not legacy status', () => {
    // legacy status is "publicado", but stage is IDEATION
    const art1: Article = { ...baseArticle, status: 'publicado', workflowStageId: 'stage-idea' };
    // legacy status is "ideia", but stage is PUBLICATION
    const art2: Article = { ...baseArticle, status: 'ideia', workflowStageId: 'stage-pub' };

    const html = renderToStaticMarkup(React.createElement(StatsView, { articles: [art1, art2], workflowStages: stages }));

    // Total is 2, Published should be 1 (only art2)
    // We can't use RTL, so we look for the number 1 near the "Publicados" text.
    // StatsView renders: <div className="text-2xl...">{publicados}</div> ... <div>Publicados</div>
    expect(html).toContain('1</div><div class="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase tracking-widest mt-1">Publicados</div>');
  });

  it('StatsView overdue exclusion uses lifecycleRole', () => {
    // An article with publishDate in the past
    const pastDate = '2020-01-01';

    // legacy status is "publicado", but stage is IDEATION -> OVERDUE
    const art1: Article = { ...baseArticle, publishDate: pastDate, status: 'publicado', workflowStageId: 'stage-idea' };
    // legacy status is "ideia", but stage is PUBLICATION -> NOT OVERDUE
    const art2: Article = { ...baseArticle, publishDate: pastDate, status: 'ideia', workflowStageId: 'stage-pub' };

    const html = renderToStaticMarkup(React.createElement(StatsView, { articles: [art1, art2], workflowStages: stages }));

    expect(html).toContain('1</div><div class="text-[10px] text-red-800 dark:text-red-300 font-bold uppercase tracking-widest mt-1">Atrasados</div>');
  });

  it('semanticClassification "PUBLISHED" without PUBLICATION does NOT count as published', () => {
    // stage-fake-pub has semanticClassification: 'PUBLISHED' but lifecycleRole: null
    const art1: Article = { ...baseArticle, workflowStageId: 'stage-fake-pub' };

    const html = renderToStaticMarkup(React.createElement(StatsView, { articles: [art1], workflowStages: stages }));

    expect(html).toContain('0</div><div class="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase tracking-widest mt-1">Publicados</div>');
  });

  it('Article in PUBLICATION stage with a non-publicado legacy status IS treated as published', () => {
    const art1: Article = { ...baseArticle, status: 'revisao', workflowStageId: 'stage-pub' };

    const html = renderToStaticMarkup(React.createElement(StatsView, { articles: [art1], workflowStages: stages }));

    expect(html).toContain('1</div><div class="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase tracking-widest mt-1">Publicados</div>');
  });
});

const getTestPublishDate = (day: number = 15) => {
  const d = new Date('2026-08-01');
  const m = d.getMonth() + 1;
  const mm = m < 10 ? `0${m}` : `${m}`;
  const dd = day < 10 ? `0${day}` : `${day}`;
  return `${d.getFullYear()}-${mm}-${dd}`;
};

describe('Phase 6.4 - CalendarView Integration', () => {
  const baseArticle: Article = {
    id: 'art-cal',
    title: 'Calendar Test Article',
    status: 'ideia',
    categoryTag: 'IA',
    tags: [],
    publishDate: getTestPublishDate(15),
    summary: '',
    objective: '',
    keyword: '',
    persona: '',
    cta: '',
    internalLinks: '',
    externalLinks: '',
    estimatedTime: '',
    spentTime: '',
    notes: '',
    checklists: [],
    history: [],
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
    workflowStageId: 'stage-idea',
  };

  const stages: WorkflowStage[] = [
    {
      id: 'stage-idea',
      displayName: 'Ideia',
      orderIndex: 0,
      semanticClassification: 'IDEA',
      lifecycleRole: null,
      isActive: true,
    },
    {
      id: 'stage-pub',
      displayName: 'Renamed Stage',
      orderIndex: 5,
      semanticClassification: 'PUBLISHED',
      lifecycleRole: 'PUBLICATION',
      isActive: true,
    }
  ];

  it('Calendar published check/style uses lifecycleRole', () => {
    // Article in PUBLICATION stage, but legacy status is "escrita"
    const art: Article = { ...baseArticle, status: 'escrita', workflowStageId: 'stage-pub', title: 'Pub Art' };

    const html = renderToStaticMarkup(React.createElement(CalendarView, { articles: [art], workflowStages: stages, onSelectArticle: () => {} }));

    // The article is on 2026-08-15, which is visible in the current month view.
    // It should have the ✓ and the emerald background class.
    expect(html).toContain('✓ ');
    expect(html).toContain('bg-emerald-50');
  });

  it('publishDate controls calendar position but does NOT confer publication', () => {
    // publishDate is the dynamically generated date, but stage is IDEATION
    const art1: Article = { ...baseArticle, status: 'publicado', workflowStageId: 'stage-idea' };

    const html = renderToStaticMarkup(React.createElement(CalendarView, { articles: [art1], workflowStages: stages, onSelectArticle: () => {} }));

    // Ensure it's in the calendar (rendered)
    expect(html).toContain('Calendar Test Article');
    // It should NOT have the ✓ or emerald styling
    expect(html).not.toContain('✓');
    expect(html).not.toContain('bg-emerald-50');
    expect(html).toContain('bg-blue-50'); // Default IDEATION style
  });

  it('legacy status does not override domain logic', () => {
    const weirdPubStage = { ...stages.find(s => s.id === 'stage-pub')!, displayName: 'Arquivado' };

    const art1: Article = { ...baseArticle, status: 'ideia', workflowStageId: 'stage-pub' };

    const html = renderToStaticMarkup(React.createElement(CalendarView, { articles: [art1], workflowStages: [stages[0], weirdPubStage, stages[2]], onSelectArticle: () => {} }));

    expect(html).toContain('✓ ');
    expect(html).toContain('bg-emerald-50');
  });
});
