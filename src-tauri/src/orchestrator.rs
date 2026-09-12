use crate::models::context::{AiAction, AiContextNoticeEvent, AiOrchestrationRequest, EditorialContext};
use tauri::{AppHandle, Emitter, State};
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
    let meta = &req.context.metadata;
    let content = &req.context.content;
    
    match req.action {
        AiAction::ResearchGaps => {
            if meta.title.is_none() && meta.objective.is_none() {
                return Err("MISSING_PREREQUISITES: Research Gaps requer title OR objective".to_string());
            }
        },
        AiAction::PlainLanguage | AiAction::ValidateInclusivity => {
            if content.is_none() && meta.summary.is_none() {
                return Err(format!("MISSING_PREREQUISITES: {:?} requer content OR summary", req.action));
            }
        },
        AiAction::GenerateAltText => {
            let has_media = req.context.media.as_ref().map(|m| !m.is_empty()).unwrap_or(false);
            if !has_media {
                return Err("MISSING_PREREQUISITES: GenerateAltText requer media".to_string());
            }
            if let Some(media_list) = &req.context.media {
                for m in media_list {
                    if m.r#type == crate::models::context::MediaAssetType::ImageAsset {
                        return Err("UNSUPPORTED_CAPABILITY: Provedor não suporta image_asset (multimodal). Use visual_description.".to_string());
                    }
                }
            }
        },
        AiAction::GenerateSeo => {
            if meta.keyword.is_none() || meta.keyword.as_ref().unwrap().trim().is_empty() {
                return Err("MISSING_PREREQUISITES: GenerateSeo requer keyword".to_string());
            }
            if content.is_none() && meta.summary.is_none() {
                return Err("MISSING_PREREQUISITES: GenerateSeo requer content OR summary".to_string());
            }
        },
        AiAction::EditorialReview => {
            if content.is_none() || meta.objective.is_none() {
                return Err("MISSING_PREREQUISITES: Editorial Review requer content AND objective".to_string());
            }
        },
        _ => {}
    }
    
    Ok(())
}

pub fn project_context(action: &AiAction, mut context: EditorialContext) -> EditorialContext {
    let mut title = None;
    let mut summary = None;
    let mut objective = None;
    let mut keyword = None;
    let mut persona = None;
    let mut content = None;
    let mut media = None;
    let mut notes = None;
    let mut links = None;
    let mut checklists_state = None;
    let mut cta = None;

    match action {
        AiAction::ResearchGaps => {
            title = context.metadata.title.take();
            objective = context.metadata.objective.take();
            notes = context.notes.take();
            links = context.links.take();
            keyword = context.metadata.keyword.take();
        },
        AiAction::PlainLanguage => {
            content = context.content.take();
            summary = context.metadata.summary.take();
            persona = context.metadata.persona.take();
        },
        AiAction::ValidateInclusivity => {
            content = context.content.take();
            summary = context.metadata.summary.take();
        },
        AiAction::GenerateAltText => {
            media = context.media.take();
            title = context.metadata.title.take();
        },
        AiAction::GenerateSeo => {
            keyword = context.metadata.keyword.take();
            content = context.content.take();
            summary = context.metadata.summary.take();
            title = context.metadata.title.take();
            objective = context.metadata.objective.take();
            persona = context.metadata.persona.take();
            cta = context.metadata.cta.take();
        },
        AiAction::EditorialReview => {
            content = context.content.take();
            objective = context.metadata.objective.take();
            notes = context.notes.take();
            links = context.links.take();
            checklists_state = context.checklists_state.take();
        },
        AiAction::GenerateOutline | AiAction::CheckAccessibility => {
            title = context.metadata.title.take();
            summary = context.metadata.summary.take();
            objective = context.metadata.objective.take();
            content = context.content.take();
        }
    }

    context.metadata.title = title;
    context.metadata.summary = summary;
    context.metadata.objective = objective;
    context.metadata.keyword = keyword;
    context.metadata.persona = persona;
    context.metadata.cta = cta;
    context.content = content;
    context.media = media;
    context.notes = notes;
    context.links = links;
    context.checklists_state = checklists_state;

    context
}

