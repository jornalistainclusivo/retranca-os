use crate::entitlements::EntitlementDecisionProvider;
use serde::{Deserialize, Serialize};
use sqlx::{Pool, Row, Sqlite};
use tauri::State;
use tauri_plugin_sql::{DbInstances, DbPool};

use crate::entitlements::EntitlementError;
use crate::models::workflow::{
    new_domain_id, validate_lifecycle_role, validate_semantic_classification, Category,
    CategoryOrigin, ChecklistTemplate, ChecklistTemplateItem, WorkflowStage,
};

#[derive(Debug, Serialize)]
pub struct CanonicalError {
    pub code: String,
    pub retryable: bool,
    pub details: serde_json::Value,
}

impl std::fmt::Display for CanonicalError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", serde_json::to_string(self).unwrap())
    }
}

pub async fn get_pool<'a>(
    instances: &State<'a, DbInstances>,
) -> Result<Pool<Sqlite>, CanonicalError> {
    let map = instances.0.read().await;
    let pool_enum = map
        .get("sqlite:retranca.db")
        .ok_or_else(|| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({ "error": "Database not initialized" }),
        })?;

    #[allow(irrefutable_let_patterns)]
    let DbPool::Sqlite(pool) = pool_enum
    else {
        return Err(CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: false,
            details: serde_json::json!({ "error": "DbPool is not Sqlite" }),
        });
    };

    Ok(pool.clone())
}

pub async fn verify_user_version(pool: &Pool<Sqlite>) -> Result<(), CanonicalError> {
    let version: i64 = sqlx::query_scalar("PRAGMA user_version")
        .fetch_one(pool)
        .await
        .map_err(|e| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({ "error": e.to_string() }),
        })?;

    if version != 1 {
        return Err(CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: false,
            details: serde_json::json!({ "current_version": version }),
        });
    }
    Ok(())
}

pub async fn authorize_protected(
    provider: &impl EntitlementDecisionProvider,
) -> Result<(), CanonicalError> {
    let state = provider.check_entitlement().await.map_err(|e| match e {
        crate::entitlements::EntitlementError::EntitlementStateUnknown => CanonicalError {
            code: "ERR_ENTITLEMENT_STATE_UNKNOWN".into(),
            retryable: false,
            details: serde_json::json!({}),
        },
        _ => CanonicalError {
            code: "ERR_ENTITLEMENT_STATE_UNKNOWN".into(),
            retryable: false,
            details: serde_json::json!({}),
        },
    })?;

    crate::entitlements::authorize_mutation(&state).map_err(|e| match e {
        EntitlementError::ConfirmedFreeProtectedMutationDenied => CanonicalError {
            code: "ERR_CONFIRMED_FREE_PRO_MUTATION_DENIED".into(),
            retryable: false,
            details: serde_json::json!({}),
        },
        EntitlementError::EntitlementStateUnknown => CanonicalError {
            code: "ERR_ENTITLEMENT_STATE_UNKNOWN".into(),
            retryable: false,
            details: serde_json::json!({}),
        },
        EntitlementError::EntitlementUnavailable => CanonicalError {
            code: "ERR_ENTITLEMENT_UNAVAILABLE".into(),
            retryable: false,
            details: serde_json::json!({}),
        },
        _ => CanonicalError {
            code: "ERR_ENTITLEMENT_STATE_UNKNOWN".into(),
            retryable: false,
            details: serde_json::json!({}),
        },
    })
}

#[derive(Serialize)]
pub struct SuccessResponse {
    pub success: bool,
}

#[derive(Serialize)]
pub struct GetWorkflowStagesResponse {
    pub stages: Vec<WorkflowStage>,
}

#[tauri::command]
pub async fn get_workflow_stages(
    instances: State<'_, DbInstances>,
) -> Result<GetWorkflowStagesResponse, CanonicalError> {
    let pool = get_pool(&instances).await?;
    verify_user_version(&pool).await?;

    let rows = sqlx::query(
        "SELECT id, display_name, order_index, semantic_classification, lifecycle_role, is_active, created_at FROM workflow_stages ORDER BY order_index ASC"
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({ "error": e.to_string() }),
    })?;

    let mut stages = Vec::new();
    for row in rows {
        stages.push(WorkflowStage {
            id: row.get::<String, _>("id").clone(),
            display_name: row.get::<String, _>("display_name").clone(),
            order_index: row.get::<i64, _>("order_index"),
            semantic_classification: validate_semantic_classification(
                row.get::<Option<String>, _>("semantic_classification")
                    .as_deref(),
            )
            .unwrap_or(None),
            lifecycle_role: validate_lifecycle_role(
                row.get::<Option<String>, _>("lifecycle_role").as_deref(),
            )
            .unwrap_or(None),
            is_active: row.get::<i32, _>("is_active") != 0,
            created_at: Some(row.get::<String, _>("created_at")),
        });
    }

    Ok(GetWorkflowStagesResponse { stages })
}

#[derive(Serialize)]
pub struct GetCategoriesResponse {
    pub categories: Vec<Category>,
}

#[tauri::command]
pub async fn get_categories(
    instances: State<'_, DbInstances>,
) -> Result<GetCategoriesResponse, CanonicalError> {
    let pool = get_pool(&instances).await?;
    verify_user_version(&pool).await?;

    let rows = sqlx::query(
        "SELECT id, name, origin, is_active, created_at FROM categories ORDER BY name ASC",
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({ "error": e.to_string() }),
    })?;

    let mut categories = Vec::new();
    for row in rows {
        categories.push(Category {
            id: row.get::<String, _>("id").clone(),
            name: row.get::<String, _>("name").clone(),
            origin: CategoryOrigin::from_str_opt(&row.get::<String, _>("origin"))
                .unwrap_or(CategoryOrigin::Standard),
            is_active: row.get::<i32, _>("is_active") != 0,
            created_at: Some(row.get::<String, _>("created_at")),
        });
    }

    Ok(GetCategoriesResponse { categories })
}

