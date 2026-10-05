# Phase 6.4 — Article CMS Content Validation

Date: 2026-10-01; evidence updated 2026-10-02 (America/Sao_Paulo). Status: local implementation and corrective review follow-up validated; owner reported all three original acceptance checks as passing. Subsequent authorized consolidation/publication and exact-source CI passed; full Gate B remains pending.

## Result and authorization boundary

The owner reported that **Conteúdo para análise (Texto completo)** appeared in unrelated articles and explicitly selected **“Sim, salvar com cada pauta”** when asked about persistence after restart. [ADR-014](../decisions/ADR-014-ARTICLE-CMS-CONTENT-PERSISTENCE.md) records that decision and the prepared implementation.

The textarea now belongs to the article's CMS data. Saving stores its raw text with that article; opening another article loads that article's saved text or an empty value. Visual descriptions remain session-only, keyed by article ID. Failed writes propagate to an accessible error instead of closing the dialog as though the save succeeded.

The owner's response **“Salvei e fechei o aplicativo”** confirmed only that the Windows application was closed to unblock Rust compilation. The owner subsequently clarified that the A/B test had not been performed. It is **not** migration consent, A/B acceptance or permission to commit/push. Implementer checks below are recorded separately from owner desktop acceptance.

**Subsequent owner acceptance — 2026-10-01:** the owner reported **“resultados dos testes: 1 OK; 2 OK; 3 OK”** and authorized continuing development. This accepts the script's article isolation, save/cancel/clear and restart behavior as owner-reported observations. No database/schema query, backup path, runtime trace or exact test data was supplied. The agent did not independently inspect the actual editorial database or its backup, and did not execute its migration. Do not retroactively treat the earlier application-close response as migration authorization. No additional migration/restore is scheduled; any such action still requires its own confirmation. This continuation does not request a commit or authorize push.

The agent ran no migration against the owner's editorial database. No installer, model download, real inference, attachment upload, push, CI dispatch, merge, tag or release was performed by the agent in this round. Validation preceded the owner's subsequent authorization for a local consolidation commit of the 32 prepared files. The working branch remains `feat/phase-6.4-pro-workflow-customization`, with published HEAD `543d03333414698d9aa4d9976aabf4080e21bbc2` at the preparation checkpoint; local consolidation does not update that remote revision.

## Implementation and recovery

### Subsequent authorized publication and remote CI — rechecked 2026-10-02

