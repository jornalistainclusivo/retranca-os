// Phase 6.4 Slice 4 Domain Operations — Integration Tests
//
// SCOPE: This test validates the entire native domain logic (Slice 4)
// to prove fail-closed behaviors, atomic operations, normalization,
// open access, and strict re-ordering rules.
#![allow(unused_imports)]

use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::{Executor, Row};
use std::collections::HashMap;
use std::str::FromStr;
use tauri::State;
use tauri_plugin_sql::{DbInstances, DbPool};
use tokio::sync::RwLock;

use app_lib::models::workflow::ChecklistTemplateItem;
use app_lib::phase64 as domain;
use app_lib::phase64::{
    assign_article_category, assign_article_stage, create_category_internal,
    create_checklist_template_internal, create_workflow_stage_internal, remove_category_internal,
    remove_workflow_stage_internal, reorder_workflow_stages_internal,
    update_checklist_template_internal, update_workflow_stage_internal,
    AssignArticleCategoryRequest, AssignArticleStageRequest, CreateCategoryRequest,
    CreateChecklistTemplateRequest, CreateWorkflowStageRequest, RemoveCategoryRequest,
    RemoveWorkflowStageRequest, ReorderWorkflowStagesRequest, StageOrder,
    UpdateChecklistTemplateRequest, UpdateWorkflowStageRequest,
};

fn run_async<F: std::future::Future>(f: F) -> F::Output {
    let rt = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap();
    rt.block_on(f)
}

#[test]
fn test_open_suggested_category_mutations_preserve_articles() {
    run_async(async {
        let (instances, pool) = setup_db().await;
        let ctx = TestContext { instances };
        pool.execute("INSERT INTO workflow_stages (id, display_name, order_index, lifecycle_role, is_active, created_at) VALUES ('pub', 'Publicado', 0, 'PUBLICATION', 1, 'time')").await.unwrap();
        pool.execute("INSERT INTO categories (id, name, origin, is_active, created_at) VALUES ('suggested', 'Suggested', 'standard', 1, 'time'), ('target', 'Target', 'custom', 1, 'time')").await.unwrap();
        pool.execute("INSERT INTO articles (id, title, status, categoryTag, tags, publishDate, createdAt, updatedAt, workflow_stage_id, category_id, notes) VALUES ('synthetic', 'EXERCÍCIO SINTÉTICO', 'ideia', 'IA', '[]', '2026-10-07', 'time', 'time', 'pub', 'suggested', 'Preserve this synthetic content')").await.unwrap();
        domain::rename_category(
            ctx.state_db(),
            serde_json::from_value(serde_json::json!({"id": "suggested", "name": "Ciência"}))
                .unwrap(),
        )
        .await
        .unwrap();
        let name: String = sqlx::query_scalar("SELECT name FROM categories WHERE id = 'suggested'")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(name, "Ciência");
        let duplicate = domain::rename_category(
            ctx.state_db(),
            serde_json::from_value(serde_json::json!({"id": "suggested", "name": "Target"}))
                .unwrap(),
        )
        .await
        .err()
        .unwrap();
        assert_eq!(duplicate.code, "ERR_INVALID_CATEGORY");
        let no_target = domain::remove_category(
            ctx.state_db(),
            RemoveCategoryRequest {
                id: "suggested".into(),
                reassign_to_category_id: None,
            },
        )
        .await
        .err()
        .unwrap();
        assert_eq!(no_target.code, "ERR_UNRESOLVED_CATEGORY_REFERENCE");
        let invalid = domain::remove_category(
            ctx.state_db(),
            RemoveCategoryRequest {
                id: "suggested".into(),
                reassign_to_category_id: Some("missing".into()),
            },
        )
        .await
        .err()
        .unwrap();
        assert_eq!(invalid.code, "ERR_UNRESOLVED_CATEGORY_REFERENCE");
        let category: String =
            sqlx::query_scalar("SELECT category_id FROM articles WHERE id = 'synthetic'")
                .fetch_one(&pool)
                .await
                .unwrap();
        assert_eq!(category, "suggested");
        domain::remove_category(
            ctx.state_db(),
            RemoveCategoryRequest {
                id: "suggested".into(),
                reassign_to_category_id: Some("target".into()),
            },
        )
        .await
        .unwrap();
        let row = sqlx::query("SELECT category_id, notes FROM articles WHERE id = 'synthetic'")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(row.get::<String, _>("category_id"), "target");
        assert_eq!(
            row.get::<String, _>("notes"),
            "Preserve this synthetic content"
        );
        let last = domain::remove_category(
            ctx.state_db(),
            RemoveCategoryRequest {
                id: "target".into(),
                reassign_to_category_id: None,
            },
        )
        .await
        .err()
        .unwrap();
        assert_eq!(last.code, "ERR_INVALID_CATEGORY");
    });
}

