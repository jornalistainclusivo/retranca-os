// Placeholder para o objeto DB local. Será substituído pela instância real IPC do Tauri.
let db: any = null;

import { articles, checklistItems, historyEntries, governanceDocs } from '@/db/schema';
import { ALL_INITIAL_ARTICLES, GOVERNANCE_DOCS } from '@/lib/initialData';

export const setDbInstanceForSeed = (dbInstance: any) => {
  db = dbInstance;
};

export const seedDatabase = async () => {
  if (!db) throw new Error("Database not initialized");

  // 1. Inserir Governance Docs
  for (const doc of GOVERNANCE_DOCS) {
    await db.insert(governanceDocs).values({
      id: `doc_${Date.now()}_${Math.random()}`,
      type: doc.type,
      title: doc.title,
      description: doc.description,
      lastUpdated: doc.lastUpdated,
      content: doc.content,
    });
  }

  // 2. Inserir Articles
  for (const article of ALL_INITIAL_ARTICLES) {
    await db.insert(articles).values({
      id: article.id,
      title: article.title,
      status: article.status,
      categoryTag: article.categoryTag,
      tags: JSON.stringify(article.tags),
      publishDate: article.publishDate,
      summary: article.summary,
      objective: article.objective,
      keyword: article.keyword,
      persona: article.persona,
      cta: article.cta,
      internalLinks: article.internalLinks,
      externalLinks: article.externalLinks,
      estimatedTime: article.estimatedTime,
      spentTime: article.spentTime,
      notes: article.notes,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      completedAt: article.completedAt,
    });

    // 2.1 Inserir Checklists
    if (article.checklists && article.checklists.length > 0) {
      const dbChecks = article.checklists.map(c => ({
        id: c.id,
        articleId: article.id,
        label: c.label,
        completed: c.completed ? 1 : 0,
        category: c.category || null,
      }));
      await db.insert(checklistItems).values(dbChecks);
    }

    // 2.2 Inserir Histórico
    if (article.history && article.history.length > 0) {
      const dbHist = article.history.map(h => ({
        id: h.id,
        articleId: article.id,
        date: h.date,
        action: h.action,
      }));
      await db.insert(historyEntries).values(dbHist);
    }
  }
};
