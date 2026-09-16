---
jinc-spec-version: 1.0.1
project-name: Retranca OS
status: draft
related-branch: docs/phase-6.4-product-access-monetization
tech-stack: Tauri, Rust, TypeScript
created-at: 2026-09-15
updated-at: 2026-09-16
---

# Phase 6.4 Implementation Plan

**PHASE 6.4 — IMPLEMENTATION PLAN — DRAFT FOR HUMAN IMPLEMENTATION REVIEW**

## Executive implementation objective
Implement dynamic workflow stages and commercial entitlement states (Free vs Pro) following the Phase 6.4 architecture, cleanly separating semantic recommendation from the structural publication lifecycle role.

## Approved baseline / source of truth
- ADR-009, ADR-010, ADR-011, ADR-012
- Phase 6.4 Software Design Document (SDD)
- Phase 6.4 Technical Specification
- Phase 6.4 Tauri IPC Contracts
- Phase 6.4 Test Specification

## Scope
- Domain and persistence schema migration to relational dynamic workflow and categories.
- Entitlement lifecycle (FreeConfirmed, ProActive) in Rust.
- Secure Tauri IPC boundaries.
- Frontend dynamic integration preserving calendar, stats, and AI.
- Customization UX for Pro users.

## Non-goals
- Selection or integration of a commercial entitlement provider, payment gateway, or auth mechanism.
- Arbitrary UI redesign outside of workflow stage and category management.
- Dropping legacy data.

## Source-reality findings
1. **`publicado`**: Hardcoded in `types/editorial.ts` (`ArticleStatus`) and heavily referenced in UI components (`Sidebar.tsx`, `StatsView.tsx`, `ListView.tsx`, `KanbanBoard.tsx`).
   - `app/page.tsx` currently sets `completedAt` when moving to `publicado`.
   - Leaving `publicado` currently preserves `completedAt`.
   - Publication transition writes history.
   - Entering `publicado` triggers motivational UI.
   - Statistics/published counts and overdue logic depend on current publication status.
2. **`completedAt`**: Exists as an optional string in `Article` interface and `db/schema.ts`, capturing the timestamp when the article moves to a publication lifecycle role.
3. **`publishDate`**: Used extensively (`YYYY-MM-DD`) for scheduling, filtering, and organizing the `CalendarView` and `KanbanBoard` warnings. `publishDate` is not publication lifecycle authority.
4. **Calendar**: `CalendarView.tsx` relies strictly on `publishDate` for positioning. Calendar publication styling/checkmark depends on publication state.
5. **Statistics**: `StatsView.tsx` computes delayed logic based on publication status.
6. **Filters**: Time filtering logic relies on `publishDate` and publication status (located primarily in `app/page.tsx`).
7. **Browser/localStorage Fallback**: A local-storage fallback exists in `lib/storage.ts` storing current Free article data. It is an existing compatibility path, not merely a dev convenience. Plan parity is required for: default stages/categories, stable identities, publication lifecycle role, article transitions, migration/shim from legacy browser data, and Free baseline.
8. **DEVELOPER_PREMIUM**: Already exists in `src-tauri/src/entitlements.rs` behind `#[cfg(debug_assertions)]`. It correctly fails in release builds (`#[cfg(not(debug_assertions))]`). It does not need to be "added", only integrated with the new `ProActive` logic as an accepted mock authorization for local development tests without becoming the production authority.

## Dependency decisions
- **Existing Dependencies**: The repository currently uses `drizzle-orm`, `tauri-plugin-sql`, `serde`, and native Rust capabilities.
- **Stable-ID / UUID**: PROPOSE, but DO NOT install: Rust crate `uuid`. (Minimal capability: UUID v4 generation only). Exact compatible version is to be resolved/locked during Slice 1 after Human Implementation Gate. It must remain compatible with rust-version 1.77.2, with no extra serde/features unless actually required. No dependency is installed during this documentation task. Stable-ID generation occurs at the native/domain creation boundary. Browser fallback may use native browser UUID generation, keeping the same text format.
- **Deferred Provider**: Concrete commercial entitlement provider SDKs (concrete commercial entitlement provider — DEFERRED). No provider has been selected.

## Implementation branch strategy
Create `feat/phase-6.4-implementation` branching from `main`. Slices will be committed atomically.

## Ordered slices 0-8

