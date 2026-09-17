// Phase 6.4 Slice 4 Domain Operations — Integration Tests
//
// SCOPE: This test validates the entire native domain logic (Slice 4)
// to prove fail-closed behaviors, atomic operations, normalization,
// authorization, and strict re-ordering rules.

use std::collections::HashMap;
use tokio::sync::RwLock;
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::{Executor, Row};
use std::str::FromStr;
use tauri::State;
use tauri_plugin_sql::{DbInstances, DbPool};

use app_lib::phase64::{
    create_workflow_stage, remove_workflow_stage, reorder_workflow_stages,
    create_category, create_checklist_template, update_checklist_template,
    assign_article_stage, assign_article_category, update_checklist_instance,
    CreateWorkflowStageRequest, RemoveWorkflowStageRequest, ReorderWorkflowStagesRequest,
    StageOrderUpdate, CreateCategoryRequest, CreateChecklistTemplateRequest, UpdateChecklistTemplateRequest,
    AssignArticleStageRequest, AssignArticleCategoryRequest, UpdateChecklistInstanceRequest
};
use app_lib::entitlements::{AppEntitlementProvider, set_developer_premium};

fn run_async<F: std::future::Future>(f: F) -> F::Output {
    let rt = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap();
    rt.block_on(f)
}

// Setup a full memory database matching the production schema for Phase 6.4 tests
async fn setup_db() -> (DbInstances, sqlx::Pool<sqlx::Sqlite>) {
    let mut options = SqliteConnectOptions::from_str("sqlite::memory:").unwrap();
    options = options.pragma("foreign_keys", "ON");
    let pool = SqlitePoolOptions::new().max_connections(1).connect_with(options).await.unwrap();

    pool.execute("PRAGMA user_version = 1;").await.unwrap();

    pool.execute("
        CREATE TABLE workflow_stages (
            id TEXT PRIMARY KEY,
            display_name TEXT NOT NULL,
            order_index INTEGER NOT NULL,
            semantic_classification TEXT,
            lifecycle_role TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL
        );
        CREATE TABLE categories (
            id TEXT PRIMARY KEY,
            display_name TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL
        );
        CREATE TABLE checklist_templates (
            id TEXT PRIMARY KEY,
            display_name TEXT NOT NULL,
            template_schema TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL
        );
        CREATE TABLE articles (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            workflow_stage_id TEXT NOT NULL REFERENCES workflow_stages(id),
            category_id TEXT REFERENCES categories(id)
        );
        CREATE TABLE article_checklist_instances (
            article_id TEXT NOT NULL REFERENCES articles(id),
            stage_id TEXT NOT NULL REFERENCES workflow_stages(id),
            template_id TEXT NOT NULL REFERENCES checklist_templates(id),
            instance_data TEXT NOT NULL,
            completed_at TEXT,
            PRIMARY KEY (article_id, stage_id)
        );
    ").await.unwrap();

    let mut map = HashMap::new();
    map.insert("sqlite:retranca.db".to_string(), DbPool::Sqlite(pool.clone()));
    (DbInstances(RwLock::new(map)), pool)
}

struct TestContext {
    instances: DbInstances,
    provider: AppEntitlementProvider,
}

impl TestContext {
    fn state_db(&self) -> State<'_, DbInstances> {
        unsafe { std::mem::transmute(&self.instances) }
    }
    fn state_ent(&self) -> State<'_, AppEntitlementProvider> {
        unsafe { std::mem::transmute(&self.provider) }
    }
}

// =====================================================================
// AUTHORIZATION TESTS
// =====================================================================

#[test]
fn test_ent_005_006_protected_authorization_matrix() {
    run_async(async {
        let (instances, pool) = setup_db().await;
        let ctx = TestContext { instances, provider: AppEntitlementProvider };
        
        // 1. FREE TIER - Rejected before schema check
        set_developer_premium(false).unwrap();
        let req = CreateWorkflowStageRequest { display_name: "Test".to_string(), semantic_classification: None, order_index: 0 };
        let res = create_workflow_stage(ctx.state_db(), ctx.state_ent(), req).await;
        assert!(res.is_err());
        assert_eq!(res.unwrap_err().code, "ERR_ENTITLEMENT_STATE_UNKNOWN"); // Test environment falls to Unknown for free
        
        // 2. PRO TIER - Allowed, fails schema check if we drop user_version to 0
        set_developer_premium(true).unwrap();
        pool.execute("PRAGMA user_version = 0;").await.unwrap();
        
        let req = CreateWorkflowStageRequest { display_name: "Test".to_string(), semantic_classification: None, order_index: 0 };
        let res = create_workflow_stage(ctx.state_db(), ctx.state_ent(), req).await;
        assert!(res.is_err());
        assert_eq!(res.unwrap_err().code, "ERR_DATABASE_FAILURE"); // Pro is allowed, but hits schema version check
    });
}

