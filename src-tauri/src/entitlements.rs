use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};

#[cfg(debug_assertions)]
static DEVELOPER_PREMIUM: AtomicBool = AtomicBool::new(false);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum EntitlementState {
    Unknown,
    FreeConfirmed,
    ProActive,
    ProTemporarilyUnverifiable,
    ProUnavailable,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum EntitlementError {
    ConfirmedFreeProtectedMutationDenied,
    EntitlementStateUnknown,
    EntitlementUnavailable,
    // Add generic errors if needed by future contract
    VerificationFailed,
}

impl std::fmt::Display for EntitlementError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::ConfirmedFreeProtectedMutationDenied => {
                write!(f, "ERR_CONFIRMED_FREE_PRO_MUTATION_DENIED")
            }
            Self::EntitlementStateUnknown => write!(f, "ERR_ENTITLEMENT_STATE_UNKNOWN"),
            Self::EntitlementUnavailable => write!(f, "ERR_ENTITLEMENT_UNAVAILABLE"),
            Self::VerificationFailed => write!(f, "ERR_VERIFICATION_FAILED"),
        }
    }
}

pub trait EntitlementDecisionProvider: Send + Sync {
    async fn check_entitlement(&self) -> Result<EntitlementState, EntitlementError>;
}

pub enum EntitlementEvidence {
    ValidProductionPro,
    ConfirmedDowngrade,
    VerificationUnavailable,
    UnverifiableContinuityExhausted,
}

impl EntitlementState {
    pub fn apply_evidence(self, evidence: EntitlementEvidence) -> Self {
        match (self, evidence) {
            // From Unknown
            (EntitlementState::Unknown, EntitlementEvidence::ValidProductionPro) => {
                EntitlementState::ProActive
            }
            (EntitlementState::Unknown, EntitlementEvidence::ConfirmedDowngrade) => {
                EntitlementState::FreeConfirmed
            }
            (EntitlementState::Unknown, _) => EntitlementState::Unknown,

            // From FreeConfirmed
            (EntitlementState::FreeConfirmed, EntitlementEvidence::ValidProductionPro) => {
                EntitlementState::ProActive
            }
            (EntitlementState::FreeConfirmed, _) => EntitlementState::FreeConfirmed,

            // From ProActive
            (EntitlementState::ProActive, EntitlementEvidence::ConfirmedDowngrade) => {
                EntitlementState::FreeConfirmed
            }
            (EntitlementState::ProActive, EntitlementEvidence::VerificationUnavailable) => {
                EntitlementState::ProTemporarilyUnverifiable
            }
            (EntitlementState::ProActive, _) => EntitlementState::ProActive,

            // From ProTemporarilyUnverifiable
            (
                EntitlementState::ProTemporarilyUnverifiable,
                EntitlementEvidence::ValidProductionPro,
            ) => EntitlementState::ProActive,
            (
                EntitlementState::ProTemporarilyUnverifiable,
                EntitlementEvidence::ConfirmedDowngrade,
            ) => EntitlementState::FreeConfirmed,
            (
                EntitlementState::ProTemporarilyUnverifiable,
                EntitlementEvidence::UnverifiableContinuityExhausted,
            ) => EntitlementState::ProUnavailable,
            (EntitlementState::ProTemporarilyUnverifiable, _) => {
                EntitlementState::ProTemporarilyUnverifiable
            }

            // From ProUnavailable
            (EntitlementState::ProUnavailable, EntitlementEvidence::ValidProductionPro) => {
                EntitlementState::ProActive
            }
            (EntitlementState::ProUnavailable, EntitlementEvidence::ConfirmedDowngrade) => {
                EntitlementState::FreeConfirmed
            }
            (EntitlementState::ProUnavailable, _) => EntitlementState::ProUnavailable,
        }
    }
}