### SLICE 0 — Foundation & Tools Validation
- **Purpose**: Ensure existing tools, test suites, and CI pass before starting.
- **Upstream requirements**: N/A
- **Dependencies on prior slices**: None.
- **Existing files expected to change**: None.
- **PROPOSED NEW FILES**: None.
- **Responsibility of each affected/new file**: N/A
- **Implementation steps**: Run full test suites locally.
- **Tests to add/update**: None.
- **Actual validation commands**: `npm run lint`, `npm run test`, `npm run lint:rs`, `npm run test:rs`
- **Migration considerations**: None.
- **Security considerations**: Ensure no local env contamination.
- **Accessibility considerations**: None.
- **Browser/localStorage considerations**: None.
- **Expected user-visible effect**: None.
- **Explicit non-goals**: Modifying any code.
- **Exit criteria**: Clean CI run.
- **Stop conditions**: Any failing test blocks progress.
- **Atomic commit boundary**: None.

### SLICE 1 — Domain + Persistence Foundation
- **Purpose**: Upgrade database schema (`db/schema.ts` and `src-tauri` migrations) to support dynamic workflow stages and custom categories. MUST NOT replace/drop legacy `status` and `categoryTag` before safe migration. Creates domain/persistence foundation and EXPAND-compatible structures.
- **Upstream requirements**: ADR-009, ADR-010, SDD Phase 6.4.
- **Dependencies on prior slices**: Slice 0.
- **Existing files expected to change**: `db/schema.ts`, `types/editorial.ts`, `src-tauri/Cargo.toml` (if uuid added).
- **PROPOSED NEW FILES**: `src-tauri/migrations/002_dynamic_workflow.sql`.
- **Responsibility of each affected/new file**: Define new relations, preserve legacy columns for migration window.
- **Implementation steps**:
  - Add `workflow_stages` and `categories` tables.
  - Modify `articles` table to add nullable `workflow_stage_id` and `category_id` (foreign keys) alongside existing `status` and `categoryTag`.
- **Tests to add/update**: DB schema unit tests in Rust.
- **Actual validation commands**: `cargo test --manifest-path src-tauri/Cargo.toml --locked`.
- **Migration considerations**: Ensure new schema can accept legacy data in Slice 2. Creates the expansion required.
- **Security considerations**: Safe schema rollout, no data drops.
- **Accessibility considerations**: None.
- **Browser/localStorage considerations**: None.
- **Expected user-visible effect**: None (backend only).
- **Explicit non-goals**: Data migration.
- **Exit criteria**: Migrations run successfully on a fresh database.
- **Stop conditions**: Migration fails or breaks existing schema tests.
- **Atomic commit boundary**: `feat(db): implement dynamic workflow schema`

### SLICE 2 — Safe Migration
- **Purpose**: Migrate existing legacy records to the new dynamic relational model safely. Performs: backup, expand, backfill, verify, cutover.
- **Upstream requirements**: BR-MIG-001, BR-MIG-002, TEST-MIG-001..012.
- **Dependencies on prior slices**: Slice 1.
- **Existing files expected to change**: `src-tauri/src/models/`, `src-tauri/src/orchestrator.rs`.
- **PROPOSED NEW FILES**: None.
- **Responsibility of each affected/new file**: Execution of migration transactions safely.
- **Implementation steps**:
  - BACKFILL: Insert exact legacy statuses (`ideia` through `publicado`) into `workflow_stages`.
  - MAPPING: Update existing articles to point to the new IDs.
  - VERIFY: Ensure exact matching, no unknown values, exactly one active publication-role stage.
  - CUTOVER: Make new columns required. No destructive cutover before verify.
  - FAIL CLOSED ONLY: If an unknown status is encountered, FAIL CLOSED ONLY.
- **Tests to add/update**: Test `TEST-MIG-001` to `TEST-MIG-012`, plus publication lifecycle migration tests.
- **Actual validation commands**: `cargo test --manifest-path src-tauri/Cargo.toml --locked`.
- **Migration considerations**: Preserve all `checklist_items`. Legacy `publicado` maps to stage with `lifecycle_role = PUBLICATION` preserving Calendar and Stats. Handle postconditions, failure rollback, restart/retry, unknown values failing closed, and the publication-role invariant.
- **Security considerations**: No data loss.
- **Accessibility considerations**: None.
- **Browser/localStorage considerations**: Migration logic here applies to Tauri SQL.
- **Expected user-visible effect**: None.
- **Explicit non-goals**: Modifying frontend components yet.
- **Exit criteria**: Legacy app data loads seamlessly into the new structure.
- **Stop conditions**: Verification step fails, rollback occurs.
- **Atomic commit boundary**: `feat(db): backfill and migrate legacy articles`