#[test]
fn test_explicit_assignment_recovers_a_null_stage_without_guessing() {
    run_async(async {
        let (instances, pool) = setup_db().await;
        let ctx = TestContext { instances };
        // Reproduce the historical nullable desktop schema in this disposable database only.
        pool.execute("DROP TABLE articles; CREATE TABLE articles (id TEXT PRIMARY KEY, title TEXT NOT NULL, status TEXT NOT NULL, categoryTag TEXT NOT NULL, tags TEXT NOT NULL, publishDate TEXT NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, completedAt TEXT, workflow_stage_id TEXT, category_id TEXT);").await.unwrap();
        pool.execute("INSERT INTO workflow_stages (id, display_name, order_index, lifecycle_role, is_active, created_at) VALUES ('pub', 'Publicado', 0, 'PUBLICATION', 1, 'time'), ('idea', 'Ideia', 1, NULL, 1, 'time')").await.unwrap();
        pool.execute("INSERT INTO articles (id, title, status, categoryTag, tags, publishDate, createdAt, updatedAt) VALUES ('synthetic-null', 'EXERCÍCIO SINTÉTICO', 'escrita', 'IA', '[]', '2026-10-07', 'time', 'time')").await.unwrap();
        domain::assign_article_stage(
            ctx.state_db(),
            AssignArticleStageRequest {
                article_id: "synthetic-null".into(),
                workflow_stage_id: "idea".into(),
            },
        )
        .await
        .unwrap();
        let id: String = sqlx::query_scalar(
            "SELECT workflow_stage_id FROM articles WHERE id = 'synthetic-null'",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(id, "idea");
        let history: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM history_entries WHERE articleId = 'synthetic-null'",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(history, 1);
    });
}

#[test]
fn test_open_003_all_structural_ipc_commands_without_entitlement_state() {
    run_async(async {
        let (instances, pool) = setup_db().await;
        let ctx = TestContext { instances };
        pool.execute("INSERT INTO workflow_stages (id, display_name, order_index, lifecycle_role, is_active) VALUES ('pub', 'Publicação', 0, 'PUBLICATION', 1)").await.unwrap();
        pool.execute("INSERT INTO categories (id, name, origin, is_active) VALUES ('standard', 'Standard', 'standard', 1)").await.unwrap();
        pool.execute("INSERT INTO articles (id, title, status, categoryTag, tags, publishDate, createdAt, updatedAt, workflow_stage_id, category_id) VALUES ('article', 'Test', 'publicado', 'Blog', '[]', '2026-09-30', 'time', 'time', 'pub', 'standard')").await.unwrap();

        macro_rules! req {
            ($($value:tt)*) => {
                serde_json::from_value(serde_json::json!($($value)*)).unwrap()
            };
        }

        let stage = domain::create_workflow_stage(
            ctx.state_db(),
            req!({
                "display_name": "Apuração", "order_index": 1, "semantic_classification": null
            }),
        )
        .await
        .unwrap();
        domain::update_workflow_stage(ctx.state_db(), req!({
            "id": stage.id, "display_name": "Apuração especial", "semantic_classification": "RESEARCH"
        })).await.unwrap();
        domain::reorder_workflow_stages(
            ctx.state_db(),
            req!({"stage_orders": [
                {"id": stage.id, "order_index": 0}, {"id": "pub", "order_index": 1}
            ]}),
        )
        .await
        .unwrap();
        domain::remove_workflow_stage(
            ctx.state_db(),
            req!({
                "id": stage.id, "reassign_to_stage_id": "pub"
            }),
        )
        .await
        .unwrap();

        let category = domain::create_category(ctx.state_db(), req!({"name": "Custom"}))
            .await
            .unwrap();
        domain::rename_category(ctx.state_db(), req!({"id": category.id, "name": "Renamed"}))
            .await
            .unwrap();
        domain::remove_category(ctx.state_db(), req!({"id": category.id}))
            .await
            .unwrap();

        let template = domain::create_checklist_template(
            ctx.state_db(),
            req!({
                "name": "Editorial", "items": [{"label": "Verify source"}]
            }),
        )
        .await
        .unwrap();
        domain::apply_checklist_template(
            ctx.state_db(),
            req!({
                "article_id": "article", "template_id": template.id
            }),
        )
        .await
        .unwrap();
        domain::update_checklist_template(
            ctx.state_db(),
            req!({
                "id": template.id, "name": "Updated", "items": [{"label": "Changed template"}]
            }),
        )
        .await
        .unwrap();
        domain::delete_checklist_template(ctx.state_db(), req!({"id": template.id}))
            .await
            .unwrap();

        let labels: Vec<String> =
            sqlx::query_scalar("SELECT label FROM checklist_items WHERE articleId = 'article'")
                .fetch_all(&pool)
                .await
                .unwrap();
        assert_eq!(labels, vec!["Verify source"]);
        let publication_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM workflow_stages WHERE is_active = 1 AND lifecycle_role = 'PUBLICATION'").fetch_one(&pool).await.unwrap();
        assert_eq!(publication_count, 1);
        let active_custom_categories: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM categories WHERE origin = 'custom' AND is_active = 1",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(active_custom_categories, 0);
    });
}

async fn setup_db() -> (DbInstances, sqlx::Pool<sqlx::Sqlite>) {
    let mut options = SqliteConnectOptions::from_str("sqlite::memory:").unwrap();
    options = options.pragma("foreign_keys", "ON");
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(options)
        .await
        .unwrap();

    pool.execute("PRAGMA user_version = 1;").await.unwrap();

    pool.execute(
        "
        CREATE TABLE workflow_stages (
            id TEXT PRIMARY KEY,
            display_name TEXT NOT NULL,
            order_index INTEGER NOT NULL,
            semantic_classification TEXT,
            lifecycle_role TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT
        );
        CREATE TABLE categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            origin TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT
        );
        CREATE TABLE checklist_templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            items_json TEXT NOT NULL,
            created_at TEXT
        );
        CREATE TABLE articles (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            status TEXT NOT NULL,
            categoryTag TEXT NOT NULL,
            tags TEXT NOT NULL,
            publishDate TEXT NOT NULL,
            summary TEXT,
            objective TEXT,
            keyword TEXT,
            persona TEXT,
            cta TEXT,
            internalLinks TEXT,
            externalLinks TEXT,
            estimatedTime TEXT,
            spentTime TEXT,
            notes TEXT,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            completedAt TEXT,
            workflow_stage_id TEXT NOT NULL REFERENCES workflow_stages(id),
            category_id TEXT NOT NULL REFERENCES categories(id)
        );
        CREATE TABLE checklist_items (
            id TEXT PRIMARY KEY,
            articleId TEXT NOT NULL REFERENCES articles(id),
            label TEXT NOT NULL,
            completed INTEGER NOT NULL,
            category TEXT
        );
        CREATE TABLE history_entries (
            id TEXT PRIMARY KEY,
            articleId TEXT NOT NULL REFERENCES articles(id),
            date TEXT NOT NULL,
            action TEXT NOT NULL
        );
    ",
    )
    .await
    .unwrap();

    let mut map = HashMap::new();
    map.insert(
        "sqlite:retranca.db".to_string(),
        DbPool::Sqlite(pool.clone()),
    );
    (DbInstances(RwLock::new(map)), pool)
}

