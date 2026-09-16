---
jinc-spec-version: 1.0.1
project-name: Retranca OS
status: draft
related-branch: docs/phase-6.4-product-access-monetization
tech-stack: SQLite, React, TypeScript, Tauri, Rust
created-at: 2026-09-15
last-updated: 2026-09-15
authors: Retranca OS Core Team
---

# Phase 6.4 Technical Specification

**PHASE 6.4 — TECHNICAL SPECIFICATION — DRAFT FOR HUMAN REVIEW**
No implementation authorization is implied.

## 1. Requirement Coverage Matrix

| Requirement | Description (PRD Exact) | Specified In |
| --- | --- | --- |
| **FR-WF-001** | rename an existing workflow stage | BR-WF-001, BR-WF-002, IPC: update_workflow_stage, Test: TEST-WF-002 |
| **FR-WF-002** | add a new workflow stage | BR-WF-001, IPC: create_workflow_stage, Test: TEST-WF-001 |
| **FR-WF-003** | remove a workflow stage with safe resolution | BR-WF-005, BR-WF-006, IPC: remove_workflow_stage, Test: TEST-WF-004, TEST-WF-006 |
| **FR-WF-004** | reorder workflow stages | BR-WF-004, IPC: reorder_workflow_stages, Test: TEST-WF-003 |
| **FR-WF-MIN-001** | reject zero active stages | BR-WF-007, IPC: remove_workflow_stage, Test: TEST-WF-005 |
| **FR-CAT-001** | create / rename / safely delete custom categories | BR-CAT-001, BR-CAT-002, IPC: create_category, rename_category, remove_category, Test: TEST-CAT-001, TEST-CAT-002 |
| **FR-CHK-001** | create / rename / apply custom checklist templates | BR-CHK-001, BR-CHK-002, IPC: create_checklist_template, rename_checklist_template, apply_checklist_template, Test: TEST-CHK-001, TEST-CHK-002 |
| **FR-CHK-002** | add / edit / remove / reorder items within a checklist template | BR-CHK-001, IPC: update_checklist_template, Test: TEST-CHK-003 |
| **FR-AI-001** | preserve evidence-based AI action availability independent of custom stage display name | BR-AI-001, BR-AI-003, BR-AI-004, Test: TEST-AI-001, TEST-AI-002 |
| **FR-DOWN-001** | retain user data, articles and custom configuration safely after entitlement is no longer active | BR-DOWN-001, BR-DOWN-002, Test: TEST-DOWN-001 |
| **FR-DOWN-002** | block NEW PRO configuration changes while Free | BR-DOWN-003, IPC Auth, Test: TEST-DOWN-002 |
| **FR-ENT-001** | allow continued usage/editing of existing PRO configuration during temporary unverifiability after valid PRO | BR-TEMP-001, Entitlement State Machine, Test: TEST-ENT-005 |
| **NFR-A11Y-001** | configuration interfaces fully keyboard accessible | UI/UX Contract, Test: TEST-UI-001 |
| **NFR-DATA-001** | configuration changes preserve referential AND semantic integrity of editorial content/configuration | BR-ART-003, BR-MIG-001, IPC Transactional Semantics, Test: TEST-DATA-001 |
| **NFR-OFFLINE-001** | temporary connectivity / verification unavailability causes neither local data loss nor unsafe state transitions | BR-TEMP-001, BR-UNAV-001, Test: TEST-OFFLINE-001 |

## 2. Acceptance Criteria Traceability

| Acceptance Criteria | Mapped To |
| --- | --- |
| **AC-WF-001** | BR-WF-001, BR-WF-002, IPC: update_workflow_stage, TEST-WF-002 |
| **AC-WF-002** | BR-WF-006, IPC: remove_workflow_stage, TEST-WF-004 |
| **AC-WF-003** | BR-WF-007, IPC: remove_workflow_stage, TEST-WF-005 |
| **AC-CAT-001** | BR-CAT-001, BR-CAT-002, IPC: create_category, get_categories, TEST-CAT-001, TEST-CAT-002 |
| **AC-CHK-001** | BR-CHK-001, BR-CHK-002, IPC: create_checklist_template, apply_checklist_template, TEST-CHK-001, TEST-CHK-002 |
| **AC-AI-001** | BR-AI-003, BR-AI-004, TEST-AI-001, TEST-AI-002 |
| **AC-DOWN-001** | BR-DOWN-001, BR-DOWN-002, TEST-DOWN-001 |
| **AC-DOWN-002** | BR-DOWN-003, IPC Auth matrix, TEST-DOWN-002 |
| **AC-FREE-001** | TEST-FREE-001 |
| **AC-FREE-002** | UI/UX Contract, TEST-FREE-002 |
| **AC-ENT-001** | BR-TEMP-001, IPC Auth matrix, TEST-ENT-005 |

