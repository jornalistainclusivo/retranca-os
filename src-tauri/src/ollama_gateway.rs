use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::future::{poll_fn, Future};
use std::pin::Pin;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::sync::{oneshot, watch};

struct OllamaJob {
    cancel: Option<oneshot::Sender<()>>,
    finished: watch::Receiver<bool>,
}

/// Keep cancellation registered until the HTTP future has been dropped and its terminal event emitted.
#[derive(Clone, Default)]
pub struct OllamaJobRegistry(Arc<Mutex<HashMap<String, OllamaJob>>>);

impl OllamaJobRegistry {
    fn register(
        &self,
        job_id: &str,
    ) -> Result<(oneshot::Receiver<()>, watch::Sender<bool>), String> {
        let mut jobs = self.0.lock().map_err(|e| e.to_string())?;
        if jobs.contains_key(job_id) {
            return Err(format!("Job {} is already running", job_id));
        }
        let (cancel, receiver) = oneshot::channel();
        let (finished, completion) = watch::channel(false);
        jobs.insert(
            job_id.to_string(),
            OllamaJob {
                cancel: Some(cancel),
                finished: completion,
            },
        );
        Ok((receiver, finished))
    }

    async fn cancel(&self, job_id: &str) -> Result<(), String> {
        let (cancel, mut finished) = {
            let mut jobs = self.0.lock().map_err(|e| e.to_string())?;
            // Completion may win the race with a user's cancel click.
            let Some(job) = jobs.get_mut(job_id) else {
                return Ok(());
            };
            (job.cancel.take(), job.finished.clone())
        };
        if let Some(cancel) = cancel {
            let _ = cancel.send(());
        }
        if !*finished.borrow() {
            finished
                .wait_for(|done| *done)
                .await
                .map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    fn finish(&self, job_id: &str) -> Result<(), String> {
        self.0.lock().map_err(|e| e.to_string())?.remove(job_id);
        Ok(())
    }
}

#[derive(Debug, PartialEq)]
enum InferenceOutcome {
    Completed,
    Canceled,
    Error(String),
}

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
    #[serde(default)]
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
    buffer: Vec<u8>,
}

impl NdJsonStreamParser {
    pub fn new() -> Self {
        Self { buffer: Vec::new() }
    }

