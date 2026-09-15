---
jinc-spec-version: 1.0.0
project-name: Retranca OS
status: draft
related-branch: docs/phase-6.4-product-access-monetization
tech-stack: Jest, Rust tests, Playwright
created-at: 2026-09-15
last-updated: 2026-09-15
authors: Retranca OS Core Team
---

# Phase 6.4 Test Specification

**PHASE 6.4 — TECHNICAL SPECIFICATION — DRAFT FOR HUMAN REVIEW**
No implementation authorization is implied.

This specification outlines the NON-EXECUTABLE test scenarios required to validate Phase 6.4 functionality, migration safety, and security.

## 1. Domain Tests (UNIT / INTEGRATION)

### TEST-WF-001: Stage Creation
- **Upstream:** FR-WF-001, BR-WF-001
- **Level:** UNIT
- **Precondition:** Entitlement state is ProActive.
- **Action:** Create a new stage with valid display name.
- **Expected Result:** Stage is created with a new UUID and is active.
- **Expected Error:** None.

### TEST-WF-002: Duplicate Stage Name
- **Upstream:** BR-WF-003
- **Level:** UNIT
- **Precondition:** Entitlement state is ProActive. Stage "Idea" exists.
- **Action:** Create or rename a stage to "Idea".
- **Expected Result:** Mutation is rejected.
- **Expected Error:** `Err_InvalidWorkflow`.

### TEST-WF-004: Safe Stage Removal
- **Upstream:** FR-WF-004, BR-WF-006
- **Level:** INTEGRATION
- **Precondition:** Stage X has 2 articles. Entitlement state is ProActive.
- **Action:** Attempt to delete Stage X without providing a fallback stage.
- **Expected Result:** Deletion is rejected.
- **Expected Error:** `Err_UnresolvedStageReference`.

### TEST-WF-005: Last Stage Removal
- **Upstream:** FR-WF-MIN-001, BR-WF-007
- **Level:** UNIT
- **Precondition:** Only 1 active stage exists.
- **Action:** Attempt to delete the stage.
- **Expected Result:** Deletion is rejected.
- **Expected Error:** `Err_LastStageRemoval`.

### TEST-CAT-001: Standard Category Protection
- **Upstream:** BR-CAT-002
- **Level:** UNIT
- **Precondition:** Category "IA" exists with origin "standard".
- **Action:** Attempt to rename or delete "IA".
- **Expected Result:** Mutation is rejected.
- **Expected Error:** `Err_InvalidCategory`.

## 2. Migration Tests (MIGRATION)

### TEST-MIG-001: Exact Legacy Values mapping
- **Upstream:** BR-MIG-001, BR-MIG-002
- **Level:** MIGRATION
- **Precondition:** DB contains articles with statuses `ideia`, `pesquisa`, `escrita`, `revisao`, `publicado` and standard `categoryTag` values.
- **Action:** Run migration.
- **Expected Result:** All articles have correct `workflow_stage_id` and `category_id`. Legacy columns remain. `checklist_items` remain unchanged.

### TEST-MIG-002: Unknown Status / Fails Closed
- **Upstream:** BR-MIG-003
- **Level:** MIGRATION
- **Precondition:** DB contains an article with status `unknown_status`.
- **Action:** Run migration.
- **Expected Result:** Migration transaction rolls back. DB remains exactly as it was.
- **Expected Error:** `Err_MigrationUnknownLegacyValue`.

### TEST-MIG-003: Empty Database
- **Upstream:** BR-MIG-001
- **Level:** MIGRATION
- **Precondition:** DB has zero articles.
- **Action:** Run migration.
- **Expected Result:** Base tables created. Standard stages and categories are bootstrapped. Success.

### TEST-MIG-004: Interrupted Migration & Rerun
- **Upstream:** BR-MIG-001, NFR-DATA-001
- **Level:** MIGRATION
- **Precondition:** Migration is interrupted halfway.
- **Action:** Application restarts and retries migration.
- **Expected Result:** Previous partial transaction rolled back automatically by SQLite. Rerun succeeds fully.

## 3. Entitlement & Security Tests (SECURITY)

