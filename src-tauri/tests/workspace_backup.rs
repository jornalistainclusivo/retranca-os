use app_lib::article_content::migrate_article_content_pool;
use app_lib::workspace_backup::{
    create_workspace_backup_pool, recover_workspace_backup_to_disposable,
    verify_disposable_workspace_recovery, verify_workspace_backup,
};
use serde_json::Value;
use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions};
use sqlx::{Connection, Row, SqliteConnection, SqlitePool};
use std::collections::BTreeMap;
use std::path::Path;

const APP: &str = "com.jornalistainclusivo.retranca.fixtures";
const TABLES: [&str; 8] = [
    "articles",
    "categories",
    "checklist_items",
    "checklist_templates",
    "gamification_badges",
    "governance_docs",
    "history_entries",
    "workflow_stages",
];

fn run_async<F: std::future::Future>(future: F) -> F::Output {
    tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(future)
}

async fn setup(path: &Path) -> SqlitePool {
    let pool = SqlitePoolOptions::new()
        .max_connections(3)
        .connect_with(
            SqliteConnectOptions::new()
                .filename(path)
                .create_if_missing(true)
                .journal_mode(SqliteJournalMode::Wal)
                .foreign_keys(true),
        )
        .await
        .unwrap();
    // Extract only checked-in literal SQL into this disposable database.
    // No JavaScript, Tauri initialization, real database or user file is executed.
    let initial = include_str!("../../db/client.ts")
        .split_once("await sqlite.execute(\x60")
        .unwrap()
        .1
        .split_once("\x60);")
        .unwrap()
        .0;
    let workflow = include_str!("../../db/migrations/phase64AtomicSql.ts")
        .split_once("= \x60")
        .unwrap()
        .1
        .split_once("\x60;")
        .unwrap()
        .0;
    sqlx::raw_sql(initial).execute(&pool).await.unwrap();
    sqlx::raw_sql(workflow).execute(&pool).await.unwrap();
    migrate_article_content_pool(&pool).await.unwrap();
    sqlx::raw_sql(
        "INSERT INTO workflow_stages (id, display_name, order_index, is_active)
             VALUES ('synthetic-inactive-stage', 'Etapa inativa', 100, 0);
         INSERT INTO categories (id, name, origin, is_active)
             VALUES ('synthetic-inactive-category', 'Categoria inativa', 'custom', 0);
         INSERT INTO checklist_templates (id, name, items_json)
             VALUES ('synthetic-template', 'Checklist de revisão', '[{\"label\":\"Síntese\"}]');
         INSERT INTO governance_docs (id, type, title, lastUpdated, content)
             VALUES ('synthetic-doc', 'BRD', 'Documento sintético', '2026-10-09', 'Conteúdo sem dados reais');
         INSERT INTO gamification_badges (id, title, description, icon, unlocked, unlockedAt)
             VALUES ('synthetic-badge', 'Marco sintético', 'Registro persistido', 'star', 1, '2026-10-09');
         INSERT INTO articles (id, title, status, categoryTag, tags, publishDate, summary, analysisContent,
             createdAt, updatedAt, workflow_stage_id, category_id)
             VALUES ('synthetic-a', 'Pauta A — inclusão', 'ideia', 'Categoria inativa', '[\"teste\"]',
             '2026-10-09', NULL, 'Linha um
Linha dois — ação', '2026-10-09T10:00:00Z', '2026-10-09T11:00:00Z',
             (SELECT id FROM workflow_stages WHERE lifecycle_role IS NULL AND is_active = 1 ORDER BY order_index LIMIT 1),
             'synthetic-inactive-category');
         INSERT INTO articles (id, title, status, categoryTag, tags, publishDate, analysisContent,
             createdAt, updatedAt, workflow_stage_id, category_id)
             VALUES ('synthetic-b', 'Pauta B', 'ideia', 'IA', '[]', '2026-10-10', '',
             '2026-10-09T10:00:00Z', '2026-10-09T10:00:00Z', 'synthetic-inactive-stage',
             (SELECT id FROM categories WHERE is_active = 1 ORDER BY id LIMIT 1));
         INSERT INTO checklist_items (id, articleId, label, completed)
             VALUES ('synthetic-check', 'synthetic-a', 'Checar atribuição', 1);
         INSERT INTO history_entries (id, articleId, date, action)
             VALUES ('synthetic-history', 'synthetic-a', '2026-10-09T11:00:00Z', 'Histórico preservado');",
    ).execute(&pool).await.unwrap();
    pool
}