#[derive(Serialize)]
pub struct GetChecklistTemplatesResponse {
    pub templates: Vec<ChecklistTemplate>,
}

#[tauri::command]
pub async fn get_checklist_templates(
    instances: State<'_, DbInstances>,
) -> Result<GetChecklistTemplatesResponse, CanonicalError> {
    let pool = get_pool(&instances).await?;
    verify_user_version(&pool).await?;

    let rows = sqlx::query(
        "SELECT id, name, items_json, created_at FROM checklist_templates ORDER BY name ASC",
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({ "error": e.to_string() }),
    })?;

    let mut templates = Vec::new();
    for row in rows {
        let items: Vec<ChecklistTemplateItem> =
            serde_json::from_str(&row.get::<String, _>("items_json")).unwrap_or_default();
        templates.push(ChecklistTemplate {
            id: row.get::<String, _>("id").clone(),
            name: row.get::<String, _>("name").clone(),
            items,
            created_at: Some(row.get::<String, _>("created_at")),
        });
    }

    Ok(GetChecklistTemplatesResponse { templates })
}

#[derive(Deserialize)]
pub struct AssignArticleStageRequest {
    pub article_id: String,
    pub workflow_stage_id: String,
}

#[tauri::command]
pub async fn assign_article_stage(
    instances: State<'_, DbInstances>,
    request: AssignArticleStageRequest,
) -> Result<SuccessResponse, CanonicalError> {
    let pool = get_pool(&instances).await?;
    verify_user_version(&pool).await?;

    let mut tx = pool.begin().await.map_err(|e| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({ "error": e.to_string() }),
    })?;

    let target_stage = sqlx::query(
        "SELECT id, lifecycle_role FROM workflow_stages WHERE id = ? AND is_active = 1",
    )
    .bind(&request.workflow_stage_id)
    .fetch_optional(&mut *tx)
    .await
    .map_err(|e| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({ "error": e.to_string() }),
    })?;

    let target_stage = target_stage.ok_or_else(|| CanonicalError {
        code: "ERR_UNRESOLVED_STAGE_REFERENCE".into(),
        retryable: false,
        details: serde_json::json!({}),
    })?;

    let article = sqlx::query("SELECT workflow_stage_id FROM articles WHERE id = ?")
        .bind(&request.article_id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({ "error": e.to_string() }),
        })?;

    let article = article.ok_or_else(|| CanonicalError {
        code: "ERR_UNRESOLVED_STAGE_REFERENCE".into(),
        retryable: false,
        details: serde_json::json!({}),
    })?;

    let current_stage_id = article.get::<String, _>("workflow_stage_id");
    if current_stage_id == request.workflow_stage_id {
        tx.rollback().await.map_err(|_| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({}),
        })?;
        return Ok(SuccessResponse { success: true });
    }

    let is_target_pub = target_stage
        .get::<Option<String>, _>("lifecycle_role")
        .as_deref()
        == Some("PUBLICATION");

    let now: String = sqlx::query_scalar("SELECT strftime('%Y-%m-%dT%H:%M:%fZ', 'now')")
        .fetch_one(&mut *tx)
        .await
        .map_err(|_| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({}),
        })?;
    let history_id = new_domain_id();
    let action_desc = "Estágio alterado".to_string();

    if is_target_pub {
        sqlx::query("UPDATE articles SET workflow_stage_id = ?, updatedAt = ?, completedAt = ? WHERE id = ?").bind(&request.workflow_stage_id).bind(&now).bind(&now).bind(&request.article_id).execute(&mut *tx).await.map_err(|_| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({}),
        })?;
    } else {
        sqlx::query("UPDATE articles SET workflow_stage_id = ?, updatedAt = ? WHERE id = ?")
            .bind(&request.workflow_stage_id)
            .bind(&now)
            .bind(&request.article_id)
            .execute(&mut *tx)
            .await
            .map_err(|_| CanonicalError {
                code: "ERR_DATABASE_FAILURE".into(),
                retryable: true,
                details: serde_json::json!({}),
            })?;
    }

    sqlx::query("INSERT INTO history_entries (id, articleId, date, action) VALUES (?, ?, ?, ?)")
        .bind(history_id)
        .bind(&request.article_id)
        .bind(&now)
        .bind(action_desc)
        .execute(&mut *tx)
        .await
        .map_err(|_| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({}),
        })?;

    tx.commit().await.map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    Ok(SuccessResponse { success: true })
}

#[derive(Deserialize)]
pub struct AssignArticleCategoryRequest {
    pub article_id: String,
    pub category_id: String,
}

#[tauri::command]
pub async fn assign_article_category(
    instances: State<'_, DbInstances>,
    request: AssignArticleCategoryRequest,
) -> Result<SuccessResponse, CanonicalError> {
    let pool = get_pool(&instances).await?;
    verify_user_version(&pool).await?;

    let mut tx = pool.begin().await.map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    let cat_exists: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM categories WHERE id = ? AND is_active = 1")
            .bind(&request.category_id)
            .fetch_one(&mut *tx)
            .await
            .map_err(|_| CanonicalError {
                code: "ERR_DATABASE_FAILURE".into(),
                retryable: true,
                details: serde_json::json!({}),
            })?;

    if cat_exists == 0 {
        return Err(CanonicalError {
            code: "ERR_UNRESOLVED_CATEGORY_REFERENCE".into(),
            retryable: false,
            details: serde_json::json!({}),
        });
    }

    let now: String = sqlx::query_scalar("SELECT strftime('%Y-%m-%dT%H:%M:%fZ', 'now')")
        .fetch_one(&mut *tx)
        .await
        .map_err(|_| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({}),
        })?;
    let result = sqlx::query("UPDATE articles SET category_id = ?, updatedAt = ? WHERE id = ?")
        .bind(&request.category_id)
        .bind(&now)
        .bind(&request.article_id)
        .execute(&mut *tx)
        .await
        .map_err(|_| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({}),
        })?;
    let rows_affected = result.rows_affected();

    if rows_affected > 0 {
        tx.commit().await.map_err(|_| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({}),
        })?;
    } else {
        tx.rollback().await.map_err(|_| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({}),
        })?;
    }

    Ok(SuccessResponse { success: true })
}

