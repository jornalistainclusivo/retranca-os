---
jinc-sdd-version: 1.0.0
project-name: Retranca OS
project-context: fullstack
status: approved
related-branch: docs/phase-6.4-product-access-monetization
tech-stack: SQLite, React, TypeScript, Tauri, Rust
created-at: 2026-09-15
last-updated: 2026-09-15
authors: Retranca OS Core Team
---

# Software Design Document: Phase 6.4 - PRO Workflow Customization

## 1. Status
PHASE 6.4 — SOFTWARE DESIGN — APPROVED ARCHITECTURE BASELINE

## 2. Introduction and Context
This SDD details the software architecture for Phase 6.4 PRO Workflow Customization. Based on the Phase 6.4 PRD and the architectural decisions defined in ADR-008, ADR-009, ADR-010, ADR-011, and ADR-012, this document specifies the implementation of customizable workflow stages, custom categories, and reusable checklist templates while adhering to local-first principles.

It explicitly maintains the existing Retranca OS stack: React/TypeScript (Frontend), Tauri/Rust (Backend IPC Gateway), and local SQLite persistence. No cloud dependencies, generic authentication providers, or external databases are introduced.

## 3. Current State Architecture & Impacted Modules
The current Retranca OS architecture represents `ArticleStatus` and `CategoryTag` as closed string literal unions in TypeScript (`types/editorial.ts`).

Current TypeScript representations:
`ArticleStatus`: `'ideia' | 'pesquisa' | 'escrita' | 'revisao' | 'publicado'`
`CategoryTag`: `'IA' | 'Acessibilidade' | 'Inclusão' | 'SEO' | 'Docs' | 'Blog' | 'Social' | 'Linguagem Simples'`

The current SQLite `articles` columns include `status` and `categoryTag`.

Current article checklist persistence is ALREADY relational in the `checklist_items` table (columns: `id`, `articleId`, `label`, `completed`, `category`).

**Impacted Modules:**
- **Persistence (SQLite):** New tables for `workflow_stages`, `categories`, and `checklist_templates`. Schema modifications to `articles`.
- **Backend (Rust):** New DTOs and IPC handlers for managing PRO entities. Updates to `EditorialContext` generation and the AI orchestrator's evidence validation.
- **Frontend (TypeScript):** UI/UX for workflow and category management. Updates to Kanban, List, and Stats views to consume dynamic entities. Updates to AI recommendation logic.
- **Entitlement Boundary:** New Rust-side entitlement verification and enforcement layer (Tauri native boundary) to gate PRO mutations.

## 4. Dynamic Workflow-Stage Domain Model
Following ADR-009, workflow stages are modeled as dynamic entities. This SDD explicitly selects UUIDs as the stable identity format for these entities, as they are appropriate for stable local identity generation without centralized coordination, ensuring they survive renames and reordering. Exact UUID generation library/algorithm details will be formalized in the Spec.

**Model:**
- `id` (UUID): Stable stage identity.
- `display_name` (String): The user-facing name.
- `order_index` (Integer)
- `semantic_classification` (Enum, Optional): Semantic mapping used for UI AI recommendation.
- `lifecycle_role` (Optional): `PUBLICATION | null`
  - Independent from `semantic_classification`.
  - Exactly one ACTIVE stage owns `PUBLICATION`.
  - All other active stages have `null`.
  - It is not inferred from `display_name`.
  - It is not inferred from `semantic_classification`.
- `is_active` (Boolean)

**Business Rules:**
- **Minimum one stage:** The system rejects any operation resulting in zero active stages.
- **Safe stage removal:** A stage cannot be destructively removed while unresolved article references would be orphaned or silently remapped. Removal of the active stage that owns lifecycle_role = PUBLICATION requires explicit atomic transfer of the role to another active stage through the selected reassignment target.

## 5. Workflow Semantic Classification & Lifecycle Role
Semantic classifications preserve compatibility with the current five statuses and influence TypeScript RECOMMENDED UX only.
Custom stages may have one optional semantic classification, or no classification.

Separately, exactly ONE active stage MUST have lifecycle_role = PUBLICATION. The PUBLICATION lifecycle role governs publication behavior (e.g., setting completedAt, stats, excluded from overdue). Semantic PUBLISHED remains recommendation-only.

