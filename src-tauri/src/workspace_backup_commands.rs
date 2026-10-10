//! Internal snapshot commands. No active restore, external path or deletion command.
use crate::phase64::{get_pool, CanonicalError};
use crate::workspace_backup::{
    create_workspace_backup_pool_bounded, file_size, reject_snapshot_sidecars, validate_directory,
    verify_workspace_backup_bounded, WorkspaceBackupReceipt, APPLICATION_IDS, DATABASE_FILE,
};
use serde::Serialize;
use sqlx::SqlitePool;
use std::fs;
use std::path::PathBuf;
use std::time::{Duration, UNIX_EPOCH};
use tauri::{AppHandle, Manager, State};
use tauri_plugin_sql::DbInstances;
use tokio::sync::Mutex;

pub const MAX_BACKUP_DATABASE_BYTES: u64 = 256 * 1024 * 1024;
pub const MAX_INTERNAL_BACKUPS: usize = 128;
const MAX_DIRECTORY_ENTRIES: usize = 4096;
const OPERATION_BUDGET: Duration = Duration::from_secs(120);

#[derive(Default)]
pub struct WorkspaceBackupOperations(Mutex<()>);

fn error(stage: &'static str, retryable: bool) -> CanonicalError {
    CanonicalError {
        code: "ERR_WORKSPACE_BACKUP".into(),
        retryable,
        details: serde_json::json!({ "stage": stage }),
    }
}

#[derive(Debug, Serialize)]
pub struct InternalBackupEntry {
    pub operation_id: String,
    pub modified_at_unix_ms: u64,
}

#[derive(Debug, Serialize)]
pub struct InternalBackupInventory {
    pub source_app_identifier: String,
    pub directory: String,
    pub entries: Vec<InternalBackupEntry>,
}

#[derive(Debug, Serialize)]
pub struct VerifiedInternalBackup {
    pub directory: String,
    pub receipt: WorkspaceBackupReceipt,
}

/// Constructed only with native application configuration, never frontend paths.
#[derive(Clone)]
pub struct ApplicationBackupStore {
    app_config_directory: PathBuf,
    app_identifier: String,
}

fn valid_operation_id(value: &str) -> bool {
    uuid::Uuid::parse_str(value)
        .is_ok_and(|id| id.get_version_num() == 4 && id.to_string() == value)
}

impl ApplicationBackupStore {
    pub fn new(
        app_config_directory: PathBuf,
        app_identifier: String,
    ) -> Result<Self, CanonicalError> {
        if !APPLICATION_IDS.contains(&app_identifier.as_str())
            || app_config_directory
                .file_name()
                .and_then(|name| name.to_str())
                != Some(app_identifier.as_str())
        {
            return Err(error("application", false));
        }
        validate_directory(&app_config_directory)?;
        Ok(Self {
            app_config_directory,
            app_identifier,
        })
    }

    fn root(&self) -> PathBuf {
        self.app_config_directory.join("backups")
    }

    fn root_exists(&self) -> Result<bool, CanonicalError> {
        validate_directory(&self.app_config_directory)?;
        match fs::symlink_metadata(self.root()) {
            Ok(_) => {
                validate_directory(&self.root())?;
                Ok(true)
            }
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(false),
            Err(_) => Err(error("directory", false)),
        }
    }

    fn inventory(&self) -> Result<InternalBackupInventory, CanonicalError> {
        let root = self.root();
        let mut entries = Vec::new();
        if self.root_exists()? {
            for (index, entry) in fs::read_dir(&root)
                .map_err(|_| error("inventory", true))?
                .enumerate()
            {
                if index >= MAX_DIRECTORY_ENTRIES {
                    return Err(error("inventory-limit", false));
                }
                let entry = entry.map_err(|_| error("inventory", true))?;
                let name = entry.file_name();
                let Some(id) = name
                    .to_str()
                    .and_then(|name| name.strip_prefix("workspace-"))
                    .filter(|id| valid_operation_id(id))
                else {
                    continue;
                };
                // Enumeration does not parse receipts or advertise a verified backup.
                validate_directory(&entry.path())?;
                let modified = fs::symlink_metadata(entry.path())
                    .map_err(|_| error("inventory", true))?
                    .modified()
                    .ok()
                    .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
                    .and_then(|duration| u64::try_from(duration.as_millis()).ok())
                    .unwrap_or(0);
                entries.push(InternalBackupEntry {
                    operation_id: id.to_owned(),
                    modified_at_unix_ms: modified,
                });
                if entries.len() > MAX_INTERNAL_BACKUPS {
                    return Err(error("inventory-limit", false));
                }
            }
        }
        entries.sort_by(|a, b| {
            b.modified_at_unix_ms
                .cmp(&a.modified_at_unix_ms)
                .then(a.operation_id.cmp(&b.operation_id))
        });
        Ok(InternalBackupInventory {
            source_app_identifier: self.app_identifier.clone(),
            directory: root
                .to_str()
                .ok_or_else(|| error("directory", false))?
                .into(),
            entries,
        })
    }

