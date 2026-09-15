---
jinc-spec-version: 1.0.0
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

## 1. Coverage Report

| Requirement | Description | Specified In |
| --- | --- | --- |
| **FR-WF-001** | Support custom stage creation | BR-WF-001, DB Schema, IPC: Create Stage, Test: TEST-WF-001 |
| **FR-WF-002** | Support custom stage renaming | BR-WF-002, IPC: Rename Stage, Test: TEST-WF-002 |
| **FR-WF-003** | Support stage reordering | BR-WF-004, IPC: Reorder Stage, Test: TEST-WF-003 |
| **FR-WF-004** | Support safe stage removal | BR-WF-005, BR-WF-006, IPC: Remove Stage, Test: TEST-WF-004 |
| **FR-WF-MIN-001** | Minimum 1 active stage | BR-WF-007, IPC: Remove Stage, Test: TEST-WF-005 |
| **FR-CAT-001** | Custom categories | BR-CAT-001, BR-CAT-002, DB Schema, IPC: Categories, Test: TEST-CAT-001 |
| **FR-CHK-001** | Reusable checklist templates | BR-CHK-001, DB Schema, IPC: Checklists, Test: TEST-CHK-001 |
| **FR-CHK-002** | Template application applies copy | BR-CHK-002, IPC: Apply Template, Test: TEST-CHK-002 |
| **FR-AI-001** | Semantic mapping to AI | BR-AI-001, BR-AI-002, Test: TEST-AI-001 |
| **FR-DOWN-001** | Free tier fallback (downgrade) | BR-DOWN-001, Entitlement State Machine, Test: TEST-DOWN-001 |
| **FR-DOWN-002** | Preserve existing configuration | BR-DOWN-002, BR-DOWN-003, Test: TEST-DOWN-002 |
| **FR-ENT-001** | Entitlement boundary enforcement | BR-ENT-001, Entitlement Port, IPC Authorization, Test: TEST-SEC-001 |
| **NFR-A11Y-001**| Keyboard/Screen-reader a11y | UI/UX Contract, Test: TEST-UI-001 |
| **NFR-DATA-001**| No data loss on failure | Migration Contract, BR-ERR-001, Test: TEST-MIG-001 |
| **NFR-OFFLINE-001**| Local-first operation | Entitlement State Machine (Temporary Unverifiability), Test: TEST-OFFLINE-001 |

## 2. Traceability Format

The normative rules follow this identifier format: `BR-<DOMAIN>-<ID>`.
Example: `BR-WF-001`. Each rule traces back to the approved Phase 6.4 PRD, SDD, and ADRs.

## 3. Domain Identifiers

Identities for custom entities use canonical textual UUID representation (e.g. `123e4567-e89b-12d3-a456-426614174000`).
The exact UUID version (e.g., v4) is an implementation detail (Rust `uuid` crate recommended).
- `WorkflowStageId`: `String` (UUID format)
- `CategoryId`: `String` (UUID format)
- `ChecklistTemplateId`: `String` (UUID format)

Identities must remain stable across renames, reorders, entitlement downgrade, and application restart.

## 4. Workflow Stage Contract

**BR-WF-001 (Attributes)** [FR-WF-001, ADR-009]
A `WorkflowStage` consists of:
- `id`: `WorkflowStageId`
- `display_name`: `String`
- `order_index`: `Integer`
- `semantic_classification`: `SemanticClassification` (Optional/Nullable)
- `is_active`: `Boolean`

**BR-WF-002 (Display Name)** [FR-WF-002]
`display_name` MUST be non-empty after trim.

**BR-WF-003 (Uniqueness)**
`display_name` MUST be unique across all active stages.

**BR-WF-004 (Ordering)** [FR-WF-003]
`order_index` is zero-based and deterministic. Gaps are allowed conceptually but UI must reorder contiguously.

**BR-WF-005 (Safe Removal - Soft Delete)** [FR-WF-004]
Stage removal sets `is_active = false`. It MUST NOT permanently delete the row to maintain historical referential integrity if needed, though articles must be resolved.

**BR-WF-006 (Safe Removal - No Orphaning)** [FR-WF-004]
A stage cannot be removed if any `Article` currently references it, unless an explicit resolution target (another stage) is provided for reassignment.

