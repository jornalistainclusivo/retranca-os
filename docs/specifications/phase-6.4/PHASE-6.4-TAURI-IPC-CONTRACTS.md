---
jinc-spec-version: 1.1.0
project-name: Retranca OS
status: approved
related-branch: docs/phase-6.4-product-access-monetization
tech-stack: Tauri, Rust, TypeScript
created-at: 2026-09-15
last-updated: 2026-10-01
authors: Retranca OS Core Team
---

# Phase 6.4 Tauri IPC Contracts

> **2026-09-30 amendment — open single edition:** [ADR-013](../../decisions/ADR-013-OPEN-SINGLE-EDITION.md) supersedes the commercial Free/PRO access policy and ADR-011/012. All implemented customization and editorial capabilities are open to everyone, without account, subscription, activation, entitlement verification, or developer premium. Native domain validation, data preservation, and Rust AI evidence/runtime requirements remain mandatory. Older commercial clauses below are historical and MUST NOT drive current implementation or acceptance.


**PHASE 6.4 — TECHNICAL SPECIFICATION — RE-APPROVED BY HUMAN SPEC GATE**

SPEC APPROVAL DOES NOT BY ITSELF AUTHORIZE IMPLEMENTATION.
IMPLEMENTATION REQUIRES THE SEPARATE HUMAN IMPLEMENTATION PLAN GATE.

This document specifies the Tauri IPC boundaries for Phase 6.4.

### Article CMS content migration amendment — ADR-014, 2026-10-01

- **Command:** `migrate_article_content`, registered in debug and release. No arguments or client-supplied paths. Success: `{ "success": true }`. Schema/backup/transaction errors: the canonical envelope with `code: "ERR_MIGRATION_FAILED"`, `retryable: false`, and diagnostic details. Managed-pool acquisition retains its existing database-error envelope.
- **Access:** Open, with native schema validation. Called after the existing workflow migration and before returning the initialized Drizzle client. Applying it to the owner's database still requires the separately requested human migration confirmation.
- **Version 1:** Require the content column to be absent. Resolve the main database path from the managed connection, create a unique `VACUUM INTO` backup beside it, then add `articles.analysisContent TEXT NOT NULL DEFAULT ''` and set `user_version = 2` in one SQLx transaction. No schema change if the backup fails; transaction failure rolls back.
- **Version 2:** Require the expected TEXT/non-null/empty-default column and succeed without another backup or rewrite. Partial schemas, unsupported versions and an unresolvable backup path fail closed. Serialize simultaneous native calls; frontend initialization also shares one promise.
- Native workflow commands accept compatible versions 1 and 2; they continue rejecting future unknown versions. The article's existing metadata save carries `analysisContent`; this is not a new inference command or binary-file contract. Saved content remains untrusted evidence under ADR-008.

Decision, recovery rules and executed checks: [ADR-014](../../decisions/ADR-014-ARTICLE-CMS-CONTENT-PERSISTENCE.md) and [article content validation](../../testing/PHASE-6.4-ARTICLE-CONTENT-VALIDATION.md). Historical schema-1-only statements below are amended by this compatible extension.

### Slice 8 local AI cancellation amendment — 2026-10-01

- **Command:** `cancel_ollama_inference` (debug and release), arguments `{ jobId: string }`, response `void` on success. This is runtime cancellation, not domain mutation or entitlement authorization. AI runtime commands retain their existing string-error convention; the canonical domain envelope below applies to domain operations.
- Cancel signals the registered task and awaits request/response teardown. Unknown/completed IDs succeed as idempotent no-ops. Concurrent active reuse of a job ID is rejected when starting a task.
- The worker emits exactly one terminal event: `ai-stream-done { job_id }`, `ai-stream-canceled { job_id }`, or `ai-stream-error { job_id, message }`. No additional tokens are emitted after cancellation acknowledgement. Completion may win a cancellation race; do not infer a canceled terminal event for an already completed job.
- The UI waits for the start acknowledgement before cancel IPC, captures the original session provider, ignores obsolete events and disposes subscriptions on close/unmount. Preparation canceled before native dispatch must not later start a request.
- HTTP teardown does not guarantee stopping server/GPU computation. `cancel_inference` remains the separate sidecar command. Raw `start_ollama_inference` and `start_inference` remain debug-only; release starts require `start_orchestrated_inference` and unchanged native evidence validation.

