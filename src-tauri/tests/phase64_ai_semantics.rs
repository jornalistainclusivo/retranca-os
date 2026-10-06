use app_lib::models::context::AiOrchestrationRequest;
use app_lib::orchestrator::{
    apply_budget, assemble_prompt, project_context, resolve_dispatch_plan, validate_prerequisites,
    DispatchPlan,
};
use serde_json::json;

const ACTIONS: [&str; 6] = [
    "research_gaps",
    "plain_language",
    "validate_inclusivity",
    "generate_alt_text",
    "generate_seo",
    "editorial_review",
];
const LEGACY_STATUSES: [&str; 5] = ["ideia", "pesquisa", "escrita", "revisao", "publicado"];

fn request(action: &str, status: &str, valid: bool) -> AiOrchestrationRequest {
    let text = if valid { "Evidence" } else { " \t\n " };
    serde_json::from_value(json!({
        "job_id": "phase64-ai", "action": action, "provider": "OLLAMA", "model": "synthetic-fixture:latest",
        "context": {
            "articleId": "custom-stage-article", "editorialStatus": status, "categoryTag": "Blog",
            "metadata": { "title": text, "objective": text, "summary": text, "keyword": text },
            "links": {}, "checklistsState": { "total": 0, "completed": 0, "pendingItems": [] },
            "content": { "source": "pasted", "text": text },
            "media": [{ "type": "visual_description", "data": text }]
        }
    }))
    .unwrap()
}

#[test]
fn test_ai_001_evidence_valid_actions_ignore_legacy_status() {
    // Phase 6.4 stage classification stays in recommendation UX. The preserved
    // Phase 6.3 wire metadata grants no native availability authority.
    for action in ACTIONS {
        for status in LEGACY_STATUSES {
            let req = request(action, status, true);
            assert!(validate_prerequisites(&req).is_ok(), "{action}/{status}");
            let projected = project_context(&req.action, req.context);
            let (budgeted, _) = apply_budget(&req.action, projected).unwrap();
            let prompt = assemble_prompt(&req.action, &budgeted);
            let plan =
                resolve_dispatch_plan(req.job_id, &req.action, &req.provider, req.model, prompt)
                    .unwrap();
            // A dispatch plan is not a live readiness or generation claim.
            assert!(matches!(plan, DispatchPlan::Ollama { .. }));
        }
    }
}

#[test]
fn sidecar_requests_for_valid_editorial_actions_require_explicit_debug_fixtures() {
    for action in ACTIONS {
        let req = request(action, "escrita", true);
        validate_prerequisites(&req).unwrap();
        let projected = project_context(&req.action, req.context);
        let (budgeted, _) = apply_budget(&req.action, projected).unwrap();
        let prompt = assemble_prompt(&req.action, &budgeted);
        let plan = resolve_dispatch_plan(req.job_id, &req.action, "sIdEcAr", req.model, prompt);
        assert_eq!(plan.is_ok(), app_lib::provider_policy::DEV_FIXTURES_ENABLED);
        if let Err(error) = plan {
            assert!(error.starts_with("UNSUPPORTED_CAPABILITY:"));
        }
    }
}

#[test]
fn test_ai_002_recommendation_status_cannot_bypass_native_evidence() {
    for action in ACTIONS {
        for status in LEGACY_STATUSES {
            let err = validate_prerequisites(&request(action, status, false)).unwrap_err();
            assert!(
                err.starts_with("MISSING_PREREQUISITES:"),
                "{action}/{status}"
            );
        }
    }
}
