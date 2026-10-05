use app_lib::article_import::{import_articles_pool, imported_relation_id, ImportArticlesRequest};
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::{Executor, SqlitePool};

fn run_async<F: std::future::Future>(future: F) -> F::Output {
    tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(future)
}

async fn open(path: &std::path::Path) -> SqlitePool {
    SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(
            SqliteConnectOptions::new()
                .filename(path)
                .create_if_missing(true)
                .foreign_keys(true),
        )
        .await
        .unwrap()
}

async fn setup(pool: &SqlitePool) {
    // Isolated schema-2 fixture; no real editorial database or migration is used.
    pool.execute("CREATE TABLE workflow_stages (id TEXT PRIMARY KEY, lifecycle_role TEXT, is_active INTEGER NOT NULL);
        INSERT INTO workflow_stages VALUES ('stage', NULL, 1), ('pub', 'PUBLICATION', 1);
        CREATE TABLE categories (id TEXT PRIMARY KEY, is_active INTEGER NOT NULL);
        INSERT INTO categories VALUES ('cat', 1);
        CREATE TABLE articles (id TEXT PRIMARY KEY, title TEXT NOT NULL, status TEXT NOT NULL, categoryTag TEXT NOT NULL,
        tags TEXT NOT NULL, publishDate TEXT NOT NULL, summary TEXT, objective TEXT, analysisContent TEXT NOT NULL DEFAULT '',
        keyword TEXT, persona TEXT, cta TEXT, internalLinks TEXT, externalLinks TEXT, estimatedTime TEXT, spentTime TEXT, notes TEXT,
        createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, completedAt TEXT,
        workflow_stage_id TEXT NOT NULL REFERENCES workflow_stages(id), category_id TEXT NOT NULL REFERENCES categories(id));
        CREATE TABLE checklist_items (id TEXT PRIMARY KEY, articleId TEXT NOT NULL REFERENCES articles(id), label TEXT NOT NULL, completed INTEGER NOT NULL, category TEXT);
        CREATE TABLE history_entries (id TEXT PRIMARY KEY, articleId TEXT NOT NULL REFERENCES articles(id), date TEXT NOT NULL, action TEXT NOT NULL);
        PRAGMA user_version = 2;").await.unwrap();
}

fn fixture(id: &str) -> serde_json::Value {
    serde_json::json!({
        "article": {
            "id": id, "title": format!("Synthetic {id}"), "status": "ideia", "categoryTag": "Acessibilidade",
            "tags": "[\"Synthetic\"]", "publishDate": "2026-10-02", "analysisContent": format!("Disposable {id}\nInclusão."),
            "createdAt": "2026-10-02T12:00:00Z", "updatedAt": "2026-10-02T12:00:00Z",
            "completedAt": null, "workflowStageId": "stage", "categoryId": "cat"
        },
        "checklists": [{"id": "c1", "articleId": id, "label": "Synthetic check", "completed": 1, "category": null}],
        "history": [{"id": "h1", "articleId": id, "date": "2026-10-02T12:00:00Z", "action": "Synthetic history"}]
    })
}

fn request(values: Vec<serde_json::Value>) -> ImportArticlesRequest {
    serde_json::from_value(serde_json::json!({"articles": values})).unwrap()
}

async fn count(pool: &SqlitePool) -> i64 {
    sqlx::query_scalar("SELECT COUNT(*) FROM articles")
        .fetch_one(pool)
        .await
        .unwrap()
}

#[test]
fn import_preserves_local_articles_is_idempotent_and_reopens_distinct_texts() {
    run_async(async {
        let temporary = tempfile::tempdir().unwrap();
        let path = temporary.path().join("synthetic.db");
        let pool = open(&path).await;
        setup(&pool).await;
        import_articles_pool(&pool, request(vec![fixture("local")]))
            .await
            .unwrap();
        let mut replacement = fixture("local");
        replacement["article"]["title"] = "Replacement attempt".into();
        replacement["article"]["analysisContent"] = "Replacement text".into();
        replacement["article"]["workflowStageId"] = "unknown-skipped-reference".into();
        let result = import_articles_pool(&pool, request(vec![replacement, fixture("new")]))
            .await
            .unwrap();
        assert_eq!((result.imported, result.skipped), (1, 1));
        let repeated = import_articles_pool(&pool, request(vec![fixture("local"), fixture("new")]))
            .await
            .unwrap();
        assert_eq!((repeated.imported, repeated.skipped), (0, 2));
        let rows: Vec<(String, String, String)> =
            sqlx::query_as("SELECT id, title, analysisContent FROM articles ORDER BY id")
                .fetch_all(&pool)
                .await
                .unwrap();
        assert_eq!(rows[0].1, "Synthetic local");
        assert_eq!(rows[0].2, "Disposable local\nInclusão.");
        let checks: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM checklist_items")
            .fetch_one(&pool)
            .await
            .unwrap();
        let history: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM history_entries")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!((checks, history), (2, 2));
        pool.close().await;
        let reopened = open(&path).await;
        let after: Vec<(String, String, String)> =
            sqlx::query_as("SELECT id, title, analysisContent FROM articles ORDER BY id")
                .fetch_all(&reopened)
                .await
                .unwrap();
        assert_eq!(after, rows);
        reopened.close().await;
    });
}

#[test]
fn import_rejects_unknown_or_inactive_references_before_any_insert() {
    run_async(async {
        let temporary = tempfile::tempdir().unwrap();
        let pool = open(&temporary.path().join("synthetic.db")).await;
        setup(&pool).await;
        for field in ["workflowStageId", "categoryId"] {
            let mut invalid = fixture("bad");
            invalid["article"][field] = "missing".into();
            let error = import_articles_pool(&pool, request(vec![fixture("valid"), invalid]))
                .await
                .unwrap_err();
            assert_eq!(error.code, "ERR_IMPORT_REFERENCE");
            assert_eq!(count(&pool).await, 0);
        }
        pool.execute("UPDATE categories SET is_active = 0")
            .await
            .unwrap();
        assert_eq!(
            import_articles_pool(&pool, request(vec![fixture("inactive")]))
                .await
                .unwrap_err()
                .code,
            "ERR_IMPORT_REFERENCE"
        );
        assert_eq!(count(&pool).await, 0);
        pool.close().await;
    });
}

#[test]
fn import_rolls_back_the_whole_batch_on_a_late_sql_failure() {
    run_async(async {
        let temporary = tempfile::tempdir().unwrap();
        let pool = open(&temporary.path().join("synthetic.db")).await;
        setup(&pool).await;
        import_articles_pool(&pool, request(vec![fixture("local")]))
            .await
            .unwrap();
        pool.execute("CREATE TRIGGER synthetic_failure BEFORE INSERT ON history_entries WHEN NEW.articleId = 'fail' BEGIN SELECT RAISE(ABORT, 'synthetic SQL failure'); END;").await.unwrap();
        assert!(
            import_articles_pool(&pool, request(vec![fixture("valid"), fixture("fail")]))
                .await
                .is_err()
        );
        assert_eq!(count(&pool).await, 1);
        let checks: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM checklist_items")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(checks, 1);
        pool.close().await;
    });
}

#[test]
fn import_rejects_conflicting_scoped_ids_without_touching_the_other_owner() {
    run_async(async {
        let temporary = tempfile::tempdir().unwrap();
        let pool = open(&temporary.path().join("synthetic.db")).await;
        setup(&pool).await;
        import_articles_pool(&pool, request(vec![fixture("local")]))
            .await
            .unwrap();
        sqlx::query("UPDATE checklist_items SET id = ? WHERE articleId = 'local'")
            .bind(imported_relation_id("new", "c1"))
            .execute(&pool)
            .await
            .unwrap();
        let error = import_articles_pool(&pool, request(vec![fixture("valid"), fixture("new")]))
            .await
            .unwrap_err();
        assert_eq!(error.code, "ERR_IMPORT_RELATION_CONFLICT");
        assert_eq!(count(&pool).await, 1);
        pool.close().await;
    });
}

#[test]
fn import_native_boundary_rejects_wrong_owners_duplicate_ids_and_limits() {
    run_async(async {
        let temporary = tempfile::tempdir().unwrap();
        let pool = open(&temporary.path().join("synthetic.db")).await;
        setup(&pool).await;
        let mut wrong_owner = fixture("new");
        wrong_owner["history"][0]["articleId"] = "other".into();
        let mut wrong_boolean = fixture("new");
        wrong_boolean["checklists"][0]["completed"] = 2.into();
        for values in [
            vec![wrong_owner],
            vec![wrong_boolean],
            vec![fixture("duplicate"), fixture("duplicate")],
        ] {
            assert_eq!(
                import_articles_pool(&pool, request(values))
                    .await
                    .unwrap_err()
                    .code,
                "ERR_IMPORT_INVALID"
            );
        }
        let too_many = (0..1001)
            .map(|id| fixture(&format!("synthetic-{id}")))
            .collect();
        assert_eq!(
            import_articles_pool(&pool, request(too_many))
                .await
                .unwrap_err()
                .code,
            "ERR_IMPORT_LIMIT"
        );
        let mut too_large = fixture("large");
        too_large["article"]["analysisContent"] = "x".repeat(5 * 1024 * 1024).into();
        assert_eq!(
            import_articles_pool(&pool, request(vec![too_large]))
                .await
                .unwrap_err()
                .code,
            "ERR_IMPORT_LIMIT"
        );
        assert_eq!(count(&pool).await, 0);
        pool.close().await;
    });
}

#[test]
fn import_rejects_unknown_schema_and_publication_invariant() {
    run_async(async {
        let temporary = tempfile::tempdir().unwrap();
        let pool = open(&temporary.path().join("synthetic.db")).await;
        setup(&pool).await;
        for version in [1, 3] {
            pool.execute(format!("PRAGMA user_version = {version}").as_str())
                .await
                .unwrap();
            assert_eq!(
                import_articles_pool(&pool, request(vec![fixture("new")]))
                    .await
                    .unwrap_err()
                    .code,
                "ERR_IMPORT_SCHEMA"
            );
        }
        pool.execute(
            "PRAGMA user_version = 2; UPDATE workflow_stages SET is_active = 0 WHERE id = 'pub';",
        )
        .await
        .unwrap();
        assert_eq!(
            import_articles_pool(&pool, request(vec![fixture("new")]))
                .await
                .unwrap_err()
                .code,
            "ERR_PUBLICATION_ROLE_INVARIANT"
        );
        assert_eq!(count(&pool).await, 0);
        pool.close().await;
    });
}
