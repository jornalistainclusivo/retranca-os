# Phase 6.4 Architecture Decision Readiness

## 1. Status
PHASE 6.4 — ARCHITECTURE/SECURITY DISCOVERY

## 2. Objective
This document outlines the decision domains required for Phase 6.4 PRO Workflow Customization, establishing the boundaries and requirements for subsequent formal Architecture Decision Records (ADRs) and the Software Design Document (SDD). It explicitly DOES NOT select final architectures, but rather maps the problem space.

## 3. Decision Domains

### 3.1 Dynamic Workflow Representation
**Problem:** Currently, workflow stages are hardcoded via the `ArticleStatus` enum (Ideia, Pesquisa, Escrita, Revisão, Publicado) in both TypeScript and Rust, mapping directly to UI columns in `KanbanBoard.tsx`.
**Requirements:**
- Needs a dynamic representation (e.g., database table or JSON structure) allowing arbitrary names and ordering.
- Must guarantee a minimum of 1 active stage.
- Must prevent deletion of a stage that contains articles.
- Must ensure existing Free users experience the standard 5 stages without disruption.

### 3.2 AI Orchestration and Recommendation Semantics
**Problem:** Phase 6.3 AI orchestration is tightly coupled to the fixed `ArticleStatus`.
**Requirements:**
- Must preserve the invariant: *status recommends; validated evidence determines action availability.*
- The mapping between custom stages and AI action availability needs a decoupling strategy (e.g., mapping custom stages to underlying system semantic stages, or making action availability purely evidence-based).

### 3.3 ArticleStatus Migration Strategy
**Problem:** Existing articles have a fixed `status` column string.
**Requirements:**
- Transitioning to a dynamic stage model must not orphan existing articles.
- Needs a migration path that maps existing fixed strings to the newly generated dynamic stages or semantic equivalents.

### 3.4 Dynamic Category and Checklist Persistence
**Problem:** Checklists are currently flat items linked to articles. Categories are a static TypeScript type (`CategoryTag`).
**Requirements:**
- Needs a schema to store reusable Checklist Templates (name + ordered items).
- Needs a schema to store Custom Categories.
- Both must be downgrade-safe (revocation of PRO must not delete existing templates or categories).

### 3.5 Entitlement Authority and Trust Boundary
**Problem:** `DEVELOPER_PREMIUM` is currently a debug-only compile-time flag in Rust.
**Requirements:**
- Production entitlement must establish Rust as the absolute authority. The React frontend cannot be trusted to self-authorize.
- Entitlement checks must distinguish between "Free", "PRO active", and "Temporarily Unverifiable (Offline)".

### 3.6 Offline Verification and Secure Storage
**Problem:** Retranca OS is local-first. Entitlement checks against an external server will fail offline.
**Requirements:**
- Needs secure local storage for entitlement material (e.g., signed JWTs, machine-bound tokens) verifiable by the Rust backend without network access.
- Temporary offline status must allow previously valid PRO editorial work and configuration editing to continue.

### 3.7 Downgrade Enforcement Model
**Problem:** If a PRO entitlement expires, the system must revert to Free behavior without destroying data.
**Requirements:**
- Read/Edit operations on *existing* PRO configurations must remain valid.
- Creation of *new* PRO configurations must be blocked by the Rust backend.

## 4. Next Steps
- HUMAN DECISION READINESS REQUIRED.
- Pending Human Authorization: Draft ADR for **Dynamic Workflow Representation and AI Semantics**.
- Pending Human Authorization: Draft ADR for **Entitlement Authority, Secure Storage, and Downgrade Enforcement**.
- Pending Human Authorization: Draft ADR for **Data Schema Migration (Categories, Checklists, Status)**.
