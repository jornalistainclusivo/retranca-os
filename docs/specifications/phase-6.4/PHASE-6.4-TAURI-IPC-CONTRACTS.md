---
jinc-spec-version: 1.0.1
project-name: Retranca OS
status: draft
related-branch: docs/phase-6.4-product-access-monetization
tech-stack: Tauri, Rust, TypeScript
created-at: 2026-09-15
last-updated: 2026-09-15
authors: Retranca OS Core Team
---

# Phase 6.4 Tauri IPC Contracts

**PHASE 6.4 — TECHNICAL SPECIFICATION — DRAFT FOR HUMAN REVIEW**
No implementation authorization is implied.

This document specifies the Tauri IPC boundaries for Phase 6.4.

## 1. IPC Security and Authorization Classes

- **Free / Ordinary Editorial (Class F):** Read configuration or perform standard editorial operations on articles. ALWAYS permitted.
- **Protected Configuration Mutation (Class P):** Modifies structural configuration (Stages, Categories, Templates). MUST pass the Native `EntitlementDecisionProvider` check before execution. Direct IPC invocations undergo identical native authorization checks.

All mutation commands execute within a single SQLite transaction (Transactional Expectation: Atomic).

## 2. READ / ORDINARY EDITORIAL (Class F)

### 2.1 Read Workflow
- **Command:** `get_workflow_stages`
- **Auth Class:** Free
- **Idempotency:** Yes (Read-only)
- **Request:** `{}`
- **Success Response:**
```json
{
  "stages": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "display_name": "Idea",
      "order_index": 0,
      "semantic_classification": "IDEA",
      "is_active": true
    }
  ]
}
```
- **Error Response:** General failure (SQLite execution).

### 2.2 Read Categories
- **Command:** `get_categories`
- **Auth Class:** Free
- **Idempotency:** Yes (Read-only)
- **Request:** `{}`
- **Success Response:**
```json
{
  "categories": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "IA",
      "origin": "standard",
      "is_active": true
    }
  ]
}
```
- **Error Response:** General failure.

### 2.3 Read Templates
- **Command:** `get_checklist_templates`
- **Auth Class:** Free
- **Idempotency:** Yes (Read-only)
- **Request:** `{}`
- **Success Response:**
```json
{
  "templates": [
    {
      "id": "999e4567-e89b-12d3-a456-426614174000",
      "name": "SEO Baseline",
      "items": [
        { "label": "Check keywords" }
      ]
    }
  ]
}
```
*Note: The `items` array is structured JSON over IPC, not a raw string.*

### 2.4 Move Article to Stage
- **Command:** `assign_article_stage`
- **Auth Class:** Free
- **Idempotency:** Yes (Repeated calls for the same article/stage are a no-op).
- **Request:**
```json
{
  "article_id": "abc-123",
  "workflow_stage_id": "550e8400-e29b-41d4-a716-446655440000"
}
```
- **Success Response:** `{ "success": true }`
- **Error Response:** `ERR_UNRESOLVED_STAGE_REFERENCE`

### 2.5 Assign Existing Category
- **Command:** `assign_article_category`
- **Auth Class:** Free
- **Idempotency:** Yes (Repeated calls are a no-op).
- **Request:**
```json
{
  "article_id": "abc-123",
  "category_id": "123e4567-e89b-12d3-a456-426614174000"
}
```
- **Success Response:** `{ "success": true }`
- **Error Response:** `ERR_UNRESOLVED_CATEGORY_REFERENCE`

### 2.6 Apply Existing Checklist Template
- **Command:** `apply_checklist_template`
- **Auth Class:** Free
- **Idempotency:** No (Appends items. Repeated calls create duplicate copies).
- **Request:**
```json
{
  "article_id": "abc-123",
  "template_id": "999e4567-e89b-12d3-a456-426614174000"
}
```
- **Success Response:** `{ "success": true }`
- **Error Response:** `ERR_MALFORMED_CHECKLIST_TEMPLATE`

---

## 3. PROTECTED CONFIGURATION MUTATIONS (Class P)

*All commands below return `ERR_CONFIRMED_FREE_PRO_MUTATION_DENIED`, `ERR_ENTITLEMENT_STATE_UNKNOWN`, or `ERR_ENTITLEMENT_UNAVAILABLE` if authorization fails.*

