use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::{Executor, Row, SqlitePool};
use std::str::FromStr;

async fn setup_db() -> SqlitePool {
    let mut options = SqliteConnectOptions::from_str("sqlite::memory:").unwrap();
    // Enable foreign keys explicitly as required
    options = options.pragma("foreign_keys", "ON");

    let pool = SqlitePoolOptions::new()
        .connect_with(options)
        .await
        .unwrap();

    // The legacy base schema (Articles table) based on production blueprint
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
    "#;
    pool.execute(legacy_schema).await.unwrap();

    // Get the Phase 6.4 Expand SQL from the typescript migration file
    let ts_content = std::fs::read_to_string("../db/migrations/phase64Expand.ts")
        .expect("Failed to read phase64Expand.ts");
    
    // Parse out the SQL content from between backticks
    let sql = ts_content.split('`').nth(1).expect("Failed to parse SQL from backticks");

    // Execute the phase64Expand SQL 
    pool.execute(sql).await.unwrap();

    pool
}

fn run_async<F: std::future::Future>(f: F) -> F::Output {
    let rt = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap();
    rt.block_on(f)
}

#[test]
fn test_mig_001_schema_expansion_succeeds() {
    run_async(async {
        let pool = setup_db().await;
        
        // Test if columns exist on articles
        let row = sqlx::query("SELECT sql FROM sqlite_master WHERE name = 'articles'")
            .fetch_one(&pool)
            .await
            .unwrap();
        let sql: String = row.get("sql");
        assert!(sql.contains("workflow_stage_id"));
        assert!(sql.contains("category_id"));
        
        // Test if new tables exist
        let row = sqlx::query("SELECT count(*) as cnt FROM sqlite_master WHERE name IN ('workflow_stages', 'categories', 'checklist_templates')")
            .fetch_one(&pool)
            .await
            .unwrap();
        let count: i64 = row.get("cnt");
        assert_eq!(count, 3);
    });
}

#[test]
fn test_mig_002_foreign_key_constraints_enforced() {
    run_async(async {
        let pool = setup_db().await;

        // Insert legacy article
        sqlx::query("INSERT INTO articles (id, title, status, categoryTag, tags, publishDate, createdAt, updatedAt) VALUES ('1', 'Test', 'ideia', 'Tech', '[]', '2023-01-01', '2023-01-01', '2023-01-01')")
            .execute(&pool)
            .await
            .unwrap();

        // Try to update with invalid FK should fail because foreign_keys = ON
        let result = sqlx::query("UPDATE articles SET workflow_stage_id = 'invalid_stage'")
            .execute(&pool)
            .await;

        assert!(result.is_err());
        let err = result.unwrap_err().to_string();
        assert!(err.contains("FOREIGN KEY constraint failed"));
    });
}

#[test]
fn test_mig_003_only_one_active_publication_stage() {
    run_async(async {
        let pool = setup_db().await;

        // Insert first publication stage
        sqlx::query("INSERT INTO workflow_stages (id, display_name, order_index, lifecycle_role, is_active) VALUES ('stage1', 'Published', 5, 'PUBLICATION', 1)")
            .execute(&pool)
            .await
            .unwrap();

        // Insert second active publication stage should fail
        let result = sqlx::query("INSERT INTO workflow_stages (id, display_name, order_index, lifecycle_role, is_active) VALUES ('stage2', 'Live', 6, 'PUBLICATION', 1)")
            .execute(&pool)
            .await;
        
        assert!(result.is_err());
        let err = result.unwrap_err().to_string();
        assert!(err.contains("UNIQUE constraint failed"));

        // Insert INACTIVE publication stage should succeed
        sqlx::query("INSERT INTO workflow_stages (id, display_name, order_index, lifecycle_role, is_active) VALUES ('stage3', 'Archived', 7, 'PUBLICATION', 0)")
            .execute(&pool)
            .await
            .unwrap();
    });
}

#[test]
fn test_mig_004_unique_active_stage_names() {
    run_async(async {
        let pool = setup_db().await;

        sqlx::query("INSERT INTO workflow_stages (id, display_name, order_index, is_active) VALUES ('1', 'Idea', 0, 1)")
            .execute(&pool)
            .await
            .unwrap();

        // Duplicate active name should fail
        let res1 = sqlx::query("INSERT INTO workflow_stages (id, display_name, order_index, is_active) VALUES ('2', 'Idea', 1, 1)")
            .execute(&pool)
            .await;
        assert!(res1.is_err());

        // Duplicate inactive name should succeed
        sqlx::query("INSERT INTO workflow_stages (id, display_name, order_index, is_active) VALUES ('3', 'Idea', 2, 0)")
            .execute(&pool)
            .await
            .unwrap();
    });
}
