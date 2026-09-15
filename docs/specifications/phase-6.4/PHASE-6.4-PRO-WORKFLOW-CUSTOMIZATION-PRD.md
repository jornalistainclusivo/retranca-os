# Phase 6.4 PRO Workflow Customization PRD

## 1. Status
PHASE 6.4 — PRODUCT REQUIREMENTS — DRAFT FOR HUMAN REVIEW

## 2. Executive Summary
This Product Requirements Document (PRD) defines the requirements for Phase 6.4 PRO Workflow Customization. The PRO tier allows newsrooms to customize the editorial workflow, categories, and checklist templates of Retranca OS, adapting the local software to their specific business realities. The PRD maintains the existing Free baseline without removing capabilities, preserves Phase 6.3 local AI orchestration, and guarantees local-first operation and downgrade safety.

## 3. Authoritative Inputs
- `docs/specifications/phase-6.4/PHASE-6.4-FREE-BASELINE-CAPABILITY-INVENTORY.md`
- `docs/specifications/phase-6.4/PHASE-6.4-PRODUCT-ACCESS-AND-MONETIZATION-DISCOVERY.md`
- `docs/specifications/phase-6.4/PHASE-6.4-PRODUCT-DECISION.md`

Where discrepancies exist, the Product Decision artifact is normative.

## 4. Product Problem
While the hardcoded 5-stage workflow (Ideia, Pesquisa, Escrita, Revisão, Publicado) serves independent journalists well, professional newsrooms have unique operational stages, specialized terminologies, and bespoke taxonomies. The current hardcoded architecture prevents these organizations from fully adopting Retranca OS into their established operations.

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
- **Safeguards:** Destructive action. Cannot remove a stage if articles are currently assigned to it, OR the user must be prompted to explicitly move/reassign existing articles to a different stage before removal. The workflow must maintain a logical minimum number of stages (e.g., at least one active stage).

**D. Reorder Stages**
- **Goal:** Match the sequential flow of the newsroom.
- **Behavior:** Modifies the left-to-right order of columns in Kanban and sequential flow logic.

## 11. Category Customization Requirements
PRO users must be able to create, rename, and delete custom categories.
- **Creation:** Users can add new categories with a name and optionally a color.
- **Renaming:** Renaming a category automatically reflects on all articles currently holding that category.
- **Deletion:** Deleting a category prompts the user about articles currently using it (e.g., remove from articles or reassign).
- **Validation:** Names must be unique and non-empty.
- **Distinction:** Custom categories remain structurally distinct from arbitrary article string tags.
- **Free Guarantee:** Existing standard categories remain available and functional.

## 12. Checklist Template Requirements
PRO users must be able to manage reusable checklist templates.
- **Creation & Editing:** Users can create a named template and add/remove/reorder checklist items within it.
- **Application:** Users can apply a saved template to a new or existing article.
- **Safeguards:** Deleting a template does NOT delete the completed checklist history or items already applied and saved within individual articles.

## 13. Editorial AI Compatibility
Custom workflow stages must preserve the Phase 6.3 AI invariant: *status recommends; validated evidence determines action availability.*
- Custom stages must not disable otherwise valid AI actions merely because the display name changed.
- Customization must preserve coherent editorial behavior. (e.g., the system must still understand when to recommend "Editorial Review" vs "Research Gaps").
- Recommendation behavior must remain understandable to the user.
- Evidence-based action availability remains authoritative over workflow status.
- The Phase 6.3 trusted orchestration boundary must not be weakened.

## 14. PRO Configuration UX
- **Access:** Configuration is accessed via a dedicated "Settings" or "Workflow Configuration" area.
- **Discoverability:** Free users can see the configuration area to understand the PRO capability, but UI controls are locked/disabled with a clear upgrade path.
- **Editing:** Configuration changes must have explicit Save/Cancel interactions.
- **Destructive Operations:** Removing stages or categories requires clear, explicit user confirmation modals warning about impacted articles.
- **Accessibility:** All configuration forms, drag-and-drop ordering (if implemented), and modals must support keyboard navigation and screen readers.

## 15. Entitlement Product Boundary
- The product must distinguish between states: Free capability available, PRO capability available, PRO capability unavailable, and entitlement temporarily unverifiable (offline).
- **Payment != Product Identity != Authentication != Authorization != Entitlement.**
- If entitlement is temporarily unverifiable, the product must default to a grace period or local cache that preserves uninterrupted editorial workflow.

## 16. Local-First / Offline Requirements
PRO must preserve meaningful local-first/offline operation after valid entitlement activation.
- Normal editorial work must not suddenly become inaccessible solely because connectivity is temporarily unavailable.
- Existing local content must remain completely readable and writable.
- Failure to verify entitlement via a network check must never cause data loss.