**Mapping:**
- `ideia` -> `IDEA`
- `pesquisa` -> `RESEARCH`
- `escrita` -> `DRAFTING`
- `revisao` -> `REVIEW`
- `publicado` -> `PUBLISHED`

**Invariant preserved:** *status recommends; validated evidence determines action availability.*
Rust evidence prerequisite validation MUST NOT depend on stage display name or semantic classification. There is NO one-to-one mapping between a custom stage and an AI action.

## 6. Free Default Workflow vs Customized Preserved State
A fresh/default Free configuration starts with the standard five stages, which represent the standard default baseline.

While PRO is valid, those workflow stages may be renamed/reordered, and additional stages may be added/removed subject to safety rules.
If the user later downgrades:
- Custom workflow configuration is NOT reset.
- Stages are NOT silently remapped back to defaults.
- Existing configuration is preserved.
- Ordinary editorial work using that existing workflow remains safe.
- Protected new customization mutations follow the approved entitlement policy.

## 7. Standard Categories vs Custom PRO Categories
The system distinguishes the standard Free category set from PRO-created custom categories using a provenance indicator.

**Model:**
- The eight existing standard categories remain available as the Free baseline.
- Custom categories have stable identities (UUIDs).
- Provenance is representable (e.g., `origin = standard | custom` or similar). Exact field naming will be finalized in Spec.
- No user-facing custom taxonomy beyond category name is created.
- Custom-category rename preserves article references.
- Custom-category deletion requires safe resolution if referenced. Standard categories cannot be deleted.

## 8. Persistence Design (SQLite)
Following ADR-010, the persistence strategy employs a hybrid approach: relational models for categories and workflow stages, and document-style persistence for checklist templates.

### 8.1 Workflow Stages
```sql
CREATE TABLE workflow_stages (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL UNIQUE,
    semantic_classification TEXT CHECK(semantic_classification IS NULL OR semantic_classification IN ('IDEA', 'RESEARCH', 'DRAFTING', 'REVIEW', 'PUBLISHED')),
    lifecycle_role TEXT CHECK (lifecycle_role IS NULL OR lifecycle_role = 'PUBLICATION'),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX idx_workflow_stages_active_name ON workflow_stages(display_name) WHERE is_active = 1;
CREATE UNIQUE INDEX idx_workflow_stages_publication ON workflow_stages(lifecycle_role) WHERE lifecycle_role = 'PUBLICATION' AND is_active = 1;
```

### 8.2 Relational Custom Categories
```sql
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    origin TEXT NOT NULL DEFAULT 'custom', -- 'standard' | 'custom'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 8.3 Checklist Templates (Hybrid Document-Style)
```sql
CREATE TABLE checklist_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    items_json TEXT NOT NULL, -- Document-style ordered array of template items
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
Checklist templates have stable template identity, a name, and contain ordered document-style item definitions (`items_json` attribute).
Existing article checklist instances remain independently relational in `checklist_items`.
Applying a template creates INDEPENDENT article-owned `checklist_items` rows. Template JSON is NOT copied into articles. Editing or deleting a template does not alter existing `checklist_items` rows.

## 9. Migration Strategy
**Goal:** Safely migrate existing fixed strings to the new dynamic entity references using exact legacy values.

**Legacy Values:**
- Stages: `ideia`, `pesquisa`, `escrita`, `revisao`, `publicado`
- Category Column: `categoryTag`

**Expand -> Backfill -> Verify -> Cutover Process:**
1. **Bootstrap Workflow Stages:** Seed the standard five workflow stages. The legacy publicado maps to a standard stage with semantic_classification = PUBLISHED and lifecycle_role = PUBLICATION.
2. **Bootstrap Categories:** Seed the exact eight standard categories with `origin = 'standard'`.
3. **Article Stage Backfill:** Add `workflow_stage_id` to `articles`. Map existing `status` strings to seeded workflow stage UUIDs.
4. **Article Category Backfill:** Add `category_id` to `articles`. Map existing `categoryTag` strings to seeded category UUIDs.
5. **Validation:** Verify exactly one active publication-role stage, every legacy publicado article points to it, no unknown legacy status/category, and EVERY article resolved successfully.
6. **Preservation:** Verify that existing `checklist_items` remain unchanged.
7. **Cutover:** Drop legacy `status` and `categoryTag` columns only after design justifies the contract phase.