pub fn apply_budget(action: &AiAction, mut context: EditorialContext) -> Result<(EditorialContext, Vec<String>), String> {
    let mut omitted_fields = Vec::new();
    
    let get_len = |ctx: &EditorialContext| -> usize {
        let mut len = 0;
        if let Some(t) = &ctx.metadata.title { len += t.len(); }
        if let Some(s) = &ctx.metadata.summary { len += s.len(); }
        if let Some(o) = &ctx.metadata.objective { len += o.len(); }
        if let Some(k) = &ctx.metadata.keyword { len += k.len(); }
        if let Some(p) = &ctx.metadata.persona { len += p.len(); }
        if let Some(c) = &ctx.metadata.cta { len += c.len(); }
        if let Some(c) = &ctx.content { len += c.text.len(); }
        if let Some(m) = &ctx.media {
            for asset in m { len += asset.data.len(); }
        }
        if let Some(n) = &ctx.notes { len += n.len(); }
        // We roughly estimate links and checklists as 500 bytes each if present, or just use string repr if needed.
        if ctx.links.is_some() { len += 300; }
        if ctx.checklists_state.is_some() { len += 500; }
        len
    };

    let mut current_len = get_len(&context);

    // Try dropping optional fields if we exceed budget
    if current_len > FALLBACK_CONTEXT_LIMIT {
        let mut drop_field = |field_name: &str| {
            if current_len > FALLBACK_CONTEXT_LIMIT {
                match field_name {
                    "notes" => if context.notes.is_some() { context.notes = None; omitted_fields.push(field_name.to_string()); },
                    "links" => if context.links.is_some() { context.links = None; omitted_fields.push(field_name.to_string()); },
                    "checklistsState" => if context.checklists_state.is_some() { context.checklists_state = None; omitted_fields.push(field_name.to_string()); },
                    "persona" => if context.metadata.persona.is_some() { context.metadata.persona = None; omitted_fields.push(field_name.to_string()); },
                    "title" => if context.metadata.title.is_some() { context.metadata.title = None; omitted_fields.push(field_name.to_string()); },
                    "objective" => if context.metadata.objective.is_some() { context.metadata.objective = None; omitted_fields.push(field_name.to_string()); },
                    "cta" => if context.metadata.cta.is_some() { context.metadata.cta = None; omitted_fields.push(field_name.to_string()); },
                    "keyword" => if context.metadata.keyword.is_some() { context.metadata.keyword = None; omitted_fields.push(field_name.to_string()); },
                    _ => {}
                }
                current_len = get_len(&context);
            }
        };

        // Action-specific optional fields to drop
        match action {
            AiAction::ResearchGaps => {
                drop_field("notes"); drop_field("links"); drop_field("keyword");
            },
            AiAction::PlainLanguage => {
                drop_field("persona");
            },
            AiAction::GenerateAltText => {
                drop_field("title");
            },
            AiAction::GenerateSeo => {
                drop_field("persona"); drop_field("cta"); drop_field("objective"); drop_field("title");
            },
            AiAction::EditorialReview => {
                drop_field("notes"); drop_field("links"); drop_field("checklistsState");
            },
            _ => {}
        }
    }

    if current_len > FALLBACK_CONTEXT_LIMIT {
        return Err("CONTEXT_EXCEEDED: Campos essenciais excedem o limite de contexto do modelo.".to_string());
    }
    
    Ok((context, omitted_fields))
}