### SLICE 3 — Entitlement Application Core
- **Purpose**: Implement the hybrid local-first entitlement states (`FreeConfirmed`, `ProActive`, etc.) in Rust.
- **Upstream requirements**: ADR-011, ADR-012, SDD.
- **Dependencies on prior slices**: None.
- **Existing files expected to change**: `src-tauri/src/entitlements.rs`.
- **PROPOSED NEW FILES**: None.
- **Responsibility of each affected/new file**: Define and validate entitlement domains.
- **Implementation steps**:
  - Update `EntitlementStatus` enum to support the 5 lifecycle states.
  - Update `DEVELOPER_PREMIUM` logic to map to `ProActive` when enabled in debug mode, ensuring it never becomes production authority.
- **Tests to add/update**: State transitions `FreeConfirmed -> ProActive`, Downgrade safe tests, Temporary unverifiability safe tests.
- **Actual validation commands**: `cargo test --manifest-path src-tauri/Cargo.toml --locked`.
- **Migration considerations**: None.
- **Security considerations**: Release builds must strictly reject `DEVELOPER_PREMIUM` overrides (`get_entitlements` must not expose developer premium in release).
- **Accessibility considerations**: None.
- **Browser/localStorage considerations**: None.
- **Expected user-visible effect**: None.
- **Explicit non-goals**: Commercial entitlement provider integration, payment, auth, crypto proof, or revocation protocols.
- **Exit criteria**: Rust logic correctly identifies Free vs Pro states and transitions.
- **Stop conditions**: Entitlement states bleed into release inappropriately.
- **Atomic commit boundary**: `feat(core): implement entitlement state machine`

### SLICE 4 — Native Domain Operations + IPC
- **Purpose**: Enforce authorization boundaries at the IPC level and include FULL approved IPC domain surface.
- **Upstream requirements**: Phase 6.4 IPC Contracts.
- **Dependencies on prior slices**: Slice 1, Slice 3.
- **Existing files expected to change**: `src-tauri/src/orchestrator.rs`, `src-tauri/src/lib.rs`.
- **PROPOSED NEW FILES**: None.
- **Responsibility of each affected/new file**: Expose and protect IPC commands.
- **Implementation steps**:
  - Add Tauri commands for FULL domain surface: workflow reads/mutations, categories, templates, ordinary article stage assignment, ordinary category assignment, template application, protected authorization, ProActive, ProTemporarilyUnverifiable, FreeConfirmed denial, Unknown denial, ProUnavailable denial, direct IPC bypass, publication-role transfer, canonical errors, transaction rollback.
  - Wrap protected commands in entitlement checks (must be `ProActive` or `ProTemporarilyUnverifiable`).
  - Implement the special safe-removal transaction where articles moved to the target remain continuously published, preserving `completedAt`. Do not implement a false publication exit/re-entry cycle.
- **Tests to add/update**: Direct IPC bypass tests (verify IPC rejects unauthorized PRO mutations), assignment semantics tests.
- **Actual validation commands**: `cargo test --manifest-path src-tauri/Cargo.toml --locked`.
- **Migration considerations**: None.
- **Security considerations**: Authorization must occur natively in Rust; UI hiding is insufficient. Direct IPC cannot bypass.
- **Accessibility considerations**: None.
- **Browser/localStorage considerations**: None.
- **Expected user-visible effect**: None (backend only).
- **Explicit non-goals**: Frontend UI adjustments.
- **Exit criteria**: Tauri commands reject PRO actions if entitlement is Free. Protected mutations PERMIT on ProActive/ProTemporarilyUnverifiable, DENY on FreeConfirmed/Unknown/ProUnavailable.
- **Stop conditions**: Any IPC command executes a protected mutation without checking authorization.
- **Atomic commit boundary**: `feat(ipc): secure pro domain operations`

