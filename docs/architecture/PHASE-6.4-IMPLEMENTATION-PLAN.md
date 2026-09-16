# Phase 6.4 Implementation Plan: Hybrid Local-First Entitlement

## 1. Goal Description
Implement the foundational Phase 6.4 local-first hybrid entitlement architecture as specified in the Phase 6.4 SDD, ADR-011, and ADR-012, enforcing boundaries in Rust and UI. 

## 2. Core Constraints
- **Strict Adherence:** The Implementation Plan must explicitly distinguish between what is implementable now (application-level entitlement model) and what is DEFERRED (concrete commercial adapter).
- **No new dependencies** may be added during this task.
- **Legacy Compatibility:** Include a dedicated note on `status = publicado` legacy compatibility and browser/localStorage fallback.

## 3. Implementation Phasing

### Phase A: Database Schema Evolution
- [ ] Migrate `articles` table: map `status` (e.g. `publicado`) to `workflow_stage_id` and `categoryTag` to `category_id`.
- [ ] Map hardcoded stages and categories to relational tables.

### Phase B: Tauri Rust Entitlement Engine
- [ ] Add `FreeConfirmed` / `ProActive` lifecycle states.
- [ ] Add `DEVELOPER_PREMIUM` flag for local debug testing.

### Phase C: Context API & UI Adapter
- [ ] Connect React `EntitlementContext` to `get_entitlements` Rust command.
- [ ] Handle browser fallback (localStorage).

### Phase D: Deferred Commercial Adapter
- **DEFERRED:** External provider selection and integration (Stripe/RevenueCat/LemonSqueezy) are pending separate Human Gate approval.

## 4. Verification Plan
- [ ] Unit tests for Rust state machine (`FreeConfirmed` -> `ProActive`).
- [ ] UI visual verification with `DEVELOPER_PREMIUM`.
- [ ] Legacy migration test for `publicado` articles.
