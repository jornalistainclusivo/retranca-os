pub mod ai_supervisor;
pub mod article_content;
pub mod models;
pub mod ollama_gateway;
pub mod orchestrator;
pub mod phase64;
pub mod provisioning;

#[cfg(debug_assertions)]
use ai_supervisor::start_inference;
#[cfg(debug_assertions)]
use ollama_gateway::start_ollama_inference;

use ai_supervisor::{cancel_inference, JobRegistry};
use ollama_gateway::{cancel_ollama_inference, get_ollama_models, OllamaJobRegistry};
use provisioning::commands::{cancel_download, download_model, preflight_check, DownloadRegistry};
use std::collections::HashMap;
use std::sync::Mutex as StdMutex;
use tokio::sync::Mutex as AsyncMutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .manage(JobRegistry(StdMutex::new(HashMap::new())))
        .manage(OllamaJobRegistry::default())
        .manage(DownloadRegistry(AsyncMutex::new(HashMap::new())))
        .invoke_handler(tauri::generate_handler![
            #[cfg(debug_assertions)]
            start_inference,
            #[cfg(debug_assertions)]
            start_ollama_inference,
            cancel_inference,
            cancel_ollama_inference,
            preflight_check,
            download_model,
            cancel_download,
            get_ollama_models,
            article_content::migrate_article_content,
            orchestrator::start_orchestrated_inference,
            phase64::get_workflow_stages,
            phase64::get_categories,
            phase64::get_checklist_templates,
            phase64::assign_article_stage,
            phase64::assign_article_category,
            phase64::apply_checklist_template,
            phase64::create_workflow_stage,
            phase64::update_workflow_stage,
            phase64::reorder_workflow_stages,
            phase64::remove_workflow_stage,
            phase64::create_category,
            phase64::rename_category,
            phase64::remove_category,
            phase64::create_checklist_template,
            phase64::update_checklist_template,
            phase64::delete_checklist_template,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
