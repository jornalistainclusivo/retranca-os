use std::collections::HashMap;
use std::str::FromStr;
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::Executor;
use tauri_plugin_sql::{DbInstances, DbPool};
use tokio::sync::RwLock;

fn run_async<F: std::future::Future>(f: F) -> F::Output {
    let rt = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap();
    rt.block_on(f)
}

#[test]
fn test_shared_pool_architecture() {
    run_async(async {
    let mut options = SqliteConnectOptions::from_str("sqlite::memory:").unwrap();
    options = options.pragma("foreign_keys", "ON");

    // This simulates what the Tauri plugin does under the hood for a preloaded DB
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(options)
        .await
        .unwrap();

    // Set up table
    pool.execute("CREATE TABLE mock_table (id INTEGER PRIMARY KEY, val TEXT);").await.unwrap();

    let mut map = HashMap::new();
    map.insert("sqlite:retranca.db".to_string(), DbPool::Sqlite(pool.clone()));
    
    let instances = DbInstances(RwLock::new(map));

    // PROOF: Native code obtains pool from DbInstances
    let instances_map = instances.0.read().await;
    let pool_enum = instances_map.get("sqlite:retranca.db").expect("missing preloaded db");
    
    #[allow(irrefutable_let_patterns)]
    let DbPool::Sqlite(native_pool) = pool_enum else {
        panic!("Not Sqlite");
    };

    // PROOF: Native begin transaction
    let mut tx = native_pool.begin().await.expect("Failed to start transaction");
    
    // PROOF: Multiple statements same transaction
    tx.execute("INSERT INTO mock_table (val) VALUES ('txn1');").await.unwrap();
    tx.execute("INSERT INTO mock_table (val) VALUES ('txn2');").await.unwrap();

    let count: i64 = sqlx::query_scalar("SELECT count(*) FROM mock_table")
        .fetch_one(&mut *tx).await.unwrap();
    assert_eq!(count, 2);

    // PROOF: Rollback
    tx.rollback().await.expect("Failed to rollback");

    // PROOF: Post-rollback verification via plugin-style access (using the cloned pool)
    let final_count: i64 = sqlx::query_scalar("SELECT count(*) FROM mock_table")
        .fetch_one(&pool).await.unwrap();
    assert_eq!(final_count, 0, "Data should be rolled back");

    // PROOF: No SQLITE_BUSY - we successfully queried using the plugin pool immediately after rollback
    });
}
