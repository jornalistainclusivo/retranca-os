import { describe, it, expect } from 'vitest';
import { toArticleProps, fromArticleProps } from '../articleAdapter';
import { DbArticle, DbChecklistItem, DbHistoryEntry } from '@/db/schema';
import { Article } from '@/types/editorial';

describe('Article Adapter', () => {
  const dbArticle: DbArticle = {
    id: 'art_123',
    title: 'Test Article',
    status: 'ideia',
    categoryTag: 'SEO',
    tags: JSON.stringify(['SEO', 'Tests']),
    publishDate: '2026-08-15',
    summary: 'A test article',
    objective: 'Testing',
    keyword: 'test',
    persona: 'Developer',
    cta: 'Read more',
    internalLinks: '',
    externalLinks: '',
    estimatedTime: '2h',
    spentTime: '0m',
    notes: '',
    createdAt: '2026-08-15T12:00:00Z',
    updatedAt: '2026-08-15T12:00:00Z',
    completedAt: null
  };

  const dbChecklists: DbChecklistItem[] = [
    { id: 'chk_1', articleId: 'art_123', label: 'Item 1', completed: 1, category: 'seo' },
    { id: 'chk_2', articleId: 'art_123', label: 'Item 2', completed: 0, category: 'wcag' }
  ];

  const dbHistory: DbHistoryEntry[] = [
    { id: 'hist_1', articleId: 'art_123', date: '2026-08-15T12:00:00Z', action: 'Created' }
  ];

  it('should correctly map DbArticle to Article properties (toArticleProps)', () => {
    const article = toArticleProps(dbArticle, dbChecklists, dbHistory);

    expect(article.id).toBe('art_123');
    expect(article.status).toBe('ideia');
    expect(article.tags).toEqual(['SEO', 'Tests']);
    
    // Checklist mapping checks
    expect(article.checklists).toHaveLength(2);
    expect(article.checklists[0].completed).toBe(true);
    expect(article.checklists[1].completed).toBe(false);

    // History mapping checks
    expect(article.history).toHaveLength(1);
    expect(article.history[0].action).toBe('Created');
  });

  it('should correctly map Article to DbArticle and relations (fromArticleProps)', () => {
    const article: Article = toArticleProps(dbArticle, dbChecklists, dbHistory);
    const { article: dbArt, checklists: dbChk, history: dbHist } = fromArticleProps(article);

    expect(dbArt.id).toBe('art_123');
    expect(dbArt.tags).toBe(JSON.stringify(['SEO', 'Tests']));
    
    // Checklist mapping checks
    expect(dbChk).toHaveLength(2);
    expect(dbChk[0].completed).toBe(1);
    expect(dbChk[0].articleId).toBe('art_123');
    expect(dbChk[1].completed).toBe(0);

    // History mapping checks
    expect(dbHist).toHaveLength(1);
    expect(dbHist[0].articleId).toBe('art_123');
  });

  it('should handle empty checklists and history', () => {
    const article = toArticleProps(dbArticle, [], []);
    expect(article.checklists).toEqual([]);
    expect(article.history).toEqual([]);

    const rawData = fromArticleProps(article);
    expect(rawData.checklists).toEqual([]);
    expect(rawData.history).toEqual([]);
  });
});