## 10. Migration Safety / Rollback Precision
- **Transaction:** The migration must occur within a single SQLite transaction boundary.
- **Pre-Migration Backup:** A pre-migration backup of the SQLite DB is required to ensure recovery if migration fails before the first successful startup.
- **Unknown Values:** If an unknown legacy status or category value is encountered, migration validation **fails closed** and NO silent remapping occurs. The original DB remains recoverable, the pre-migration backup remains available, and startup/migration reports a recoverable migration error (`Err_MigrationUnknownLegacyValue`) requiring explicit recovery/reconciliation. We do NOT guess the user's intended workflow/category.
- **Rollback Limitation:** Lossless binary rollback to a pre-6.4 application binary is NOT supported after new dynamic data (custom stages/categories) is created. Forward-recovery is expected.

## 11. Current Module / File Path Precision
**PROPOSED PATHS:**
- `src-tauri/src/models/workflow.rs` (PROPOSED)
- `src-tauri/src/models/category.rs` (PROPOSED)
- `src-tauri/src/models/checklist_template.rs` (PROPOSED)

**CURRENT PATHS:**
- `src-tauri/src/models/` (CURRENT directory structure)
- `types/editorial.ts` (CURRENT)

## 12. IPC Contracts Completeness

**READ / ORDINARY EDITORIAL OPERATIONS (Free):**
- Read workflow
- Read categories
- Read templates
- Move article to an existing stage
- Assign an existing category
- Apply an existing checklist template

**PROTECTED CONFIGURATION MUTATIONS (PRO Enforced):**
- Stage create
- Stage rename
- Stage reorder
- Stage removal
- Custom category create
- Custom category rename
- Custom category safe deletion
- Checklist-template create
- Checklist-template rename/edit/reorder
- Checklist-template deletion

## 13. PRO Authorization Boundary & Entitlement Model (ADR-011, ADR-012)

**Entitlement Application State Machine:**
1. `Unknown`: No sufficient entitlement decision has been established. Fails safely for protected mutations without destroying/hiding data.
2. `FreeConfirmed`: Sufficient authoritative information establishes that PRO is not currently active.
3. `ProActive`: A valid production PRO entitlement is established.
4. `ProTemporarilyUnverifiable`: Previously-valid PRO has been credibly established, but current verification/refresh is temporarily unavailable. Reachable ONLY when the application has credible previously-valid PRO state according to the future production entitlement design. A first launch with no evidence/connectivity is NOT previously-valid PRO.
5. `ProUnavailable`: The application cannot currently authorize PRO mutations, but cannot truthfully classify the state as confirmed Free/downgrade. (e.g., continuity/freshness exhaustion without confirmed downgrade). Data MUST remain intact, readable, and recoverable.

**Entitlement Abstraction (Adapter Boundary):**
```rust
// CONCEPTUAL APPLICATION INTERFACE
trait EntitlementDecisionProvider {
    fn check_entitlement(&self) -> EntitlementState;
}
```
This is a CONCEPTUAL application interface. The concrete Rust contract MAY require asynchronous execution depending on the selected production source. Exact Rust async trait/signature mechanics are left to Spec, but they MUST NOT pre-select `async_trait`, boxed futures, Tokio-specific interfaces, HTTP clients, or provider SDKs.

## 14. Downgrade vs Temporary Unverifiability
**TEMPORARILY UNVERIFIABLE PRO:**
- Previously valid PRO.
- Existing PRO configuration use continues.
- Configuration editing is not blocked solely by temporary unverifiability.

**CONFIRMED FREE / DOWNGRADE:**
- Editorial data intact.
- Configuration preserved/recoverable (no destructive remap/reset).
- New PRO configuration changes denied (CONFIGURATION MUTATION).
- Ordinary editorial use of preserved existing structures remains available (ORDINARY ARTICLE EDITORIAL OPERATIONS).

## 15. Security Design (Threat Model Alignment)
- **Authorization at Time of Use:** Frontend UI state is advisory/presentation only. The native handler evaluates authorization at the protected mutation boundary, sufficiently close to mutation execution to avoid frontend/native TOCTOU assumptions. Direct IPC invocation must pass the same native authorization check.
- **Frontend-only bypass:** Mitigated at the application boundary because protected mutation handlers perform native authorization checks.
- **Privileged Local Attacker:** Residual risks remain for a privileged local attacker capable of patching binaries/process memory/local persistence. The system is not tamper-proof against this vector.
- **Debug Override:** `DEVELOPER_PREMIUM` is strictly a debug/test artifact and must NEVER become production commercial entitlement authority.

