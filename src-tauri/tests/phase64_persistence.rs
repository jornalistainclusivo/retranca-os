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
    let expand_path = format!("{}/../db/migrations/phase64AtomicSql.ts", manifest_dir);
    let ts_content =
        std::fs::read_to_string(&expand_path).expect("Failed to read phase64AtomicSql.ts");
    let sql = ts_content
        .split('`')
        .nth(1)
        .expect("Failed to parse SQL from backticks");

    sql.to_string()
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

        let row = sqlx::query(
            "SELECT id, articleId, label, completed, category FROM checklist_items WHERE id = 'c1'",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(row.get::<String, _>("id"), "c1");
        assert_eq!(row.get::<String, _>("articleId"), "1");
        assert_eq!(row.get::<String, _>("label"), "L");
        assert_eq!(row.get::<i64, _>("completed"), 0);
        assert_eq!(row.get::<String, _>("category"), "C");
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

#[test]
fn test_mig_013_workflow_tuple_mutation_rolls_back() {
    run_async(async {
        let pool = setup_db().await;
        pool.execute(insert_dummy_article("ideia", "IA").as_str())
            .await
            .unwrap();

        let mut script = get_migration_script();
        script = script.replace(
            "('a0b1c2d3-e4f5-4a6b-8c7d-9e0f1a2b3c4d', 'Ideia'",
            "('a0b1c2d3-e4f5-4a6b-8c7d-9e0f1a2b3c4d', 'Wrong'",
        );
        let res = pool.execute(script.as_str()).await;

        assert!(res.is_err());
        let row =
            sqlx::query("SELECT count(*) as cnt FROM sqlite_master WHERE name = 'workflow_stages'")
                .fetch_one(&pool)
                .await
                .unwrap();
        assert_eq!(row.get::<i64, _>("cnt"), 0);
    });
}

#[test]
fn test_mig_014_category_tuple_mutation_rolls_back() {
    run_async(async {
        let pool = setup_db().await;
        pool.execute(insert_dummy_article("ideia", "IA").as_str())
            .await
            .unwrap();

        let mut script = get_migration_script();
        script = script.replace(
            "('2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e', 'Acessibilidade'",
            "('2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e', 'WrongCat'",
        );
        let res = pool.execute(script.as_str()).await;

        assert!(res.is_err());
        let row =
            sqlx::query("SELECT count(*) as cnt FROM sqlite_master WHERE name = 'workflow_stages'")
                .fetch_one(&pool)
                .await
                .unwrap();
        assert_eq!(row.get::<i64, _>("cnt"), 0);
    });
}

#[test]
fn test_mig_015_article_preservation_mutation_rolls_back() {
    run_async(async {
        let pool = setup_db().await;
        pool.execute(insert_dummy_article("ideia", "IA").as_str())
            .await
            .unwrap();

        let mut script = get_migration_script();
        script = script.replace(
            "category_id = CASE categoryTag",
            "categoryTag = 'Mutated', category_id = CASE categoryTag",
        );
        let res = pool.execute(script.as_str()).await;

        assert!(res.is_err());
        let row =
            sqlx::query("SELECT count(*) as cnt FROM sqlite_master WHERE name = 'workflow_stages'")
                .fetch_one(&pool)
                .await
                .unwrap();
        assert_eq!(row.get::<i64, _>("cnt"), 0);
    });
}

#[test]
fn test_mig_016_checklist_preservation_mutation_rolls_back() {
    run_async(async {
        let pool = setup_db().await;
        pool.execute(insert_dummy_article("ideia", "IA").as_str())
            .await
            .unwrap();
        pool.execute("INSERT INTO checklist_items (id, articleId, label, completed, category) VALUES ('c1', '1', 'L', 0, 'C')").await.unwrap();

        let mut script = get_migration_script();
        script = script.replace(
            "-- MAP ARTICLES",
            "UPDATE checklist_items SET label = 'Mutated';\n-- MAP ARTICLES",
        );
        let res = pool.execute(script.as_str()).await;

        assert!(res.is_err());
        let row =
            sqlx::query("SELECT count(*) as cnt FROM sqlite_master WHERE name = 'workflow_stages'")
                .fetch_one(&pool)
                .await
                .unwrap();
        assert_eq!(row.get::<i64, _>("cnt"), 0);
    });
}

#[test]
fn test_mig_017_vacuum_into_creates_backup() {
    use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
    use std::env::temp_dir;
    use std::fs;

    run_async(async {
        let db_path = temp_dir().join(format!(
            "test_db_{}.sqlite",
            std::time::UNIX_EPOCH.elapsed().unwrap().as_millis()
        ));
        let db_url = format!("sqlite://{}", db_path.display());

        fs::File::create(&db_path).unwrap();

        let options = SqliteConnectOptions::from_str(&db_url)
            .unwrap()
            .create_if_missing(true);
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect_with(options)
            .await
            .unwrap();

        let legacy_schema = r#"
            CREATE TABLE articles (id TEXT PRIMARY KEY, title TEXT, status TEXT);
            INSERT INTO articles VALUES ('1', 'Test', 'ideia');
        "#;
        pool.execute(legacy_schema).await.unwrap();

        let backup_path = temp_dir().join(format!(
            "test_backup_{}.sqlite",
            std::time::UNIX_EPOCH.elapsed().unwrap().as_millis()
        ));
        // Note: the Windows paths might have single quotes or not, but typically safe
        let backup_sql = format!(
            "VACUUM INTO '{}';",
            backup_path.display().to_string().replace("'", "''")
        );
        pool.execute(backup_sql.as_str()).await.unwrap();

        assert!(backup_path.exists());

        let backup_url = format!("sqlite://{}", backup_path.display());
        let backup_options = SqliteConnectOptions::from_str(&backup_url).unwrap();
        let backup_pool = SqlitePoolOptions::new()
            .connect_with(backup_options)
            .await
            .unwrap();
        let count: i64 = sqlx::query_scalar("SELECT count(*) FROM articles")
            .fetch_one(&backup_pool)
            .await
            .unwrap();
        assert_eq!(count, 1);

        let count_src: i64 = sqlx::query_scalar("SELECT count(*) FROM articles")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(count_src, 1);

        let _ = pool.close().await;
        let _ = backup_pool.close().await;
        let _ = fs::remove_file(db_path);
        let _ = fs::remove_file(backup_path);
    });
}
