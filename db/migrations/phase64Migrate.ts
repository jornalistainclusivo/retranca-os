import Database from '@tauri-apps/plugin-sql';
import { phase64ExpandSQL } from './phase64Expand';

export const runPhase64Migration = async (sqlite: Database) => {
  // Check current version
  const res = await sqlite.select<{ user_version: number }[]>('PRAGMA user_version;');
  const currentVersion = res[0]?.user_version ?? 0;

  if (currentVersion >= 64) {
    return; // Already migrated
  }

  // 1. BACKUP GATE
  const backupName = `retranca-phase64-backup-${Date.now()}.db`;
  try {
    await sqlite.execute(`VACUUM INTO '${backupName}';`);
    console.log(`Pre-migration backup created: ${backupName}`);
  } catch (err) {
    console.error("Backup failed, aborting migration:", err);
    throw new Error(`Err_MigrationBackupFailed: ${err}`);
  }

  // Enforce foreign keys (required for EXPAND constraints and verification)
  await sqlite.execute('PRAGMA foreign_keys = ON;');

  // 2. EXPAND (Schema Mutation)
  await sqlite.execute(phase64ExpandSQL);

  // Run the safe migration transaction (Slice 2)
  await sqlite.execute('BEGIN TRANSACTION;');

  try {
    // 3. BACKFILL Categories
    await sqlite.execute(`
      INSERT INTO categories (id, name, origin, is_active)
      SELECT 
        lower(hex(randomblob(16))),
        categoryTag, 
        'standard', 
        1 
      FROM articles 
      WHERE categoryTag IS NOT NULL AND categoryTag != ''
      GROUP BY categoryTag;
    `);

    // BACKFILL Workflow Stages
    await sqlite.execute(`
      INSERT INTO workflow_stages (id, display_name, order_index, semantic_classification, lifecycle_role, is_active)
      VALUES 
        ('stage-ideia', 'Ideia', 0, 'IDEA', NULL, 1),
        ('stage-pesquisa', 'Pesquisa', 1, 'RESEARCH', NULL, 1),
        ('stage-escrita', 'Escrita', 2, 'DRAFTING', NULL, 1),
        ('stage-revisao', 'Revisão', 3, 'REVIEW', NULL, 1),
        ('stage-publicado', 'Publicado', 4, 'PUBLISHED', 'PUBLICATION', 1);
    `);

    // 4. MAPPING (Backfill existing articles)
    await sqlite.execute(`
      UPDATE articles 
      SET 
        category_id = (SELECT id FROM categories WHERE name = articles.categoryTag LIMIT 1),
        workflow_stage_id = (
          CASE articles.status 
            WHEN 'ideia' THEN 'stage-ideia'
            WHEN 'pesquisa' THEN 'stage-pesquisa'
            WHEN 'escrita' THEN 'stage-escrita'
            WHEN 'revisao' THEN 'stage-revisao'
            WHEN 'publicado' THEN 'stage-publicado'
            ELSE NULL 
          END
        );
    `);

    // 5. VERIFY
    // A. Check for any unknown values (where workflow_stage_id is NULL or category mapping failed)
    const unknownRows = await sqlite.select<{ id: string, status: string, categoryTag: string }[]>(`
      SELECT id, status, categoryTag 
      FROM articles 
      WHERE workflow_stage_id IS NULL OR (categoryTag != '' AND category_id IS NULL);
    `);
    
    if (unknownRows.length > 0) {
      throw new Error(`Err_MigrationUnknownLegacyValue: ${unknownRows.length} unknown articles found.`);
    }

    // B. Check exact active publication-role invariant
    const pubStages = await sqlite.select<{ count: number }[]>(`
      SELECT COUNT(*) as count FROM workflow_stages WHERE lifecycle_role = 'PUBLICATION' AND is_active = 1;
    `);
    if (pubStages[0].count !== 1) {
      throw new Error("Err_MigrationPublicationInvariantFailed: Exactly one active publication stage required.");
    }

    // 6. CUTOVER
    // Articles workflow_stage_id and category_id are now populated.
    // They remain nullable in SQLite to allow the EXPAND, but we enforce NOT NULL via Drizzle natively.
    // Ensure NO swallowing of errors!

    // Mark as migrated
    await sqlite.execute('PRAGMA user_version = 64;');

    await sqlite.execute('COMMIT;');
  } catch (error) {
    // FAIL CLOSED ONLY. SQLite transaction aborts.
    await sqlite.execute('ROLLBACK;');
    throw error;
  }
};
