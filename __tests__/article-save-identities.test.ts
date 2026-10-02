import { afterEach, describe, expect, it, vi } from 'vitest';
import { createNewArticle } from '@/lib/storage';
import { DEFAULT_CATEGORIES, DEFAULT_WORKFLOW_STAGES } from '@/lib/initialData';

describe('article creation identities across CMS saves', () => {
  afterEach(() => vi.useRealTimers());

  it('creates different article, checklist and history identities even within the same millisecond', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-02T15:00:00Z'));
    const first = createNewArticle(DEFAULT_WORKFLOW_STAGES, DEFAULT_CATEGORIES)!;
    const second = createNewArticle(DEFAULT_WORKFLOW_STAGES, DEFAULT_CATEGORIES)!;
    expect(first.id).not.toBe(second.id);
    expect(first.checklists).toHaveLength(6);
    expect(second.checklists).toHaveLength(6);
    const checklistIds = [...first.checklists, ...second.checklists].map(item => item.id);
    expect(new Set(checklistIds).size).toBe(12);
    expect(first.history[0].id).not.toBe(second.history[0].id);
  });

  it('does not reuse default checklist identities when later articles are created', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-02T15:00:00Z'));
    const first = createNewArticle(DEFAULT_WORKFLOW_STAGES, DEFAULT_CATEGORIES)!;
    vi.advanceTimersByTime(1000);
    const second = createNewArticle(DEFAULT_WORKFLOW_STAGES, DEFAULT_CATEGORIES)!;
    expect(second.checklists.map(item => item.id))
      .not.toEqual(expect.arrayContaining(first.checklists.map(item => item.id)));
  });
});