async fn logical_contents(connection: &mut SqliteConnection) -> BTreeMap<String, Value> {
    let mut contents = BTreeMap::new();
    for table in TABLES {
        let columns = sqlx::query(&format!("PRAGMA table_info('{table}')"))
            .fetch_all(&mut *connection)
            .await
            .unwrap();
        let fields = columns
            .iter()
            .map(|column| {
                let name: String = column.get("name");
                format!("'{name}', \"{name}\"")
            })
            .collect::<Vec<_>>()
            .join(", ");
        let json: String = sqlx::query_scalar(&format!(
            "SELECT json_group_array(json_object({fields})) FROM (SELECT * FROM {table} ORDER BY id)"
        )).fetch_one(&mut *connection).await.unwrap();
        contents.insert(table.into(), serde_json::from_str(&json).unwrap());
    }
    contents
}

#[test]
fn snapshot_preserves_all_eight_tables_schema_and_inactive_references() {
    run_async(async {
        let temporary = tempfile::tempdir().unwrap();
        let pool = setup(&temporary.path().join("synthetic.db")).await;
        let root = temporary.path().join("backups");
        std::fs::create_dir(&root).unwrap();
        let before = logical_contents(&mut pool.acquire().await.unwrap()).await;
        let artifact = create_workspace_backup_pool(&pool, &root, APP)
            .await
            .unwrap();
        assert_eq!(artifact.receipt.table_counts.len(), 8);
        assert!(artifact
            .receipt
            .table_counts
            .values()
            .all(|count| *count > 0));
        assert_eq!(artifact.receipt.database_schema_version, 2);
        assert!(!artifact.receipt.sqlite_version.is_empty());
        println!("linked SQLite: {}", artifact.receipt.sqlite_version);
        let receipt = verify_workspace_backup(&artifact.directory, APP)
            .await
            .unwrap();
        assert_eq!(receipt, artifact.receipt);
        let mut copy = SqliteConnection::connect_with(
            &SqliteConnectOptions::new()
                .filename(artifact.directory.join("workspace.sqlite3"))
                .read_only(true),
        )
        .await
        .unwrap();
        assert_eq!(logical_contents(&mut copy).await, before);
        let indexes: Vec<String> = sqlx::query_scalar(
            "SELECT name FROM sqlite_schema WHERE type = 'index' AND name NOT GLOB 'sqlite_*' ORDER BY name",
        ).fetch_all(&mut copy).await.unwrap();
        let source_indexes: Vec<String> = sqlx::query_scalar(
            "SELECT name FROM sqlite_schema WHERE type = 'index' AND name NOT GLOB 'sqlite_*' ORDER BY name",
        ).fetch_all(&pool).await.unwrap();
        assert_eq!(indexes, source_indexes);
        let copy_schema: Vec<(String, String, String, Option<String>)> = sqlx::query_as(
            "SELECT type, name, tbl_name, sql FROM sqlite_schema ORDER BY type, name",
        )
        .fetch_all(&mut copy)
        .await
        .unwrap();
        let source_schema: Vec<(String, String, String, Option<String>)> = sqlx::query_as(
            "SELECT type, name, tbl_name, sql FROM sqlite_schema ORDER BY type, name",
        )
        .fetch_all(&pool)
        .await
        .unwrap();
        assert_eq!(copy_schema, source_schema);
        assert_eq!(
            logical_contents(&mut pool.acquire().await.unwrap()).await,
            before
        );
        sqlx::query(
            "UPDATE articles SET analysisContent = 'Alteração posterior' WHERE id = 'synthetic-a'",
        )
        .execute(&pool)
        .await
        .unwrap();
        assert_eq!(logical_contents(&mut copy).await, before);
        copy.close().await.unwrap();
        pool.close().await;
    });
}

#[test]
fn snapshot_includes_committed_wal_rows_while_an_older_reader_is_open() {
    run_async(async {
        let temporary = tempfile::tempdir().unwrap();
        let pool = setup(&temporary.path().join("synthetic-wal.db")).await;
        let mut reader = pool.begin().await.unwrap();
        sqlx::query("SELECT id FROM articles")
            .fetch_all(&mut *reader)
            .await
            .unwrap();
        sqlx::query("UPDATE articles SET analysisContent = 'Commit no WAL — síntese' WHERE id = 'synthetic-a'")
            .execute(&pool).await.unwrap();
        assert!(temporary.path().join("synthetic-wal.db-wal").exists());
        let root = temporary.path().join("backups");
        std::fs::create_dir(&root).unwrap();
        let artifact = create_workspace_backup_pool(&pool, &root, APP)
            .await
            .unwrap();
        let mut copy = SqliteConnection::connect_with(
            &SqliteConnectOptions::new()
                .filename(artifact.directory.join("workspace.sqlite3"))
                .read_only(true),
        )
        .await
        .unwrap();
        let text: String =
            sqlx::query_scalar("SELECT analysisContent FROM articles WHERE id = 'synthetic-a'")
                .fetch_one(&mut copy)
                .await
                .unwrap();
        assert_eq!(text, "Commit no WAL — síntese");
        verify_workspace_backup(&artifact.directory, APP)
            .await
            .unwrap();
        copy.close().await.unwrap();
        reader.rollback().await.unwrap();
        pool.close().await;
    });
}