## 3. Traceability Format

The normative rules follow this identifier format: `BR-<DOMAIN>-<ID>`.
Each rule traces back to the approved Phase 6.4 PRD, SDD, and ADRs.

## 4. Domain Identifiers

Identities for custom entities use canonical textual UUID representation (e.g., `123e4567-e89b-12d3-a456-426614174000`).
- `WorkflowStageId`: `String` (UUID format)
- `CategoryId`: `String` (UUID format)
- `ChecklistTemplateId`: `String` (UUID format)

Identities must remain stable across renames, reorders, entitlement downgrade, and application restart.

## 5. Name Normalization & Uniqueness

**BR-NORM-001 (Normalization)**
All names (workflow stages, categories, checklist templates) are trimmed of leading and trailing whitespace.
Uniqueness is enforced case-insensitively using SQLite `NOCASE` collation (ASCII case folding).
Empty names are rejected.

**BR-NORM-002 (Soft Delete Name Reuse)**
When a stage or category is safely removed (soft deleted, `is_active = false`), its name is explicitly mutated (e.g., suffixed with `__deleted__<UUID>`) in the same transaction to free up the original name for reuse, preserving historical identity while avoiding ambiguous active names.

## 6. Workflow Stage Contract

**BR-WF-001 (Attributes)** [FR-WF-001, FR-WF-002, ADR-009]
A `WorkflowStage` consists of:
- `id`: `WorkflowStageId`
- `display_name`: `String`
- `order_index`: `Integer`
- `semantic_classification`: `String` (Optional/Nullable)
- `is_active`: `Boolean`

**BR-WF-002 (Display Name)** [FR-WF-001, BR-NORM-001]
`display_name` MUST be non-empty after trim.

**BR-WF-003 (Uniqueness)**
`display_name` MUST be unique across all active stages (case-insensitive `NOCASE`).

**BR-WF-004 (Ordering Semantics)** [FR-WF-004]
- Active workflow order is zero-based.
- Active stages MUST have contiguous indexes `0..N-1`.
- No duplicate active order indexes.
- Create-at-position atomically shifts later indexes.
- Reorder requests contain the complete active stage set exactly once and normalize atomically.
- Removal compacts indexes atomically.
- Backend validation enforces contiguous sequences.

**BR-WF-005 (Safe Removal - Soft Delete)** [FR-WF-003]
Stage removal sets `is_active = false` and applies BR-NORM-002. It MUST NOT permanently delete the row.

**BR-WF-006 (Safe Removal - Reassignment)** [FR-WF-003]
A stage cannot be removed if any `Article` currently references it, UNLESS an explicit resolution target (`reassign_to_stage_id`) is provided for atomic reassignment.

**BR-WF-007 (Minimum Stages)** [FR-WF-MIN-001]
The system rejects any removal operation that results in zero active stages.

## 7. Semantic Classification Contract

**BR-AI-001 (Vocabulary)** [FR-AI-001, ADR-009]
The semantic classification vocabulary is exactly:
`IDEA`, `RESEARCH`, `DRAFTING`, `REVIEW`, `PUBLISHED`, or `NULL` (unclassified).

**BR-AI-002 (Legacy Mapping)** [FR-AI-001]
Legacy statuses map exactly:
- `ideia` -> `IDEA`
- `pesquisa` -> `RESEARCH`
- `escrita` -> `DRAFTING`
- `revisao` -> `REVIEW`
- `publicado` -> `PUBLISHED`

**BR-AI-003 (Semantic Principle)** [FR-AI-001, ADR-009, SDD 5]
Semantic classification may affect RECOMMENDED UX.
It MUST NOT independently make an action AVAILABLE.
It MUST NOT make an evidence-valid action UNAVAILABLE.
No custom stage -> AI action 1:1 relationship exists. Validation relies entirely on content evidence (Rust orchestrator).

