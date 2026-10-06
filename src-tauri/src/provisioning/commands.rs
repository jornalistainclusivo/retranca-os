use super::download::download_model_file;
use super::hardware::{check_hardware, HardwareCapabilities};
use super::ollama::{check_ollama_capabilities, OllamaStatus};
use super::security::{
    atomic_install, get_trust_anchor, verify_file_hash, verify_manifest_signature,
};
use crate::provider_policy::{require_development_fixtures, DEV_FIXTURES_ENABLED};
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, Manager};
use tokio::sync::{mpsc, Mutex};

/// Estado global para rastrear os canais de cancelamento de download.
/// A chave é o `job_id`.
pub struct DownloadRegistry(pub Mutex<std::collections::HashMap<String, mpsc::Sender<()>>>);

pub fn get_manifest_url() -> Result<String, String> {
    require_development_fixtures()?;
    Ok(option_env!("DEV_MODEL_MANIFEST_URL")
        .or(option_env!("PROD_MODEL_MANIFEST_URL"))
        .unwrap_or("http://127.0.0.1:3142/manifest.json")
        .to_string())
}

#[derive(serde::Serialize)]
pub struct PreflightResult {
    hardware: HardwareCapabilities,
    model_exists: bool,
    ollama: OllamaStatus,
    sidecar_ready: bool,
    development_fixtures_enabled: bool,
    selected_provider: String,
}

#[tauri::command]
pub async fn preflight_check(app: AppHandle) -> Result<PreflightResult, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app_data_dir: {}", e))?;

    // Certificar-se de que o diretório existe
    std::fs::create_dir_all(&app_data_dir).map_err(|e| e.to_string())?;

    let hw = check_hardware(&app_data_dir);

    // Normal builds do not inspect or hash a legacy synthetic model.
    let model_exists = if DEV_FIXTURES_ENABLED {
        fixture_model_exists(&app_data_dir).await
    } else {
        false
    };

    let ollama = check_ollama_capabilities().await;
    let bundled_sidecar_exists = DEV_FIXTURES_ENABLED
        && tauri::utils::platform::current_exe()
            .ok()
            .and_then(|executable| crate::sidecar_path::resolve_bundled_sidecar(&executable).ok())
            .is_some();
    let sidecar_ready = model_exists && bundled_sidecar_exists;

    let selected_provider = determine_provider(&ollama, sidecar_ready);

    Ok(PreflightResult {
        hardware: hw,
        model_exists,
        ollama,
        sidecar_ready,
        development_fixtures_enabled: DEV_FIXTURES_ENABLED,
        selected_provider,
    })
}

async fn fixture_model_exists(app_data_dir: &std::path::Path) -> bool {
    let local_manifest_path = app_data_dir.join("manifest.json");
    let mut model_exists = false;

    if local_manifest_path.exists() {
        if let Ok(manifest_text) = std::fs::read_to_string(&local_manifest_path) {
            // Validar assinatura contra o Trust Anchor
            let trust_anchor = get_trust_anchor();
            if let Ok(manifest) = verify_manifest_signature(&manifest_text, &trust_anchor) {
                let model_path = app_data_dir.join(&manifest.filename);
                // Verificar se o arquivo existe
                if model_path.exists() {
                    if let Ok(metadata) = std::fs::metadata(&model_path) {
                        // Verificar o tamanho
                        if metadata.len() == manifest.size {
                            // Verificar SHA-256 em thread separada
                            let model_path_clone = model_path.clone();
                            let expected_hash = manifest.sha256.clone();
                            let sha256_matches = tauri::async_runtime::spawn_blocking(move || {
                                verify_file_hash(&model_path_clone, &expected_hash).is_ok()
                            })
                            .await
                            .unwrap_or(false);

                            if sha256_matches {
                                model_exists = true;
                            }
                        }
                    }
                }
            }
        }
    }

    model_exists
}

