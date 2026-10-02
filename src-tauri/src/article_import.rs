use crate::phase64::{get_pool, CanonicalError};
use serde::{Deserialize, Serialize};
use sqlx::{Pool, Sqlite, Transaction};
use std::collections::HashSet;
use tauri::State;
use tauri_plugin_sql::DbInstances;

const MAX_IMPORT_BYTES: usize = 5 * 1024 * 1024;
const MAX_IMPORT_COUNT: usize = 1000;

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ImportedArticle {
    pub id: String,
    pub title: String,
    pub status: String,
    pub category_tag: String,
    pub tags: String,
    pub publish_date: String,
    #[serde(default)]
    pub summary: String,
    #[serde(default)]
    pub objective: String,
    #[serde(default)]
    pub analysis_content: String,
    #[serde(default)]
    pub keyword: String,
    #[serde(default)]
    pub persona: String,
    #[serde(default)]
    pub cta: String,
    #[serde(default)]
    pub internal_links: String,
    #[serde(default)]
    pub external_links: String,
    #[serde(default)]
    pub estimated_time: String,
    #[serde(default)]
    pub spent_time: String,
    #[serde(default)]
    pub notes: String,
    pub created_at: String,
    pub updated_at: String,
    pub completed_at: Option<String>,
    pub workflow_stage_id: String,
    pub category_id: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ImportedChecklist {
    pub id: String,
    pub article_id: String,
    pub label: String,
    pub completed: i32,
    pub category: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ImportedHistory {
    pub id: String,
    pub article_id: String,
    pub date: String,
    pub action: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct ImportedArticleData {
    pub article: ImportedArticle,
    pub checklists: Vec<ImportedChecklist>,
    pub history: Vec<ImportedHistory>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct ImportArticlesRequest {
    pub articles: Vec<ImportedArticleData>,
}

#[derive(Debug, Serialize, PartialEq)]
pub struct ImportArticlesResponse {
    pub imported: usize,
    pub skipped: usize,
}

fn invalid(code: &str) -> CanonicalError {
    CanonicalError {
        code: code.into(),
        retryable: false,
        details: serde_json::json!({}),
    }
}

fn database_failure(_: sqlx::Error) -> CanonicalError {
    CanonicalError {
        code: "ERR_DATABASE_FAILURE".into(),
        retryable: true,
        details: serde_json::json!({}),
    }
}

fn valid_id(id: &str) -> bool {
    !id.trim().is_empty() && id.chars().count() <= 256
}

fn validate_request(request: &ImportArticlesRequest) -> Result<(), CanonicalError> {
    if request.articles.len() > MAX_IMPORT_COUNT
        || serde_json::to_vec(request)
            .map_err(|_| invalid("ERR_IMPORT_INVALID"))?
            .len()
            > MAX_IMPORT_BYTES
    {
        return Err(invalid("ERR_IMPORT_LIMIT"));
    }
    let mut article_ids = HashSet::new();
    for raw in &request.articles {
        let article = &raw.article;
        if !valid_id(&article.id)
            || !article_ids.insert(&article.id)
            || !valid_id(&article.workflow_stage_id)
            || !valid_id(&article.category_id)
            || !["ideia", "pesquisa", "escrita", "revisao", "publicado"]
                .contains(&article.status.as_str())
            || ![
                "IA",
                "Acessibilidade",
                "Inclusão",
                "SEO",
                "Docs",
                "Blog",
                "Social",
                "Linguagem Simples",
            ]
            .contains(&article.category_tag.as_str())
            || serde_json::from_str::<Vec<String>>(&article.tags).is_err()
        {
            return Err(invalid("ERR_IMPORT_INVALID"));
        }
        let mut checklist_ids = HashSet::new();
        for item in &raw.checklists {
            if item.article_id != article.id
                || !valid_id(&item.id)
                || !checklist_ids.insert(&item.id)
                || ![0, 1].contains(&item.completed)
                || item.category.as_ref().is_some_and(|category| {
                    ![
                        "pesquisa",
                        "seo",
                        "acessibilidade",
                        "editorial",
                        "wcag",
                        "ia",
                        "distribuicao",
                    ]
                    .contains(&category.as_str())
                })
            {
                return Err(invalid("ERR_IMPORT_INVALID"));
            }
        }
        let mut history_ids = HashSet::new();
        for item in &raw.history {
            if item.article_id != article.id || !valid_id(&item.id) || !history_ids.insert(&item.id)
            {
                return Err(invalid("ERR_IMPORT_INVALID"));
            }
        }
    }
    Ok(())
}

/// New related rows receive stable article-owned IDs; local rows are never rewritten.
pub fn imported_relation_id(article_id: &str, relation_id: &str) -> String {
    format!(
        "import_{}",
        serde_json::to_string(&[article_id, relation_id]).expect("strings serialize")
    )
}

async fn import_in_transaction(
    tx: &mut Transaction<'_, Sqlite>,
    request: &ImportArticlesRequest,
) -> Result<ImportArticlesResponse, CanonicalError> {
    let version: i64 = sqlx::query_scalar("PRAGMA user_version")
        .fetch_one(&mut **tx)
        .await
        .map_err(database_failure)?;
    if version != 2 {
        return Err(invalid("ERR_IMPORT_SCHEMA"));
    }
    let publications: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM workflow_stages WHERE lifecycle_role = 'PUBLICATION' AND is_active = 1")
        .fetch_one(&mut **tx).await.map_err(database_failure)?;
    if publications != 1 {
        return Err(invalid("ERR_PUBLICATION_ROLE_INVARIANT"));
    }
    let existing: HashSet<String> = sqlx::query_scalar::<_, String>("SELECT id FROM articles")
        .fetch_all(&mut **tx)
        .await
        .map_err(database_failure)?
        .into_iter()
        .collect();
    let stages: HashSet<String> =
        sqlx::query_scalar::<_, String>("SELECT id FROM workflow_stages WHERE is_active = 1")
            .fetch_all(&mut **tx)
            .await
            .map_err(database_failure)?
            .into_iter()
            .collect();
    let categories: HashSet<String> =
        sqlx::query_scalar::<_, String>("SELECT id FROM categories WHERE is_active = 1")
            .fetch_all(&mut **tx)
            .await
            .map_err(database_failure)?
            .into_iter()
            .collect();
    // Validate the whole new batch before attempting any insert.
    for raw in &request.articles {
        if !existing.contains(&raw.article.id)
            && (!stages.contains(&raw.article.workflow_stage_id)
                || !categories.contains(&raw.article.category_id))
        {
            return Err(invalid("ERR_IMPORT_REFERENCE"));
        }
        if !existing.contains(&raw.article.id) {
            for item in &raw.checklists {
                let occupied: bool =
                    sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM checklist_items WHERE id = ?)")
                        .bind(imported_relation_id(&raw.article.id, &item.id))
                        .fetch_one(&mut **tx)
                        .await
                        .map_err(database_failure)?;
                if occupied {
                    return Err(invalid("ERR_IMPORT_RELATION_CONFLICT"));
                }
            }
            for item in &raw.history {
                let occupied: bool =
                    sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM history_entries WHERE id = ?)")
                        .bind(imported_relation_id(&raw.article.id, &item.id))
                        .fetch_one(&mut **tx)
                        .await
                        .map_err(database_failure)?;
                if occupied {
                    return Err(invalid("ERR_IMPORT_RELATION_CONFLICT"));
                }
            }
        }
    }
    let mut result = ImportArticlesResponse {
        imported: 0,
        skipped: 0,
    };
    for raw in &request.articles {
        let a = &raw.article;
        if existing.contains(&a.id) {
            result.skipped += 1;
            continue;
        }
        let inserted = sqlx::query("INSERT INTO articles (id, title, status, categoryTag, tags, publishDate, summary, objective, analysisContent, keyword, persona, cta, internalLinks, externalLinks, estimatedTime, spentTime, notes, createdAt, updatedAt, completedAt, workflow_stage_id, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING")
            .bind(&a.id).bind(&a.title).bind(&a.status).bind(&a.category_tag).bind(&a.tags).bind(&a.publish_date)
            .bind(&a.summary).bind(&a.objective).bind(&a.analysis_content).bind(&a.keyword).bind(&a.persona).bind(&a.cta)
            .bind(&a.internal_links).bind(&a.external_links).bind(&a.estimated_time).bind(&a.spent_time).bind(&a.notes)
            .bind(&a.created_at).bind(&a.updated_at).bind(&a.completed_at).bind(&a.workflow_stage_id).bind(&a.category_id)
            .execute(&mut **tx).await.map_err(database_failure)?;
        if inserted.rows_affected() == 0 {
            result.skipped += 1;
            continue;
        }
        for item in &raw.checklists {
            sqlx::query("INSERT INTO checklist_items (id, articleId, label, completed, category) VALUES (?, ?, ?, ?, ?)")
                .bind(imported_relation_id(&a.id, &item.id)).bind(&a.id).bind(&item.label).bind(item.completed).bind(&item.category)
                .execute(&mut **tx).await.map_err(database_failure)?;
        }
        for item in &raw.history {
            sqlx::query(
                "INSERT INTO history_entries (id, articleId, date, action) VALUES (?, ?, ?, ?)",
            )
            .bind(imported_relation_id(&a.id, &item.id))
            .bind(&a.id)
            .bind(&item.date)
            .bind(&item.action)
            .execute(&mut **tx)
            .await
            .map_err(database_failure)?;
        }
        result.imported += 1;
    }
    Ok(result)
}

pub async fn import_articles_pool(
    pool: &Pool<Sqlite>,
    request: ImportArticlesRequest,
) -> Result<ImportArticlesResponse, CanonicalError> {
    validate_request(&request)?;
    let mut tx = pool.begin().await.map_err(database_failure)?;
    match import_in_transaction(&mut tx, &request).await {
        Ok(result) => {
            tx.commit().await.map_err(database_failure)?;
            Ok(result)
        }
        Err(error) => {
            tx.rollback().await.map_err(database_failure)?;
            Err(error)
        }
    }
}

#[tauri::command]
pub async fn import_articles(
    instances: State<'_, DbInstances>,
    request: ImportArticlesRequest,
) -> Result<ImportArticlesResponse, CanonicalError> {
    let pool = get_pool(&instances).await?;
    import_articles_pool(&pool, request).await
}