#[test]
fn repeated_backups_are_independent_and_do_not_overwrite_earlier_copies() {
    run_async(async {
        let temporary = tempfile::tempdir().unwrap();
        let pool = setup(&temporary.path().join("synthetic-repeat.db")).await;
        let root = temporary.path().join("backups");
        std::fs::create_dir(&root).unwrap();
        let first = create_workspace_backup_pool(&pool, &root, APP)
            .await
            .unwrap();
        let first_bytes = std::fs::read(first.directory.join("workspace.sqlite3")).unwrap();
        sqlx::query("UPDATE articles SET analysisContent = 'Nova versão' WHERE id = 'synthetic-a'")
            .execute(&pool)
            .await
            .unwrap();
        let second = create_workspace_backup_pool(&pool, &root, APP)
            .await
            .unwrap();
        assert_ne!(first.directory, second.directory);
        assert_eq!(
            std::fs::read(first.directory.join("workspace.sqlite3")).unwrap(),
            first_bytes
        );
        assert_ne!(
            first.receipt.database_sha256,
            second.receipt.database_sha256
        );
        verify_workspace_backup(&first.directory, APP)
            .await
            .unwrap();
        verify_workspace_backup(&second.directory, APP)
            .await
            .unwrap();
        pool.close().await;
    });
}

#[test]
fn unsupported_or_partial_schemas_fail_before_creating_a_backup() {
    run_async(async {
        for statement in [
            "PRAGMA user_version = 3",
            "DROP TABLE governance_docs",
            "CREATE TABLE sqliteXcustom (id TEXT PRIMARY KEY)",
        ] {
            let temporary = tempfile::tempdir().unwrap();
            let pool = setup(&temporary.path().join("synthetic-schema.db")).await;
            sqlx::query(statement).execute(&pool).await.unwrap();
            let original: String =
                sqlx::query_scalar("SELECT analysisContent FROM articles WHERE id = 'synthetic-a'")
                    .fetch_one(&pool)
                    .await
                    .unwrap();
            let root = temporary.path().join("backups");
            std::fs::create_dir(&root).unwrap();
            assert!(create_workspace_backup_pool(&pool, &root, APP)
                .await
                .is_err());
            assert_eq!(std::fs::read_dir(&root).unwrap().count(), 0);
            let retained: String =
                sqlx::query_scalar("SELECT analysisContent FROM articles WHERE id = 'synthetic-a'")
                    .fetch_one(&pool)
                    .await
                    .unwrap();
            assert_eq!(retained, original);
            pool.close().await;
        }
    });
}

#[test]
fn invalid_destinations_and_application_ids_preserve_source_and_existing_files() {
    run_async(async {
        let temporary = tempfile::tempdir().unwrap();
        let pool = setup(&temporary.path().join("synthetic-destination.db")).await;
        let occupied = temporary.path().join("occupied");
        std::fs::write(&occupied, b"Existing file").unwrap();
        assert!(create_workspace_backup_pool(&pool, &occupied, APP)
            .await
            .is_err());
        assert_eq!(std::fs::read(&occupied).unwrap(), b"Existing file");
        assert!(
            create_workspace_backup_pool(&pool, Path::new("relative"), APP)
                .await
                .is_err()
        );
        assert!(
            create_workspace_backup_pool(&pool, temporary.path(), "other.app")
                .await
                .is_err()
        );
        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM articles")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(count, 2);
        pool.close().await;
    });
}

#[test]
fn verification_rejects_wrong_origin_receipt_tampering_and_changed_copy_bytes() {
    run_async(async {
        let temporary = tempfile::tempdir().unwrap();
        let pool = setup(&temporary.path().join("synthetic-verification.db")).await;
        let root = temporary.path().join("backups");
        std::fs::create_dir(&root).unwrap();
        let artifact = create_workspace_backup_pool(&pool, &root, APP)
            .await
            .unwrap();
        assert!(verify_workspace_backup(
            &artifact.directory,
            "com.jornalistainclusivo.retranca.pilot"
        )
        .await
        .is_err());
        let receipt_path = artifact.directory.join("receipt.json");
        let mut altered = artifact.receipt.clone();
        altered.table_counts.insert("articles".into(), 500);
        std::fs::write(&receipt_path, serde_json::to_vec(&altered).unwrap()).unwrap();
        assert!(verify_workspace_backup(&artifact.directory, APP)
            .await
            .is_err());
        altered = artifact.receipt.clone();
        altered.format_version = 2;
        std::fs::write(&receipt_path, serde_json::to_vec(&altered).unwrap()).unwrap();
        assert!(verify_workspace_backup(&artifact.directory, APP)
            .await
            .is_err());
        std::fs::write(
            &receipt_path,
            serde_json::to_vec(&artifact.receipt).unwrap(),
        )
        .unwrap();
        verify_workspace_backup(&artifact.directory, APP)
            .await
            .unwrap();
        let database_path = artifact.directory.join("workspace.sqlite3");
        let mut bytes = std::fs::read(&database_path).unwrap();
        let position = bytes.len() - 1;
        bytes[position] ^= 1;
        std::fs::write(database_path, bytes).unwrap();
        assert!(verify_workspace_backup(&artifact.directory, APP)
            .await
            .is_err());
        pool.close().await;
    });
}