## 16. Accessibility (A11Y) Design
- **Keyboard Operation:** All customization settings must be fully navigable via keyboard (`Tab`, `Enter`, `Space`).
- **Focus Management:** Focus must be trapped within confirmation modals and restored appropriately.
- **Ordering:** Reordering stages/checklists must provide keyboard-accessible alternatives (e.g., Up/Down arrow buttons).
- **Screen Reader Semantics:** Use `aria-live` for success/error feedback on mutations.

## 17. Error Taxonomy
Stable conceptual error codes:
- `Err_InvalidWorkflow`: Attempted to save a workflow violating rules.
- `Err_LastStageRemoval`: Attempted to remove the last active stage.
- `Err_UnresolvedStageReference`: Attempted to delete a stage with unresolved references.
- `Err_UnresolvedCategoryReference`: Attempted to delete a category with unresolved references.
- `Err_InvalidSemanticClassification`: Invalid semantic classification provided.
- `Err_MalformedChecklistTemplate`: Template JSON validation failed.
- `Err_ConfirmedFreeProtectedMutationDenial`: Tauri rejected a PRO mutation (Confirmed Free).
- `Err_EntitlementStateUnknown`: Entitlement state is unknown/uninitialized.
- `Err_EntitlementUnavailable`: Entitlement unavailable/unverifiable beyond allowed continuity.
- `Err_MigrationUnknownLegacyValue`: Encountered unmappable legacy status/category (Fails closed).
- `Err_MigrationFailed`: SQLite migration transaction aborted.

## 18. Diagrams

### 18.1 Component / Responsibility Diagram
```mermaid
flowchart TD
    UI[React / TypeScript UX] -->|IPC| TauriIPC[Tauri IPC Gateway]

    TauriIPC -->|Operations| Domain[Editorial Domain / Persistence Operations]

    TauriIPC -->|Evaluates| Authz[Native PRO Authorization]
    Authz -->|Uses| Entitlement[EntitlementDecisionProvider]

    TauriIPC -->|Invokes| AI[Phase 6.3 AI Orchestration Boundary]

    Domain --> DB[(SQLite Persistence)]
    Authz --> DB
    AI -.-> DB
```

### 18.2 ER / Persistence Diagram
```mermaid
erDiagram
    Article ||--o{ ChecklistItem : has
    WorkflowStage ||--o{ Article : assigned_to
    Category ||--o{ Article : categorized_as
    ChecklistTemplate
```
*Note: `items_json` is an attribute aggregate inside `ChecklistTemplate`. Applying a template creates independent `ChecklistItem` rows for an `Article`. There is no relational FK from existing article `ChecklistItem`s back to the template.*

### 18.3 Entitlement State Diagram
```mermaid
stateDiagram-v2
    [*] --> Unknown

    Unknown --> ProActive
    Unknown --> FreeConfirmed

    FreeConfirmed --> ProActive : valid production PRO entitlement established

    ProActive --> ProTemporarilyUnverifiable
    ProActive --> FreeConfirmed

    ProTemporarilyUnverifiable --> ProActive
    ProTemporarilyUnverifiable --> ProUnavailable
    ProTemporarilyUnverifiable --> FreeConfirmed : ONLY on confirmed no-PRO/downgrade

    ProUnavailable --> ProActive
    ProUnavailable --> FreeConfirmed : ONLY on confirmed no-PRO/downgrade

    note right of FreeConfirmed
      Normal Free-to-PRO conversion path. Does not prescribe how entitlement is purchased or verified.
    end note
```

### 18.4 Protected Mutation Sequence Diagram
```mermaid
sequenceDiagram
    participant UI as React UX
    participant IPC as Tauri IPC
    participant Native as Native Authz
    participant Ent as EntitlementDecisionProvider
    participant DB as SQLite

    UI->>IPC: mutate_stage(payload)
    IPC->>Native: Invoke mutation
    Native->>Ent: check_entitlement()
    Ent-->>Native: EntitlementState

    alt is ProActive or ProTemporarilyUnverifiable
        Native->>DB: Apply mutation
        DB-->>Native: Success
        Native-->>UI: Result
    else is FreeConfirmed
        Native-->>UI: Err_ConfirmedFreeProtectedMutationDenial
    else is Unknown or ProUnavailable
        Native-->>UI: Err_EntitlementUnavailable / Unknown Denial
    end
```