After the preparation checkpoint above, the owner separately authorized the commit, push and manual CI. The corrective was published as `c03c928252ee498a87bb1abe221d3e4c7a07c93e`. The GitHub API confirmed [run 36940623994](https://github.com/jornalistainclusivo/retranca-os/actions/runs/36940623994) as `completed / success` on that exact SHA: frontend, Rust Windows, Rust Linux and the required Rust aggregate all succeeded. Local HEAD, tracking ref and remote branch ref matched when development resumed with a clean tree. No open feature PR was returned. This later evidence does not change the original review/migration limits or establish acceptance of the subsequent UI follow-up.

### Prepared persistence behavior

- `Article.analysisContent` is optional for legacy JSON compatibility; SQLite adds `articles.analysisContent TEXT NOT NULL DEFAULT ''`. The adapter and browser storage round-trip it, and the existing JSON article export/import representation carries the field.
- Header JSON import currently replaces browser storage/UI state, without persisting the imported collection to desktop SQLite. It is not a desktop database restore. Nonstring analysis content is rejected before replacing browser data; the modal guards existing malformed values. Visual drafts use `Map` so reserved object-property IDs remain safe.
- Pending saves disable form editing and their UI callbacks belong to the opened session. Closing/switching suppresses obsolete success/error/loading callbacks; an already started storage write can still finish. Closing is not rollback.
- `getDb` shares one initialization promise and runs the existing workflow migration before `migrate_article_content`. Failed initialization can retry; SQL execution failures are no longer represented as successful empty results.
- The no-argument native command uses the managed database pool, serializes calls and validates versions 1/2. Version 1 requires the column to be absent; version 2 requires the expected type, non-null constraint and empty default. Unknown/partial states fail closed.
- Before changing version 1, `VACUUM INTO` creates a uniquely named `retranca-article-content-backup-<uuid>-<database filename>` beside the existing database. A SQLx transaction adds the column and upgrades `user_version` to 2. Successful version-2 reruns create no further backup or rewrite.
- Existing IDs, metadata, checklist/history rows and workflow/category references are retained. Historical shared session text has no reliable article owner and is not copied into unrelated articles. Previously unsaved full text cannot be recovered from the old database.
- Source rollback alone is insufficient after migration: the former version rejects schema 2. Restoring a backup requires preserving current data and any newer edits, then obtaining separate human authorization. No automatic or destructive restore is provided.

The SQLite schema transaction is atomic. This does not claim that the application's existing multi-step metadata/checklist/domain save is one transaction. Saved content remains untrusted evidence under ADR-008; the current AI payload uses the existing pasted-text path and applies the same native projection, escaping and budgets. Saving alone starts no inference.

## Executed local checks

| Check | Executed result | Scope |
| --- | --- | --- |
| `npm test` | 236 passed, 20 files | Final frontend suite, including article adapter/UI evidence, browser round trips, quota/driver failure, malformed imported content/reserved IDs and asynchronous save-session callbacks. Earlier content preparation passed 219 tests. |
| `npm run lint` | Passed | ESLint. |
| `npx tsc --noEmit` | Passed | TypeScript checking. |
| `npm run build` | Passed | Next.js static export; not desktop installation. |
| `npm run test:rs` | 106 passed | Native Windows debug suite: 67 unit, 4 content migration, 2 AI semantics, 15 domain, 17 workflow persistence and 1 shared-pool test. |
| `npm run test:rs:release` | 106 passed | Same native tests in Windows release profile. |
| `npm run lint:rs` | Passed | Rust format check and locked native compilation. |
| `node scripts/security-enforcement-test.mjs` | Passed | Existing debug-only raw inference registration enforcement; not a full security audit. |

Rust emitted existing unused-variable/mutability warnings in provisioning code. An earlier debug rebuild failed because the running application locked `app.exe`; after the owner confirmed closing it, the full suite above completed successfully. The final release run includes all four new migration tests, including concurrency.

The final review follow-up changed frontend code only. `npm test`, lint, TypeScript and build were rerun successfully afterward; the unchanged native source retains the executed debug/release results above. The test runner emitted an existing Vite config-loader notice and ESLint emitted its existing `.eslintignore` deprecation notice. Neither failed these checks. The [review follow-up](PHASE-6.4-ARTICLE-CONTENT-REVIEW.md) distinguishes the original frozen scan, its partial canonical coverage flag and the subsequent targeted fixes.

The native content tests use temporary file-backed SQLite databases. They verify preservation of existing records and the actual backup, distinct Unicode/multiline content after closing/reopening, an empty legacy default, idempotent/concurrent calls, rejection of partial/future schemas and refusal to alter the schema when backup creation fails. Frontend driver failure checks use mocks and do not establish real desktop save-error presentation.

## Implementer browser checks — separate from owner acceptance

A built static export was served on an isolated loopback origin `http://127.0.0.1:3014/`, using the in-app browser's own storage. No native editorial database or owner's article was accessed. No provider was invoked.

- Saved **Scope A CMS** with `Texto somente da pauta A.\nSegunda linha A.` and a session visual description.
- Opened new article B: its analysis text and visual description were empty.
- Saved **Scope B CMS** with `Texto somente da pauta B.`; reopening A showed only A's text and session description.
- Reloaded the browser: A and B retained their own saved texts, while A's session-only visual description was empty.

These are implementer browser-fallback observations. They do not replace owner testing in the Windows Tauri application, prove native database migration on the owner's data, establish all six real-model actions or demonstrate full accessibility conformance. The owner subsequently reported the three checks below as passing; keep the two evidence sources distinct.

## Owner handoff — three checks reported as passing

**Current owner status: `1 OK; 2 OK; 3 OK`, reported 2026-10-01.** Preserve the original handoff below for contributor traceability. No repeat is requested merely to reconfirm these accepted checks. The prior migration-confirmation request concerned the first startup; the agent did not perform it. Any new migration or restore still requires confirmation under the user's operational rule.

The handoff provided the existing AntiGravity development commands:

```powershell
cd C:\Users\RFERRAZ\Documents\retranca-editorial-os
git status --short --branch
npx tauri dev
```

Starting the new application invokes the prepared migration automatically during database initialization. Do not execute manual `ALTER TABLE`, reset the database or restore a backup. If startup reports a migration error, preserve the database and report the exact error before continuing.

Use two disposable test articles rather than existing editorial material:

1. **Separate texts:** create `Teste A`, put `Texto exclusivo de A` in **Conteúdo para análise (Texto completo)** and select **Salvar Pauta no CMS**. Create `Teste B`: that field must start empty. Enter `Texto exclusivo de B` and save. Reopen both: each must show only its own text.
2. **Save behavior:** in B, change the text to `Rascunho sem salvar` and select **Cancelar**. Reopen B: `Texto exclusivo de B` must remain. Then clear B's field and explicitly save; reopening B must show it empty while A remains unchanged.
3. **Restart:** close the application and stop `npx tauri dev` with Ctrl+C. Start it again with `npx tauri dev`. A must retain `Texto exclusivo de A`, B must stay empty and another new article must start empty. Existing articles, checklists and history must remain accessible.

The owner subsequently reported `1 OK; 2 OK; 3 OK` for this script. No model selection or AI generation is necessary for this save/isolation test. NVDA announcements, other accessibility checks and real-model acceptance remain separate pending work.

## Remaining gates and attachments

- [x] Owner reported script completion including restart persistence; no additional migration execution by the agent is planned. Actual schema/backup files were not inspected.
- [x] Owner checks 1/2/3 above, reported as passing on 2026-10-01.
- [ ] Independent technical/security review (Gate B), with migration/backup and save-failure scope included.
- [x] Owner's subsequent explicit authorization for the local consolidation commit of the 32 prepared files; recorded with this checkpoint.
- [x] Separately authorized push and manual CI on published source `c03c928`; all four jobs passed in run 36940623994, rechecked 2026-10-02.
- [ ] Remaining [Slice 8 acceptance closure](PHASE-6.4-SLICE-8-ACCEPTANCE-CLOSURE-PLAN.md), human merge and release decisions.

Image/text/document attachments are recorded in [product discovery](../specifications/ARTICLE-ATTACHMENTS-DISCOVERY.md). They are not implemented in this correction. Native alt-text generation still accepts a human visual description and rejects image-asset evidence; attaching an image must not silently grant multimodal inference.