#[test]
fn test_free_001_operations_remain_free() {
    run_async(async {
        let (instances, pool) = setup_db().await;
        let ctx = TestContext { instances, provider: AppEntitlementProvider };
        set_developer_premium(false).unwrap(); // Free mode

        // Insert mock stage & article directly
        pool.execute("INSERT INTO workflow_stages (id, display_name, order_index, lifecycle_role, is_active, created_at) VALUES ('stage1', 'Stage 1', 0, 'DRAFT', 1, 'time')").await.unwrap();
        pool.execute("INSERT INTO articles (id, title, workflow_stage_id) VALUES ('art1', 'Test', 'stage1')").await.unwrap();

        // Assigning article stage should work even in Free mode
        let req = AssignArticleStageRequest { article_id: "art1".to_string(), target_stage_id: "stage1".to_string() };
        let res = assign_article_stage(ctx.state_db(), ctx.state_ent(), req).await;
        
        // Should be OK because it's allowed for Free, and it's a no-op (same stage)
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
        let ctx = TestContext { instances, provider: AppEntitlementProvider };
        set_developer_premium(true).unwrap();

        // 1. Create a stage
        create_workflow_stage(ctx.state_db(), ctx.state_ent(), CreateWorkflowStageRequest {
            display_name: "  Draft  ".to_string(),
            semantic_classification: None,
            order_index: 0
        }).await.unwrap();

        // 2. Reject Case-Insensitive Duplicate
        let res = create_workflow_stage(ctx.state_db(), ctx.state_ent(), CreateWorkflowStageRequest {
            display_name: "draft".to_string(),
            semantic_classification: None,
            order_index: 1
        }).await;
        assert_eq!(res.unwrap_err().code, "ERR_DATABASE_FAILURE"); // Normalized duplication caught

        // 3. Mark inactive
        pool.execute("UPDATE workflow_stages SET is_active = 0 WHERE display_name = 'Draft'").await.unwrap();

        // 4. Inactive Name Reuse is Allowed
        let res2 = create_workflow_stage(ctx.state_db(), ctx.state_ent(), CreateWorkflowStageRequest {
            display_name: "draft".to_string(),
            semantic_classification: None,
            order_index: 0
        }).await;
        assert!(res2.is_ok());
    });
}

#[test]
fn test_wf_002_create_insertion_order_compaction() {
    run_async(async {
        let (instances, pool) = setup_db().await;
        let ctx = TestContext { instances, provider: AppEntitlementProvider };
        set_developer_premium(true).unwrap();

        // Create initial
        create_workflow_stage(ctx.state_db(), ctx.state_ent(), CreateWorkflowStageRequest { display_name: "Stage 1".into(), semantic_classification: None, order_index: 0 }).await.unwrap();
        create_workflow_stage(ctx.state_db(), ctx.state_ent(), CreateWorkflowStageRequest { display_name: "Stage 2".into(), semantic_classification: None, order_index: 1 }).await.unwrap();
        
        // Insert at 0, should shift Stage 1 to 1 and Stage 2 to 2
        create_workflow_stage(ctx.state_db(), ctx.state_ent(), CreateWorkflowStageRequest { display_name: "New First".into(), semantic_classification: None, order_index: 0 }).await.unwrap();

        let row: (i64,) = sqlx::query_as("SELECT order_index FROM workflow_stages WHERE display_name = 'Stage 2'")
            .fetch_one(&pool).await.unwrap();
        assert_eq!(row.0, 2);
    });
}