### SLICE 5 — Frontend Dynamic Domain Integration
- **Purpose**: Adapt the React frontend to consume dynamic stages and categories, covering actual affected paths.
- **Upstream requirements**: SDD, IPC Contracts.
- **Dependencies on prior slices**: Slice 1, Slice 2, Slice 4.
- **Existing files expected to change**: `app/page.tsx`, `components/KanbanBoard.tsx`, `components/Sidebar.tsx`, `components/StatsView.tsx`, `components/ListView.tsx`, `components/CalendarView.tsx`, `lib/adapters/articleAdapter.ts`, `lib/storage.ts`.
- **PROPOSED NEW FILES**: None.
- **Responsibility of each affected/new file**: Use dynamic records and new fields (like `lifecycle_role`).
- **Implementation steps**:
  - Refactor components to use dynamic stages instead of hardcoded strings.
  - Map publication-state compatibility to `current stage lifecycle_role === PUBLICATION` (preserving Stats, Calendar visual checks).
  - **Browser Fallback**: Provide a local-storage shim for dynamic stages implementing complete plan parity (identities, roles, migration). Plan a compatible browser representation for workflow stages, categories, lifecycle_role, stable IDs, legacy localStorage migration/shim, article stage/category references. Do not silently preserve only Article.status strings.
- **Tests to add/update**: Vitest unit tests for Kanban column rendering with dynamic stages and `PUBLICATION` role handling, native/browser semantic parity tests.
- **Actual validation commands**: `npm run test`.
- **Migration considerations**: Browser fallback must properly migrate its local storage legacy structures.
- **Security considerations**: None.
- **Accessibility considerations**: Ensure columns maintain ARIA labels.
- **Browser/localStorage considerations**: Shim must properly emulate the relational structure.
- **Expected user-visible effect**: Kanban boards load stages dynamically.
- **Explicit non-goals**: PRO customization UX.
- **Exit criteria**: UI functions normally with dynamic data and correctly maps legacy states.
- **Stop conditions**: UI regression or data loss in browser mode.
- **Atomic commit boundary**: `feat(ui): integrate dynamic workflow stages`

### SLICE 6 — PRO Customization UX
- **Purpose**: Provide the interface for PRO users to modify their workflows.
- **Upstream requirements**: UI/UX Contract, PRD ACs.
- **Dependencies on prior slices**: Slice 3, Slice 5.
- **Existing files expected to change**: `app/page.tsx` (Settings Modal / Views).
- **PROPOSED NEW FILES**: `components/WorkflowEditor.tsx`.
- **Responsibility of each affected/new file**: UI layer for invoking protected IPC commands.
- **Implementation steps**:
  - Create forms for adding/editing workflow stages, custom categories, and checklist templates.
  - UX must preserve exactly-one publication role invariant. Removal workflow explicitly requires target, which receives role atomically.
  - Hide/disable these forms if entitlement is `FreeConfirmed`.
- **Tests to add/update**: UI rendering based on entitlement context (Free vs Pro).
- **Actual validation commands**: `npm run test`.
- **Migration considerations**: None.
- **Security considerations**: UI checks reflect but do not replace native IPC checks.
- **Accessibility considerations**: Keyboard-operable target selection, clear confirmation copy, focus management, error announcement, reorder controls keyboard accessible.
- **Browser/localStorage considerations**: Customization mock works correctly in browser fallback.
- **Expected user-visible effect**: PRO users can edit workflows; Free users see an upgrade prompt.
- **Explicit non-goals**: Actual checkout or billing UI.
- **Exit criteria**: Customization UX is accessible, functional, and entitlement-aware.
- **Stop conditions**: Accessibility violations detected.
- **Atomic commit boundary**: `feat(ui): add workflow customization interface`

### SLICE 7 — Phase 6.3 AI Semantic Integration
- **Purpose**: Ensure Phase 6.3 AI contextual evaluation works with dynamic stages using `semantic_classification`.
- **Upstream requirements**: Phase 6.4 AI Evaluation requirements.
- **Dependencies on prior slices**: Slice 5.
- **Existing files expected to change**: `lib/utils/aiActionEvaluator.ts`.
- **PROPOSED NEW FILES**: None.
- **Responsibility of each affected/new file**: Provide proper AI UX recommendations based on semantics, not lifecycle role.
- **Implementation steps**:
  - Semantic classification maps to recommendation UX only. Validated article evidence provides action availability.
  - Ensure the six Phase 6.3 actions remain fully accessible in the Free baseline.
  - Rust serves as authoritative evidence validation. Lifecycle role provides no AI action availability authority.
