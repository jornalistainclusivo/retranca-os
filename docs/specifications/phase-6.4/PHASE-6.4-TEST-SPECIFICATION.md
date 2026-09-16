---
jinc-spec-version: 1.0.1
project-name: Retranca OS
status: draft
related-branch: docs/phase-6.4-product-access-monetization
tech-stack: Vitest, Rust cargo test, Tauri/Rust integration/security testing
created-at: 2026-09-15
last-updated: 2026-09-15
authors: Retranca OS Core Team
---

# Phase 6.4 Test Specification

**PHASE 6.4 — TECHNICAL SPECIFICATION — DRAFT FOR HUMAN REVIEW**
No implementation authorization is implied.

This specification outlines the NON-EXECUTABLE test scenarios required to validate Phase 6.4.

## 1. Domain Tests (UNIT / INTEGRATION)

### Workflow Stage Domain
- **TEST-WF-001 (Create Stage):** [AC-WF-001, BR-WF-001]
  - Precondition: `ProActive`. Action: Create valid stage. Result: Created with new UUID. Error: None.
- **TEST-WF-002 (Rename Stage):** [AC-WF-001, BR-WF-001]
  - Precondition: `ProActive`. Action: Rename existing stage. Result: Name updated.
- **TEST-WF-003 (Reorder Stages):** [AC-WF-002, BR-WF-004]
  - Precondition: `ProActive`. Action: Submit valid reorder array. Result: `order_index` updated atomically.
- **TEST-WF-004 (Blocked Remove - References):** [AC-WF-003, BR-WF-006]
  - Precondition: `ProActive`. Stage X has 2 articles. Action: Delete X without `reassign_to_stage_id`. Result: Rejected. Error: `ERR_UNRESOLVED_STAGE_REFERENCE`.
- **TEST-WF-005 (Last Stage Rejection):** [AC-WF-003, BR-WF-007]
  - Precondition: 1 active stage. Action: Delete. Result: Rejected. Error: `ERR_LAST_STAGE_REMOVAL`.
- **TEST-WF-006 (Explicit Atomic Reassignment):** [AC-WF-003, BR-WF-006]
  - Precondition: Stage X has 2 articles. Action: Delete X with `reassign_to_stage_id` = Y. Result: Articles move to Y, X is soft-deleted.
- **TEST-WF-007 (Duplicate Normalized Name):** [BR-NORM-001]
  - Precondition: Stage "Idea " exists. Action: Create " IDEA ". Result: Rejected. Error: `ERR_INVALID_WORKFLOW`.
- **TEST-WF-008 (Unclassified Stage):** [BR-WF-001]
  - Precondition: None. Action: Create stage with `null` semantic classification. Result: Success.

### Category Domain
- **TEST-CAT-001 (Create & Rename Custom):** [AC-CAT-001, BR-CAT-001, BR-CAT-002]
  - Precondition: `ProActive`. Action: Create category "Custom", rename to "Custom 2". Result: Success, origin = 'custom'.
- **TEST-CAT-002 (Safe Remove & Atomic Reassignment):** [AC-CAT-001, BR-CAT-002]
  - Action: Delete referenced custom category with reassignment target. Result: Articles reassigned, category soft-deleted.
- **TEST-CAT-003 (Standard Category Preservation):** [BR-CAT-002]
  - Action: Delete 'standard' origin category. Result: Rejected. Error: `ERR_INVALID_CATEGORY`.

### Checklist Template Domain
- **TEST-CHK-001 (Create & Apply Template):** [AC-CHK-001, BR-CHK-001, BR-CHK-002]
  - Action: Create template, then apply to an article. Result: Created successfully; article gets copies of items with new `checklist_items` IDs, `completed = false`.
- **TEST-CHK-002 (Rename Template):** [AC-CHK-001, BR-CHK-001]
  - Action: Rename existing template. Result: Saved successfully.
- **TEST-CHK-003 (Item Mutations):** [AC-CHK-001, BR-CHK-001]
  - Action: Edit an existing template to add a new item, remove an item, and reorder items. Result: Saved successfully. Template structure matches mutation exactly.