## 8. Category Contract

**BR-CAT-001 (Attributes)** [FR-CAT-001, ADR-010]
A `Category` consists of:
- `id`: `CategoryId`
- `name`: `String`
- `origin`: `String` (Values: `'standard'`, `'custom'`)
- `is_active`: `Boolean`

**BR-CAT-002 (Validation)** [FR-CAT-001]
- `name` MUST be non-empty after trim and unique (BR-NORM-001).
- The 8 legacy standard categories bootstrap exactly with `origin = 'standard'`.
- Standard categories CANNOT be destructively deleted (`is_active = false` is blocked).
- Custom category removal sets `is_active = false` and renames per BR-NORM-002.
- Removal of a referenced category requires an explicit resolution target (`reassign_to_category_id`). No silent reassignment.

## 9. Checklist Template Contract

**BR-CHK-001 (Attributes)** [FR-CHK-001, FR-CHK-002, ADR-010]
A `ChecklistTemplate` consists of:
- `id`: `ChecklistTemplateId`
- `name`: `String`
- Ordered list of template items.

A `ChecklistTemplateItem` consists ONLY of:
- `label`: `String`
*No arbitrary template category/taxonomy is introduced.*

**BR-CHK-002 (Application Contract)** [FR-CHK-001, ADR-010]
Applying a template to an article:
- Generates a fresh, unique ID for each copied checklist item.
- Copies the `label`.
- Sets `completed = false`.
- Sets `articleId` to the target article.
- DOES NOT retain a required FK or runtime dependency on the template.
- Template mutation or deletion DOES NOT alter applied article checklist instances.

## 10. Article Reference Evolution

**BR-ART-001 (Stage Reference)** [ADR-009]
`articles.workflow_stage_id` MUST be a NOT NULL reference to a valid `WorkflowStage`.

**BR-ART-002 (Category Reference)** [ADR-010]
`articles.category_id` MUST be a NOT NULL reference to a valid `Category`.

**BR-ART-003 (Referential Integrity)** [NFR-DATA-001]
Orphaned references are strictly prohibited. The database schema enforces this via Foreign Key constraints (`ON DELETE RESTRICT`).

## 11. SQLite Target Schema & Constraint Contract

**TARGET FINAL SCHEMA**
```sql
CREATE TABLE workflow_stages (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL COLLATE NOCASE,
    order_index INTEGER NOT NULL CHECK (order_index >= 0),
    semantic_classification TEXT CHECK(semantic_classification IN ('IDEA', 'RESEARCH', 'DRAFTING', 'REVIEW', 'PUBLISHED', NULL)),
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX idx_workflow_stages_active_name ON workflow_stages(display_name) WHERE is_active = 1;

CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL COLLATE NOCASE,
    origin TEXT NOT NULL CHECK(origin IN ('standard', 'custom')),
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX idx_categories_active_name ON categories(name) WHERE is_active = 1;

CREATE TABLE checklist_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL COLLATE NOCASE,
    items_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX idx_checklist_templates_name ON checklist_templates(name);

-- articles table modifications
ALTER TABLE articles ADD COLUMN workflow_stage_id TEXT NOT NULL REFERENCES workflow_stages(id) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE articles ADD COLUMN category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE RESTRICT;
```
*Application validation enforces atomic reference reassignment before soft-deleting targets.*

**MIGRATION PHASE SQL CONCEPT**
During the `EXPAND` phase of migration, `workflow_stage_id` and `category_id` MUST be added as nullable columns to accommodate the pre-migration data prior to backfill. They are logically enforced as NOT NULL in the `CUTOVER` phase.

## 12. Migration Contract