#[allow(dead_code)]
struct TestContext {
    instances: DbInstances,
}

#[allow(dead_code)]
impl TestContext {
    fn state_db(&self) -> State<'_, DbInstances> {
        unsafe { std::mem::transmute(&self.instances) }
    }
}

// =====================================================================
// OPEN ACCESS TESTS
// =====================================================================

#[test]
fn test_stage_creation_semantic_vocabulary_and_atomic_rejection() {
    run_async(async {
        let (instances, pool) = setup_db().await;
        let ctx = TestContext { instances };
        pool.execute("INSERT INTO workflow_stages (id, display_name, order_index, lifecycle_role, is_active) VALUES ('pub', 'Publicação', 0, 'PUBLICATION', 1)").await.unwrap();
        for invalid in ["REVIEW_NOW", "review", " "] {
            let error = domain::create_workflow_stage(
                ctx.state_db(),
                CreateWorkflowStageRequest {
                    display_name: "Invalid".into(),
                    order_index: 0,
                    semantic_classification: Some(invalid.into()),
                },
            )
            .await
            .unwrap_err();
            assert_eq!(error.code, "ERR_INVALID_SEMANTIC_CLASSIFICATION");
            assert!(!error.retryable);
            let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM workflow_stages")
                .fetch_one(&pool)
                .await
                .unwrap();
            let position: i64 =
                sqlx::query_scalar("SELECT order_index FROM workflow_stages WHERE id = 'pub'")
                    .fetch_one(&pool)
                    .await
                    .unwrap();
            assert_eq!(count, 1);
            assert_eq!(position, 0);
        }
        for (index, classification) in ["IDEA", "RESEARCH", "DRAFTING", "REVIEW", "PUBLISHED"]
            .iter()
            .enumerate()
        {
            let stage = domain::create_workflow_stage(
                ctx.state_db(),
                CreateWorkflowStageRequest {
                    display_name: classification.to_string(),
                    order_index: index as i64 + 1,
                    semantic_classification: Some(classification.to_string()),
                },
            )
            .await
            .unwrap();
            assert_eq!(
                stage.semantic_classification.unwrap().as_str(),
                *classification
            );
            assert!(stage.lifecycle_role.is_none());
        }
        let publication_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM workflow_stages WHERE lifecycle_role = 'PUBLICATION' AND is_active = 1").fetch_one(&pool).await.unwrap();
        assert_eq!(publication_count, 1);
    });
}