    pub fn push_chunk(&mut self, chunk: &[u8]) -> Result<Vec<OllamaGenerateResponse>, String> {
        let mut results = Vec::new();
        self.buffer.extend_from_slice(chunk);
        while let Some(pos) = self.buffer.iter().position(|byte| *byte == b'\n') {
            let line: Vec<u8> = self.buffer.drain(..=pos).collect();
            if line.iter().all(u8::is_ascii_whitespace) {
                continue;
            }
            let value: serde_json::Value = serde_json::from_slice(&line)
                .map_err(|e| format!("Invalid Ollama stream data: {}", e))?;
            if let Some(error) = value.get("error").and_then(|v| v.as_str()) {
                return Err(format!("Ollama generation failed: {}", error));
            }
            results.push(
                serde_json::from_value(value)
                    .map_err(|e| format!("Invalid Ollama stream response: {}", e))?,
            );
        }
        Ok(results)
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

async fn stream_response(
    client: &Client,
    base_url: &str,
    model: &str,
    prompt: &str,
    mut emit_token: impl FnMut(String),
) -> Result<(), String> {
    if !validate_model(client, base_url, model).await? {
        return Err(format!("Model {} is not available in local Ollama", model));
    }
    let mut response = client
        .post(format!("{}/api/generate", base_url))
        .json(&OllamaGenerateRequest {
            model,
            prompt,
            stream: true,
        })
        .send()
        .await
        .map_err(|e| format!("Failed to connect to Ollama: {}", e))?;
    if !response.status().is_success() {
        return Err(format!(
            "Ollama returned error status: {}",
            response.status()
        ));
    }
    let mut parser = NdJsonStreamParser::new();
    while let Some(chunk) = response
        .chunk()
        .await
        .map_err(|e| format!("Ollama stream interrupted: {}", e))?
    {
        for parsed in parser.push_chunk(&chunk)? {
            if !parsed.response.is_empty() {
                emit_token(parsed.response);
            }
            if parsed.done {
                return Ok(());
            }
        }
    }
    // NDJSON may omit the final newline; still require an explicit completion marker.
    for parsed in parser.push_chunk(b"\n")? {
        if !parsed.response.is_empty() {
            emit_token(parsed.response);
        }
        if parsed.done {
            return Ok(());
        }
    }
    Err("Ollama stream ended before its completion marker".to_string())
}

async fn run_cancellable_request(
    client: &Client,
    base_url: &str,
    model: &str,
    prompt: &str,
    mut cancel: oneshot::Receiver<()>,
    emit_token: impl FnMut(String),
) -> InferenceOutcome {
    let mut request = Box::pin(stream_response(client, base_url, model, prompt, emit_token));
    poll_fn(|cx| {
        // Check cancellation first, including when both futures are ready.
        if Pin::new(&mut cancel).poll(cx).is_ready() {
            return std::task::Poll::Ready(InferenceOutcome::Canceled);
        }
        request.as_mut().poll(cx).map(|result| match result {
            Ok(()) => InferenceOutcome::Completed,
            Err(error) => InferenceOutcome::Error(error),
        })
    })
    .await
}

pub async fn start_ollama_inference_internal(
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
    let client = Client::builder()
        .timeout(Duration::from_secs(300))
        .build()
        .map_err(|e| e.to_string())?;
    let registry = app.state::<OllamaJobRegistry>().inner().clone();
    let (cancel, finished) = registry.register(&job_id)?;

    // Fire non-blocking task
    tauri::async_runtime::spawn(async move {
        let outcome = run_cancellable_request(
            &client,
            "http://127.0.0.1:11434",
            &model,
            &prompt,
            cancel,
            |token| {
                let _ = app.emit(
                    "ai-stream-token",
                    TokenEvent {
                        job_id: job_id.clone(),
                        token,
                    },
                );
            },
        )
        .await;
        // The request/response future is already dropped before any terminal event or acknowledgement.
        match outcome {
            InferenceOutcome::Completed => {
                let _ = app.emit(
                    "ai-stream-done",
                    DoneEvent {
                        job_id: job_id.clone(),
                    },
                );
            }
            InferenceOutcome::Canceled => {
                let _ = app.emit(
                    "ai-stream-canceled",
                    DoneEvent {
                        job_id: job_id.clone(),
                    },
                );
            }
            InferenceOutcome::Error(message) => {
                let _ = app.emit(
                    "ai-stream-error",
                    ErrorEvent {
                        job_id: job_id.clone(),
                        message,
                    },
                );
            }
        }
        let _ = registry.finish(&job_id);
        let _ = finished.send(true);
    });

    Ok(())
}

/// Cancel the registered HTTP task and await transport teardown; server-side compute is not guaranteed.
#[tauri::command]
pub async fn cancel_ollama_inference(
    registry: State<'_, OllamaJobRegistry>,
    job_id: String,
) -> Result<(), String> {
    registry.cancel(&job_id).await
}

#[cfg(debug_assertions)]
#[tauri::command]
pub async fn start_ollama_inference(
    app: AppHandle,
    job_id: String,
    model: String,
    prompt: String,
) -> Result<(), String> {
    start_ollama_inference_internal(app, job_id, model, prompt).await
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
    use std::io::{Read, Write};
    use std::net::TcpListener;
    use std::sync::atomic::{AtomicUsize, Ordering};

    #[test]
    fn parser_preserves_split_utf8_and_reports_provider_errors() {
        let line = "{\"response\":\"reunião\",\"done\":false}\n".as_bytes();
        let split = line.iter().position(|byte| *byte == 0xc3).unwrap() + 1;
        let mut parser = NdJsonStreamParser::new();
        assert!(parser.push_chunk(&line[..split]).unwrap().is_empty());
        assert_eq!(
            parser.push_chunk(&line[split..]).unwrap()[0].response,
            "reunião"
        );
        assert!(parser
            .push_chunk(b"{\"error\":\"out of memory\"}\n")
            .unwrap_err()
            .contains("out of memory"));
        assert!(NdJsonStreamParser::new()
            .push_chunk(b"invalid json\n")
            .is_err());
    }

    #[test]
    fn stream_requires_completion_and_exposes_errors() {
        tokio::runtime::Runtime::new().unwrap().block_on(async {
            let mut server = mockito::Server::new_async().await;
            let tags = server.mock("GET", "/api/tags")
                .with_body(r#"{"models":[{"name":"installed-test-model"}]}"#).expect(4).create_async().await;
            for (body, expected) in [
                ("{\"response\":\"reunião\",\"done\":false}\n{\"done\":true}", InferenceOutcome::Completed),
                ("{\"response\":\"partial\",\"done\":false}\n", InferenceOutcome::Error("completion marker".into())),
                ("{\"error\":\"out of memory\"}\n", InferenceOutcome::Error("out of memory".into())),
                ("invalid json\n", InferenceOutcome::Error("Invalid Ollama stream data".into())),
            ] {
                let generate = server.mock("POST", "/api/generate").with_body(body).create_async().await;
                let (_cancel, receiver) = oneshot::channel();
                let mut tokens = Vec::new();
                let outcome = run_cancellable_request(&Client::new(), &server.url(), "installed-test-model", "public test", receiver, |token| tokens.push(token)).await;
                match expected {
                    InferenceOutcome::Completed => { assert_eq!(outcome, expected); assert_eq!(tokens, ["reunião"]); }
                    InferenceOutcome::Error(message) => assert!(matches!(outcome, InferenceOutcome::Error(error) if error.contains(&message))),
                    _ => unreachable!(),
                }
                generate.assert_async().await;
                generate.remove_async().await;
            }
            tags.assert_async().await;
        });
    }

    #[test]
    fn pre_canceled_request_does_not_contact_provider() {
        tokio::runtime::Runtime::new().unwrap().block_on(async {
            let (sender, receiver) = oneshot::channel();
            sender.send(()).unwrap();
            let result = run_cancellable_request(
                &Client::new(),
                "http://127.0.0.1:0",
                "installed-test-model",
                "test",
                receiver,
                |_| panic!("Canceled request emitted a token"),
            )
            .await;
            assert_eq!(result, InferenceOutcome::Canceled);
        });
    }

    #[test]
    fn registry_waits_for_teardown_and_rejects_duplicate_jobs() {
        tokio::runtime::Runtime::new().unwrap().block_on(async {
            let registry = OllamaJobRegistry::default();
            let (receiver, finished) = registry.register("job").unwrap();
            assert!(registry.register("job").is_err());
            let worker_registry = registry.clone();
            let worker = tokio::spawn(async move {
                receiver.await.unwrap();
                assert!(worker_registry.register("job").is_err());
                worker_registry.finish("job").unwrap();
                finished.send(true).unwrap();
            });
            let first = tokio::spawn({
                let registry = registry.clone();
                async move { registry.cancel("job").await }
            });
            registry.cancel("job").await.unwrap();
            first.await.unwrap().unwrap();
            worker.await.unwrap();
            assert!(registry.0.lock().unwrap().is_empty());
            registry.cancel("unknown-or-finished").await.unwrap();
            assert!(registry.register("job").is_ok());
        });
    }

    #[test]
    fn cancellation_drops_a_live_stream_before_acknowledgement() {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let base = format!("http://{}", listener.local_addr().unwrap());
        let server = std::thread::spawn(move || {
            // Use separate connections so the assertion observes only the generation transport.
            for generation in [false, true] {
                let (mut stream, _) = listener.accept().unwrap();
                stream
                    .set_read_timeout(Some(Duration::from_secs(5)))
                    .unwrap();
                let mut request = Vec::new();
                let mut byte = [0];
                while !request.ends_with(b"\r\n\r\n") {
                    stream.read_exact(&mut byte).unwrap();
                    request.push(byte[0]);
                }
                let headers = String::from_utf8(request).unwrap();
                let length = headers
                    .lines()
                    .find_map(|line| {
                        line.to_ascii_lowercase()
                            .strip_prefix("content-length:")
                            .map(|value| value.trim().parse::<usize>().unwrap())
                    })
                    .unwrap_or(0);
                stream.read_exact(&mut vec![0; length]).unwrap();
                if !generation {
                    let body = r#"{"models":[{"name":"installed-test-model"}]}"#;
                    write!(
                        stream,
                        "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                        body.len(),
                        body
                    )
                    .unwrap();
                } else {
                    let body = "{\"response\":\"first\",\"done\":false}\n";
                    write!(stream, "HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\nConnection: close\r\n\r\n{:x}\r\n{}\r\n", body.len(), body).unwrap();
                    stream.flush().unwrap();
                    match stream.read(&mut byte) {
                        Ok(0) => (),
                        Err(error)
                            if matches!(
                                error.kind(),
                                std::io::ErrorKind::ConnectionReset
                                    | std::io::ErrorKind::ConnectionAborted
                            ) =>
                        {
                            ()
                        }
                        other => panic!("Transport was not closed by cancellation: {:?}", other),
                    }
                }
            }
        });
        tokio::runtime::Runtime::new().unwrap().block_on(async {
            let registry = OllamaJobRegistry::default();
            let (cancel, finished) = registry.register("stream").unwrap();
            let (ready, received_token) = oneshot::channel();
            let count = Arc::new(AtomicUsize::new(0));
            let worker_count = count.clone();
            let worker_registry = registry.clone();
            let worker = tokio::spawn(async move {
                let mut ready = Some(ready);
                let outcome = run_cancellable_request(
                    &Client::new(),
                    &base,
                    "installed-test-model",
                    "public test",
                    cancel,
                    |_| {
                        worker_count.fetch_add(1, Ordering::SeqCst);
                        if let Some(ready) = ready.take() {
                            ready.send(()).unwrap();
                        }
                    },
                )
                .await;
                worker_registry.finish("stream").unwrap();
                finished.send(true).unwrap();
                outcome
            });
            tokio::time::timeout(Duration::from_secs(5), received_token)
                .await
                .unwrap()
                .unwrap();
            tokio::time::timeout(Duration::from_secs(5), registry.cancel("stream"))
                .await
                .unwrap()
                .unwrap();
            assert_eq!(worker.await.unwrap(), InferenceOutcome::Canceled);
            assert_eq!(count.load(Ordering::SeqCst), 1);
            assert!(registry.0.lock().unwrap().is_empty());
        });
        server.join().unwrap();
    }

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

        let res1 = parser.push_chunk(chunk1).unwrap();
        assert_eq!(res1.len(), 0, "Should not parse partial chunk");

        let res2 = parser.push_chunk(chunk2).unwrap();
        assert_eq!(res2.len(), 2, "Should parse two items after chunk boundary");
        assert_eq!(res2[0].response, "hel");
        assert_eq!(res2[1].response, "lo");
    }
}
