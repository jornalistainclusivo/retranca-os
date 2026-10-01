use app_lib::article_content::migrate_article_content_pool;
use app_lib::phase64::verify_user_version;
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::{Executor, SqlitePool};

async fn open_database(path: &std::path::Path) -> SqlitePool {
    SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(
            SqliteConnectOptions::new()
                .filename(path)
                .create_if_missing(true),
        )
        .await
        .unwrap()
}

fn run_async<F: std::future::Future>(future: F) -> F::Output {
    tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(future)
}

async fn setup_database(pool: &SqlitePool) {
    pool.execute(
        "CREATE TABLE articles (id TEXT PRIMARY KEY, title TEXT, summary TEXT, objective TEXT);
         INSERT INTO articles VALUES ('a', 'Title A', 'Summary A', 'Objective A'), ('b', 'Title B', 'Summary B', 'Objective B');
         CREATE TABLE checklist_items (id TEXT PRIMARY KEY, articleId TEXT, completed INTEGER);
         INSERT INTO checklist_items VALUES ('check-a', 'a', 1);
         CREATE TABLE history_entries (id TEXT PRIMARY KEY, articleId TEXT, action TEXT);
         INSERT INTO history_entries VALUES ('history-a', 'a', 'Existing history');
         PRAGMA user_version = 1;",
    )
    .await
    .unwrap();
}

#[test]
fn content_migration_preserves_data_and_reopens_distinct_article_texts() {
    run_async(async {
        let directory = tempfile::tempdir().unwrap();
        let database = directory.path().join("retranca.db");
        let pool = open_database(&database).await;
        setup_database(&pool).await;
        migrate_article_content_pool(&pool).await.unwrap();
        verify_user_version(&pool).await.unwrap();
        let before: Vec<(String, String, String, String, String)> = sqlx::query_as(
            "SELECT id, title, summary, objective, analysisContent FROM articles ORDER BY id",
        )
        .fetch_all(&pool)
        .await
        .unwrap();
        assert_eq!(
            before[0],
            (
                "a".into(),
                "Title A".into(),
                "Summary A".into(),
                "Objective A".into(),
                "".into()
            )
        );
        assert_eq!(before[1].4, "");
        let checklist: (String, i64) =
            sqlx::query_as("SELECT articleId, completed FROM checklist_items")
                .fetch_one(&pool)
                .await
                .unwrap();
        assert_eq!(checklist, ("a".into(), 1));
        let history: String = sqlx::query_scalar("SELECT action FROM history_entries")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(history, "Existing history");

        for (id, text) in [("a", "Texto A\nInclusão."), ("b", "Texto B — only B")] {
            sqlx::query("UPDATE articles SET analysisContent = ? WHERE id = ?")
                .bind(text)
                .bind(id)
                .execute(&pool)
                .await
                .unwrap();
        }
        pool.close().await;
        let reopened = open_database(&database).await;
        migrate_article_content_pool(&reopened).await.unwrap();
        let texts: Vec<String> =
            sqlx::query_scalar("SELECT analysisContent FROM articles ORDER BY id")
                .fetch_all(&reopened)
                .await
                .unwrap();
        assert_eq!(texts, vec!["Texto A\nInclusão.", "Texto B — only B"]);
        let backups: Vec<_> = std::fs::read_dir(directory.path())
            .unwrap()
            .filter_map(Result::ok)
            .filter(|entry| {
                entry
                    .file_name()
                    .to_string_lossy()
                    .starts_with("retranca-article-content-backup-")
            })
            .collect();
        assert_eq!(backups.len(), 1);
        let backup = open_database(&backups[0].path()).await;
        let version: i64 = sqlx::query_scalar("PRAGMA user_version")
            .fetch_one(&backup)
            .await
            .unwrap();
        assert_eq!(version, 1);
        let count: i64 = sqlx::query_scalar("SELECT count(*) FROM articles")
            .fetch_one(&backup)
            .await
            .unwrap();
        assert_eq!(count, 2);
        backup.close().await;
        reopened.close().await;
    });
}

#[test]
fn content_migration_rejects_partial_or_future_schemas_without_rewriting_data() {
    run_async(async {
        let directory = tempfile::tempdir().unwrap();
        let pool = open_database(&directory.path().join("retranca.db")).await;
        setup_database(&pool).await;
        pool.execute("ALTER TABLE articles ADD COLUMN analysisContent TEXT; UPDATE articles SET analysisContent = 'Existing text' WHERE id = 'a';").await.unwrap();
        assert!(migrate_article_content_pool(&pool).await.is_err());
        pool.execute("PRAGMA user_version = 2;").await.unwrap();
        assert!(migrate_article_content_pool(&pool).await.is_err());
        pool.execute("PRAGMA user_version = 3;").await.unwrap();
        assert!(migrate_article_content_pool(&pool).await.is_err());
        assert!(verify_user_version(&pool).await.is_err());
        let text: String =
            sqlx::query_scalar("SELECT analysisContent FROM articles WHERE id = 'a'")
                .fetch_one(&pool)
                .await
                .unwrap();
        assert_eq!(text, "Existing text");
        pool.close().await;
    });
}

#[test]
fn concurrent_content_migrations_create_one_backup_and_preserve_the_database() {
    run_async(async {
        let directory = tempfile::tempdir().unwrap();
        let pool = open_database(&directory.path().join("retranca.db")).await;
        setup_database(&pool).await;
        let first_pool = pool.clone();
        let first = tokio::spawn(async move { migrate_article_content_pool(&first_pool).await });
        let second_pool = pool.clone();
        let second = tokio::spawn(async move { migrate_article_content_pool(&second_pool).await });
        first.await.unwrap().unwrap();
        second.await.unwrap().unwrap();
        let backups = std::fs::read_dir(directory.path())
            .unwrap()
            .filter_map(Result::ok)
            .filter(|entry| {
                entry
                    .file_name()
                    .to_string_lossy()
                    .starts_with("retranca-article-content-backup-")
            })
            .count();
        assert_eq!(backups, 1);
        let count: i64 = sqlx::query_scalar("SELECT count(*) FROM articles")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(count, 2);
        pool.close().await;
    });
}

#[test]
fn content_migration_does_not_change_schema_when_backup_creation_fails() {
    run_async(async {
        let directory = tempfile::tempdir().unwrap();
        let pool = open_database(&directory.path().join("retranca.db")).await;
        setup_database(&pool).await;
        pool.execute("BEGIN;").await.unwrap();
        assert!(migrate_article_content_pool(&pool).await.is_err());
        pool.execute("ROLLBACK;").await.unwrap();
        let version: i64 = sqlx::query_scalar("PRAGMA user_version")
            .fetch_one(&pool)
            .await
            .unwrap();
        let columns: i64 = sqlx::query_scalar(
            "SELECT count(*) FROM pragma_table_info('articles') WHERE name = 'analysisContent'",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(version, 1);
        assert_eq!(columns, 0);
        pool.close().await;
    });
}
