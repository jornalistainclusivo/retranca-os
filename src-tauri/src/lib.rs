pub mod ai_supervisor;
pub mod provisioning;
pub mod ollama_gateway;
use ai_supervisor::{cancel_inference, start_inference, JobRegistry};
use ollama_gateway::start_ollama_inference;
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
            start_inference, 
            cancel_inference,
            start_ollama_inference,
            preflight_check,
            download_model,
            cancel_download
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