#[tauri::command]
pub async fn download_model(
    app: AppHandle,
    registry: tauri::State<'_, DownloadRegistry>,
    job_id: String,
) -> Result<(), String> {
    // Deny before app-data access, job registration, trust-anchor use or network.
    let manifest_url = get_manifest_url()?;
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app_data_dir: {}", e))?;

    let (cancel_tx, cancel_rx) = mpsc::channel(1);

    {
        let mut map = registry.0.lock().await;
        if map.contains_key(&job_id) {
            return Err("Download for this job_id is already in progress".into());
        }
        map.insert(job_id.clone(), cancel_tx);
    }

    // A partir daqui, usaremos uma função interna para capturar erros e limpar o registry
    let result = execute_download_pipeline(
        app.clone(),
        job_id.clone(),
        manifest_url,
        app_data_dir,
        cancel_rx,
    )
    .await;

    // Remover do registry após término (sucesso ou falha)
    {
        let mut map = registry.0.lock().await;
        map.remove(&job_id);
    }

    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cancel_download(
    registry: tauri::State<'_, DownloadRegistry>,
    job_id: String,
) -> Result<(), String> {
    let mut map = registry.0.lock().await;
    if let Some(tx) = map.remove(&job_id) {
        let _ = tx.send(()).await;
        Ok(())
    } else {
        Err("No active download found for this job_id".into())
    }
}

async fn execute_download_pipeline(
    app: AppHandle,
    job_id: String,
    manifest_url: String,
    app_data_dir: PathBuf,
    cancel_rx: mpsc::Receiver<()>,
) -> Result<(), String> {
    let client = reqwest::Client::new();

    // 1. Fetch Manifest
    let manifest_resp = client
        .get(&manifest_url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch manifest: {}", e))?;
    let manifest_resp = manifest_resp
        .error_for_status()
        .map_err(|e| format!("HTTP error fetching manifest: {}", e))?;
    let manifest_text = manifest_resp
        .text()
        .await
        .map_err(|e| format!("Failed to read manifest text: {}", e))?;

    // 2. Verify Signature
    let trust_anchor = get_trust_anchor();
    let manifest = verify_manifest_signature(&manifest_text, &trust_anchor)
        .map_err(|e| format!("Security validation failed: {}", e))?;

    let tmp_path = app_data_dir.join(format!("{}.tmp", manifest.filename));
    let final_path = app_data_dir.join(&manifest.filename);

    // 3. Download to .tmp (handles resume and progress emitting)
    download_model_file(
        app.clone(),
        job_id.clone(),
        &manifest.download_url,
        &tmp_path,
        manifest.size,
        cancel_rx,
    )
    .await
    .map_err(|e| format!("Download failed: {}", e))?;

    // 4. Emite evento de VERIFYING (UI pode escutar se quiser)
    let _ = app.emit("download-verifying", &job_id);

    // 5. Verify SHA-256 hash of the downloaded .tmp file
    // Isso pode bloquear a thread de async (sendo pesado), o ideal é usar spawn_blocking
    let tmp_path_clone = tmp_path.clone();
    let expected_sha256 = manifest.sha256.clone();

    tauri::async_runtime::spawn_blocking(move || {
        verify_file_hash(&tmp_path_clone, &expected_sha256)
    })
    .await
    .map_err(|e| format!("Join error during hash verification: {}", e))?
    .map_err(|e| {
        // Hash falhou, deletar arquivo corrompido
        let _ = std::fs::remove_file(&tmp_path);
        format!("Corrupted model, hash mismatch: {}", e)
    })?;

    // 6. Atomic Install
    atomic_install(&tmp_path, &final_path)
        .map_err(|e| format!("Failed to install model: {}", e))?;

    // 6.1 Save manifest locally
    let local_manifest_path = app_data_dir.join("manifest.json");
    std::fs::write(&local_manifest_path, &manifest_text)
        .map_err(|e| format!("Failed to save manifest locally: {}", e))?;

    // 7. Emit READY
    let _ = app.emit("download-ready", &job_id);

    Ok(())
}

pub fn determine_provider(ollama: &OllamaStatus, sidecar_ready: bool) -> String {
    if DEV_FIXTURES_ENABLED && sidecar_ready && (!ollama.reachable || ollama.models.is_empty()) {
        "SIDECAR".to_string()
    } else {
        // Route selection is not readiness. Every generation checks the daemon.
        "OLLAMA".to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::provisioning::ollama::OllamaStatus;

    #[test]
    fn test_provider_selection_case_a() {
        // Case A: Sidecar READY, Ollama reachable, Ollama has models => OLLAMA
        let ollama = OllamaStatus {
            detected: true,
            endpoint: "http://127.0.0.1:11434".to_string(),
            reachable: true,
            models: vec!["model1".to_string()],
        };
        let sidecar_ready = true;
        assert_eq!(determine_provider(&ollama, sidecar_ready), "OLLAMA");
    }

    #[test]
    fn test_provider_selection_case_b() {
        // Case B: Sidecar NOT READY, Ollama reachable, Ollama has at least one model => OLLAMA
        let ollama = OllamaStatus {
            detected: true,
            endpoint: "http://127.0.0.1:11434".to_string(),
            reachable: true,
            models: vec!["model1".to_string()],
        };
        let sidecar_ready = false;
        assert_eq!(determine_provider(&ollama, sidecar_ready), "OLLAMA");
    }

    #[test]
    fn test_provider_selection_case_c() {
        // An empty catalog retains the supported route, never grants dispatch.
        let ollama = OllamaStatus {
            detected: true,
            endpoint: "http://127.0.0.1:11434".to_string(),
            reachable: true,
            models: vec![],
        };
        let sidecar_ready = false;
        assert_eq!(determine_provider(&ollama, sidecar_ready), "OLLAMA");
    }

    #[test]
    fn test_provider_selection_case_d() {
        // Starting Ollama later must not leave a cached NONE route.
        let ollama = OllamaStatus {
            detected: false,
            endpoint: "http://127.0.0.1:11434".to_string(),
            reachable: false,
            models: vec![],
        };
        let sidecar_ready = false;
        assert_eq!(determine_provider(&ollama, sidecar_ready), "OLLAMA");
    }

    #[test]
    fn test_provider_selection_sidecar_fallback() {
        // Sidecar presence only matters in an explicitly enabled debug fixture.
        let ollama = OllamaStatus {
            detected: false,
            endpoint: "http://127.0.0.1:11434".to_string(),
            reachable: false,
            models: vec![],
        };
        let sidecar_ready = true;
        assert_eq!(
            determine_provider(&ollama, sidecar_ready),
            if DEV_FIXTURES_ENABLED {
                "SIDECAR"
            } else {
                "OLLAMA"
            }
        );
    }

    #[test]
    fn manifest_source_is_unavailable_outside_explicit_debug_fixtures() {
        let result = get_manifest_url();
        assert_eq!(result.is_ok(), DEV_FIXTURES_ENABLED);
        if !DEV_FIXTURES_ENABLED {
            assert!(result.unwrap_err().starts_with("UNSUPPORTED_CAPABILITY:"));
        }
    }
}
