# ADR 015: Local Article Import Preservation

## Status

Accepted conservative implementation baseline — 2026-10-02 (America/Sao_Paulo). The owner selected option 1, merging new IDs while preserving local articles, then clarified that real editorial data must remain exclusively local and expressed uncertainty about the alternatives. Continue with the least destructive default; this is not authority to overwrite, restore or delete the owner's database. The owner authorized continued development and code publication for this round.

## Context

The Header previously imported JSON into browser storage/UI without persisting the desktop collection in SQLite. Replacement semantics could hide local articles. Checklist/history IDs in exports can recur across different articles despite globally unique SQLite keys.

Tests must use invented content and disposable databases. The existing article-text decision (ADR-014), open edition (ADR-013), workflow/category rules (ADR-009/010) and Rust AI authority (ADR-008) remain applicable.

## Decision

- Import a user-selected local JSON array of exported articles. Add only article IDs absent locally. Preserve every field and relation of existing IDs, regardless of imported timestamps.
- Read and validate the whole file before mutation: maximum 5 MiB and 1,000 articles, unique article IDs, whitelisted fields/types/enums, unique related IDs per article. Missing legacy analysis text becomes empty; legacy workflow/category references normalize to standard IDs.
- Desktop imports through registered Rust `import_articles`, using the managed SQLite pool and schema 2. Rust independently validates the normalized request and its serialized 5 MiB limit. New references must point to active stages/categories, with exactly one active publication-role stage.
- Prevalidate new related-row identities, derived deterministically from the article/relation ID pair. Reject occupied identities without rewriting their owners. Insert all new articles, checklists and history in one transaction; roll back the entire batch on failure. Existing articles receive no UPDATE/DELETE/REPLACE.
- Preserve supplied timestamps; import is not a publication transition and does not invent history. Reload desktop data after commit before displaying success. Distinguish committed imports from failures to reload the UI.
- Browser fallback applies the same preservation/reference policy before a single storage write. Header reports added/preserved counts, rejects invalid files with an accessible error and permits retrying the same file.
- Import/export is local file I/O, not cloud synchronization. JSON exports contain article data only, not custom workflow/category/template definitions or binary attachments; they are not full database backups. Unknown custom references reject for new IDs rather than being silently reassigned.
- Block the example-reset action on desktop. A database restore/reset requires a separately reviewed design and owner authorization.
- Exclude common database/backup/export filenames and dedicated private folders from Git. Publish only source, documentation and explicitly synthetic fixtures. This does not audit Git history or prevent arbitrary personal filenames from being staged.

## Consequences and verification

No dependency, schema migration, authentication or CI configuration change is introduced. Overwrite/synchronize/restore modes and binary attachments are deferred. This default can be reconsidered after the owner has time to review the alternatives; changing code does not authorize changing actual saved data.

See the [validation and AntiGravity script](../testing/PHASE-6.4-LOCAL-IMPORT-VALIDATION.md). Synthetic file-backed tests cover preservation, retry, reopening, invalid references, relation conflicts and whole-batch rollback. Owner desktop import acceptance, remaining accessibility and full independent Gate B remain open.
