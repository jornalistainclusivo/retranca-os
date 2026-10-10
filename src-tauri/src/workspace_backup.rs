//! Snapshot and disposable recovery core. Active-database restoration is not exposed.
use crate::phase64::CanonicalError;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::sqlite::SqliteConnectOptions;
use sqlx::{Connection, SqliteConnection, SqlitePool};
use std::collections::BTreeMap;
use std::fs::{self, File, OpenOptions};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

pub(crate) const TABLES: [&str; 8] = [
    "articles",
    "categories",
    "checklist_items",
    "checklist_templates",
    "gamification_badges",
    "governance_docs",
    "history_entries",
    "workflow_stages",
];
pub(crate) const DATABASE_FILE: &str = "workspace.sqlite3";
const RECEIPT_FILE: &str = "receipt.json";
const MAX_RECEIPT_BYTES: u64 = 16 * 1024;
pub(crate) const APPLICATION_IDS: [&str; 3] = [
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

pub(crate) fn validate_directory(directory: &Path) -> Result<(), CanonicalError> {
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

pub(crate) fn file_size(path: &Path) -> Result<u64, CanonicalError> {
    let metadata = fs::symlink_metadata(path).map_err(|_| failure("file"))?;
    if !metadata.is_file() || is_redirected(&metadata) {
        return Err(failure("file"));
    }
    Ok(metadata.len())
}

#[derive(Clone, Copy)]
struct BackupBudget {
    max_bytes: u64,
    deadline: Instant,
}

impl BackupBudget {
    fn new(max_bytes: u64, timeout: Duration) -> Result<Self, CanonicalError> {
        if max_bytes == 0 || timeout.is_zero() {
            return Err(failure("operation-limit"));
        }
        Ok(Self {
            max_bytes,
            deadline: Instant::now()
                .checked_add(timeout)
                .ok_or_else(|| failure("operation-limit"))?,
        })
    }

    fn check(self, bytes: u64) -> Result<(), CanonicalError> {
        if bytes > self.max_bytes {
            return Err(failure("database-limit"));
        }
        if Instant::now() >= self.deadline {
            return Err(failure("operation-limit"));
        }
        Ok(())
    }
}

async fn apply_budget(
    connection: &mut SqliteConnection,
    budget: Option<BackupBudget>,
) -> Result<(), CanonicalError> {
    if let Some(budget) = budget {
        budget.check(0)?;
        connection
            .lock_handle()
            .await
            .map_err(|error| database_failure(error, "operation-limit"))?
            .set_progress_handler(1000, move || Instant::now() < budget.deadline);
    }
    Ok(())
}

async fn digest_file(path: PathBuf) -> Result<String, CanonicalError> {
    digest_file_budgeted(path, None).await
}

async fn digest_file_budgeted(
    path: PathBuf,
    budget: Option<BackupBudget>,
) -> Result<String, CanonicalError> {
    tauri::async_runtime::spawn_blocking(move || {
        let size = file_size(&path)?;
        if let Some(budget) = budget {
            budget.check(size)?;
        }
        let mut total = 0_u64;
        let mut file = File::open(&path).map_err(|_| failure("hash"))?;
        let mut digest = Sha256::new();
        let mut buffer = [0_u8; 64 * 1024];
        loop {
            let read = file.read(&mut buffer).map_err(|_| failure("hash"))?;
            if read == 0 {
                break;
            }
            total = total
                .checked_add(read as u64)
                .ok_or_else(|| failure("database-limit"))?;
            if let Some(budget) = budget {
                budget.check(total)?;
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

/// Native core: the caller supplies a trusted pool and an application-owned root.
pub async fn create_workspace_backup_pool(
    pool: &SqlitePool,
    backup_root: &Path,
    app_identifier: &str,
) -> Result<WorkspaceBackupArtifact, CanonicalError> {
    create_workspace_backup_inner(pool, backup_root, app_identifier, None).await
}

pub async fn create_workspace_backup_pool_bounded(
    pool: &SqlitePool,
    backup_root: &Path,
    app_identifier: &str,
    max_bytes: u64,
    timeout: Duration,
) -> Result<WorkspaceBackupArtifact, CanonicalError> {
    let budget = BackupBudget::new(max_bytes, timeout)?;
    create_workspace_backup_inner(pool, backup_root, app_identifier, Some(budget))
        .await
        .map_err(|error| {
            if Instant::now() >= budget.deadline {
                failure("operation-limit")
            } else {
                error
            }
        })
}

async fn create_workspace_backup_inner(
    pool: &SqlitePool,
    backup_root: &Path,
    app_identifier: &str,
    budget: Option<BackupBudget>,
) -> Result<WorkspaceBackupArtifact, CanonicalError> {
    if !APPLICATION_IDS.contains(&app_identifier) {
        return Err(failure("application"));
    }
    validate_directory(backup_root)?;
    let mut source = pool
        .acquire()
        .await
        .map_err(|error| database_failure(error, "source"))?
        .detach();
    // A detached connection cannot return its progress callback to the plugin pool.
    apply_budget(&mut source, budget).await?;
    if let Some(budget) = budget {
        let pages: i64 = sqlx::query_scalar("PRAGMA page_count")
            .fetch_one(&mut source)
            .await
            .map_err(|error| database_failure(error, "database-limit"))?;
        let size: i64 = sqlx::query_scalar("PRAGMA page_size")
            .fetch_one(&mut source)
            .await
            .map_err(|error| database_failure(error, "database-limit"))?;
        let bytes = u64::try_from(pages)
            .ok()
            .and_then(|pages| {
                u64::try_from(size)
                    .ok()
                    .and_then(|size| pages.checked_mul(size))
            })
            .ok_or_else(|| failure("database-limit"))?;
        budget.check(bytes)?;
    }
    inspect_database(&mut source).await?;
    let synchronous: i64 = sqlx::query_scalar("PRAGMA synchronous")
        .fetch_one(&mut source)
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
        .execute(&mut source)
        .await
        .map_err(|error| database_failure(error, "snapshot"))?;
    drop(source);

    if let Some(budget) = budget {
        budget.check(file_size(&database)?)?;
    }
    let mut copy = SqliteConnection::connect_with(
        &SqliteConnectOptions::new()
            .filename(&database)
            .read_only(true)
            .create_if_missing(false)
            .pragma("trusted_schema", "OFF")
            .pragma("query_only", "ON"),
    )
    .await
    .map_err(|error| database_failure(error, "open-copy"))?;
    apply_budget(&mut copy, budget).await?;
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
        database_sha256: digest_file_budgeted(database, budget).await?,
        schema_sha256,
        table_counts,
    };
    if let Some(budget) = budget {
        budget.check(receipt.database_size)?;
    }
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
    verify_workspace_backup_inner(directory, expected_app_identifier, None).await
}

pub async fn verify_workspace_backup_bounded(
    directory: &Path,
    expected_app_identifier: &str,
    max_bytes: u64,
    timeout: Duration,
) -> Result<WorkspaceBackupReceipt, CanonicalError> {
    let budget = BackupBudget::new(max_bytes, timeout)?;
    verify_workspace_backup_inner(directory, expected_app_identifier, Some(budget))
        .await
        .map_err(|error| {
            if Instant::now() >= budget.deadline {
                failure("operation-limit")
            } else {
                error
            }
        })
}

async fn verify_workspace_backup_inner(
    directory: &Path,
    expected_app_identifier: &str,
    budget: Option<BackupBudget>,
) -> Result<WorkspaceBackupReceipt, CanonicalError> {
    validate_directory(directory)?;
    if let Some(budget) = budget {
        budget.check(file_size(&directory.join(DATABASE_FILE))?)?;
    }
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
        || digest_file_budgeted(database.clone(), budget).await? != receipt.database_sha256
    {
        return Err(failure("copy-identity"));
    }
    let mut connection = SqliteConnection::connect_with(
        &SqliteConnectOptions::new()
            .filename(&database)
            .read_only(true)
            .create_if_missing(false)
            .pragma("trusted_schema", "OFF")
            .pragma("query_only", "ON"),
    )
    .await
    .map_err(|error| database_failure(error, "open-copy"))?;
    apply_budget(&mut connection, budget).await?;
    let (schema, counts) = inspect_database(&mut connection).await?;
    connection
        .close()
        .await
        .map_err(|error| database_failure(error, "close-copy"))?;
    if schema != receipt.schema_sha256 || counts != receipt.table_counts {
        return Err(failure("copy-metadata"));
    }
    if let Some(budget) = budget {
        budget.check(receipt.database_size)?;
    }
    if file_size(&database)? != receipt.database_size
        || digest_file_budgeted(database, budget).await? != receipt.database_sha256
    {
        return Err(failure("copy-identity"));
    }
    Ok(receipt)
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct WorkspaceRecoveryReceipt {
    pub format_version: u32,
    pub operation_id: String,
    pub recovered_at_unix_ms: u64,
    pub source_backup: WorkspaceBackupReceipt,
}

#[derive(Debug)]
pub struct WorkspaceRecoveryArtifact {
    pub directory: PathBuf,
    pub receipt: WorkspaceRecoveryReceipt,
}

pub(crate) fn reject_snapshot_sidecars(directory: &Path) -> Result<(), CanonicalError> {
    for suffix in ["-wal", "-shm", "-journal"] {
        match fs::symlink_metadata(directory.join(format!("{DATABASE_FILE}{suffix}"))) {
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
            _ => return Err(failure("recovery-sidecars")),
        }
    }
    Ok(())
}

fn validate_recovery_source(
    receipt: &WorkspaceBackupReceipt,
    app_identifier: &str,
    expected_schema: &str,
    max_database_bytes: u64,
) -> Result<(), CanonicalError> {
    if receipt.format_version != 1
        || receipt.database_schema_version != 2
        || !APPLICATION_IDS.contains(&app_identifier)
        || receipt.source_app_identifier != app_identifier
        || uuid::Uuid::parse_str(&receipt.operation_id)
            .map(|id| id.to_string() != receipt.operation_id)
            .unwrap_or(true)
    {
        return Err(failure("recovery-identity"));
    }
    if max_database_bytes == 0
        || receipt.database_size == 0
        || receipt.database_size > max_database_bytes
        || receipt.database_size == u64::MAX
    {
        return Err(failure("recovery-size"));
    }
    if receipt.schema_sha256 != expected_schema {
        return Err(failure("recovery-schema"));
    }
    Ok(())
}

async fn recovery_reference_schema(pool: &SqlitePool) -> Result<String, CanonicalError> {
    let mut reference = pool
        .acquire()
        .await
        .map_err(|error| database_failure(error, "recovery-reference"))?;
    let (schema, _) = inspect_database(&mut reference).await?;
    Ok(schema)
}

fn copy_verified_stream(
    reader: impl Read,
    writer: &mut impl Write,
    expected_size: u64,
    expected_hash: &str,
) -> Result<(), CanonicalError> {
    let bound = expected_size
        .checked_add(1)
        .ok_or_else(|| failure("recovery-size"))?;
    let mut reader = reader.take(bound);
    let mut digest = Sha256::new();
    let mut buffer = [0_u8; 64 * 1024];
    let mut copied = 0_u64;
    loop {
        let read = reader
            .read(&mut buffer)
            .map_err(|_| failure("recovery-copy"))?;
        if read == 0 {
            break;
        }
        copied += read as u64;
        if copied > expected_size {
            return Err(failure("recovery-copy-identity"));
        }
        writer
            .write_all(&buffer[..read])
            .map_err(|_| failure("recovery-copy"))?;
        digest.update(&buffer[..read]);
    }
    if copied != expected_size || hex::encode(digest.finalize()) != expected_hash {
        return Err(failure("recovery-copy-identity"));
    }
    Ok(())
}

async fn copy_recovery_database(
    source: PathBuf,
    destination: PathBuf,
    receipt: WorkspaceBackupReceipt,
) -> Result<(), CanonicalError> {
    tauri::async_runtime::spawn_blocking(move || {
        if file_size(&source)? != receipt.database_size {
            return Err(failure("recovery-copy-identity"));
        }
        let input = File::open(source).map_err(|_| failure("recovery-copy"))?;
        let mut output = OpenOptions::new()
            .create_new(true)
            .write(true)
            .open(destination)
            .map_err(|_| failure("recovery-copy"))?;
        copy_verified_stream(
            input,
            &mut output,
            receipt.database_size,
            &receipt.database_sha256,
        )?;
        output.sync_all().map_err(|_| failure("recovery-sync"))
    })
    .await
    .map_err(|_| failure("recovery-copy-worker"))?
}

async fn verify_recovery_database(
    directory: &Path,
    receipt: &WorkspaceBackupReceipt,
) -> Result<(), CanonicalError> {
    reject_snapshot_sidecars(directory)?;
    let database = directory.join(DATABASE_FILE);
    if file_size(&database)? != receipt.database_size
        || digest_file(database.clone()).await? != receipt.database_sha256
    {
        return Err(failure("recovery-copy-identity"));
    }
    let mut copy = SqliteConnection::connect_with(
        &SqliteConnectOptions::new()
            .filename(&database)
            .read_only(true)
            .create_if_missing(false)
            .pragma("trusted_schema", "OFF")
            .pragma("query_only", "ON"),
    )
    .await
    .map_err(|error| database_failure(error, "recovery-open"))?;
    let inspected = inspect_database(&mut copy).await;
    copy.close()
        .await
        .map_err(|error| database_failure(error, "recovery-close"))?;
    let (schema, counts) = inspected?;
    if schema != receipt.schema_sha256 || counts != receipt.table_counts {
        return Err(failure("recovery-metadata"));
    }
    reject_snapshot_sidecars(directory)?;
    if digest_file(database).await? != receipt.database_sha256 {
        return Err(failure("recovery-copy-identity"));
    }
    Ok(())
}

/// Internal 8B prototype: creates an independent copy in a new UUID directory.
/// The reference pool and byte budget must be supplied by trusted native code.
/// This does not replace, migrate, reset or reopen an active application database.
pub async fn recover_workspace_backup_to_disposable(
    backup_directory: &Path,
    recovery_root: &Path,
    app_identifier: &str,
    reference_pool: &SqlitePool,
    max_database_bytes: u64,
) -> Result<WorkspaceRecoveryArtifact, CanonicalError> {
    validate_directory(backup_directory)?;
    validate_directory(recovery_root)?;
    let source_directory = fs::canonicalize(backup_directory).map_err(|_| failure("directory"))?;
    let root = fs::canonicalize(recovery_root).map_err(|_| failure("directory"))?;
    if root.starts_with(&source_directory) {
        return Err(failure("recovery-directory"));
    }
    if max_database_bytes == 0
        || file_size(&source_directory.join(DATABASE_FILE))? > max_database_bytes
    {
        return Err(failure("recovery-size"));
    }
    reject_snapshot_sidecars(&source_directory)?;
    let source_backup = verify_workspace_backup(&source_directory, app_identifier).await?;
    let reference_schema = recovery_reference_schema(reference_pool).await?;
    validate_recovery_source(
        &source_backup,
        app_identifier,
        &reference_schema,
        max_database_bytes,
    )?;

    let operation_id = uuid::Uuid::new_v4().to_string();
    let directory = root.join(format!("recovery-{operation_id}"));
    fs::create_dir(&directory).map_err(|_| failure("recovery-create-directory"))?;
    copy_recovery_database(
        source_directory.join(DATABASE_FILE),
        directory.join(DATABASE_FILE),
        source_backup.clone(),
    )
    .await?;
    verify_recovery_database(&directory, &source_backup).await?;

    let receipt = WorkspaceRecoveryReceipt {
        format_version: 1,
        operation_id,
        recovered_at_unix_ms: SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|_| failure("clock"))?
            .as_millis()
            .try_into()
            .map_err(|_| failure("clock"))?,
        source_backup,
    };
    let serialized =
        serde_json::to_vec_pretty(&receipt).map_err(|_| failure("recovery-receipt"))?;
    if serialized.len() as u64 > MAX_RECEIPT_BYTES {
        return Err(failure("recovery-receipt-limit"));
    }
    let mut pending = OpenOptions::new()
        .create_new(true)
        .write(true)
        .open(directory.join("recovery.pending"))
        .map_err(|_| failure("recovery-receipt"))?;
    pending
        .write_all(&serialized)
        .and_then(|_| pending.sync_all())
        .map_err(|_| failure("recovery-receipt"))?;
    drop(pending);
    fs::rename(
        directory.join("recovery.pending"),
        directory.join("recovery.json"),
    )
    .map_err(|_| failure("recovery-receipt"))?;
    Ok(WorkspaceRecoveryArtifact { directory, receipt })
}

/// Verifies the completed disposable artifact against a trusted native schema.
/// A receipt is an integrity record, not authentication or authority to restore.
pub async fn verify_disposable_workspace_recovery(
    directory: &Path,
    app_identifier: &str,
    reference_pool: &SqlitePool,
    max_database_bytes: u64,
) -> Result<WorkspaceRecoveryReceipt, CanonicalError> {
    validate_directory(directory)?;
    let receipt_path = directory.join("recovery.json");
    if file_size(&receipt_path)? > MAX_RECEIPT_BYTES {
        return Err(failure("recovery-receipt-limit"));
    }
    let mut bytes = Vec::new();
    File::open(receipt_path)
        .map_err(|_| failure("recovery-receipt"))?
        .take(MAX_RECEIPT_BYTES + 1)
        .read_to_end(&mut bytes)
        .map_err(|_| failure("recovery-receipt"))?;
    if bytes.len() as u64 > MAX_RECEIPT_BYTES {
        return Err(failure("recovery-receipt-limit"));
    }
    let receipt: WorkspaceRecoveryReceipt =
        serde_json::from_slice(&bytes).map_err(|_| failure("recovery-receipt"))?;
    if receipt.format_version != 1
        || uuid::Uuid::parse_str(&receipt.operation_id)
            .map(|id| id.to_string() != receipt.operation_id)
            .unwrap_or(true)
        || directory.file_name().and_then(|name| name.to_str())
            != Some(format!("recovery-{}", receipt.operation_id).as_str())
    {
        return Err(failure("recovery-identity"));
    }
    let reference_schema = recovery_reference_schema(reference_pool).await?;
    validate_recovery_source(
        &receipt.source_backup,
        app_identifier,
        &reference_schema,
        max_database_bytes,
    )?;
    verify_recovery_database(directory, &receipt.source_backup).await?;
    Ok(receipt)
}

#[cfg(test)]
mod backup_budget_tests {
    use super::*;

    #[test]
    fn sqlite_progress_budget_interrupts_an_executing_query() {
        let runtime = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();
        runtime.block_on(async {
            let mut connection = SqliteConnection::connect("sqlite::memory:").await.unwrap();
            let budget = BackupBudget::new(1024 * 1024, Duration::from_millis(50)).unwrap();
            apply_budget(&mut connection, Some(budget)).await.unwrap();
            let result = sqlx::query_scalar::<_, i64>(
                "WITH RECURSIVE n(x) AS (VALUES(1) UNION ALL SELECT x+1 FROM n WHERE x<100000000) SELECT SUM(x) FROM n"
            ).fetch_one(&mut connection).await;
            assert_eq!(result.unwrap_err().as_database_error().unwrap().code().as_deref(), Some("9"));
            connection.close().await.unwrap();
        });
    }
}

#[cfg(test)]
mod recovery_stream_tests {
    use super::*;

    #[test]
    fn recovery_copy_rejects_changed_truncated_or_extra_bytes() {
        let expected = b"synthetic database bytes";
        let hash = hex::encode(Sha256::digest(expected));
        for input in [
            b"synthetic database byteX".as_slice(),
            b"synthetic database".as_slice(),
            b"synthetic database bytes plus trailing bytes".as_slice(),
        ] {
            let mut output = Vec::new();
            let error =
                copy_verified_stream(input, &mut output, expected.len() as u64, &hash).unwrap_err();
            assert_eq!(error.details["stage"], "recovery-copy-identity");
        }
        let mut output = Vec::new();
        copy_verified_stream(
            expected.as_slice(),
            &mut output,
            expected.len() as u64,
            &hash,
        )
        .unwrap();
        assert_eq!(output, expected);
    }

    #[test]
    fn recovery_copy_propagates_a_mid_stream_write_failure() {
        struct InterruptedWriter(Vec<u8>);
        impl Write for InterruptedWriter {
            fn write(&mut self, bytes: &[u8]) -> std::io::Result<usize> {
                if !self.0.is_empty() {
                    return Err(std::io::Error::other("synthetic write interruption"));
                }
                self.0.extend_from_slice(bytes);
                Ok(bytes.len())
            }
            fn flush(&mut self) -> std::io::Result<()> {
                Ok(())
            }
        }
        let input = vec![b'x'; 128 * 1024];
        let hash = hex::encode(Sha256::digest(&input));
        let mut writer = InterruptedWriter(Vec::new());
        let error = copy_verified_stream(input.as_slice(), &mut writer, input.len() as u64, &hash)
            .unwrap_err();
        assert_eq!(error.details["stage"], "recovery-copy");
        assert_eq!(writer.0.len(), 64 * 1024);
    }
}
