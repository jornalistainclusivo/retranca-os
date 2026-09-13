use std::collections::HashMap;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};

/// Global Job Registry: maps a user-supplied job_id to a live OS process handle.
pub struct JobRegistry(pub Mutex<HashMap<String, Child>>);

// ─── Event Payloads ──────────────────────────────────────────────────────────

#[derive(serde::Serialize, Clone)]
struct TokenEvent {
    job_id: String,
    token: String,
}

#[derive(serde::Serialize, Clone)]
struct DoneEvent {
    job_id: String,
}

#[derive(serde::Serialize, Clone)]
struct CanceledEvent {
    job_id: String,
}

#[derive(serde::Serialize, Clone)]
struct ErrorEvent {
    job_id: String,
    message: String,
}

// ─── Tauri Commands ──────────────────────────────────────────────────────────

/// Spawn a sidecar (or any subprocess) and stream stdout tokens to the frontend.
/// Each line of stdout from the child process is emitted as an `ai-stream-token` event.
pub async fn start_inference_internal(
    app: AppHandle,
    registry: State<'_, JobRegistry>,
    job_id: String,
    program: String,
    args: Vec<String>,
) -> Result<(), String> {
    // Reject duplicate job IDs without blocking long
    {
        let map = registry.0.lock().map_err(|e| e.to_string())?;
        if map.contains_key(&job_id) {
            return Err(format!("Job {} is already running", job_id));
        }
    }

    let mut child = Command::new(&program)
        .args(&args)
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| format!("Failed to spawn sidecar: {}", e))?;

    // Take the stdout pipe out of the child *before* moving the child into the registry
    let stdout = child
        .stdout
        .take()
        .ok_or("Failed to capture child stdout")?;

    // Register the child so cancel_inference can kill it
    registry
        .0
        .lock()
        .map_err(|e| e.to_string())?
        .insert(job_id.clone(), child);

    // Non-blocking task: read line-by-line and emit events
    let job_id_clone = job_id.clone();
    let app_clone = app.clone();

    tauri::async_runtime::spawn_blocking(move || {
        use std::io::{BufRead, BufReader};

        let reader = BufReader::new(stdout);
        for line_result in reader.lines() {
            match line_result {
                Ok(line) => {
                    let _ = app_clone.emit(
                        "ai-stream-token",
                        TokenEvent {
                            job_id: job_id_clone.clone(),
                            token: line,
                        },
                    );
                }
                Err(e) => {
                    let _ = app_clone.emit(
                        "ai-stream-error",
                        ErrorEvent {
                            job_id: job_id_clone.clone(),
                            message: e.to_string(),
                        },
                    );
                    break;
                }
            }
        }
        // EOF reached — child finished naturally
        let _ = app_clone.emit(
            "ai-stream-done",
            DoneEvent {
                job_id: job_id_clone,
            },
        );
    });

    Ok(())
}

#[cfg(debug_assertions)]
#[tauri::command]
pub async fn start_inference(
    app: AppHandle,
    registry: State<'_, JobRegistry>,
    job_id: String,
    program: String,
    args: Vec<String>,
) -> Result<(), String> {
    start_inference_internal(app, registry, job_id, program, args).await
}

/// Kill the running sidecar associated with `job_id`, reap it, and emit
/// `ai-stream-canceled` so the frontend can clean up.
#[tauri::command]
pub async fn cancel_inference(
    app: AppHandle,
    registry: State<'_, JobRegistry>,
    job_id: String,
) -> Result<(), String> {
    let mut child = registry
        .0
        .lock()
        .map_err(|e| e.to_string())?
        .remove(&job_id)
        .ok_or_else(|| format!("No running job found for id: {}", job_id))?;

    // Force-kill; on Windows this calls TerminateProcess, on Unix it sends SIGKILL
    child
        .kill()
        .map_err(|e| format!("Failed to kill process: {}", e))?;
    // Reap the process so it does not become a zombie
    let _ = child.wait();

    app.emit("ai-stream-canceled", CanceledEvent { job_id })
        .map_err(|e| e.to_string())?;

    Ok(())
}

// ─── Unit Tests ───────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    /// Helper to build a registry backed by a real (but immediately-exiting) process.
    fn make_exiting_child() -> Child {
        #[cfg(target_os = "windows")]
        return Command::new("cmd")
            .args(["/C", "exit 0"])
            .stdout(Stdio::null())
            .spawn()
            .expect("Failed to spawn cmd");

        #[cfg(not(target_os = "windows"))]
        return Command::new("true")
            .stdout(Stdio::null())
            .spawn()
            .expect("Failed to spawn true");
    }

    fn make_long_child() -> Child {
        #[cfg(target_os = "windows")]
        return Command::new("ping")
            .args(["-n", "60", "127.0.0.1"])
            .stdout(Stdio::null())
            .spawn()
            .expect("Failed to spawn long-running process");

        #[cfg(not(target_os = "windows"))]
        return Command::new("sleep")
            .args(["60"])
            .stdout(Stdio::null())
            .spawn()
            .expect("Failed to spawn long-running process");
    }

    #[test]
    fn test_job_registry_insert_and_contains() {
        let registry = Mutex::new(HashMap::new());
        let child = make_exiting_child();

        let mut map = registry.lock().unwrap();
        map.insert("job-001".to_string(), child);
        assert!(map.contains_key("job-001"));
    }

    #[test]
    fn test_job_registry_remove_on_cancel() {
        let registry = Mutex::new(HashMap::new());
        let child = make_long_child();

        {
            let mut map = registry.lock().unwrap();
            map.insert("job-002".to_string(), child);
            assert!(map.contains_key("job-002"));
        }

        // Simulate cancel: remove and kill
        let mut removed = {
            let mut map = registry.lock().unwrap();
            map.remove("job-002").expect("Job should be present")
        };
        removed.kill().expect("kill failed");
        let _ = removed.wait();

        // Registry must be empty now
        let map = registry.lock().unwrap();
        assert!(!map.contains_key("job-002"));
    }

    #[test]
    fn test_job_registry_rejects_duplicate_job_id() {
        let registry = Mutex::new(HashMap::new());
        let child_a = make_exiting_child();
        let child_b = make_exiting_child();

        let mut map = registry.lock().unwrap();
        map.insert("job-dup".to_string(), child_a);

        // Attempting to insert same key must be rejected by caller (simulated here)
        assert!(
            map.contains_key("job-dup"),
            "Duplicate job_id must be detected before spawning"
        );

        // We should NOT overwrite — drop child_b cleanly
        drop(child_b);
    }

    #[test]
    fn test_job_registry_independent_jobs() {
        let registry = Mutex::new(HashMap::new());

        let mut map = registry.lock().unwrap();
        map.insert("job-a".to_string(), make_exiting_child());
        map.insert("job-b".to_string(), make_exiting_child());

        assert_eq!(map.len(), 2);
        map.remove("job-a");
        assert_eq!(map.len(), 1);
        assert!(map.contains_key("job-b"));
    }
}
