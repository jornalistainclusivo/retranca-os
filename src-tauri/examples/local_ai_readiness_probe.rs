//! Read-only developer observations using the existing native readiness authority.
//! This target never submits prompts, opens editorial storage or starts Tauri.

use app_lib::local_ai_readiness::{get_local_ai_readiness, ReadinessState};
use app_lib::ollama_gateway::get_ollama_models;
use serde::Serialize;
use std::ffi::OsString;
use std::process::ExitCode;
use std::time::{Instant, SystemTime, UNIX_EPOCH};

const USAGE: &str = "Usage: local_ai_readiness_probe --inventory | --model <EXACT_INSTALLED_TAG> | --help\nRead-only native metadata; no generation, download or editorial storage.";
const USAGE_ERROR: &str =
    "Choose exactly one supported operation; no endpoint, prompt or file arguments are accepted.";

#[derive(Debug, PartialEq, Eq)]
enum Operation {
    Help,
    Inventory,
    Model(String),
}

fn parse_args(args: &[OsString]) -> Result<Operation, &'static str> {
    let utf8: Vec<&str> = args
        .iter()
        .map(|arg| arg.to_str().ok_or(USAGE_ERROR))
        .collect::<Result<_, _>>()?;
    match utf8.as_slice() {
        ["--help"] | ["-h"] => Ok(Operation::Help),
        ["--inventory"] => Ok(Operation::Inventory),
        ["--model", model] if !model.starts_with("--") => Ok(Operation::Model((*model).to_owned())),
        _ => Err(USAGE_ERROR),
    }
}

#[derive(Serialize)]
struct Observation<T> {
    schema_version: u8,
    operation: &'static str,
    observed_at_unix_ms: Option<u128>,
    metadata_elapsed_ms: u128,
    result: T,
}

fn emit<T: Serialize>(
    operation: &'static str,
    observed_at_unix_ms: Option<u128>,
    started: Instant,
    result: T,
) -> Result<(), &'static str> {
    let observation = Observation {
        schema_version: 1,
        operation,
        observed_at_unix_ms,
        metadata_elapsed_ms: started.elapsed().as_millis(),
        result,
    };
    let output = serde_json::to_string_pretty(&observation)
        .map_err(|_| "Could not serialize the native metadata observation.")?;
    println!("{output}");
    Ok(())
}

fn readiness_exit(state: ReadinessState) -> u8 {
    if state == ReadinessState::Ready {
        0
    } else {
        2
    }
}

fn main() -> ExitCode {
    let args: Vec<OsString> = std::env::args_os().skip(1).collect();
    let operation = match parse_args(&args) {
        Ok(operation) => operation,
        Err(message) => {
            eprintln!("{message}\n{USAGE}");
            return ExitCode::from(2);
        }
    };
    if operation == Operation::Help {
        println!("{USAGE}");
        return ExitCode::SUCCESS;
    }

    let runtime = match tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
    {
        Ok(runtime) => runtime,
        Err(_) => {
            eprintln!("Could not initialize the native metadata runtime.");
            return ExitCode::FAILURE;
        }
    };
    runtime.block_on(observe(operation))
}

async fn observe(operation: Operation) -> ExitCode {
    let started = Instant::now();
    let observed_at = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .ok()
        .map(|duration| duration.as_millis());
    let result = match operation {
        Operation::Inventory => match get_ollama_models().await {
            Ok(models) => emit("inventory", observed_at, started, models).map(|_| 0),
            Err(message) => {
                eprintln!("{message}");
                return ExitCode::FAILURE;
            }
        },
        Operation::Model(model) => match get_local_ai_readiness(Some(model)).await {
            Ok(report) => {
                let code = readiness_exit(report.state);
                emit("readiness", observed_at, started, report).map(|_| code)
            }
            Err(message) => {
                eprintln!("{message}");
                return ExitCode::FAILURE;
            }
        },
        Operation::Help => unreachable!(),
    };
    match result {
        Ok(code) => ExitCode::from(code),
        Err(message) => {
            eprintln!("{message}");
            ExitCode::FAILURE
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn args(values: &[&str]) -> Vec<OsString> {
        values.iter().map(OsString::from).collect()
    }

    #[test]
    fn missing_and_ambiguous_operations_never_select_a_default() {
        for input in [
            vec![],
            vec!["--model"],
            vec!["--inventory", "--model", "synthetic:exact"],
            vec!["--model", "synthetic:exact", "--inventory"],
        ] {
            assert_eq!(parse_args(&args(&input)), Err(USAGE_ERROR));
        }
    }

    #[test]
    fn selected_catalog_name_is_preserved_without_trimming_or_substitution() {
        let name = "registry.example:5000/namespace/synthetic:q4";
        assert_eq!(
            parse_args(&args(&["--model", name])),
            Ok(Operation::Model(name.into()))
        );
        // Native authority, not this CLI, decides whether this input is valid.
        assert_eq!(
            parse_args(&args(&["--model", " synthetic:exact "])),
            Ok(Operation::Model(" synthetic:exact ".into()))
        );
    }

    #[test]
    fn unsupported_data_and_endpoint_options_are_rejected_without_echo() {
        for input in [
            vec!["--endpoint", "https://synthetic.invalid"],
            vec!["--prompt", "synthetic private marker"],
            vec!["--download"],
            vec!["--model", "--inventory"],
            vec!["--help", "synthetic private marker"],
        ] {
            let message = parse_args(&args(&input)).unwrap_err();
            assert_eq!(message, USAGE_ERROR);
            assert!(!message.contains("synthetic"));
        }
    }

    #[test]
    fn inventory_and_help_are_explicit_metadata_operations() {
        assert_eq!(
            parse_args(&args(&["--inventory"])),
            Ok(Operation::Inventory)
        );
        assert_eq!(parse_args(&args(&["--help"])), Ok(Operation::Help));
        assert_eq!(parse_args(&args(&["-h"])), Ok(Operation::Help));
    }

    #[test]
    fn blocked_native_states_never_report_success_to_automation() {
        for state in [
            ReadinessState::NoSelection,
            ReadinessState::InvalidModel,
            ReadinessState::ServerUnreachable,
            ReadinessState::UnsupportedRuntime,
            ReadinessState::ModelMissing,
            ReadinessState::RemoteModel,
            ReadinessState::UnsupportedCapability,
            ReadinessState::VerificationFailed,
        ] {
            assert_eq!(readiness_exit(state), 2);
        }
        assert_eq!(readiness_exit(ReadinessState::Ready), 0);
    }

    #[cfg(unix)]
    #[test]
    fn invalid_argument_encoding_is_a_controlled_usage_error() {
        use std::os::unix::ffi::OsStringExt;
        assert_eq!(
            parse_args(&[OsString::from_vec(vec![0xff])]),
            Err(USAGE_ERROR)
        );
    }
}
