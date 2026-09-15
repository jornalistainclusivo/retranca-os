# Phase 6.4 PRO Workflow Customization PRD

## 1. Status
PHASE 6.4 — PRODUCT REQUIREMENTS — APPROVED BY HUMAN PRODUCT OWNER

## 2. Executive Summary
This Product Requirements Document (PRD) defines the requirements for Phase 6.4 PRO Workflow Customization. The PRO tier allows newsrooms to customize the editorial workflow, categories, and checklist templates of Retranca OS, adapting the local software to their specific business realities. The PRD maintains the existing Free baseline without removing capabilities, preserves Phase 6.3 local AI orchestration, and guarantees local-first operation and downgrade safety.

## 3. Authoritative Inputs
- `docs/specifications/phase-6.4/PHASE-6.4-PRODUCT-DECISION.md` (Normative)
- `docs/specifications/phase-6.4/PHASE-6.4-PRODUCT-ACCESS-AND-MONETIZATION-DISCOVERY.md`
- `docs/specifications/phase-6.4/PHASE-6.4-FREE-BASELINE-CAPABILITY-INVENTORY.md`

## 4. Product Problem
Hypothesis: While the hardcoded 5-stage workflow (Ideia, Pesquisa, Escrita, Revisão, Publicado) serves many independent users well, it is hypothesized that professional newsrooms have unique operational stages, specialized terminologies, and bespoke taxonomies. The current hardcoded architecture may prevent these organizations from fully adopting Retranca OS into their established operations.

## 5. Goals
- Allow PRO users to rename, add, remove, and reorder workflow stages.
- Allow PRO users to manage custom categories.
- Allow PRO users to manage custom checklist templates.
- Preserve the existing Free tier experience intact.
- Ensure custom stages integrate cleanly with existing Phase 6.3 editorial AI recommendations.
- Define safe data boundaries for commercial downgrades.

## 6. Non-Goals
- DO NOT remove or degrade existing Free capabilities.
- DO NOT implement PRO capabilities, auth, licensing, or payments.
- DO NOT define technical architecture, database schemas, IPC contracts, or security models.
- DO NOT select a payment or auth provider.
- DO NOT alter the Phase 6.3 local AI trust boundary or modify provider/model behavior.
- DO NOT support multiple concurrent workflows or custom metadata fields.

## 7. Free Product Guarantee
The existing standard product remains fully usable without PRO. PRO UI may advertise additional customization capabilities, but Free functionality must not be intentionally degraded or hidden behind dark patterns.

The following capabilities are guaranteed Free:
- The current five-stage standard workflow.
- Existing fixed categories.
- Existing standard checklist behavior.
- Article/CMS CRUD.
- Current views (Kanban, List, Calendar, Stats).
- Local SQLite persistence.
- Current Free tagging capability.
- Current local editorial AI capabilities.
- The six Phase 6.3 editorial AI actions.

## 8. Target Users / Jobs to Be Done
**Target Personas (Hypotheses):**
- Independent Journalist
- Freelancer
- Small Newsroom (2-5 users)
- Digital Publication

**Jobs to Be Done:**
- *Adapt the Workflow:* "When establishing our internal process, I want to map the software strictly to our real-life editorial desks so we don't have to translate terminology in our heads."
- *Define the Taxonomy:* "When organizing our publication, I want to define our own section categories so the CMS aligns with our website."

## 9. PRO Value Proposition
**PRO = Editorial Workflow Customization.**

## 10. Workflow Customization Requirements
**A. Rename Stage**
- **Goal:** Adapt terminology (e.g., "Escrita" to "Drafting").
- **Behavior:** Updating the stage name updates it visually across the Kanban board and article editors.
- **Validation:** Names cannot be empty or purely whitespace. Must be unique.
- **Safeguards:** Renaming a stage preserves all articles currently within it.

**B. Add Stage**
- **Goal:** Introduce new steps (e.g., "Legal Review").
- **Behavior:** The new stage appears in the workflow configuration and board.
- **Validation:** Cannot duplicate existing stage names.

**C. Remove Stage**
- **Goal:** Simplify or bypass unnecessary steps.
- **Behavior:** The stage is removed from the board.
- **Safeguards:** Destructive action. A workflow stage MUST NOT be removed while doing so would orphan or silently remap articles. The product must require resolution of affected articles before the destructive change can complete.

**D. Reorder Stages**
- **Goal:** Match the sequential flow of the newsroom.
- **Behavior:** Modifies the left-to-right order of columns in Kanban and sequential flow logic.

