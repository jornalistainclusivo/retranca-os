use sqlx::{Acquire, Pool, Row, Sqlite};
use std::path::Path;
use tauri::State;
use tauri_plugin_sql::DbInstances;

use crate::phase64::{get_pool, CanonicalError, SuccessResponse};

static MIGRATION_LOCK: tokio::sync::Mutex<()> = tokio::sync::Mutex::const_new(());

fn migration_error(error: impl ToString) -> CanonicalError {
    CanonicalError {
        code: "ERR_MIGRATION_FAILED".into(),
        retryable: false,
        details: serde_json::json!({ "error": error.to_string() }),
    }
}

pub async fn migrate_article_content_pool(pool: &Pool<Sqlite>) -> Result<(), CanonicalError> {
    let _guard = MIGRATION_LOCK.lock().await;
    let mut connection = pool.acquire().await.map_err(migration_error)?;
    let version: i64 = sqlx::query_scalar("PRAGMA user_version")
        .fetch_one(&mut *connection)
        .await
        .map_err(migration_error)?;
    if version != 1 && version != 2 {
        return Err(migration_error("Expected workflow schema version 1 or 2"));
    }

    let column = sqlx::query(
        "SELECT type, [notnull], dflt_value FROM pragma_table_info('articles') WHERE name = 'analysisContent'",
    )
    .fetch_optional(&mut *connection)
    .await
    .map_err(migration_error)?;
    if version == 2 {
        let valid = column.is_some_and(|row| {
            row.get::<String, _>("type").eq_ignore_ascii_case("TEXT")
                && row.get::<i64, _>("notnull") == 1
                && row.get::<Option<String>, _>("dflt_value").as_deref() == Some("''")
        });
        return if valid {
            Ok(())
        } else {
            Err(migration_error("Article content schema is incomplete"))
        };
    }
    if column.is_some() {
        return Err(migration_error("Unexpected partial article content schema"));
    }

    let databases = sqlx::query("PRAGMA database_list")
        .fetch_all(&mut *connection)
        .await
        .map_err(migration_error)?;
    let database_file = databases
        .iter()
        .find(|row| row.get::<String, _>("name") == "main")
        .map(|row| row.get::<String, _>("file"))
        .filter(|path| !path.is_empty())
        .ok_or_else(|| migration_error("Cannot resolve main database file for backup"))?;
    let database_path = Path::new(&database_file);
    let database_name = database_path
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| migration_error("Invalid database filename"))?;
    let backup = database_path.with_file_name(format!(
        "retranca-article-content-backup-{}-{}",
        uuid::Uuid::new_v4(),
        database_name
    ));

    sqlx::query("VACUUM INTO ?")
        .bind(backup.to_string_lossy().as_ref())
        .execute(&mut *connection)
        .await
        .map_err(migration_error)?;

    let mut transaction = connection.begin().await.map_err(migration_error)?;
    sqlx::query("ALTER TABLE articles ADD COLUMN analysisContent TEXT NOT NULL DEFAULT ''")
        .execute(&mut *transaction)
        .await
        .map_err(migration_error)?;
    sqlx::query("PRAGMA user_version = 2")
        .execute(&mut *transaction)
        .await
        .map_err(migration_error)?;
    transaction.commit().await.map_err(migration_error)?;
    Ok(())
}

#[tauri::command]
pub async fn migrate_article_content(
    instances: State<'_, DbInstances>,
) -> Result<SuccessResponse, CanonicalError> {
    let pool = get_pool(&instances).await?;
    migrate_article_content_pool(&pool).await?;
    Ok(SuccessResponse { success: true })
}