#[test]
fn incomplete_or_oversized_receipts_are_not_reported_as_complete() {
    run_async(async {
        let temporary = tempfile::tempdir().unwrap();
        let pool = setup(&temporary.path().join("synthetic-incomplete.db")).await;
        let root = temporary.path().join("backups");
        std::fs::create_dir(&root).unwrap();
        let artifact = create_workspace_backup_pool(&pool, &root, APP)
            .await
            .unwrap();
        let receipt_path = artifact.directory.join("receipt.json");
        assert!(receipt_path.starts_with(temporary.path()));
        std::fs::rename(&receipt_path, artifact.directory.join("receipt.pending")).unwrap();
        assert!(verify_workspace_backup(&artifact.directory, APP)
            .await
            .is_err());
        assert!(artifact.directory.join("workspace.sqlite3").exists());
        std::fs::write(&receipt_path, vec![b' '; 16 * 1024 + 1]).unwrap();
        assert!(verify_workspace_backup(&artifact.directory, APP)
            .await
            .is_err());
        pool.close().await;
    });
}

#[test]
fn snapshot_preserves_an_initialized_workspace_without_articles() {
    run_async(async {
        let temporary = tempfile::tempdir().unwrap();
        let pool = setup(&temporary.path().join("synthetic-empty.db")).await;
        sqlx::raw_sql(
            "DELETE FROM checklist_items; DELETE FROM history_entries; DELETE FROM articles;
             DELETE FROM checklist_templates; DELETE FROM governance_docs; DELETE FROM gamification_badges;",
        ).execute(&pool).await.unwrap();
        let root = temporary.path().join("backups");
        std::fs::create_dir(&root).unwrap();
        let before = logical_contents(&mut pool.acquire().await.unwrap()).await;
        let artifact = create_workspace_backup_pool(&pool, &root, APP)
            .await
            .unwrap();
        for table in [
            "articles",
            "checklist_items",
            "history_entries",
            "checklist_templates",
            "governance_docs",
            "gamification_badges",
        ] {
            assert_eq!(artifact.receipt.table_counts[table], 0);
        }
        assert!(artifact.receipt.table_counts["workflow_stages"] > 0);
        assert!(artifact.receipt.table_counts["categories"] > 0);
        let mut copy = SqliteConnection::connect_with(
            &SqliteConnectOptions::new()
                .filename(artifact.directory.join("workspace.sqlite3"))
                .read_only(true),
        )
        .await
        .unwrap();
        assert_eq!(logical_contents(&mut copy).await, before);
        verify_workspace_backup(&artifact.directory, APP)
            .await
            .unwrap();
        copy.close().await.unwrap();
        pool.close().await;
    });
}

#[test]
fn disabled_synchronization_fails_without_creating_a_complete_or_partial_copy() {
    run_async(async {
        let temporary = tempfile::tempdir().unwrap();
        let pool = setup(&temporary.path().join("synthetic-sync.db")).await;
        let mut connections = Vec::new();
        for _ in 0..3 {
            let mut connection = pool.acquire().await.unwrap();
            sqlx::query("PRAGMA synchronous = OFF")
                .execute(&mut *connection)
                .await
                .unwrap();
            connections.push(connection);
        }
        drop(connections);
        let root = temporary.path().join("backups");
        std::fs::create_dir(&root).unwrap();
        let error = create_workspace_backup_pool(&pool, &root, APP)
            .await
            .unwrap_err();
        assert_eq!(error.details["stage"], "synchronous");
        assert_eq!(std::fs::read_dir(&root).unwrap().count(), 0);
        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM articles")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(count, 2);
        pool.close().await;
    });
}

// Synthetic test budget only; this is not a product default or public file limit.
const RECOVERY_TEST_BUDGET: u64 = 16 * 1024 * 1024;

