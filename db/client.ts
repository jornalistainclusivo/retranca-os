import Database from '@tauri-apps/plugin-sql';
import { drizzle } from 'drizzle-orm/sqlite-proxy';

let dbInstance: any = null;

export const getDb = async () => {
  if (dbInstance) return dbInstance;
  
  // Inicialização assíncrona do plugin nativo Tauri
  const sqlite = await Database.load('sqlite:retranca.db');
  
  // Garantia de migração (DDL) na inicialização
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
  
  // Interceptador Drizzle -> Tauri
  dbInstance = drizzle(async (sql, params, method) => {
    try {
      if (method === 'run') {
        await sqlite.execute(sql, params);
        return { rows: [] };
      } else {
        const result: any[] = await sqlite.select(sql, params);
        if (method === 'values') {
            return { rows: result.map(Object.values) };
        }
        return { rows: result };
      }
    } catch (e: any) {
      console.error('SQL Execution Error:', e);
      return { rows: [] };
    }
  });

  return dbInstance;
};
