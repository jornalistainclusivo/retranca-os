# Phase 6.4 Slice 8 — Resumption and UI Follow-up

Date: 2026-10-02 (America/Sao_Paulo). Status: six AI actions and all three CMS corrective checks reported passing by the owner; local checks passed; local consolidation explicitly authorized. Publication and remaining acceptance gates are separate.

## Subsequent authorized publication and continuation — 2026-10-02

The owner separately authorized commit, push and manual CI of `089174088a780d6fd481e395c4e89c48b7a8c0d5`. [Run 37064072955](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37064072955) completed successfully on that SHA (updated `2026-10-02T21:20:20Z`), with frontend, Rust Windows/Linux and required Rust aggregate all successful. This supersedes pending-publication wording in the historical preparation record below.

The owner then authorized continued development with autonomy. The next round delivers local preservation import and documents the production-experience draft; see [current validation/handoff](PHASE-6.4-LOCAL-IMPORT-VALIDATION.md). Its tests/security/desktop acceptance are distinct from this earlier CMS corrective. Gates B/C/D remain open.

## Verified starting point

The owner authorized resuming development under the existing documentation. At the start of this round, the local tree was clean on `feat/phase-6.4-pro-workflow-customization`. Local HEAD, its tracking ref and the GitHub branch ref were all `c03c928252ee498a87bb1abe221d3e4c7a07c93e` (`fix(phase-6.4): persist per-article CMS content safely`). The owner had separately authorized its commit, push and manual CI dispatch.

