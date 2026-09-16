use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::{Executor, Row, SqlitePool};
use std::str::FromStr;

async fn setup_db() -> SqlitePool {
    let mut options = SqliteConnectOptions::from_str("sqlite::memory:").unwrap();
    options = options.pragma("foreign_keys", "ON");

    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(options)
        .await
        .unwrap();

    let legacy_schema = r#"
        CREATE TABLE articles (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            status TEXT NOT NULL,
            categoryTag TEXT NOT NULL,
            tags TEXT NOT NULL,
            publishDate TEXT NOT NULL,
            summary TEXT,
            objective TEXT,
            keyword TEXT,
            persona TEXT,
            cta TEXT,
            internalLinks TEXT,
            externalLinks TEXT,
            estimatedTime TEXT,
            spentTime TEXT,
            notes TEXT,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            completedAt TEXT
        );
        CREATE TABLE checklist_items (
            id TEXT PRIMARY KEY,
            articleId TEXT NOT NULL,
            label TEXT NOT NULL,
            completed INTEGER NOT NULL,
            category TEXT,
            FOREIGN KEY(articleId) REFERENCES articles(id) ON DELETE CASCADE
        );
    "#;
    pool.execute(legacy_schema).await.unwrap();

    pool
}

fn run_async<F: std::future::Future>(f: F) -> F::Output {
    let rt = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap();
    rt.block_on(f)
}

fn get_migration_script() -> String {
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let expand_path = format!("{}/../db/migrations/phase64Expand.ts", manifest_dir);
    let ts_content =
        std::fs::read_to_string(&expand_path).expect("Failed to read phase64Expand.ts");
    let sql = ts_content
        .split('`')
        .nth(1)
        .expect("Failed to parse SQL from backticks");

    format!(
        r#"
BEGIN TRANSACTION;

{}

-- SEED WORKFLOW STAGES
INSERT INTO workflow_stages (id, display_name, order_index, semantic_classification, lifecycle_role, is_active) VALUES 
('a0b1c2d3-e4f5-4a6b-8c7d-9e0f1a2b3c4d', 'Ideia', 0, 'IDEA', NULL, 1),
('b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e', 'Pesquisa', 1, 'RESEARCH', NULL, 1),
('c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f', 'Produção', 2, 'DRAFTING', NULL, 1),
('d3e4f5a6-b7c8-4d9e-0f1a-2b3c4d5e6f7a', 'Revisão', 3, 'REVIEW', NULL, 1),
('e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b', 'Publicado', 4, 'PUBLISHED', 'PUBLICATION', 1);

-- SEED CATEGORIES
INSERT INTO categories (id, name, origin, is_active) VALUES 
('1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d', 'IA', 'standard', 1),
('2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e', 'Acessibilidade', 'standard', 1),
('3c4d5e6f-7a8b-4c9d-0e1f-2a3b4c5d6e7f', 'Inclusão', 'standard', 1),
('4d5e6f7a-8b9c-4d0e-1f2a-3b4c5d6e7f8a', 'SEO', 'standard', 1),
('5e6f7a8b-9c0d-4e1f-2a3b-4c5d6e7f8a9b', 'Docs', 'standard', 1),
('6f7a8b9c-0d1e-4f2a-3b4c-5d6e7f8a9b0c', 'Blog', 'standard', 1),
('7a8b9c0d-1e2f-4a3b-4c5d-6e7f8a9b0c1d', 'Social', 'standard', 1),
('8b9c0d1e-2f3a-4b4c-5d6e-7f8a9b0c1d2e', 'Linguagem Simples', 'standard', 1);

-- MAP ARTICLES
UPDATE articles SET
  workflow_stage_id = CASE status
    WHEN 'ideia' THEN 'a0b1c2d3-e4f5-4a6b-8c7d-9e0f1a2b3c4d'
    WHEN 'pesquisa' THEN 'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e'
    WHEN 'escrita' THEN 'c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f'
    WHEN 'revisao' THEN 'd3e4f5a6-b7c8-4d9e-0f1a-2b3c4d5e6f7a'
    WHEN 'publicado' THEN 'e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b'
  END,
  category_id = CASE categoryTag
    WHEN 'IA' THEN '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d'
    WHEN 'Acessibilidade' THEN '2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e'
    WHEN 'Inclusão' THEN '3c4d5e6f-7a8b-4c9d-0e1f-2a3b4c5d6e7f'
    WHEN 'SEO' THEN '4d5e6f7a-8b9c-4d0e-1f2a-3b4c5d6e7f8a'
    WHEN 'Docs' THEN '5e6f7a8b-9c0d-4e1f-2a3b-4c5d6e7f8a9b'
    WHEN 'Blog' THEN '6f7a8b9c-0d1e-4f2a-3b4c-5d6e7f8a9b0c'
    WHEN 'Social' THEN '7a8b9c0d-1e2f-4a3b-4c5d-6e7f8a9b0c1d'
    WHEN 'Linguagem Simples' THEN '8b9c0d1e-2f3a-4b4c-5d6e-7f8a9b0c1d2e'
  END;

-- VERIFY GUARDS BEFORE COMMIT
CREATE TEMP TABLE _migration_guards (id INTEGER PRIMARY KEY);
CREATE TEMP TRIGGER trg_verify_migration BEFORE INSERT ON _migration_guards BEGIN
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Invalid number of workflow stages')
  WHERE (SELECT COUNT(*) FROM workflow_stages) != 5;

  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Invalid number of categories')
  WHERE (SELECT COUNT(*) FROM categories) != 8;

  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Exactly one active publication stage is required')
  WHERE (SELECT COUNT(*) FROM workflow_stages WHERE lifecycle_role = 'PUBLICATION' AND is_active = 1) != 1;

  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Publicado invariants failed')
  WHERE (SELECT COUNT(*) FROM workflow_stages WHERE id = 'e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b' AND semantic_classification = 'PUBLISHED' AND lifecycle_role = 'PUBLICATION') != 1;

  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_UNKNOWN_LEGACY_VALUE')
  WHERE (SELECT COUNT(*) FROM articles WHERE workflow_stage_id IS NULL OR category_id IS NULL) > 0;
END;

INSERT INTO _migration_guards(id) VALUES(1);
DROP TRIGGER trg_verify_migration;
DROP TABLE _migration_guards;

PRAGMA user_version = 1;
COMMIT;
"#,
        sql
    )
}

