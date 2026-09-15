# Phase 6.4 Architecture Decision Readiness

## 1. Status
ANALYSIS ONLY — NO ARCHITECTURE DECISION APPROVED

## 2. Objective
This document outlines the decision domains required for Phase 6.4 PRO Workflow Customization, establishing the boundaries and requirements for subsequent formal Architecture Decision Records (ADRs). It explicitly does not select final architectures, but rather models the problem space, options, and constraints.

## 3. Product Invariants
- **Free Baseline:** Free = current functional baseline.
- **PRO:** PRO = Editorial Workflow Customization (rename, add, remove, reorder stages; custom categories; custom checklist templates).
- **Recommendation:** *status recommends; validated evidence determines action availability.*
- **Minimum workflow:** >= 1 active stage.
- **Stage removal:** A stage MUST NOT be removed while affected articles remain unresolved (this does not mean a stage that once contained articles can never be removed).
- **Downgrade:** Content/configuration is preserved; no silent remapping; new PRO configuration changes are denied.
- **Temporary unverifiability:** The user was previously valid PRO; ordinary work continues; existing PRO configuration use/editing is not blocked solely because verification is temporarily unavailable.

## 4. Current Technical Baseline (Facts)
- **ArticleStatus:** Currently a closed domain in TypeScript (`types/editorial.ts`). It is also represented as a closed enum in the Phase 6.3 Rust editorial context.
- **CategoryTag:** Likewise closed in TypeScript and Rust Phase 6.3 context.
- **Kanban Columns:** Current Kanban columns are fixed.
- **Persisted Values:** Current persisted article status and category values use existing fixed representations.
- **Checklists:** Current checklist items are article-level structures rather than reusable PRO template entities.
- **Entitlement Mechanism:** Current entitlement mechanism is DEVELOPER-ONLY.
  - In `src-tauri/src/entitlements.rs`, `DEVELOPER_PREMIUM` exists only under `debug_assertions`.
  - In release builds, `get_entitlements` resolves to FREE, and `set_developer_premium` rejects developer premium.
  - In `lib/contexts/EntitlementContext.tsx`, the frontend obtains entitlement status through Tauri IPC. This historical UI/context is NOT the commercial entitlement architecture. Do NOT extrapolate production entitlement architecture from this debug implementation.

## 5. Workflow Option Matrix

| Feature / Impact | Option A: Stable Dynamic Entities (Implementation Example: UUIDs) | Option B: Stable Semantic Core + Custom Presentation | Option C: Dynamic Stages with Separate Semantic Tags |
| --- | --- | --- | --- |
| **Stable identity** | Independent identifier | Core semantic identifier | Independent identifier |
| **Rename behavior** | High stability | Presentation-only change | High stability |
| **Reorder behavior** | Fully arbitrary | Restricted by semantic flow | Fully arbitrary |
| **Add behavior** | Fully arbitrary | Requires mapping to semantic core | Arbitrary, tag assignment optional |
| **Removal safety** | Reassignment/blocking | Presentation removal only | Reassignment/blocking |
| **Article references** | Bound to independent identifier | Bound to semantic core | Bound to independent identifier |
| **Minimum-one-stage** | Enforceable at DB/IPC | Inherent to semantic core | Enforceable at DB/IPC |
| **Free default workflow** | Explicit default records | Pre-configured presentation | Pre-configured records with tags |
| **Migration** | Migrate fixed strings to new entities | Migrate fixed strings to semantic cores | Migrate fixed strings to tagged entities |
| **Downgrade preservation**| Preserved | Preserved | Preserved |
| **List impact** | Dynamic column sorting/filtering | Semantic-based grouping | Dynamic column sorting/filtering |
| **Kanban impact** | Fully dynamic columns | Fixed columns, dynamic sub-headers | Fully dynamic columns |
| **Calendar impact** | Agnostic | Agnostic | Agnostic |
| **Stats impact** | Aggregations need dynamic grouping | Aggregations map to core | Aggregations need dynamic grouping |
| **Phase 6.3 recommendation impact** | High | Low | Low (if tags are used) |
| **Testing complexity** | High | Low | Medium |
| **Rollback/recovery** | Foreign key constraints complex | Easy | Foreign key constraints complex |
| **Major risk** | Decoupling breaks AI context | Too restrictive for users | Tag drift / unmapped stages |

## 6. AI Semantics Matrix

*Invariant: status recommends; validated evidence determines action availability.*

