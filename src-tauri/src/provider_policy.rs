/// Synthetic provisioning and subprocesses require an explicit debug build.
/// This remains false in release even when the feature is requested.
pub const DEV_FIXTURES_ENABLED: bool = cfg!(all(debug_assertions, feature = "dev-fixtures"));

pub fn require_development_fixtures() -> Result<(), String> {
    if DEV_FIXTURES_ENABLED {
        Ok(())
    } else {
        Err("UNSUPPORTED_CAPABILITY: Embedded test fixtures are disabled; use Ollama in local AI settings".into())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fixture_permission_requires_both_debug_and_explicit_feature() {
        assert_eq!(
            require_development_fixtures().is_ok(),
            cfg!(debug_assertions) && cfg!(feature = "dev-fixtures")
        );
        if !DEV_FIXTURES_ENABLED {
            assert!(require_development_fixtures()
                .unwrap_err()
                .starts_with("UNSUPPORTED_CAPABILITY:"));
        }
    }

    #[test]
    fn default_package_omits_fixture_and_opt_in_has_separate_identity() {
        let normal: serde_json::Value =
            serde_json::from_str(include_str!("../tauri.conf.json")).unwrap();
        let fixture: serde_json::Value =
            serde_json::from_str(include_str!("../tauri.fixture.conf.json")).unwrap();
        assert!(normal["bundle"]["externalBin"]
            .as_array()
            .unwrap()
            .is_empty());
        assert_eq!(
            fixture["bundle"]["externalBin"],
            serde_json::json!(["bin/llama-sidecar"])
        );
        assert_ne!(normal["identifier"], fixture["identifier"]);
    }
}
