use reqwest::header::RANGE;
use std::fs::OpenOptions;
use std::io::{Seek, SeekFrom, Write};
use std::path::Path;
use tauri::{AppHandle, Emitter};
use tokio_stream::StreamExt;

#[derive(serde::Serialize, Clone)]
pub struct DownloadProgressEvent {
    pub job_id: String,
    pub bytes_downloaded: u64,
    pub bytes_total: u64,
    pub progress: u8,
}

#[derive(Debug)]
pub enum DownloadError {
    Reqwest(reqwest::Error),
    Io(std::io::Error),
    DiskFull,
    PermissionDenied,
    Cancelled,
}

impl std::fmt::Display for DownloadError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DownloadError::Reqwest(e) => write!(f, "Network error: {}", e),
            DownloadError::Io(e) => write!(f, "IO error: {}", e),
            DownloadError::DiskFull => write!(f, "Insufficient disk space"),
            DownloadError::PermissionDenied => write!(f, "Permission denied writing to disk"),
            DownloadError::Cancelled => write!(f, "Download cancelled by user"),
        }
    }
}

impl From<reqwest::Error> for DownloadError {
    fn from(err: reqwest::Error) -> Self {
        DownloadError::Reqwest(err)
    }
}

impl From<std::io::Error> for DownloadError {
    fn from(err: std::io::Error) -> Self {
        match err.kind() {
            std::io::ErrorKind::PermissionDenied => DownloadError::PermissionDenied,
            _ => DownloadError::Io(err),
        }
    }
}

/// Baixa o modelo GGUF utilizando Chunked IO, suportando retomada (Range requests)
/// e emitindo eventos de progresso via Tauri.
pub async fn download_model_file(
    app: AppHandle,
    job_id: String,
    url: &str,
    tmp_path: &Path,
    expected_size: u64,
    mut cancel_rx: tokio::sync::mpsc::Receiver<()>,
) -> Result<(), DownloadError> {
    let client = reqwest::Client::new();

    // 1. Detectar tamanho existente do arquivo .tmp
    let mut downloaded_bytes = 0u64;
    if tmp_path.exists() {
        if let Ok(metadata) = std::fs::metadata(tmp_path) {
            downloaded_bytes = metadata.len();
        }
    }

    // Se já temos o tamanho completo esperado (ou mais), não precisamos baixar,
    // mas o chamador precisa verificar as hashes depois.
    if downloaded_bytes >= expected_size {
        let _ = app.emit(
            "download-progress",
            DownloadProgressEvent {
                job_id: job_id.clone(),
                bytes_downloaded: expected_size,
                bytes_total: expected_size,
                progress: 100,
            },
        );
        return Ok(());
    }

    // 2. Preparar a requisição com suporte a Range
    let mut req = client.get(url);
    if downloaded_bytes > 0 {
        req = req.header(RANGE, format!("bytes={}-", downloaded_bytes));
    }

    let mut response = req.send().await?;
    response.error_for_status_ref()?; // Retorna erro em caso de 4xx/5xx

    // 3. Validar Content-Range
    // Se o servidor ignorou o header Range e mandou 200 OK em vez de 206 Partial Content,
    // o download recomeça do zero.
    if response.status() == reqwest::StatusCode::OK && downloaded_bytes > 0 {
        // Servidor não suporta resume. Reset.
        downloaded_bytes = 0;
    } else if response.status() == reqwest::StatusCode::PARTIAL_CONTENT {
        // Opcional: Validar o formato do header Content-Range se necessário.
    }

    let total_size = response
        .content_length()
        .map(|len| len + downloaded_bytes)
        .unwrap_or(expected_size); // Fallback ao expected do manifest

    // 4. Abrir o arquivo para append/write
    let mut file = OpenOptions::new().create(true).write(true).open(tmp_path)?;

    // Posicionar no final do arquivo caso seja append de um range
    if downloaded_bytes > 0 {
        file.seek(SeekFrom::Start(downloaded_bytes))?;
    } else {
        // Truncar o arquivo se estivermos começando do zero
        file.set_len(0)?;
    }

    let mut stream = response.bytes_stream();
    let mut last_progress_emit = std::time::Instant::now();

    // Emit initial progress
    let _ = app.emit(
        "download-progress",
        DownloadProgressEvent {
            job_id: job_id.clone(),
            bytes_downloaded: downloaded_bytes,
            bytes_total: total_size,
            progress: if total_size > 0 {
                ((downloaded_bytes as f64 / total_size as f64) * 100.0) as u8
            } else {
                0
            },
        },
    );

    while let Some(chunk_result) = stream.next().await {
        // Check for cancellation
        if let Ok(_) = cancel_rx.try_recv() {
            return Err(DownloadError::Cancelled);
        }

        let chunk = chunk_result?;
        file.write_all(&chunk)?;
        downloaded_bytes += chunk.len() as u64;

        // Throttle progress events (e.g. 50ms) to avoid saturating IPC
        if last_progress_emit.elapsed().as_millis() > 50 {
            let progress = if total_size > 0 {
                ((downloaded_bytes as f64 / total_size as f64) * 100.0) as u8
            } else {
                0
            };
            let _ = app.emit(
                "download-progress",
                DownloadProgressEvent {
                    job_id: job_id.clone(),
                    bytes_downloaded: downloaded_bytes,
                    bytes_total: total_size,
                    progress,
                },
            );
            last_progress_emit = std::time::Instant::now();
        }
    }

    // Ensure data is synced to disk
    file.sync_all()?;

    // Emit 100% final progress
    let _ = app.emit(
        "download-progress",
        DownloadProgressEvent {
            job_id,
            bytes_downloaded: downloaded_bytes,
            bytes_total: total_size,
            progress: 100,
        },
    );

    Ok(())
}
