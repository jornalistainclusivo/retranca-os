import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const articles = sqliteTable('articles', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  status: text('status').notNull(), // 'ideia' | 'pesquisa' | 'escrita' | 'revisao' | 'publicado'
  categoryTag: text('categoryTag').notNull(),
  tags: text('tags').notNull(), // JSON stringificado
  publishDate: text('publishDate').notNull(),
  summary: text('summary'),
  objective: text('objective'),
  keyword: text('keyword'),
  persona: text('persona'),
  cta: text('cta'),
  internalLinks: text('internalLinks'),
  externalLinks: text('externalLinks'),
  estimatedTime: text('estimatedTime'),
  spentTime: text('spentTime'),
  notes: text('notes'),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
  completedAt: text('completedAt'),
});

export const checklistItems = sqliteTable('checklist_items', {
  id: text('id').primaryKey(),
  articleId: text('articleId').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  completed: integer('completed').notNull(), // 0 ou 1
  category: text('category'),
});

export const historyEntries = sqliteTable('history_entries', {
  id: text('id').primaryKey(),
  articleId: text('articleId').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  action: text('action').notNull(),
});

export const governanceDocs = sqliteTable('governance_docs', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // 'BRD' | 'PRD' | 'SDD' | 'TSD'
  title: text('title').notNull(),
  description: text('description'),
  lastUpdated: text('lastUpdated').notNull(),
  content: text('content').notNull(),
});

export const gamificationBadges = sqliteTable('gamification_badges', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(),
  unlocked: integer('unlocked').notNull(), // 0 ou 1
  unlockedAt: text('unlockedAt'),
});

export type DbArticle = typeof articles.$inferSelect;
export type DbNewArticle = typeof articles.$inferInsert;
export type DbChecklistItem = typeof checklistItems.$inferSelect;
export type DbHistoryEntry = typeof historyEntries.$inferSelect;
export type DbGovernanceDoc = typeof governanceDocs.$inferSelect;
