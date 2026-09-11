use serde::Serialize;
use std::sync::atomic::{AtomicBool, Ordering};

#[cfg(debug_assertions)]
static DEVELOPER_PREMIUM: AtomicBool = AtomicBool::new(false);

#[derive(Serialize)]
pub struct EntitlementStatus {
    #[serde(rename = "type")]
    pub entitlement_type: String,
    pub is_premium: bool,
}

#[tauri::command]
pub fn get_entitlements() -> Result<EntitlementStatus, String> {
    #[cfg(debug_assertions)]
    {
        if DEVELOPER_PREMIUM.load(Ordering::SeqCst) {
            Ok(EntitlementStatus {
                entitlement_type: "DEVELOPER_PREMIUM".to_string(),
                is_premium: true,
            })
        } else {
            Ok(EntitlementStatus {
                entitlement_type: "FREE".to_string(),
                is_premium: false,
            })
        }
    }
    #[cfg(not(debug_assertions))]
    {
        Ok(EntitlementStatus {
            entitlement_type: "FREE".to_string(),
            is_premium: false,
        })
    }
}

#[tauri::command]
pub fn set_developer_premium(enabled: bool) -> Result<(), String> {
    #[cfg(debug_assertions)]
    {
        DEVELOPER_PREMIUM.store(enabled, Ordering::SeqCst);
        Ok(())
    }
    #[cfg(not(debug_assertions))]
    {
        let _ = enabled;
        Err("Developer Premium is strictly prohibited in release builds.".to_string())
    }
}