    async fn inventory_worker(&self) -> Result<InternalBackupInventory, CanonicalError> {
        let store = self.clone();
        tauri::async_runtime::spawn_blocking(move || store.inventory())
            .await
            .map_err(|_| error("inventory", true))?
    }

    pub async fn list(
        &self,
        operations: &WorkspaceBackupOperations,
    ) -> Result<InternalBackupInventory, CanonicalError> {
        let _guard = operations.0.try_lock().map_err(|_| error("busy", true))?;
        self.inventory_worker().await
    }

    pub async fn create(
        &self,
        operations: &WorkspaceBackupOperations,
        pool: &SqlitePool,
    ) -> Result<VerifiedInternalBackup, CanonicalError> {
        let _guard = operations.0.try_lock().map_err(|_| error("busy", true))?;
        let inventory = self.inventory_worker().await?;
        if inventory.entries.len() >= MAX_INTERNAL_BACKUPS {
            return Err(error("inventory-limit", false));
        }
        if !self.root_exists()? {
            fs::create_dir(self.root()).map_err(|_| error("create-directory", false))?;
        }
        validate_directory(&self.root())?;
        let artifact = create_workspace_backup_pool_bounded(
            pool,
            &self.root(),
            &self.app_identifier,
            MAX_BACKUP_DATABASE_BYTES,
            OPERATION_BUDGET,
        )
        .await?;
        self.verify_inner(&artifact.receipt.operation_id).await
    }

    async fn verify_inner(
        &self,
        operation_id: &str,
    ) -> Result<VerifiedInternalBackup, CanonicalError> {
        if !valid_operation_id(operation_id) {
            return Err(error("operation-id", false));
        }
        if !self.root_exists()? {
            return Err(error("directory", false));
        }
        let directory = self.root().join(format!("workspace-{operation_id}"));
        validate_directory(&directory)?;
        reject_snapshot_sidecars(&directory)?;
        if file_size(&directory.join(DATABASE_FILE))? > MAX_BACKUP_DATABASE_BYTES {
            return Err(error("database-limit", false));
        }
        let receipt = verify_workspace_backup_bounded(
            &directory,
            &self.app_identifier,
            MAX_BACKUP_DATABASE_BYTES,
            OPERATION_BUDGET,
        )
        .await?;
        reject_snapshot_sidecars(&directory)?;
        if receipt.operation_id != operation_id {
            return Err(error("receipt-identity", false));
        }
        Ok(VerifiedInternalBackup {
            directory: directory
                .to_str()
                .ok_or_else(|| error("directory", false))?
                .into(),
            receipt,
        })
    }

    pub async fn verify(
        &self,
        operations: &WorkspaceBackupOperations,
        operation_id: &str,
    ) -> Result<VerifiedInternalBackup, CanonicalError> {
        let _guard = operations.0.try_lock().map_err(|_| error("busy", true))?;
        self.verify_inner(operation_id).await
    }
}

fn native_store(app: &AppHandle) -> Result<ApplicationBackupStore, CanonicalError> {
    let config = app
        .path()
        .app_config_dir()
        .map_err(|_| error("directory", false))?;
    ApplicationBackupStore::new(config, app.config().identifier.clone())
}

#[tauri::command]
pub async fn list_workspace_backups(
    app: AppHandle,
    operations: State<'_, WorkspaceBackupOperations>,
) -> Result<InternalBackupInventory, CanonicalError> {
    native_store(&app)?.list(&operations).await
}

#[tauri::command]
pub async fn create_workspace_backup(
    app: AppHandle,
    operations: State<'_, WorkspaceBackupOperations>,
    instances: State<'_, DbInstances>,
) -> Result<VerifiedInternalBackup, CanonicalError> {
    let store = native_store(&app)?;
    let pool = get_pool(&instances)
        .await
        .map_err(|_| error("database-not-ready", true))?;
    store.create(&operations, &pool).await
}

#[tauri::command]
pub async fn verify_internal_workspace_backup(
    app: AppHandle,
    operations: State<'_, WorkspaceBackupOperations>,
    operation_id: String,
) -> Result<VerifiedInternalBackup, CanonicalError> {
    native_store(&app)?.verify(&operations, &operation_id).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn operation_guard_rejects_overlap_and_releases_without_deleting_files() {
        let runtime = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();
        runtime.block_on(async {
            let directory = tempfile::tempdir().unwrap();
            let config = directory.path().join(APPLICATION_IDS[2]);
            fs::create_dir(&config).unwrap();
            let store = ApplicationBackupStore::new(config, APPLICATION_IDS[2].into()).unwrap();
            let operations = WorkspaceBackupOperations::default();
            let guard = operations.0.lock().await;
            let failure = store.list(&operations).await.unwrap_err();
            assert_eq!(failure.details["stage"], "busy");
            assert!(failure.retryable);
            assert!(!store.root().exists());
            drop(guard);
            assert!(store.list(&operations).await.unwrap().entries.is_empty());
        });
    }
}