#[derive(Deserialize)]
pub struct ApplyChecklistTemplateRequest {
    pub article_id: String,
    pub template_id: String,
}

#[tauri::command]
pub async fn apply_checklist_template(
    instances: State<'_, DbInstances>,
    request: ApplyChecklistTemplateRequest,
) -> Result<SuccessResponse, CanonicalError> {
    let pool = get_pool(&instances).await?;
    verify_user_version(&pool).await?;

    let mut tx = pool.begin().await.map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    let template = sqlx::query("SELECT items_json FROM checklist_templates WHERE id = ?")
        .bind(request.template_id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|_| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({}),
        })?;

    let template = template.ok_or_else(|| CanonicalError {
        code: "ERR_INVALID_CHECKLIST_TEMPLATE".into(),
        retryable: false,
        details: serde_json::json!({}),
    })?;

    let items: Vec<ChecklistTemplateItem> =
        serde_json::from_str(&template.get::<String, _>("items_json")).map_err(|_| {
            CanonicalError {
                code: "ERR_DATABASE_FAILURE".into(),
                retryable: true,
                details: serde_json::json!({}),
            }
        })?;

    for item in items {
        let id = new_domain_id();
        sqlx::query("INSERT INTO checklist_items (id, articleId, label, completed, category) VALUES (?, ?, ?, 0, NULL)").bind(&id).bind(&request.article_id).bind(item.label).execute(&mut *tx).await.map_err(|_| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({}),
        })?;
    }

    tx.commit().await.map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    Ok(SuccessResponse { success: true })
}

#[derive(Deserialize)]
pub struct CreateWorkflowStageRequest {
    pub display_name: String,
    pub order_index: i64,
    pub semantic_classification: Option<String>,
}

#[tauri::command]
pub async fn create_workflow_stage(
    instances: State<'_, DbInstances>,
    provider: State<'_, crate::entitlements::AppEntitlementProvider>,
    request: CreateWorkflowStageRequest,
) -> Result<WorkflowStage, CanonicalError> {
    create_workflow_stage_internal(instances, &*provider, request).await
}

pub async fn create_workflow_stage_internal(
    instances: State<'_, DbInstances>,
    provider: &impl EntitlementDecisionProvider,
    request: CreateWorkflowStageRequest,
) -> Result<WorkflowStage, CanonicalError> {
    authorize_protected(provider).await?;
    let pool = get_pool(&instances).await?;
    verify_user_version(&pool).await?;

    // validate
    let sem_class = validate_semantic_classification(request.semantic_classification.as_deref())
        .map_err(|_| CanonicalError {
            code: "ERR_INVALID_WORKFLOW".into(),
            retryable: false,
            details: serde_json::json!({}),
        })?;

    let mut tx = pool.begin().await.map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    let display_name = request.display_name.trim().to_string();
    if display_name.is_empty() {
        return Err(CanonicalError {
            code: "ERR_INVALID_WORKFLOW".into(),
            retryable: false,
            details: serde_json::json!({}),
        });
    }

    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM workflow_stages WHERE LOWER(display_name) = LOWER(?) AND is_active = 1")
        .bind(&display_name)
        .fetch_one(&mut *tx)
        .await
        .map_err(|_| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({}),
        })?;

    if count > 0 {
        return Err(CanonicalError {
            code: "ERR_INVALID_WORKFLOW".into(),
            retryable: false,
            details: serde_json::json!({}),
        });
    }

    let active_count: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM workflow_stages WHERE is_active = 1")
            .fetch_one(&mut *tx)
            .await
            .map_err(|_| CanonicalError {
                code: "ERR_DATABASE_FAILURE".into(),
                retryable: true,
                details: serde_json::json!({}),
            })?;

    let insert_index = request.order_index;
    if insert_index < 0 || insert_index > active_count {
        return Err(CanonicalError {
            code: "ERR_INVALID_WORKFLOW".into(),
            retryable: false,
            details: serde_json::json!({}),
        });
    }

    sqlx::query("UPDATE workflow_stages SET order_index = order_index + 1 WHERE is_active = 1 AND order_index >= ?")
        .bind(insert_index)
        .execute(&mut *tx)
        .await
        .map_err(|_| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({}),
        })?;

    let id = new_domain_id();
    let now: String = sqlx::query_scalar("SELECT strftime('%Y-%m-%dT%H:%M:%fZ', 'now')")
        .fetch_one(&mut *tx)
        .await
        .map_err(|_| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({}),
        })?;

    sqlx::query("INSERT INTO workflow_stages (id, display_name, order_index, semantic_classification, lifecycle_role, is_active, created_at) VALUES (?, ?, ?, ?, NULL, 1, ?)").bind(&id).bind(&display_name).bind(request.order_index).bind(&request.semantic_classification).bind(&now).execute(&mut *tx).await.map_err(|_| CanonicalError {
        code: "ERR_INVALID_WORKFLOW".into(),
        retryable: false,
        details: serde_json::json!({}),
    })?;

    tx.commit().await.map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    Ok(WorkflowStage {
        id,
        display_name,
        order_index: request.order_index,
        semantic_classification: sem_class,
        lifecycle_role: None,
        is_active: true,
        created_at: Some(now),
    })
}

#[derive(Deserialize)]
pub struct UpdateWorkflowStageRequest {
    pub id: String,
    pub display_name: Option<String>,
    pub semantic_classification: Option<String>,
}

