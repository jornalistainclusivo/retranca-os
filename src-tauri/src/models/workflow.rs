use serde::{Deserialize, Serialize};

// ──────────────────────────────────────────────────────
// Semantic Classification Vocabulary (BR-AI-001)
// ──────────────────────────────────────────────────────

/// Approved semantic classification values for workflow stages.
/// These affect RECOMMENDED UX only — they do NOT determine action availability.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum SemanticClassification {
    #[serde(rename = "IDEA")]
    Idea,
    #[serde(rename = "RESEARCH")]
    Research,
    #[serde(rename = "DRAFTING")]
    Drafting,
    #[serde(rename = "REVIEW")]
    Review,
    #[serde(rename = "PUBLISHED")]
    Published,
}

impl SemanticClassification {
    /// Parse from string, returning None for unrecognized values.
    pub fn from_str_opt(s: &str) -> Option<Self> {
        match s {
            "IDEA" => Some(Self::Idea),
            "RESEARCH" => Some(Self::Research),
            "DRAFTING" => Some(Self::Drafting),
            "REVIEW" => Some(Self::Review),
            "PUBLISHED" => Some(Self::Published),
            _ => None,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Idea => "IDEA",
            Self::Research => "RESEARCH",
            Self::Drafting => "DRAFTING",
            Self::Review => "REVIEW",
            Self::Published => "PUBLISHED",
        }
    }
}

// ──────────────────────────────────────────────────────
// Lifecycle Role Vocabulary (BR-WF-PUB-001 .. PUB-007)
// ──────────────────────────────────────────────────────

/// The only lifecycle role introduced in Phase 6.4.
/// Lifecycle role is independent of semantic classification.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum WorkflowLifecycleRole {
    #[serde(rename = "PUBLICATION")]
    Publication,
}

impl WorkflowLifecycleRole {
    pub fn from_str_opt(s: &str) -> Option<Self> {
        match s {
            "PUBLICATION" => Some(Self::Publication),
            _ => None,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Publication => "PUBLICATION",
        }
    }
}

// ──────────────────────────────────────────────────────
// WorkflowStage (BR-WF-001)
// ──────────────────────────────────────────────────────

/// Domain representation of a workflow stage.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowStage {
    pub id: String,
    pub display_name: String,
    pub order_index: i64,
    pub semantic_classification: Option<SemanticClassification>,
    pub lifecycle_role: Option<WorkflowLifecycleRole>,
    pub is_active: bool,
    pub created_at: Option<String>,
}

// ──────────────────────────────────────────────────────
// Category (BR-CAT-001)
// ──────────────────────────────────────────────────────

/// Category provenance — standard (Free baseline) or custom (Pro).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum CategoryOrigin {
    #[serde(rename = "standard")]
    Standard,
    #[serde(rename = "custom")]
    Custom,
}

impl CategoryOrigin {
    pub fn from_str_opt(s: &str) -> Option<Self> {
        match s {
            "standard" => Some(Self::Standard),
            "custom" => Some(Self::Custom),
            _ => None,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Standard => "standard",
            Self::Custom => "custom",
        }
    }
}

/// Domain representation of a category.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub id: String,
    pub name: String,
    pub origin: CategoryOrigin,
    pub is_active: bool,
    pub created_at: Option<String>,
}

// ──────────────────────────────────────────────────────
// ChecklistTemplate (BR-CHK-001)
// ──────────────────────────────────────────────────────

/// A single item within a checklist template.
/// Contains ONLY a label — no arbitrary taxonomy (BR-CHK-001).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChecklistTemplateItem {
    pub label: String,
}

/// Domain representation of a checklist template.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChecklistTemplate {
    pub id: String,
    pub name: String,
    pub items: Vec<ChecklistTemplateItem>,
    pub created_at: Option<String>,
}

// ──────────────────────────────────────────────────────
// Validation helpers
// ──────────────────────────────────────────────────────