### TEST-SEC-001: Release-Build Debug Entitlement Exclusion
- **Upstream:** BR-ENT-SM-001, Threat Model
- **Level:** SECURITY / INTEGRATION
- **Precondition:** Application is compiled in `release` profile. A malicious user injects the `DEVELOPER_PREMIUM` override via environment variable or tampered local config.
- **Action:** The malicious user invokes direct IPC `create_workflow_stage`.
- **Expected Result:** The native authorization check ignores `DEVELOPER_PREMIUM` in release mode. The application evaluates to `Unknown` or `FreeConfirmed`.
- **Expected Error:** `Err_EntitlementStateUnknown` or `Err_ConfirmedFreeProtectedMutationDenial`.

### TEST-SEC-002: Direct IPC Bypass Attempt
- **Upstream:** FR-ENT-001
- **Level:** SECURITY
- **Precondition:** UI is hacked to show PRO buttons even when `FreeConfirmed`.
- **Action:** Direct IPC invocation of `create_category`.
- **Expected Result:** Native handler checks `EntitlementDecisionProvider`, sees `FreeConfirmed`, and rejects.
- **Expected Error:** `Err_ConfirmedFreeProtectedMutationDenial`.

### TEST-DOWN-001: Confirmed Downgrade Protection
- **Upstream:** FR-DOWN-001, BR-DOWN-001
- **Level:** INTEGRATION
- **Precondition:** User created custom stage "Final Edit". State transitions from `ProActive` to `FreeConfirmed`.
- **Action 1:** Read workflow stages.
- **Expected Result 1:** "Final Edit" is still returned.
- **Action 2:** Move article to "Final Edit".
- **Expected Result 2:** Success (Class F command).
- **Action 3:** Rename "Final Edit".
- **Expected Result 3:** Rejected (`Err_ConfirmedFreeProtectedMutationDenial`).

### TEST-OFFLINE-001: Temporary Unverifiability
- **Upstream:** NFR-OFFLINE-001, BR-TEMP-001
- **Level:** INTEGRATION
- **Precondition:** Valid PRO state exists, but network goes down causing `ProTemporarilyUnverifiable`.
- **Action:** Create custom category.
- **Expected Result:** Success. Mutation is allowed.

### TEST-OFFLINE-002: ProUnavailable
- **Upstream:** BR-UNAV-001
- **Level:** INTEGRATION
- **Precondition:** Temporary continuity exhausted, state is `ProUnavailable`.
- **Action:** Create custom category.
- **Expected Result:** Rejected. `Err_EntitlementUnavailable`.

## 4. AI Regression Tests (INTEGRATION)

### TEST-AI-001: Unclassified Stage Action Availability
- **Upstream:** FR-AI-001, BR-AI-004
- **Level:** INTEGRATION
- **Precondition:** Article is in custom stage "Limbo" with NO semantic classification.
- **Action:** Query AI actions for the article.
- **Expected Result:** If the article content has valid evidence for an action (e.g., text exists for proofreading), the action is AVAILABLE. The unclassified stage does NOT disable it.

### TEST-AI-002: Evidence Validation Overrides Semantics
- **Upstream:** BR-AI-004
- **Level:** INTEGRATION
- **Precondition:** Article is empty. Stage is "Drafting" (Semantic = DRAFTING).
- **Action:** Attempt to run Proofread action.
- **Expected Result:** Rust rejects the action because there is no text (Evidence Validation fails). The semantic classification does NOT force the action to be available.

## 5. Gherkin Scenarios (E2E / ACCEPTANCE)

```gherkin
Feature: Safe Stage Removal
  As a PRO user
  I want to remove a workflow stage safely
  So that I don't lose track of articles currently in that stage

  Scenario: Attempting to remove a stage containing articles
    Given I am a PRO user
    And the stage "Fact Checking" contains 3 articles
    When I attempt to delete "Fact Checking" without a fallback
    Then the system should reject the deletion
    And I should see an error indicating unresolved references

  Scenario: Reassigning articles during stage removal
    Given I am a PRO user
    And the stage "Fact Checking" contains 3 articles
    When I attempt to delete "Fact Checking"
    And I select "Drafting" as the fallback stage
    Then "Fact Checking" should be marked inactive
    And the 3 articles should be moved to "Drafting"
```

```gherkin
Feature: Entitlement Downgrade Preservation
  As a user whose PRO entitlement has expired
  I want to keep my custom workflow
  So that my existing editorial process isn't destroyed

  Scenario: Downgrading to Free
    Given I was a PRO user
    And I have a custom stage "Social Media"
    When my entitlement becomes FreeConfirmed
    Then the stage "Social Media" should remain active
    And I should be able to move articles into "Social Media"
    And I should be blocked from creating any new stages
```