Evidence and remaining desktop acceptance: [Slice 8 cancellation/focus validation](../../testing/PHASE-6.4-SLICE-8-CANCELLATION-FOCUS-VALIDATION.md).

## 1. IPC Access and Native Validation (ADR-013)

- **Access: Open** (Ordinary Editorial and Configuration Mutation): All reads, article operations, and structural mutations are available without entitlement state, account, subscription, or activation. Direct IPC invocations undergo the same native schema/domain validation and transactions as UI invocations.
- The former Free/Protected commercial classes are retired. `get_entitlements` and `set_developer_premium` are removed. Existing domain request/response shapes remain unchanged; protected command wrappers no longer require managed entitlement state.

## 2. Canonical IPC Error Envelope

All IPC commands MUST return semantic failures through this exact canonical error envelope:
```json
{
  "code": "ERR_...",
  "retryable": false,
  "details": {}
}
```

## 3. READ / ORDINARY EDITORIAL (Access: Open)

### 3.1 Read Workflow
- **Command:** `get_workflow_stages`
- **Access:** Open
- **Idempotency:** Yes (Read-only)
- **Transaction:** Read
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
      "lifecycle_role": null,
      "is_active": true
    }
  ]
}
```
- **Error Response:** `{ "code": "ERR_DATABASE_FAILURE", "retryable": true, "details": {} }`

### 3.2 Read Categories
- **Command:** `get_categories`
- **Access:** Open
- **Idempotency:** Yes (Read-only)
- **Transaction:** Read
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
- **Error Response:** `{ "code": "ERR_DATABASE_FAILURE", "retryable": true, "details": {} }`

### 3.3 Read Templates
- **Command:** `get_checklist_templates`
- **Access:** Open
- **Idempotency:** Yes (Read-only)
- **Transaction:** Read
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
- **Error Response:** `{ "code": "ERR_DATABASE_FAILURE", "retryable": true, "details": {} }`

### 3.4 Move Article to Stage
- **Command:** `assign_article_stage`
- **Access:** Open
- **Idempotency:** Yes (Repeated calls for the same article/stage are a no-op).
- **Transaction:** Atomic update.
  - **Case A (source is NOT publication role, target IS publication role):** set `workflow_stage_id`; set `completedAt` = now; set `updatedAt` = now; append transition history; preserve `publishDate`.
  - **Case B (source IS publication role, target is NOT):** set `workflow_stage_id`; preserve `completedAt`; set `updatedAt` = now; append transition history; preserve `publishDate`.
  - **Case C (source == target):** No-op (no completedAt rewrite, no updatedAt rewrite caused by assignment, no duplicate history, no publication-entry effect).
  - `semantic_classification` MUST NOT participate in this lifecycle decision.
- **Request:**
```json
{
  "article_id": "abc-123",
  "workflow_stage_id": "550e8400-e29b-41d4-a716-446655440000"
}
```
- **Success Response:** `{ "success": true }`
- **Error Response:** `{ "code": "ERR_UNRESOLVED_STAGE_REFERENCE", "retryable": false, "details": {} }`

### 3.5 Assign Existing Category
- **Command:** `assign_article_category`
- **Access:** Open
- **Idempotency:** Yes (Repeated calls are a no-op).
- **Transaction:** Atomic update.
- **Request:**
```json
{
  "article_id": "abc-123",
  "category_id": "123e4567-e89b-12d3-a456-426614174000"
}
```
- **Success Response:** `{ "success": true }`
- **Error Response:** `{ "code": "ERR_UNRESOLVED_CATEGORY_REFERENCE", "retryable": false, "details": {} }`

### 3.6 Apply Existing Checklist Template
- **Command:** `apply_checklist_template`
- **Access:** Open
- **Idempotency:** No (Appends items. Repeated calls create duplicate copies).
- **Transaction:** Atomic insertion of multiple item records.
- **Request:**
```json
{
  "article_id": "abc-123",
  "template_id": "999e4567-e89b-12d3-a456-426614174000"
}
```
- **Success Response:** `{ "success": true }`
- **Error Response:** `{ "code": "ERR_INVALID_CHECKLIST_TEMPLATE", "retryable": false, "details": {} }`

---

## 4. CONFIGURATION MUTATIONS (Access: Open)

*All commands below execute within a single SQLite transaction and MUST return `ERR_CONFIRMED_FREE_PRO_MUTATION_DENIED`, `ERR_ENTITLEMENT_STATE_UNKNOWN`, or `ERR_ENTITLEMENT_UNAVAILABLE` if authorization fails.*

**Mutation Boundary Separation:**
- `update_workflow_stage`: rename / approved semantic-classification mutation
- `reorder_workflow_stages`: ordering only
- `remove_workflow_stage`: safe removal and, when applicable, atomic PUBLICATION role transfer

### 4.1 Create Stage
- **Command:** `create_workflow_stage`
- **Access:** Open
- **Idempotency:** No (Duplicate request returns `ERR_INVALID_WORKFLOW` due to normalized name collision).
- **Transaction:** Atomic insert.
- **Request:**
```json
{
  "display_name": "Fact Checking",
  "order_index": 2,
  "semantic_classification": "REVIEW"
}
```
*Note: `create_workflow_stage` does not accept `lifecycle_role`; new stage receives `lifecycle_role = null`; client cannot assign `PUBLICATION` through create.*
- **Semantic validation:** Only the five approved vocabulary values or an unclassified value (null/empty) are accepted. Invalid semantic vocabulary returns `ERR_INVALID_SEMANTIC_CLASSIFICATION`, with `retryable: false`, before any stage insertion or order change. Other invalid workflow inputs retain `ERR_INVALID_WORKFLOW`.
- **Success Response:** Returns created `WorkflowStage` object.
- **Error Response:** `{ "code": "ERR_INVALID_WORKFLOW", "retryable": false, "details": {} }`

### 4.2 Rename/Update Stage
- **Command:** `update_workflow_stage`
- **Access:** Open
- **Idempotency:** Yes (Subsequent updates with identical data are no-ops).
- **Transaction:** Atomic update.
- **Request:**
```json
{
  "id": "...",
  "display_name": "New Name",
  "semantic_classification": null
}
```
*Note: `update_workflow_stage` DOES NOT accept or mutate `lifecycle_role`. It may update only its approved editable fields. Renaming or changing semantic classification never changes lifecycle role. Publication role movement occurs only through the approved safe-removal transfer contract in Phase 6.4.*

For partial updates, an omitted `semantic_classification` preserves the current classification; an explicit JSON `null` clears it. A vocabulary value replaces it. All three cases preserve `lifecycle_role`.
- Invalid semantic vocabulary returns `ERR_INVALID_SEMANTIC_CLASSIFICATION`, with `retryable: false`; an unknown stage ID returns `ERR_INVALID_WORKFLOW`. Neither failure may alter stored stages.
- **Success Response:** `{ "success": true }`
- **Error Response:** `{ "code": "ERR_INVALID_WORKFLOW", "retryable": false, "details": {} }`

### 4.3 Reorder Stages
- **Command:** `reorder_workflow_stages`
- **Access:** Open
- **Idempotency:** Yes
- **Transaction:** Atomic normalization (multiple updates within one transaction).
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
- **Error Response:** `{ "code": "ERR_INVALID_WORKFLOW", "retryable": false, "details": {} }`

### 4.4 Safely Remove Stage
- **Command:** `remove_workflow_stage`
- **Access:** Open
- **Idempotency:** Yes (If already inactive/missing, returns success without DB mutation).
- **Transaction:** When source owns PUBLICATION, `reassign_to_stage_id` is mandatory even if source has zero articles. Validate in the SAME transaction: target exists; target is active; target != source. Then atomically: 1. authorize protected mutation; 2. re-check source references; 3. reassign source articles to target if any; 4. preserve `completedAt` for those articles; 5. clear `PUBLICATION` from source; 6. assign `PUBLICATION` to target; 7. deactivate source; 8. normalize ordering; 9. verify exactly one ACTIVE PUBLICATION role; 10. commit. Any failure: ROLLBACK ALL. There is NO automatic fallback.
- **Request:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "reassign_to_stage_id": "id-to-move-orphaned-articles-to"
}
```
- **Success Response:** `{ "success": true }`
- **Error Response:** `{ "code": "ERR_UNRESOLVED_STAGE_REFERENCE", "retryable": false, "details": {} }` (or `ERR_LAST_STAGE_REMOVAL`, `ERR_PUBLICATION_ROLE_INVARIANT`)

