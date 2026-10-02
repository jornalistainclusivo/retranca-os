use std::path::{Path, PathBuf};

/// Resolve only the binary shipped beside the application, never PATH or CWD.
pub fn resolve_bundled_sidecar(application_executable: &Path) -> Result<PathBuf, String> {
    if !application_executable.is_absolute() {
        return Err("SIDECAR_UNAVAILABLE: Application path must be absolute".into());
    }
    let directory = application_executable
        .parent()
        .ok_or("SIDECAR_UNAVAILABLE: Application directory is unavailable")?
        .canonicalize()
        .map_err(|_| "SIDECAR_UNAVAILABLE: Application directory is unavailable")?;
    let candidate = directory.join(format!("llama-sidecar{}", std::env::consts::EXE_SUFFIX));
    let resolved = candidate
        .canonicalize()
        .map_err(|_| "SIDECAR_UNAVAILABLE: Bundled executable is missing")?;
    if resolved.parent() != Some(directory.as_path()) || !resolved.is_file() {
        return Err("SIDECAR_UNAVAILABLE: Invalid bundled executable".into());
    }
    Ok(resolved)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolves_an_absolute_sibling_in_a_directory_with_spaces() {
        let temporary = tempfile::tempdir().unwrap();
        let directory = temporary.path().join("Application with spaces");
        std::fs::create_dir(&directory).unwrap();
        let binary = directory.join(format!("llama-sidecar{}", std::env::consts::EXE_SUFFIX));
        std::fs::write(&binary, b"path fixture, not an inference engine").unwrap();
        let resolved = resolve_bundled_sidecar(&directory.join("app")).unwrap();
        assert_eq!(resolved, binary.canonicalize().unwrap());
        assert!(resolved.is_absolute());
    }

    #[test]
    fn rejects_missing_binaries_directories_and_relative_application_paths() {
        let temporary = tempfile::tempdir().unwrap();
        let application = temporary.path().join("app");
        assert!(resolve_bundled_sidecar(&application).is_err());
        std::fs::create_dir(
            temporary
                .path()
                .join(format!("llama-sidecar{}", std::env::consts::EXE_SUFFIX)),
        )
        .unwrap();
        assert!(resolve_bundled_sidecar(&application).is_err());
        assert!(resolve_bundled_sidecar(Path::new("app")).is_err());
    }

    #[cfg(unix)]
    #[test]
    fn rejects_a_sibling_symlink_pointing_outside_the_application_directory() {
        let temporary = tempfile::tempdir().unwrap();
        let directory = temporary.path().join("application");
        std::fs::create_dir(&directory).unwrap();
        let outside = temporary.path().join("outside");
        std::fs::write(&outside, b"path fixture").unwrap();
        std::os::unix::fs::symlink(&outside, directory.join("llama-sidecar")).unwrap();
        assert!(resolve_bundled_sidecar(&directory.join("app")).is_err());
    }
}
