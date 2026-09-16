# PHASE 6.4 — IMPLEMENTATION PLAN — DRAFT FOR HUMAN IMPLEMENTATION REVIEW

NO IMPLEMENTATION AUTHORIZATION IS IMPLIED.

## 1. Source-Reality Review & Findings

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
6. **Filters**: `TimeFilter` relies on `publishDate` and publication status.
7. **Browser/localStorage Fallback**: A local-storage fallback exists in `lib/storage.ts` storing current Free article data. It is an existing compatibility path, not merely a dev convenience. Plan parity is required for: default stages/categories, stable identities, publication lifecycle role, article transitions, migration/shim from legacy browser data, and Free baseline.
8. **DEVELOPER_PREMIUM**: Already exists in `src-tauri/src/entitlements.rs` behind `#[cfg(debug_assertions)]`. It correctly fails in release builds (`#[cfg(not(debug_assertions))]`). It does not need to be "added", only integrated with the new `ProActive` logic as an accepted mock authorization for local development tests without becoming the production authority.

## 2. Dependency Decisions

**DEPENDENCY DECISIONS**
- **Existing Dependencies**: The repository currently uses `drizzle-orm`, `tauri-plugin-sql`, `serde`, and native Rust capabilities.
- **Stable-ID / UUID**: PROPOSE, but DO NOT install: Rust crate `uuid`. (Minimal capability: UUID v4 generation only). Exact compatible version is to be resolved/locked during Slice 1 after Human Implementation Gate. It must remain compatible with rust-version 1.77.2, with no extra serde/features unless actually required. No dependency is installed during this documentation task. Stable-ID generation occurs at the native/domain creation boundary. Browser fallback may use native browser UUID generation, keeping the same text format.
- **Deferred Provider**: Concrete commercial entitlement provider SDKs (concrete commercial entitlement provider — DEFERRED). No provider has been selected.

## 3. Required Implementation Slices

### SLICE 0 — Implementation Preflight
- **Purpose**: Verify base repository health before changing domain models.
- **Existing files to change**: None.
- **Implementation steps**: Run linting and test suites.
- **Tests**: None.
- **Validation**: `npm run lint`, `npm run test`, `npm run lint:rs`, `npm run test:rs`.
- **Exit criteria**: Clean CI run.

### SLICE 1 — Domain + Persistence Foundation
- **Purpose**: Upgrade database schema (`db/schema.ts` and `src-tauri` migrations) to support dynamic workflow stages and custom categories. MUST NOT replace/drop legacy `status` and `categoryTag` before safe migration. Creates domain/persistence foundation and EXPAND-compatible structures.
- **Upstream requirements**: ADR-009, ADR-010.
- **Dependencies**: Slice 0.
- **Files expected to change**: `db/schema.ts`, `types/editorial.ts`, `src-tauri/migrations/`.
- **PROPOSED NEW FILES**: `src-tauri/migrations/002_dynamic_workflow.sql`.
- **Implementation steps**:
  - Add `workflow_stages` and `categories` tables.
  - Modify `articles` table to add nullable `workflow_stage_id` and `category_id` (foreign keys) alongside existing `status` and `categoryTag`.
- **Tests to add**: DB schema unit tests in Rust.
- **Validation**: `cargo test --manifest-path src-tauri/Cargo.toml --locked`.
- **Migration**: Ensure new schema can accept legacy data in Slice 2.
- **Expected user-visible effect**: None (backend only).
- **Exit criteria**: Migrations run successfully on a fresh database.
- **Atomic commit**: `feat(db): implement dynamic workflow schema`

