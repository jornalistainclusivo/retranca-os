use crate::models::context::{
    AiAction, AiContextNoticeEvent, AiOrchestrationRequest, EditorialContext,
};
use std::fmt::Write;
use tauri::{AppHandle, Emitter, State};

pub const FALLBACK_CONTEXT_LIMIT: usize = 8000;

#[derive(Debug)]
pub struct ProjectedEditorialContext {
    pub metadata: crate::models::context::EditorialMetadata,
    pub notes: Option<String>,
    pub links: Option<crate::models::context::EditorialLinks>,
    pub checklists_state: Option<crate::models::context::EditorialChecklistsState>,
    pub content: Option<crate::models::context::EditorialContent>,
    pub media: Option<Vec<crate::models::context::MediaAsset>>,
}

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
                return Err(
                    "MISSING_PREREQUISITES: Research Gaps requer title OR objective".to_string(),
                );
            }
        }
        AiAction::PlainLanguage | AiAction::ValidateInclusivity => {
            if content.is_none() && meta.summary.is_none() {
                return Err(format!(
                    "MISSING_PREREQUISITES: {:?} requer content OR summary",
                    req.action
                ));
            }
        }
        AiAction::GenerateAltText => {
            let has_media = req
                .context
                .media
                .as_ref()
                .map(|m| !m.is_empty())
                .unwrap_or(false);
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
        }
        AiAction::GenerateSeo => {
            if meta.keyword.is_none() || meta.keyword.as_ref().unwrap().trim().is_empty() {
                return Err("MISSING_PREREQUISITES: GenerateSeo requer keyword".to_string());
            }
            if content.is_none() && meta.summary.is_none() {
                return Err(
                    "MISSING_PREREQUISITES: GenerateSeo requer content OR summary".to_string(),
                );
            }
        }
        AiAction::EditorialReview => {
            if content.is_none() || meta.objective.is_none() {
                return Err(
                    "MISSING_PREREQUISITES: Editorial Review requer content AND objective"
                        .to_string(),
                );
            }
        }
        _ => {}
    }

    Ok(())
}

pub fn project_context(action: &AiAction, mut context: EditorialContext) -> ProjectedEditorialContext {
    let mut projected = ProjectedEditorialContext {
        metadata: crate::models::context::EditorialMetadata {
            title: None,
            summary: None,
            objective: None,
            keyword: None,
            persona: None,
            cta: None,
        },
        notes: None,
        links: None,
        checklists_state: None,
        content: None,
        media: None,
    };

    let mut evidence_content = None;
    let mut evidence_summary = None;
    
    // Evidence channel selection (Content preferred over Summary)
    match action {
        AiAction::PlainLanguage | AiAction::ValidateInclusivity | AiAction::GenerateSeo => {
            if context.content.is_some() {
                evidence_content = context.content.take();
            } else {
                evidence_summary = context.metadata.summary.take();
            }
        }
        _ => {}
    }

    match action {
        AiAction::ResearchGaps => {
            projected.metadata.title = context.metadata.title.take();
            projected.metadata.objective = context.metadata.objective.take();
            projected.notes = context.notes.take();
            projected.links = Some(context.links);
            projected.metadata.keyword = context.metadata.keyword.take();
        }
        AiAction::PlainLanguage => {
            projected.content = evidence_content;
            projected.metadata.summary = evidence_summary;
            projected.metadata.persona = context.metadata.persona.take();
        }
        AiAction::ValidateInclusivity => {
            projected.content = evidence_content;
            projected.metadata.summary = evidence_summary;
        }
        AiAction::GenerateAltText => {
            projected.media = context.media.take();
            projected.metadata.title = context.metadata.title.take();
        }
        AiAction::GenerateSeo => {
            projected.metadata.keyword = context.metadata.keyword.take();
            projected.content = evidence_content;
            projected.metadata.summary = evidence_summary;
            projected.metadata.title = context.metadata.title.take();
            projected.metadata.objective = context.metadata.objective.take();
            projected.metadata.persona = context.metadata.persona.take();
            projected.metadata.cta = context.metadata.cta.take();
        }
        AiAction::EditorialReview => {
            projected.content = context.content.take();
            projected.metadata.objective = context.metadata.objective.take();
            projected.notes = context.notes.take();
            projected.links = Some(context.links);
            projected.checklists_state = Some(context.checklists_state);
        }
        AiAction::GenerateOutline | AiAction::CheckAccessibility => {
            projected.metadata.title = context.metadata.title.take();
            projected.metadata.summary = context.metadata.summary.take();
            projected.metadata.objective = context.metadata.objective.take();
            projected.content = context.content.take();
        }
    }

    projected
}