## 19. Traceability Matrix

| PRD Requirement | SDD Section | Governing ADR | Planned Spec Artifact |
| --- | --- | --- | --- |
| FR-WF-001..004 | 4. Dynamic Workflow-Stage Domain Model | ADR-009 | Runtime Schemas, SQLite Schema |
| FR-WF-MIN-001 | 4. Business Rules | ADR-009 | Business Rules, Error Payloads |
| FR-CAT-001 | 7. Standard Categories vs Custom PRO Categories | ADR-010 | SQLite Schema |
| FR-CHK-001 | 8.3 Checklist Templates | ADR-010 | SQLite Schema, IPC Payloads |
| FR-CHK-002 | 8.3 Checklist Templates | ADR-010 | Business Rules |
| FR-AI-001 | 5. Workflow Semantic Classification | ADR-008, ADR-009 | Business Rules, TS/Rust Types |
| FR-DOWN-001 | 14. Downgrade vs Temporary Unverifiability | ADR-011 | Entitlement State Machine |
| FR-DOWN-002 | 14. Downgrade vs Temporary Unverifiability | ADR-011 | IPC Payload Specs |
| FR-ENT-001 | 13. PRO Authorization Boundary | ADR-011, ADR-012 | EntitlementDecisionProvider Spec |

## 20. Testing Strategy
Ensure final implementation explicitly includes:
- Workflow-domain unit tests.
- Category safety tests.
- Checklist-template copy/isolation tests.
- AI recommendation regression tests.
- Rust authoritative evidence-validation regression tests.
- IPC protected-mutation authorization tests.
- Direct IPC bypass tests.
- Entitlement state transition tests.
- Unknown behavior tests.
- ProUnavailable behavior tests.
- Temporary-unverifiability behavior tests.
- Downgrade preservation tests.
- Migration exact legacy-value tests.
- Unknown legacy-value migration failure test (fails closed).
- Migration recovery/backup tests.
- Release-build `DEVELOPER_PREMIUM` exclusion test.

## 21. Production Entitlement Architecture (ADR-012)
ADR-012 selected the **Hybrid Local-First Entitlement Grant with optional online refresh / revocation capability** architectural family.

*Historical context: We evaluated purely local (Option A) and predominantly external (Option B) families, but selected Option C to provide the most resilient local-first experience while preserving necessary commercial controls.*

**Implementation Readiness:**
- **ARCHITECTURAL DESIGN:** COMPLETE.
- **CORE PHASE 6.4 DOMAIN / ENFORCEMENT SPECIFICATION:** READY FOR SPEC.
- **CONCRETE COMMERCIAL ENTITLEMENT ADAPTER:** DEFERRED PENDING MECHANISM / PROVIDER DECISIONS.

## 22. SDD-to-Spec Handoff
The SDD decides architecture and design. The subsequent `spec-creator` phase may now formalize:
- UUID-backed domain IDs.
- TypeScript/Rust domain contracts.
- Semantic classification vocabulary.
- SQLite/Drizzle schema.
- Migration contract.
- IPC request/response contracts.
- Authorization matrix.
- Five-state entitlement application state machine.
- Business rules.
- Conceptual EntitlementDecisionProvider boundary.
- Errors.
- Test scaffolding.

**The Spec MUST NOT select:**
- Commercial provider
- Payment provider
- Auth provider
- Concrete entitlement proof format
- Cryptographic algorithm
- Secure-storage product
- Exact freshness duration
- Machine binding
- Revocation protocol
If those become necessary for the concrete production adapter, that adapter remains blocked until separately authorized.

---
🔴 **PHASE 6.4 SOFTWARE DESIGN BASELINE APPROVED BY HUMAN ARCHITECTURE DECISIONS.**
READY FOR TECHNICAL SPECIFICATION OF THE APPROVED DESIGN.
NO IMPLEMENTATION AUTHORIZATION IS IMPLIED.
CONCRETE COMMERCIAL ENTITLEMENT ADAPTER REMAINS DEFERRED PENDING SEPARATE MECHANISM/PROVIDER DECISIONS.
