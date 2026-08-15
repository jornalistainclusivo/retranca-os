import { getDb } from '@/db/client';
import { articles, checklistItems, historyEntries, DbArticle, DbChecklistItem, DbHistoryEntry } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface RawArticleData {
  article: DbArticle;
  checklists: DbChecklistItem[];
  history: DbHistoryEntry[];
}

export const fetchAllRawArticles = async (): Promise<RawArticleData[]> => {
  const db = await getDb();
  
  const allArticles = await db.select().from(articles);
  const allChecklists = await db.select().from(checklistItems);
  const allHistory = await db.select().from(historyEntries);

  return allArticles.map((art: any) => ({
    article: art,
    checklists: allChecklists.filter((c: any) => c.articleId === art.id),
    history: allHistory.filter((h: any) => h.articleId === art.id),
  }));
};

export const saveRawArticle = async (raw: RawArticleData): Promise<void> => {
  const db = await getDb();
  const existing = await db.select().from(articles).where(eq(articles.id, raw.article.id));
  
  if (existing.length > 0) {
    await db.update(articles).set(raw.article).where(eq(articles.id, raw.article.id));
    await db.delete(checklistItems).where(eq(checklistItems.articleId, raw.article.id));
    await db.delete(historyEntries).where(eq(historyEntries.articleId, raw.article.id));
  } else {
    await db.insert(articles).values(raw.article);
  }
  
  if (raw.checklists.length > 0) {
    await db.insert(checklistItems).values(raw.checklists);
  }
  
  if (raw.history.length > 0) {
    await db.insert(historyEntries).values(raw.history);
  }
};

export const deleteRawArticle = async (id: string): Promise<void> => {
  const db = await getDb();
  await db.delete(articles).where(eq(articles.id, id));
  await db.delete(checklistItems).where(eq(checklistItems.articleId, id));
  await db.delete(historyEntries).where(eq(historyEntries.articleId, id));
};
