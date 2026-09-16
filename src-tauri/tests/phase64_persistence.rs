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

    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let expand_path = format!("{}/../db/migrations/phase64Expand.ts", manifest_dir);
    let ts_content =
        std::fs::read_to_string(&expand_path).expect("Failed to read phase64Expand.ts");

    let sql = ts_content
        .split('`')
        .nth(1)
        .expect("Failed to parse SQL from backticks");

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
fn test_expand_schema_creation() {
    run_async(async {
        let pool = setup_db().await;

        let row = sqlx::query("SELECT count(*) as cnt FROM sqlite_master WHERE name IN ('workflow_stages', 'categories', 'checklist_templates')")
            .fetch_one(&pool)
            .await
            .unwrap();
        let count: i64 = row.get("cnt");
        assert_eq!(count, 3);

        let row = sqlx::query("SELECT sql FROM sqlite_master WHERE name = 'articles'")
            .fetch_one(&pool)
            .await
            .unwrap();
        let sql: String = row.get("sql");
        assert!(sql.contains("workflow_stage_id"));
        assert!(sql.contains("category_id"));
    });
}

#[test]
fn test_expand_nullable_refs() {
    run_async(async {
        let pool = setup_db().await;

        sqlx::query("INSERT INTO articles (id, title, status, categoryTag, tags, publishDate, createdAt, updatedAt) VALUES ('1', 'Test', 'ideia', 'Tech', '[]', '2023-01-01', '2023-01-01', '2023-01-01')")
            .execute(&pool)
            .await
            .unwrap();

        let row = sqlx::query("SELECT workflow_stage_id, category_id FROM articles WHERE id = '1'")
            .fetch_one(&pool)
            .await
            .unwrap();

        let wf_id: Option<String> = row.get("workflow_stage_id");
        let cat_id: Option<String> = row.get("category_id");

        assert!(wf_id.is_none());
        assert!(cat_id.is_none());
    });
}

#[test]
fn test_expand_foreign_keys() {
    run_async(async {
        let pool = setup_db().await;

        let row = sqlx::query("PRAGMA foreign_keys")
            .fetch_one(&pool)
            .await
            .unwrap();
        let fk_enabled: i64 = row
            .try_get(0)
            .or_else(|_| row.try_get("foreign_keys"))
            .unwrap_or(0);
        assert_eq!(fk_enabled, 1);

        sqlx::query("INSERT INTO articles (id, title, status, categoryTag, tags, publishDate, createdAt, updatedAt) VALUES ('1', 'Test', 'ideia', 'Tech', '[]', '2023-01-01', '2023-01-01', '2023-01-01')")
            .execute(&pool)
            .await
            .unwrap();

        let res1 = sqlx::query("UPDATE articles SET workflow_stage_id = 'invalid'")
            .execute(&pool)
            .await;
        assert!(res1.is_err());
        assert!(res1
            .unwrap_err()
            .to_string()
            .contains("FOREIGN KEY constraint failed"));

        let res2 = sqlx::query("UPDATE articles SET category_id = 'invalid'")
            .execute(&pool)
            .await;
        assert!(res2.is_err());
        assert!(res2
            .unwrap_err()
            .to_string()
            .contains("FOREIGN KEY constraint failed"));

        sqlx::query("INSERT INTO workflow_stages (id, display_name, order_index, is_active) VALUES ('stage1', 'S1', 1, 1)").execute(&pool).await.unwrap();
        sqlx::query("INSERT INTO categories (id, name, origin, is_active) VALUES ('cat1', 'C1', 'standard', 1)").execute(&pool).await.unwrap();

        sqlx::query(
            "UPDATE articles SET workflow_stage_id = 'stage1', category_id = 'cat1' WHERE id = '1'",
        )
        .execute(&pool)
        .await
        .unwrap();

        let res3 = sqlx::query("DELETE FROM workflow_stages WHERE id = 'stage1'")
            .execute(&pool)
            .await;
        assert!(res3.is_err());
        assert!(res3
            .unwrap_err()
            .to_string()
            .contains("FOREIGN KEY constraint failed"));

        let res4 = sqlx::query("UPDATE workflow_stages SET id = 'stage2' WHERE id = 'stage1'")
            .execute(&pool)
            .await;
        assert!(res4.is_err());
        assert!(res4
            .unwrap_err()
            .to_string()
            .contains("FOREIGN KEY constraint failed"));

        let res5 = sqlx::query("DELETE FROM categories WHERE id = 'cat1'")
            .execute(&pool)
            .await;
        assert!(res5.is_err());
        assert!(res5
            .unwrap_err()
            .to_string()
            .contains("FOREIGN KEY constraint failed"));

        let res6 = sqlx::query("UPDATE categories SET id = 'cat2' WHERE id = 'cat1'")
            .execute(&pool)
            .await;
        assert!(res6.is_err());
        assert!(res6
            .unwrap_err()
            .to_string()
            .contains("FOREIGN KEY constraint failed"));
    });
}

