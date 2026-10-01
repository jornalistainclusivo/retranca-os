# ADR 014: Article CMS Content Persistence

## Status

Accepted product decision — 2026-10-01 (America/Sao_Paulo); implementation validated locally and three owner checks reported as passing. The owner subsequently authorized the local consolidation commit. Full independent review and publication remain pending.

The owner reported that pasted analysis text appeared in unrelated articles. Asked whether **Conteúdo para análise** should also survive an application restart, with notice that this requires a database change, the owner explicitly selected **“Sim, salvar com cada pauta”**. This authorizes preparing per-article persistence. Applying the migration to the owner's editorial database remains subject to the user's separate migration confirmation rule; no such database mutation was performed by the implementation agent.

The owner confirmed saving and closing the application to unblock compilation, then clarified that the A/B test had not been performed. That response does not establish desktop acceptance or authorization to apply the migration.

The owner later reported **“resultados dos testes: 1 OK; 2 OK; 3 OK”** and authorized continuing development. This establishes owner-reported acceptance of article separation, save/cancel/clear and restart persistence under the supplied script. The agent did not run a migration against the actual editorial database or inspect its schema/backup; do not invent an earlier authorization event. No additional migration is planned. New migrations/restores and commit/push remain separately controlled.

## Context

The original Phase 6.3 PRD deferred persistent article body storage. `ArticleModal` instead held one analysis-content state value while switching articles. Unlike summary/objective, it was not part of the article's CMS save; visual description also lacked article ownership. This can display and submit evidence from the wrong article.

## Decision

- Add optional `Article.analysisContent` for compatibility with older JSON/fixtures, backed by SQLite `articles.analysisContent TEXT NOT NULL DEFAULT ''`. Missing historical content loads as empty; it must never inherit another article's text.
- Bind the textarea, save payload and AI evidence to the open article. Explicit **Salvar Pauta no CMS** persists the raw text; closing without saving discards changes. Reopening reloads the article's current saved data, including reopening the same ID.
- Persist through the existing article adapter/metadata save and browser fallback. JSON export/import includes the field through the existing article representation. The current Header import replaces browser storage/UI state; it does not persist the imported collection to desktop SQLite. Do not treat that import as a native database restore.
- Reject nonstring imported `analysisContent` before replacing browser data; missing/null legacy content remains empty. Protect the modal against malformed values already present in memory/storage.
- Keep visual descriptions as session-only drafts in a `Map` keyed by article ID, including IDs matching inherited object property names. File/image attachments and multimodal inference are separate work; this decision does not add them.
- Add a no-argument native `migrate_article_content` command, invoked after the existing workflow migration and before the Drizzle client is returned. The command uses the managed SQLite pool, serializes concurrent calls, verifies schema state and creates a uniquely named `VACUUM INTO` backup beside the database before any change.
- Upgrade `user_version` from 1 to 2 and add the column in one SQLx transaction. Failed transactions roll back. Version 2 reruns validate the field and perform no rewrite or new backup. Unexpected/partial schemas fail closed. Native workflow commands continue to accept workflow-compatible versions 1 and 2; later unknown versions remain rejected.
- Share initialization across concurrent frontend callers. Database/storage failures propagate; the save UI waits for success and preserves its current text with an accessible error on failure.
- Scope save-result callbacks to the active dialog session. Closing/switching a dialog suppresses stale close/error/loading callbacks; it does not cancel or roll back an already started database write. Disable the editable form while its save is pending.

ADR-008 remains the native AI authority. Saved text is still untrusted editorial evidence; persistence does not bypass projection, escaping, context budgets or action prerequisites. ADR-009/010/013 remain unchanged.

## Recovery and consequences

Existing article metadata, IDs, workflow/category references, checklists and history are preserved. There is no text to backfill from the old shared session field because it had no reliable persisted article owner; do not automatically copy that value into articles. The owner should preserve any currently needed unsaved text before restarting.

Backup names begin with `retranca-article-content-backup-` and remain beside the existing database. Reverting the source alone is insufficient after upgrading to version 2: the older version rejects that schema. Any restore/downgrade must preserve the current database, account for edits made after the backup and receive separate human authorization. No automatic restoration or destructive migration is introduced.

Full text now participates in local database and JSON backups. It is not sent to a provider merely by saving; inference remains an explicit action through the existing local Rust boundary.

## Acceptance

- Two articles save and reopen distinct full texts; an empty third article remains empty.
- Reopening the same article loads its saved text; unsaved edits do not silently become persistent.
- Native migration preserves existing records, defaults old articles to empty content, verifies its backup, survives reopening and is idempotent under concurrent calls.
- Backup failure or unexpected schema prevents schema/data mutation.
- SQL/storage write failures remain visible rather than reporting success.
- Browser fallback and adapter round trips retain the per-article field.

See [validation and owner handoff](../testing/PHASE-6.4-ARTICLE-CONTENT-VALIDATION.md) and the [review/fix follow-up](../testing/PHASE-6.4-ARTICLE-CONTENT-REVIEW.md). The three functional owner checks are accepted as reported; full independent review, broader accessibility/runtime acceptance, commit/push, merge and release remain separate gates.