| Criteria | Approach 1: Explicit Stable Semantic Stage Role | Approach 2: Optional Semantic Classification | Approach 3: Derived Recommendation Semantics (LLM/Heuristics) | Approach 4: Evidence-Dominant Availability (Independent Hints) |
| --- | --- | --- | --- | --- |
| **Recommendation quality** | High (deterministic) | High (when tagged) | Variable | Neutral |
| **Determinism** | Absolute | Absolute | Probabilistic | Absolute |
| **Effect on evidence** | None | None | None | Decouples status entirely |
| **Impact on Rust Context** | Evolves enum to entity + role property | Evolves enum to entity + optional tag | Complex heuristic layer required | Simplifies context |
| **Migration complexity** | Medium | Medium | High | Low |
| **User explainability** | High | High | Low | High |
| **Unknown custom stage failure** | Blocks creation (required) | Graceful (no recommendation) | Graceful (fallback) | Graceful |
| **Testability** | High | High | Low | High |
| **Risk of accidental 1:1 coupling** | High | Medium | Low | Low |

*(Approach 3 is deemed NON-VIABLE due to its probabilistic nature conflicting with the predictable orchestration requirements of Phase 6.3).*

## 7. Category Options Matrix

| Criteria | Option A: Relational Table Migration | Option B: JSON Document Array inside Article |
| --- | --- | --- |
| **Identity** | Stable | Weak (String value) |
| **Rename** | Centralized | O(N) updates on all articles |
| **Article references** | Foreign Key | Value matching |
| **Deletion resolution** | Blocked if referenced | Array element removal |
| **Migration** | Fixed enum to table records | Fixed enum to JSON |
| **Downgrade** | Prevent new writes | Prevent new strings |
| **Free standard categories** | Seeded records | Seeded strings |
| **Distinction from arbitrary tags** | High | Low |

## 8. Checklist Template Options Matrix

*Approved scope: template = name + ordered checklist items.*

| Criteria | Option A: Relational Template & TemplateItems Tables | Option B: JSON Blob Store |
| --- | --- | --- |
| **Template identity** | Stable | Stable |
| **Ordered items** | Explicit order column | Implicit JSON array order |
| **Apply/copy/reference semantics** | Copy items to article instances | Copy JSON array to article |
| **Editing after application** | Isolated (copied instances unaffected) | Isolated (copied instances unaffected) |
| **Deletion** | Hard delete safe (if instances are copied) | Hard delete safe |
| **Preservation of article history** | High | High |
| **Downgrade** | Prevent new templates | Prevent new templates |
| **Migration** | Flat checklist items remain untouched | Flat checklist items remain untouched |

## 9. Entitlement Authority Trust-Boundary Models
*Question: Where is production PRO entitlement authority evaluated, where are protected mutations enforced, and how can the approved local-first temporary-unverifiability behavior be represented safely?*

**Model A: Frontend-only gating**
- *Bypass resistance:* Weak.
- *Offline compatibility:* High.
- *Local-admin limitations:* Trivial to bypass.
- *Downgrade behavior:* UI toggle.
- *Temporary unverifiability:* N/A.
- *Implementation complexity:* Low.
- *Provider coupling:* N/A.
- *Recovery:* N/A.
- *Residual risk:* High.
*(NON-VIABLE as it fails the security invariant: "Protected commercial mutations require authorization at a boundary more trusted than frontend UI state.")*

**Model B: Local native/Tauri enforcement boundary**
- *Bypass resistance:* High (application boundary).
- *Offline compatibility:* High.
- *Local-admin limitations:* Subject to binary patching/memory tampering.
- *Downgrade behavior:* IPC rejects unauthorized mutations.
- *Implementation complexity:* Medium.

**Model C: Hybrid UI visibility + native protected-mutation enforcement**
- *Bypass resistance:* High.
- *Implementation complexity:* Medium.

**Model D: External commercial verification + locally usable trusted state/proof**
- *Bypass resistance:* Very High (proof validation).
- *Offline compatibility:* Depends on freshness rules.
- *Implementation complexity:* High.
- *Provider coupling:* High.

## 10. Local Desktop Trust Model Precision
Rust/Tauri may act as a more trusted APPLICATION enforcement boundary relative to untrusted frontend state.
However, a sufficiently privileged local user may potentially:
- inspect or patch binaries;
- alter process memory;
- modify files/database;
- manipulate clocks;
- roll back local state.
Residual local-admin risk must be explicitly acknowledged. We do not claim protection against a fully privileged local administrator unless evidence supports it.

## 11. Entitlement Source of Truth
Analyze possible authority models generically:
- **Local entitlement material derived from a commercial activation**
- **Periodically refreshed external status**
- **Hybrid local/external authority**
- **Another justified approach**
Authentication is NOT automatically required. Provider selection remains deferred.

## 12. Required ADR Candidates

### ADR 1: Dynamic Workflow and AI Semantics Strategy
- **Exact Decision Question:** How should custom workflow stages be modeled and persisted, and how does the Phase 6.3 AI orchestrator provide recommendations for custom stages without breaking invariants?
- **Alternatives to compare:** Stable semantic core vs. Optional semantic classification vs. Evidence-dominant availability.
- **Product Invariants Affected:** Minimum 1 stage; Free default workflow; Stage removal safety; "status recommends; validated evidence determines action availability".
- **Security Relevance:** Low.
- **Dependencies:** None.
- **SDD Blocking:** YES.
- **Additional Product Owner Requirement Input Needed:** NO.
- **Human Architecture Approval Required:** YES.
- **Architect Recommendation — NON-BINDING:** Option C (Dynamic Stages with Optional Semantic Tags) combined with Approach 2 (Optional Semantic Classification). Provides high rename/reorder stability while decoupling orchestration gracefully. Residual risk: semantic tag drift. Evidence that could change recommendation: extreme query complexity.

