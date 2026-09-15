# Phase 6.4 Architecture Decision Readiness

## 1. Status
ANALYSIS ONLY — NO ARCHITECTURE DECISION APPROVED

## 2. Objective
This document outlines the decision domains required for Phase 6.4 PRO Workflow Customization, establishing the boundaries and requirements for subsequent formal Architecture Decision Records (ADRs). It explicitly does not select final architectures, but rather models the problem space, options, and constraints.

## 3. Current Technical Baseline (Facts)
- **ArticleStatus:** Currently a closed domain in TypeScript (`types/editorial.ts`). It is also represented as a closed enum in the Phase 6.3 Rust editorial context.
- **CategoryTag:** Likewise closed in TypeScript and Rust Phase 6.3 context.
- **Kanban Columns:** Current Kanban columns are fixed.
- **Persisted Values:** Current persisted article status and category values use existing fixed representations.
- **Checklists:** Current checklist items are article-level structures rather than reusable PRO template entities.
- **Entitlement Mechanism:** Current entitlement mechanism is DEVELOPER-ONLY.
  - In `src-tauri/src/entitlements.rs`, `DEVELOPER_PREMIUM` exists only under `debug_assertions`.
  - In release builds, `get_entitlements` resolves to FREE, and `set_developer_premium` rejects developer premium.
  - In `lib/contexts/EntitlementContext.tsx`, the frontend obtains entitlement status through Tauri IPC. This historical UI/context is NOT the commercial entitlement architecture. Do NOT extrapolate production entitlement architecture from this debug implementation.

## 4. Architecture Decision Domain A — Workflow Model
### Conceptual Models for Dynamic Workflow Representation
**Option A: Stable dynamic stage entities with independent identifiers**
- Stages have unique UUIDs. Articles reference stage UUIDs.
- **Rename stability:** High (name is just a property).
- **Reorder:** Easy (order index).
- **Article references:** Foreign keys remain stable.
- **Migration:** Existing articles must migrate fixed string statuses to new dynamic UUIDs.

**Option B: Stable semantic core + customizable presentation/order**
- System retains core semantic states (e.g., "in-progress", "done"), but allows custom display names and ordering within those semantic buckets.
- **Rename stability:** Display name can change without altering semantic mapping.
- **Article references:** Can reference either the semantic core or the presentation layer.
- **Phase 6.3 impact:** Minimizes impact on existing semantic-based AI logic.

**Option C: Dynamic stages with a separate optional/required recommendation semantic classification**
- Fully dynamic stages (like Option A) but with an optional tag that links them to known semantic roles.
- **Backward compatibility:** Good, if default Free stages have semantic tags pre-populated.

*All options must satisfy:*
- Minimum one active stage.
- Downgrade preservation (custom stages remain readable).
- Free default workflow integrity.
- Safe add/remove behavior (cannot remove a stage with articles).

## 5. Architecture Decision Domain B — AI Recommendation Semantics
**Invariant:** *status recommends; validated evidence determines action availability.*

### Conceptual Approaches
**Approach 1: Explicit stable semantic stage role**
- Custom stages must be assigned a fixed semantic role (e.g., "Drafting", "Review"). Recommendation logic runs off this semantic role.
- **Impact on Rust Context:** `ArticleStatus` evolves into a dynamic entity carrying a semantic role property.

**Approach 2: Optional semantic classification**
- Stages can optionally have semantics. If absent, no specific AI stage-based recommendation is provided, but evidence still determines availability.
- **Impact on Recommendation UX:** Less prescriptive; relies more on evidence availability.

**Approach 3: Derived recommendation semantics**
- System uses LLM/heuristics to map the custom stage name to a known semantic state dynamically.
- **Impact:** High uncertainty/latency, heavily impacts Phase 6.3 context.

**Approach 4: Evidence-dominant availability with independent recommendation hints**
- Stage purely dictates board column. Action availability relies 100% on evidence.
- **Migration:** Easiest migration, fully decouples workflow status from AI action availability.

## 6. Architecture Decision Domain C — Category Model
### Viable Representation Approaches
**Approach 1: Fixed enum migration to dynamic table**
- Migrate `CategoryTag` to a database table with predefined "Free" entries and user-created "PRO" entries.
- **Stable identity:** Good (UUIDs).
- **Downgrade preservation:** Downgrade must prevent new category creation but allow reading/editing existing articles with custom categories.

