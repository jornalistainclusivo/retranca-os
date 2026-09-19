// Phase 6.4 Slice 4 Domain Operations — Integration Tests
//
// SCOPE: This test validates the entire native domain logic (Slice 4)
// to prove fail-closed behaviors, atomic operations, normalization,
// authorization, and strict re-ordering rules.
#![allow(unused_imports)]

use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::{Executor, Row};
use std::collections::HashMap;
use std::str::FromStr;
use tauri::State;
use tauri_plugin_sql::{DbInstances, DbPool};
use tokio::sync::RwLock;

use app_lib::entitlements::{EntitlementDecisionProvider, EntitlementError, EntitlementState};
use app_lib::models::workflow::ChecklistTemplateItem;
use app_lib::phase64::{
    assign_article_category, assign_article_stage, create_category_internal,
    create_checklist_template_internal, create_workflow_stage_internal,
    remove_workflow_stage_internal, reorder_workflow_stages_internal,
    remove_category_internal,
    update_checklist_template_internal, AssignArticleCategoryRequest, AssignArticleStageRequest,
    CreateCategoryRequest, CreateChecklistTemplateRequest, CreateWorkflowStageRequest,
    RemoveWorkflowStageRequest, RemoveCategoryRequest, ReorderWorkflowStagesRequest, StageOrder,
    UpdateChecklistTemplateRequest,
};

fn run_async<F: std::future::Future>(f: F) -> F::Output {
    let rt = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap();
    rt.block_on(f)
}

struct TestEntitlementProvider {
    state: std::sync::RwLock<EntitlementState>,
}

impl TestEntitlementProvider {
    fn new(state: EntitlementState) -> Self {
        Self {
            state: std::sync::RwLock::new(state),
        }
    }
    fn set_test_state(&self, state: EntitlementState) {
        *self.state.write().unwrap() = state;
    }
}

impl EntitlementDecisionProvider for TestEntitlementProvider {
    async fn check_entitlement(&self) -> Result<EntitlementState, EntitlementError> {
        Ok(*self.state.read().unwrap())
    }
}

// Setup a full memory database matching the production schema for Phase 6.4 tests
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
    provider: TestEntitlementProvider,
}

#[allow(dead_code)]
impl TestContext {
    fn state_db(&self) -> State<'_, DbInstances> {
        unsafe { std::mem::transmute(&self.instances) }
    }
    fn provider(&self) -> &TestEntitlementProvider {
        &self.provider
    }
}

// =====================================================================
// AUTHORIZATION TESTS
// =====================================================================

#[test]
fn test_ent_005_006_protected_authorization_matrix() {
    run_async(async {
        let (instances, pool) = setup_db().await;
        let ctx = TestContext {
            instances,
            provider: TestEntitlementProvider::new(EntitlementState::FreeConfirmed),
        };

        // 1. FREE TIER - Rejected before schema check
        let req = CreateWorkflowStageRequest {
            display_name: "Test".to_string(),
            semantic_classification: None,
            order_index: 0,
        };
        let res = create_workflow_stage_internal(ctx.state_db(), ctx.provider(), req).await;
        assert!(res.is_err());
        assert_eq!(
            res.unwrap_err().code,
            "ERR_CONFIRMED_FREE_PRO_MUTATION_DENIED"
        ); // FreeConfirmed doesn't map correctly, but Unknown maps to this

        // 2. PRO TIER - Allowed, fails schema check if we drop user_version to 0
        ctx.provider.set_test_state(EntitlementState::ProActive);
        pool.execute("PRAGMA user_version = 0;").await.unwrap();

        let req = CreateWorkflowStageRequest {
            display_name: "Test".to_string(),
            semantic_classification: None,
            order_index: 0,
        };
        let res = create_workflow_stage_internal(ctx.state_db(), ctx.provider(), req).await;
        assert!(res.is_err());
        assert_eq!(res.unwrap_err().code, "ERR_DATABASE_FAILURE");
    });
}

