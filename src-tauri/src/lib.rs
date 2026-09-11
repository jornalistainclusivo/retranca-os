pub mod ai_supervisor;
pub mod entitlements;
pub mod ollama_gateway;
pub mod provisioning;
pub mod models;
pub mod orchestrator;

#[cfg(debug_assertions)]
use ai_supervisor::start_inference;
#[cfg(debug_assertions)]
use ollama_gateway::start_ollama_inference;

use ai_supervisor::{cancel_inference, JobRegistry};
use entitlements::{get_entitlements, set_developer_premium};
use ollama_gateway::get_ollama_models;
use provisioning::commands::{cancel_download, download_model, preflight_check, DownloadRegistry};
use std::collections::HashMap;
use std::sync::Mutex as StdMutex;
use tokio::sync::Mutex as AsyncMutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .manage(JobRegistry(StdMutex::new(HashMap::new())))
        .manage(DownloadRegistry(AsyncMutex::new(HashMap::new())))
        .invoke_handler(tauri::generate_handler![
            #[cfg(debug_assertions)]
            start_inference,
            #[cfg(debug_assertions)]
            start_ollama_inference,
            cancel_inference,
            preflight_check,
            download_model,
            cancel_download,
            get_entitlements,
            set_developer_premium,
            get_ollama_models,
            orchestrator::start_orchestrated_inference,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
