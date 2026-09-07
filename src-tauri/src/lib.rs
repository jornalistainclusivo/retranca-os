pub mod ai_supervisor;
pub mod hardware;
pub mod provisioning;

use ai_supervisor::{cancel_inference, start_inference, JobRegistry};
use std::collections::HashMap;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .manage(JobRegistry(Mutex::new(HashMap::new())))
        .invoke_handler(tauri::generate_handler![start_inference, cancel_inference])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
