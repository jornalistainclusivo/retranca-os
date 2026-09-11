use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum AiAction {
    GenerateOutline,
    GenerateAltText,
    GenerateSeo,
    CheckAccessibility,
    ValidateInclusivity,
    ResearchGaps,
    PlainLanguage,
    EditorialReview,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EditorialMetadata {
    pub title: Option<String>,
    pub summary: Option<String>,
    pub objective: Option<String>,
    pub keyword: Option<String>,
    pub persona: Option<String>,
    pub cta: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EditorialLinks {
    pub internal: Option<String>,
    pub external: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EditorialChecklistsState {
    pub total: u32,
    pub completed: u32,
    pub pending_items: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EditorialContent {
    pub source: String,
    pub text: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MediaAsset {
    pub r#type: String,
    pub data: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EditorialContext {
    pub article_id: String,
    pub editorial_status: String,
    pub category_tag: String,
    pub metadata: EditorialMetadata,
    pub notes: Option<String>,
    pub links: Option<EditorialLinks>,
    pub checklists_state: Option<EditorialChecklistsState>,
    pub content: Option<EditorialContent>,
    pub media: Option<Vec<MediaAsset>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AiOrchestrationRequest {
    pub job_id: String,
    pub action: AiAction,
    pub context: EditorialContext,
    pub provider: String,
    pub model: Option<String>,
}

#[derive(Serialize, Clone)]
pub struct AiContextNoticeEvent {
    pub job_id: String,
    pub notice_code: String,
    pub omitted_fields: Vec<String>,
    pub message: String,
}

#[derive(Serialize, Clone)]
pub struct AiErrorEvent {
    pub job_id: String,
    pub error_code: String,
    pub message: String,
}