### SLICE 2 — Safe Migration
- **Purpose**: Migrate existing legacy records to the new dynamic relational model safely. Performs: backup, expand, backfill, verify, cutover.
- **Dependencies**: Slice 1.
- **Files expected to change**: `src-tauri/src/models/`, `src-tauri/src/orchestrator.rs`.
- **Implementation steps**:
  - BACKFILL: Insert exact legacy statuses (`ideia` through `publicado`) into `workflow_stages`.
  - MAPPING: Update existing articles to point to the new IDs.
  - VERIFY: Ensure exact matching, no unknown values, exactly one active publication-role stage.
  - CUTOVER: Make new columns required. No destructive cutover before verify.
  - FAIL CLOSED ONLY: If an unknown status is encountered, FAIL CLOSED ONLY.
- **Tests to add**: Test `TEST-MIG-005` (legacy `publicado` backfills correctly).
- **Validation**: `cargo test --manifest-path src-tauri/Cargo.toml --locked`.
- **Migration Considerations**: Preserve all `checklist_items`. Legacy `publicado` maps to stage with `lifecycle_role = PUBLICATION` preserving Calendar and Stats.
- **Exit criteria**: Legacy app data loads seamlessly into the new structure.
- **Atomic commit**: `feat(db): backfill and migrate legacy articles`

### SLICE 3 — Entitlement Application Core
- **Purpose**: Implement the hybrid local-first entitlement states (`FreeConfirmed`, `ProActive`, etc.) in Rust.
- **Upstream requirements**: ADR-011, ADR-012, Phase 6.4 SDD.
- **Dependencies**: None.
- **Files expected to change**: `src-tauri/src/entitlements.rs`.
- **Implementation steps**:
  - Update `EntitlementStatus` enum to support the 5 lifecycle states.
  - Update `DEVELOPER_PREMIUM` logic to map to `ProActive` when enabled in debug mode, ensuring it never becomes production authority.
- **BLOCKED**: Concrete commercial entitlement provider integration, payment, auth, crypto proof, or revocation protocols (SEPARATE HUMAN COMMERCIAL ENTITLEMENT GATE).
- **Tests to add**: State transitions `FreeConfirmed -> ProActive`, Downgrade safe tests, Temporary unverifiability safe tests.
- **Validation**: `npm run test:rs`.
- **Security**: Release builds must strictly reject `DEVELOPER_PREMIUM` overrides (`get_entitlements` must not expose developer premium in release).
- **Exit criteria**: Rust logic correctly identifies Free vs Pro states and transitions.
- **Atomic commit**: `feat(core): implement entitlement state machine`

### SLICE 4 — Native Domain Operations + IPC
- **Purpose**: Enforce authorization boundaries at the IPC level and include FULL approved IPC domain surface.
- **Dependencies**: Slice 1, Slice 3.
- **Files expected to change**: `src-tauri/src/orchestrator.rs`, `src-tauri/src/lib.rs`.
- **Implementation steps**:
  - Add Tauri commands for FULL domain surface: workflow stages, categories, checklist templates, ordinary article operations, protected structural mutations, safe stage/category removal, publication-role transfer, canonical errors, direct IPC authorization.
  - Wrap protected commands in entitlement checks (must be `ProActive` or `ProTemporarilyUnverifiable`).
- **Tests to add**: Direct IPC bypass tests (verify IPC rejects unauthorized PRO mutations).
- **Security**: Authorization must occur natively in Rust; UI hiding is insufficient.
- **Exit criteria**: Tauri commands reject PRO actions if entitlement is Free.
- **Atomic commit**: `feat(ipc): secure pro domain operations`

### SLICE 5 — Frontend Dynamic Domain Integration
- **Purpose**: Adapt the React frontend to consume dynamic stages and categories, covering actual affected paths.
- **Dependencies**: Slice 1, Slice 2, Slice 4.
- **Files expected to change**: `app/page.tsx`, `components/KanbanBoard.tsx`, `components/Sidebar.tsx`, `components/StatsView.tsx`, `components/ListView.tsx`, `components/CalendarView.tsx`, `components/TimeFilter.tsx`, `lib/adapters/articleAdapter.ts`, `lib/storage.ts`.
- **Implementation steps**:
  - Refactor components to use dynamic stages instead of hardcoded strings.
  - Map publication-state compatibility to `current stage lifecycle_role === PUBLICATION` (preserving Stats, Calendar visual checks).
  - **Browser Fallback**: Provide a local-storage shim for dynamic stages implementing complete plan parity (identities, roles, migration).
