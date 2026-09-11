use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tauri::{AppHandle, Emitter};

#[derive(Serialize, Clone)]
struct TokenEvent {
    job_id: String,
    token: String,
}

#[derive(Serialize, Clone)]
struct DoneEvent {
    job_id: String,
}

#[derive(Serialize, Clone)]
struct ErrorEvent {
    job_id: String,
    message: String,
}

#[derive(Serialize)]
struct OllamaGenerateRequest<'a> {
    model: &'a str,
    prompt: &'a str,
    stream: bool,
}

#[derive(Deserialize)]
struct OllamaGenerateResponse {
    response: String,
    done: bool,
}

#[derive(Deserialize)]
struct OllamaTag {
    name: String,
}

#[derive(Deserialize)]
struct OllamaTagsResponse {
    models: Vec<OllamaTag>,
}

#[tauri::command]
pub async fn start_ollama_inference(
    app: AppHandle,
    job_id: String,
    model: String,
    prompt: String,
) -> Result<(), String> {
    let trimmed_model = model.trim();
    if trimmed_model.is_empty() {
        return Err("Model name cannot be empty".to_string());
    }
    if trimmed_model
        .chars()
        .any(|c| c.is_control() || c.is_whitespace())
    {
        return Err("Model name contains invalid characters".to_string());
    }
    let model = trimmed_model.to_string();

    let job_id_clone = job_id.clone();
    let app_clone = app.clone();

    // Fire non-blocking task
    tauri::async_runtime::spawn(async move {
        let client = Client::builder()
            .timeout(Duration::from_secs(300))
            .build()
            .unwrap_or_else(|_| Client::new());

        let req_body = OllamaGenerateRequest {
            model: &model,
            prompt: &prompt,
            stream: true,
        };

        // Validate model exists
        if let Ok(tags_resp) = client.get("http://127.0.0.1:11434/api/tags").send().await {
            if let Ok(tags) = tags_resp.json::<OllamaTagsResponse>().await {
                let model_exists = tags
                    .models
                    .iter()
                    .any(|t| t.name == model || t.name == format!("{}:latest", model));
                if !model_exists {
                    let _ = app_clone.emit(
                        "ai-stream-error",
                        ErrorEvent {
                            job_id: job_id_clone.clone(),
                            message: format!("Model {} is not available in local Ollama", model),
                        },
                    );
                    return;
                }
            }
        }

        match client
            .post("http://127.0.0.1:11434/api/generate")
            .json(&req_body)
            .send()
            .await
        {
            Ok(mut response) => {
                if !response.status().is_success() {
                    let _ = app_clone.emit(
                        "ai-stream-error",
                        ErrorEvent {
                            job_id: job_id_clone.clone(),
                            message: format!("Ollama returned error status: {}", response.status()),
                        },
                    );
                    return;
                }
                while let Ok(Some(chunk)) = response.chunk().await {
                    // Parse JSON chunks (Ollama sends NDJSON)
                    if let Ok(text) = std::str::from_utf8(&chunk) {
                        for line in text.lines() {
                            if line.trim().is_empty() {
                                continue;
                            }
                            if let Ok(parsed) = serde_json::from_str::<OllamaGenerateResponse>(line)
                            {
                                let _ = app_clone.emit(
                                    "ai-stream-token",
                                    TokenEvent {
                                        job_id: job_id_clone.clone(),
                                        token: parsed.response,
                                    },
                                );

                                if parsed.done {
                                    // Not strictly breaking the chunk loop, just stopping processing
                                }
                            }
                        }
                    }
                }

                let _ = app_clone.emit(
                    "ai-stream-done",
                    DoneEvent {
                        job_id: job_id_clone,
                    },
                );
            }
            Err(e) => {
                let _ = app_clone.emit(
                    "ai-stream-error",
                    ErrorEvent {
                        job_id: job_id_clone.clone(),
                        message: format!("Failed to connect to Ollama: {}", e),
                    },
                );
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn get_ollama_models() -> Result<Vec<String>, String> {
    let client = Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client
        .get("http://127.0.0.1:11434/api/tags")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(format!("Ollama API returned error: {}", resp.status()));
    }

    let tags = resp
        .json::<OllamaTagsResponse>()
        .await
        .map_err(|e| e.to_string())?;
    Ok(tags.models.into_iter().map(|m| m.name).collect())
}
