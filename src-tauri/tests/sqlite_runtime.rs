#[path = "../build/sqlite_runtime_contract.rs"]
mod contract;

use sqlx::sqlite::SqliteConnectOptions;
use sqlx::{Connection, SqliteConnection};
use std::path::Path;

#[test]
fn linked_engine_is_the_pinned_wal_reset_fix_with_compatible_options() {
    tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(async {
            let mut connection =
                SqliteConnection::connect_with(&SqliteConnectOptions::new().in_memory(true))
                    .await
                    .unwrap();
            let (version, source_id): (String, String) =
                sqlx::query_as("SELECT sqlite_version(), sqlite_source_id()")
                    .fetch_one(&mut connection)
                    .await
                    .unwrap();
            println!("Linked SQLite: {version}; source ID: {source_id}");
            assert_eq!(version, contract::VERSION);
            assert_eq!(source_id, contract::SOURCE_ID);
            for option in [
                "THREADSAFE=1",
                "ENABLE_COLUMN_METADATA",
                "ENABLE_UNLOCK_NOTIFY",
                "DEFAULT_FOREIGN_KEYS",
                "ENABLE_FTS5",
            ] {
                let enabled: i64 = sqlx::query_scalar("SELECT sqlite_compileoption_used(?)")
                    .bind(option)
                    .fetch_one(&mut connection)
                    .await
                    .unwrap();
                assert_eq!(enabled, 1, "Missing SQLite option: {option}");
            }
            connection.close().await.unwrap();
        });
}

#[test]
fn unprepared_or_untrusted_artifacts_cannot_satisfy_the_build_guard() {
    let temporary = tempfile::tempdir().unwrap();
    let root = temporary.path();
    let engine = root.join("engine");
    assert!(contract::verify_artifact(root, &engine, "x86_64-pc-windows-msvc").is_err());
    std::fs::create_dir(&engine).unwrap();
    std::fs::write(engine.join("build.json"), "{\"sqlite_version\":\"3.46.0\"}").unwrap();
    assert!(contract::verify_artifact(root, &engine, "x86_64-pc-windows-msvc").is_err());
    std::fs::write(engine.join("build.json"), vec![b' '; 16 * 1024 + 1]).unwrap();
    assert!(contract::verify_artifact(root, &engine, "x86_64-pc-windows-msvc").is_err());
}

#[test]
fn guard_detects_changed_library_and_wrong_target_in_a_disposable_copy() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap();
    let prepared = root.join(".retranca-local/sqlite-runtime/3.51.3");
    let target = env!("RETRANCA_SQLITE_TARGET");
    // Only build artifacts are copied; no application data directory is resolved.
    let temporary = tempfile::tempdir().unwrap();
    let copied = temporary.path().join("engine");
    std::fs::create_dir(&copied).unwrap();
    let library = if cfg!(windows) {
        "sqlite3.lib"
    } else {
        "libsqlite3.a"
    };
    for name in [library, "sqlite3.h", "build.json"] {
        std::fs::copy(prepared.join(name), copied.join(name)).unwrap();
    }
    contract::verify_artifact(root, &copied, target).unwrap();
    assert!(contract::verify_artifact(root, &copied, "unsupported-target").is_err());
    std::fs::write(copied.join(library), "synthetic tampering").unwrap();
    assert!(contract::verify_artifact(root, &copied, target).is_err());
}