- **TEST-CHK-004 (Applied Copy Isolation):** [AC-CHK-001, BR-CHK-002]
  - Action: Edit and delete template after applying to an article. Result: The article's checklist items remain completely unaffected.

## 2. Entitlement & Security Tests (SECURITY)

- **TEST-SEC-001 (Release DEVELOPER_PREMIUM Exclusion):** [AC-ENT-001, Threat Model]
  - Level: SECURITY (Must run on Release build).
  - Precondition: App compiled in `release` configuration.
  - Action 1: User invokes exposed direct call to `set_developer_premium(true)`. Result: Call is rejected in release.
  - Action 2: User calls `get_entitlements()`. Result: Does NOT report `DEVELOPER_PREMIUM` active. Developer override cannot establish production PRO.
  - Action 3: User invokes Class P mutation `create_workflow_stage` via direct IPC. Result: Command still requires production entitlement decision and is DENIED absent valid PRO. Error: `ERR_CONFIRMED_FREE_PRO_MUTATION_DENIED` or `ERR_ENTITLEMENT_STATE_UNKNOWN`.
- **TEST-SEC-002 (Direct IPC Bypass Attempt):** [AC-ENT-001, Threat Model]
  - Action: Invoke `create_category` directly while `FreeConfirmed`. Result: Rejected. Error: `ERR_CONFIRMED_FREE_PRO_MUTATION_DENIED`.

## 3. Entitlement State Tests (INTEGRATION)

- **TEST-ENT-001 (Valid Upgrade Transition):** [BR-ENT-SM-002]
  - Action: Transition `Unknown` -> `ProActive`. Result: Allowed.
- **TEST-ENT-002 (Valid Downgrade Transition):** [BR-ENT-SM-002]
  - Action: Transition `ProActive` -> `FreeConfirmed` (with explicit confirmed no-PRO evidence). Result: Allowed.
- **TEST-ENT-003 (First-launch offline remains Unknown):** [BR-ENT-SM-002]
  - Action: First launch, no previous PRO evidence, offline. Result: State `Unknown`. Mutation denied. Does NOT become `ProTemporarilyUnverifiable`.
- **TEST-ENT-004 (FreeConfirmed Denial):** [BR-DOWN-003]
  - Action: Class P mutation while `FreeConfirmed`. Result: `ERR_CONFIRMED_FREE_PRO_MUTATION_DENIED`.
- **TEST-ENT-005 (ProTemporarilyUnverifiable Allow):** [AC-ENT-001, BR-TEMP-001]
  - Precondition: Explicit previously-valid PRO evidence exists but current check fails due to offline. State becomes `ProTemporarilyUnverifiable`.
  - Action: Class P mutation while `ProTemporarilyUnverifiable`. Result: Success.
- **TEST-ENT-006 (ProUnavailable Denial):** [BR-UNAV-001]
  - Action: Class P mutation while `ProUnavailable`. Result: `ERR_ENTITLEMENT_UNAVAILABLE`.
- **TEST-OFFLINE-001 (Temporary Unverifiability Offline Logic):** [NFR-OFFLINE-001]
  - Action: Simulate offline after PRO. Ensure state is `ProTemporarilyUnverifiable` and local configuration data is neither lost nor blocked from usage.

## 4. Phase 6.3 AI Regression Tests (INTEGRATION)

- **TEST-AI-001 (Valid Evidence in Unclassified Stage):** [AC-AI-001, BR-AI-003, BR-AI-004]
  - Precondition: Article has valid evidence for `editorial_review`. Stage has `null` semantic classification.
  - Action: Query action availability. Result: `editorial_review` is AVAILABLE.
- **TEST-AI-002 (Rust Evidence Failure):** [AC-AI-001, BR-AI-004]
  - Precondition: Article is empty (no text). Stage semantic is `REVIEW`.
  - Action: Query action availability. Result: `editorial_review` is UNAVAILABLE because content evidence fails Rust validation.

## 5. Free Baseline Tests (INTEGRATION)