#[test]
fn test_open_001_customization_requires_no_entitlement_but_checks_schema() {
    run_async(async {
        let (instances, pool) = setup_db().await;
        let ctx = TestContext { instances };
        pool.execute("INSERT INTO workflow_stages (id, display_name, order_index, lifecycle_role, is_active) VALUES ('pub', 'Publicação', 0, 'PUBLICATION', 1)").await.unwrap();
        let created = create_workflow_stage_internal(
            ctx.state_db(),
            CreateWorkflowStageRequest {
                display_name: "Custom".into(),
                semantic_classification: None,
                order_index: 1,
            },
        )
        .await
        .unwrap();
        assert_eq!(created.display_name, "Custom");
        pool.execute("PRAGMA user_version = 0;").await.unwrap();
        let error = create_workflow_stage_internal(
            ctx.state_db(),
            CreateWorkflowStageRequest {
                display_name: "Blocked by schema".into(),
                semantic_classification: None,
                order_index: 2,
            },
        )
        .await
        .unwrap_err();
        assert_eq!(error.code, "ERR_DATABASE_FAILURE");
        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM workflow_stages")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(count, 2);
    });
}

#[test]
fn test_open_002_ordinary_operations_remain_available() {
    run_async(async {
        let (instances, pool) = setup_db().await;
        let ctx = TestContext { instances };

        // Insert mock stage & article directly
        pool.execute("INSERT INTO workflow_stages (id, display_name, order_index, lifecycle_role, is_active, created_at) VALUES ('stage1', 'Stage 1', 0, 'DRAFT', 1, 'time')").await.unwrap();
        pool.execute("INSERT INTO categories (id, name, origin, is_active, created_at) VALUES ('cat1', 'C1', 'standard', 1, 'time')").await.unwrap();
        pool.execute("INSERT INTO articles (id, title, status, categoryTag, tags, publishDate, createdAt, updatedAt, workflow_stage_id, category_id) VALUES ('art1', 'Test', 'ideia', 'Tag', '[]', 'prev_time', 'time', 'time', 'stage1', 'cat1')").await.unwrap();

        // Assigning article stage should work even in Free mode (no entitlement gate)
        let req = AssignArticleStageRequest {
            article_id: "art1".to_string(),
            workflow_stage_id: "stage1".to_string(),
        };
        let res = assign_article_stage(ctx.state_db(), req).await;

        // Should be OK because it's a no-op (same stage)
        assert!(res.is_ok());
    });
}

// =====================================================================
// WORKFLOW STAGE MUTATION TESTS
// =====================================================================

#[test]
fn test_wf_001_normalized_duplicate_rejection_and_reuse() {
    run_async(async {
        let (instances, pool) = setup_db().await;
        let ctx = TestContext { instances };

        // 1. Create a stage
        create_workflow_stage_internal(
            ctx.state_db(),
            CreateWorkflowStageRequest {
                display_name: "  Draft  ".to_string(),
                semantic_classification: None,
                order_index: 0,
            },
        )
        .await
        .unwrap();

        // 2. Reject Case-Insensitive Duplicate
        let res = create_workflow_stage_internal(
            ctx.state_db(),
            CreateWorkflowStageRequest {
                display_name: "draft".to_string(),
                semantic_classification: None,
                order_index: 1,
            },
        )
        .await;
        assert_eq!(res.unwrap_err().code, "ERR_INVALID_WORKFLOW");

        // 3. Mark inactive
        pool.execute("UPDATE workflow_stages SET is_active = 0 WHERE display_name = 'Draft'")
            .await
            .unwrap();

        // 4. Inactive Name Reuse is Allowed
        let res2 = create_workflow_stage_internal(
            ctx.state_db(),
            CreateWorkflowStageRequest {
                display_name: "draft".to_string(),
                semantic_classification: None,
                order_index: 0,
            },
        )
        .await;
        assert!(res2.is_ok());
    });
}

