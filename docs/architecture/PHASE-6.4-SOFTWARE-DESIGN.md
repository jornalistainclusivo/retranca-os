# Software Design Document: Phase 6.4 - PRO Workflow Customization

## 1. Status
PHASE 6.4 — SOFTWARE DESIGN — DRAFT FOR HUMAN REVIEW

## 2. Introduction and Context
This SDD details the software architecture for Phase 6.4 PRO Workflow Customization. Based on the Phase 6.4 PRD and the architectural decisions defined in ADR-008, ADR-009, ADR-010, and ADR-011, this document specifies the implementation of customizable workflow stages, custom categories, and reusable checklist templates while adhering to local-first principles.

It explicitly maintains the existing Retranca OS stack: React/TypeScript (Frontend), Tauri/Rust (Backend IPC Gateway), and local SQLite persistence. No cloud dependencies, generic authentication providers, or external databases are introduced.

## 3. Current State Architecture & Impacted Modules
The current Retranca OS architecture represents `ArticleStatus` and `CategoryTag` as closed enums in both TypeScript (`types/editorial.ts`) and Rust. Article checklists are currently flat article-level structures.

**Impacted Modules:**
- **Persistence (SQLite):** New tables for `workflow_stages`, `categories`, `checklist_templates`, and `checklist_template_items`. Schema modifications to `articles`.
- **Backend (Rust):** New DTOs and IPC handlers for managing PRO entities. Updates to `EditorialContext` generation and the AI orchestrator's evidence validation.
- **Frontend (TypeScript):** UI/UX for workflow and category management. Updates to Kanban, List, and Stats views to consume dynamic entities. Updates to AI recommendation logic.
- **Entitlement Boundary:** New Rust-side entitlement verification and enforcement layer (Tauri native boundary) to gate PRO mutations.

## 4. Dynamic Workflow-Stage Domain Model
Following ADR-009, workflow stages are modeled as dynamic entities with stable identities and optional semantic classifications.

**Model:**
- `id` (UUID): Stable stage identity. Survives rename and reorder.
- `display_name` (String): The user-facing name.
- `order_index` (Integer): Determines left-to-right Kanban ordering and sequential flow.
- `semantic_classification` (Enum, Optional): E.g., `IDEA`, `DRAFTING`, `REVIEW`, `PUBLISHED`. Used exclusively for Phase 6.3 AI recommendation logic.
- `is_active` (Boolean): Supports safe removal.

**Business Rules:**
- **Minimum one stage:** The system rejects any operation resulting in zero active stages.
- **Safe stage removal:** A stage cannot be hard-deleted or deactivated if it contains active articles. The frontend must prompt for article reassignment.

## 5. Free Standard Workflow Bootstrap & Backwards Compatibility
To preserve the Free default experience, the database will be seeded with the standard 5-stage workflow upon initialization.

**Bootstrap Data:**
1. Ideia (semantic: `IDEA`)
2. Pesquisa (semantic: `RESEARCH`)
3. Escrita (semantic: `DRAFTING`)
4. Revisão (semantic: `REVIEW`)
5. Publicado (semantic: `PUBLISHED`)

These bootstrap stages are treated identically to custom stages (they have UUIDs) but serve as the immutable Free baseline.

## 6. Persistence Design (SQLite)
Following ADR-010, the persistence strategy employs a hybrid approach: relational models for categories and workflow stages, and document-style persistence for checklist templates.