/// Validates that a semantic classification string is in the approved vocabulary.
/// Returns Ok(Some(..)) for valid values, Ok(None) for null/empty, Err for invalid.
pub fn validate_semantic_classification(
    value: Option<&str>,
) -> Result<Option<SemanticClassification>, String> {
    match value {
        None | Some("") => Ok(None),
        Some(s) => SemanticClassification::from_str_opt(s)
            .map(Some)
            .ok_or_else(|| format!("Invalid semantic classification: '{}'", s)),
    }
}

/// Validates that a lifecycle role string is in the approved vocabulary.
/// Returns Ok(Some(..)) for valid values, Ok(None) for null/empty, Err for invalid.
pub fn validate_lifecycle_role(
    value: Option<&str>,
) -> Result<Option<WorkflowLifecycleRole>, String> {
    match value {
        None | Some("") => Ok(None),
        Some(s) => WorkflowLifecycleRole::from_str_opt(s)
            .map(Some)
            .ok_or_else(|| format!("Invalid lifecycle role: '{}'", s)),
    }
}

/// Generate a new stable UUID v4 identifier for domain entities.
pub fn new_domain_id() -> String {
    uuid::Uuid::new_v4().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    // ── Semantic Classification ──

    #[test]
    fn test_valid_semantic_classifications() {
        for value in &["IDEA", "RESEARCH", "DRAFTING", "REVIEW", "PUBLISHED"] {
            assert!(
                SemanticClassification::from_str_opt(value).is_some(),
                "Expected '{}' to be valid",
                value
            );
        }
    }

    #[test]
    fn test_invalid_semantic_classification_rejected() {
        for value in &["idea", "UNKNOWN", "DRAFT", "published", "IN_PROGRESS", ""] {
            assert!(
                SemanticClassification::from_str_opt(value).is_none(),
                "Expected '{}' to be rejected",
                value
            );
        }
    }

    #[test]
    fn test_validate_semantic_classification_null() {
        assert_eq!(validate_semantic_classification(None).unwrap(), None);
    }

    #[test]
    fn test_validate_semantic_classification_empty() {
        assert_eq!(validate_semantic_classification(Some("")).unwrap(), None);
    }

    #[test]
    fn test_validate_semantic_classification_valid() {
        let result = validate_semantic_classification(Some("IDEA")).unwrap();
        assert_eq!(result, Some(SemanticClassification::Idea));
    }

    #[test]
    fn test_validate_semantic_classification_invalid_returns_err() {
        assert!(validate_semantic_classification(Some("DRAFT")).is_err());
    }

    // ── Lifecycle Role ──

    #[test]
    fn test_valid_lifecycle_role() {
        assert_eq!(
            WorkflowLifecycleRole::from_str_opt("PUBLICATION"),
            Some(WorkflowLifecycleRole::Publication)
        );
    }

    #[test]
    fn test_invalid_lifecycle_role_rejected() {
        for value in &["publication", "PUBLISH", "LIFECYCLE", ""] {
            assert!(
                WorkflowLifecycleRole::from_str_opt(value).is_none(),
                "Expected '{}' to be rejected",
                value
            );
        }
    }

    #[test]
    fn test_validate_lifecycle_role_null() {
        assert_eq!(validate_lifecycle_role(None).unwrap(), None);
    }

    #[test]
    fn test_validate_lifecycle_role_valid() {
        let result = validate_lifecycle_role(Some("PUBLICATION")).unwrap();
        assert_eq!(result, Some(WorkflowLifecycleRole::Publication));
    }

    #[test]
    fn test_validate_lifecycle_role_invalid_returns_err() {
        assert!(validate_lifecycle_role(Some("PUBLISH")).is_err());
    }

    // ── Category Origin ──

    #[test]
    fn test_valid_category_origins() {
        assert_eq!(
            CategoryOrigin::from_str_opt("standard"),
            Some(CategoryOrigin::Standard)
        );
        assert_eq!(
            CategoryOrigin::from_str_opt("custom"),
            Some(CategoryOrigin::Custom)
        );
    }

    #[test]
    fn test_invalid_category_origin_rejected() {
        assert!(CategoryOrigin::from_str_opt("Standard").is_none());
        assert!(CategoryOrigin::from_str_opt("").is_none());
    }

    // ── Domain ID ──

    #[test]
    fn test_new_domain_id_is_uuid_format() {
        let id = new_domain_id();
        assert_eq!(id.len(), 36);
        assert!(id.contains('-'));
        // Verify UUID parse round-trip
        assert!(uuid::Uuid::parse_str(&id).is_ok());
    }

    #[test]
    fn test_new_domain_id_uniqueness() {
        let id1 = new_domain_id();
        let id2 = new_domain_id();
        assert_ne!(id1, id2);
    }

    // ── Serialization ──

    #[test]
    fn test_semantic_classification_serializes_to_uppercase() {
        let json = serde_json::to_string(&SemanticClassification::Published).unwrap();
        assert_eq!(json, "\"PUBLISHED\"");
    }

    #[test]
    fn test_lifecycle_role_serializes_to_uppercase() {
        let json = serde_json::to_string(&WorkflowLifecycleRole::Publication).unwrap();
        assert_eq!(json, "\"PUBLICATION\"");
    }

    #[test]
    fn test_category_origin_serializes_to_lowercase() {
        let json = serde_json::to_string(&CategoryOrigin::Standard).unwrap();
        assert_eq!(json, "\"standard\"");
    }

    #[test]
    fn test_checklist_template_item_has_label_only() {
        let item = ChecklistTemplateItem {
            label: "Check SEO metadata".to_string(),
        };
        let json = serde_json::to_string(&item).unwrap();
        assert!(json.contains("label"));
        // Verify no category or taxonomy field exists
        assert!(!json.contains("category"));
        assert!(!json.contains("taxonomy"));
    }

    #[test]
    fn test_checklist_template_serialization_round_trip() {
        let template = ChecklistTemplate {
            id: new_domain_id(),
            name: "Editorial Review".to_string(),
            items: vec![
                ChecklistTemplateItem {
                    label: "Check title".to_string(),
                },
                ChecklistTemplateItem {
                    label: "Check summary".to_string(),
                },
            ],
            created_at: None,
        };
        let json = serde_json::to_string(&template).unwrap();
        let deserialized: ChecklistTemplate = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.name, "Editorial Review");
        assert_eq!(deserialized.items.len(), 2);
        assert_eq!(deserialized.items[0].label, "Check title");
        assert_eq!(deserialized.items[1].label, "Check summary");
    }

    #[test]
    fn test_workflow_stage_serialization_with_lifecycle_role() {
        let stage = WorkflowStage {
            id: new_domain_id(),
            display_name: "Publicado".to_string(),
            order_index: 4,
            semantic_classification: Some(SemanticClassification::Published),
            lifecycle_role: Some(WorkflowLifecycleRole::Publication),
            is_active: true,
            created_at: None,
        };
        let json = serde_json::to_string(&stage).unwrap();
        assert!(json.contains("\"PUBLISHED\""));
        assert!(json.contains("\"PUBLICATION\""));
        assert!(json.contains("\"order_index\":4"));
    }

    #[test]
    fn test_workflow_stage_serialization_without_lifecycle_role() {
        let stage = WorkflowStage {
            id: new_domain_id(),
            display_name: "Idea".to_string(),
            order_index: 0,
            semantic_classification: Some(SemanticClassification::Idea),
            lifecycle_role: None,
            is_active: true,
            created_at: None,
        };
        let json = serde_json::to_string(&stage).unwrap();
        assert!(json.contains("\"IDEA\""));
        assert!(json.contains("\"lifecycle_role\":null"));
    }
}
