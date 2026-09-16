import Database from '@tauri-apps/plugin-sql';
import { phase64AtomicSql } from './phase64AtomicSql';
import { STANDARD_WORKFLOW_IDS, STANDARD_CATEGORY_IDS } from './phase64StandardIds';

export const runPhase64Migration = async (sqlite: Database) => {
  // Check DB connection and version
  const res = await sqlite.select<{ user_version: number }[]>('PRAGMA user_version;');
  const currentVersion = res[0]?.user_version;
  
  if (currentVersion === 1) {
    return; // Already migrated
  } else if (currentVersion !== 0) {
    throw new Error(`ERR_MIGRATION_FAILED: Unsupported user_version ${currentVersion}`);
  }

  // Preconditions BEFORE backup
  const tables = await sqlite.select<{ name: string }[]>(`SELECT name FROM sqlite_master WHERE type='table' AND name IN ('articles', 'checklist_items', 'workflow_stages', 'categories', 'checklist_templates');`);
  const tableNames = tables.map(t => t.name);
  if (!tableNames.includes('articles') || !tableNames.includes('checklist_items')) {
    throw new Error('ERR_MIGRATION_FAILED: Expected legacy schemas not found');
  }
  if (tableNames.includes('workflow_stages') || tableNames.includes('categories') || tableNames.includes('checklist_templates')) {
    throw new Error('ERR_MIGRATION_FAILED: Phase 6.4 is already partially expanded');
  }



  // Validate legacy vocabulary before mutation
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

  // Backup gate
  const dbList = await sqlite.select<{ file: string }[]>('PRAGMA database_list;');
  const mainDb = dbList.find((db: any) => db.name === 'main')?.file;
  if (!mainDb) {
    throw new Error('ERR_MIGRATION_FAILED: Cannot resolve main database file');
  }
  
  // Create a unique sibling backup filename securely
  const dbPathParts = mainDb.split(/[/\\]/);
  const dbName = dbPathParts.pop();
  if (!dbName) {
    throw new Error('ERR_MIGRATION_FAILED: Invalid database path');
  }
  const backupName = `retranca-phase64-backup-${Date.now()}-${dbName}`;
  const backupPath = mainDb.slice(0, mainDb.length - dbName.length) + backupName;
  
  // Use sqlite string literal escaping
  const safeBackupPath = backupPath.replace(/'/g, "''");
  
  try {
    await sqlite.execute(`VACUUM INTO '${safeBackupPath}';`);
    console.log(`Pre-migration backup created: ${safeBackupPath}`);
  } catch (err) {
    throw new Error(`ERR_MIGRATION_FAILED: VACUUM INTO failed - ${err}`);
  }

  // Atomic migration body
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
