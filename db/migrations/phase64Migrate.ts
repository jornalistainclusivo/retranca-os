import Database from '@tauri-apps/plugin-sql';
import { phase64ExpandSQL } from './phase64Expand';
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
  const tables = await sqlite.select<{ name: string }[]>(`SELECT name FROM sqlite_master WHERE type='table' AND name IN ('articles', 'checklist_items', 'workflow_stages');`);
  const tableNames = tables.map(t => t.name);
  if (!tableNames.includes('articles') || !tableNames.includes('checklist_items')) {
    throw new Error('ERR_MIGRATION_FAILED: Expected legacy schemas not found');
  }
  if (tableNames.includes('workflow_stages')) {
    throw new Error('ERR_MIGRATION_FAILED: Phase 6.4 is already partially expanded');
  }

  // Check foreign_keys pragma
  await sqlite.execute('PRAGMA foreign_keys = ON;');
  const fkRes = await sqlite.select<{ foreign_keys: number }[]>(`PRAGMA foreign_keys;`);
  if (!fkRes[0] || fkRes[0].foreign_keys !== 1) {
    throw new Error('ERR_MIGRATION_FAILED: Foreign keys cannot be enabled');
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
  
  // Create a unique sibling backup filename
  const dbPathParts = mainDb.split(/[/\\]/);
  const dbName = dbPathParts.pop();
  const backupName = `retranca-phase64-backup-${Date.now()}-${dbName}`;
  const backupPath = mainDb.replace(dbName as string, backupName);
  
  // Use sqlite string literal escaping
  const safeBackupPath = backupPath.replace(/'/g, "''");
  
  try {
    await sqlite.execute(`VACUUM INTO '${safeBackupPath}';`);
    console.log(`Pre-migration backup created: ${safeBackupPath}`);
  } catch (err) {
    throw new Error(`ERR_MIGRATION_FAILED: VACUUM INTO failed - ${err}`);
  }

  // Atomic migration body
  const atomicScript = `
BEGIN TRANSACTION;

${phase64ExpandSQL}

-- SEED WORKFLOW STAGES
INSERT INTO workflow_stages (id, display_name, order_index, semantic_classification, lifecycle_role, is_active) VALUES 
('${STANDARD_WORKFLOW_IDS.IDEIA}', 'Ideia', 0, 'IDEA', NULL, 1),
('${STANDARD_WORKFLOW_IDS.PESQUISA}', 'Pesquisa', 1, 'RESEARCH', NULL, 1),
('${STANDARD_WORKFLOW_IDS.PRODUCAO}', 'Produção', 2, 'DRAFTING', NULL, 1),
('${STANDARD_WORKFLOW_IDS.REVISAO}', 'Revisão', 3, 'REVIEW', NULL, 1),
('${STANDARD_WORKFLOW_IDS.PUBLICADO}', 'Publicado', 4, 'PUBLISHED', 'PUBLICATION', 1);

-- SEED CATEGORIES
INSERT INTO categories (id, name, origin, is_active) VALUES 
('${STANDARD_CATEGORY_IDS.IA}', 'IA', 'standard', 1),
('${STANDARD_CATEGORY_IDS.ACESSIBILIDADE}', 'Acessibilidade', 'standard', 1),
('${STANDARD_CATEGORY_IDS.INCLUSAO}', 'Inclusão', 'standard', 1),
('${STANDARD_CATEGORY_IDS.SEO}', 'SEO', 'standard', 1),
('${STANDARD_CATEGORY_IDS.DOCS}', 'Docs', 'standard', 1),
('${STANDARD_CATEGORY_IDS.BLOG}', 'Blog', 'standard', 1),
('${STANDARD_CATEGORY_IDS.SOCIAL}', 'Social', 'standard', 1),
('${STANDARD_CATEGORY_IDS.LINGUAGEM_SIMPLES}', 'Linguagem Simples', 'standard', 1);

-- MAP ARTICLES
UPDATE articles SET
  workflow_stage_id = CASE status
    WHEN 'ideia' THEN '${STANDARD_WORKFLOW_IDS.IDEIA}'
    WHEN 'pesquisa' THEN '${STANDARD_WORKFLOW_IDS.PESQUISA}'
    WHEN 'escrita' THEN '${STANDARD_WORKFLOW_IDS.PRODUCAO}'
    WHEN 'revisao' THEN '${STANDARD_WORKFLOW_IDS.REVISAO}'
    WHEN 'publicado' THEN '${STANDARD_WORKFLOW_IDS.PUBLICADO}'
  END,
  category_id = CASE categoryTag
    WHEN 'IA' THEN '${STANDARD_CATEGORY_IDS.IA}'
    WHEN 'Acessibilidade' THEN '${STANDARD_CATEGORY_IDS.ACESSIBILIDADE}'
    WHEN 'Inclusão' THEN '${STANDARD_CATEGORY_IDS.INCLUSAO}'
    WHEN 'SEO' THEN '${STANDARD_CATEGORY_IDS.SEO}'
    WHEN 'Docs' THEN '${STANDARD_CATEGORY_IDS.DOCS}'
    WHEN 'Blog' THEN '${STANDARD_CATEGORY_IDS.BLOG}'
    WHEN 'Social' THEN '${STANDARD_CATEGORY_IDS.SOCIAL}'
    WHEN 'Linguagem Simples' THEN '${STANDARD_CATEGORY_IDS.LINGUAGEM_SIMPLES}'
  END;

-- VERIFY GUARDS BEFORE COMMIT
CREATE TEMP TABLE _migration_guards (id INTEGER PRIMARY KEY);
CREATE TEMP TRIGGER trg_verify_migration BEFORE INSERT ON _migration_guards BEGIN
  -- Check exact standard stages exist (5)
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Invalid number of workflow stages')
  WHERE (SELECT COUNT(*) FROM workflow_stages) != 5;

  -- Check exact standard categories exist (8)
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Invalid number of categories')
  WHERE (SELECT COUNT(*) FROM categories) != 8;

  -- Check exactly one active PUBLICATION role
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Exactly one active publication stage is required')
  WHERE (SELECT COUNT(*) FROM workflow_stages WHERE lifecycle_role = 'PUBLICATION' AND is_active = 1) != 1;

  -- Check Publicado semantic is PUBLISHED and role is PUBLICATION
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Publicado invariants failed')
  WHERE (SELECT COUNT(*) FROM workflow_stages WHERE id = '${STANDARD_WORKFLOW_IDS.PUBLICADO}' AND semantic_classification = 'PUBLISHED' AND lifecycle_role = 'PUBLICATION') != 1;

  -- Verify all mapping completed (no nulls)
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_UNKNOWN_LEGACY_VALUE')
  WHERE (SELECT COUNT(*) FROM articles WHERE workflow_stage_id IS NULL OR category_id IS NULL) > 0;
END;

INSERT INTO _migration_guards(id) VALUES(1);
DROP TRIGGER trg_verify_migration;
DROP TABLE _migration_guards;

PRAGMA user_version = 1;
COMMIT;
`;

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