### 4.5 Create Custom Category
- **Command:** `create_category`
- **Access:** Open
- **Idempotency:** No (Duplicate returns `ERR_INVALID_CATEGORY`).
- **Transaction:** Atomic insert.
- **Request:**
```json
{
  "name": "Custom SEO"
}
```
- **Success Response:** Returns created `Category`.
- **Error Response:** `{ "code": "ERR_INVALID_CATEGORY", "retryable": false, "details": {} }`

### 4.6 Rename Custom Category
- **Command:** `rename_category`
- **Access:** Open
- **Idempotency:** Yes
- **Transaction:** Atomic update.
- **Request:**
```json
{
  "id": "custom-cat-id",
  "name": "New Name"
}
```
- **Success Response:** `{ "success": true }`
- **Error Response:** `{ "code": "ERR_INVALID_CATEGORY", "retryable": false, "details": {} }`

### 4.7 Safely Remove Custom Category
- **Command:** `remove_category`
- **Access:** Open
- **Idempotency:** Yes (If already inactive/missing, returns success).
- **Transaction:** Atomic reassignment exactly as stage removal. Explicit target required.
- **Request:**
```json
{
  "id": "custom-cat-id",
  "reassign_to_category_id": "id-to-move-orphans-to"
}
```
- **Success Response:** `{ "success": true }`
- **Error Response:** `{ "code": "ERR_UNRESOLVED_CATEGORY_REFERENCE", "retryable": false, "details": {} }` (or `ERR_INVALID_CATEGORY` for standards)

### 4.8 Create Checklist Template
- **Command:** `create_checklist_template`
- **Access:** Open
- **Idempotency:** No (Duplicate returns `ERR_INVALID_CHECKLIST_TEMPLATE` for uniqueness failure).
- **Transaction:** Atomic insert.
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
- **Error Response:** `{ "code": "ERR_INVALID_CHECKLIST_TEMPLATE", "retryable": false, "details": {} }`

### 4.9 Update/Reorder Template
- **Command:** `update_checklist_template`
- **Access:** Open
- **Idempotency:** Yes
- **Transaction:** Atomic update of template contents (supports rename and item mutations).
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
- **Error Response:** `{ "code": "ERR_INVALID_CHECKLIST_TEMPLATE", "retryable": false, "details": {} }`

### 4.10 Delete Template
- **Command:** `delete_checklist_template`
- **Access:** Open
- **Idempotency:** Yes (If missing, returns success).
- **Transaction:** Atomic delete.
- **Request:**
```json
{
  "id": "template-id"
}
```
- **Success Response:** `{ "success": true }`
- **Error Response:** `{ "code": "ERR_INVALID_CHECKLIST_TEMPLATE", "retryable": false, "details": {} }`