**E. Minimum Workflow Size**
- **Goal:** Maintain operational validity.
- **Behavior:** A workflow must contain at least one active stage. The product must reject any configuration change that would result in zero active stages.

## 11. Category Customization Requirements
PRO users must be able to create, rename, and delete custom categories.
- **Creation:** Users can add new categories with a name.
- **Renaming:** Renaming a category automatically reflects on all articles currently holding that category.
- **Deletion:** Deleting a category must not silently damage article classification data. The product must ensure safe resolution of affected articles.
- **Validation:** Names must be unique and non-empty.
- **Distinction:** Custom categories remain structurally distinct from arbitrary article string tags.
- **Free Guarantee:** Existing standard categories remain available and functional.

## 12. Checklist Template Requirements
PRO users must be able to manage reusable checklist templates.
- **Scope:** A custom checklist template consists of a template name and an ordered list of checklist items. Custom checklist taxonomy/category design is explicitly OUT OF SCOPE for initial Phase 6.4. Existing standard checklist behavior remains Free.
- **Creation & Editing:** Users can create a template, rename a template, add checklist items, edit checklist items, remove checklist items, and reorder checklist items.
- **Application:** Users can apply a saved template to a new or existing article.
- **Safeguards:** Deleting a template does NOT delete the completed checklist history or items already applied and saved within individual articles.

## 13. Editorial AI Compatibility
Custom workflow stages must preserve the Phase 6.3 AI invariant: *status recommends; validated evidence determines action availability.*
- Given an article in a custom workflow stage, actions whose evidence prerequisites are satisfied remain available independent of the custom stage display name, while recommendation behavior remains coherent.
- Evidence-based action availability remains authoritative over workflow status.
- The Phase 6.3 trusted orchestration boundary must not be weakened.

## 14. PRO Configuration UX
- **Access:** Configuration is accessed via a dedicated "Settings" or "Workflow Configuration" area.
- **Discoverability:** Free users retain a clean standard experience. PRO customization is surfaced through contextual, discreet messaging when relevant (e.g., when encountering or attempting a customization capability). No dark patterns, no obstruction of Free workflows, no deceptive controls. There is no requirement for a permanently visible locked PRO settings surface.
- **Editing:** Configuration changes must have explicit Save/Cancel interactions.
- **Destructive Operations:** Removing stages or categories requires clear, explicit user confirmation and safe resolution of impacted articles.
- **Accessibility:** All configuration forms, drag-and-drop ordering (if implemented), and modals must support keyboard navigation and screen readers.

## 15. Entitlement Product Boundary
- The product must distinguish between states: Free capability available, PRO capability available, PRO capability unavailable, and entitlement temporarily unverifiable (offline).
- **Payment != Product Identity != Authentication != Authorization != Entitlement.**
- **Temporary Unverifiability:** If PRO was validly active before temporary verification failure, ordinary editorial work and existing PRO configuration usage/editing must not be blocked solely because verification is temporarily unavailable.

## 16. Local-First / Offline Requirements
PRO must preserve meaningful local-first/offline operation after valid entitlement activation.
- Existing editorial content must remain safe and accessible.
- Temporary inability to verify entitlement does not block previously valid PRO work or configuration editing.

## 17. Downgrade Safety Requirements
When PRO entitlement is no longer active (downgrade to Free):
- Existing editorial content remains usable.
- Existing custom workflow configuration remains preserved.
- Existing custom categories remain preserved.
- Existing custom checklist templates/configuration remain preserved.
- Articles continue to reference their existing custom structures safely.
- No data may be deleted, no custom stage silently remapped, no article corrupted or orphaned.
- **Enforcement:** The Free state blocks NEW PRO configuration changes. Preserved PRO configuration must remain recoverable for future reactivation.

## 18. Functional Requirements
- **FR-WF-001:** The system shall allow PRO users to rename an existing workflow stage.
- **FR-WF-002:** The system shall allow PRO users to add a new workflow stage.
- **FR-WF-003:** The system shall allow PRO users to remove a workflow stage, providing safe resolution for affected articles.
- **FR-WF-004:** The system shall allow PRO users to reorder workflow stages.
- **FR-WF-MIN-001:** The system shall reject any workflow configuration change that results in zero active workflow stages.
- **FR-CAT-001:** The system shall allow PRO users to create, rename, and delete custom categories safely.
- **FR-CHK-001:** The system shall allow PRO users to create, rename, and apply custom checklist templates (consisting of name and ordered items).
- **FR-CHK-002:** The system shall allow PRO users to add, edit, remove, and reorder items within a checklist template.
- **FR-AI-001:** The system shall preserve evidence-based AI action availability regardless of custom workflow stage names.
- **FR-DOWN-001:** The system shall retain all user data, articles, and custom configurations safely if PRO entitlement is revoked.
- **FR-DOWN-002:** The system shall block the creation of new PRO configuration changes when in the Free state.
- **FR-ENT-001:** The system shall allow continued usage and editing of existing PRO configuration if entitlement becomes temporarily unverifiable after valid activation.

