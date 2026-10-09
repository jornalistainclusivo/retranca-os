//! Workspace backup prototype. No Tauri command or active-database restore is exposed.
use crate::phase64::CanonicalError;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::sqlite::SqliteConnectOptions;
use sqlx::{Connection, SqliteConnection, SqlitePool};
use std::collections::BTreeMap;
use std::fs::{self, File, OpenOptions};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

const TABLES: [&str; 8] = [
    "articles",
    "categories",
    "checklist_items",
    "checklist_templates",
    "gamification_badges",
    "governance_docs",
    "history_entries",
    "workflow_stages",
];
const DATABASE_FILE: &str = "workspace.sqlite3";
const RECEIPT_FILE: &str = "receipt.json";
const MAX_RECEIPT_BYTES: u64 = 16 * 1024;
const APPLICATION_IDS: [&str; 3] = [
    "com.jornalistainclusivo.retranca",
    "com.jornalistainclusivo.retranca.pilot",
    "com.jornalistainclusivo.retranca.fixtures",
];

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct WorkspaceBackupReceipt {
    pub format_version: u32,
    pub operation_id: String,
    pub source_app_identifier: String,
    pub app_version: String,
    pub created_at_unix_ms: u64,
    pub sqlite_version: String,
    pub database_schema_version: i64,
    pub database_size: u64,
    pub database_sha256: String,
    pub schema_sha256: String,
    pub table_counts: BTreeMap<String, u64>,
}

#[derive(Debug)]
pub struct WorkspaceBackupArtifact {
    pub directory: PathBuf,
    pub receipt: WorkspaceBackupReceipt,
}

fn failure(stage: &'static str) -> CanonicalError {
    CanonicalError {
        code: "ERR_WORKSPACE_BACKUP".into(),
        retryable: false,
        details: serde_json::json!({ "stage": stage }),
    }
}

fn database_failure(error: sqlx::Error, stage: &'static str) -> CanonicalError {
    let retryable = error
        .as_database_error()
        .and_then(|error| error.code())
        .is_some_and(|code| matches!(code.as_ref(), "5" | "6"));
    CanonicalError {
        retryable,
        ..failure(stage)
    }
}

fn is_redirected(metadata: &fs::Metadata) -> bool {
    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        metadata.file_attributes() & 0x400 != 0
    }
    #[cfg(not(windows))]
    {
        metadata.file_type().is_symlink()
    }
}

fn validate_directory(directory: &Path) -> Result<(), CanonicalError> {
    if !directory.is_absolute()
        || directory.components().any(|part| {
            matches!(
                part,
                std::path::Component::ParentDir | std::path::Component::CurDir
            )
        })
    {
        return Err(failure("directory"));
    }
    for ancestor in directory.ancestors() {
        let metadata = fs::symlink_metadata(ancestor).map_err(|_| failure("directory"))?;
        if !metadata.is_dir() || is_redirected(&metadata) {
            return Err(failure("directory"));
        }
    }
    Ok(())
}

fn file_size(path: &Path) -> Result<u64, CanonicalError> {
    let metadata = fs::symlink_metadata(path).map_err(|_| failure("file"))?;
    if !metadata.is_file() || is_redirected(&metadata) {
        return Err(failure("file"));
    }
    Ok(metadata.len())
}

async fn digest_file(path: PathBuf) -> Result<String, CanonicalError> {
    tauri::async_runtime::spawn_blocking(move || {
        file_size(&path)?;
        let mut file = File::open(&path).map_err(|_| failure("hash"))?;
        let mut digest = Sha256::new();
        let mut buffer = [0_u8; 64 * 1024];
        loop {
            let read = file.read(&mut buffer).map_err(|_| failure("hash"))?;
            if read == 0 {
                break;
            }
            digest.update(&buffer[..read]);
        }
        Ok(hex::encode(digest.finalize()))
    })
    .await
    .map_err(|_| failure("hash-worker"))?
}

async fn inspect_database(
    connection: &mut SqliteConnection,
) -> Result<(String, BTreeMap<String, u64>), CanonicalError> {
    let version: i64 = sqlx::query_scalar("PRAGMA user_version")
        .fetch_one(&mut *connection)
        .await
        .map_err(|error| database_failure(error, "schema-version"))?;
    if version != 2 {
        return Err(failure("schema-version"));
    }
    let tables: Vec<String> = sqlx::query_scalar(
        "SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT GLOB 'sqlite_*' ORDER BY name",
    )
    .fetch_all(&mut *connection)
    .await
    .map_err(|error| database_failure(error, "tables"))?;
    if tables != TABLES {
        return Err(failure("tables"));
    }
    let check: Vec<String> = sqlx::query_scalar("PRAGMA quick_check")
        .fetch_all(&mut *connection)
        .await
        .map_err(|error| database_failure(error, "integrity"))?;
    if check != ["ok"] {
        return Err(failure("integrity"));
    }
    let schema: Vec<(String, String, String, Option<String>)> =
        sqlx::query_as("SELECT type, name, tbl_name, sql FROM sqlite_schema ORDER BY type, name")
            .fetch_all(&mut *connection)
            .await
            .map_err(|error| database_failure(error, "schema"))?;
    let schema_bytes = serde_json::to_vec(&schema).map_err(|_| failure("schema"))?;
    let schema_hash = hex::encode(Sha256::digest(schema_bytes));
    let mut counts = BTreeMap::new();
    for table in TABLES {
        // Identifiers are fixed by this module; no caller-supplied SQL is accepted.
        let count: i64 = sqlx::query_scalar(&format!("SELECT COUNT(*) FROM {table}"))
            .fetch_one(&mut *connection)
            .await
            .map_err(|error| database_failure(error, "counts"))?;
        counts.insert(
            table.into(),
            u64::try_from(count).map_err(|_| failure("counts"))?,
        );
    }
    Ok((schema_hash, counts))
}