**BR-MIG-001 (Phases & Exact Legacy Mapping)** [ADR-009, SDD 9]
1. **PRECONDITIONS:** DB accessible, recognized schema version, pre-migration backup successful.
2. **EXPAND:** Create `workflow_stages`, `categories`, `checklist_templates`. Add nullable `workflow_stage_id`, `category_id` to `articles`.
3. **BACKFILL:** Seed exact legacy statuses (`ideia`, `pesquisa`, `escrita`, `revisao`, `publicado`) and 8 standard categories. Map `status` to `workflow_stage_id` and `categoryTag` to `category_id`.
4. **VERIFY:** Every article has a recognized legacy status and categoryTag; every article has non-null valid new references; counts match; `checklist_items` unchanged.
5. **CUTOVER:** `workflow_stage_id` and `category_id` become logically NOT NULL. (Physical PRAGMA table rebuild deferred/implementation detail).
6. **POSTCONDITIONS:** Domain logic uses new references exclusively.

**BR-MIG-002 (Unknown Legacy Value / Fail Closed)** [SDD 10]
If an unknown status or category is encountered:
- Migration FAILS CLOSED. SQLite transaction aborts.
- No fallback mapping or guessed reassignment.
- Application reports `ERR_MIGRATION_UNKNOWN_LEGACY_VALUE`.
- Original DB remains untouched.

**BR-MIG-003 (Failure / Interruption / Retry)**
If migration fails or is interrupted (e.g. power loss):
- Partial SQLite transaction rolls back.
- Application restart triggers retry.
- Lossless pre-6.4 binary rollback is NOT supported after custom dynamic data exists.

## 13. Entitlement Application State Machine

**BR-ENT-SM-001 (States)** [ADR-012]
- `Unknown`: Insufficient entitlement decision.
- `FreeConfirmed`: PRO is not active.
- `ProActive`: Valid PRO entitlement.
- `ProTemporarilyUnverifiable`: Previously valid PRO, current verification/refresh temporarily unavailable.
- `ProUnavailable`: Unverifiable beyond allowed continuity (e.g., freshness exhausted).

**BR-ENT-SM-002 (Transitions)** [ADR-012]
- `Unknown` -> `ProActive` | `FreeConfirmed`
- `ProActive` -> `ProTemporarilyUnverifiable` | `FreeConfirmed` (requires explicit confirmed downgrade)
- `ProTemporarilyUnverifiable` -> `ProActive` | `ProUnavailable` | `FreeConfirmed` (requires explicit confirmed downgrade)
- `ProUnavailable` -> `ProActive` | `FreeConfirmed` (requires explicit confirmed downgrade)

First-launch offline with no credible previous PRO evidence remains `Unknown` (or goes to `FreeConfirmed` if verified), it MUST NOT become `ProTemporarilyUnverifiable`.
`ProUnavailable` != `FreeConfirmed`.

## 14. Entitlement Decision Port

**NORMATIVE APPLICATION CONTRACT (Semantic)**
The application must expose a native boundary interface (e.g., a Rust trait) capable of evaluating the entitlement state without assuming blocking execution.

**NON-NORMATIVE RUST SHAPE EXAMPLE (Rust 1.77.2 Compatible)**
```rust
pub enum EntitlementState {
    Unknown,
    FreeConfirmed,
    ProActive,
    ProTemporarilyUnverifiable,
    ProUnavailable,
}

pub trait EntitlementDecisionProvider: Send + Sync {
    // Native async fn in trait supported since Rust 1.75
    async fn check_entitlement(&self) -> Result<EntitlementState, EntitlementError>;
}
```
*Note: Do not select `async_trait`, boxed futures, provider SDKs, HTTP client, or runtime architecture.*

## 15. Protected Mutation Authorization

For EVERY protected configuration mutation (Class P):
- `ProActive`: PERMIT evaluation.
- `ProTemporarilyUnverifiable`: PERMIT evaluation (Temporary continuity).
- `FreeConfirmed`: DENY (`ERR_CONFIRMED_FREE_PRO_MUTATION_DENIED`).
- `Unknown`: DENY (`ERR_ENTITLEMENT_STATE_UNKNOWN`).
- `ProUnavailable`: DENY (`ERR_ENTITLEMENT_UNAVAILABLE`).
*Authorization success does NOT bypass business validation.*

## 16. Error Contract (Canonical Vocabulary)

All IPC commands MUST return semantic failures through ONE canonical IPC error envelope:
```json
{
  "code": "ERR_...",
  "retryable": false,
  "details": {}
}
```

