use sqlx::Executor;
use tauri::State;
use tauri_plugin_sql::{DbInstances, DbPool};

#[tauri::command]
pub async fn check_shared_pool_proof(instances: State<'_, DbInstances>) -> Result<(), String> {
    let map = instances.0.read().await;
    let pool_enum = map
        .get("sqlite:retranca.db")
        .ok_or("Database sqlite:retranca.db not preloaded")?;

    #[allow(irrefutable_let_patterns)]
    let DbPool::Sqlite(pool) = pool_enum else {
        return Err("Not a SQLite pool".into());
    };

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    tx.execute("CREATE TEMP TABLE proof_table (id INTEGER PRIMARY KEY, val TEXT);")
        .await
        .map_err(|e| e.to_string())?;
    tx.execute("INSERT INTO proof_table (val) VALUES ('test');")
        .await
        .map_err(|e| e.to_string())?;

    let count: i64 = sqlx::query_scalar("SELECT count(*) FROM proof_table")
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    if count != 1 {
        return Err("Insert failed".into());
    }

    tx.rollback().await.map_err(|e| e.to_string())?;

    // Prove absent
    let res = sqlx::query_scalar::<_, i64>("SELECT count(*) FROM proof_table")
        .fetch_one(pool)
        .await;

    if res.is_ok() {
        return Err("Temp table should not exist after rollback".into());
    }

    Ok(())
}