pub fn authorize_mutation(state: &EntitlementState) -> Result<(), EntitlementError> {
    match state {
        EntitlementState::ProActive => Ok(()),
        EntitlementState::ProTemporarilyUnverifiable => Ok(()),
        EntitlementState::FreeConfirmed => {
            Err(EntitlementError::ConfirmedFreeProtectedMutationDenied)
        }
        EntitlementState::Unknown => Err(EntitlementError::EntitlementStateUnknown),
        EntitlementState::ProUnavailable => Err(EntitlementError::EntitlementUnavailable),
    }
}

#[derive(Serialize)]
pub struct EntitlementStatus {
    #[serde(rename = "type")]
    pub entitlement_type: String,
    pub is_premium: bool,
    pub state: EntitlementState,
}

#[tauri::command]
pub fn get_entitlements() -> Result<EntitlementStatus, String> {
    let state = {
        #[cfg(debug_assertions)]
        {
            if DEVELOPER_PREMIUM.load(Ordering::SeqCst) {
                EntitlementState::ProActive
            } else {
                EntitlementState::Unknown
            }
        }
        #[cfg(not(debug_assertions))]
        {
            EntitlementState::Unknown
        }
    };

    let is_premium = matches!(
        state,
        EntitlementState::ProActive | EntitlementState::ProTemporarilyUnverifiable
    );

    let entitlement_type = if is_premium {
        #[cfg(debug_assertions)]
        if DEVELOPER_PREMIUM.load(Ordering::SeqCst) {
            "DEVELOPER_PREMIUM".to_string()
        } else {
            "PRO".to_string()
        }
        #[cfg(not(debug_assertions))]
        "PRO".to_string()
    } else {
        "FREE".to_string()
    };

    Ok(EntitlementStatus {
        entitlement_type,
        is_premium,
        state,
    })
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ent_001_unknown_transitions() {
        let state = EntitlementState::Unknown;

        let to_pro = state.apply_evidence(EntitlementEvidence::ValidProductionPro);
        assert_eq!(to_pro, EntitlementState::ProActive);

        let to_free = state.apply_evidence(EntitlementEvidence::ConfirmedDowngrade);
        assert_eq!(to_free, EntitlementState::FreeConfirmed);
    }

    #[test]
    fn test_ent_002_pro_active_transitions() {
        let state = EntitlementState::ProActive;

        let to_temp = state.apply_evidence(EntitlementEvidence::VerificationUnavailable);
        assert_eq!(to_temp, EntitlementState::ProTemporarilyUnverifiable);

        let to_free = state.apply_evidence(EntitlementEvidence::ConfirmedDowngrade);
        assert_eq!(to_free, EntitlementState::FreeConfirmed);
    }

    #[test]
    fn test_ent_003_unverifiable_and_unavailable_to_free_requires_downgrade() {
        let temp = EntitlementState::ProTemporarilyUnverifiable;
        // Without confirmed downgrade, remains temp if arbitrary verification unavailable
        assert_eq!(
            temp.apply_evidence(EntitlementEvidence::VerificationUnavailable),
            EntitlementState::ProTemporarilyUnverifiable
        );
        // WITH confirmed downgrade, moves to free
        assert_eq!(
            temp.apply_evidence(EntitlementEvidence::ConfirmedDowngrade),
            EntitlementState::FreeConfirmed
        );

        let unavail = EntitlementState::ProUnavailable;
        // Without confirmed downgrade, remains unavail
        assert_eq!(
            unavail.apply_evidence(EntitlementEvidence::VerificationUnavailable),
            EntitlementState::ProUnavailable
        );
        // WITH confirmed downgrade, moves to free
        assert_eq!(
            unavail.apply_evidence(EntitlementEvidence::ConfirmedDowngrade),
            EntitlementState::FreeConfirmed
        );
    }

    #[test]
    fn test_ent_004_valid_temporary_unavailable_transitions() {
        let temp = EntitlementState::ProTemporarilyUnverifiable;
        assert_eq!(
            temp.apply_evidence(EntitlementEvidence::ValidProductionPro),
            EntitlementState::ProActive
        );
        assert_eq!(
            temp.apply_evidence(EntitlementEvidence::UnverifiableContinuityExhausted),
            EntitlementState::ProUnavailable
        );

        let unavail = EntitlementState::ProUnavailable;
        assert_eq!(
            unavail.apply_evidence(EntitlementEvidence::ValidProductionPro),
            EntitlementState::ProActive
        );
    }

    #[test]
    fn test_ent_005_unknown_does_not_become_temporarily_unverifiable() {
        let state = EntitlementState::Unknown;
        let next = state.apply_evidence(EntitlementEvidence::VerificationUnavailable);
        // Must not become ProTemporarilyUnverifiable merely because of unavailability
        assert_eq!(next, EntitlementState::Unknown);
    }

    #[test]
    fn test_ent_006_authorization_matrix() {
        assert_eq!(authorize_mutation(&EntitlementState::ProActive), Ok(()));
        assert_eq!(
            authorize_mutation(&EntitlementState::ProTemporarilyUnverifiable),
            Ok(())
        );

        assert_eq!(
            authorize_mutation(&EntitlementState::FreeConfirmed),
            Err(EntitlementError::ConfirmedFreeProtectedMutationDenied)
        );
        assert_eq!(
            authorize_mutation(&EntitlementState::Unknown),
            Err(EntitlementError::EntitlementStateUnknown)
        );
        assert_eq!(
            authorize_mutation(&EntitlementState::ProUnavailable),
            Err(EntitlementError::EntitlementUnavailable)
        );
    }

    #[test]
    fn test_ent_007_free_to_pro_on_valid_evidence() {
        let state = EntitlementState::FreeConfirmed;
        let next = state.apply_evidence(EntitlementEvidence::ValidProductionPro);
        assert_eq!(next, EntitlementState::ProActive);
    }

    #[test]
    fn test_sec_001_release_build_rejection() {
        #[cfg(not(debug_assertions))]
        {
            // Verify that set_developer_premium is rejected in release
            let res = set_developer_premium(true);
            assert!(res.is_err());
            assert_eq!(
                res.unwrap_err(),
                "Developer Premium is strictly prohibited in release builds."
            );

            // Verify get_entitlements never reports developer premium in release
            let ents = get_entitlements().unwrap();
            assert_eq!(ents.entitlement_type, "FREE");
            assert_eq!(ents.is_premium, false);
            assert_eq!(ents.state, EntitlementState::Unknown);
        }

        // Let's also just ensure compiling it passes debug tests
        #[cfg(debug_assertions)]
        {
            // Reset for test
            DEVELOPER_PREMIUM.store(false, Ordering::SeqCst);

            // Set true
            assert!(set_developer_premium(true).is_ok());
            let ents = get_entitlements().unwrap();
            assert_eq!(ents.entitlement_type, "DEVELOPER_PREMIUM");
            assert_eq!(ents.is_premium, true);
            assert_eq!(ents.state, EntitlementState::ProActive);

            // Set false
            assert!(set_developer_premium(false).is_ok());
            let ents = get_entitlements().unwrap();
            assert_eq!(ents.entitlement_type, "FREE");
            assert_eq!(ents.is_premium, false);
            assert_eq!(ents.state, EntitlementState::Unknown);
        }
    }

    #[test]
    fn test_sec_002_lack_of_developer_premium_is_unknown() {
        #[cfg(debug_assertions)]
        DEVELOPER_PREMIUM.store(false, Ordering::SeqCst);

        let ents = get_entitlements().unwrap();
        // Lack of Developer Premium does NOT establish FreeConfirmed.
        assert_eq!(ents.state, EntitlementState::Unknown);
        assert_ne!(ents.state, EntitlementState::FreeConfirmed);
    }
}