- **Tests to add/update**: AI evaluation tests with custom stages and regression tests.
- **Actual validation commands**: `npm run test`.
- **Migration considerations**: None.
- **Security considerations**: None.
- **Accessibility considerations**: None.
- **Browser/localStorage considerations**: Must work seamlessly in fallback.
- **Expected user-visible effect**: AI suggestions remain accurate across custom workflow stages and do not regress.
- **Explicit non-goals**: Altering AI prompts or models.
- **Exit criteria**: AI suggestions perform perfectly with custom stages.
- **Stop conditions**: AI actions incorrectly blocked on Free.
- **Atomic commit boundary**: `feat(ai): map dynamic stages to ai evaluators`

### SLICE 8 — Integration / Security / Release Hardening
- **Purpose**: Final lockdown and verification.
- **Upstream requirements**: Security NFRs.
- **Dependencies on prior slices**: All prior slices.
- **Existing files expected to change**: Entire workspace (via tests).
- **PROPOSED NEW FILES**: None.
- **Responsibility of each affected/new file**: Passing full suite.
- **Implementation steps**:
  - Verify release profile (`npm run test:rs:release`) rigorously blocks `DEVELOPER_PREMIUM`.
  - Validate all data migrations, unknown legacy migrations failing closed only, and checklist history preservation.
- **Tests to add/update**: E2E or full system verification tests.
- **Actual validation commands**: Full CI pipeline run (`npm run lint`, `npm run test`, `npm run lint:rs`, `npm run test:rs`, `npm run test:rs:release`). No Jest or Playwright invented.
- **Migration considerations**: Final check.
- **Security considerations**: Release build hardening.
- **Accessibility considerations**: Final automated check.
- **Browser/localStorage considerations**: Run frontend tests to ensure shim is intact.
- **Expected user-visible effect**: Stable release.
- **Explicit non-goals**: New feature work.
- **Exit criteria**: All tests pass natively and in release configuration.
- **Stop conditions**: Fail if any hardcoded legacy reference breaks compilation or if `DEVELOPER_PREMIUM` leaks to release.
- **Atomic commit boundary**: `chore: release hardening and e2e validation`

## Migration and recovery sequencing
Backup -> Expand -> Backfill -> Verify -> Cutover. If Verify fails, the transaction rolls back gracefully. Unknown values fail closed safely, preventing data loss.

## Security enforcement sequencing
IPC boundary locks down structural mutations natively in Rust first, prior to UI updates. ProActive or ProTemporarilyUnverifiable permits; FreeConfirmed, Unknown, ProUnavailable denies.

## Frontend integration sequencing
Frontend adapts to dynamic reads before customization UI is exposed, guaranteeing read compatibility precedes mutation capability.

## AI regression sequencing
AI semantics update follows frontend integration, ensuring exactly the 6 Free AI actions remain universally available regardless of Pro structural configuration.

## Accessibility verification
Keyboard-operable target selection, focus management, error announcement, and reordering accessibility verified during Customization UX (Slice 6).

## CI / release-build verification
Full suite verification includes `npm run test:rs:release` ensuring mock `DEVELOPER_PREMIUM` is excluded from production binaries.

## Rollback / recovery rules
All native database mutations use transactions. Failure during migration, stage removal, or publication-role transfer results in atomic rollback.

## Global stop conditions
- Missing migration targets or unknown values.
- Direct IPC bypass succeeds.
- Six Free AI actions incorrectly blocked.
- Production release accepts DEVELOPER_PREMIUM.
- Multiple or zero ACTIVE publication roles exist.

## Human gates
- **GATE A**: Human Implementation Plan Approval. (Required BEFORE creating implementation branch or changing source).
- **GATE B**: Post-implementation technical/security review. (Required before PR readiness).
- **GATE C**: Human Merge Authorization. (Required before merge).
- **GATE D**: Release/tag authorization if later requested.

## Final Definition of Done
- all 12 FRs satisfied.
- all 3 NFRs satisfied.
- all 11 ACs satisfied.
- exactly one active publication role exists.
- semantic PUBLISHED is independent from publication lifecycle.
- safe role transfer implemented.
- completedAt compatibility preserved.
- publishDate independence maintained.
- migration of known values succeeds.
- unknown values fail closed.
- checklist history preserved.
- workflow customization works.
- categories work.
- checklist templates work.
- downgrade is safe.
- temporary unverifiability is safe.
- Free -> PRO application transition covered.
- direct IPC cannot bypass authorization.
- release DEVELOPER_PREMIUM cannot grant production PRO.
- six Phase 6.3 AI actions remain Free.
- Rust evidence remains authoritative.
- browser/localStorage parity preserved.
- frontend validation passes.
- Rust validation passes.
- commercial entitlement adapter remains deferred.
