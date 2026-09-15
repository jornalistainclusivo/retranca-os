# ADR 010: Category and Checklist Persistence

## Status

Accepted — Human Architecture Decision

## Context

The current `CategoryTag` is a fixed representation, and checklist items are flat article-level structures. Phase 6.4 requires reusable configuration entities for both categories and checklist templates to allow PRO workflow customization. These entities must support renaming, reordering, and preservation across downgrades.

## Evaluated Options

1. Fully relational categories + checklist templates/items
2. Fully document-style configuration
3. Hybrid: relational categories + document-style checklist-template items

## Decision

**Hybrid persistence strategy.**

**CUSTOM CATEGORIES:**
- Categories use a stable entity identity model.
- Relational representation is the approved architectural direction.
- Centralized rename must not require treating category display text as identity.
- Article references remain stable across rename.
- Deletion must not silently corrupt article classification.
- Free standard categories remain supported.
- Downgrade preserves existing custom categories.

**CUSTOM CHECKLIST TEMPLATES:**
- Approved product model: **template = stable template identity + name + ordered checklist items.**
- Template items may be persisted as a document-style aggregate.
- Applying a template creates an INDEPENDENT article checklist instance.
- Subsequent editing of the template must not retroactively mutate an article checklist already instantiated from it.
- Deleting a template must not destroy article checklist data already created from that template.
- Article checklist history/data remains preserved.
- Downgrade preserves templates/configuration.
- Custom checklist taxonomy remains OUT OF SCOPE.

## Data Integrity Consequences

- **Category rename safety:** Renaming a category is a centralized operation that reflects without altering category identity strings within articles.
- **Category deletion resolution:** Deleting a referenced category must be handled gracefully to avoid corrupting article classification.
- **Checklist template edit isolation:** Changes to a template item list do not propagate to past checklist instances, preserving historical accuracy.
- **Checklist template deletion:** Safe, as active articles maintain their own isolated copies of checklist items.
- **Article checklist preservation:** Historical data remains intact regardless of template mutation.
- **Downgrade preservation:** Custom categories and templates are locked against new mutations but remain functionally preserved upon downgrade to Free.

## Rejected Alternatives

- *Fully relational categories + checklist templates/items:* Rejected for checklist templates due to rigid ordering requirements and the necessity of strict copy-semantics for article instantiation.
- *Fully document-style configuration:* Rejected for categories because it weakens identity stability, complicates renaming (requiring O(N) updates across all articles), and degrades referential integrity.

## Deferred Decisions

The following are explicitly deferred:
- exact SQLite/Drizzle schema;
- exact table names and columns;
- identifier format;
- exact JSON serialization shape for document-style aggregates;
- migration SQL/mechanics;
- ORM implementation details;
- indexes;
- deletion implementation;
- versioning (if later justified).

This ADR does NOT authorize a new document database (e.g., MongoDB, Redis, or external services). The current local persistence architecture remains the baseline.