pub fn apply_budget(
    action: &AiAction,
    mut context: ProjectedEditorialContext,
) -> Result<(ProjectedEditorialContext, Vec<String>), String> {
    let mut omitted_fields = Vec::new();

    let get_len = |ctx: &ProjectedEditorialContext| -> usize {
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
        if let Some(l) = &ctx.links {
            if let Some(i) = &l.internal { len += i.len(); }
            if let Some(e) = &l.external { len += e.len(); }
        }
        if let Some(ch) = &ctx.checklists_state {
            for item in &ch.pending_items { len += item.len(); }
            len += 100; // rough xml overhead
        }
        len
    };

    let mut current_len = get_len(&context);

    if current_len > FALLBACK_CONTEXT_LIMIT {
        let mut drop_field = |field_name: &str| {
            if current_len > FALLBACK_CONTEXT_LIMIT {
                match field_name {
                    "notes" => {
                        if context.notes.is_some() {
                            context.notes = None;
                            omitted_fields.push(field_name.to_string());
                        }
                    }
                    "links" => {
                        if context.links.is_some() {
                            context.links = None;
                            omitted_fields.push(field_name.to_string());
                        }
                    }
                    "checklistsState" => {
                        if context.checklists_state.is_some() {
                            context.checklists_state = None;
                            omitted_fields.push(field_name.to_string());
                        }
                    }
                    "persona" => {
                        if context.metadata.persona.is_some() {
                            context.metadata.persona = None;
                            omitted_fields.push(field_name.to_string());
                        }
                    }
                    "title" => {
                        if context.metadata.title.is_some() {
                            context.metadata.title = None;
                            omitted_fields.push(field_name.to_string());
                        }
                    }
                    "objective" => {
                        if context.metadata.objective.is_some() {
                            context.metadata.objective = None;
                            omitted_fields.push(field_name.to_string());
                        }
                    }
                    "cta" => {
                        if context.metadata.cta.is_some() {
                            context.metadata.cta = None;
                            omitted_fields.push(field_name.to_string());
                        }
                    }
                    "keyword" => {
                        if context.metadata.keyword.is_some() {
                            context.metadata.keyword = None;
                            omitted_fields.push(field_name.to_string());
                        }
                    }
                    _ => {}
                }
                current_len = get_len(&context);
            }
        };

        match action {
            AiAction::ResearchGaps => {
                drop_field("notes");
                drop_field("links");
                drop_field("keyword");
            }
            AiAction::PlainLanguage => {
                drop_field("persona");
            }
            AiAction::GenerateAltText => {
                drop_field("title");
            }
            AiAction::GenerateSeo => {
                drop_field("persona");
                drop_field("cta");
                drop_field("objective");
                drop_field("title");
            }
            AiAction::EditorialReview => {
                drop_field("notes");
                drop_field("links");
                drop_field("checklistsState");
            }
            _ => {}
        }
    }

    if current_len > FALLBACK_CONTEXT_LIMIT {
        return Err("CONTEXT_EXCEEDED: Campos essenciais excedem o limite de contexto do modelo.".to_string());
    }

    Ok((context, omitted_fields))
}