#[test]
fn test_free_001_operations_remain_free() {
    run_async(async {
        let (instances, pool) = setup_db().await;
        let ctx = TestContext {
            instances,
            provider: TestEntitlementProvider::new(EntitlementState::FreeConfirmed),
        };

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
        let ctx = TestContext {
            instances,
            provider: TestEntitlementProvider::new(EntitlementState::ProActive),
        };

        // 1. Create a stage
        create_workflow_stage_internal(
            ctx.state_db(),
            ctx.provider(),
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
            ctx.provider(),
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
            ctx.provider(),
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
        let ctx = TestContext {
            instances,
            provider: TestEntitlementProvider::new(EntitlementState::ProActive),
        };

        // Create initial
        create_workflow_stage_internal(
            ctx.state_db(),
            ctx.provider(),
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
            ctx.provider(),
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
            ctx.provider(),
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
        let ctx = TestContext {
            instances,
            provider: TestEntitlementProvider::new(EntitlementState::ProActive),
        };

        // Create 2 stages
        create_workflow_stage_internal(
            ctx.state_db(),
            ctx.provider(),
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
            ctx.provider(),
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
            ctx.provider(),
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
            ctx.provider(),
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
        let ctx = TestContext {
            instances,
            provider: TestEntitlementProvider::new(EntitlementState::ProActive),
        };

        create_workflow_stage_internal(
            ctx.state_db(),
            ctx.provider(),
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
            ctx.provider(),
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
        let res1 = reorder_workflow_stages_internal(ctx.state_db(), ctx.provider(), req1).await;
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
        let res2 = reorder_workflow_stages_internal(ctx.state_db(), ctx.provider(), req2).await;
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
        let res3 = reorder_workflow_stages_internal(ctx.state_db(), ctx.provider(), req3).await;
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
        let ctx = TestContext {
            instances,
            provider: TestEntitlementProvider::new(EntitlementState::ProActive),
        };

        create_workflow_stage_internal(
            ctx.state_db(),
            ctx.provider(),
            CreateWorkflowStageRequest {
                display_name: "To Delete".into(),
                semantic_classification: None,
                order_index: 0,
            },
        )
        .await
        .unwrap();

        let id: (String,) = sqlx::query_as("SELECT id FROM workflow_stages WHERE display_name = 'To Delete'")
            .fetch_one(&pool).await.unwrap();

        pool.execute("INSERT INTO workflow_stages (id, display_name, order_index, lifecycle_role, is_active, created_at) VALUES ('ws_1', 'S1', 1, 'PUBLICATION', 1, 'time')").await.unwrap();

        remove_workflow_stage_internal(
            ctx.state_db(),
            ctx.provider(),
            RemoveWorkflowStageRequest {
                id: id.0.clone(),
                reassign_to_stage_id: Some("ws_1".to_string()),
            },
        ).await.unwrap();

        let row: (i64, String) = sqlx::query_as("SELECT is_active, display_name FROM workflow_stages WHERE id = ?")
            .bind(&id.0)
            .fetch_one(&pool).await.unwrap();

        assert_eq!(row.0, 0);
        assert_eq!(row.1, format!("__deleted__{}", id.0));

        let res = create_workflow_stage_internal(
            ctx.state_db(),
            ctx.provider(),
            CreateWorkflowStageRequest {
                display_name: "To Delete".into(),
                semantic_classification: None,
                order_index: 0,
            },
        ).await;
        
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
        let ctx = TestContext {
            instances,
            provider: TestEntitlementProvider::new(EntitlementState::ProActive),
        };

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
        let ctx = TestContext {
            instances,
            provider: TestEntitlementProvider::new(EntitlementState::ProActive),
        };

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
        let ctx = TestContext {
            instances,
            provider: TestEntitlementProvider::new(EntitlementState::ProActive),
        };

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
        let ctx = TestContext {
            instances,
            provider: TestEntitlementProvider::new(EntitlementState::ProActive),
        };

        let req = CreateCategoryRequest {
            name: "Cat To Delete".into(),
        };
        let res = create_category_internal(ctx.state_db(), ctx.provider(), req).await.unwrap();

        pool.execute("INSERT INTO categories (id, name, origin, is_active, created_at) VALUES ('cat_standard', 'Standard', 'standard', 1, 'time')").await.unwrap();

        remove_category_internal(
            ctx.state_db(),
            ctx.provider(),
            RemoveCategoryRequest {
                id: res.id.clone(),
                reassign_to_category_id: Some("cat_standard".to_string()),
            },
        ).await.unwrap();

        let row: (i64, String) = sqlx::query_as("SELECT is_active, name FROM categories WHERE id = ?")
            .bind(&res.id)
            .fetch_one(&pool).await.unwrap();

        assert_eq!(row.0, 0);
        assert_eq!(row.1, format!("__deleted__{}", res.id));

        let req2 = CreateCategoryRequest {
            name: "Cat To Delete".into(),
        };
        assert!(create_category_internal(ctx.state_db(), ctx.provider(), req2).await.is_ok());
    });
}

#[test]
fn test_chk_001_invalid_template_items_fails_closed() {
    run_async(async {
        let (instances, _pool) = setup_db().await;
        let ctx = TestContext {
            instances,
            provider: TestEntitlementProvider::new(EntitlementState::ProActive),
        };

        let req = CreateChecklistTemplateRequest {
            name: "Template".into(),
            items: vec![ChecklistTemplateItem {
                label: "   ".into(), // Invalid empty label
            }],
        };

        let res = create_checklist_template_internal(ctx.state_db(), ctx.provider(), req).await;
        if let Err(e) = res {
            assert_eq!(e.code, "ERR_INVALID_CHECKLIST_TEMPLATE");
        } else {
            panic!("Expected error but got success");
        }
    });
}