- **Tests to add**: Vitest unit tests for Kanban column rendering with dynamic stages and `PUBLICATION` role handling.
- **Accessibility**: Ensure columns maintain ARIA labels.
- **Expected user-visible effect**: Kanban boards load stages dynamically.
- **Exit criteria**: UI functions normally with dynamic data and correctly maps legacy states.
- **Atomic commit**: `feat(ui): integrate dynamic workflow stages`

### SLICE 6 — PRO Customization UX
- **Purpose**: Provide the interface for PRO users to modify their workflows.
- **Dependencies**: Slice 3, Slice 5.
- **Files expected to change**: `app/page.tsx` (Settings Modal / Views).
- **PROPOSED NEW FILES**: `components/WorkflowEditor.tsx`.
- **Implementation steps**:
  - Create forms for adding/editing workflow stages, custom categories, and checklist templates.
  - UX must preserve exactly-one publication role invariant. Removal workflow explicitly requires target, which receives role atomically.
  - Hide/disable these forms if entitlement is `FreeConfirmed`.
- **Tests to add**: UI rendering based on entitlement context (Free vs Pro).
- **Expected user-visible effect**: PRO users can edit workflows; Free users see an upgrade prompt.
- **Accessibility**: Keyboard-operable target selection, clear confirmation copy, focus management, error announcement, reorder controls keyboard accessible.
- **Exit criteria**: Customization UX is accessible, functional, and entitlement-aware.
- **Atomic commit**: `feat(ui): add workflow customization interface`

### SLICE 7 — Phase 6.3 AI Semantic Integration
- **Purpose**: Ensure Phase 6.3 AI contextual evaluation works with dynamic stages using `semantic_classification`.
- **Dependencies**: Slice 5.
- **Files expected to change**: `lib/utils/aiActionEvaluator.ts`.
- **Implementation steps**:
  - Semantic classification maps to recommendation UX only. Validated article evidence provides action availability.
  - Ensure the six Phase 6.3 actions remain fully accessible in the Free baseline.
  - Rust serves as authoritative evidence validation. Lifecycle role provides no AI action availability authority.
- **Tests to add**: AI evaluation tests with custom stages and regression tests.
- **Exit criteria**: AI suggestions remain accurate across custom workflow stages and do not regress.
- **Atomic commit**: `feat(ai): map dynamic stages to ai evaluators`

### SLICE 8 — Integration / Security / Release Hardening
- **Purpose**: Final lockdown and verification.
- **Dependencies**: All prior slices.
- **Implementation steps**:
  - Verify release profile (`npm run test:rs:release`) rigorously blocks `DEVELOPER_PREMIUM`.
  - Validate all data migrations, unknown legacy migrations failing closed only, and checklist history preservation.
- **Validation**: Full CI pipeline run (`npm run lint`, `npm run test`, `npm run lint:rs`, `npm run test:rs`, `npm run test:rs:release`). No Jest or Playwright invented.
- **Stop conditions**: Fail if any hardcoded legacy reference breaks compilation or if `DEVELOPER_PREMIUM` leaks to release.
- **Exit Criteria**: All tests pass natively and in release configuration.
- **Atomic commit**: `chore: release hardening and e2e validation`

## 4. Human Gates

- **GATE A**: Human Implementation Plan Approval. (Required BEFORE creating implementation branch or changing source).
- **GATE B**: Post-implementation technical/security review. (Required before PR readiness).
- **GATE C**: Human Merge Authorization. (Required before merge).
- **GATE D**: Release/tag authorization if later requested.
