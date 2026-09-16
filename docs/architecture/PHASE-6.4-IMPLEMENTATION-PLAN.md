# PHASE 6.4 — IMPLEMENTATION PLAN — DRAFT FOR HUMAN IMPLEMENTATION REVIEW

NO IMPLEMENTATION AUTHORIZATION IS IMPLIED.

## 1. Source-Reality Review & Findings

1. **`publicado`**: Hardcoded in `types/editorial.ts` (`ArticleStatus`) and heavily referenced in UI components (`Sidebar.tsx`, `StatsView.tsx`, `ListView.tsx`, `KanbanBoard.tsx`) to determine metrics, specifically identifying completed vs active/delayed articles.
2. **`completedAt`**: Exists as an optional string in `Article` interface and `db/schema.ts`, capturing the timestamp when the article moves to a terminal state.
3. **`publishDate`**: Used extensively (`YYYY-MM-DD`) for scheduling, filtering, and organizing the `CalendarView` and `KanbanBoard` warnings (Hoje, Atrasado).
4. **Calendar**: `CalendarView.tsx` relies strictly on `publishDate` matching the specific calendar cell date.
5. **Statistics**: `StatsView.tsx` computes delayed logic (`publishDate < today` AND `status !== 'publicado'`).
6. **Filters**: `TimeFilter` relies on `publishDate` and `status` to group by `hoje`, `semana`, `mes`, and `atrasados`.
7. **Browser/localStorage Fallback**: Documented as a development/web fallback in `lib/storage.ts`. It initializes with `ALL_INITIAL_ARTICLES`. It is clearly a non-Tauri dev fallback, and dynamic stage/category migration must provide a shim or default mapping when running in the browser without Tauri IPC.
8. **DEVELOPER_PREMIUM**: Already exists in `src-tauri/src/entitlements.rs` behind `#[cfg(debug_assertions)]`. It correctly fails in release builds (`#[cfg(not(debug_assertions))]`). It does not need to be "added", only integrated with the new `ProActive` logic as an accepted mock authorization for local development tests without becoming the production authority.

## 2. Dependency Decisions

**DEPENDENCY DECISIONS**
- **Existing Dependencies**: The repository currently uses `drizzle-orm`, `tauri-plugin-sql`, `serde`, and native Rust capabilities.
- **Stable-ID / UUID**: No new crates (`uuid`) will be added on the Rust side unless absolutely necessary, but `crypto.randomUUID()` natively available in the browser/Node will be used on the frontend. We prefer zero new dependencies.
- **Deferred Provider**: Concrete commercial entitlement provider SDKs (e.g., Stripe, RevenueCat) are strictly DEFERRED.

## 3. Required Implementation Slices

### SLICE 0 — Implementation Preflight
- **Purpose**: Verify base repository health before changing domain models.
- **Existing files to change**: None.
- **Implementation steps**: Run linting and test suites.
- **Tests**: None.
- **Validation**: `npm run lint`, `npm run test`, `npm run lint:rs`, `npm run test:rs`.
- **Exit criteria**: Clean CI run.

### SLICE 1 — Domain + Persistence Foundation
- **Purpose**: Upgrade database schema (`db/schema.ts` and `src-tauri` migrations) to support dynamic workflow stages and custom categories.
- **Upstream requirements**: ADR-009, ADR-010.
- **Dependencies**: Slice 0.
- **Files expected to change**: `db/schema.ts`, `types/editorial.ts`, `src-tauri/migrations/`.
- **PROPOSED NEW FILES**: `src-tauri/migrations/002_dynamic_workflow.sql`.
- **Implementation steps**:
  - Add `workflow_stages` and `categories` tables.
  - Modify `articles` table to use `workflow_stage_id` and `category_id` (foreign keys) instead of `status` and `categoryTag`.
- **Tests to add**: DB schema unit tests in Rust.
- **Validation**: `cargo test --manifest-path src-tauri/Cargo.toml --locked`.
- **Migration**: Ensure new schema can accept legacy data in Slice 2.
- **Expected user-visible effect**: None (backend only).
- **Exit criteria**: Migrations run successfully on a fresh database.
- **Atomic commit**: `feat(db): implement dynamic workflow schema`

### SLICE 2 — Safe Migration
- **Purpose**: Migrate existing legacy records to the new dynamic relational model safely.
- **Dependencies**: Slice 1.
- **Files expected to change**: `src-tauri/src/models/`, `src-tauri/src/orchestrator.rs`.
- **Implementation steps**:
  - BACKFILL: Insert exact legacy statuses (`ideia` through `publicado`) into `workflow_stages`.
  - MAPPING: Update existing articles to point to the new IDs.
  - FAIL CLOSED: If an unknown status is encountered, do not map it; leave as invalid or fail the startup migration safely without dropping data. No article orphaning.