## 17. Downgrade Safety Requirements
Downgrade from PRO to Free must NEVER:
- delete data;
- silently remap custom stages;
- corrupt article references;
- destroy custom categories;
- destroy checklist configurations.

**Downgrade UX Expectation:** Existing articles using custom configuration must remain readable and safe. Attempts to create new PRO customization after downgrade must be blocked. Existing custom configurations might be placed in a frozen/read-only state.
*(Note: The exact frozen/read-only UX is RECOMMENDED FOR LATER HUMAN DECISION).*

## 18. Functional Requirements
- **FR-WF-001:** The system shall allow PRO users to rename an existing workflow stage.
- **FR-WF-002:** The system shall allow PRO users to add a new workflow stage.
- **FR-WF-003:** The system shall allow PRO users to remove a workflow stage, provided no articles are orphaned.
- **FR-WF-004:** The system shall allow PRO users to reorder workflow stages.
- **FR-CAT-001:** The system shall allow PRO users to create, rename, and delete custom categories.
- **FR-CHK-001:** The system shall allow PRO users to create, edit, and apply custom checklist templates.
- **FR-ENT-001:** The system shall expose PRO configuration UI in a read-only/locked state for Free users.
- **FR-AI-001:** The system shall preserve evidence-based AI action availability regardless of custom workflow stage names.
- **FR-DOWN-001:** The system shall retain all user data, articles, and custom configurations safely if PRO entitlement is revoked.

## 19. Non-Functional Requirements
- **NFR-A11Y-001:** All configuration interfaces must be fully accessible via keyboard.
- **NFR-DATA-001:** Configuration changes (e.g., renaming a category) must maintain relational data integrity across the local database.
- **NFR-OFFLINE-001:** The application must cache entitlement state locally to permit offline work.

## 20. User Stories
- **As a newsroom editor**, I want to rename the standard "Escrita" stage to "Drafting", so that the board reflects our internal terminology.
- **As a publication manager**, I want to add a "Legal Review" stage before "Publicado", so that articles pass legal clearance.
- **As an independent journalist**, I want to continue using the standard 5 stages without disruption, so that my existing workflow is stable.
- **As a PRO user offline on a flight**, I want to continue moving articles through my custom stages, so that connectivity drops do not block my editorial work.
- **As a user whose PRO trial expired**, I want my existing article data preserved exactly where it was, so that commercial state never destroys my editorial work.

## 21. Acceptance Criteria
- **AC-WF-001 (Rename):** Given a PRO user, when they rename a stage, the new name appears on the Kanban board and all existing articles in that stage remain intact.
- **AC-WF-002 (Remove Block):** Given a PRO user, when they attempt to delete a stage containing 5 articles, the system blocks the deletion and prompts the user to reassign the articles.
- **AC-CAT-001 (Category):** Given a PRO user, when they create a category "Op-Ed", it becomes available in the article editor category dropdown.
- **AC-AI-001 (AI Invariant):** Given a custom stage "Quality Control", when an article enters this stage with validated semantic evidence, the corresponding Phase 6.3 AI action remains available.
- **AC-DOWN-001 (Downgrade):** Given a user downgraded to Free, when they view the Kanban board, their previously created custom stages remain visible and their articles are safe, but the "Add Stage" button is locked.

## 22. Deferred Capabilities
The following are explicitly OUT OF SCOPE for this PRD:
- custom editorial metadata fields;
- multiple concurrent workflows;
- saved workflow templates;
- import/export configuration;
- team collaboration;
- cloud sync;
- managed backup;
- hosted AI services.

## 23. Open Product Questions
- What is the exact UI/UX for a workflow that has been downgraded to Free (e.g., frozen state vs read-only board vs migration wizard)?
- How are custom checklist templates classified/taxonomized within the UI if standard templates exist?

## 24. Architecture Decisions Explicitly Deferred
The following technical decisions require subsequent Architecture Decision Records (ADR) or Software Design Documents (SDD):
- Representation of dynamic workflow stages in the database.
- Preservation of semantic recommendation roles for custom stages (how the AI maps custom stages).
- Migration of current `ArticleStatus` static data to dynamic data.
- Dynamic category persistence.
- Checklist-template persistence model.
- Entitlement authority.
- Licensing/activation model (e.g., license key vs. JWT session).
- Offline verification behavior and grace periods.
- Secure entitlement/license storage.
- Downgrade enforcement model at the application layer.
- Trust boundary for entitlement enforcement.

## 25. Exit Criteria
- Human Product Owner approval of this PRD.
- Resolution of critical Open Product Questions affecting immediate design.

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
