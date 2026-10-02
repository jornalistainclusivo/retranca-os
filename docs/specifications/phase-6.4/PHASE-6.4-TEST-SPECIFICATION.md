---
jinc-spec-version: 1.1.0
project-name: Retranca OS
status: approved
related-branch: docs/phase-6.4-product-access-monetization
tech-stack: Vitest, Rust cargo test, Tauri/Rust integration/security testing
created-at: 2026-09-15
last-updated: 2026-10-02
authors: Retranca OS Core Team
---

# Phase 6.4 Test Specification

## Local AI settings keyboard entry corrective — 2026-10-02

- **TEST-AI-SETTINGS-FOCUS-001:** With page dialogs closed, the single collapsed local-settings trigger is early in natural DOM/tab order, named **Configuração de IA local**, enabled and visibly focused; no positive tabindex or duplicated trigger. Enter/Space opens the panel and focuses the labelled model selector; Escape returns focus to the trigger, with Tab continuing to page controls. An active native modal keeps background settings outside its interactive scope. Actual layout rendering and compiled-browser interactions passed; current desktop/NVDA retest remains separate. See [focused validation](../../testing/PHASE-6.4-MODEL-PROVISIONING-UI-VALIDATION.md#subsequent-corrective--collapsed-local-ai-settings-trigger).

## Model provisioning UI acceptance delta — 2026-10-02

| ID | Criterion | Evidence boundary |
| --- | --- | --- |
| TEST-PROVISION-UI-001 | Actual component renders a named native dialog and close control in all displayed states, nothing when READY/closed; initial heading focus and boundary Tab/Shift+Tab/Escape work. | Rendering plus isolated compiled-browser keyboard checks; desktop/NVDA pending. |
| TEST-PROVISION-UI-002 | No non-desktop download/readiness simulation; clear error, retry and close. Native completion awaits fresh preflight and retains Rust provider selection. | Actual browser non-Tauri recovery plus mocked IPC ordering/Ollama selection/failure tests; actual download not performed. |
| TEST-PROVISION-UI-003 | Verification subscriptions are released on success/failure; progress disposal handles late registration and ignores stale/invalid values. | Deferred/malformed mocked event cases; actual native event timing remains untested. |
| TEST-PROVISION-UI-004 | Notice closes without cancelling download, explains keeping the app open, exposes labelled progress/text and respects reduced motion. Notice controls remain usable at 320 CSS px. | Actual markup/compiled CSS and sampled browser width; real download, reduced-motion setting, reader/whole-app QA pending. |

Executed results and the three desktop checks subsequently reported passing by the owner: [model provisioning UI validation](../../testing/PHASE-6.4-MODEL-PROVISIONING-UI-VALIDATION.md). Preserve those and prior accepted CMS/AI/import scripts; the later local-settings trigger retest is separate. This does not close full Gate B or packaged-engine acceptance.

## Local article import acceptance delta — ADR-015, 2026-10-02

| ID | Criterion | Evidence boundary |
| --- | --- | --- |
| TEST-IMPORT-001 | Add new articles while preserving every existing-ID field/relation; repeated import adds no duplicates. | Frontend/file-backed native tests and subsequent owner-reported desktop acceptance recorded. |
| TEST-IMPORT-002 | Reject malformed/duplicate/oversized input before storage/IPC writes; native boundary revalidates. | Parser/native tests use synthetic data only. |
| TEST-IMPORT-003 | Reject unknown/inactive new references, invalid ownership and occupied scoped IDs without partial writes. | Native tests including late SQLite trigger failure/whole-batch rollback. |
| TEST-IMPORT-004 | Reopen file-backed DB with distinct Unicode/full text and intact relations; no schema change. | Disposable SQLx DB, not actual owner DB. |
| TEST-IMPORT-005 | Native routing bypasses browser writes; committed import/readback failure has truthful message. | IPC/API regressions; actual desktop readback still manual. |
| TEST-IMPORT-006 | Named keyboard-operable controls, status/error messages, retry same file and visible file controls on small screens. | Implementer browser observations; desktop/NVDA/keyboard chooser/reflow remain pending. |
| TEST-RUNTIME-PATH-001 | Resolve fixed canonical sibling with spaces; reject missing/directory/relative paths and outside symlink. | Windows path fixtures and subsequent exact-source Linux CI passed. Does not test a real inference engine. |

Current executed counts, partial security coverage and three-step AntiGravity script: [local import validation](../../testing/PHASE-6.4-LOCAL-IMPORT-VALIDATION.md). Preserve historical counts and owner acceptance below.

## Slice 8 resumption acceptance delta — 2026-10-02

The existing accessibility and real-model requirements apply to the narrow UI follow-up; no new product access, persistence or provider decision is introduced.

- **TEST-A11Y-LOADING-001:** Article-list loading exposes a textual status; its decorative spinner is excluded from the accessibility tree. Its spin and both AI dialogs' decorative pulses stop under reduced-motion preference. Generation status remains textual. Source/build evidence and actual desktop/NVDA/preference observations must be distinguished.
- **TEST-AI-LABEL-001:** The footer does not advertise a hardcoded obsolete provider/model or assert verified accessibility conformance. Actual model selection remains in local AI controls.
- **TEST-AI-DESKTOP-001:** Exercise each of the six editorial actions separately through the Tauri application with the owner's installed `gemma4:latest`. Record model tag, action, supplied evidence, completion/failure/cancellation and human output-quality observation. Availability, mocked transport and successful CI alone are insufficient. Preserve prior accepted smoke checks rather than silently replacing them with these unexecuted cases.
- **TEST-CONTENT-008:** Two newly created articles, including same-millisecond creation, have independent article/checklist/history identities. New/custom/template CMS items must not reuse global relation IDs across articles.
- **TEST-CONTENT-009:** Native-proxy save resolves new/legacy conflicting relation IDs before writes, preserves existing article-owned/native history IDs and another article's data, and retries a partially saved draft without duplicating history. Candidate-ID conflicts, wrong owners and duplicate inputs reject before metadata updates/checklist deletion. Isolated SQL evidence and actual desktop retest are separate; multi-step save is not claimed to be transactional.
- **TEST-AI-LABEL-002:** Research Gaps remains available with valid evidence but no **Recomendado** suffix, as requested by the owner. Other actions' recommendation behavior and native prerequisites remain unchanged.

Current script, baseline CI and evidence limits: [Slice 8 resumption validation](../../testing/PHASE-6.4-SLICE-8-RESUMPTION-VALIDATION.md). The owner reported all six AI options working and subsequently reported the three corrective CMS save/isolation/restart checks as passing (`1 OK, 2 OK, 3 OK`, 2026-10-02). Record these as owner functional observations. They do not establish remaining NVDA/reduced-motion checks, detailed AI quality evaluation, independent Gate B or current-source remote CI.

## Article CMS content acceptance delta — ADR-014

The owner's decision to save full text with each article adds the following criteria. The initial application-close response only unblocked compilation. The owner later reported the three supplied checks as passing (`1 OK; 2 OK; 3 OK`, 2026-10-01) and authorized continued development. Record functional acceptance as owner-reported evidence; actual database/backup files were not inspected by the agent. Additional migrations and commit/push require separate authorization.

| ID | Criterion | Current evidence / remaining work |
| --- | --- | --- |
| **TEST-CONTENT-001** | Two article IDs retain distinct full texts; another article with missing/empty content remains empty. Own content drives AI prerequisites. | Adapter, real modal markup and browser storage tests; implementer isolated-browser A/B save/reload observations. Owner check 1 reported as passing. |
| **TEST-CONTENT-002** | Explicit save persists raw text; reopening the same article discards unsaved edits. Clearing and saving one article cannot clear another. Visual descriptions remain article-scoped/session-only. | Implementer browser isolation/reload observations; owner checks 2/3 reported as passing. |
| **TEST-CONTENT-003** | File-backed native migration creates a readable version-1 backup, preserves metadata/checklist/history, defaults legacy text empty, reopens distinct Unicode/multiline texts and is idempotent under concurrent calls. | Four native integration tests in debug/release, including two simultaneous migration callers and one backup. Owner restart check passed as reported; actual schema/backup not inspected. |
| **TEST-CONTENT-004** | Partial/future schemas and backup failures cannot rewrite content or perform the content-schema upgrade. Workflow validation rejects unknown versions. | Native temporary-database rejection tests; frontend workflow migration accepts known version 2 and rejects version 3. |
| **TEST-CONTENT-005** | Initialization is shared; a migration failure rejects and permits retry. SQL/storage write failures propagate instead of claiming success. The dialog retains edits and presents an accessible save error. | Driver mocks and browser quota regression tests pass. Actual desktop error announcements/NVDA remain pending. |
| **TEST-CONTENT-006** | Reserved article IDs cannot select inherited visual drafts. Nonstring imported content rejects before replacing existing storage; malformed existing runtime content cannot crash the modal. Missing legacy and valid string content remain usable. | Six real-modal markup regressions, four invalid-import storage regressions and valid/legacy import coverage pass. JSON collection import into desktop SQLite remains outside this corrective. |
| **TEST-CONTENT-007** | A closed/replaced save session cannot close another dialog or publish stale error/loading callbacks. Form editing is disabled while saving; closing does not promise rollback of an existing write. | Six deferred-write callback tests pass. Actual desktop driver-delay/error-announcement observations remain pending. |

Executed results, recovery limits and the three owner checks: [article content validation](../../testing/PHASE-6.4-ARTICLE-CONTENT-VALIDATION.md). [ADR-014](../../decisions/ADR-014-ARTICLE-CMS-CONTENT-PERSISTENCE.md) amends the schema-1-only/body-persistence deferral; existing AI safety/domain criteria remain active.

## Current acceptance delta — ADR-013

Commercial entitlement transition/authorization-denial tests, confirmed-downgrade restrictions, and developer-premium release authority tests are retired. They MUST NOT block or count as current open-edition acceptance coverage.

Replace them with TEST-OPEN-001/002/003 from ADR-013: direct native access to all ten structural commands without an entitlement provider; open UI/AI/runtime-setting entry points in normal builds; and unchanged schema, domain, reference, publication, rollback, and template-copy guarantees. TEST-AI-001/002 and all unchanged persistence/migration/lifecycle tests still apply. Runtime/provider prerequisites remain mandatory.

Current evidence: [Slice 8 integration/hardening checkpoint](../../testing/PHASE-6.4-SLICE-8-HARDENING-VALIDATION.md); saved baseline: [Slice 7 / open-edition validation](../../testing/PHASE-6.4-SLICE-7-OPEN-EDITION-VALIDATION.md). The original suite below is retained for traceability, subject to this explicit replacement of commercial criteria.

### Slice 8 regression checks

- **TEST-AI-CANCEL-001:** Native registry cancellation closes an in-flight HTTP stream before acknowledgement, emits no later tokens, rejects duplicate active IDs and tolerates unknown/completed IDs. Cancellation during model lookup/setup must also interrupt the same task. Server/GPU shutdown is not a requirement or a claimed result.
- **TEST-AI-STREAM-001:** Split UTF-8 and a final completion record without newline survive; malformed/provider-error/truncated streams cannot report success.
- **TEST-AI-SESSION-001:** Cancel waits for native start acknowledgement; canceled preparation cannot later dispatch. Late subscriptions after close are released, provider errors remain retryable and obsolete job events cannot update a reopened dialog. Controller unit tests and real desktop acceptance are recorded separately.
- **TEST-A11Y-DIALOG-001:** Assistant/article expose named modal dialogs, place initial focus, exclude background controls, close with Escape and restore invoker focus, including article writing mode. Focus after a canceled generation and actual NVDA announcements require desktop checks. Browser evidence alone is not full WCAG conformance.

Current results and a three-check owner script: [Slice 8 cancellation/focus validation](../../testing/PHASE-6.4-SLICE-8-CANCELLATION-FOCUS-VALIDATION.md). The earlier manual three-check approval does not establish this subsequent round's acceptance.

- **TEST-INT-HEADER-001:** Publication metrics follow the current stage lifecycle role, regardless of legacy status, stage name/order, or `PUBLISHED` semantic classification. Unresolved stage IDs do not grant publication.
- **TEST-INT-SEMANTIC-001:** Native creation and browser create/update reject values outside the five-value semantic vocabulary with `ERR_INVALID_SEMANTIC_CLASSIFICATION`, preserving prior state. Null remains valid; omitted updates preserve classification.
- **TEST-INT-NAME-001:** UI validation rejects duplicate active names but permits reuse of inactive stage/category names.
- **TEST-AI-RENDER-001:** Both AI result consumers use the shared text renderer. Inline, reference, and relative Markdown images preserve description text without image/preload elements; raw HTML and unsafe link schemes remain inactive. Explicit safe links remain available. This is rendering coverage, not proof of live-model prompt-injection resistance or observed exfiltration.

> **2026-09-30 amendment — open single edition:** [ADR-013](../../decisions/ADR-013-OPEN-SINGLE-EDITION.md) supersedes the commercial Free/PRO access policy and ADR-011/012. All implemented customization and editorial capabilities are open to everyone, without account, subscription, activation, entitlement verification, or developer premium. Native domain validation, data preservation, and Rust AI evidence/runtime requirements remain mandatory. Older commercial clauses below are historical and MUST NOT drive current implementation or acceptance.


**PHASE 6.4 — TECHNICAL SPECIFICATION — RE-APPROVED BY HUMAN SPEC GATE**

SPEC APPROVAL DOES NOT BY ITSELF AUTHORIZE IMPLEMENTATION.
IMPLEMENTATION REQUIRES THE SEPARATE HUMAN IMPLEMENTATION PLAN GATE.

This specification outlines the NON-EXECUTABLE test scenarios required to validate Phase 6.4.

## 1. Domain Tests (UNIT / INTEGRATION)

### Workflow Stage Domain
- **TEST-WF-001 (Create Stage):** [FR-WF-002, BR-WF-001]
  - Precondition: `ProActive`. Action: Create valid stage. Result: Created with new UUID. Error: None.
- **TEST-WF-002 (Rename Stage):** [AC-WF-001, BR-WF-001, BR-WF-002]
  - Precondition: `ProActive`. Action: Rename existing stage. Result: Name updated.
- **TEST-WF-003 (Reorder Stages):** [FR-WF-004, BR-WF-004]
  - Precondition: `ProActive`. Action: Submit valid reorder array. Result: `order_index` updated atomically.
- **TEST-WF-004 (Blocked Remove - References):** [AC-WF-002, BR-WF-006]
  - Precondition: `ProActive`. Stage X has 2 articles. Action: Delete X without `reassign_to_stage_id`. Result: Rejected. Error: `ERR_UNRESOLVED_STAGE_REFERENCE`.
- **TEST-WF-005 (Last Stage Rejection):** [AC-WF-003, BR-WF-007]
  - Precondition: 1 active stage. Action: Delete. Result: Rejected. Error: `ERR_LAST_STAGE_REMOVAL`.
- **TEST-WF-006 (Explicit Atomic Reassignment):** [FR-WF-003, BR-WF-006]
  - Precondition: Stage X has 2 articles. Action: Delete X with `reassign_to_stage_id` = Y. Result: Articles move to Y, X is soft-deleted.
- **TEST-WF-007 (Duplicate Normalized Name):** [BR-NORM-001]
  - Precondition: Stage "Idea " exists. Action: Create " IDEA ". Result: Rejected. Error: `ERR_INVALID_WORKFLOW`.
- **TEST-WF-008 (Unclassified Stage):** [BR-WF-001]
  - Precondition: None. Action: Create stage with `null` semantic classification. Result: Success.
- **TEST-WF-009 (Invalid Semantic Classification):** [BR-AI-001]
  - Precondition: `ProActive`. Action: Attempt stage create/update with `semantic_classification = "INVALID"`. Result: Mutation rejected with `ERR_INVALID_SEMANTIC_CLASSIFICATION` and no partial persistence.

### Publication Lifecycle Domain
- **TEST-PUB-001 (Fresh/default workflow):** [BR-WF-PUB-001] Exactly one active PUBLICATION role exists upon initialization.
- **TEST-PUB-002 (Migration):** [BR-WF-PUB-001, BR-WF-PUB-002, BR-MIG-001] Legacy `publicado` seeded/mapped stage has `semantic_classification = PUBLISHED` AND `lifecycle_role = PUBLICATION`.
- **TEST-PUB-003 (Independence):** [BR-WF-PUB-002] A stage with `semantic_classification = PUBLISHED` and `lifecycle_role = null` does NOT cause publication lifecycle effects.
- **TEST-PUB-004 (Reverse independence):** [BR-WF-PUB-002, BR-WF-PUB-004] A stage with `lifecycle_role = PUBLICATION` and `semantic_classification = null` DOES cause publication lifecycle effects.
- **TEST-PUB-005 (Entry):** [BR-WF-PUB-004] Moving from non-publication to publication role sets `completedAt`, changes `updatedAt`, and records history.
- **TEST-PUB-006 (Exit):** [BR-WF-PUB-005] Moving from publication to non-publication leaves article not currently published; `completedAt` is preserved.
- **TEST-PUB-007 (Re-entry):** [BR-WF-PUB-004] Re-entering a publication-role stage sets a new `completedAt` entry timestamp.
- **TEST-PUB-008 (Idempotent same-stage assignment):** [BR-WF-PUB-006] Re-assigning to the same stage performs no timestamp/history duplication.
- **TEST-PUB-009 (Publication-role removal without target):** [BR-WF-PUB-003] Attempting to remove the publication-role stage without an explicit target is rejected with `ERR_PUBLICATION_ROLE_INVARIANT`.
- **TEST-PUB-010 (Role transfer):** [BR-WF-PUB-001, BR-WF-PUB-003] Role transfer provides target active/distinct; article reassignment + role transfer + source deactivation are atomic; exactly one active PUBLICATION remains.
- **TEST-PUB-011 (Failed role transfer):** [BR-WF-PUB-001, BR-WF-PUB-003] If any part of role transfer fails, the whole transaction rolls back.
- **TEST-PUB-012 (Stats):** [Publication lifecycle compatibility rules] Published counts and overdue exclusion follow lifecycle role, not semantic PUBLISHED.
- **TEST-PUB-013 (Calendar):** [Publication lifecycle compatibility rules] `publishDate` still controls date placement; publication visual state follows lifecycle role.
- **TEST-PUB-014 (AI):** [BR-WF-PUB-002, BR-AI-003, BR-AI-004] Semantic classification controls recommendation only; lifecycle role does NOT change evidence availability.
- **TEST-PUB-015 (Browser fallback):** [Publication lifecycle parity contract] Browser/localStorage fallback mirrors native lifecycle semantics.
- **TEST-PUB-016 (Create assignment blocked):** [BR-WF-PUB-007] Arbitrary stage create cannot assign `lifecycle_role`.
- **TEST-PUB-017 (Update mutation blocked):** [BR-WF-PUB-007] Ordinary `update_workflow_stage` cannot mutate `lifecycle_role`.
- **TEST-PUB-018 (Multiple role invariant):** [BR-WF-PUB-001, BR-WF-PUB-007] Attempt to produce two active PUBLICATION roles fails with `ERR_PUBLICATION_ROLE_INVARIANT`.
- **TEST-PUB-019 (Zero role invariant):** [BR-WF-PUB-001, BR-WF-PUB-007] Operation that would leave zero active PUBLICATION roles fails with `ERR_PUBLICATION_ROLE_INVARIANT`.
- **TEST-PUB-020 (Inactive target invariant):** [BR-WF-PUB-003, BR-WF-PUB-007] Publication-role transfer to inactive target fails with `ERR_PUBLICATION_ROLE_INVARIANT` and rolls back.
- **TEST-PUB-021 (Self target invariant):** [BR-WF-PUB-003, BR-WF-PUB-007] Publication-role transfer to source itself fails with `ERR_PUBLICATION_ROLE_INVARIANT` and rolls back.
- **TEST-PUB-022 (Transfer continuity):** [BR-WF-PUB-003, BR-WF-PUB-005] Structural publication-role transfer preserves `completedAt` for affected articles.

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
  - Action: Rename existing template via `update_checklist_template`. Result: Saved successfully.
- **TEST-CHK-003 (Item Mutations):** [FR-CHK-002, BR-CHK-001]
  - Action: Edit an existing template via `update_checklist_template` to perform exactly four operations: add a new item, edit an existing item's label, remove an item, and reorder items. Result: Saved successfully. The expected final ordered list must exactly match the submitted mutation. No arbitrary checklist taxonomy/category is introduced.
- **TEST-CHK-004 (Applied Copy Isolation):** [AC-CHK-001, BR-CHK-002]
  - Action: Edit and delete template after applying to an article. Result: The article's checklist items remain completely unaffected.

## 2. Entitlement & Security Tests (SECURITY)

- **TEST-SEC-001 (Release DEVELOPER_PREMIUM Exclusion):** [Threat Model, ADR-011, ADR-012, authorization business rules]
  - Level: SECURITY (Must run on Release build).
  - Precondition: App compiled in `release` configuration.
  - Action 1: User invokes exposed direct call to `set_developer_premium(true)`. Result: Call is rejected in release.
  - Action 2: User calls `get_entitlements()`. Result: Does NOT report `DEVELOPER_PREMIUM` active. Developer override cannot establish production PRO.
  - Action 3: User invokes Class P mutation `create_workflow_stage` via direct IPC. Result: Command still requires production entitlement decision and is DENIED absent valid PRO. Error: `ERR_CONFIRMED_FREE_PRO_MUTATION_DENIED` or `ERR_ENTITLEMENT_STATE_UNKNOWN`.
- **TEST-SEC-002 (Direct IPC Bypass Attempt):** [Threat Model, ADR-011, ADR-012, authorization business rules]
  - Action: Invoke `create_category` directly while `FreeConfirmed`. Result: Rejected. Error: `ERR_CONFIRMED_FREE_PRO_MUTATION_DENIED`.

## 3. Entitlement State Tests (INTEGRATION)

- **TEST-ENT-001 (Valid Unknown Transitions):** [BR-ENT-SM-002]
  - Action: Transition `Unknown` -> `ProActive`. Result: Allowed.
  - Action: Transition `Unknown` -> `FreeConfirmed`. Result: Allowed.
- **TEST-ENT-002 (Valid ProActive Transitions):** [BR-ENT-SM-002]
  - Action: Transition `ProActive` -> `ProTemporarilyUnverifiable`. Result: Allowed.
  - Action: Transition `ProActive` -> `FreeConfirmed` (with explicit confirmed no-PRO evidence). Result: Allowed.
- **TEST-ENT-003 (Prohibited Transitions to FreeConfirmed):** [BR-ENT-SM-002]
  - Action: Transition `ProTemporarilyUnverifiable` -> `FreeConfirmed` without confirmed no-PRO/downgrade evidence. Result: Prohibited/Denied.
  - Action: Transition `ProUnavailable` -> `FreeConfirmed` without confirmed no-PRO/downgrade evidence. Result: Prohibited/Denied.
- **TEST-ENT-004 (Valid ProTemporarilyUnverifiable & ProUnavailable Transitions):** [BR-ENT-SM-002]
  - Action: Transition `ProTemporarilyUnverifiable` -> `ProActive`. Result: Allowed.
  - Action: Transition `ProTemporarilyUnverifiable` -> `ProUnavailable`. Result: Allowed.
  - Action: Transition `ProTemporarilyUnverifiable` -> `FreeConfirmed` with confirmed downgrade. Result: Allowed.
  - Action: Transition `ProUnavailable` -> `ProActive`. Result: Allowed.
  - Action: Transition `ProUnavailable` -> `FreeConfirmed` with confirmed downgrade. Result: Allowed.
- **TEST-ENT-005 (ProTemporarilyUnverifiable Allow & First-Launch Logic):** [AC-ENT-001, FR-ENT-001, BR-TEMP-001, BR-ENT-SM-002]
  - Action 1 (Prohibited Transition): First launch, no previous PRO evidence, offline. State `Unknown`. Attempt transition `Unknown` -> `ProTemporarilyUnverifiable` merely because verification is unavailable. Result: Denied (must have credible previous PRO).
  - Precondition: current entitlement verification/refresh becomes temporarily unavailable after credible previously-valid PRO was established. State becomes `ProTemporarilyUnverifiable`.
  - Action 2: Class P mutation while `ProTemporarilyUnverifiable`. Result: Success.
- **TEST-ENT-006 (Mutation Authorization Denials):** [BR-DOWN-003, BR-UNAV-001]
  - Action 1: Class P mutation while `FreeConfirmed`. Result: `ERR_CONFIRMED_FREE_PRO_MUTATION_DENIED`.
  - Action 2: Class P mutation while `ProUnavailable`. Result: `ERR_ENTITLEMENT_UNAVAILABLE`.
- **TEST-ENT-007 (FreeConfirmed -> ProActive Transition):** [BR-ENT-SM-002]
  - Precondition: `FreeConfirmed`. Action: A valid production PRO entitlement is established. Result: Transition to `ProActive` is Allowed. (Must not be triggered by UI state alone or DEVELOPER_PREMIUM override).

## 4. Phase 6.3 AI Regression Tests (INTEGRATION)

- **TEST-AI-001 (Valid Evidence in Unclassified Stage):** [AC-AI-001, BR-AI-003, BR-AI-004]
  - Precondition: Article has valid evidence for `editorial_review`. Stage has `null` semantic classification.
  - Action: Query action availability. Result: `editorial_review` is AVAILABLE.
- **TEST-AI-002 (Rust Evidence Failure):** [AC-AI-001, BR-AI-004]
  - Precondition: Article is empty (no text). Stage semantic is `REVIEW`.
  - Action: Query action availability. Result: `editorial_review` is UNAVAILABLE because content evidence fails Rust validation.

## 5. Free Baseline Tests (INTEGRATION)

- **TEST-FREE-001 (Standard Functionality):** [AC-FREE-001]
  - Precondition: Fresh/default Free installation/configuration with `FreeConfirmed`.
  - Action: Verify standard five workflow stages are available/functioning; eight standard categories are available/functioning; ordinary editorial use remains available.
  - Verification: Moving an article to an EXISTING publication-role stage is an ordinary Free editorial operation. PRO entitlement is required to alter STRUCTURAL configuration, not to publish/move an article within an existing workflow.
  - AI Verification: Verify the 6 Phase 6.3 AI actions (`research_gaps`, `plain_language`, `validate_inclusivity`, `generate_alt_text`, `generate_seo`, `editorial_review`) receive NO PRO entitlement denial. Existing Phase 6.3 evidence/provider/runtime requirements still apply. The test proves entitlement does not artificially restrict existing Free capabilities.
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
    And I select "Drafting" as the explicit reassignment target
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

## 8. Downgrade tests (INTEGRATION)

- **TEST-DOWN-001 (Confirmed downgrade preservation):** [AC-DOWN-001, FR-DOWN-001, BR-DOWN-001, BR-DOWN-002]
  - Precondition: previously PRO; custom workflow/category/template/article data exists. Transition: `ProActive` -> `FreeConfirmed` with confirmed no-PRO/downgrade evidence.
  - Expected: articles preserved; custom workflow preserved; custom categories preserved; checklist templates preserved; article checklist history preserved; ordinary editorial use of preserved structures continues; no silent reset/remap/deletion.
- **TEST-DOWN-002 (Confirmed Free blocks new PRO configuration mutations):** [AC-DOWN-002, FR-DOWN-002, BR-DOWN-003]
  - Precondition: `FreeConfirmed`.
  - Attempt: create a new stage/category/template or another protected new PRO configuration change.
  - Expected: `ERR_CONFIRMED_FREE_PRO_MUTATION_DENIED`. Existing data/configuration remains intact.

## 9. UX / Data Integrity Validation
- **TEST-UI-001 (A11y Contract):** [NFR-A11Y-001]
  - Action: Use keyboard navigation to order items and focus buttons. Result: passes the Phase 6.4 specified keyboard, focus-management, ordering and screen-reader interaction contract.
- **TEST-DATA-001 (Referential Integrity Check):** [NFR-DATA-001]
  - Action: Attempt to bypass application validation to directly delete a referenced stage via raw IPC parameters (without atomic reassignment). Result: Application transaction blocks it and `ON DELETE RESTRICT` physically enforces it.
- **TEST-OFFLINE-001 (Temporary Unverifiability Offline Logic):** [NFR-OFFLINE-001]
  - Action: current entitlement verification/refresh becomes temporarily unavailable after credible previously-valid PRO was established. Ensure state is `ProTemporarilyUnverifiable` and local configuration data is neither lost nor blocked from usage.