#[tauri::command]
pub async fn update_workflow_stage(
    instances: State<'_, DbInstances>,
    provider: State<'_, crate::entitlements::AppEntitlementProvider>,
    request: UpdateWorkflowStageRequest,
) -> Result<SuccessResponse, CanonicalError> {
    update_workflow_stage_internal(instances, &*provider, request).await
}

pub async fn update_workflow_stage_internal(
    instances: State<'_, DbInstances>,
    provider: &impl EntitlementDecisionProvider,
    request: UpdateWorkflowStageRequest,
) -> Result<SuccessResponse, CanonicalError> {
    authorize_protected(provider).await?;
    let pool = get_pool(&instances).await?;
    verify_user_version(&pool).await?;

    let _sem_class = match request.semantic_classification {
        Some(ref val) => {
            let sc = validate_semantic_classification(Some(val.as_str())).map_err(|_| {
                CanonicalError {
                    code: "ERR_INVALID_WORKFLOW".into(),
                    retryable: false,
                    details: serde_json::json!({}),
                }
            })?;
            Some(sc)
        }
        None => None,
    };

    let mut tx = pool.begin().await.map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    let stage = sqlx::query(
        "SELECT display_name, semantic_classification FROM workflow_stages WHERE id = ?",
    )
    .bind(&request.id)
    .fetch_optional(&mut *tx)
    .await
    .map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    if stage.is_none() {
        return Err(CanonicalError {
            code: "ERR_INVALID_WORKFLOW".into(),
            retryable: false,
            details: serde_json::json!({}),
        });
    }

    let current_name = stage
        .as_ref()
        .unwrap()
        .get::<String, _>("display_name")
        .clone();
    let current_class = stage
        .unwrap()
        .get::<Option<String>, _>("semantic_classification");

    let new_name = if let Some(n) = request.display_name {
        let trimmed = n.trim().to_string();
        if trimmed.is_empty() {
            return Err(CanonicalError {
                code: "ERR_INVALID_WORKFLOW".into(),
                retryable: false,
                details: serde_json::json!({}),
            });
        }
        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM workflow_stages WHERE LOWER(display_name) = LOWER(?) AND is_active = 1 AND id != ?")
            .bind(&trimmed)
            .bind(&request.id)
            .fetch_one(&mut *tx)
            .await
            .map_err(|_| CanonicalError {
                code: "ERR_DATABASE_FAILURE".into(),
                retryable: true,
                details: serde_json::json!({}),
            })?;
        if count > 0 {
            return Err(CanonicalError {
                code: "ERR_INVALID_WORKFLOW".into(),
                retryable: false,
                details: serde_json::json!({}),
            });
        }
        trimmed
    } else {
        current_name
    };
    let new_class = if request.semantic_classification.is_some() {
        request.semantic_classification
    } else {
        current_class
    };

    sqlx::query(
        "UPDATE workflow_stages SET display_name = ?, semantic_classification = ? WHERE id = ?",
    )
    .bind(new_name)
    .bind(&new_class)
    .bind(&request.id)
    .execute(&mut *tx)
    .await
    .map_err(|_| CanonicalError {
        code: "ERR_INVALID_WORKFLOW".into(),
        retryable: false,
        details: serde_json::json!({}),
    })?;

    tx.commit().await.map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    Ok(SuccessResponse { success: true })
}

#[derive(Deserialize)]
pub struct StageOrder {
    pub id: String,
    pub order_index: i64,
}

#[derive(Deserialize)]
pub struct ReorderWorkflowStagesRequest {
    pub stage_orders: Vec<StageOrder>,
}

#[tauri::command]
pub async fn reorder_workflow_stages(
    instances: State<'_, DbInstances>,
    provider: State<'_, crate::entitlements::AppEntitlementProvider>,
    request: ReorderWorkflowStagesRequest,
) -> Result<SuccessResponse, CanonicalError> {
    reorder_workflow_stages_internal(instances, &*provider, request).await
}

pub async fn reorder_workflow_stages_internal(
    instances: State<'_, DbInstances>,
    provider: &impl EntitlementDecisionProvider,
    request: ReorderWorkflowStagesRequest,
) -> Result<SuccessResponse, CanonicalError> {
    authorize_protected(provider).await?;
    let pool = get_pool(&instances).await?;
    verify_user_version(&pool).await?;

    let mut tx = pool.begin().await.map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    let active_stages = sqlx::query("SELECT id FROM workflow_stages WHERE is_active = 1")
        .fetch_all(&mut *tx)
        .await
        .map_err(|_| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({}),
        })?;
    let active_count = active_stages.len();
    if request.stage_orders.len() != active_count {
        return Err(CanonicalError {
            code: "ERR_INVALID_WORKFLOW".into(),
            retryable: false,
            details: serde_json::json!({}),
        });
    }
    let mut provided_ids = std::collections::HashSet::new();
    let mut provided_orders = std::collections::HashSet::new();
    for order in &request.stage_orders {
        provided_ids.insert(order.id.clone());
        if order.order_index < 0 || order.order_index >= active_count as i64 {
            return Err(CanonicalError {
                code: "ERR_INVALID_WORKFLOW".into(),
                retryable: false,
                details: serde_json::json!({}),
            });
        }
        provided_orders.insert(order.order_index);
    }
    if provided_ids.len() != active_count || provided_orders.len() != active_count {
        return Err(CanonicalError {
            code: "ERR_INVALID_WORKFLOW".into(),
            retryable: false,
            details: serde_json::json!({}),
        });
    }
    for row in active_stages {
        let row_id: String = row.get("id");
        if !provided_ids.contains(&row_id) {
            return Err(CanonicalError {
                code: "ERR_INVALID_WORKFLOW".into(),
                retryable: false,
                details: serde_json::json!({}),
            });
        }
    }

    for order in request.stage_orders {
        sqlx::query("UPDATE workflow_stages SET order_index = ? WHERE id = ?")
            .bind(order.order_index)
            .bind(order.id)
            .execute(&mut *tx)
            .await
            .map_err(|_| CanonicalError {
                code: "ERR_INVALID_WORKFLOW".into(),
                retryable: false,
                details: serde_json::json!({}),
            })?;
    }

    tx.commit().await.map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    Ok(SuccessResponse { success: true })
}