**Approach 2: JSON Document Store**
- Store categories as an array of strings inside the article metadata.
- **Stable identity:** Weak (renaming requires updating all articles).
- **Downgrade preservation:** Easy (just stop providing the UI to add new strings).

## 7. Architecture Decision Domain D — Checklist Templates
### Viable Persistence/Lifecycle Approaches
**Scope:** Template = name + ordered checklist items.

**Approach 1: Relational Template & TemplateItems tables**
- Strict relational model.
- **Independence:** When a template is applied, its items are copied to the article (or referenced, but copying ensures article independence if the template is edited).
- **Template deletion:** Soft delete required if referenced, or hard delete if items are copied.

**Approach 2: JSON Document Store**
- Store templates as JSON blobs.
- **Ordering:** Implicit in JSON array.
- **Downgrade preservation:** Easy to read, block new JSON writes.

## 8. Architecture Decision Domain E — Entitlement Authority
### Trust-Boundary Models
**Option A: Frontend-only gating**
- React state controls PRO UI.
- **Bypass resistance:** Weak (DevTools). *NON-VIABLE* as it cannot satisfy the security invariant requiring protected-mutation enforcement.

**Option B: Local native/Tauri enforcement boundary**
- Rust strictly controls IPC. Frontend requests PRO mutation, Rust verifies local entitlement state.
- **Offline compatibility:** High.
- **Provider coupling:** Low.

**Option C: Hybrid UI visibility + native protected-mutation enforcement**
- Frontend hides PRO features; Rust rejects unauthorized mutations.
- **Bypass resistance:** High (UI bypass is useless without Rust auth).

**Option D: External commercial verification + locally usable trusted state/proof**
- Rust fetches and validates external proof, caching it locally for offline use.
- **Temporary unverifiability:** Supports offline grace periods based on cached proof freshness.

## 9. Local Desktop Trust Model Precision
Rust/Tauri may act as a more trusted APPLICATION enforcement boundary relative to untrusted frontend state.
However, a sufficiently privileged local user may potentially:
- inspect or patch binaries;
- alter process memory;
- modify files/database;
- manipulate clocks;
- roll back local state.
Residual local-admin risk must be explicitly acknowledged. We do not claim protection against a fully privileged local administrator unless evidence supports it.

## 10. Entitlement Source of Truth
Analyze possible authority models generically:
- **Local entitlement material derived from a commercial activation**
- **Periodically refreshed external status**
- **Hybrid local/external authority**
- **Another justified approach**
Authentication is NOT automatically required. Provider selection remains deferred.

## 11. Required ADR Candidates (Derived)
1. **ADR: Dynamic Workflow and Category Persistence Strategy**
   - **Question:** How should custom workflow stages and categories be modeled and persisted to support renaming, reordering, and downgrade preservation?
   - **Options:** Relational vs. Document-based.
   - **Dependencies:** None.
   - **Product Invariants:** Minimum 1 stage, Free baseline unaffected.
   - **Human Input Required:** No.
   - **Blocks SDD:** Yes.

2. **ADR: AI Recommendation Decoupling from Workflow Status**
   - **Question:** How does the Phase 6.3 AI orchestrator map dynamic custom stages to recommendation semantics without breaking the invariant?
   - **Options:** Semantic mapping vs. Evidence-only.
   - **Product Invariants:** Status recommends; validated evidence determines action availability.
   - **Human Input Required:** No.
   - **Blocks SDD:** Yes.

3. **ADR: Entitlement Enforcement Boundary and Trust Model**
   - **Question:** Where and how is PRO entitlement evaluated, enforced, and cached for offline use?
   - **Options:** Native enforcement, Hybrid enforcement.
   - **Security Relevance:** High. Prevents unauthorized commercial mutations.
   - **Human Input Required:** No.
   - **Blocks SDD:** Yes.

## 12. SDD Readiness
- **Decisions required before SDD:** The three ADR candidates listed above must be resolved.
- **Details remaining for SDD:** Database schema names, specific IPC command payloads, React context structure.
- **Details remaining outside ADRs:** Final payment/auth provider selection, pricing tiers.

## 13. Explicit Non-Decisions
This document explicitly confirms no decision yet on:
- workflow persistence representation;
- semantic role representation;
- category schema;
- checklist-template schema;
- entitlement authority implementation;
- licensing/activation model;
- identity/authentication requirement;
- external commercial provider;
- payment provider;
- local entitlement material format;
- cryptographic format;
- offline freshness duration;
- secure-storage technology;
- machine binding;
- revocation mechanism;
- downgrade enforcement implementation.
