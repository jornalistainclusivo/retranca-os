use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaStatus {
    pub detected: bool,
    pub endpoint: String,
    pub reachable: bool,
    pub models: Vec<String>,
}

#[derive(Deserialize)]
struct OllamaTagsResponse {
    models: Vec<OllamaModel>,
}

#[derive(Deserialize)]
struct OllamaModel {
    name: String,
}

/// Detects if Ollama is running and fetches the available models.
/// Uses a short timeout (e.g. 500ms) to avoid blocking startup if Ollama is down.
pub async fn check_ollama_capabilities() -> OllamaStatus {
    let endpoint = "http://127.0.0.1:11434".to_string();
    let url = format!("{}/api/tags", endpoint);

    let client = reqwest::Client::builder()
        .timeout(Duration::from_millis(500))
        .build();

    let client = match client {
        Ok(c) => c,
        Err(_) => {
            return OllamaStatus {
                detected: false,
                endpoint,
                reachable: false,
                models: vec![],
            }
        }
    };

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                if let Ok(tags) = response.json::<OllamaTagsResponse>().await {
                    let models = tags.models.into_iter().map(|m| m.name).collect();
                    OllamaStatus {
                        detected: true,
                        endpoint,
                        reachable: true,
                        models,
                    }
                } else {
                    OllamaStatus {
                        detected: true,
                        endpoint,
                        reachable: true,
                        models: vec![],
                    }
                }
            } else {
                OllamaStatus {
                    detected: true,
                    endpoint,
                    reachable: true,
                    models: vec![],
                }
            }
        }
        Err(_) => OllamaStatus {
            detected: false,
            endpoint,
            reachable: false,
            models: vec![],
        },
    }
}