### ADR 2: Category and Checklist Persistence Model
- **Exact Decision Question:** How should custom categories and reusable checklist templates be modeled and persisted to support renaming, reordering, and downgrade preservation?
- **Alternatives to compare:** Relational Tables vs. JSON Document Store.
- **Product Invariants Affected:** Downgrade preservation.
- **Security Relevance:** Low.
- **Dependencies:** None.
- **SDD Blocking:** YES.
- **Additional Product Owner Requirement Input Needed:** NO.
- **Human Architecture Approval Required:** YES.
- **Architect Recommendation — NON-BINDING:** Option A (Relational) for Categories to preserve stable identity and rename capability; Option B (JSON Document) for Checklist Templates due to strict ordered-list copy-semantics. Residual risk: migration friction. Evidence that could change recommendation: SQLite JSON1 performance limitations.

### ADR 3: Entitlement Enforcement Boundary and Trust Model
- **Exact Decision Question:** Where is production PRO entitlement authority evaluated, where are protected mutations enforced, and how can the approved local-first temporary-unverifiability behavior be represented safely?
- **Alternatives to compare:** Local native/Tauri enforcement vs. External commercial verification + locally usable trusted state/proof.
- **Product Invariants Affected:** Downgrade; Temporary unverifiability.
- **Security Relevance:** High.
- **Dependencies:** None.
- **SDD Blocking:** YES.
- **Additional Product Owner Requirement Input Needed:** NO.
- **Human Architecture Approval Required:** YES.
- **Architect Recommendation — NON-BINDING:** Model C (Hybrid UI visibility + native protected-mutation enforcement) using Model D's (locally usable trusted state/proof). This prevents frontend spoofing while respecting local-first offline product rules. Residual risk: local-admin manipulation of the state. Evidence that could change recommendation: discovery of a completely offline-incompatible payment provider.

## 13. Human Architecture Decision Package

**Decision 1: Dynamic Workflow and AI Semantics Strategy**
- Option A: Stable Dynamic Entities
- Option B: Stable Semantic Core + Custom Presentation
- Option C: Dynamic Stages with Separate Semantic Tags
- *Architect recommendation:* Option C + Optional Semantic Classification.
- *Security reviewer position:* No objection.
- *Product invariant at risk:* Recommendation accuracy.
- *Residual risk:* Semantic tag drift.
- *Human decision required:* YES.

**Decision 2: Category and Checklist Persistence Model**
- Option A: Relational Migration for both.
- Option B: JSON Document Store for both.
- Option C: Hybrid (Relational Categories, JSON Templates).
- *Architect recommendation:* Option C (Hybrid).
- *Security reviewer position:* No objection.
- *Product invariant at risk:* Data preservation on downgrade.
- *Residual risk:* Migration friction.
- *Human decision required:* YES.

**Decision 3: Entitlement Enforcement Boundary and Trust Model**
- Option A: Frontend-only gating (NON-VIABLE).
- Option B: Local native/Tauri enforcement boundary.
- Option C: Hybrid UI visibility + native protected-mutation enforcement.
- Option D: External commercial verification + locally usable trusted state/proof.
- *Architect recommendation:* Option C + Option D.
- *Security reviewer position:* Supports native IPC enforcement. Local-admin residual risk acknowledged.
- *Product invariant at risk:* Offline productivity.
- *Residual risk:* Local admin bypass, clock manipulation.
- *Human decision required:* YES.

## 14. SDD Readiness
**A. MUST BE DECIDED BEFORE SDD:** The three ADR candidates (Workflow/AI, Categories/Checklists, Entitlement Boundary).
**B. MAY BE DECIDED INSIDE SDD:** Database schema names, IPC command payloads, React context structure, offline refresh logic implementation details.
**C. IMPLEMENTATION DETAIL — NOT ADR MATERIAL:** Final payment/auth provider selection, pricing tiers, specific cryptographic signature libraries.

## 15. Explicit Non-Decisions
This document explicitly confirms NO decision yet on:
- workflow persistence representation;
- identifier format;
- semantic-role representation;
- category schema;
- checklist-template schema;
- entitlement authority implementation;
- licensing/activation model;
- authentication requirement;
- external provider;
- payment provider;
- proof/token/license format;
- cryptographic format;
- offline freshness duration;
- secure-storage mechanism;
- machine binding;
- revocation mechanism;
- downgrade enforcement implementation.

## 16. Document Status
Human architecture decisions are required before ADRs can be accepted and before SDD may begin.