### 6.1 Workflow Stages
```sql
CREATE TABLE workflow_stages (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL UNIQUE,
    order_index INTEGER NOT NULL,
    semantic_classification TEXT, -- Optional
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 6.2 Relational Custom Categories
```sql
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 6.3 Checklist Templates (Hybrid Document-Style)
```sql
CREATE TABLE checklist_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    items_json TEXT NOT NULL, -- Document-style ordered array of template items
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
*Note: `items_json` stores a serialized array of `{ "id": "uuid", "text": "...", "order": int }`. Applying a template creates independent instances in the `articles` table or related `article_checklists` table.*

## 7. Migration Strategy
**Goal:** Safely migrate existing fixed strings to the new dynamic entity references.

**Process:**
1. **Seed:** Insert standard `workflow_stages` and fixed `categories` into the new tables.
2. **Map `ArticleStatus`:** Update the `articles` table. Add `workflow_stage_id`. Map existing `status` strings (e.g., 'Ideia') to the seeded workflow stage UUIDs.
3. **Map `CategoryTag`:** Add `category_id` to `articles`. Map existing `category_tag` strings to seeded category UUIDs.
4. **Cleanup:** Drop legacy `status` and `category_tag` string columns.

**Safety:**
- Wrapped in a single SQLite transaction.
- Deterministic mapping.
- Rollback on failure.
- No articles orphaned. Free defaults are preserved.

## 8. TypeScript Domain Changes
- Evolve `ArticleStatus` and `CategoryTag` from fixed enums to dynamic entity interfaces (`WorkflowStage`, `Category`).
- Update Kanban state management to group by dynamic `workflow_stages` sorted by `order_index`.
- Implement UI views for PRO Settings (Manage Stages, Categories, Checklists).

## 9. Rust Domain / DTO Changes
- `src-tauri/src/models.rs`: Define `WorkflowStage`, `Category`, `ChecklistTemplate` structs.
- Define IPC Command payloads: `CreateStageRequest`, `UpdateStageRequest`, etc.

## 10. Tauri IPC Contracts (Protected vs Unprotected)

**Unprotected (Read/Free operations):**
- `get_workflow_stages`
- `get_categories`
- `get_checklist_templates`
- `update_article_stage` (Moving an article is Free editorial work)

**Protected (PRO Mutations - Enforced by Tauri):**
- `create_workflow_stage`
- `update_workflow_stage`
- `delete_workflow_stage`
- `create_category`, `update_category`, `delete_category`
- `create_checklist_template`, `update_checklist_template`, `delete_checklist_template`

## 11. Phase 6.3 AI Compatibility
**Invariant:** *status recommends; validated evidence determines action availability.*

- **TypeScript Recommendation (UX):** The UI evaluates the optional `semantic_classification` of the current custom stage. If a stage has `semantic_classification: IDEA`, the UI highlights the "Pesquisa de Lacunas" button as RECOMMENDED. If the custom stage lacks a classification, no specific recommendation is made, but actions fall back to AVAILABLE if evidence permits.
- **Rust Evidence Validation:** The Tauri backend completely ignores the stage's `display_name` and `semantic_classification` for authorization. It strictly evaluates the `EditorialContext` payload for required evidence (e.g., presence of `title`, `content`).
- **Result:** No 1:1 mapping between custom stage and AI action. Phase 6.3 trust boundary (ADR-008) is preserved.

## 12. Lifecycle Semantics
### 12.1 Category Lifecycle
- **Create:** Validated for uniqueness.
- **Rename:** Centralized rename updates the `categories` record. Article references (UUID) remain stable.
- **Delete:** Blocked if any active article references the category (Safe Resolution required).
- **Downgrade:** Preserved. Existing articles maintain their category. New categories blocked.

### 12.2 Checklist-Template Lifecycle
- **Create/Edit/Reorder:** Modifies the `items_json` document.
- **Apply:** Copies the JSON array into the specific article's independent checklist state.
- **Delete:** Safe. Deleting the template does not alter the independent checklist instances previously copied to articles.

## 13. PRO Authorization Boundary & Entitlement Model (ADR-011)
**Enforcement Boundary:**
Frontend UI state is for presentation/discoverability only. Protected PRO configuration mutations are intercepted and authorized at the Tauri/native application boundary.

**Internal Application-State Model:**
The Rust backend will implement a mechanism-neutral state machine:
1. `Free` (Confirmed no PRO)
2. `ProActive` (PRO active and verified)
3. `ProTemporarilyUnverifiable` (Previously valid PRO, current verification failed/offline)

**Abstractions (Adapter Boundary):**
```rust
trait EntitlementVerifier {
    fn check_entitlement(&self) -> EntitlementState;
}
```
*Note: The exact commercial issuance mechanism, licensing provider, authentication, token format, and secure storage mechanism are EXPLICITLY DEFERRED. If production issuance cannot be implemented, a stub or placeholder will be utilized pending provider selection.*

## 14. Protected-Mutation Authorization Matrix

| PRO Configuration Mutation | Frontend UX | Native Auth Requirement | Free Behavior | PRO-Active | Temporarily Unverifiable | Downgrade / Data Preservation |
| --- | --- | --- | --- | --- | --- | --- |
| Rename Stage | Visible lock | Required | Denied | Allowed | Allowed | Preserved, mutation denied |
| Add Stage | Visible lock | Required | Denied | Allowed | Allowed | Preserved, mutation denied |
| Remove Stage | Visible lock | Required | Denied | Allowed | Allowed | Preserved, mutation denied |
| Reorder Stages | Visible lock | Required | Denied | Allowed | Allowed | Preserved, mutation denied |
| Create/Edit Category | Visible lock | Required | Denied | Allowed | Allowed | Preserved, mutation denied |
| Create/Edit Template | Visible lock | Required | Denied | Allowed | Allowed | Preserved, mutation denied |

**Data-Read Behavior After Downgrade:**
Editorial content, custom categories, and templates remain safely readable, recoverable, and functional for existing articles. No destructive remapping occurs.

## 15. Security Design (Threat Model Alignment)
- **Frontend Spoofing & Direct IPC:** Defeated by native authorization checks in the Tauri IPC handlers for all protected mutations.
- **Rollback / Stale State / Offline:** Handled via the `ProTemporarilyUnverifiable` state, honoring the local-first product rule without blindly granting permanent offline PRO status.
- **Local DB Manipulation & Local-Admin Risk:** Acknowledged residual risk. The application boundary cannot prevent a privileged local admin from patching the SQLite DB directly. We do not claim tamper-proof security.
- **Developer Override:** `DEVELOPER_PREMIUM` remains strictly a debug artifact and will not be repurposed as the production adapter.
- **Destructive Downgrade:** Prevented by the schema design (stable UUID references) and read-only enforcement during the `Free` state.

## 16. Accessibility (A11Y) Design
- **Keyboard Operation:** All customization settings (adding, renaming, deleting) must be fully navigable via keyboard (`Tab`, `Enter`, `Space`).
- **Focus Management:** Focus must be trapped within confirmation modals (e.g., stage deletion) and restored appropriately.
- **Ordering:** Reordering stages/checklists must provide keyboard-accessible alternatives (e.g., Up/Down arrow buttons) alongside pointer/drag-and-drop.
- **Screen Reader Semantics:** Use `aria-live` for success/error feedback on mutations.
*Note: We do not claim formal WCAG certification.*

## 17. Error Taxonomy
Stable design-level IPC errors:
- `Err_WorkflowInvalid`: Attempted to save a workflow violating rules.
- `Err_LastStageRemoval`: Attempted to remove the last active stage.
- `Err_StageInUse`: Attempted to delete a stage containing active articles.
- `Err_CategoryInUse`: Attempted to delete a referenced category.
- `Err_MalformedChecklistTemplate`: Template JSON validation failed.
- `Err_UnauthorizedProMutation`: Tauri rejected a PRO mutation (User is Free).
- `Err_MigrationFailed`: SQLite migration transaction aborted.

## 18. Testing Strategy
- **Rust Unit Tests:** Validation of dynamic workflow constraints (minimum one stage), evidence validation (Phase 6.3 AI), and entitlement state transitions.
- **TypeScript Unit Tests:** AI recommendation UX logic based on optional semantic classification.
- **IPC Integration Tests:** Verify direct IPC calls to protected mutations are rejected when in `Free` state.
- **SQLite Migration Tests:** Verify data integrity when migrating fixed strings to seeded UUIDs.
- **Downgrade Preservation Tests:** Ensure editorial data remains intact and functional after a simulated downgrade.
- **Temporary Unverifiability Tests:** Ensure existing configuration editing is allowed when offline.
- **Release-build Security Tests:** Ensure `DEVELOPER_PREMIUM` does not leak into production.

## 19. Rollout / Migration Safety
- SQLite migrations must be transactional.
- A pre-migration backup of the local SQLite file should be created in the application data directory to ensure rollback safety in case of catastrophic migration failure on client machines.

## 20. Explicit Deferred Decisions
- Exact selection of commercial licensing, payment, and authentication providers.
- Cryptographic signature format, license-key structure, or entitlement proof format.
- Duration limits for the "temporarily unverifiable" offline state.
- Secure credential storage mechanisms.
- Machine/install binding rules.

## 21. SDD-to-Spec Handoff
For the subsequent `spec-creator` phase, the following must be converted into strict specifications:
- Exact SQLite schema tables and Drizzle ORM definitions.
- Exact Rust Structs and IPC DTO JSON schemas.
- The precise state machine logic for `EntitlementVerifier`.
- The UX specification for article reassignment during stage deletion.

---
🔴 **SDD BLOCKER:** None. All architectural constraints and product requirements are successfully reconciled within the local-first Tauri/React/SQLite boundary.