fn insert_dummy_article(status: &str, category: &str) -> String {
    format!("INSERT INTO articles (id, title, status, categoryTag, tags, publishDate, createdAt, updatedAt) VALUES ('1', 'T', '{}', '{}', '[]', '2023', '2023', '2023');", status, category)
}

#[test]
fn test_mig_001_ideia_exact_mapping() {
    run_async(async {
        let pool = setup_db().await;
        pool.execute(insert_dummy_article("ideia", "IA").as_str())
            .await
            .unwrap();
        pool.execute(get_migration_script().as_str()).await.unwrap();

        let row = sqlx::query("SELECT workflow_stage_id FROM articles WHERE id = '1'")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(
            row.get::<String, _>("workflow_stage_id"),
            "a0b1c2d3-e4f5-4a6b-8c7d-9e0f1a2b3c4d"
        );
    });
}

#[test]
fn test_mig_002_pesquisa_exact_mapping() {
    run_async(async {
        let pool = setup_db().await;
        pool.execute(insert_dummy_article("pesquisa", "IA").as_str())
            .await
            .unwrap();
        pool.execute(get_migration_script().as_str()).await.unwrap();

        let row = sqlx::query("SELECT workflow_stage_id FROM articles WHERE id = '1'")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(
            row.get::<String, _>("workflow_stage_id"),
            "b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e"
        );
    });
}

#[test]
fn test_mig_003_escrita_producao_exact_mapping() {
    run_async(async {
        let pool = setup_db().await;
        pool.execute(insert_dummy_article("escrita", "IA").as_str())
            .await
            .unwrap();
        pool.execute(get_migration_script().as_str()).await.unwrap();

        let row = sqlx::query("SELECT workflow_stage_id FROM articles WHERE id = '1'")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(
            row.get::<String, _>("workflow_stage_id"),
            "c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f"
        );
    });
}

#[test]
fn test_mig_004_revisao_exact_mapping() {
    run_async(async {
        let pool = setup_db().await;
        pool.execute(insert_dummy_article("revisao", "IA").as_str())
            .await
            .unwrap();
        pool.execute(get_migration_script().as_str()).await.unwrap();

        let row = sqlx::query("SELECT workflow_stage_id FROM articles WHERE id = '1'")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(
            row.get::<String, _>("workflow_stage_id"),
            "d3e4f5a6-b7c8-4d9e-0f1a-2b3c4d5e6f7a"
        );
    });
}

#[test]
fn test_mig_005_publicado_exact_mapping() {
    run_async(async {
        let pool = setup_db().await;
        pool.execute(insert_dummy_article("publicado", "IA").as_str())
            .await
            .unwrap();
        pool.execute(get_migration_script().as_str()).await.unwrap();

        let row = sqlx::query("SELECT workflow_stage_id FROM articles WHERE id = '1'")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(
            row.get::<String, _>("workflow_stage_id"),
            "e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b"
        );
    });
}

#[test]
fn test_mig_006_all_eight_exact_categories() {
    run_async(async {
        let pool = setup_db().await;
        let cats = [
            "IA",
            "Acessibilidade",
            "Inclusão",
            "SEO",
            "Docs",
            "Blog",
            "Social",
            "Linguagem Simples",
        ];
        for (i, c) in cats.iter().enumerate() {
            pool.execute(format!("INSERT INTO articles (id, title, status, categoryTag, tags, publishDate, createdAt, updatedAt) VALUES ('{}', 'T', 'ideia', '{}', '[]', '2023', '2023', '2023');", i, c).as_str()).await.unwrap();
        }
        pool.execute(get_migration_script().as_str()).await.unwrap();

        let row = sqlx::query("SELECT COUNT(DISTINCT category_id) as cnt FROM articles")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(row.get::<i64, _>("cnt"), 8);
    });
}