#[derive(Deserialize)]
pub struct RemoveWorkflowStageRequest {
    pub id: String,
    pub reassign_to_stage_id: Option<String>,
}

#[tauri::command]
pub async fn remove_workflow_stage(
    instances: State<'_, DbInstances>,
    provider: State<'_, crate::entitlements::AppEntitlementProvider>,
    request: RemoveWorkflowStageRequest,
) -> Result<SuccessResponse, CanonicalError> {
    remove_workflow_stage_internal(instances, &*provider, request).await
}

pub async fn remove_workflow_stage_internal(
    instances: State<'_, DbInstances>,
    provider: &impl EntitlementDecisionProvider,
    request: RemoveWorkflowStageRequest,
) -> Result<SuccessResponse, CanonicalError> {
    authorize_protected(provider).await?;
    let pool = get_pool(&instances).await?;
    verify_user_version(&pool).await?;

    let mut tx = pool.begin().await.map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    let source = sqlx::query(
        "SELECT lifecycle_role, is_active, order_index FROM workflow_stages WHERE id = ?",
    )
    .bind(&request.id)
    .fetch_optional(&mut *tx)
    .await
    .map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    let source = match source {
        Some(s) => s,
        None => {
            tx.rollback().await.map_err(|_| CanonicalError {
                code: "ERR_DATABASE_FAILURE".into(),
                retryable: true,
                details: serde_json::json!({}),
            })?;
            return Ok(SuccessResponse { success: true });
        }
    };

    if source.get::<i32, _>("is_active") == 0 {
        tx.rollback().await.map_err(|_| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({}),
        })?;
        return Ok(SuccessResponse { success: true });
    }

    let active_count: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM workflow_stages WHERE is_active = 1")
            .fetch_one(&mut *tx)
            .await
            .map_err(|_| CanonicalError {
                code: "ERR_DATABASE_FAILURE".into(),
                retryable: true,
                details: serde_json::json!({}),
            })?;
    if active_count <= 1 {
        tx.rollback().await.map_err(|_| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({}),
        })?;
        return Err(CanonicalError {
            code: "ERR_LAST_STAGE_REMOVAL".into(),
            retryable: false,
            details: serde_json::json!({}),
        });
    }

    let is_pub =
        source.get::<Option<String>, _>("lifecycle_role").as_deref() == Some("PUBLICATION");

    if is_pub && request.reassign_to_stage_id.is_none() {
        return Err(CanonicalError {
            code: "ERR_UNRESOLVED_STAGE_REFERENCE".into(),
            retryable: false,
            details: serde_json::json!({}),
        });
    }

    if let Some(ref target_id) = request.reassign_to_stage_id {
        if target_id == &request.id {
            return Err(CanonicalError {
                code: "ERR_UNRESOLVED_STAGE_REFERENCE".into(),
                retryable: false,
                details: serde_json::json!({}),
            });
        }
        let target = sqlx::query("SELECT is_active FROM workflow_stages WHERE id = ?")
            .bind(target_id)
            .fetch_optional(&mut *tx)
            .await
            .map_err(|_| CanonicalError {
                code: "ERR_DATABASE_FAILURE".into(),
                retryable: true,
                details: serde_json::json!({}),
            })?;
        if target.is_none() || target.as_ref().unwrap().get::<i32, _>("is_active") == 0 {
            return Err(CanonicalError {
                code: "ERR_UNRESOLVED_STAGE_REFERENCE".into(),
                retryable: false,
                details: serde_json::json!({}),
            });
        }

        // Reassign
        let now: String = sqlx::query_scalar("SELECT strftime('%Y-%m-%dT%H:%M:%fZ', 'now')")
            .fetch_one(&mut *tx)
            .await
            .map_err(|_| CanonicalError {
                code: "ERR_DATABASE_FAILURE".into(),
                retryable: true,
                details: serde_json::json!({}),
            })?;

        // Find articles in source
        let articles = sqlx::query("SELECT id FROM articles WHERE workflow_stage_id = ?")
            .bind(&request.id)
            .fetch_all(&mut *tx)
            .await
            .map_err(|_| CanonicalError {
                code: "ERR_DATABASE_FAILURE".into(),
                retryable: true,
                details: serde_json::json!({}),
            })?;

        for a in articles {
            sqlx::query("UPDATE articles SET workflow_stage_id = ?, updatedAt = ? WHERE id = ?")
                .bind(target_id)
                .bind(&now)
                .bind(a.get::<String, _>("id"))
                .execute(&mut *tx)
                .await
                .map_err(|_| CanonicalError {
                    code: "ERR_DATABASE_FAILURE".into(),
                    retryable: true,
                    details: serde_json::json!({}),
                })?;
        }

        if is_pub {
            // Transfer PUBLICATION role
            sqlx::query("UPDATE workflow_stages SET lifecycle_role = NULL WHERE id = ?")
                .bind(&request.id)
                .execute(&mut *tx)
                .await
                .map_err(|_| CanonicalError {
                    code: "ERR_DATABASE_FAILURE".into(),
                    retryable: true,
                    details: serde_json::json!({}),
                })?;
            sqlx::query("UPDATE workflow_stages SET lifecycle_role = 'PUBLICATION' WHERE id = ?")
                .bind(target_id)
                .execute(&mut *tx)
                .await
                .map_err(|_| CanonicalError {
                    code: "ERR_DATABASE_FAILURE".into(),
                    retryable: true,
                    details: serde_json::json!({}),
                })?;
        }
    } else {
        // Find articles in source, since reassign_to_stage_id is None we can't if there are any
        let has_articles: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM articles WHERE workflow_stage_id = ?")
                .bind(&request.id)
                .fetch_one(&mut *tx)
                .await
                .map_err(|_| CanonicalError {
                    code: "ERR_DATABASE_FAILURE".into(),
                    retryable: true,
                    details: serde_json::json!({}),
                })?;
        if has_articles > 0 {
            return Err(CanonicalError {
                code: "ERR_UNRESOLVED_STAGE_REFERENCE".into(), // spec says it's required if articles exist, wait
                retryable: false,
                details: serde_json::json!({}),
            });
        }
    }

    let source_order_index = source.get::<i64, _>("order_index");

    // deactivate source
    sqlx::query("UPDATE workflow_stages SET is_active = 0, order_index = 9999 WHERE id = ?")
        .bind(&request.id)
        .execute(&mut *tx)
        .await
        .map_err(|_| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({}),
        })?;

    // compact remaining active ordering
    sqlx::query("UPDATE workflow_stages SET order_index = order_index - 1 WHERE is_active = 1 AND order_index > ?")
        .bind(source_order_index)
        .execute(&mut *tx)
        .await
        .map_err(|_| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({}),
        })?;

    // verify exactly one ACTIVE PUBLICATION role
    let pub_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM workflow_stages WHERE lifecycle_role = 'PUBLICATION' AND is_active = 1")
        .fetch_one(&mut *tx).await.map_err(|_| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({}),
        })?;

    if pub_count != 1 {
        tx.rollback().await.map_err(|_| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({}),
        })?;
        return Err(CanonicalError {
            code: "ERR_PUBLICATION_ROLE_INVARIANT".into(),
            retryable: false,
            details: serde_json::json!({}),
        });
    }

    tx.commit().await.map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    Ok(SuccessResponse { success: true })
}

