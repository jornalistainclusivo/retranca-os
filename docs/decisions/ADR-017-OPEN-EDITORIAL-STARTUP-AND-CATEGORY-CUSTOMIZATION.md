# ADR-017 — Open editorial startup and category customization

Date: 2026-10-07. Status: accepted product direction; implementation and validation tracked separately.

## Context and authority

The owner accepted the three bounded installed Windows pilot checks, then reported initialization, hidden-article/count and customization defects in screenshots A–D. These observations block distribution acceptance. The owner authorized their correction and an Início page with guidance and actual achievements. On 2026-10-07 the owner explicitly chose to make suggested categories editable, with article preservation and reassignment on removal.

[ADR-013](ADR-013-OPEN-SINGLE-EDITION.md) establishes one open edition. The historical standard-category mutation prohibition in the Phase 6.4 specification is superseded by this decision. Origin is descriptive metadata, not a mutation permission. Rust remains the authority for domain operations; this does not change IPC permissions, authorization or schema.

## Decision

- Fresh desktop startup uses the existing migrated suggested workflow and categories, with zero automatically created articles. Browser startup likewise starts empty. An explicitly stored empty article list remains empty.
- Load the workspace completely before exposing creation. Failed loading offers retry and preserves existing data; it must not masquerade as an empty, ready workspace.
- Suggested catalogs are supplied once through existing initialization. Creating a stage/category does not seed articles or reset/repopulate an existing catalog. The initial suggested workflow is usable immediately and can be customized into the person's own workflow; no destructive “start over” action is introduced.
- Both suggested and person-created active categories can be renamed and safely removed. Names must remain nonempty and unique among active entities. Identity stays stable on rename. Removing a referenced category requires an active, distinct destination and preserves articles/history/content. Preserve at least one active category for article creation. Never recreate a removed suggested category during subsequent startup.
- Workflow names/order/classifications remain editable under existing validation. Keep exactly one active publication role; classification PUBLISHED alone does not grant that role or imply public publishing. Explain this distinction in Portuguese. AI requires appropriate evidence and runtime under ADR-008, independently of stage names.
- Existing articles with unresolved stage/category references remain visible in a recovery section. Repair is an explicit save/assignment, not a guessed startup mapping or automatic deletion. Existing sample-looking records are not assumed safe to remove.
- Início is the initial view and an ordinary navigation destination. It explains local CMS, workflow, customization, optional local AI and human review; provides actionable shortcuts and achievements derived from actual saved articles/checklists. Checklist completion is not evidence of WCAG conformance, factual correctness or quality certification. Empty workspaces earn no achievements automatically.
- Counts and filters use the same article collection and local calendar dates. Show the displayed/total distinction and keep unresolved records discoverable. Category labels resolve by stable identity, including after rename.

## Consequences and limits

Validation follow-up — 2026-10-07: the owner accepted the three bounded checks of the corrected installed Windows pilot with `1 OK; 2 OK; 3 OK`, recorded in the [corrective validation](../testing/PHASE-6.5-INCREMENT-5-STARTUP-AND-HOME-VALIDATION.md). This closes that handoff, not the separate source-publication, broader accessibility, Linux or distribution gates below.

No new dependency, migration, database version, entitlement, engine, model download or cloud transfer. Existing schema backups/migrations retain their own approved behavior. Private articles/SQLite/model/settings and raw local receipts stay outside Git. The old packaged candidate and its review remain historical evidence; corrected runtime requires a fresh build and separate owner acceptance. Commit, push, manual CI, merge, tag and release remain separate authorization gates.

## References

- [ADR-009](ADR-009-DYNAMIC-WORKFLOW-AND-AI-SEMANTICS.md)
- [ADR-010](ADR-010-CATEGORY-AND-CHECKLIST-PERSISTENCE.md)
- [ADR-014](ADR-014-ARTICLE-CMS-CONTENT-PERSISTENCE.md)
- [Corrective specification](../specifications/phase-6.5/PHASE-6.5-INCREMENT-5-STARTUP-AND-HOME.md)