**BR-WF-007 (Minimum Stages)** [FR-WF-MIN-001]
The system rejects any removal operation that results in zero active stages.

## 5. Semantic Classification Contract

**BR-AI-001 (Vocabulary)** [FR-AI-001, ADR-009]
The semantic classification vocabulary is exactly:
`IDEA`, `RESEARCH`, `DRAFTING`, `REVIEW`, `PUBLISHED`, or `NULL` (unclassified).

**BR-AI-002 (Legacy Mapping)** [FR-AI-001]
Legacy statuses map exactly to semantic classifications:
- `ideia` -> `IDEA`
- `pesquisa` -> `RESEARCH`
- `escrita` -> `DRAFTING`
- `revisao` -> `REVIEW`
- `publicado` -> `PUBLISHED`

**BR-AI-003 (Semantic Principle)** [ADR-009, SDD 5]
Semantic classification may affect RECOMMENDED UX.
It MUST NOT independently make an action AVAILABLE.
It MUST NOT make an evidence-valid action UNAVAILABLE.
No custom stage -> AI action 1:1 relationship exists.

## 6. Category Contract

**BR-CAT-001 (Attributes)** [FR-CAT-001, ADR-010]
A `Category` consists of:
- `id`: `CategoryId`
- `name`: `String`
- `origin`: `String` (Values: `'standard'`, `'custom'`)
- `is_active`: `Boolean`

**BR-CAT-002 (Validation)** [FR-CAT-001]
- `name` MUST be non-empty after trim.
- `name` MUST be unique (case-insensitive normalization).
- The 8 legacy categories bootstrap exactly with `origin = 'standard'`.
- Standard categories CANNOT be destructively deleted (`is_active = false`).
- Custom category removal requires explicit resolution if referenced by articles. No silent reassignment.

## 7. Checklist Template Contract

**BR-CHK-001 (Attributes)** [FR-CHK-001, ADR-010]
A `ChecklistTemplate` consists of:
- `id`: `ChecklistTemplateId`
- `name`: `String`
- `items_json`: `String` (JSON array of `{ label: string, category: string }`)

**BR-CHK-002 (Application)** [FR-CHK-002, ADR-010]
Applying a template creates independent, article-owned rows in `checklist_items`.
No runtime relationship to the template is preserved on the article.
Template mutations or deletions DO NOT alter applied article checklist instances.

## 8. Article Reference Evolution

**BR-ART-001 (Stage Reference)** [ADR-009]
`articles.workflow_stage_id` MUST be a NOT NULL reference to a valid active `WorkflowStage`. (SQLite FK enforced).

**BR-ART-002 (Category Reference)** [ADR-010]
`articles.category_id` MUST be a NOT NULL reference to a valid active `Category`. (SQLite FK enforced).

**BR-ART-003 (Referential Integrity)**
Orphaned references are strictly prohibited. Deletions of referenced stages or categories must fail or require explicit atomic reassignment.

## 9. SQLite / Drizzle Target Schema

```typescript
// Drizzle Schema Definition Concepts (Not executable code, specification only)
export const workflowStages = sqliteTable('workflow_stages', {
  id: text('id').primaryKey(), // UUID
  displayName: text('display_name').notNull().unique(),
  orderIndex: integer('order_index').notNull(),
  semanticClassification: text('semantic_classification'), // 'IDEA' | 'RESEARCH' | etc.
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(), // UUID
  name: text('name').notNull().unique(),
  origin: text('origin').notNull().default('custom'), // 'standard' | 'custom'
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

export const checklistTemplates = sqliteTable('checklist_templates', {
  id: text('id').primaryKey(), // UUID
  name: text('name').notNull().unique(),
  itemsJson: text('items_json').notNull(), // JSON array
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// Articles changes
export const articles = sqliteTable('articles', {
  // existing fields...
  workflowStageId: text('workflow_stage_id').notNull().references(() => workflowStages.id),
  categoryId: text('category_id').notNull().references(() => categories.id),
  // legacy status and categoryTag columns remain during migration
});

// checklist_items table remains UNCHANGED.
```

## 10. Ordering Semantics