#[derive(Deserialize)]
pub struct CreateCategoryRequest {
    pub name: String,
}

#[tauri::command]
pub async fn create_category(
    instances: State<'_, DbInstances>,
    provider: State<'_, crate::entitlements::AppEntitlementProvider>,
    request: CreateCategoryRequest,
) -> Result<Category, CanonicalError> {
    create_category_internal(instances, &*provider, request).await
}

pub async fn create_category_internal(
    instances: State<'_, DbInstances>,
    provider: &impl EntitlementDecisionProvider,
    request: CreateCategoryRequest,
) -> Result<Category, CanonicalError> {
    authorize_protected(provider).await?;
    let pool = get_pool(&instances).await?;
    verify_user_version(&pool).await?;

    let mut tx = pool.begin().await.map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    let name = request.name.trim().to_string();
    if name.is_empty() {
        return Err(CanonicalError {
            code: "ERR_INVALID_CATEGORY".into(),
            retryable: false,
            details: serde_json::json!({}),
        });
    }

    let count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM categories WHERE LOWER(name) = LOWER(?) AND is_active = 1",
    )
    .bind(&name)
    .fetch_one(&mut *tx)
    .await
    .map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    if count > 0 {
        return Err(CanonicalError {
            code: "ERR_INVALID_CATEGORY".into(),
            retryable: false,
            details: serde_json::json!({}),
        });
    }

    let id = new_domain_id();
    let now: String = sqlx::query_scalar("SELECT strftime('%Y-%m-%dT%H:%M:%fZ', 'now')")
        .fetch_one(&mut *tx)
        .await
        .map_err(|_| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({}),
        })?;

    sqlx::query("INSERT INTO categories (id, name, origin, is_active, created_at) VALUES (?, ?, 'custom', 1, ?)").bind(&id).bind(&name).bind(&now).execute(&mut *tx).await.map_err(|_| CanonicalError {
        code: "ERR_INVALID_CATEGORY".into(),
        retryable: false,
        details: serde_json::json!({}),
    })?;

    tx.commit().await.map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    Ok(Category {
        id: id.clone(),
        name,
        origin: CategoryOrigin::Custom,
        is_active: true,
        created_at: Some(now),
    })
}

#[derive(Deserialize)]
pub struct RenameCategoryRequest {
    pub id: String,
    pub name: String,
}

#[tauri::command]
pub async fn rename_category(
    instances: State<'_, DbInstances>,
    provider: State<'_, crate::entitlements::AppEntitlementProvider>,
    request: RenameCategoryRequest,
) -> Result<SuccessResponse, CanonicalError> {
    rename_category_internal(instances, &*provider, request).await
}

pub async fn rename_category_internal(
    instances: State<'_, DbInstances>,
    provider: &impl EntitlementDecisionProvider,
    request: RenameCategoryRequest,
) -> Result<SuccessResponse, CanonicalError> {
    authorize_protected(provider).await?;
    let pool = get_pool(&instances).await?;
    verify_user_version(&pool).await?;

    let mut tx = pool.begin().await.map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    let cat = sqlx::query("SELECT origin FROM categories WHERE id = ? AND is_active = 1")
        .bind(&request.id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|_| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({}),
        })?;

    if cat.is_none() {
        return Err(CanonicalError {
            code: "ERR_INVALID_CATEGORY".into(),
            retryable: false,
            details: serde_json::json!({}),
        });
    }

    if cat.unwrap().get::<String, _>("origin") == "standard" {
        return Err(CanonicalError {
            code: "ERR_INVALID_CATEGORY".into(),
            retryable: false,
            details: serde_json::json!({}),
        });
    }

    let name = request.name.trim().to_string();
    if name.is_empty() {
        return Err(CanonicalError {
            code: "ERR_INVALID_CATEGORY".into(),
            retryable: false,
            details: serde_json::json!({}),
        });
    }

    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM categories WHERE LOWER(name) = LOWER(?) AND is_active = 1 AND id != ?")
        .bind(&name)
        .bind(&request.id)
        .fetch_one(&mut *tx)
        .await
        .map_err(|_| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({}),
        })?;
    if count > 0 {
        return Err(CanonicalError {
            code: "ERR_INVALID_CATEGORY".into(),
            retryable: false,
            details: serde_json::json!({}),
        });
    }

    sqlx::query("UPDATE categories SET name = ? WHERE id = ?")
        .bind(&name)
        .bind(&request.id)
        .execute(&mut *tx)
        .await
        .map_err(|_| CanonicalError {
            code: "ERR_INVALID_CATEGORY".into(),
            retryable: false,
            details: serde_json::json!({}),
        })?;

    tx.commit().await.map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    Ok(SuccessResponse { success: true })
}