### 3.1 Create Stage
- **Command:** `create_workflow_stage`
- **Idempotency:** No (Duplicate request returns `ERR_INVALID_WORKFLOW` due to normalized name collision).
- **Request:**
```json
{
  "display_name": "Fact Checking",
  "order_index": 2,
  "semantic_classification": "REVIEW"
}
```
- **Success Response:** Returns created `WorkflowStage` object.
- **Error Response:** `ERR_INVALID_WORKFLOW`

### 3.2 Rename/Update Stage
- **Command:** `update_workflow_stage`
- **Idempotency:** Yes (Subsequent updates with identical data are no-ops).
- **Request:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "display_name": "New Name",
  "semantic_classification": null
}
```
- **Success Response:** `{ "success": true }`
- **Error Response:** `ERR_INVALID_WORKFLOW`

### 3.3 Reorder Stages
- **Command:** `reorder_workflow_stages`
- **Idempotency:** Yes
- **Transaction:** Atomic normalization.
- **Request:**
```json
{
  "stage_orders": [
    { "id": "id-1", "order_index": 0 },
    { "id": "id-2", "order_index": 1 }
  ]
}
```
- **Success Response:** `{ "success": true }`
- **Error Response:** `ERR_INVALID_WORKFLOW`

### 3.4 Safely Remove Stage
- **Command:** `remove_workflow_stage`
- **Idempotency:** Yes (If already inactive/missing, returns success without DB mutation).
- **Transaction:** Re-checks references in same transaction. Moves affected articles atomically to `reassign_to_stage_id`, then deactivates source. Rollback on failure.
- **Request:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "reassign_to_stage_id": "id-to-move-orphaned-articles-to"
}
```
- **Success Response:** `{ "success": true }`
- **Error Response:** `ERR_LAST_STAGE_REMOVAL`, `ERR_UNRESOLVED_STAGE_REFERENCE`

### 3.5 Create Custom Category
- **Command:** `create_category`
- **Idempotency:** No (Duplicate returns `ERR_INVALID_CATEGORY`).
- **Request:**
```json
{
  "name": "Custom SEO"
}
```
- **Success Response:** Returns created `Category`.
- **Error Response:** `ERR_INVALID_CATEGORY`

### 3.6 Rename Custom Category
- **Command:** `rename_category`
- **Idempotency:** Yes
- **Request:**
```json
{
  "id": "custom-cat-id",
  "name": "New Name"
}
```
- **Success Response:** `{ "success": true }`
- **Error Response:** `ERR_INVALID_CATEGORY`

### 3.7 Safely Remove Custom Category
- **Command:** `remove_category`
- **Idempotency:** Yes (If already inactive/missing, returns success).
- **Transaction:** Atomic reassignment exactly as stage removal.
- **Request:**
```json
{
  "id": "custom-cat-id",
  "reassign_to_category_id": "id-to-move-orphans-to"
}
```
- **Success Response:** `{ "success": true }`
- **Error Response:** `ERR_INVALID_CATEGORY`, `ERR_UNRESOLVED_CATEGORY_REFERENCE`

### 3.8 Create Checklist Template
- **Command:** `create_checklist_template`
- **Idempotency:** No (Duplicate returns `ERR_MALFORMED_CHECKLIST_TEMPLATE` or similar uniqueness error).
- **Request:**
```json
{
  "name": "Standard Polish",
  "items": [
    { "label": "Grammar" }
  ]
}
```
- **Success Response:** Returns created `ChecklistTemplate`.
- **Error Response:** `ERR_MALFORMED_CHECKLIST_TEMPLATE`

### 3.9 Update/Reorder Template
- **Command:** `update_checklist_template`
- **Idempotency:** Yes
- **Request:**
```json
{
  "id": "template-id",
  "name": "New Name",
  "items": [
    { "label": "New Item" }
  ]
}
```
- **Success Response:** `{ "success": true }`
- **Error Response:** `ERR_MALFORMED_CHECKLIST_TEMPLATE`

### 3.10 Delete Template
- **Command:** `delete_checklist_template`
- **Idempotency:** Yes (If missing, returns success).
- **Request:**
```json
{
  "id": "template-id"
}
```
- **Success Response:** `{ "success": true }`
- **Error Response:** `ERR_MALFORMED_CHECKLIST_TEMPLATE`