## 19. Non-Functional Requirements
- **NFR-A11Y-001:** All configuration interfaces must be fully accessible via keyboard.
- **NFR-DATA-001:** Configuration changes must preserve referential and semantic integrity of existing editorial content and configuration.
- **NFR-OFFLINE-001:** Temporary connectivity or entitlement-verification unavailability must not cause loss of local editorial data or unsafe state transitions.

## 20. User Stories
- **As a newsroom editor**, I want to rename the standard "Escrita" stage to "Drafting", so that the board reflects our internal terminology.
- **As a publication manager**, I want to add a "Legal Review" stage before "Publicado", so that articles pass legal clearance.
- **As an independent journalist**, I want to continue using the standard 5 stages without disruption, so that my existing workflow is stable.
- **As a user whose PRO entitlement ended or was downgraded**, I want my existing article data preserved exactly where it was, so that commercial state never destroys my editorial work.

## 21. Acceptance Criteria
- **AC-WF-001 (Rename):** Given a PRO user, when they rename a stage, the new name appears on the Kanban board and all existing articles in that stage remain intact without data loss.
- **AC-WF-002 (Remove Block):** Given a PRO user, when they attempt to delete a stage containing articles, the system blocks the deletion from completing until affected articles are resolved.
- **AC-WF-003 (Minimum Stage):** Given a PRO user, when they attempt to remove the final remaining active workflow stage, the system rejects the operation.
- **AC-CAT-001 (Category):** Given a PRO user, when they create a category "Op-Ed", it becomes available in the article editor category dropdown.
- **AC-CHK-001 (Checklist):** Given a PRO user, when they create a new checklist template consisting of a name and ordered items, and apply it to an article, the items are populated for that article.
- **AC-AI-001 (AI Invariant):** Given an article in a custom workflow stage, actions whose evidence prerequisites are satisfied remain available independent of the custom stage display name, while recommendation behavior remains coherent.
- **AC-DOWN-001 (Downgrade Safety):** Given a user whose PRO entitlement is no longer active, existing articles and custom configuration remain intact and recoverable, and no silent data transformation occurs.
- **AC-DOWN-002 (Downgrade Restriction):** Given a user whose PRO entitlement is no longer active, attempts to create new custom workflow stages, categories, or checklist templates are blocked.
- **AC-FREE-001 (Free Baseline):** Given a Free user, the standard 5 stages, fixed categories, and local AI capabilities remain fully functional without restriction.
- **AC-FREE-002 (Free Discoverability):** Given a Free user, the system presents contextual PRO discoverability messaging when appropriate, without permanently obstructing the standard editorial workflow.
- **AC-ENT-001 (Temporary Unverifiability):** Given a validly activated PRO user, if entitlement verification temporarily fails, the system does not block previously valid PRO editorial or configuration work.

## 22. Deferred Capabilities
The following are explicitly OUT OF SCOPE for this PRD:
- custom checklist taxonomy/category design;
- custom editorial metadata fields;
- multiple concurrent workflows;
- saved workflow templates;
- import/export configuration;
- team collaboration;
- cloud sync;
- managed backup;
- hosted AI services.

## 23. Open Product Questions
No blocking Product Owner questions remain for Phase 6.4 architecture design.

## 24. Architecture Decisions Explicitly Deferred
The following technical decisions require subsequent Architecture Decision Records (ADR) or Software Design Documents (SDD):
- Representation of dynamic workflow stages.
- Representation of recommendation semantics for custom stages.
- Migration of current `ArticleStatus` data.
- Dynamic category persistence.
- Checklist-template persistence model.
- Entitlement authority/trust boundary.
- Licensing/activation model.
- Offline verification behavior.
- Secure entitlement material storage.
- Downgrade enforcement model.

## 25. Exit Criteria
- Human Product Owner PRD approval is COMPLETE.
- No blocking Product Owner question remains for architecture.
- Next gated work is architecture/security analysis.

## 26. Governance / Non-Authorization
This PRD defines requirements only. It DOES NOT authorize:
- application implementation;
- source-code changes;
- database migrations;
- entitlement implementation;
- authentication implementation;
- licensing implementation;
- payment integration;
- provider selection;
- Phase 6.5 provider/model work.