#[test]
fn test_mig_007_empty_db_seeds_5_stages_8_categories() {
    run_async(async {
        let pool = setup_db().await;
        pool.execute(get_migration_script().as_str()).await.unwrap();

        let row = sqlx::query("SELECT count(*) as cnt FROM workflow_stages")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(row.get::<i64, _>("cnt"), 5);

        let row = sqlx::query("SELECT count(*) as cnt FROM categories")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(row.get::<i64, _>("cnt"), 8);
    });
}

#[test]
fn test_mig_008_multiple_articles_share_same_ids() {
    run_async(async {
        let pool = setup_db().await;
        pool.execute(insert_dummy_article("ideia", "IA").as_str())
            .await
            .unwrap();
        pool.execute("INSERT INTO articles (id, title, status, categoryTag, tags, publishDate, createdAt, updatedAt) VALUES ('2', 'T', 'ideia', 'IA', '[]', '2023', '2023', '2023');").await.unwrap();
        pool.execute(get_migration_script().as_str()).await.unwrap();

        let row1 =
            sqlx::query("SELECT workflow_stage_id, category_id FROM articles WHERE id = '1'")
                .fetch_one(&pool)
                .await
                .unwrap();
        let row2 =
            sqlx::query("SELECT workflow_stage_id, category_id FROM articles WHERE id = '2'")
                .fetch_one(&pool)
                .await
                .unwrap();

        assert_eq!(
            row1.get::<String, _>("workflow_stage_id"),
            row2.get::<String, _>("workflow_stage_id")
        );
        assert_eq!(
            row1.get::<String, _>("category_id"),
            row2.get::<String, _>("category_id")
        );
    });
}

#[test]
fn test_mig_009_checklist_items_preserved() {
    run_async(async {
        let pool = setup_db().await;
        pool.execute(insert_dummy_article("ideia", "IA").as_str())
            .await
            .unwrap();
        pool.execute("INSERT INTO checklist_items (id, articleId, label, completed, category) VALUES ('c1', '1', 'L', 0, 'C')").await.unwrap();
        pool.execute(get_migration_script().as_str()).await.unwrap();

        let row = sqlx::query("SELECT count(*) as cnt FROM checklist_items")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(row.get::<i64, _>("cnt"), 1);
    });
}

#[test]
fn test_mig_010_unknown_status_fails_closed() {
    run_async(async {
        let pool = setup_db().await;
        pool.execute(insert_dummy_article("unknown_status", "IA").as_str())
            .await
            .unwrap();

        let res = pool.execute(get_migration_script().as_str()).await;
        assert!(res.is_err());
        assert!(res
            .unwrap_err()
            .to_string()
            .contains("ERR_MIGRATION_UNKNOWN_LEGACY_VALUE"));

        let row =
            sqlx::query("SELECT count(*) as cnt FROM sqlite_master WHERE name = 'workflow_stages'")
                .fetch_one(&pool)
                .await
                .unwrap();
        assert_eq!(row.get::<i64, _>("cnt"), 0); // DB unchanged!
    });
}

#[test]
fn test_mig_011_unknown_category_fails_closed() {
    run_async(async {
        let pool = setup_db().await;
        pool.execute(insert_dummy_article("ideia", "unknown_category").as_str())
            .await
            .unwrap();

        let res = pool.execute(get_migration_script().as_str()).await;
        assert!(res.is_err());
        assert!(res
            .unwrap_err()
            .to_string()
            .contains("ERR_MIGRATION_UNKNOWN_LEGACY_VALUE"));

        let row =
            sqlx::query("SELECT count(*) as cnt FROM sqlite_master WHERE name = 'workflow_stages'")
                .fetch_one(&pool)
                .await
                .unwrap();
        assert_eq!(row.get::<i64, _>("cnt"), 0); // DB unchanged!
    });
}

#[test]
fn test_mig_012_deliberate_mid_migration_failure_rolls_back_retry_succeeds() {
    run_async(async {
        let pool = setup_db().await;
        pool.execute(insert_dummy_article("ideia", "unknown_cat").as_str())
            .await
            .unwrap();

        // 1. Fails closed
        let res = pool.execute(get_migration_script().as_str()).await;
        assert!(res.is_err());

        // 2. Fix it
        pool.execute("UPDATE articles SET categoryTag = 'IA'")
            .await
            .unwrap();

        // 3. Retry succeeds
        pool.execute(get_migration_script().as_str()).await.unwrap();

        let row =
            sqlx::query("SELECT count(*) as cnt FROM sqlite_master WHERE name = 'workflow_stages'")
                .fetch_one(&pool)
                .await
                .unwrap();
        assert_eq!(row.get::<i64, _>("cnt"), 1); // DB migrated!
    });
}
