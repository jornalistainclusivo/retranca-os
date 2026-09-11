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
pub struct MediaAsset {
    pub r#type: String,
    pub format: String,
    pub visual_description: Option<String>,
    pub image_asset: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EditorialContent {
    pub title: Option<String>,
    pub summary: Option<String>,
    pub body: Option<String>,
    pub media_assets: Option<Vec<MediaAsset>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EditorialContext {
    pub content: EditorialContent,
    pub format_constraints: Option<String>,
    pub audience_persona: Option<String>,
    pub seo_keyword: Option<String>,
    pub notes: Option<String>,
    pub links: Option<Vec<String>>,
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