pub fn assemble_prompt(action: &AiAction, context: &ProjectedEditorialContext) -> String {
    let mut prompt = String::new();

    let task_instruction = match action {
        AiAction::GenerateOutline => "Gere um rascunho de estrutura para o artigo.",
        AiAction::GenerateAltText => "Gere descrições alternativas para as mídias fornecidas.",
        AiAction::GenerateSeo => "Gere meta title e meta description otimizados para SEO.",
        AiAction::CheckAccessibility => "Avalie a acessibilidade estrutural do artigo.",
        AiAction::ValidateInclusivity => "Revise o artigo buscando linguagem inclusiva.",
        AiAction::ResearchGaps => "Aponte lacunas de pesquisa e sugira direcionamentos com base nos metadados editoriais fornecidos.",
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
        write!(
            &mut prompt,
            "<objective>{}</objective>\n",
            escape_xml(objective)
        )
        .unwrap();
    }
    if let Some(keyword) = &context.metadata.keyword {
        write!(&mut prompt, "<keyword>{}</keyword>\n", escape_xml(keyword)).unwrap();
    }
    if let Some(persona) = &context.metadata.persona {
        write!(&mut prompt, "<persona>{}</persona>\n", escape_xml(persona)).unwrap();
    }

    if let Some(cta) = &context.metadata.cta {
        write!(&mut prompt, "<cta>{}</cta>\n", escape_xml(cta)).unwrap();
    }

    if let Some(content) = &context.content {
        write!(&mut prompt, "<body>{}</body>\n", escape_xml(&content.text)).unwrap();
    }
    if let Some(notes) = &context.notes {
        write!(&mut prompt, "<notes>{}</notes>\n", escape_xml(notes)).unwrap();
    }
    if let Some(links) = &context.links {
        write!(&mut prompt, "<links>\n").unwrap();
        if let Some(internal) = &links.internal {
            write!(
                &mut prompt,
                "  <internal>{}</internal>\n",
                escape_xml(internal)
            )
            .unwrap();
        }
        if let Some(external) = &links.external {
            write!(
                &mut prompt,
                "  <external>{}</external>\n",
                escape_xml(external)
            )
            .unwrap();
        }
        write!(&mut prompt, "</links>\n").unwrap();
    }
    if let Some(checklists) = &context.checklists_state {
        write!(&mut prompt, "<checklists_state>\n").unwrap();
        write!(&mut prompt, "  <total>{}</total>\n", checklists.total).unwrap();
        write!(
            &mut prompt,
            "  <completed>{}</completed>\n",
            checklists.completed
        )
        .unwrap();
        if !checklists.pending_items.is_empty() {
            for pending in &checklists.pending_items {
                write!(
                    &mut prompt,
                    "  <pending_item>{}</pending_item>\n",
                    escape_xml(pending)
                )
                .unwrap();
            }
        }
        write!(&mut prompt, "</checklists_state>\n").unwrap();
    }
    if let Some(media) = &context.media {
        write!(&mut prompt, "<media>\n").unwrap();
        for m in media {
            let type_str = match m.r#type {
                crate::models::context::MediaAssetType::ImageAsset => "image_asset",
                crate::models::context::MediaAssetType::VisualDescription => "visual_description",
            };
            write!(
                &mut prompt,
                "  <asset type=\"{}\">{}</asset>\n",
                escape_xml(type_str),
                escape_xml(&m.data)
            )
            .unwrap();
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
        let _ = app.emit(
            "ai-stream-notice",
            AiContextNoticeEvent {
                job_id: request.job_id.clone(),
                notice_code: "CONTEXT_REDUCED".to_string(),
                omitted_fields,
                message:
                    "Alguns campos não essenciais foram omitidos devido ao limite de contexto."
                        .to_string(),
            },
        );
    }

    // 5. Prompt Assembly
    let prompt = assemble_prompt(&request.action, &budgeted_context);

    // 6. Dispatch
    let provider_upper = request.provider.to_uppercase();
    if provider_upper == "OLLAMA" {
        if request.model.is_none() || request.model.as_ref().unwrap().trim().is_empty() {
            return Err(
                "VALIDATION_ERROR: Model must be explicitly selected for OLLAMA".to_string(),
            );
        }
        let model = request.model.unwrap();
        // Call internal ollama function
        crate::ollama_gateway::start_ollama_inference_internal(app, request.job_id, model, prompt)
            .await
    } else if provider_upper == "SIDECAR" {
        crate::ai_supervisor::start_inference_internal(
            app,
            registry,
            request.job_id,
            "llama-sidecar".to_string(),
            vec![
                "--action".to_string(),
                format!("{:?}", request.action).to_lowercase(),
                "--prompt".to_string(),
                prompt
            ],
        )
        .await
    } else {
        Err(format!(
            "UNSUPPORTED_CAPABILITY: Provedor não suportado: {}",
            request.provider
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::context::{ArticleStatus, CategoryTag, ContentSource, EditorialChecklistsState, EditorialContent, EditorialContext, EditorialLinks, EditorialMetadata};

    fn dummy_context() -> EditorialContext {
        EditorialContext {
            article_id: "test".to_string(),
            editorial_status: ArticleStatus::Ideia,
            category_tag: CategoryTag::Ia,
            metadata: EditorialMetadata {
                title: None,
                summary: None,
                objective: None,
                keyword: None,
                persona: None,
                cta: None,
            },
            notes: None,
            links: EditorialLinks { internal: None, external: None },
            checklists_state: EditorialChecklistsState { total: 0, completed: 0, pending_items: vec![] },
            content: None,
            media: None,
        }
    }

    #[test]
    fn test_xml_escaping() {
        assert_eq!(escape_xml("Hello & <world> \"'"), "Hello &amp; &lt;world&gt; &quot;&apos;");
    }

    #[test]
    fn test_validate_prerequisites_seo() {
        let mut req = AiOrchestrationRequest {
            job_id: "1".to_string(),
            action: AiAction::GenerateSeo,
            context: dummy_context(),
            provider: "OLLAMA".to_string(),
            model: Some("model".to_string()),
        };
        // Should fail because no keyword
        assert!(validate_prerequisites(&req).is_err());
        
        req.context.metadata.keyword = Some("test".to_string());
        // Still fails because no content/summary
        assert!(validate_prerequisites(&req).is_err());
        
        req.context.content = Some(EditorialContent { source: ContentSource::Pasted, text: "text".to_string() });
        // Should pass
        assert!(validate_prerequisites(&req).is_ok());
    }

    #[test]
    fn test_apply_budget_omits_fields() {
        let mut ctx = dummy_context();
        ctx.metadata.title = Some("a".repeat(10));
        ctx.notes = Some("n".repeat(8000)); // Forces it over limit
        
        let projected = project_context(&AiAction::ResearchGaps, ctx);
        let (budgeted, omitted) = apply_budget(&AiAction::ResearchGaps, projected).unwrap();
        // Notes should be dropped
        assert!(budgeted.notes.is_none());
        assert!(omitted.contains(&"notes".to_string()));
    }

    #[test]
    fn test_research_gaps_metadata_only() {
        let mut ctx = dummy_context();
        ctx.metadata.title = Some("Title".to_string());
        // No objective, still valid
        let projected = project_context(&AiAction::ResearchGaps, ctx.clone());
        assert!(projected.metadata.title.is_some());
        
        let mut req = AiOrchestrationRequest {
            job_id: "1".to_string(),
            action: AiAction::ResearchGaps,
            context: ctx,
            provider: "OLLAMA".to_string(),
            model: Some("model".to_string()),
        };
        assert!(validate_prerequisites(&req).is_ok());
    }

    #[test]
    fn test_content_preferred_over_summary() {
        let mut ctx = dummy_context();
        ctx.metadata.summary = Some("Summary".to_string());
        ctx.content = Some(EditorialContent { source: ContentSource::Pasted, text: "Content".to_string() });
        
        let projected = project_context(&AiAction::PlainLanguage, ctx);
        assert!(projected.content.is_some());
        assert!(projected.metadata.summary.is_none());
    }

    #[test]
    fn test_summary_fallback() {
        let mut ctx = dummy_context();
        ctx.metadata.summary = Some("Summary".to_string());
        ctx.content = None;
        
        let projected = project_context(&AiAction::PlainLanguage, ctx);
        assert!(projected.content.is_none());
        assert!(projected.metadata.summary.is_some());
    }

    #[test]
    fn test_context_exceeded() {
        let mut ctx = dummy_context();
        ctx.content = Some(EditorialContent { source: ContentSource::Pasted, text: "a".repeat(9000) });
        let projected = project_context(&AiAction::PlainLanguage, ctx);
        let res = apply_budget(&AiAction::PlainLanguage, projected);
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("CONTEXT_EXCEEDED"));
    }

    #[test]
    fn test_image_asset_fail_closed() {
        let mut ctx = dummy_context();
        ctx.media = Some(vec![crate::models::context::MediaAsset {
            r#type: crate::models::context::MediaAssetType::ImageAsset,
            data: "data".to_string(),
        }]);
        let req = AiOrchestrationRequest {
            job_id: "1".to_string(),
            action: AiAction::GenerateAltText,
            context: ctx,
            provider: "OLLAMA".to_string(),
            model: Some("model".to_string()),
        };
        let err = validate_prerequisites(&req).unwrap_err();
        assert!(err.contains("UNSUPPORTED_CAPABILITY"));
    }
}