The GitHub API confirmed [CI run 36940623994](https://github.com/jornalistainclusivo/retranca-os/actions/runs/36940623994) as `completed / success`, on that exact source SHA, with four successful jobs: frontend, `rust (windows-latest)`, `rust (ubuntu-latest)` and the required `rust` aggregate. The run was updated at `2026-10-01T23:44:14Z`; it was rechecked on 2026-10-02. No open PR for this feature branch was returned at this checkpoint. This CI result belongs to `c03c928`, not the later uncommitted changes below.

`ollama list` confirmed the owner's selected `gemma4:latest` tag is installed. Inventory is availability evidence only: this round has not yet observed its inference through the desktop application. No model was downloaded or substituted.

The three article-content checks reported as passing on 2026-10-01 remain accepted. Do not repeat them merely to reconfirm persistence. The agent has not inspected or modified the owner's editorial database or backups.

## Implemented follow-up

- Replace the obsolete hardcoded `Gemini 3.6 Flash` footer and its unverified conformance label with `IA local • Revisão humana`. The selected model remains visible through the existing local AI controls; the footer does not pretend to identify a running model.
- Add an accessible loading status (`Carregando pautas...`) to the article list. Its spinner is decorative.
- Make the article-list spinner and AI pulse indicators honor reduced-motion preferences. Decorative streaming dots are excluded from the accessibility tree; existing textual generation statuses remain available.

This is a narrow UI correction under ADR-008/013/014 and the existing accessibility acceptance scope. It introduces no architecture decision, dependency, migration, provider, CI/authentication change or attachment capability. The [test specification](../specifications/phase-6.4/PHASE-6.4-TEST-SPECIFICATION.md) records the corresponding acceptance delta. It does not establish WCAG conformance or close independent Gate B.

## Validation record

| Check executed on 2026-10-02 | Result | Scope / limit |
| --- | --- | --- |
| `npm test` | 236 passed, 20 files. | Existing frontend regression suite on this UI follow-up. No real-model or desktop inference. |
| `npm run lint` | Passed. | ESLint. |
| `npx tsc --noEmit` | Passed. | TypeScript. |
| `npm run build` | Passed, Next.js 16.3.4 static export. | Compilation/export, not installation. |
| Generated export CSS inspection | Reduced-motion media query, `motion-reduce:animate-none` and `sr-only` utility present. | Generated styles verified; no actual preference, visual or screen-reader observation. |
| `git diff --check` | Passed. | Tracked patch whitespace. |

Vite emitted its existing config-loader notice and ESLint its `.eslintignore` deprecation notice; neither failed the executed checks. These 236 tests and CSS checks belong to the initial UI follow-up, before the subsequently reported CMS defect below. No new test was added merely to mirror the changed footer/classes. No Rust source or IPC contract changed, so native suites were not rerun for this follow-up; the prior exact-source Windows/Linux CI evidence remains separately identified above. Static source/build checks do not establish actual desktop announcements, reduced-motion behavior or accessibility conformance.

## Subsequent owner result and CMS corrective

The owner reported **“Todas as opções com inteligência artificial estão funcionando corretamente”** after the six-action handoff. Record this as aggregate owner-reported functional acceptance of the six actions, not independently observed inference or a comprehensive quality evaluation. Individual outputs, timings and runtime traces were not supplied; the model tag was not restated in this response. The installed `gemma4:latest` remains the documented handoff selection. No repeat of the six actions is requested for the unrelated save correction.

The owner also requested removing **Recomendado** from **Pesquisar Lacunas** and supplied a screenshot of the generic CMS-save error, with the form retained. That screenshot establishes a failed save observation, without its underlying SQL exception. The owner confirmed the request to preserve the unsaved text before proceeding (`ok. siga`). The agent did not read the owner's draft copy, editorial database or backups.

### Reproduced cause and correction

`createNewArticle` reused `c1` through `c6` for every new article. `checklist_items.id` is a global primary key. A second article can therefore fail its checklist insert after metadata/history have already been written. Timestamp-only article/history IDs could also collide. Two new regression tests failed on the former source; an isolated SQLite insertion reproduced `UNIQUE constraint failed: checklist_items.id`. This proves a defect in the save path; no actual editorial database exception was collected to assert that every possible cause of the owner's generic error is known.

- New articles use UUID-based identities; their default checklist IDs are article-specific. New CMS history, custom checklist and template-copy entries also use UUIDs.
- Before any metadata write or checklist deletion, `saveRawArticle` reads ownership for incoming and candidate checklist/history IDs. Existing IDs owned by the same article are preserved. New IDs and legacy collisions receive a deterministic, unambiguous article-scoped identity; the original other-article rows are not changed.
- Retry of an old or partially saved draft uses the same candidate identity rather than duplicating history. Conflicting candidate IDs, duplicate inputs and wrong owners reject before writes. No schema migration or mass rewrite is introduced. This preflight does not make the existing multi-step save transactional or prove concurrent edits to the same article are serialized.
- **Pesquisar Lacunas** no longer appends **Recomendado**. Availability, native evidence checks and the other actions' recommendation labels remain governed by the existing contracts.

The [optional real-SQLite probe](../../scripts/testing/verify-cms-save-sqlite.mjs) bundles the production initialization/Drizzle bridge, adapter and save API, replacing Tauri transport with a disposable file-backed SQLite connection. It successfully checked legacy collision recovery after partial metadata persistence, repeat saves without duplicate history, loaded content, preservation of another article and rejection before writes. The content-migration IPC is simulated; the workflow SQL executes only inside the disposable database. This is not testing the owner's Tauri window, native IPC, backups or actual database.

The probe uses the existing installed `esbuild` and the [Node 22.12 SQLite API](https://nodejs.org/download/release/v22.12.0/docs/api/sqlite.html), which requires the experimental flag. It is optional local evidence; frontend CI remains on Node 20 and does not execute this probe. No dependency or CI configuration changed.

```powershell
node --experimental-sqlite scripts/testing/verify-cms-save-sqlite.mjs
```

Current corrective checks: **247 frontend tests / 22 files passed**, including eleven added regressions; lint, TypeScript, Next.js static build and tracked diff whitespace passed; real-SQLite probe passed. Native source is unchanged. The prior `c03c928` remote CI does not cover these uncommitted corrections. Existing Vite/ESLint notices and the optional probe's experimental SQLite warning did not fail the final checks.

### Owner handoff — CMS corrective accepted

**Owner response on 2026-10-02: `1 OK, 2 OK, 3 OK`.** This refers to the corrective script below: recovery/save/reopen with retained content/checklists and no Research Gaps recommendation suffix; a second independently saved article; and retained texts after restart. Record it as owner-reported desktop acceptance, separately from the isolated SQL probe and prior article-content smoke. No repeat is requested solely for reconfirmation. The agent did not inspect the owner's actual database, backups, draft copy or runtime logs.

The six-action script below is retained as history. Restart the development application with the existing commands, then:

1. Reopen the affected test article, restore the unsaved text from the owner's temporary copy if necessary, and select **Salvar Pauta no CMS**. Reopen it: text and checklist selections must remain. **Pesquisar Lacunas** must have no **Recomendado** suffix.
2. Create another disposable article, enter a different title and full text, and save. Reopen both: their content/checklists must remain independent, with no save error.
3. Close the application, stop `npx tauri dev` with Ctrl+C, start it again and reopen both test articles. Both saved texts must remain. If saving still fails, preserve the text and report the error; do not reset or restore the database.

These checks were justified by the reported regression and are now accepted as reported by the owner. They remain distinct from the originally accepted article-content checks and six-action AI report. The response authorizes neither a new commit nor a push; those confirmations remain separate.

## Owner handoff — six real-model actions

These checks are different from the already accepted three article-content checks. Use **Nova Pauta**, with disposable test content and no source identities or unpublished reporting. Saving this test article is unnecessary. Start from AntiGravity:

```powershell
cd C:\Users\RFERRAZ\Documents\retranca-editorial-os
git status --short --branch
ollama list
npx tauri dev
```

In **IA local**, select the installed **gemma4:latest** in **Modelo Ollama**. Runtime/provider detection is automatic; this panel does not expose a separate provider selector. If another development instance is running, stop it with Ctrl+C before starting the updated application. No new database migration is introduced by this follow-up.

Fill these fields in **Nova Pauta**:

| Field | Disposable test input |
| --- | --- |
| Título | `Teste de acessibilidade em bibliotecas` |
| Objetivo da Matéria | `Planejar uma reportagem sobre acesso a bibliotecas e identificar o que precisa de apuração.` |
| Conteúdo para análise (Texto completo) | `Texto de teste. A reunião está prevista para 10 de outubro, às 10 horas, na biblioteca. A pauta propõe perguntar como as pessoas acessam o espaço e os serviços.` |
| Palavra-Chave SEO | `acessibilidade em bibliotecas` |
| Descrição Visual para Alt Text (Apenas Sessão) | `Cena fictícia para teste: uma pessoa em cadeira de rodas está diante de uma estante de livros, com um corredor livre ao lado.` |

The inputs are explicitly synthetic. Alt text currently uses the human-written description; this is not a test of image upload or vision inference. Run one action at a time, waiting for each to finish:

| No. | Control | Functional observation | Output-quality observation | Current result |
| --- | --- | --- | --- | --- |
| 1 | Pesquisar Lacunas | Readable response; controls recover. | Suggests questions or verification needs without inventing sources or confirmed facts. | Owner reported all actions working; individual output not supplied. |
| 2 | Simplificar Linguagem | Readable response; controls recover. | Preserves the supplied meaning, date and time. | Owner reported all actions working; earlier smoke retained. |
| 3 | Validar Inclusividade | Readable response; controls recover. | Grounds suggestions in the supplied text without attributing an identity or intent to someone. | Owner reported all actions working; individual output not supplied. |
| 4 | Alt Text WCAG | Readable response; controls recover. | Stays within the written scene description; no invented visual details. | Owner reported all actions working; individual output not supplied. |
| 5 | Otimizar Meta Tags SEO | Readable response; controls recover. | Uses the supplied topic/keyword without unsupported claims. | Owner reported all actions working; individual output not supplied. |
| 6 | Revisão Editorial | Readable response; controls recover. | Distinguishes supplied content from suggestions and facts requiring verification. | Owner reported all actions working; individual output not supplied. |

For each action, report its number, whether it completed, and one brief observation or the exact error. Example response format: `1 OK — completion observed; brief output observation`. Do not mark output quality as accepted solely because a response appeared. If output invents a source or scene detail, report that explicitly even if inference completed. Record cancellation, timeout and failure rather than dropping unsuccessful attempts. If the application fails to initialize, stop and report the error; do not reset or restore the database.

No real-model output, latency, retries or inference cost has been collected by the implementer in this round. The aggregate owner response is functional acceptance; detailed human output-quality observations remain unrecorded. The table does not establish an executed comparative model evaluation or recommendation.

## Remaining sequence and limits

The owner explicitly authorized this local consolidation with **“sim, criar commit local”** on 2026-10-02. The authorized message is `fix(phase-6.4): prevent CMS save identity collisions`, covering the prepared CMS/UI corrections, tests, isolated SQLite probe and documentation. This authorization does not grant push, CI dispatch, merge or release. This document accompanies the consolidation; use `git log -1 --oneline` for its resulting revision.

1. Save the accepted CMS/UI round in the authorized local commit; preserve the reported desktop checks and six-action functional acceptance without promoting them to detailed output-quality evidence. Push requires its own authorization.
2. Perform the remaining desktop accessibility/error checks, including NVDA status/error announcements, zoom/reflow, contrast and actual reduced-motion behavior. Automated/source checks do not replace them.
3. Resolve the native JSON import/restore and packaged SIDECAR acceptance boundaries documented in the [closure plan](PHASE-6.4-SLICE-8-ACCEPTANCE-CLOSURE-PLAN.md), then complete independent Gate B before PR readiness. Choosing import replacement/merge semantics or deferring a mandatory requirement still requires an explicit product decision.
4. Ask separately before any subsequent commit and before pushing this round. Keep merge, release/tag and Phase 6.5 decisions separate. Attachments remain [discovery](../specifications/ARTICLE-ATTACHMENTS-DISCOVERY.md).

Preparation performed no new CI dispatch, PR, push, merge or release. The subsequent local consolidation is authorized as recorded above. The existing success on `c03c928` must not be reused as CI evidence for later source changes.
