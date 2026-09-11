use crate::models::context::{AiAction, AiContextNoticeEvent, AiOrchestrationRequest, EditorialContext};
use tauri::{AppHandle, Emitter};
use std::fmt::Write;

pub const FALLBACK_CONTEXT_LIMIT: usize = 8000;

fn escape_xml(input: &str) -> String {
    input
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")
        .replace("'", "&apos;")
}

pub fn validate_prerequisites(req: &AiOrchestrationRequest) -> Result<(), String> {
    match req.action {
        AiAction::GenerateSeo => {
            if req.context.seo_keyword.is_none() || req.context.seo_keyword.as_ref().unwrap().trim().is_empty() {
                return Err("MISSING_PREREQUISITES: GenerateSeo requer seo_keyword".to_string());
            }
        }
        AiAction::GenerateAltText => {
            let has_images = req.context.content.media_assets.as_ref().map(|m| !m.is_empty()).unwrap_or(false);
            if !has_images {
                return Err("MISSING_PREREQUISITES: GenerateAltText requer media_assets".to_string());
            }
            
            // Check for capability multimodal if image_asset is present
            if let Some(assets) = &req.context.content.media_assets {
                for asset in assets {
                    if asset.image_asset.is_some() {
                        // Assuming capability check - for now if local ollama provider doesn't support multimodal
                        if req.provider == "ollama" { // simplistic check
                            return Err("UNSUPPORTED_CAPABILITY: Provedor não suporta image_asset (multimodal)".to_string());
                        }
                    }
                }
            }
        }
        _ => {}
    }
    
    if req.context.content.title.is_none() && req.context.content.body.is_none() {
        return Err("VALIDATION_ERROR: Contexto deve conter pelo menos title ou body".to_string());
    }
    
    Ok(())
}

pub fn apply_budget(mut context: EditorialContext) -> Result<(EditorialContext, Vec<String>), String> {
    let mut omitted_fields = Vec::new();
    
    // Simplistic length calculation
    let mut current_len = 0;
    if let Some(t) = &context.content.title { current_len += t.len(); }
    if let Some(s) = &context.content.summary { current_len += s.len(); }
    if let Some(b) = &context.content.body { current_len += b.len(); }
    
    if current_len > FALLBACK_CONTEXT_LIMIT {
        return Err("CONTEXT_EXCEEDED: O conteúdo essencial (title, summary, body) excede o orçamento de caracteres".to_string());
    }

    if let Some(notes) = &context.notes {
        if current_len + notes.len() > FALLBACK_CONTEXT_LIMIT {
            context.notes = None;
            omitted_fields.push("notes".to_string());
        } else {
            current_len += notes.len();
        }
    }
    
    if let Some(links) = &context.links {
        let links_len: usize = links.iter().map(|l| l.len()).sum();
        if current_len + links_len > FALLBACK_CONTEXT_LIMIT {
            context.links = None;
            omitted_fields.push("links".to_string());
        } else {
            // current_len += links_len;
        }
    }
    
    Ok((context, omitted_fields))
}

pub fn assemble_prompt(action: &AiAction, context: &EditorialContext) -> String {
    let mut prompt = String::new();
    
    // Static system/task instructions based on action
    let task_instruction = match action {
        AiAction::GenerateOutline => "Gere um rascunho de estrutura para o artigo.",
        AiAction::GenerateAltText => "Gere descrições alternativas para as mídias fornecidas.",
        AiAction::GenerateSeo => "Gere meta title e meta description otimizados para SEO.",
        AiAction::CheckAccessibility => "Avalie a acessibilidade estrutural do artigo.",
        AiAction::ValidateInclusivity => "Revise o artigo buscando linguagem inclusiva.",
        AiAction::ResearchGaps => "Aponte lacunas de pesquisa baseando-se no conteúdo.",
        AiAction::PlainLanguage => "Reescreva o conteúdo utilizando linguagem simples.",
        AiAction::EditorialReview => "Realize uma revisão editorial completa.",
    };
    
    write!(&mut prompt, "{}\n\n<article_data>\n", task_instruction).unwrap();
    
    if let Some(title) = &context.content.title {
        write!(&mut prompt, "<title>{}</title>\n", escape_xml(title)).unwrap();
    }
    if let Some(summary) = &context.content.summary {
        write!(&mut prompt, "<summary>{}</summary>\n", escape_xml(summary)).unwrap();
    }
    if let Some(body) = &context.content.body {
        write!(&mut prompt, "<body>{}</body>\n", escape_xml(body)).unwrap();
    }
    if let Some(notes) = &context.notes {
        write!(&mut prompt, "<notes>{}</notes>\n", escape_xml(notes)).unwrap();
    }
    
    write!(&mut prompt, "</article_data>").unwrap();
    
    prompt
}

#[tauri::command]
pub async fn start_orchestrated_inference(
    app: AppHandle,
    req: AiOrchestrationRequest,
) -> Result<(), String> {
    // 1. Validation
    validate_prerequisites(&req)?;

    // 2. Budget and Optional Field Omission
    let (budgeted_context, omitted_fields) = apply_budget(req.context.clone())?;

    // 3. Emit Notice if fields were omitted
    if !omitted_fields.is_empty() {
        let _ = app.emit("ai-stream-notice", AiContextNoticeEvent {
            job_id: req.job_id.clone(),
            notice_code: "CONTEXT_REDUCED".to_string(),
            omitted_fields,
            message: "Alguns campos não essenciais foram omitidos devido ao limite de contexto.".to_string(),
        });
    }

    // 4. Prompt Assembly
    let prompt = assemble_prompt(&req.action, &budgeted_context);

    // 5. Dispatch
    // 5. Dispatch
    let provider_upper = req.provider.to_uppercase();
    if provider_upper == "OLLAMA" {
        let model = req.model.unwrap_or_else(|| "gemma:2b".to_string());
        // Call internal ollama function
        crate::ollama_gateway::start_ollama_inference_internal(app, req.job_id, model, prompt).await
    } else if provider_upper == "SIDECAR" {
        let _model = req.model.unwrap_or_else(|| "default".to_string());
        // For Sidecar, we just pass the prompt as an arg for now
        // crate::ai_supervisor::start_inference_internal(app, req.job_id, _model, vec![prompt]).await
        Err("Sidecar provider unsupported via orchestrator yet".to_string())
    } else {
        Err(format!("UNSUPPORTED_CAPABILITY: Provedor não suportado: {}", req.provider))
    }
}