- **TEST-FREE-001 (Free AI Actions):** [AC-FREE-001, BR-AI-004]
  - Precondition: `FreeConfirmed`.
  - Action: Query availability of the 6 Phase 6.3 actions (`research_gaps`, `plain_language`, `validate_inclusivity`, `generate_alt_text`, `generate_seo`, `editorial_review`).
  - Result: Free state introduces NO PRO entitlement denial for those six actions, while existing Phase 6.3 evidence/runtime rules still apply.
- **TEST-FREE-002 (Contextual Discoverability):** [AC-FREE-002, UI/UX Contract]
  - Action: Verify PRO features are visibly identified contextually (e.g., locks) without obstructing the ordinary Free editorial flow.

## 6. Migration Test Vectors (MIGRATION)

- **TEST-MIG-001 (Exact Legacy Mapping `ideia`):** [BR-MIG-001] Legacy `ideia` backfills to the IDEA standard stage UUID.
- **TEST-MIG-002 (Exact Legacy Mapping `pesquisa`):** [BR-MIG-001] Legacy `pesquisa` backfills correctly.
- **TEST-MIG-003 (Exact Legacy Mapping `escrita`):** [BR-MIG-001] Legacy `escrita` backfills correctly.
- **TEST-MIG-004 (Exact Legacy Mapping `revisao`):** [BR-MIG-001] Legacy `revisao` backfills correctly.
- **TEST-MIG-005 (Exact Legacy Mapping `publicado`):** [BR-MIG-001] Legacy `publicado` backfills correctly.
- **TEST-MIG-006 (Exact Legacy 8 Categories):** [BR-MIG-001] All 8 legacy standard `categoryTag` values map to bootstrapped standard category UUIDs.
- **TEST-MIG-007 (Empty DB):** [BR-MIG-001] Empty DB creates tables and bootstraps standard entities successfully.
- **TEST-MIG-008 (Multiple articles sharing stage/category):** [BR-MIG-001] Many articles with same legacy status correctly resolve to the exact same single UUID reference.
- **TEST-MIG-009 (Existing checklist_items preserved):** [BR-MIG-001] Migration runs, `checklist_items` table is untouched and data is perfectly preserved.
- **TEST-MIG-010 (Unknown status fails closed):** [BR-MIG-002] Article has status `limbo`. Migration FAILS CLOSED (`ERR_MIGRATION_UNKNOWN_LEGACY_VALUE`). DB untouched.
- **TEST-MIG-011 (Unknown category fails closed):** [BR-MIG-002] Article has category `random`. Migration FAILS CLOSED.
- **TEST-MIG-012 (Interruption & Retry):** [BR-MIG-003] Simulate power loss halfway. Restart. SQLite rolls back partial transaction. Rerun succeeds.

## 7. Tool-Neutral Acceptance Scenarios (E2E)

```gherkin
Feature: Safe Stage Removal
  As a PRO user
  I want to remove a workflow stage safely
  So that I don't lose track of articles currently in that stage

  Scenario: Reassigning articles during stage removal
    Given I am a PRO user
    And the stage "Fact Checking" contains 3 articles
    When I attempt to delete "Fact Checking"
    And I select "Drafting" as the fallback stage
    Then "Fact Checking" should be marked inactive (soft-deleted)
    And the 3 articles should be moved to "Drafting" atomically
```

```gherkin
Feature: Entitlement Downgrade Preservation
  As a user whose PRO entitlement has expired
  I want to keep my custom workflow
  So that my existing editorial process isn't destroyed

  Scenario: Downgrading to Free [AC-DOWN-001, AC-DOWN-002]
    Given I was a PRO user
    And I have a custom stage "Social Media"
    When my entitlement becomes FreeConfirmed
    Then the stage "Social Media" should remain active
    And I should be able to move articles into "Social Media"
    And I should be blocked from creating any new stages
```

## 8. UX / Data Integrity Validation
- **TEST-UI-001 (A11y Contract):** [NFR-A11Y-001]
  - Action: Use keyboard navigation to order items and focus buttons. Result: Fully accessible and compliant.
- **TEST-DATA-001 (Referential Integrity Check):** [NFR-DATA-001]
  - Action: Attempt to bypass application validation to directly delete a referenced stage via raw IPC parameters (without atomic reassignment). Result: Application transaction blocks it and `ON DELETE RESTRICT` physically enforces it.