#[test]
fn disposable_recovery_preserves_the_snapshot_and_never_replaces_the_source() {
    run_async(async {
        let temporary = tempfile::tempdir().unwrap();
        let pool = setup(&temporary.path().join("synthetic-recovery.db")).await;
        let backups = temporary.path().join("backups");
        let recoveries = temporary.path().join("recoveries");
        std::fs::create_dir(&backups).unwrap();
        std::fs::create_dir(&recoveries).unwrap();
        // Preserve an unresolved legacy reference instead of silently normalizing it.
        let mut source = pool.acquire().await.unwrap();
        sqlx::query("PRAGMA foreign_keys = OFF")
            .execute(&mut *source)
            .await
            .unwrap();
        sqlx::query("UPDATE articles SET category_id = 'synthetic-unresolved-category' WHERE id = 'synthetic-b'")
            .execute(&mut *source).await.unwrap();
        sqlx::query("PRAGMA foreign_keys = ON")
            .execute(&mut *source)
            .await
            .unwrap();
        drop(source);
        let expected = logical_contents(&mut pool.acquire().await.unwrap()).await;
        let backup = create_workspace_backup_pool(&pool, &backups, APP)
            .await
            .unwrap();
        let backup_bytes = std::fs::read(backup.directory.join("workspace.sqlite3")).unwrap();
        let backup_receipt = std::fs::read(backup.directory.join("receipt.json")).unwrap();
        sqlx::query("UPDATE articles SET analysisContent = 'Latest source — keep this' WHERE id = 'synthetic-a'")
            .execute(&pool).await.unwrap();
        let current_source = logical_contents(&mut pool.acquire().await.unwrap()).await;
        assert_ne!(current_source, expected);

        let recovery = recover_workspace_backup_to_disposable(
            &backup.directory,
            &recoveries,
            APP,
            &pool,
            RECOVERY_TEST_BUDGET,
        )
        .await
        .unwrap();
        assert_eq!(recovery.receipt.source_backup, backup.receipt);
        assert_ne!(recovery.receipt.operation_id, backup.receipt.operation_id);
        assert_eq!(
            std::fs::read(recovery.directory.join("workspace.sqlite3")).unwrap(),
            backup_bytes
        );
        assert_eq!(
            verify_disposable_workspace_recovery(
                &recovery.directory,
                APP,
                &pool,
                RECOVERY_TEST_BUDGET,
            )
            .await
            .unwrap(),
            recovery.receipt
        );
        let mut recovered = SqliteConnection::connect_with(
            &SqliteConnectOptions::new()
                .filename(recovery.directory.join("workspace.sqlite3"))
                .create_if_missing(false),
        )
        .await
        .unwrap();
        assert_eq!(logical_contents(&mut recovered).await, expected);
        let schema: Vec<(String, String, String, Option<String>)> = sqlx::query_as(
            "SELECT type, name, tbl_name, sql FROM sqlite_schema ORDER BY type, name",
        )
        .fetch_all(&mut recovered)
        .await
        .unwrap();
        let reference_schema: Vec<(String, String, String, Option<String>)> = sqlx::query_as(
            "SELECT type, name, tbl_name, sql FROM sqlite_schema ORDER BY type, name",
        )
        .fetch_all(&pool)
        .await
        .unwrap();
        assert_eq!(schema, reference_schema);
        sqlx::query("UPDATE governance_docs SET content = 'Recovered copy only'")
            .execute(&mut recovered)
            .await
            .unwrap();
        recovered.close().await.unwrap();
        assert_eq!(
            logical_contents(&mut pool.acquire().await.unwrap()).await,
            current_source
        );
        assert_eq!(
            std::fs::read(backup.directory.join("workspace.sqlite3")).unwrap(),
            backup_bytes
        );
        assert_eq!(
            std::fs::read(backup.directory.join("receipt.json")).unwrap(),
            backup_receipt
        );
        verify_workspace_backup(&backup.directory, APP)
            .await
            .unwrap();
        assert!(verify_disposable_workspace_recovery(
            &recovery.directory,
            APP,
            &pool,
            RECOVERY_TEST_BUDGET,
        )
        .await
        .is_err());
        pool.close().await;
    });
}