#[test]
fn test_expand_publication_unique_guard() {
    run_async(async {
        let pool = setup_db().await;

        sqlx::query("INSERT INTO workflow_stages (id, display_name, order_index, lifecycle_role, is_active) VALUES ('s1', 'S1', 1, 'PUBLICATION', 1)").execute(&pool).await.unwrap();

        let res = sqlx::query("INSERT INTO workflow_stages (id, display_name, order_index, lifecycle_role, is_active) VALUES ('s2', 'S2', 2, 'PUBLICATION', 1)").execute(&pool).await;
        assert!(res.is_err());
        assert!(res
            .unwrap_err()
            .to_string()
            .contains("UNIQUE constraint failed"));

        sqlx::query("INSERT INTO workflow_stages (id, display_name, order_index, lifecycle_role, is_active) VALUES ('s3', 'S3', 3, 'PUBLICATION', 0)").execute(&pool).await.unwrap();
    });
}

#[test]
fn test_expand_constraints_and_legacy_preservation() {
    run_async(async {
        let pool = setup_db().await;

        let res1 = sqlx::query("INSERT INTO workflow_stages (id, display_name, order_index, semantic_classification) VALUES ('s1', 'S1', 1, 'INVALID')").execute(&pool).await;
        assert!(res1.is_err());

        let res2 = sqlx::query("INSERT INTO workflow_stages (id, display_name, order_index, lifecycle_role) VALUES ('s2', 'S2', 1, 'INVALID')").execute(&pool).await;
        assert!(res2.is_err());

        let res3 = sqlx::query(
            "INSERT INTO workflow_stages (id, display_name, order_index) VALUES ('s3', 'S3', -1)",
        )
        .execute(&pool)
        .await;
        assert!(res3.is_err());

        let res4 =
            sqlx::query("INSERT INTO categories (id, name, origin) VALUES ('c1', 'C1', 'invalid')")
                .execute(&pool)
                .await;
        assert!(res4.is_err());

        sqlx::query("INSERT INTO articles (id, title, status, categoryTag, tags, publishDate, completedAt, createdAt, updatedAt) VALUES ('a1', 'T1', 'ideia', 'Tech', '[]', '2023', '2024', '2023', '2023')").execute(&pool).await.unwrap();
        sqlx::query("INSERT INTO checklist_items (id, articleId, label, completed, category) VALUES ('chk1', 'a1', 'L1', 0, 'C1')").execute(&pool).await.unwrap();

        let row = sqlx::query(
            "SELECT status, categoryTag, publishDate, completedAt FROM articles WHERE id = 'a1'",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(row.get::<String, _>("status"), "ideia");
        assert_eq!(row.get::<String, _>("categoryTag"), "Tech");
        assert_eq!(row.get::<String, _>("publishDate"), "2023");
        assert_eq!(row.get::<String, _>("completedAt"), "2024");

        let chk_row = sqlx::query("SELECT count(*) as cnt FROM checklist_items")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(chk_row.get::<i64, _>("cnt"), 1);

        let row_count = sqlx::query("SELECT count(*) as cnt FROM workflow_stages")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(row_count.get::<i64, _>("cnt"), 0);
    });
}