- **Workflow Stages:** Zero-based contiguous `order_index`. Gaps resulting from deletion must be normalized dynamically on read or explicitly normalized on write. Ordering mutations must be atomic (e.g. array of ID+Order passed to Rust).
- **Checklist Templates:** The `items_json` JSON array inherently preserves zero-based ordering natively.

## 11. Migration Contract

**BR-MIG-001 (Phases)** [ADR-009, SDD 9]
1. **EXPAND:** Create `workflow_stages`, `categories`, `checklist_templates`. Add nullable `workflow_stage_id`, `category_id` to `articles`.
2. **BACKFILL:** Seed default stages/categories. Map existing `status` to `workflow_stage_id` and `categoryTag` to `category_id`.
3. **VERIFY:** Verify NO article has a NULL `workflow_stage_id` or `category_id`.
4. **CUTOVER:** (Future step) Make columns NOT NULL and drop legacy columns. For Phase 6.4, legacy columns remain but are ignored by domain logic.

**BR-MIG-002 (Strict Mapping)** [SDD 10]
Legacy statuses exactly: `ideia`, `pesquisa`, `escrita`, `revisao`, `publicado`.
Legacy categories exactly mapped to their 8 original standard counterparts.

**BR-MIG-003 (Unknown Failure)** [SDD 10]
If an unknown legacy status or category is encountered:
- Migration FAILS CLOSED.
- No fallback mapping or guessed reassignment.
- SQLite transaction rolls back.
- Application reports `Err_MigrationUnknownLegacyValue`.
- Original DB remains untouched.

## 12. Entitlement Application State Machine

**BR-ENT-SM-001 (States)** [ADR-012]
- `Unknown`: Insufficient entitlement decision.
- `FreeConfirmed`: PRO is not active.
- `ProActive`: Valid PRO entitlement.
- `ProTemporarilyUnverifiable`: Previously valid PRO, current verification temporarily unavailable.
- `ProUnavailable`: Unverifiable beyond allowed continuity (e.g. freshness exhausted).

**BR-ENT-SM-002 (Transitions)** [ADR-012]
- `Unknown` -> `ProActive` | `FreeConfirmed`
- `ProActive` -> `ProTemporarilyUnverifiable` | `FreeConfirmed`
- `ProTemporarilyUnverifiable` -> `ProActive` | `ProUnavailable` | `FreeConfirmed` (on confirmed downgrade ONLY)
- `ProUnavailable` -> `ProActive` | `FreeConfirmed` (on confirmed downgrade ONLY)

**BR-ENT-SM-003 (No Implicit Downgrade)**
`ProUnavailable` != `FreeConfirmed`. First-launch offline without credible previous PRO evidence remains `Unknown` (or goes to `FreeConfirmed` if verified), it MUST NOT become `ProTemporarilyUnverifiable`.

## 13. Entitlement Decision Port

```rust
// CONCEPTUAL RUST CONTRACT
pub enum EntitlementState {
    Unknown,
    FreeConfirmed,
    ProActive,
    ProTemporarilyUnverifiable,
    ProUnavailable,
}

#[async_trait::async_trait] // Conceptual, exact async trait mechanic left to implementation
pub trait EntitlementDecisionProvider: Send + Sync {
    async fn check_entitlement(&self) -> Result<EntitlementState, EntitlementError>;
}
```
**Constraint:** The concrete provider, SDK, HTTP client, or auth system MUST NOT be selected in this spec. A test/fake provider may be used in tests, but `DEVELOPER_PREMIUM` must remain debug-only.

## 14. Protected Mutation Authorization

For EVERY protected configuration mutation (IPC commands):
- `ProActive`: PERMIT evaluation.
- `ProTemporarilyUnverifiable`: PERMIT evaluation (Temporary continuity).
- `FreeConfirmed`: DENY (`Err_ConfirmedFreeProtectedMutationDenial`).
- `Unknown`: DENY (`Err_EntitlementStateUnknown`).
- `ProUnavailable`: DENY (`Err_EntitlementUnavailable`).

*Authorization success does NOT bypass business/data-integrity rules.*

## 15. Error Contract