#[test]
fn disposable_recovery_keeps_empty_collections_and_existing_configuration() {
    run_async(async {
        let temporary = tempfile::tempdir().unwrap();
        let pool = setup(&temporary.path().join("synthetic-empty-recovery.db")).await;
        sqlx::raw_sql("DELETE FROM checklist_items; DELETE FROM history_entries; DELETE FROM articles;
            DELETE FROM checklist_templates; DELETE FROM governance_docs; DELETE FROM gamification_badges;")
            .execute(&pool).await.unwrap();
        let before = logical_contents(&mut pool.acquire().await.unwrap()).await;
        let root = temporary.path().join("recoveries");
        std::fs::create_dir(&root).unwrap();
        let backup = create_workspace_backup_pool(&pool, temporary.path(), APP)
            .await
            .unwrap();
        let recovery = recover_workspace_backup_to_disposable(
            &backup.directory,
            &root,
            APP,
            &pool,
            RECOVERY_TEST_BUDGET,
        )
        .await
        .unwrap();
        let mut recovered = SqliteConnection::connect_with(
            &SqliteConnectOptions::new()
                .filename(recovery.directory.join("workspace.sqlite3"))
                .read_only(true)
                .create_if_missing(false),
        )
        .await
        .unwrap();
        assert_eq!(logical_contents(&mut recovered).await, before);
        assert_eq!(recovery.receipt.source_backup.table_counts["articles"], 0);
        assert!(recovery.receipt.source_backup.table_counts["categories"] > 0);
        recovered.close().await.unwrap();
        pool.close().await;
    });
}

#[test]
fn disposable_recovery_requires_matching_normal_pilot_or_fixture_origin() {
    run_async(async {
        let temporary = tempfile::tempdir().unwrap();
        let pool = setup(&temporary.path().join("synthetic-origin-recovery.db")).await;
        let root = temporary.path().join("recoveries");
        std::fs::create_dir(&root).unwrap();
        let applications = [
            "com.jornalistainclusivo.retranca",
            "com.jornalistainclusivo.retranca.pilot",
            APP,
        ];
        for app in applications {
            let backup = create_workspace_backup_pool(&pool, temporary.path(), app)
                .await
                .unwrap();
            let before = std::fs::read_dir(&root).unwrap().count();
            for mismatch in applications
                .into_iter()
                .filter(|other| *other != app)
                .chain(["other.app"])
            {
                assert!(recover_workspace_backup_to_disposable(
                    &backup.directory,
                    &root,
                    mismatch,
                    &pool,
                    RECOVERY_TEST_BUDGET,
                )
                .await
                .is_err());
                assert_eq!(std::fs::read_dir(&root).unwrap().count(), before);
            }
            let recovery = recover_workspace_backup_to_disposable(
                &backup.directory,
                &root,
                app,
                &pool,
                RECOVERY_TEST_BUDGET,
            )
            .await
            .unwrap();
            verify_disposable_workspace_recovery(
                &recovery.directory,
                app,
                &pool,
                RECOVERY_TEST_BUDGET,
            )
            .await
            .unwrap();
        }
        pool.close().await;
    });
}

#[test]
fn recovery_rejects_self_consistent_but_incompatible_columns_indexes_and_triggers() {
    run_async(async {
        for statement in [
            "ALTER TABLE articles DROP COLUMN summary",
            "ALTER TABLE articles ADD COLUMN unexpected TEXT",
            "DROP INDEX idx_categories_active_name",
            "CREATE TRIGGER unexpected AFTER INSERT ON governance_docs BEGIN SELECT 1; END",
        ] {
            let temporary = tempfile::tempdir().unwrap();
            let reference = setup(&temporary.path().join("synthetic-reference.db")).await;
            let candidate = setup(&temporary.path().join("synthetic-incompatible.db")).await;
            let retained = logical_contents(&mut reference.acquire().await.unwrap()).await;
            sqlx::query(statement).execute(&candidate).await.unwrap();
            let backup = create_workspace_backup_pool(&candidate, temporary.path(), APP)
                .await
                .unwrap();
            // Integrity and its own receipt do not establish app compatibility.
            verify_workspace_backup(&backup.directory, APP)
                .await
                .unwrap();
            let root = temporary.path().join("recoveries");
            std::fs::create_dir(&root).unwrap();
            let error = recover_workspace_backup_to_disposable(
                &backup.directory,
                &root,
                APP,
                &reference,
                RECOVERY_TEST_BUDGET,
            )
            .await
            .unwrap_err();
            assert_eq!(error.details["stage"], "recovery-schema");
            assert_eq!(std::fs::read_dir(&root).unwrap().count(), 0);
            assert_eq!(
                logical_contents(&mut reference.acquire().await.unwrap()).await,
                retained
            );
            candidate.close().await;
            reference.close().await;
        }
    });
}

#[test]
fn recovery_rejects_corrupt_unknown_or_incomplete_backups_before_creating_output() {
    run_async(async {
        use sha2::{Digest, Sha256};
        let temporary = tempfile::tempdir().unwrap();
        let pool = setup(&temporary.path().join("synthetic-invalid-backup.db")).await;
        let root = temporary.path().join("recoveries");
        std::fs::create_dir(&root).unwrap();
        let backup = create_workspace_backup_pool(&pool, temporary.path(), APP)
            .await
            .unwrap();
        let receipt_path = backup.directory.join("receipt.json");
        let database_path = backup.directory.join("workspace.sqlite3");
        let original = std::fs::read(&database_path).unwrap();
        for future_schema in [false, true] {
            let mut changed = backup.receipt.clone();
            if future_schema {
                changed.database_schema_version = 3;
            } else {
                changed.format_version = 2;
            }
            std::fs::write(&receipt_path, serde_json::to_vec(&changed).unwrap()).unwrap();
            assert!(recover_workspace_backup_to_disposable(
                &backup.directory,
                &root,
                APP,
                &pool,
                RECOVERY_TEST_BUDGET,
            )
            .await
            .is_err());
            assert_eq!(std::fs::read_dir(&root).unwrap().count(), 0);
        }
        std::fs::write(&receipt_path, serde_json::to_vec(&backup.receipt).unwrap()).unwrap();
        let mut changed_bytes = original.clone();
        *changed_bytes.last_mut().unwrap() ^= 1;
        std::fs::write(&database_path, changed_bytes).unwrap();
        assert!(recover_workspace_backup_to_disposable(
            &backup.directory,
            &root,
            APP,
            &pool,
            RECOVERY_TEST_BUDGET,
        )
        .await
        .is_err());
        let corrupt = b"synthetic invalid SQLite header";
        std::fs::write(&database_path, corrupt).unwrap();
        let mut changed = backup.receipt.clone();
        changed.database_size = corrupt.len() as u64;
        changed.database_sha256 = hex::encode(Sha256::digest(corrupt));
        std::fs::write(&receipt_path, serde_json::to_vec(&changed).unwrap()).unwrap();
        assert!(recover_workspace_backup_to_disposable(
            &backup.directory,
            &root,
            APP,
            &pool,
            RECOVERY_TEST_BUDGET,
        )
        .await
        .is_err());
        std::fs::write(&database_path, original).unwrap();
        std::fs::write(&receipt_path, serde_json::to_vec(&backup.receipt).unwrap()).unwrap();
        std::fs::rename(&receipt_path, backup.directory.join("receipt.pending")).unwrap();
        assert!(recover_workspace_backup_to_disposable(
            &backup.directory,
            &root,
            APP,
            &pool,
            RECOVERY_TEST_BUDGET,
        )
        .await
        .is_err());
        assert_eq!(std::fs::read_dir(&root).unwrap().count(), 0);
        pool.close().await;
    });
}

#[test]
fn recovery_rejects_unsafe_destinations_budgets_and_unreceipted_sidecars() {
    run_async(async {
        let temporary = tempfile::tempdir().unwrap();
        let pool = setup(&temporary.path().join("synthetic-recovery-boundaries.db")).await;
        let root = temporary.path().join("recoveries");
        std::fs::create_dir(&root).unwrap();
        let backup = create_workspace_backup_pool(&pool, temporary.path(), APP)
            .await
            .unwrap();
        let occupied = temporary.path().join("occupied");
        std::fs::write(&occupied, "existing content").unwrap();
        for destination in [
            Path::new("relative"),
            occupied.as_path(),
            backup.directory.as_path(),
        ] {
            assert!(recover_workspace_backup_to_disposable(
                &backup.directory,
                destination,
                APP,
                &pool,
                RECOVERY_TEST_BUDGET,
            )
            .await
            .is_err());
        }
        assert_eq!(std::fs::read(&occupied).unwrap(), b"existing content");
        for budget in [0, backup.receipt.database_size - 1] {
            let error = recover_workspace_backup_to_disposable(
                &backup.directory,
                &root,
                APP,
                &pool,
                budget,
            )
            .await
            .unwrap_err();
            assert_eq!(error.details["stage"], "recovery-size");
        }
        for suffix in ["-wal", "-shm", "-journal"] {
            let sidecar = backup.directory.join(format!("workspace.sqlite3{suffix}"));
            std::fs::write(&sidecar, "synthetic unreceipted sidecar").unwrap();
            let error = recover_workspace_backup_to_disposable(
                &backup.directory,
                &root,
                APP,
                &pool,
                RECOVERY_TEST_BUDGET,
            )
            .await
            .unwrap_err();
            assert_eq!(error.details["stage"], "recovery-sidecars");
            std::fs::rename(&sidecar, backup.directory.join(format!("unused{suffix}"))).unwrap();
        }
        assert_eq!(std::fs::read_dir(&root).unwrap().count(), 0);
        verify_workspace_backup(&backup.directory, APP)
            .await
            .unwrap();
        pool.close().await;
    });
}

#[test]
fn recovery_retries_create_independent_artifacts_and_preserve_incomplete_output() {
    run_async(async {
        let temporary = tempfile::tempdir().unwrap();
        let pool = setup(&temporary.path().join("synthetic-recovery-retry.db")).await;
        let root = temporary.path().join("recoveries");
        std::fs::create_dir(&root).unwrap();
        let backup = create_workspace_backup_pool(&pool, temporary.path(), APP)
            .await
            .unwrap();
        let bytes = std::fs::read(backup.directory.join("workspace.sqlite3")).unwrap();
        let interrupted = root.join(format!("recovery-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir(&interrupted).unwrap();
        let partial = &bytes[..bytes.len() / 2];
        std::fs::write(interrupted.join("workspace.sqlite3"), partial).unwrap();
        std::fs::write(
            interrupted.join("recovery.pending"),
            "synthetic interrupted receipt",
        )
        .unwrap();
        assert!(verify_disposable_workspace_recovery(
            &interrupted,
            APP,
            &pool,
            RECOVERY_TEST_BUDGET,
        )
        .await
        .is_err());
        let first = recover_workspace_backup_to_disposable(
            &backup.directory,
            &root,
            APP,
            &pool,
            RECOVERY_TEST_BUDGET,
        )
        .await
        .unwrap();
        let first_receipt = std::fs::read(first.directory.join("recovery.json")).unwrap();
        let second = recover_workspace_backup_to_disposable(
            &backup.directory,
            &root,
            APP,
            &pool,
            RECOVERY_TEST_BUDGET,
        )
        .await
        .unwrap();
        assert_ne!(first.directory, second.directory);
        assert_eq!(
            std::fs::read(first.directory.join("workspace.sqlite3")).unwrap(),
            bytes
        );
        assert_eq!(
            std::fs::read(second.directory.join("workspace.sqlite3")).unwrap(),
            bytes
        );
        assert_eq!(
            std::fs::read(first.directory.join("recovery.json")).unwrap(),
            first_receipt
        );
        assert_eq!(
            std::fs::read(interrupted.join("workspace.sqlite3")).unwrap(),
            partial
        );
        assert!(interrupted.join("recovery.pending").exists());
        assert!(!interrupted.join("recovery.json").exists());
        assert_eq!(std::fs::read_dir(&root).unwrap().count(), 3);
        pool.close().await;
    });
}

#[test]
fn recovery_verification_rejects_changed_receipts_and_incomplete_or_oversized_markers() {
    run_async(async {
        let temporary = tempfile::tempdir().unwrap();
        let pool = setup(&temporary.path().join("synthetic-recovery-receipt.db")).await;
        let root = temporary.path().join("recoveries");
        std::fs::create_dir(&root).unwrap();
        let backup = create_workspace_backup_pool(&pool, temporary.path(), APP)
            .await
            .unwrap();
        let recovery = recover_workspace_backup_to_disposable(
            &backup.directory,
            &root,
            APP,
            &pool,
            RECOVERY_TEST_BUDGET,
        )
        .await
        .unwrap();
        let path = recovery.directory.join("recovery.json");
        let original: Value = serde_json::to_value(&recovery.receipt).unwrap();
        let mut cases = Vec::new();
        let mut changed = original.clone();
        changed["format_version"] = 2.into();
        cases.push(changed);
        let mut changed = original.clone();
        changed["operation_id"] = "not-a-uuid".into();
        cases.push(changed);
        let mut changed = original.clone();
        changed["operation_id"] = uuid::Uuid::new_v4().to_string().into();
        cases.push(changed);
        let mut changed = original.clone();
        changed["source_backup"]["source_app_identifier"] =
            "com.jornalistainclusivo.retranca.pilot".into();
        cases.push(changed);
        let mut changed = original.clone();
        changed["source_backup"]["table_counts"]["articles"] = 500.into();
        cases.push(changed);
        let mut changed = original.clone();
        changed["unexpected"] = true.into();
        cases.push(changed);
        for changed in cases {
            std::fs::write(&path, serde_json::to_vec(&changed).unwrap()).unwrap();
            assert!(verify_disposable_workspace_recovery(
                &recovery.directory,
                APP,
                &pool,
                RECOVERY_TEST_BUDGET,
            )
            .await
            .is_err());
        }
        std::fs::write(&path, serde_json::to_vec(&original).unwrap()).unwrap();
        verify_disposable_workspace_recovery(&recovery.directory, APP, &pool, RECOVERY_TEST_BUDGET)
            .await
            .unwrap();
        std::fs::rename(&path, recovery.directory.join("recovery.pending")).unwrap();
        assert!(verify_disposable_workspace_recovery(
            &recovery.directory,
            APP,
            &pool,
            RECOVERY_TEST_BUDGET,
        )
        .await
        .is_err());
        std::fs::write(&path, vec![b' '; 16 * 1024 + 1]).unwrap();
        let error = verify_disposable_workspace_recovery(
            &recovery.directory,
            APP,
            &pool,
            RECOVERY_TEST_BUDGET,
        )
        .await
        .unwrap_err();
        assert_eq!(error.details["stage"], "recovery-receipt-limit");
        assert!(recovery.directory.join("workspace.sqlite3").exists());
        pool.close().await;
    });
}