#[derive(Deserialize)]
pub struct RemoveCategoryRequest {
    pub id: String,
    pub reassign_to_category_id: Option<String>,
}

#[tauri::command]
pub async fn remove_category(
    instances: State<'_, DbInstances>,
    provider: State<'_, crate::entitlements::AppEntitlementProvider>,
    request: RemoveCategoryRequest,
) -> Result<SuccessResponse, CanonicalError> {
    remove_category_internal(instances, &*provider, request).await
}

pub async fn remove_category_internal(
    instances: State<'_, DbInstances>,
    provider: &impl EntitlementDecisionProvider,
    request: RemoveCategoryRequest,
) -> Result<SuccessResponse, CanonicalError> {
    authorize_protected(provider).await?;
    let pool = get_pool(&instances).await?;
    verify_user_version(&pool).await?;

    let mut tx = pool.begin().await.map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    let cat = sqlx::query("SELECT origin, is_active FROM categories WHERE id = ?")
        .bind(&request.id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|_| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({}),
        })?;

    let cat = match cat {
        Some(c) => c,
        None => return Ok(SuccessResponse { success: true }),
    };

    if cat.get::<i32, _>("is_active") == 0 {
        return Ok(SuccessResponse { success: true });
    }
    if cat.get::<String, _>("origin") == "standard" {
        return Err(CanonicalError {
            code: "ERR_INVALID_CATEGORY".into(),
            retryable: false,
            details: serde_json::json!({}),
        });
    }

    let has_articles: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM articles WHERE category_id = ?")
            .bind(&request.id)
            .fetch_one(&mut *tx)
            .await
            .map_err(|_| CanonicalError {
                code: "ERR_DATABASE_FAILURE".into(),
                retryable: true,
                details: serde_json::json!({}),
            })?;

    if has_articles > 0 {
        if request.reassign_to_category_id.is_none() {
            return Err(CanonicalError {
                code: "ERR_UNRESOLVED_CATEGORY_REFERENCE".into(),
                retryable: false,
                details: serde_json::json!({}),
            });
        }

        let target_id = request.reassign_to_category_id.as_ref().unwrap();
        if target_id == &request.id {
            return Err(CanonicalError {
                code: "ERR_UNRESOLVED_CATEGORY_REFERENCE".into(),
                retryable: false,
                details: serde_json::json!({}),
            });
        }

        let target_active_opt: Option<i64> =
            sqlx::query_scalar("SELECT is_active FROM categories WHERE id = ?")
                .bind(target_id)
                .fetch_optional(&mut *tx)
                .await
                .map_err(|_| CanonicalError {
                    code: "ERR_DATABASE_FAILURE".into(),
                    retryable: true,
                    details: serde_json::json!({}),
                })?;
        let target_active = target_active_opt.unwrap_or(0i64);

        if target_active == 0 {
            return Err(CanonicalError {
                code: "ERR_UNRESOLVED_CATEGORY_REFERENCE".into(),
                retryable: false,
                details: serde_json::json!({}),
            });
        }

        let now: String = sqlx::query_scalar("SELECT strftime('%Y-%m-%dT%H:%M:%fZ', 'now')")
            .fetch_one(&mut *tx)
            .await
            .map_err(|_| CanonicalError {
                code: "ERR_DATABASE_FAILURE".into(),
                retryable: true,
                details: serde_json::json!({}),
            })?;
        sqlx::query("UPDATE articles SET category_id = ?, updatedAt = ? WHERE category_id = ?")
            .bind(target_id)
            .bind(&now)
            .bind(&request.id)
            .execute(&mut *tx)
            .await
            .map_err(|_| CanonicalError {
                code: "ERR_DATABASE_FAILURE".into(),
                retryable: true,
                details: serde_json::json!({}),
            })?;
    }

    sqlx::query("UPDATE categories SET is_active = 0 WHERE id = ?")
        .bind(&request.id)
        .execute(&mut *tx)
        .await
        .map_err(|_| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({}),
        })?;

    tx.commit().await.map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    Ok(SuccessResponse { success: true })
}

#[derive(Deserialize)]
pub struct CreateChecklistTemplateRequest {
    pub name: String,
    pub items: Vec<ChecklistTemplateItem>,
}

#[tauri::command]
pub async fn create_checklist_template(
    instances: State<'_, DbInstances>,
    provider: State<'_, crate::entitlements::AppEntitlementProvider>,
    request: CreateChecklistTemplateRequest,
) -> Result<ChecklistTemplate, CanonicalError> {
    create_checklist_template_internal(instances, &*provider, request).await
}