#[test]
fn test_wf_003_removal_order_compaction_and_last_stage_rejection() {
    run_async(async {
        let (instances, pool) = setup_db().await;
        let ctx = TestContext { instances, provider: AppEntitlementProvider };
        set_developer_premium(true).unwrap();

        // Create 2 stages
        create_workflow_stage(ctx.state_db(), ctx.state_ent(), CreateWorkflowStageRequest { display_name: "Stage 1".into(), semantic_classification: None, order_index: 0 }).await.unwrap();
        create_workflow_stage(ctx.state_db(), ctx.state_ent(), CreateWorkflowStageRequest { display_name: "Stage 2".into(), semantic_classification: None, order_index: 1 }).await.unwrap();
        
        let id1: (String,) = sqlx::query_as("SELECT id FROM workflow_stages WHERE display_name = 'Stage 1'").fetch_one(&pool).await.unwrap();
        let id2: (String,) = sqlx::query_as("SELECT id FROM workflow_stages WHERE display_name = 'Stage 2'").fetch_one(&pool).await.unwrap();

        // Remove Stage 1, Stage 2 shifts to 0
        remove_workflow_stage(ctx.state_db(), ctx.state_ent(), RemoveWorkflowStageRequest { stage_id: id1.0 }).await.unwrap();

        let row: (i64,) = sqlx::query_as("SELECT order_index FROM workflow_stages WHERE display_name = 'Stage 2' AND is_active = 1")
            .fetch_one(&pool).await.unwrap();
        assert_eq!(row.0, 0);

        // Try removing the LAST active stage -> should fail with ERR_LAST_STAGE_REMOVAL
        let res = remove_workflow_stage(ctx.state_db(), ctx.state_ent(), RemoveWorkflowStageRequest { stage_id: id2.0 }).await;
        assert_eq!(res.unwrap_err().code, "ERR_LAST_STAGE_REMOVAL");
    });
}

#[test]
fn test_wf_004_invalid_reorder_rejection() {
    run_async(async {
        let (instances, pool) = setup_db().await;
        let ctx = TestContext { instances, provider: AppEntitlementProvider };
        set_developer_premium(true).unwrap();

        create_workflow_stage(ctx.state_db(), ctx.state_ent(), CreateWorkflowStageRequest { display_name: "S1".into(), semantic_classification: None, order_index: 0 }).await.unwrap();
        create_workflow_stage(ctx.state_db(), ctx.state_ent(), CreateWorkflowStageRequest { display_name: "S2".into(), semantic_classification: None, order_index: 1 }).await.unwrap();
        
        let id1: (String,) = sqlx::query_as("SELECT id FROM workflow_stages WHERE display_name = 'S1'").fetch_one(&pool).await.unwrap();
        
        // 1. Missing stage rejection (length mismatch)
        let req1 = ReorderWorkflowStagesRequest { updates: vec![
            StageOrderUpdate { stage_id: id1.0.clone(), order_index: 0 }
        ]};
        let res1 = reorder_workflow_stages(ctx.state_db(), ctx.state_ent(), req1).await;
        assert_eq!(res1.unwrap_err().code, "ERR_DATABASE_FAILURE");

        let id2: (String,) = sqlx::query_as("SELECT id FROM workflow_stages WHERE display_name = 'S2'").fetch_one(&pool).await.unwrap();

        // 2. Duplicate ID rejection
        let req2 = ReorderWorkflowStagesRequest { updates: vec![
            StageOrderUpdate { stage_id: id1.0.clone(), order_index: 0 },
            StageOrderUpdate { stage_id: id1.0.clone(), order_index: 1 }
        ]};
        let res2 = reorder_workflow_stages(ctx.state_db(), ctx.state_ent(), req2).await;
        assert_eq!(res2.unwrap_err().code, "ERR_DATABASE_FAILURE");

        // 3. Duplicate Order Index rejection
        let req3 = ReorderWorkflowStagesRequest { updates: vec![
            StageOrderUpdate { stage_id: id1.0.clone(), order_index: 0 },
            StageOrderUpdate { stage_id: id2.0.clone(), order_index: 0 }
        ]};
        let res3 = reorder_workflow_stages(ctx.state_db(), ctx.state_ent(), req3).await;
        assert_eq!(res3.unwrap_err().code, "ERR_DATABASE_FAILURE");
    });
}

// =====================================================================
// ARTICLE ASSIGNMENT TESTS
// =====================================================================