#[test]
fn test_wf_002_create_insertion_order_compaction() {
    run_async(async {
        let (instances, pool) = setup_db().await;
        let ctx = TestContext { instances };

        // Create initial
        create_workflow_stage_internal(
            ctx.state_db(),
            CreateWorkflowStageRequest {
                display_name: "Stage 1".into(),
                semantic_classification: None,
                order_index: 0,
            },
        )
        .await
        .unwrap();
        create_workflow_stage_internal(
            ctx.state_db(),
            CreateWorkflowStageRequest {
                display_name: "Stage 2".into(),
                semantic_classification: None,
                order_index: 1,
            },
        )
        .await
        .unwrap();

        // Insert at 0, should shift Stage 1 to 1 and Stage 2 to 2
        create_workflow_stage_internal(
            ctx.state_db(),
            CreateWorkflowStageRequest {
                display_name: "New First".into(),
                semantic_classification: None,
                order_index: 0,
            },
        )
        .await
        .unwrap();

        let row: (i64,) = sqlx::query_as(
            "SELECT order_index FROM workflow_stages WHERE display_name = 'Stage 2'",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(row.0, 2);
    });
}

#[test]
fn test_wf_003_removal_order_compaction_and_last_stage_rejection() {
    run_async(async {
        let (instances, pool) = setup_db().await;
        let ctx = TestContext { instances };

        // Create 2 stages
        create_workflow_stage_internal(
            ctx.state_db(),
            CreateWorkflowStageRequest {
                display_name: "Stage 1".into(),
                semantic_classification: None,
                order_index: 0,
            },
        )
        .await
        .unwrap();
        create_workflow_stage_internal(
            ctx.state_db(),
            CreateWorkflowStageRequest {
                display_name: "Stage 2".into(),
                semantic_classification: None,
                order_index: 1,
            },
        )
        .await
        .unwrap();

        // Make Stage 2 the publication stage to satisfy invariant
        pool.execute("UPDATE workflow_stages SET lifecycle_role = 'PUBLICATION' WHERE display_name = 'Stage 2'").await.unwrap();

        let id1: (String,) =
            sqlx::query_as("SELECT id FROM workflow_stages WHERE display_name = 'Stage 1'")
                .fetch_one(&pool)
                .await
                .unwrap();
        let id2: (String,) =
            sqlx::query_as("SELECT id FROM workflow_stages WHERE display_name = 'Stage 2'")
                .fetch_one(&pool)
                .await
                .unwrap();

        // Remove Stage 1, Stage 2 shifts to 0
        remove_workflow_stage_internal(
            ctx.state_db(),
            RemoveWorkflowStageRequest {
                id: id1.0,
                reassign_to_stage_id: None,
            },
        )
        .await
        .unwrap();

        let row: (i64,) = sqlx::query_as("SELECT order_index FROM workflow_stages WHERE display_name = 'Stage 2' AND is_active = 1")
            .fetch_one(&pool).await.unwrap();
        assert_eq!(row.0, 0);

        // Try removing the LAST active stage -> should fail with ERR_LAST_STAGE_REMOVAL
        let res = remove_workflow_stage_internal(
            ctx.state_db(),
            RemoveWorkflowStageRequest {
                id: id2.0,
                reassign_to_stage_id: None,
            },
        )
        .await;
        if let Err(e) = res {
            assert_eq!(e.code, "ERR_LAST_STAGE_REMOVAL");
        } else {
            panic!("Expected error but got success");
        }
    });
}

#[test]
fn test_wf_004_invalid_reorder_rejection() {
    run_async(async {
        let (instances, pool) = setup_db().await;
        let ctx = TestContext { instances };

        create_workflow_stage_internal(
            ctx.state_db(),
            CreateWorkflowStageRequest {
                display_name: "S1".into(),
                semantic_classification: None,
                order_index: 0,
            },
        )
        .await
        .unwrap();
        create_workflow_stage_internal(
            ctx.state_db(),
            CreateWorkflowStageRequest {
                display_name: "S2".into(),
                semantic_classification: None,
                order_index: 1,
            },
        )
        .await
        .unwrap();

        let id1: (String,) =
            sqlx::query_as("SELECT id FROM workflow_stages WHERE display_name = 'S1'")
                .fetch_one(&pool)
                .await
                .unwrap();

        // 1. Missing stage rejection (length mismatch)
        let req1 = ReorderWorkflowStagesRequest {
            stage_orders: vec![StageOrder {
                id: id1.0.clone(),
                order_index: 0,
            }],
        };
        let res1 = reorder_workflow_stages_internal(ctx.state_db(), req1).await;
        if let Err(e) = res1 {
            assert_eq!(e.code, "ERR_INVALID_WORKFLOW");
        } else {
            panic!("Expected error but got success");
        }

        let id2: (String,) =
            sqlx::query_as("SELECT id FROM workflow_stages WHERE display_name = 'S2'")
                .fetch_one(&pool)
                .await
                .unwrap();

        // 2. Duplicate ID rejection
        let req2 = ReorderWorkflowStagesRequest {
            stage_orders: vec![
                StageOrder {
                    id: id1.0.clone(),
                    order_index: 0,
                },
                StageOrder {
                    id: id1.0.clone(),
                    order_index: 1,
                },
            ],
        };
        let res2 = reorder_workflow_stages_internal(ctx.state_db(), req2).await;
        if let Err(e) = res2 {
            assert_eq!(e.code, "ERR_INVALID_WORKFLOW");
        } else {
            panic!("Expected error but got success");
        }

        // 3. Duplicate Order Index rejection
        let req3 = ReorderWorkflowStagesRequest {
            stage_orders: vec![
                StageOrder {
                    id: id1.0.clone(),
                    order_index: 0,
                },
                StageOrder {
                    id: id2.0.clone(),
                    order_index: 0,
                },
            ],
        };
        let res3 = reorder_workflow_stages_internal(ctx.state_db(), req3).await;
        if let Err(e) = res3 {
            assert_eq!(e.code, "ERR_INVALID_WORKFLOW");
        } else {
            panic!("Expected error but got success");
        }
    });
}

#[test]
fn test_wf_005_soft_delete_preserves_id_and_renames() {
    run_async(async {
        let (instances, pool) = setup_db().await;
        let ctx = TestContext { instances };

        create_workflow_stage_internal(
            ctx.state_db(),
            CreateWorkflowStageRequest {
                display_name: "To Delete".into(),
                semantic_classification: None,
                order_index: 0,
            },
        )
        .await
        .unwrap();

        let id: (String,) =
            sqlx::query_as("SELECT id FROM workflow_stages WHERE display_name = 'To Delete'")
                .fetch_one(&pool)
                .await
                .unwrap();

        pool.execute("INSERT INTO workflow_stages (id, display_name, order_index, lifecycle_role, is_active, created_at) VALUES ('ws_1', 'S1', 1, 'PUBLICATION', 1, 'time')").await.unwrap();

        remove_workflow_stage_internal(
            ctx.state_db(),
            RemoveWorkflowStageRequest {
                id: id.0.clone(),
                reassign_to_stage_id: Some("ws_1".to_string()),
            },
        )
        .await
        .unwrap();

        let row: (i64, String) =
            sqlx::query_as("SELECT is_active, display_name FROM workflow_stages WHERE id = ?")
                .bind(&id.0)
                .fetch_one(&pool)
                .await
                .unwrap();

        assert_eq!(row.0, 0);
        assert_eq!(row.1, format!("__deleted__{}", id.0));

        let res = create_workflow_stage_internal(
            ctx.state_db(),
            CreateWorkflowStageRequest {
                display_name: "To Delete".into(),
                semantic_classification: None,
                order_index: 0,
            },
        )
        .await;

        assert!(res.is_ok());
    });
}

// =====================================================================
// ARTICLE ASSIGNMENT TESTS
// =====================================================================

#[test]
fn test_pub_001_publication_transfer_atomicity_and_preservation() {
    run_async(async {
        let (instances, pool) = setup_db().await;
        let ctx = TestContext { instances };

        pool.execute("INSERT INTO categories (id, name, origin, is_active, created_at) VALUES ('cat1', 'Cat', 'standard', 1, 'time')").await.unwrap();
        pool.execute("INSERT INTO workflow_stages (id, display_name, order_index, lifecycle_role, is_active, created_at) VALUES ('s1', 'S1', 0, 'DRAFT', 1, 'time')").await.unwrap();
        pool.execute("INSERT INTO workflow_stages (id, display_name, order_index, lifecycle_role, is_active, created_at) VALUES ('s2', 'S2', 1, 'PUBLICATION', 1, 'time')").await.unwrap();
        pool.execute("INSERT INTO articles (id, title, status, categoryTag, tags, publishDate, createdAt, updatedAt, workflow_stage_id, category_id) VALUES ('a1', 'A1', 'ideia', 'Tag', '[]', 'prev_time', 'time', 'time', 's1', 'cat1')").await.unwrap();

        let req = AssignArticleStageRequest {
            article_id: "a1".into(),
            workflow_stage_id: "s2".into(),
        };
        assign_article_stage(ctx.state_db(), req).await.unwrap();

        let rows = sqlx::query("SELECT workflow_stage_id, completedAt, updatedAt, publishDate FROM articles WHERE id = 'a1'")
            .fetch_all(&pool).await.unwrap();
        assert_eq!(rows.len(), 1);

        let new_stage_id: String = rows[0].get(0);
        let completed_at: Option<String> = rows[0].get(1);
        let publish_date: String = rows[0].get(3);

        assert_eq!(new_stage_id, "s2");
        assert!(completed_at.is_some());
        assert_eq!(publish_date, "prev_time"); // publishDate must be preserved
    });
}

#[test]
fn test_pub_002_same_stage_strict_noop() {
    run_async(async {
        let (instances, pool) = setup_db().await;
        let ctx = TestContext { instances };

        pool.execute("INSERT INTO categories (id, name, origin, is_active, created_at) VALUES ('cat1', 'Cat', 'standard', 1, 'time')").await.unwrap();
        pool.execute("INSERT INTO workflow_stages (id, display_name, order_index, lifecycle_role, is_active, created_at) VALUES ('s1', 'S1', 0, 'DRAFT', 1, 'time')").await.unwrap();
        pool.execute("INSERT INTO articles (id, title, status, categoryTag, tags, publishDate, createdAt, updatedAt, workflow_stage_id, category_id) VALUES ('a1', 'A1', 'ideia', 'Tag', '[]', 'prev_time', 'time', 'time', 's1', 'cat1')").await.unwrap();

        let req = AssignArticleStageRequest {
            article_id: "a1".into(),
            workflow_stage_id: "s1".into(),
        };
        let res = assign_article_stage(ctx.state_db(), req).await;
        assert!(res.is_ok()); // Must be OK because it short-circuits as no-op
    });
}

// =====================================================================
// CATEGORY AND TEMPLATE TESTS
// =====================================================================

#[test]
fn test_cat_001_category_reassignment_rollback() {
    run_async(async {
        let (instances, pool) = setup_db().await;
        let ctx = TestContext { instances };

        pool.execute("INSERT INTO categories (id, name, origin, is_active, created_at) VALUES ('cat1', 'C1', 'standard', 1, 'time')").await.unwrap();
        pool.execute("INSERT INTO categories (id, name, origin, is_active, created_at) VALUES ('cat2', 'C2', 'standard', 0, 'time')").await.unwrap();
        pool.execute("INSERT INTO workflow_stages (id, display_name, order_index, lifecycle_role, is_active, created_at) VALUES ('stage1', 'Stage 1', 0, 'DRAFT', 1, 'time')").await.unwrap();
        pool.execute("INSERT INTO articles (id, title, status, categoryTag, tags, publishDate, createdAt, updatedAt, workflow_stage_id, category_id) VALUES ('art1', 'Test', 'ideia', 'Tag', '[]', 'prev_time', 'time', 'time', 'stage1', 'cat1')").await.unwrap();

        let req = AssignArticleCategoryRequest {
            article_id: "art1".into(),
            category_id: "cat2".into(),
        };
        let res = assign_article_category(ctx.state_db(), req).await;
        if let Err(e) = res {
            assert_eq!(e.code, "ERR_UNRESOLVED_CATEGORY_REFERENCE");
        } else {
            panic!("Expected error but got success");
        }

        // Verify state is untouched
        let cat_id: String =
            sqlx::query_scalar("SELECT category_id FROM articles WHERE id = 'art1'")
                .fetch_one(&pool)
                .await
                .unwrap();
        assert_eq!(cat_id, "cat1");
    });
}

#[test]
fn test_cat_002_soft_delete_preserves_id_and_renames() {
    run_async(async {
        let (instances, pool) = setup_db().await;
        let ctx = TestContext { instances };

        let req = CreateCategoryRequest {
            name: "Cat To Delete".into(),
        };
        let res = create_category_internal(ctx.state_db(), req).await.unwrap();

        pool.execute("INSERT INTO categories (id, name, origin, is_active, created_at) VALUES ('cat_standard', 'Standard', 'standard', 1, 'time')").await.unwrap();

        remove_category_internal(
            ctx.state_db(),
            RemoveCategoryRequest {
                id: res.id.clone(),
                reassign_to_category_id: Some("cat_standard".to_string()),
            },
        )
        .await
        .unwrap();

        let row: (i64, String) =
            sqlx::query_as("SELECT is_active, name FROM categories WHERE id = ?")
                .bind(&res.id)
                .fetch_one(&pool)
                .await
                .unwrap();

        assert_eq!(row.0, 0);
        assert_eq!(row.1, format!("__deleted__{}", res.id));

        let req2 = CreateCategoryRequest {
            name: "Cat To Delete".into(),
        };
        assert!(create_category_internal(ctx.state_db(), req2).await.is_ok());
    });
}

#[test]
fn test_chk_001_invalid_template_items_fails_closed() {
    run_async(async {
        let (instances, _pool) = setup_db().await;
        let ctx = TestContext { instances };

        let req = CreateChecklistTemplateRequest {
            name: "Template".into(),
            items: vec![ChecklistTemplateItem {
                label: "   ".into(), // Invalid empty label
            }],
        };

        let res = create_checklist_template_internal(ctx.state_db(), req).await;
        if let Err(e) = res {
            assert_eq!(e.code, "ERR_INVALID_CHECKLIST_TEMPLATE");
        } else {
            panic!("Expected error but got success");
        }
    });
}

#[test]
fn test_stage_semantic_update_null_omitted_and_lifecycle_preservation() {
    run_async(async {
        let (instances, pool) = setup_db().await;
        let ctx = TestContext { instances };
        pool.execute("INSERT INTO workflow_stages (id, display_name, order_index, semantic_classification, lifecycle_role, is_active) VALUES ('publication', 'Publicado', 0, 'PUBLISHED', 'PUBLICATION', 1)")
            .await.unwrap();

        for (payload, expected) in [
            (
                serde_json::json!({"id": "publication", "display_name": "Pub"}),
                Some("PUBLISHED"),
            ),
            (
                serde_json::json!({"id": "publication", "semantic_classification": null}),
                None,
            ),
            (
                serde_json::json!({"id": "publication", "semantic_classification": "REVIEW"}),
                Some("REVIEW"),
            ),
            (
                serde_json::json!({"id": "publication", "display_name": "Publicação"}),
                Some("REVIEW"),
            ),
        ] {
            let request: UpdateWorkflowStageRequest = serde_json::from_value(payload).unwrap();
            update_workflow_stage_internal(ctx.state_db(), request)
                .await
                .unwrap();
            let (semantic, role): (Option<String>, Option<String>) = sqlx::query_as(
                "SELECT semantic_classification, lifecycle_role FROM workflow_stages WHERE id = 'publication'"
            ).fetch_one(&pool).await.unwrap();
            assert_eq!(semantic.as_deref(), expected);
            assert_eq!(role.as_deref(), Some("PUBLICATION"));
        }

        let request = serde_json::from_value(serde_json::json!({
            "id": "publication", "display_name": "Must not persist", "semantic_classification": "INVALID"
        })).unwrap();
        let error = update_workflow_stage_internal(ctx.state_db(), request)
            .await
            .err()
            .expect("Invalid semantic must fail closed");
        assert_eq!(error.code, "ERR_INVALID_SEMANTIC_CLASSIFICATION");
        let name: String =
            sqlx::query_scalar("SELECT display_name FROM workflow_stages WHERE id = 'publication'")
                .fetch_one(&pool)
                .await
                .unwrap();
        assert_eq!(name, "Publicação");

        let request = serde_json::from_value(
            serde_json::json!({"id": "publication", "semantic_classification": null}),
        )
        .unwrap();
        update_workflow_stage_internal(ctx.state_db(), request)
            .await
            .unwrap();
        let semantic: Option<String> = sqlx::query_scalar(
            "SELECT semantic_classification FROM workflow_stages WHERE id = 'publication'",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(semantic, None);
    });
}