- **Tests to add**: Test `TEST-MIG-005` (legacy `publicado` backfills correctly).
- **Validation**: `cargo test --manifest-path src-tauri/Cargo.toml --locked`.
- **Migration Considerations**: Preserve all `checklist_items`. Legacy `publicado` must map to a terminal stage preserving Calendar and Stats.
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
- **Purpose**: Enforce authorization boundaries at the IPC level.
- **Dependencies**: Slice 1, Slice 3.
- **Files expected to change**: `src-tauri/src/orchestrator.rs`, `src-tauri/src/lib.rs`.
- **Implementation steps**:
  - Add Tauri commands for CRUD on custom stages and categories.
  - Wrap these commands in entitlement checks (must be `ProActive`).
- **Tests to add**: Direct IPC bypass tests (verify IPC rejects unauthorized PRO mutations).
- **Security**: Authorization must occur natively in Rust; UI hiding is insufficient.
- **Exit criteria**: Tauri commands reject PRO actions if entitlement is Free.
- **Atomic commit**: `feat(ipc): secure pro domain operations`

### SLICE 5 — Frontend Dynamic Domain Integration
- **Purpose**: Adapt the React frontend to consume dynamic stages and categories.
- **Dependencies**: Slice 1, Slice 2, Slice 4.
- **Files expected to change**: `lib/adapters/articleAdapter.ts`, `components/KanbanBoard.tsx`, `components/Sidebar.tsx`, `components/StatsView.tsx`, `components/ListView.tsx`.
- **Implementation steps**:
  - Refactor components to use dynamic stages instead of hardcoded strings.
  - Preserve `publicado` lifecycle: map the terminal stage concept to preserve UI behavior (Stats `atrasados` logic and Calendar logic).
  - **Browser Fallback**: Provide a local-storage shim for dynamic stages using `ALL_INITIAL_ARTICLES` structure to keep web development functional.
- **Tests to add**: Vitest unit tests for Kanban column rendering with dynamic stages and `publicado` equivalent handling.
- **Accessibility**: Ensure drag-and-drop columns maintain ARIA labels.
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
  - Hide/disable these forms if entitlement is `FreeConfirmed`.
- **Tests to add**: UI rendering based on entitlement context (Free vs Pro).
- **Expected user-visible effect**: PRO users can edit workflows; Free users see an upgrade prompt.
- **Exit criteria**: Customization UX is accessible, functional, and entitlement-aware.
- **Atomic commit**: `feat(ui): add workflow customization interface`

### SLICE 7 — Phase 6.3 AI Semantic Integration
- **Purpose**: Ensure Phase 6.3 AI contextual evaluation works with dynamic stages.
- **Dependencies**: Slice 5.
- **Files expected to change**: `lib/utils/aiActionEvaluator.ts`.
- **Implementation steps**:
  - Map dynamic stage metadata to AI action availability.
  - Ensure the six Phase 6.3 actions remain fully accessible in the Free baseline.
- **Tests to add**: AI evaluation tests with custom stages and regression tests.
- **Exit criteria**: AI suggestions remain accurate across custom workflow stages and do not regress.
- **Atomic commit**: `feat(ai): map dynamic stages to ai evaluators`

### SLICE 8 — Integration / Security / Release Hardening
- **Purpose**: Final lockdown and verification.
- **Dependencies**: All prior slices.
- **Implementation steps**:
  - Verify release profile (`npm run test:rs:release`) rigorously blocks `DEVELOPER_PREMIUM`.
  - Validate all data migrations, unknown legacy migrations failing closed, and checklist history preservation.
- **Validation**: Full CI pipeline run (`npm run lint`, `npm run test`, `npm run lint:rs`, `npm run test:rs:release`).
- **Stop conditions**: Fail if any hardcoded legacy reference breaks compilation or if `DEVELOPER_PREMIUM` leaks to release.
- **Exit Criteria**: All tests pass natively and in release configuration.
- **Atomic commit**: `chore: release hardening and e2e validation`

## 4. Human Gates

- **GATE A**: Human Implementation Plan Approval. (Required BEFORE creating implementation branch or changing source).
- **GATE B**: Post-implementation technical/security review. (Required before PR readiness).
- **GATE C**: Human Merge Authorization. (Required before merge).
- **GATE D**: Release/tag authorization if later requested.