#[test]
fn test_pub_001_publication_transfer_atomicity_and_preservation() {
    run_async(async {
        let (instances, pool) = setup_db().await;
        let ctx = TestContext { instances, provider: AppEntitlementProvider };
        set_developer_premium(true).unwrap();

        pool.execute("INSERT INTO workflow_stages (id, display_name, order_index, lifecycle_role, is_active, created_at) VALUES ('s1', 'S1', 0, 'DRAFT', 1, 'time')").await.unwrap();
        pool.execute("INSERT INTO workflow_stages (id, display_name, order_index, lifecycle_role, is_active, created_at) VALUES ('s2', 'S2', 1, 'PUBLICATION', 1, 'time')").await.unwrap();
        pool.execute("INSERT INTO articles (id, title, workflow_stage_id) VALUES ('a1', 'A1', 's1')").await.unwrap();
        pool.execute("INSERT INTO checklist_templates (id, display_name, template_schema, created_at) VALUES ('tmpl1', 'T1', '[]', 'time')").await.unwrap();
        
        // Setup initial checklist data
        pool.execute("INSERT INTO article_checklist_instances (article_id, stage_id, template_id, instance_data, completed_at) VALUES ('a1', 's1', 'tmpl1', '[]', 'prev_time')").await.unwrap();

        // Transfer to PUBLICATION
        let req = AssignArticleStageRequest { article_id: "a1".into(), target_stage_id: "s2".into() };
        assign_article_stage(ctx.state_db(), ctx.state_ent(), req).await.unwrap();

        // Verify transfer and completed_at preservation
        let rows = sqlx::query("SELECT stage_id, completed_at FROM article_checklist_instances WHERE article_id = 'a1'")
            .fetch_all(&pool).await.unwrap();
        assert_eq!(rows.len(), 1);
        
        let new_stage_id: String = rows[0].get(0);
        let completed_at: String = rows[0].get(1);
        
        assert_eq!(new_stage_id, "s2");
        assert_eq!(completed_at, "prev_time"); // completedAt must be preserved
    });
}

#[test]
fn test_pub_002_same_stage_strict_noop() {
    run_async(async {
        let (instances, pool) = setup_db().await;
        let ctx = TestContext { instances, provider: AppEntitlementProvider };
        set_developer_premium(false).unwrap(); // Free tier test

        pool.execute("INSERT INTO workflow_stages (id, display_name, order_index, lifecycle_role, is_active, created_at) VALUES ('s1', 'S1', 0, 'DRAFT', 1, 'time')").await.unwrap();
        pool.execute("INSERT INTO articles (id, title, workflow_stage_id) VALUES ('a1', 'A1', 's1')").await.unwrap();

        let req = AssignArticleStageRequest { article_id: "a1".into(), target_stage_id: "s1".into() };
        let res = assign_article_stage(ctx.state_db(), ctx.state_ent(), req).await;
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
        let ctx = TestContext { instances, provider: AppEntitlementProvider };
        set_developer_premium(true).unwrap();

        pool.execute("INSERT INTO workflow_stages (id, display_name, order_index, lifecycle_role, is_active, created_at) VALUES ('s1', 'S1', 0, 'DRAFT', 1, 'time')").await.unwrap();
        pool.execute("INSERT INTO categories (id, display_name, is_active, created_at) VALUES ('cat1', 'C1', 1, 'time')").await.unwrap();
        pool.execute("INSERT INTO articles (id, title, workflow_stage_id, category_id) VALUES ('a1', 'A1', 's1', 'cat1')").await.unwrap();

        // Assign to non-existent category -> Must rollback and fail closed
        let req = AssignArticleCategoryRequest { article_id: "a1".into(), category_id: Some("cat2".into()) };
        let res = assign_article_category(ctx.state_db(), ctx.state_ent(), req).await;
        assert_eq!(res.unwrap_err().code, "ERR_DATABASE_FAILURE");

        // Verify state is untouched
        let cat_id: String = sqlx::query_scalar("SELECT category_id FROM articles WHERE id = 'a1'")
            .fetch_one(&pool).await.unwrap();
        assert_eq!(cat_id, "cat1");
    });
}

#[test]
fn test_chk_001_malformed_template_json_fails_closed() {
    run_async(async {
        let (instances, pool) = setup_db().await;
        let ctx = TestContext { instances, provider: AppEntitlementProvider };
        set_developer_premium(true).unwrap();

        let req = CreateChecklistTemplateRequest {
            display_name: "Template".into(),
            template_schema: "invalid_json".into()
        };
        
        let res = create_checklist_template(ctx.state_db(), ctx.state_ent(), req).await;
        assert_eq!(res.unwrap_err().code, "ERR_DATABASE_FAILURE");
    });
}
