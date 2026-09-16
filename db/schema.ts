import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// ──────────────────────────────────────────────────────
// Phase 6.4: Dynamic Workflow Stages (BR-WF-001)
// ──────────────────────────────────────────────────────

export const workflowStages = sqliteTable('workflow_stages', {
  id: text('id').primaryKey(),
  displayName: text('display_name').notNull(),
  orderIndex: integer('order_index').notNull(),
  semanticClassification: text('semantic_classification'), // IDEA | RESEARCH | DRAFTING | REVIEW | PUBLISHED | null
  lifecycleRole: text('lifecycle_role'), // PUBLICATION | null
  isActive: integer('is_active').notNull().default(1), // boolean 0/1
  createdAt: text('created_at'),
});

// ──────────────────────────────────────────────────────
// Phase 6.4: Categories (BR-CAT-001)
// ──────────────────────────────────────────────────────

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  origin: text('origin').notNull(), // 'standard' | 'custom'
  isActive: integer('is_active').notNull().default(1), // boolean 0/1
  createdAt: text('created_at'),
});

// ──────────────────────────────────────────────────────
// Phase 6.4: Checklist Templates (BR-CHK-001)
// ──────────────────────────────────────────────────────

export const checklistTemplates = sqliteTable('checklist_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  itemsJson: text('items_json').notNull(), // JSON array of {label: string}
  createdAt: text('created_at'),
});

// ──────────────────────────────────────────────────────
// Existing: Articles (with Phase 6.4 EXPAND nullable refs)
// ──────────────────────────────────────────────────────

export const articles = sqliteTable('articles', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  status: text('status').notNull(), // legacy: 'ideia' | 'pesquisa' | 'escrita' | 'revisao' | 'publicado'
  categoryTag: text('categoryTag').notNull(), // legacy category string
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
  // Phase 6.4 EXPAND: nullable during transition, NOT NULL after Slice 2 CUTOVER
  workflowStageId: text('workflow_stage_id').notNull().references(() => workflowStages.id, { onDelete: 'restrict', onUpdate: 'restrict' }),
  categoryId: text('category_id').notNull().references(() => categories.id, { onDelete: 'restrict', onUpdate: 'restrict' }),
});

// ──────────────────────────────────────────────────────
// Existing: Checklist Items
// ──────────────────────────────────────────────────────

export const checklistItems = sqliteTable('checklist_items', {
  id: text('id').primaryKey(),
  articleId: text('articleId').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  completed: integer('completed').notNull(), // 0 ou 1
  category: text('category'),
});

// ──────────────────────────────────────────────────────
// Existing: History Entries
// ──────────────────────────────────────────────────────

export const historyEntries = sqliteTable('history_entries', {
  id: text('id').primaryKey(),
  articleId: text('articleId').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  action: text('action').notNull(),
});

// ──────────────────────────────────────────────────────
// Existing: Governance Docs
// ──────────────────────────────────────────────────────

export const governanceDocs = sqliteTable('governance_docs', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // 'BRD' | 'PRD' | 'SDD' | 'TSD'
  title: text('title').notNull(),
  description: text('description'),
  lastUpdated: text('lastUpdated').notNull(),
  content: text('content').notNull(),
});

// ──────────────────────────────────────────────────────
// Existing: Gamification Badges
// ──────────────────────────────────────────────────────

export const gamificationBadges = sqliteTable('gamification_badges', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(),
  unlocked: integer('unlocked').notNull(), // 0 ou 1
  unlockedAt: text('unlockedAt'),
});

// ──────────────────────────────────────────────────────
// Type exports
// ──────────────────────────────────────────────────────

export type DbArticle = typeof articles.$inferSelect;
export type DbNewArticle = typeof articles.$inferInsert;
export type DbChecklistItem = typeof checklistItems.$inferSelect;
export type DbHistoryEntry = typeof historyEntries.$inferSelect;
export type DbGovernanceDoc = typeof governanceDocs.$inferSelect;
export type DbWorkflowStage = typeof workflowStages.$inferSelect;
export type DbCategory = typeof categories.$inferSelect;
export type DbChecklistTemplate = typeof checklistTemplates.$inferSelect;
