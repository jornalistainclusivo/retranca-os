// Phase 6.4 Shared Pool Architecture — Unit Test
//
// SCOPE: This test validates the TYPE-LEVEL API CONTRACT between native Rust
// code and tauri_plugin_sql's public types (DbInstances, DbPool::Sqlite).
//
// It proves:
//   - DbInstances can contain a DbPool::Sqlite wrapping an sqlx::Pool<Sqlite>.
//   - Native Rust can obtain the inner pool by key lookup and pattern match.
//   - A single transaction can contain multiple statements.
//   - Rollback is effective — inserted data is absent after rollback.
//
// It does NOT prove:
//   - Real Tauri preload startup or plugin initialization ordering.
//   - Actual production database path mapping (sqlite:retranca.db on disk).
//   - Frontend/native concurrent access under real contention.
//   - Universal absence of SQLITE_BUSY under arbitrary workloads.
//   - End-to-end plugin initialization with tauri::Builder.

use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::Executor;
use std::collections::HashMap;
use std::str::FromStr;
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
fn test_shared_pool_type_contract() {
    run_async(async {
        let mut options = SqliteConnectOptions::from_str("sqlite::memory:").unwrap();
        options = options.pragma("foreign_keys", "ON");

        // Construct an in-memory pool to simulate the pool that tauri-plugin-sql
        // creates internally when it preloads a database. This does NOT exercise
        // the real plugin initialization path.
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect_with(options)
            .await
            .unwrap();

        pool.execute("CREATE TABLE mock_table (id INTEGER PRIMARY KEY, val TEXT);")
            .await
            .unwrap();

        let mut map = HashMap::new();
        map.insert(
            "sqlite:retranca.db".to_string(),
            DbPool::Sqlite(pool.clone()),
        );

        let instances = DbInstances(RwLock::new(map));

        // Verify: native code can obtain pool from DbInstances by key
        let instances_map = instances.0.read().await;
        let pool_enum = instances_map
            .get("sqlite:retranca.db")
            .expect("key must exist in DbInstances");

        #[allow(irrefutable_let_patterns)]
        let DbPool::Sqlite(native_pool) = pool_enum
        else {
            panic!("DbPool variant must be Sqlite");
        };

        // Verify: transaction begin
        let mut tx = native_pool
            .begin()
            .await
            .expect("transaction must start successfully");

        // Verify: multiple statements within one transaction
        tx.execute("INSERT INTO mock_table (val) VALUES ('txn1');")
            .await
            .unwrap();
        tx.execute("INSERT INTO mock_table (val) VALUES ('txn2');")
            .await
            .unwrap();

        let count: i64 = sqlx::query_scalar("SELECT count(*) FROM mock_table")
            .fetch_one(&mut *tx)
            .await
            .unwrap();
        assert_eq!(count, 2);

        // Verify: rollback
        tx.rollback().await.expect("rollback must succeed");

        // Verify: post-rollback data is absent (using the original pool handle)
        let final_count: i64 = sqlx::query_scalar("SELECT count(*) FROM mock_table")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(final_count, 0, "rolled-back data must be absent");
    });
}