/// Internal prototype: the future controller must resolve an application-owned root.
/// The caller supplies a trusted native pool, not a database path or frontend SQL.
pub async fn create_workspace_backup_pool(
    pool: &SqlitePool,
    backup_root: &Path,
    app_identifier: &str,
) -> Result<WorkspaceBackupArtifact, CanonicalError> {
    if !APPLICATION_IDS.contains(&app_identifier) {
        return Err(failure("application"));
    }
    validate_directory(backup_root)?;
    let mut source = pool
        .acquire()
        .await
        .map_err(|error| database_failure(error, "source"))?;
    inspect_database(&mut source).await?;
    let synchronous: i64 = sqlx::query_scalar("PRAGMA synchronous")
        .fetch_one(&mut *source)
        .await
        .map_err(|error| database_failure(error, "synchronous"))?;
    if synchronous != 1 && synchronous != 2 && synchronous != 3 {
        return Err(failure("synchronous"));
    }

    let operation_id = uuid::Uuid::new_v4().to_string();
    let directory = backup_root.join(format!("workspace-{operation_id}"));
    fs::create_dir(&directory).map_err(|_| failure("create-directory"))?;
    let database = directory.join(DATABASE_FILE);
    let destination = database.to_str().ok_or_else(|| failure("destination"))?;
    sqlx::query("VACUUM INTO ?")
        .bind(destination)
        .execute(&mut *source)
        .await
        .map_err(|error| database_failure(error, "snapshot"))?;
    drop(source);

    let mut copy = SqliteConnection::connect_with(
        &SqliteConnectOptions::new()
            .filename(&database)
            .read_only(true)
            .create_if_missing(false),
    )
    .await
    .map_err(|error| database_failure(error, "open-copy"))?;
    let (schema_sha256, table_counts) = inspect_database(&mut copy).await?;
    let sqlite_version: String = sqlx::query_scalar("SELECT sqlite_version()")
        .fetch_one(&mut copy)
        .await
        .map_err(|error| database_failure(error, "sqlite-version"))?;
    copy.close()
        .await
        .map_err(|error| database_failure(error, "close-copy"))?;

    let receipt = WorkspaceBackupReceipt {
        format_version: 1,
        operation_id,
        source_app_identifier: app_identifier.into(),
        app_version: env!("CARGO_PKG_VERSION").into(),
        created_at_unix_ms: SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|_| failure("clock"))?
            .as_millis()
            .try_into()
            .map_err(|_| failure("clock"))?,
        sqlite_version,
        database_schema_version: 2,
        database_size: file_size(&database)?,
        database_sha256: digest_file(database).await?,
        schema_sha256,
        table_counts,
    };
    let serialized = serde_json::to_vec_pretty(&receipt).map_err(|_| failure("receipt"))?;
    let mut temporary = OpenOptions::new()
        .create_new(true)
        .write(true)
        .open(directory.join("receipt.pending"))
        .map_err(|_| failure("receipt"))?;
    temporary
        .write_all(&serialized)
        .and_then(|_| temporary.sync_all())
        .map_err(|_| failure("receipt"))?;
    drop(temporary);
    fs::rename(
        directory.join("receipt.pending"),
        directory.join(RECEIPT_FILE),
    )
    .map_err(|_| failure("receipt"))?;

    Ok(WorkspaceBackupArtifact { directory, receipt })
}

/// Verifies a completed private copy. This is not an active-database restore validator.
pub async fn verify_workspace_backup(
    directory: &Path,
    expected_app_identifier: &str,
) -> Result<WorkspaceBackupReceipt, CanonicalError> {
    validate_directory(directory)?;
    let receipt_path = directory.join(RECEIPT_FILE);
    if file_size(&receipt_path)? > MAX_RECEIPT_BYTES {
        return Err(failure("receipt-limit"));
    }
    let mut bytes = Vec::new();
    File::open(receipt_path)
        .map_err(|_| failure("receipt"))?
        .take(MAX_RECEIPT_BYTES + 1)
        .read_to_end(&mut bytes)
        .map_err(|_| failure("receipt"))?;
    if bytes.len() as u64 > MAX_RECEIPT_BYTES {
        return Err(failure("receipt-limit"));
    }
    let receipt: WorkspaceBackupReceipt =
        serde_json::from_slice(&bytes).map_err(|_| failure("receipt"))?;
    if receipt.format_version != 1
        || receipt.database_schema_version != 2
        || !APPLICATION_IDS.contains(&expected_app_identifier)
        || receipt.source_app_identifier != expected_app_identifier
        || directory.file_name().and_then(|name| name.to_str())
            != Some(format!("workspace-{}", receipt.operation_id).as_str())
    {
        return Err(failure("receipt-identity"));
    }
    let database = directory.join(DATABASE_FILE);
    if file_size(&database)? != receipt.database_size
        || digest_file(database.clone()).await? != receipt.database_sha256
    {
        return Err(failure("copy-identity"));
    }
    let mut connection = SqliteConnection::connect_with(
        &SqliteConnectOptions::new()
            .filename(database)
            .read_only(true)
            .create_if_missing(false),
    )
    .await
    .map_err(|error| database_failure(error, "open-copy"))?;
    let (schema, counts) = inspect_database(&mut connection).await?;
    connection
        .close()
        .await
        .map_err(|error| database_failure(error, "close-copy"))?;
    if schema != receipt.schema_sha256 || counts != receipt.table_counts {
        return Err(failure("copy-metadata"));
    }
    Ok(receipt)
}