pub fn assemble_prompt(action: &AiAction, context: &EditorialContext) -> String {
    let mut prompt = String::new();
    
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
    
    write!(&mut prompt, "Atue como um assistente editorial estrito. Forneça apenas a resposta final solicitada, sem saudações, conclusões ou perguntas.\n\n").unwrap();
    write!(&mut prompt, "{}\n\n", task_instruction).unwrap();
    
    if context.content.is_none() && context.metadata.summary.is_some() {
        write!(&mut prompt, "AVISO DE ESCOPO: A análise a seguir é baseada apenas no resumo da pauta, não no texto completo. Resultados podem ser parciais.\n\n").unwrap();
    }
    
    write!(&mut prompt, "<article_data>\n").unwrap();
    
    if let Some(title) = &context.metadata.title {
        write!(&mut prompt, "<title>{}</title>\n", escape_xml(title)).unwrap();
    }
    if let Some(summary) = &context.metadata.summary {
        write!(&mut prompt, "<summary>{}</summary>\n", escape_xml(summary)).unwrap();
    }
    if let Some(objective) = &context.metadata.objective {
        write!(&mut prompt, "<objective>{}</objective>\n", escape_xml(objective)).unwrap();
    }
    if let Some(keyword) = &context.metadata.keyword {
        write!(&mut prompt, "<keyword>{}</keyword>\n", escape_xml(keyword)).unwrap();
    }
    if let Some(persona) = &context.metadata.persona {
        write!(&mut prompt, "<persona>{}</persona>\n", escape_xml(persona)).unwrap();
    }
    
    if let Some(content) = &context.content {
        write!(&mut prompt, "<body>{}</body>\n", escape_xml(&content.text)).unwrap();
    }
    if let Some(notes) = &context.notes {
        write!(&mut prompt, "<notes>{}</notes>\n", escape_xml(notes)).unwrap();
    }
    if let Some(media) = &context.media {
        write!(&mut prompt, "<media>\n").unwrap();
        for m in media {
            let type_str = match m.r#type {
                crate::models::context::MediaAssetType::ImageAsset => "image_asset",
                crate::models::context::MediaAssetType::VisualDescription => "visual_description",
            };
            write!(&mut prompt, "  <asset type=\"{}\">{}</asset>\n", escape_xml(type_str), escape_xml(&m.data)).unwrap();
        }
        write!(&mut prompt, "</media>\n").unwrap();
    }
    
    write!(&mut prompt, "</article_data>").unwrap();
    
    prompt
}

#[tauri::command]
pub async fn start_orchestrated_inference(
    app: AppHandle,
    registry: State<'_, crate::ai_supervisor::JobRegistry>,
    request: AiOrchestrationRequest,
) -> Result<(), String> {
    // 1. Validation
    validate_prerequisites(&request)?;

    // 2. Projection
    let projected_context = project_context(&request.action, request.context);

    // 3. Budget and Optional Field Omission
    let (budgeted_context, omitted_fields) = apply_budget(&request.action, projected_context)?;

    // 4. Emit Notice if fields were omitted
    if !omitted_fields.is_empty() {
        let _ = app.emit("ai-stream-notice", AiContextNoticeEvent {
            job_id: request.job_id.clone(),
            notice_code: "CONTEXT_REDUCED".to_string(),
            omitted_fields,
            message: "Alguns campos não essenciais foram omitidos devido ao limite de contexto.".to_string(),
        });
    }

    // 5. Prompt Assembly
    let prompt = assemble_prompt(&request.action, &budgeted_context);

    // 6. Dispatch
    let provider_upper = request.provider.to_uppercase();
    if provider_upper == "OLLAMA" {
        if request.model.is_none() || request.model.as_ref().unwrap().trim().is_empty() {
            return Err("VALIDATION_ERROR: Model must be explicitly selected for OLLAMA".to_string());
        }
        let model = request.model.unwrap();
        // Call internal ollama function
        crate::ollama_gateway::start_ollama_inference_internal(app, request.job_id, model, prompt).await
    } else if provider_upper == "SIDECAR" {
        let model = request.model.unwrap_or_else(|| "default".to_string());
        // For Sidecar, we dispatch via ai_supervisor
        crate::ai_supervisor::start_inference_internal(app, registry, request.job_id, "sidecar".to_string(), vec!["--model".to_string(), model, "--prompt".to_string(), prompt]).await
    } else {
        Err(format!("UNSUPPORTED_CAPABILITY: Provedor não suportado: {}", request.provider))
    }
}
