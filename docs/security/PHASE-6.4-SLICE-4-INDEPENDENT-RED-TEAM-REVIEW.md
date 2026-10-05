# Phase 6.4 Slice 4 Independent Red-Team Review

Review target:
aec7511165c963f9822a1b98869c25a44de422e7

Parent:
a0f2db11519c19a8bb200f5111a2b162b9c5c85b

Review type:
Independent Red-Team

Verdict:
FAIL

Gate B:
NOT PASSED

Slice 5:
NOT AUTHORIZED

---

## 1. Executive Summary

An independent, read-only Red-Team audit was conducted on the Phase 6.4 Slice 4 implementation candidate (commit `aec7511...`). The objective was to verify the native domain operations (IPC handlers) and persistence boundaries against the normative specifications.

**Verdict:** The candidate is **NOT APPROVED** for Gate B due to multiple invariant violations, unauthorized dependencies, and incorrect error handling that leads to fail-open scenarios.

---

## 2. Findings Matrix

### 2.1 Schema Initialization & Invariant Checks
- **Finding:** Non-Normative Error Enforcement.
- **Details:** The function `verify_user_version` asserts the DB schema readiness (PRAGMA user_version). However, upon failure, it returns a custom error code `ERR_SCHEMA_NOT_READY`.
- **Violation:** The Phase 6.4 specifications dictate that persistence or schema-level failures must fail closed using the canonical error `ERR_DATABASE_FAILURE`.
- **Severity:** 🟡 Moderate

### 2.2 Entitlement Enforcement Boundary
- **Finding:** Bypass of Normative Entitlement Port.
- **Details:** In `src-tauri/src/phase64.rs`, `get_authoritative_state()` calls `crate::entitlements::get_entitlements()` directly to retrieve the state.
- **Violation:** This bypasses the `EntitlementDecisionProvider` abstraction explicitly established in Slice 3. The authorization logic must go through the provider trait (which may include caching or telemetry) rather than hardcoding the underlying implementation.
- **Severity:** 🔴 High

### 2.3 Dependency Governance
- **Finding:** Unauthorized Production Dependency.
- **Details:** The `chrono` crate (v0.4.45) was added to `Cargo.toml`.
- **Violation:** `chrono` was not authorized by a Human decision. Time generation should utilize existing native capabilities (`std::time::SystemTime` or `tauri` context) unless explicitly approved as a new production dependency.
- **Severity:** 🔴 High

### 2.4 Transaction Atomicity & Error Swallowing (Fail-Open)
- **Finding:** Silenced Database Errors in Critical Transactions.
- **Details:**
  1. In `remove_workflow_stage`, the transfer of the `PUBLICATION` role uses `.ok()` on the SQLite queries (`sqlx::query(...).execute(&mut *tx).await.ok()`). This ignores any underlying database failure, breaking the "ROLLBACK ALL" transaction contract.
  2. In `assign_article_category`, the SQLite query uses `.unwrap_or(sqlx::sqlite::SqliteQueryResult::default())`, completely swallowing database lock or connection errors and pretending 0 rows were affected.
- **Violation:** This violates the explicit strict atomicity contract. The system must fail closed on any DB error rather than continuing with corrupted state assumptions.
- **Severity:** 🔴 High

### 2.5 Code Formatting (Git Hooks / CI)
- **Finding:** Format Check Failure.
- **Details:** `git show --check HEAD` exits with code 2 due to numerous trailing whitespaces introduced in `src-tauri/src/phase64.rs` (e.g., lines 35, 44, 57, 278, etc.).
- **Severity:** 🟡 Low (Hygiene)

---

## 3. Verified Valid Implementations

- **Shared Persistence Architecture:** The `get_pool` function correctly reuses the existing SQLite pool owned by `tauri-plugin-sql` via `DbInstances`. No unauthorized second pool is created.
- **Proof-Only IPC Command:** The previously reported issue of an exposed proof-only command is resolved. The exact 16 normative commands are properly registered in `lib.rs`.
- **Valid Transitions & Entitlement Mapping:** `authorize_protected()` correctly maps `EntitlementError::ConfirmedFreeProtectedMutationDenied` to the canonical `ERR_CONFIRMED_FREE_PRO_MUTATION_DENIED`.

## 4. Required Remediation

Before Slice 4 can be approved, the following corrective actions must be taken in a subsequent implementation pass:
1. Replace `ERR_SCHEMA_NOT_READY` with `ERR_DATABASE_FAILURE`.
2. Route `get_authoritative_state()` through the `EntitlementDecisionProvider` using the application state or instance getter.
3. Remove the `chrono` crate and refactor timestamp logic to use `std::time` or existing primitives.
4. Remove `.ok()` and `.unwrap_or()` inside transactions; map `sqlx::Error` to `ERR_DATABASE_FAILURE` appropriately to ensure strict fail-closed rollbacks.
5. Fix trailing whitespaces.
