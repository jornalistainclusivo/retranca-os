import Database from '@tauri-apps/plugin-sql';
import { phase64AtomicSql } from './phase64AtomicSql';

export function getSafeBackupPath(mainDbPath: string, timestamp: number = Date.now()): string {
  const dbPathParts = mainDbPath.split(/[/\\]/);
  const dbName = dbPathParts.pop();
  if (!dbName) {
    throw new Error('ERR_MIGRATION_FAILED: Invalid database path');
  }
  const backupName = `retranca-phase64-backup-${timestamp}-${dbName}`;
  return mainDbPath.slice(0, mainDbPath.length - dbName.length) + backupName;
}

export function detectPhase64PartialSchema(
  tables: { name: string }[],
  columns: { name: string }[],
  indexes: { name: string }[]
): boolean {
  const tableNames = tables.map(t => t.name);
  const colNames = columns.map(c => c.name);
  const idxNames = indexes.map(i => i.name);

  const hasNewTables =
    tableNames.includes('workflow_stages') ||
    tableNames.includes('categories') ||
    tableNames.includes('checklist_templates');

  const hasNewColumns =
    colNames.includes('workflow_stage_id') ||
    colNames.includes('category_id');

  const hasNewIndexes =
    idxNames.includes('idx_workflow_stages_active_name') ||
    idxNames.includes('idx_workflow_stages_publication') ||
    idxNames.includes('idx_categories_active_name') ||
    idxNames.includes('idx_checklist_templates_name');

  return hasNewTables || hasNewColumns || hasNewIndexes;
}

export const runPhase64Migration = async (sqlite: Database) => {
  const res = await sqlite.select<{ user_version: number }[]>('PRAGMA user_version;');
  const currentVersion = res[0]?.user_version;
  
  if (currentVersion === 1) {
    return;
  } else if (currentVersion !== 0) {
    throw new Error(`ERR_MIGRATION_FAILED: Unsupported user_version ${currentVersion}`);
  }

  const tables = await sqlite.select<{ name: string }[]>(`SELECT name FROM sqlite_master WHERE type='table';`);
  const tableNames = tables.map(t => t.name);
  if (!tableNames.includes('articles') || !tableNames.includes('checklist_items')) {
    throw new Error('ERR_MIGRATION_FAILED: Expected legacy schemas not found');
  }

  const columns = await sqlite.select<{ name: string }[]>('PRAGMA table_info(articles);');
  const indexes = await sqlite.select<{ name: string }[]>(`SELECT name FROM sqlite_master WHERE type='index';`);

  if (detectPhase64PartialSchema(tables, columns, indexes)) {
    throw new Error('ERR_MIGRATION_FAILED: Phase 6.4 is already partially expanded');
  }

  const legacyStatuses = await sqlite.select<{ status: string }[]>('SELECT DISTINCT status FROM articles;');
  const allowedStatuses = ['ideia', 'pesquisa', 'escrita', 'revisao', 'publicado'];
  for (const s of legacyStatuses) {
    if (!allowedStatuses.includes(s.status)) {
      throw new Error(`ERR_MIGRATION_UNKNOWN_LEGACY_VALUE: Unknown status ${s.status}`);
    }
  }

  const legacyCategories = await sqlite.select<{ categoryTag: string }[]>('SELECT DISTINCT categoryTag FROM articles;');
  const allowedCategories = ['IA', 'Acessibilidade', 'Inclusão', 'SEO', 'Docs', 'Blog', 'Social', 'Linguagem Simples'];
  for (const c of legacyCategories) {
    if (!allowedCategories.includes(c.categoryTag)) {
      throw new Error(`ERR_MIGRATION_UNKNOWN_LEGACY_VALUE: Unknown categoryTag ${c.categoryTag}`);
    }
  }

  const dbList = await sqlite.select<{ file: string }[]>('PRAGMA database_list;');
  const mainDb = dbList.find((db: any) => db.name === 'main')?.file;
  if (!mainDb) {
    throw new Error('ERR_MIGRATION_FAILED: Cannot resolve main database file');
  }
  
  const backupPath = getSafeBackupPath(mainDb);
  const safeBackupPath = backupPath.replace(/'/g, "''");
  
  try {
    await sqlite.execute(`VACUUM INTO '${safeBackupPath}';`);
    console.log(`Phase 6.4 pre-migration backup created.`);
  } catch (err) {
    throw new Error(`ERR_MIGRATION_FAILED: VACUUM INTO failed - ${err}`);
  }

  const atomicScript = phase64AtomicSql;

  try {
    await sqlite.execute(atomicScript);
  } catch (err: any) {
    if (err.message?.includes('ERR_MIGRATION_UNKNOWN_LEGACY_VALUE')) {
      throw new Error(`ERR_MIGRATION_UNKNOWN_LEGACY_VALUE`);
    } else if (err.message?.includes('ERR_MIGRATION_FAILED')) {
      throw new Error(`ERR_MIGRATION_FAILED: ${err.message}`);
    }
    throw new Error(`ERR_MIGRATION_FAILED: ${err}`);
  }
};