Semantic error codes:
- `Err_InvalidWorkflow`: Invalid workflow save (e.g., duplicate names). [User fixable]
- `Err_LastStageRemoval`: Attempted to remove last active stage. [User fixable]
- `Err_UnresolvedStageReference`: Stage referenced by articles during delete. [User fixable via reassignment]
- `Err_UnresolvedCategoryReference`: Category referenced by articles during delete. [User fixable via reassignment]
- `Err_InvalidSemanticClassification`: Invalid semantic classification string. [System error]
- `Err_InvalidCategory`: Invalid category operation (e.g., delete standard). [System error]
- `Err_MalformedChecklistTemplate`: Invalid JSON structure. [System error]
- `Err_ConfirmedFreeProtectedMutationDenial`: Tauri rejected PRO mutation. [Downgrade logic]
- `Err_EntitlementStateUnknown`: State unknown. [Retryable]
- `Err_EntitlementUnavailable`: ProUnavailable. [Retryable on network]
- `Err_MigrationUnknownLegacyValue`: Unmappable value. [Manual DB repair needed]
- `Err_MigrationFailed`: General SQLite migration error. [Fatal]

## 16. UI / UX Contracts

- **Workflow Configuration:** Dedicated settings modal/pane.
- **PRO Discoverability:** Contextual indicators (e.g., "PRO" lock icons on custom actions in Free tier) without permanent obstructive popups.
- **Explicit Save/Cancel:** Workflow/Category configuration changes require explicit Save to commit to SQLite.
- **Destructive Confirmation:** Deleting stages/categories requires explicit user confirmation.
- **Reference Resolution:** If deleting a stage/category with linked articles, a UI dropdown MUST prompt the user to select the new stage/category for those articles.
- **A11y:** Keyboard-accessible ordering (Up/Down buttons alongside drag-and-drop), focus trapping in modals, screen-reader success/error announcements (`aria-live="polite"`).

## 17. Downgrade Contract

**BR-DOWN-001 (Confirmed Downgrade Preservation)** [FR-DOWN-002, ADR-011]
On `FreeConfirmed`, the system MUST NOT silently reset to defaults or remap custom entities.
Articles, custom workflow stages, custom categories, checklist templates, and article checklist history MUST be preserved.

**BR-DOWN-002 (Editorial Operation)** [FR-DOWN-001]
While `FreeConfirmed`, ordinary editorial operations using the preserved custom structures MUST be allowed.

**BR-DOWN-003 (Mutation Denial)** [FR-DOWN-001]
While `FreeConfirmed`, NEW PRO configuration changes MUST be denied.

## 18. Temporary Unverifiability & ProUnavailable Contract

**BR-TEMP-001 (Temporary Unverifiability)** [ADR-012]
While `ProTemporarilyUnverifiable`, existing configuration use continues, and configuration editing is PERMITTED. Exact continuity duration is OUT OF SPEC.

**BR-UNAV-001 (Pro Unavailable)** [ADR-012]
While `ProUnavailable`, protected configuration mutations are DENIED. Ordinary editorial work continues. Data remains intact. Recovery remains possible.

## 19. Phase 6.3 AI Regression Contract

**BR-AI-004 (Action Availability)** [ADR-008]
Rust evidence validation remains authoritative for all 6 Phase 6.3 AI actions.
Custom stage display names are untrusted editorial data, not orchestration policy.
An unclassified custom stage CANNOT disable an evidence-valid AI action.
The 6 Phase 6.3 AI actions remain Free.

## 20. Security Contracts

- **Frontend spoofing / TOCTOU:** Native Tauri layer performs entitlement checks immediately prior to DB transaction.
- **Direct IPC mutation:** Direct IPC calls to protected commands are gated by the exact same native authorization logic.
- **Debug entitlement abuse:** `DEVELOPER_PREMIUM` is strictly stripped/ignored in release builds (Mandatory Release Test).
- **Downgrade data destruction:** Prevented by BR-DOWN-001.

## 21. Commercial Entitlement Adapter Boundary

🔴 **DEFERRED — SEPARATE HUMAN GATE REQUIRED**
The concrete commercial entitlement adapter is OUT OF SCOPE.
This Spec DOES NOT select: commercial provider, payment provider, authentication provider, account model, proof format, cryptographic algorithm, key topology, secure-storage product, freshness duration, machine binding, or revocation protocol.
