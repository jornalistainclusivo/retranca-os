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

#[derive(Deserialize, Debug, PartialEq)]
pub struct OllamaGenerateResponse {
    pub response: String,
    pub done: bool,
}

#[derive(Deserialize)]
pub struct OllamaTag {
    pub name: String,
}

#[derive(Deserialize)]
pub struct OllamaTagsResponse {
    pub models: Vec<OllamaTag>,
}

pub struct NdJsonStreamParser {
    buffer: String,
}

impl NdJsonStreamParser {
    pub fn new() -> Self {
        Self {
            buffer: String::new(),
        }
    }

    pub fn push_chunk(&mut self, chunk: &[u8]) -> Vec<OllamaGenerateResponse> {
        let mut results = Vec::new();
        if let Ok(text) = std::str::from_utf8(chunk) {
            self.buffer.push_str(text);
            while let Some(pos) = self.buffer.find('\n') {
                let line = self.buffer[..pos].trim().to_string();
                self.buffer.drain(..=pos);

                if line.is_empty() {
                    continue;
                }

                if let Ok(parsed) = serde_json::from_str::<OllamaGenerateResponse>(&line) {
                    results.push(parsed);
                }
            }
        }
        results
    }
}

pub async fn validate_model(client: &Client, base_url: &str, model: &str) -> Result<bool, String> {
    let tags_resp = client
        .get(format!("{}/api/tags", base_url))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !tags_resp.status().is_success() {
        return Err(format!("Invalid HTTP status: {}", tags_resp.status()));
    }

    let tags = tags_resp
        .json::<OllamaTagsResponse>()
        .await
        .map_err(|e| format!("Invalid JSON: {}", e))?;

    Ok(tags
        .models
        .iter()
        .any(|t| t.name == model || t.name == format!("{}:latest", model)))
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
        match validate_model(&client, "http://127.0.0.1:11434", &model).await {
            Ok(true) => {} // model exists
            Ok(false) => {
                let _ = app_clone.emit(
                    "ai-stream-error",
                    ErrorEvent {
                        job_id: job_id_clone.clone(),
                        message: format!("Model {} is not available in local Ollama", model),
                    },
                );
                return;
            }
            Err(e) => {
                let _ = app_clone.emit(
                    "ai-stream-error",
                    ErrorEvent {
                        job_id: job_id_clone.clone(),
                        message: format!("Model validation failed: {}", e),
                    },
                );
                return;
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
                let mut parser = NdJsonStreamParser::new();
                while let Ok(Some(chunk)) = response.chunk().await {
                    let parsed_results = parser.push_chunk(&chunk);
                    for parsed in parsed_results {
                        let _ = app_clone.emit(
                            "ai-stream-token",
                            TokenEvent {
                                job_id: job_id_clone.clone(),
                                token: parsed.response,
                            },
                        );
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_model_fails_closed_on_network_error() {
        tokio::runtime::Runtime::new().unwrap().block_on(async {
            let client = Client::new();
            let res = validate_model(&client, "http://127.0.0.1:0", "gemma4").await;
            assert!(res.is_err(), "Must fail closed on network error");
        });
    }

    #[test]
    fn test_validate_model_fails_closed_on_invalid_json() {
        tokio::runtime::Runtime::new().unwrap().block_on(async {
            let mut server = mockito::Server::new_async().await;
            let mock = server
                .mock("GET", "/api/tags")
                .with_status(200)
                .with_body("invalid json")
                .create_async()
                .await;

            let client = Client::new();
            let res = validate_model(&client, &server.url(), "gemma4").await;
            assert!(res.is_err(), "Must fail closed on invalid json");
            mock.assert_async().await;
        });
    }

    #[test]
    fn test_validate_model_fails_closed_on_invalid_status() {
        tokio::runtime::Runtime::new().unwrap().block_on(async {
            let mut server = mockito::Server::new_async().await;
            let mock = server
                .mock("GET", "/api/tags")
                .with_status(500)
                .create_async()
                .await;

            let client = Client::new();
            let res = validate_model(&client, &server.url(), "gemma4").await;
            assert!(res.is_err(), "Must fail closed on 500 status");
            mock.assert_async().await;
        });
    }

    #[test]
    fn test_ndjson_parser_tolerates_chunk_boundaries() {
        let mut parser = NdJsonStreamParser::new();
        let chunk1 = b"{\"response\":\"hel\",\"done\":false";
        let chunk2 = b"}\n{\"response\":\"lo\",\"done\":false}\n";

        let res1 = parser.push_chunk(chunk1);
        assert_eq!(res1.len(), 0, "Should not parse partial chunk");

        let res2 = parser.push_chunk(chunk2);
        assert_eq!(res2.len(), 2, "Should parse two items after chunk boundary");
        assert_eq!(res2[0].response, "hel");
        assert_eq!(res2[1].response, "lo");
    }
}