pub async fn create_checklist_template_internal(
    instances: State<'_, DbInstances>,
    provider: &impl EntitlementDecisionProvider,
    request: CreateChecklistTemplateRequest,
) -> Result<ChecklistTemplate, CanonicalError> {
    authorize_protected(provider).await?;
    let pool = get_pool(&instances).await?;
    verify_user_version(&pool).await?;

    let mut tx = pool.begin().await.map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    let name = request.name.trim().to_string();
    if name.is_empty() {
        return Err(CanonicalError {
            code: "ERR_INVALID_CHECKLIST_TEMPLATE".into(),
            retryable: false,
            details: serde_json::json!({}),
        });
    }

    // validate items
    if request.items.iter().any(|i| i.label.trim().is_empty()) {
        return Err(CanonicalError {
            code: "ERR_INVALID_CHECKLIST_TEMPLATE".into(),
            retryable: false,
            details: serde_json::json!({}),
        });
    }

    let count: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM checklist_templates WHERE LOWER(name) = LOWER(?)")
            .bind(&name)
            .fetch_one(&mut *tx)
            .await
            .map_err(|_| CanonicalError {
                code: "ERR_DATABASE_FAILURE".into(),
                retryable: true,
                details: serde_json::json!({}),
            })?;

    if count > 0 {
        return Err(CanonicalError {
            code: "ERR_INVALID_CHECKLIST_TEMPLATE".into(),
            retryable: false,
            details: serde_json::json!({}),
        });
    }

    let id = new_domain_id();
    let now: String = sqlx::query_scalar("SELECT strftime('%Y-%m-%dT%H:%M:%fZ', 'now')")
        .fetch_one(&mut *tx)
        .await
        .map_err(|_| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({}),
        })?;
    let items_json = serde_json::to_string(&request.items).map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    sqlx::query(
        "INSERT INTO checklist_templates (id, name, items_json, created_at) VALUES (?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&name)
    .bind(&items_json)
    .bind(&now)
    .execute(&mut *tx)
    .await
    .map_err(|_| CanonicalError {
        code: "ERR_INVALID_CHECKLIST_TEMPLATE".into(),
        retryable: false,
        details: serde_json::json!({}),
    })?;

    tx.commit().await.map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    Ok(ChecklistTemplate {
        id: id.clone(),
        name,
        items: request.items,
        created_at: Some(now),
    })
}

#[derive(Deserialize)]
pub struct UpdateChecklistTemplateRequest {
    pub id: String,
    pub name: String,
    pub items: Vec<ChecklistTemplateItem>,
}

#[tauri::command]
pub async fn update_checklist_template(
    instances: State<'_, DbInstances>,
    provider: State<'_, crate::entitlements::AppEntitlementProvider>,
    request: UpdateChecklistTemplateRequest,
) -> Result<SuccessResponse, CanonicalError> {
    update_checklist_template_internal(instances, &*provider, request).await
}

pub async fn update_checklist_template_internal(
    instances: State<'_, DbInstances>,
    provider: &impl EntitlementDecisionProvider,
    request: UpdateChecklistTemplateRequest,
) -> Result<SuccessResponse, CanonicalError> {
    authorize_protected(provider).await?;
    let pool = get_pool(&instances).await?;
    verify_user_version(&pool).await?;

    let mut tx = pool.begin().await.map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    let name = request.name.trim().to_string();
    if name.is_empty() {
        return Err(CanonicalError {
            code: "ERR_INVALID_CHECKLIST_TEMPLATE".into(),
            retryable: false,
            details: serde_json::json!({}),
        });
    }

    if request.items.iter().any(|i| i.label.trim().is_empty()) {
        return Err(CanonicalError {
            code: "ERR_INVALID_CHECKLIST_TEMPLATE".into(),
            retryable: false,
            details: serde_json::json!({}),
        });
    }

    let exists: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM checklist_templates WHERE id = ?")
        .bind(&request.id)
        .fetch_one(&mut *tx)
        .await
        .map_err(|_| CanonicalError {
            code: "ERR_DATABASE_FAILURE".into(),
            retryable: true,
            details: serde_json::json!({}),
        })?;

    if exists == 0 {
        return Err(CanonicalError {
            code: "ERR_INVALID_CHECKLIST_TEMPLATE".into(),
            retryable: false,
            details: serde_json::json!({}),
        });
    }

    let count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM checklist_templates WHERE LOWER(name) = LOWER(?) AND id != ?",
    )
    .bind(&name)
    .bind(&request.id)
    .fetch_one(&mut *tx)
    .await
    .map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    if count > 0 {
        return Err(CanonicalError {
            code: "ERR_INVALID_CHECKLIST_TEMPLATE".into(),
            retryable: false,
            details: serde_json::json!({}),
        });
    }

    let items_json = serde_json::to_string(&request.items).map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    sqlx::query("UPDATE checklist_templates SET name = ?, items_json = ? WHERE id = ?")
        .bind(&name)
        .bind(&items_json)
        .bind(&request.id)
        .execute(&mut *tx)
        .await
        .map_err(|_| CanonicalError {
            code: "ERR_INVALID_CHECKLIST_TEMPLATE".into(),
            retryable: false,
            details: serde_json::json!({}),
        })?;

    tx.commit().await.map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    Ok(SuccessResponse { success: true })
}

#[derive(Deserialize)]
pub struct DeleteChecklistTemplateRequest {
    pub id: String,
}

#[tauri::command]
pub async fn delete_checklist_template(
    instances: State<'_, DbInstances>,
    provider: State<'_, crate::entitlements::AppEntitlementProvider>,
    request: DeleteChecklistTemplateRequest,
) -> Result<SuccessResponse, CanonicalError> {
    delete_checklist_template_internal(instances, &*provider, request).await
}

pub async fn delete_checklist_template_internal(
    instances: State<'_, DbInstances>,
    provider: &impl EntitlementDecisionProvider,
    request: DeleteChecklistTemplateRequest,
) -> Result<SuccessResponse, CanonicalError> {
    authorize_protected(provider).await?;
    let pool = get_pool(&instances).await?;
    verify_user_version(&pool).await?;

    let mut tx = pool.begin().await.map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    sqlx::query("DELETE FROM checklist_templates WHERE id = ?")
        .bind(&request.id)
        .execute(&mut *tx)
        .await
        .map_err(|_| CanonicalError {
            code: "ERR_INVALID_CHECKLIST_TEMPLATE".into(),
            retryable: false,
            details: serde_json::json!({}),
        })?;

    tx.commit().await.map_err(|_| CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    })?;

    Ok(SuccessResponse { success: true })
}
