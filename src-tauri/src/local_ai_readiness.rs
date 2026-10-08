//! Native metadata checks and a per-request local execution constraint.
//! The daemon is trusted; this is not process attestation or immutable model pinning.

use reqwest::{redirect::Policy, Client, Response};
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use std::collections::HashSet;
use std::time::Duration;

pub(crate) const OLLAMA_ENDPOINT: &str = "http://127.0.0.1:11434";
const SUPPORTED_SERVER_VERSIONS: &[&str] = &["0.35.1", "0.40.1"];
const CHECK_DEADLINE: Duration = Duration::from_secs(10);
const MAX_MODEL_UNITS: usize = 256;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ReadinessState {
    NoSelection,
    InvalidModel,
    ServerUnreachable,
    UnsupportedRuntime,
    ModelMissing,
    RemoteModel,
    UnsupportedCapability,
    VerificationFailed,
    Ready,
}

impl ReadinessState {
    fn code(self) -> &'static str {
        match self {
            Self::NoSelection => "NO_SELECTION",
            Self::InvalidModel => "INVALID_MODEL",
            Self::ServerUnreachable => "SERVER_UNREACHABLE",
            Self::UnsupportedRuntime => "UNSUPPORTED_RUNTIME",
            Self::ModelMissing => "MODEL_MISSING",
            Self::RemoteModel => "REMOTE_MODEL",
            Self::UnsupportedCapability => "UNSUPPORTED_CAPABILITY",
            Self::VerificationFailed => "VERIFICATION_FAILED",
            Self::Ready => "READY",
        }
    }

    fn message(self) -> &'static str {
        match self {
            Self::NoSelection => "Selecione um modelo em IA local.",
            Self::InvalidModel => "O nome do modelo selecionado é inválido.",
            Self::ServerUnreachable => "Não foi possível consultar o Ollama. Verifique se ele está em execução.",
            Self::UnsupportedRuntime => "A versão do servidor Ollama ainda não foi validada para execução local pelo Retranca. Esta versão do Retranca aceita os servidores 0.35.1 e 0.40.1.",
            Self::ModelMissing => "O modelo selecionado não está disponível. Atualize a lista de modelos.",
            Self::RemoteModel => "O modelo informado usa execução remota. Escolha um modelo instalado localmente.",
            Self::UnsupportedCapability => "Não foi possível confirmar a capacidade de geração de texto desse modelo.",
            Self::VerificationFailed => "Não foi possível verificar os dados do modelo com segurança. Atualize a lista e tente novamente.",
            Self::Ready => "Modelo disponível para geração de texto com execução local exigida na requisição.",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ExecutionEvidence {
    Unknown,
    LocalRequestEnforced,
}

#[derive(Debug, Serialize)]
pub struct LocalAiReadinessReport {
    pub state: ReadinessState,
    pub runtime_version: Option<String>,
    pub model: Option<String>,
    pub resolved_model: Option<String>,
    pub digest: Option<String>,
    pub capabilities: Vec<String>,
    pub execution: ExecutionEvidence,
    pub message: String,
    #[serde(skip)]
    local_selector: Option<String>,
}

impl LocalAiReadinessReport {
    fn new(model: Option<&str>) -> Self {
        Self {
            state: ReadinessState::NoSelection,
            runtime_version: None,
            model: model.map(str::to_owned),
            resolved_model: None,
            digest: None,
            capabilities: vec![],
            execution: ExecutionEvidence::Unknown,
            message: ReadinessState::NoSelection.message().into(),
            local_selector: None,
        }
    }

    fn finish(mut self, state: ReadinessState) -> Self {
        self.state = state;
        self.message = state.message().into();
        if state != ReadinessState::Ready {
            self.execution = ExecutionEvidence::Unknown;
            self.local_selector = None;
        }
        self
    }

    pub(crate) fn generation_model(&self) -> Result<&str, String> {
        if self.state == ReadinessState::Ready {
            if let Some(selector) = self.local_selector.as_deref() {
                return Ok(selector);
            }
        }
        Err(format!("LOCAL_AI_{}: {}", self.state.code(), self.message))
    }
}

pub(crate) fn local_client(timeout: Duration) -> Result<Client, String> {
    Client::builder()
        .no_proxy()
        .redirect(Policy::none())
        .timeout(timeout)
        .build()
        .map_err(|_| "Não foi possível preparar a conexão local com o Ollama.".into())
}

#[derive(Deserialize)]
struct Version {
    version: String,
}

#[derive(Deserialize)]
struct Tags {
    models: Vec<Tag>,
}

#[derive(Deserialize)]
struct Tag {
    name: String,
    digest: Option<String>,
    remote_model: Option<String>,
    remote_host: Option<String>,
}

#[derive(Deserialize)]
struct Show {
    capabilities: Option<Vec<String>>,
    remote_model: Option<String>,
    remote_host: Option<String>,
    details: Option<Details>,
    model_info: Option<ModelInfo>,
}

#[derive(Deserialize)]
struct Details {
    format: Option<String>,
}

#[derive(Deserialize)]
struct ModelInfo {
    #[serde(rename = "general.architecture")]
    architecture: Option<String>,
}

fn valid_name(name: &str) -> bool {
    !name.is_empty()
        && name.encode_utf16().count() <= MAX_MODEL_UNITS
        && !name.chars().any(|c| c.is_control() || c.is_whitespace())
}

fn remote(model: &Option<String>, host: &Option<String>) -> bool {
    model.as_ref().is_some_and(|s| !s.is_empty()) || host.as_ref().is_some_and(|s| !s.is_empty())
}

async fn bounded_json<T: DeserializeOwned>(mut response: Response, max: usize) -> Result<T, ()> {
    if !response.status().is_success()
        || response
            .content_length()
            .is_some_and(|size| size > max as u64)
    {
        return Err(());
    }
    let mut bytes = Vec::new();
    while let Some(chunk) = response.chunk().await.map_err(|_| ())? {
        if chunk.len() > max.saturating_sub(bytes.len()) {
            return Err(());
        }
        bytes.extend_from_slice(&chunk);
    }
    serde_json::from_slice(&bytes).map_err(|_| ())
}

async fn catalog(client: &Client, base_url: &str) -> Result<Tags, ()> {
    let response = client
        .get(format!("{base_url}/api/tags"))
        .send()
        .await
        .map_err(|_| ())?;
    let tags: Tags = bounded_json(response, 2 * 1024 * 1024).await?;
    let mut names = HashSet::new();
    if tags.models.len() > 1000
        || tags
            .models
            .iter()
            .any(|tag| !valid_name(&tag.name) || !names.insert(&tag.name))
    {
        return Err(());
    }
    Ok(tags)
}

/// Inventory is a bounded availability hint, not permission to submit editorial content.
pub(crate) async fn catalog_names(client: &Client, base_url: &str) -> Result<Vec<String>, String> {
    match tokio::time::timeout(CHECK_DEADLINE, catalog(client, base_url)).await {
        Ok(Ok(tags)) => Ok(tags.models.into_iter().map(|tag| tag.name).collect()),
        _ => Err("Não foi possível consultar uma lista válida de modelos no Ollama. Tente atualizar novamente.".into()),
    }
}

async fn inspect(client: &Client, base_url: &str, model: &str) -> LocalAiReadinessReport {
    let mut report = LocalAiReadinessReport::new(Some(model));
    let version_response = match client.get(format!("{base_url}/api/version")).send().await {
        Ok(response) => response,
        Err(_) => return report.finish(ReadinessState::ServerUnreachable),
    };
    let version: Version = match bounded_json(version_response, 4 * 1024).await {
        Ok(version) => version,
        Err(_) => return report.finish(ReadinessState::VerificationFailed),
    };
    if version.version.len() > 64 {
        return report.finish(ReadinessState::VerificationFailed);
    }
    let supported = SUPPORTED_SERVER_VERSIONS.contains(&version.version.as_str());
    report.runtime_version = Some(version.version);
    if !supported {
        return report.finish(ReadinessState::UnsupportedRuntime);
    }
    let tags = match catalog(client, base_url).await {
        Ok(tags) => tags,
        Err(()) => return report.finish(ReadinessState::VerificationFailed),
    };
    // Retain the existing unqualified-name alias only when exact membership is absent.
    let selected = tags
        .models
        .iter()
        .find(|tag| tag.name == model)
        .or_else(|| {
            tags.models
                .iter()
                .find(|tag| tag.name == format!("{model}:latest"))
        });
    let Some(selected) = selected else {
        return report.finish(ReadinessState::ModelMissing);
    };
    report.resolved_model = Some(selected.name.clone());
    if remote(&selected.remote_model, &selected.remote_host) {
        return report.finish(ReadinessState::RemoteModel);
    }
    let Some(digest) = selected.digest.as_ref() else {
        return report.finish(ReadinessState::VerificationFailed);
    };
    if digest.len() != 64 || !digest.bytes().all(|b| b.is_ascii_hexdigit()) {
        return report.finish(ReadinessState::VerificationFailed);
    }
    report.digest = Some(digest.clone());
    // SourceLocal is enforced again by the audited daemon in GenerateHandler.
    // A later tag change to a remote manifest cannot silently remove this constraint.
    let selector = format!("{}:local", selected.name);
    let show: Show = match client
        .post(format!("{base_url}/api/show"))
        .json(&serde_json::json!({"model": selector, "verbose": false}))
        .send()
        .await
    {
        Ok(response) => match bounded_json(response, 4 * 1024 * 1024).await {
            Ok(show) => show,
            Err(_) => return report.finish(ReadinessState::VerificationFailed),
        },
        Err(_) => return report.finish(ReadinessState::VerificationFailed),
    };
    if remote(&show.remote_model, &show.remote_host) {
        return report.finish(ReadinessState::RemoteModel);
    }
    let Some(capabilities) = show.capabilities else {
        return report.finish(ReadinessState::UnsupportedCapability);
    };
    if capabilities.len() > 32
        || capabilities.iter().any(|capability| {
            capability.is_empty()
                || capability.len() > 64
                || capability
                    .chars()
                    .any(|c| c.is_control() || c.is_whitespace())
        })
    {
        return report.finish(ReadinessState::VerificationFailed);
    }
    let completion = capabilities
        .iter()
        .any(|capability| capability == "completion");
    report.capabilities = capabilities;
    if !completion {
        return report.finish(ReadinessState::UnsupportedCapability);
    }
    let gguf = show.details.and_then(|details| details.format).as_deref() == Some("gguf");
    let architecture = show.model_info.and_then(|info| info.architecture);
    if !gguf
        || architecture
            .as_ref()
            .map_or(true, |name| name.is_empty() || name.len() > 128)
    {
        return report.finish(ReadinessState::VerificationFailed);
    }
    report.execution = ExecutionEvidence::LocalRequestEnforced;
    report.local_selector = Some(selector);
    report.finish(ReadinessState::Ready)
}

pub(crate) async fn check_readiness(
    client: &Client,
    base_url: &str,
    model: Option<&str>,
) -> LocalAiReadinessReport {
    check_with_deadline(client, base_url, model, CHECK_DEADLINE).await
}

async fn check_with_deadline(
    client: &Client,
    base_url: &str,
    model: Option<&str>,
    deadline: Duration,
) -> LocalAiReadinessReport {
    let Some(model) = model else {
        return LocalAiReadinessReport::new(None);
    };
    if !valid_name(model) {
        // Do not reflect malformed/oversized renderer input in the diagnostic response.
        return LocalAiReadinessReport::new(None).finish(ReadinessState::InvalidModel);
    }
    match tokio::time::timeout(deadline, inspect(client, base_url, model)).await {
        Ok(report) => report,
        Err(_) => {
            LocalAiReadinessReport::new(Some(model)).finish(ReadinessState::VerificationFailed)
        }
    }
}

#[tauri::command]
pub async fn get_local_ai_readiness(
    model: Option<String>,
) -> Result<LocalAiReadinessReport, String> {
    let client = local_client(CHECK_DEADLINE)?;
    Ok(check_readiness(&client, OLLAMA_ENDPOINT, model.as_deref()).await)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tags() -> serde_json::Value {
        serde_json::json!({"models": [{"name":"synthetic:stable", "digest":"a".repeat(64)}]})
    }

    fn show() -> serde_json::Value {
        serde_json::json!({"capabilities":["completion"],"details":{"format":"gguf"},
            "model_info":{"general.architecture":"synthetic"},"system":"private instruction",
            "template":"private template","license":"private license"})
    }

    #[test]
    fn no_selection_and_invalid_input_do_not_contact_the_server() {
        tokio::runtime::Runtime::new().unwrap().block_on(async {
            let client = local_client(Duration::from_secs(1)).unwrap();
            assert_eq!(
                check_readiness(&client, "http://127.0.0.1:0", None)
                    .await
                    .state,
                ReadinessState::NoSelection
            );
            for model in ["", " synthetic", "x\n", &"x".repeat(257)] {
                let report = check_readiness(&client, "http://127.0.0.1:0", Some(model)).await;
                assert_eq!(report.state, ReadinessState::InvalidModel);
                assert!(report.model.is_none());
                assert!(report.generation_model().is_err());
            }
            assert_eq!(
                check_readiness(&client, "http://127.0.0.1:0", Some("synthetic"))
                    .await
                    .state,
                ReadinessState::ServerUnreachable
            );
        });
    }

    #[test]
    fn metadata_policy_blocks_unknown_remote_and_unsupported_models() {
        tokio::runtime::Runtime::new().unwrap().block_on(async {
            for (runtime_version, (index, expected)) in [
                ReadinessState::UnsupportedRuntime,
                ReadinessState::ModelMissing,
                ReadinessState::RemoteModel,
                ReadinessState::RemoteModel,
                ReadinessState::UnsupportedCapability,
                ReadinessState::VerificationFailed,
                ReadinessState::VerificationFailed,
                ReadinessState::Ready,
            ]
            .into_iter()
            .enumerate()
            .flat_map(|case| ["0.35.1", "0.40.1"].into_iter().map(move |version| (version, case)))
            {
                let mut server = mockito::Server::new_async().await;
                let mut inventory = tags();
                let mut details = show();
                match index {
                    1 => inventory["models"] = serde_json::json!([]),
                    2 => inventory["models"][0]["remote_model"] = serde_json::json!("remote"),
                    3 => details["remote_host"] = serde_json::json!("https://example.invalid"),
                    4 => details["capabilities"] = serde_json::json!(["embedding"]),
                    5 => inventory["models"][0]["digest"] = serde_json::json!("invalid"),
                    6 => details["model_info"] = serde_json::json!({}),
                    _ => (),
                }
                let version = server
                    .mock("GET", "/api/version")
                    .with_body(serde_json::json!({"version": if index == 0 { "0.35.2" } else { runtime_version }}).to_string())
                    .expect(1)
                    .create_async()
                    .await;
                let catalog = server
                    .mock("GET", "/api/tags")
                    .with_body(inventory.to_string())
                    .expect(usize::from(index != 0))
                    .create_async()
                    .await;
                let model = server
                    .mock("POST", "/api/show")
                    .match_body(mockito::Matcher::Json(
                        serde_json::json!({"model":"synthetic:stable:local","verbose":false}),
                    ))
                    .with_body(details.to_string())
                    .expect(usize::from(index >= 3 && index != 5))
                    .create_async()
                    .await;
                let report = check_readiness(
                    &local_client(Duration::from_secs(2)).unwrap(),
                    &server.url(),
                    Some("synthetic:stable"),
                )
                .await;
                assert_eq!(report.state, expected);
                assert_eq!(report.runtime_version.as_deref(), Some(if index == 0 { "0.35.2" } else { runtime_version }));
                if expected == ReadinessState::Ready {
                    assert_eq!(report.generation_model().unwrap(), "synthetic:stable:local");
                    assert_eq!(report.execution, ExecutionEvidence::LocalRequestEnforced);
                    let output = serde_json::to_string(&report).unwrap();
                    for private in [
                        "private instruction",
                        "private template",
                        "private license",
                        "local_selector",
                    ] {
                        assert!(!output.contains(private));
                    }
                } else {
                    assert_eq!(report.execution, ExecutionEvidence::Unknown);
                    assert!(report.generation_model().is_err());
                }
                version.assert_async().await;
                catalog.assert_async().await;
                model.assert_async().await;
            }
        });
    }

    #[test]
    fn unaudited_server_versions_stop_before_model_metadata() {
        tokio::runtime::Runtime::new().unwrap().block_on(async {
            for runtime_version in [
                "0.40.0",
                "0.40.2",
                "0.40.1-rc0",
                "0.40.1+local",
                "0.35.10",
                "1.0.0",
            ] {
                let mut server = mockito::Server::new_async().await;
                let version = server
                    .mock("GET", "/api/version")
                    .with_body(serde_json::json!({"version":runtime_version}).to_string())
                    .expect(1)
                    .create_async()
                    .await;
                let tags = server
                    .mock("GET", "/api/tags")
                    .expect(0)
                    .create_async()
                    .await;
                let show = server
                    .mock("POST", "/api/show")
                    .expect(0)
                    .create_async()
                    .await;
                let report = check_readiness(
                    &local_client(Duration::from_secs(2)).unwrap(),
                    &server.url(),
                    Some("synthetic:stable"),
                )
                .await;
                assert_eq!(report.state, ReadinessState::UnsupportedRuntime);
                assert_eq!(report.execution, ExecutionEvidence::Unknown);
                assert_eq!(report.runtime_version.as_deref(), Some(runtime_version));
                assert!(report.generation_model().is_err());
                version.assert_async().await;
                tags.assert_async().await;
                show.assert_async().await;
            }
        });
    }

    #[test]
    fn exact_catalog_name_and_existing_alias_preserve_local_selector() {
        tokio::runtime::Runtime::new().unwrap().block_on(async {
            for (requested, resolved) in [
                ("synthetic", "synthetic:latest"),
                ("synthetic", "synthetic"),
                (
                    "registry.example:5000/team/synthetic:stable",
                    "registry.example:5000/team/synthetic:stable",
                ),
            ] {
                let mut server = mockito::Server::new_async().await;
                let _version = server
                    .mock("GET", "/api/version")
                    .with_body(r#"{"version":"0.35.1"}"#)
                    .create_async()
                    .await;
                let _tags = server
                    .mock("GET", "/api/tags")
                    .with_body(
                        serde_json::json!({"models":[{"name":resolved,"digest":"a".repeat(64)}]})
                            .to_string(),
                    )
                    .create_async()
                    .await;
                let selector = format!("{resolved}:local");
                let model = server
                    .mock("POST", "/api/show")
                    .match_body(mockito::Matcher::Json(
                        serde_json::json!({"model":selector,"verbose":false}),
                    ))
                    .with_body(show().to_string())
                    .create_async()
                    .await;
                let report = check_readiness(
                    &local_client(Duration::from_secs(2)).unwrap(),
                    &server.url(),
                    Some(requested),
                )
                .await;
                assert_eq!(report.model.as_deref(), Some(requested));
                assert_eq!(report.resolved_model.as_deref(), Some(resolved));
                assert_eq!(report.generation_model().unwrap(), selector);
                model.assert_async().await;
            }
        });
    }

    #[test]
    fn invalid_and_oversized_metadata_and_redirects_fail_closed() {
        tokio::runtime::Runtime::new().unwrap().block_on(async {
            for (status, body) in [
                (200, "invalid json".into()),
                (
                    200,
                    serde_json::json!({"version":"0.35.1","unused":"x".repeat(4097)}).to_string(),
                ),
                (302, String::new()),
                (503, String::new()),
            ] {
                let mut target = mockito::Server::new_async().await;
                let forbidden = target
                    .mock("GET", "/api/version")
                    .expect(0)
                    .create_async()
                    .await;
                let mut server = mockito::Server::new_async().await;
                let version = server
                    .mock("GET", "/api/version")
                    .with_status(status)
                    .with_header("location", &format!("{}/api/version", target.url()))
                    .with_body(body)
                    .create_async()
                    .await;
                let catalog = server
                    .mock("GET", "/api/tags")
                    .expect(0)
                    .create_async()
                    .await;
                let report = check_readiness(
                    &local_client(Duration::from_secs(2)).unwrap(),
                    &server.url(),
                    Some("synthetic:stable"),
                )
                .await;
                assert_eq!(report.state, ReadinessState::VerificationFailed);
                assert!(report.generation_model().is_err());
                version.assert_async().await;
                catalog.assert_async().await;
                forbidden.assert_async().await;
            }
        });
    }

    #[test]
    fn inventory_bounds_reject_ambiguous_or_excessive_names() {
        tokio::runtime::Runtime::new().unwrap().block_on(async {
            for body in [
                serde_json::json!({"models":[{"name":"synthetic:stable"}],"unused":"x".repeat(2 * 1024 * 1024)}).to_string(),
                serde_json::json!({"models":[{"name":"same"},{"name":"same"}]}).to_string(),
                serde_json::json!({"models":[{"name":"x".repeat(257)}]}).to_string(),
                serde_json::json!({"models":[{"name":"invalid name"}]}).to_string(),
                serde_json::json!({"models":(0..1001).map(|i| serde_json::json!({"name":format!("synthetic-{i}")})).collect::<Vec<_>>()} ).to_string(),
            ] {
                let mut server = mockito::Server::new_async().await;
                let tags = server.mock("GET", "/api/tags").with_body(body).create_async().await;
                assert!(catalog_names(&local_client(Duration::from_secs(2)).unwrap(), &server.url()).await.is_err());
                tags.assert_async().await;
            }
            let mut server = mockito::Server::new_async().await;
            let tags = server.mock("GET", "/api/tags").with_body(r#"{"models":[{"name":"synthetic:stable"},{"name":"synthetic:latest"}]}"#).create_async().await;
            assert_eq!(catalog_names(&local_client(Duration::from_secs(2)).unwrap(), &server.url()).await.unwrap(), ["synthetic:stable", "synthetic:latest"]);
            tags.assert_async().await;
        });
    }

    #[test]
    fn show_body_is_bounded_even_without_content_length() {
        use std::io::{Read, Write};
        use std::net::TcpListener;
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let base = format!("http://{}", listener.local_addr().unwrap());
        let server = std::thread::spawn(move || {
            listener.set_nonblocking(true).unwrap();
            let started = std::time::Instant::now();
            let mut stream = loop {
                match listener.accept() {
                    Ok((stream, _)) => break stream,
                    Err(error)
                        if error.kind() == std::io::ErrorKind::WouldBlock
                            && started.elapsed() < Duration::from_secs(5) =>
                    {
                        std::thread::sleep(Duration::from_millis(5))
                    }
                    other => panic!("Metadata fixture did not receive its request: {other:?}"),
                }
            };
            stream.set_nonblocking(false).unwrap();
            stream
                .set_read_timeout(Some(Duration::from_secs(5)))
                .unwrap();
            let mut byte = [0];
            let mut headers = Vec::new();
            while !headers.ends_with(b"\r\n\r\n") {
                stream.read_exact(&mut byte).unwrap();
                headers.push(byte[0]);
            }
            // The limit applies to received bytes, not just a declared Content-Length.
            let body = r#"{"capabilities":[]}"#;
            write!(stream, "HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\nConnection: close\r\n\r\n{:x}\r\n{}\r\n0\r\n\r\n", body.len(), body).unwrap();
        });
        tokio::runtime::Runtime::new().unwrap().block_on(async {
            let response = local_client(Duration::from_secs(2))
                .unwrap()
                .get(base)
                .send()
                .await
                .unwrap();
            assert!(response.content_length().is_none());
            assert!(bounded_json::<Show>(response, 8).await.is_err());
        });
        server.join().unwrap();
    }

    #[test]
    fn total_metadata_deadline_interrupts_a_pending_response() {
        use std::io::Read;
        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let base = format!("http://{}", listener.local_addr().unwrap());
        let server = std::thread::spawn(move || {
            listener.set_nonblocking(true).unwrap();
            let started = std::time::Instant::now();
            let mut stream = loop {
                match listener.accept() {
                    Ok((stream, _)) => break stream,
                    Err(error)
                        if error.kind() == std::io::ErrorKind::WouldBlock
                            && started.elapsed() < Duration::from_secs(5) =>
                    {
                        std::thread::sleep(Duration::from_millis(5))
                    }
                    other => panic!("Deadline fixture did not receive its request: {other:?}"),
                }
            };
            stream.set_nonblocking(false).unwrap();
            stream
                .set_read_timeout(Some(Duration::from_secs(2)))
                .unwrap();
            let mut request = [0; 2048];
            stream.read(&mut request).unwrap();
            std::thread::sleep(Duration::from_millis(500));
        });
        tokio::runtime::Runtime::new().unwrap().block_on(async {
            let report = check_with_deadline(
                &local_client(Duration::from_secs(2)).unwrap(),
                &base,
                Some("synthetic:stable"),
                Duration::from_millis(250),
            )
            .await;
            assert_eq!(report.state, ReadinessState::VerificationFailed);
            assert!(report.generation_model().is_err());
        });
        server.join().unwrap();
    }
}