Stable canonical semantic error codes:
- `ERR_DATABASE_FAILURE`: General persistence failure.
- `ERR_INVALID_WORKFLOW`: Validation failed (e.g., duplicate name). User fixable.
- `ERR_LAST_STAGE_REMOVAL`: Cannot remove last stage. User fixable.
- `ERR_UNRESOLVED_STAGE_REFERENCE`: Stage referenced, needs explicit reassignment target. User fixable.
- `ERR_UNRESOLVED_CATEGORY_REFERENCE`: Category referenced, needs explicit reassignment target. User fixable.
- `ERR_INVALID_SEMANTIC_CLASSIFICATION`: Invalid semantic mapping. System error.
- `ERR_INVALID_CATEGORY`: Invalid operation (e.g., duplicate custom name, delete standard).
- `ERR_INVALID_CHECKLIST_TEMPLATE`: Validation failed (e.g., duplicate name). User fixable.
- `ERR_MALFORMED_CHECKLIST_TEMPLATE`: Bad persisted/serialized template structure. System error.
- `ERR_CONFIRMED_FREE_PRO_MUTATION_DENIED`: Downgrade rejection. User fixable (upgrade).
- `ERR_ENTITLEMENT_STATE_UNKNOWN`: Uninitialized state. Retryable.
- `ERR_ENTITLEMENT_UNAVAILABLE`: ProUnavailable. Retryable.
- `ERR_MIGRATION_UNKNOWN_LEGACY_VALUE`: Unmappable migration value. Manual repair needed.
- `ERR_MIGRATION_FAILED`: General migration failure. Fatal.

## 17. UI / UX Contracts

- **Workflow Configuration:** Dedicated settings interface.
- **PRO Discoverability:** Contextual indicators on custom actions for Free tier without permanently obstructive locked surfaces.
- **Explicit Save/Cancel:** Settings changes require explicit save.
- **Destructive Confirmation:** Deleting stages/categories requires confirmation.
- **Reference Resolution:** Deletion of referenced entities forces a dropdown selection for explicit atomic reassignment.
- **A11y (NFR-A11Y-001):** Fully keyboard-accessible ordering (buttons + drag-and-drop), focus trapping, screen-reader success/error announcements.

## 18. Downgrade Contract

**BR-DOWN-001 (Preservation)** [FR-DOWN-001, ADR-011]
On `FreeConfirmed`, the system MUST NOT silently reset to defaults or remap custom entities. Articles, custom workflow stages, custom categories, checklist templates, and checklist history MUST be preserved.

**BR-DOWN-002 (Editorial Operation)** [FR-DOWN-001]
While `FreeConfirmed`, ordinary editorial operations using preserved custom structures continue uninterrupted.

**BR-DOWN-003 (Mutation Denial)** [FR-DOWN-002]
While `FreeConfirmed`, NEW PRO configuration changes are DENIED.

## 19. Temporary Unverifiability & ProUnavailable Contract

**BR-TEMP-001 (Temporary Unverifiability)** [FR-ENT-001, NFR-OFFLINE-001]
While `ProTemporarilyUnverifiable` (after credible previously-valid PRO):
- Ordinary editorial operations continue.
- Existing configuration use continues.
- Configuration editing is PERMITTED (not denied solely due to unverifiability).

**BR-UNAV-001 (Pro Unavailable)** [NFR-OFFLINE-001]
While `ProUnavailable`:
- Protected configuration mutations are DENIED.
- Ordinary editorial work continues.
- Data remains intact. Recovery remains possible.

## 20. Phase 6.3 AI Regression Contract

**BR-AI-004 (Action Availability)** [FR-AI-001, ADR-008]
Rust evidence validation remains authoritative for all 6 Phase 6.3 AI actions (`research_gaps`, `plain_language`, `validate_inclusivity`, `generate_alt_text`, `generate_seo`, `editorial_review`).
An unclassified stage CANNOT disable an evidence-valid action.
The 6 Phase 6.3 actions remain Free.

## 21. Commercial Entitlement Adapter Boundary

🔴 **DEFERRED — SEPARATE HUMAN GATE REQUIRED**
The concrete commercial entitlement adapter is OUT OF SCOPE.
This Spec DOES NOT select: commercial provider, payment provider, authentication provider, account model, proof format, cryptographic algorithm, key topology, secure storage, exact freshness duration, machine binding, or revocation protocol.
