import Database from '@tauri-apps/plugin-sql';
import { drizzle } from 'drizzle-orm/sqlite-proxy';

let dbInstance: any = null;

export const getDb = async () => {
  if (dbInstance) return dbInstance;
  
  // Inicialização assíncrona do plugin nativo Tauri
  const sqlite = await Database.load('sqlite:retranca.db');
  
  // Garantia de migração (DDL) na inicialização — existing tables
  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, status TEXT NOT NULL,
      categoryTag TEXT NOT NULL, tags TEXT NOT NULL, publishDate TEXT NOT NULL,
      summary TEXT, objective TEXT, keyword TEXT, persona TEXT, cta TEXT,
      internalLinks TEXT, externalLinks TEXT, estimatedTime TEXT, spentTime TEXT,
      notes TEXT, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, completedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS checklist_items (
      id TEXT PRIMARY KEY, articleId TEXT NOT NULL, label TEXT NOT NULL,
      completed INTEGER NOT NULL, category TEXT,
      FOREIGN KEY(articleId) REFERENCES articles(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS history_entries (
      id TEXT PRIMARY KEY, articleId TEXT NOT NULL, date TEXT NOT NULL,
      action TEXT NOT NULL,
      FOREIGN KEY(articleId) REFERENCES articles(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS governance_docs (
      id TEXT PRIMARY KEY, type TEXT NOT NULL, title TEXT NOT NULL,
      description TEXT, lastUpdated TEXT NOT NULL, content TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS gamification_badges (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL,
      icon TEXT NOT NULL, unlocked INTEGER NOT NULL, unlockedAt TEXT
    );
  `);

  // Phase 6.4 EXPAND: Dynamic workflow, categories, checklist templates
  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS workflow_stages (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL COLLATE NOCASE,
      order_index INTEGER NOT NULL CHECK (order_index >= 0),
      semantic_classification TEXT CHECK(semantic_classification IS NULL OR semantic_classification IN ('IDEA', 'RESEARCH', 'DRAFTING', 'REVIEW', 'PUBLISHED')),
      lifecycle_role TEXT CHECK (lifecycle_role IS NULL OR lifecycle_role = 'PUBLICATION'),
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_stages_active_name ON workflow_stages(display_name) WHERE is_active = 1;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_stages_publication ON workflow_stages(lifecycle_role) WHERE lifecycle_role = 'PUBLICATION' AND is_active = 1;

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL COLLATE NOCASE,
      origin TEXT NOT NULL CHECK(origin IN ('standard', 'custom')),
      is_active BOOLEAN NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_active_name ON categories(name) WHERE is_active = 1;

    CREATE TABLE IF NOT EXISTS checklist_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL COLLATE NOCASE,
      items_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_checklist_templates_name ON checklist_templates(name);
  `);

  // Phase 6.4 EXPAND: Add nullable workflow_stage_id and category_id to articles
  // ALTER TABLE ADD COLUMN errors if column already exists; try/catch makes this idempotent
  try {
    await sqlite.execute(`ALTER TABLE articles ADD COLUMN workflow_stage_id TEXT`);
  } catch {
    // Column already exists — idempotent
  }
  try {
    await sqlite.execute(`ALTER TABLE articles ADD COLUMN category_id TEXT`);
  } catch {
    // Column already exists — idempotent
  }
  
  // Interceptador Drizzle -> Tauri
  dbInstance = drizzle(async (sql, params, method) => {
    try {
      if (method === 'run') {
        await sqlite.execute(sql, params);
        return { rows: [] };
      } else {
        const result: any[] = await sqlite.select(sql, params);
        // O Tauri sqlite.select retorna um array de objetos.
        // O Drizzle sqlite-proxy SEMPRE espera um array de arrays para consultas de leitura.
        const mappedRows = result.map(row => Object.values(row));
        return { rows: mappedRows };
      }
    } catch (e: any) {
      console.error('SQL Execution Error:', e);
      return { rows: [] };
    }
  });

  return dbInstance;
};
