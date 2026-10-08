# Phase 6.5 Increment 5 — Startup and Início corrective validation

Date: 2026-10-07 (America/Sao_Paulo). Status: implemented, accepted in the three bounded installed Windows checks, published as `71d25c0` and validated by all four CI #28 jobs. Main integration and broader distribution remain separate. Authority: [ADR-017](../decisions/ADR-017-OPEN-EDITORIAL-STARTUP-AND-CATEGORY-CUSTOMIZATION.md) and the [corrective specification](../specifications/phase-6.5/PHASE-6.5-INCREMENT-5-STARTUP-AND-HOME.md).

Current source checkpoint: authenticated API confirms [CI #28 / run 37657094508](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37657094508) passed frontend, Rust Windows, Rust Linux and required Rust aggregate on `71d25c088887231001329ae3d9fc659dcc6ad5a5`, branch `codex/phase-6.5-runtime-pilot`. Separate dependency maintenance is integrated into main `5f7ba34`, with all four CI #31 jobs passed. The owner authorized incorporating that main into the pilot branch; the [consolidation record](PHASE-6.5-POST-SECURITY-CONSOLIDATION.md) distinguishes this source update from the unchanged installed candidate below. Preserve accepted installer/model checks; no new installed binary or combined-source CI is claimed. Earlier pending publication/CI statements below retain their historical dates.

## Baseline, preservation and acceptance

Live Git/remote checks confirmed `codex/phase-6.5-runtime-pilot` and its upstream at `6d0a4f3d83aefb45c8f78d5d5d70b9eac85b6ef7`, with `main` at `1b7de720ff8f87060cd2f945b8c65ec598679471`. The four jobs of [CI #27](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37537545421) passed on the published baseline. That CI does not validate the pending packaging source or these corrections. Preserve Phase 6.4 and integrated Increments 1–3; no branch reset, source integration, tag or release is included.

The existing 11-file packaged-pilot round was preserved. The owner accepted its original three installed checks (`1 OK; 2 OK; 3 OK`) and then supplied review A–D: catalogs initially absent, old catalogs appearing after creation, technical classification/origin labels and three counted articles with only one visible. These findings block distribution; previous bounded acceptance remains recorded in the [original package validation](PHASE-6.5-INCREMENT-5-PACKAGED-PILOT-VALIDATION.md). The owner explicitly accepted suggested-category editing during this corrective round.

No installed application, installer or owner's editorial database was executed/opened by the agent. Access to the attached executable supports file inspection, not native window interaction: native computer UI control is unavailable in this session. Browser checks used a separate synthetic profile and native tests used disposable SQLite. No personal article content, actual database, model output or raw capture is included in Git.

## Diagnosis and final behavior

Source inspection found that native startup ran the legacy example seed when there were no articles, before publishing catalogs/UI state. The seed inserts example articles without stage/category IDs and repeats the globally unique history ID `h1`. A reproduction invoking the actual old seed with a synthetic constraint-enforcing in-memory adapter failed on that identity after inserting two unlinked articles. This is compatible with the reported two hidden/overdue records, but is not a replay of the owner's SQLite or proof of those records' exact origin. A read/seed failure previously left an apparently empty UI; a later catalog refresh exposed existing defaults. Browser storage also reintroduced examples for an explicitly empty list or read failure.

Final startup initializes the existing native database, reads the complete workspace, and enables creation only after success. It never inserts example articles. A failed read is visible and retryable without overwriting stored data. Fresh workspaces have zero articles and the existing suggested catalogs; deleting all articles or reopening an empty workspace does not repopulate them. Existing schema initialization and version remain unchanged.

Old records with missing/inactive stage or category IDs are preserved and discoverable in **Pautas para conferir** on the Kanban, with an explicit CMS action. Saving requires valid explicit choices; native stage assignment also handles a legacy null reference without panic. No startup remapping/deletion is performed. Existing profiles can therefore retain three articles: the fix makes them discoverable, rather than silently reducing the total to one.

Category rename resolves labels by stable ID throughout the UI and import; suggested/custom origins support the same guarded mutation. Referenced removal requires an active distinct destination, with transactional reassignment; removal of the last active category remains blocked. Structural refresh reloads affected articles and reconciles filter selections. Shared deadline rules use local calendar dates, with **Próximos 7 dias** explicitly covering today through six days ahead. Article views explain displayed versus total counts and offer **Mostrar todas as pautas**.

**Início** opens by default and is first in the left navigation, followed by Kanban, CMS, Calendar, Statistics/achievements, Notes and Editorial Settings. It provides guidance, actions, recent saved work and actual recorded achievements. Research/accessibility achievements require relevant nonempty completed checklists; no achievement is granted just because the workspace is empty. These criteria also replace the misleading old statistics badges. Checklist progress is not certification. Stage classification uses plain Portuguese names; publication role is explained independently of classification or AI recommendations.

## Verification

| Check | Observed result and boundary |
| --- | --- |
| `npm test` | **Pass: 364 tests / 29 files**, including existing packaging checks, startup snapshot/error/storage cases, counts/dates, category mutation and import compatibility. |
| Focused post-change frontend tests | **Pass: 44 tests** across startup/home, browser domain and import cases after date/state projection changes. |
| TypeScript, scoped ESLint and Next static builds | **Pass**. Final package builds use Next `16.3.4` and include type checking; final page lint passed after the reduced-motion class change. Existing `.eslintignore` warning remains. |
| `cargo fmt --check` | **Pass**. |
| `cargo test --locked --test phase64_domain --test article_import` from `src-tauri`, debug and release profiles | **Pass: 24 tests in each profile** (17 domain, 7 import), covering actual disposable SQLite reassignment/rollback, stable rename, invalid targets, last category, null-stage repair and renamed-label import. No owner database or model calls. |
| Compiled React/browser fixture | **Pass: 21 checks**, Chrome `154.0.8037.98`, isolated synthetic browser profile using actual components/browser fallback and compiled CSS; unexpected native calls reject. |
| Browser keyboard/focus and state | Tab/Enter creation, view-heading focus, category edit/reassignment refresh, plain classifications, catalog nonduplication, unresolved-record reopen/repair, error blocking/preservation and retry passed; no unhandled page errors. |
| Bounded visual checks | Light/dark and 320-CSS-pixel screenshots inspected; no page-wide horizontal overflow. Measured Home text/actions meet applicable text contrast ratios (4.5:1 for ordinary text, 3:1 for large text) against composited backgrounds. Root color transition is disabled for reduced-motion preference. This is a sampled page check, not overall WCAG conformance. |
| Final local pilot build | **Pass**, release executable and NSIS installer retained in run `11c29cfd-4e20-4994-a22f-0cca2a360276`; total helper time **52.675 s**, native compile **37.31 s**. No installation/launch. |
| Installer signature | **NotSigned**, intentional local pilot; no public distribution approval. |
| Final delivery checks | **Pass:** 177 local Markdown file targets exist; tracked diff whitespace and 14 new-file whitespace/conflict/final-newline checks pass. All 11 previously pending files remain present within the 41-file source round. Retained executable/installer sizes and hashes, normal/pilot configurations and helper match the final receipt; binary/receipt/browser captures are ignored by Git. Link existence does not validate anchors or remote pages. |

Preparation failures were corrected before final checks: sandbox `EPERM` blocked a frontend test run before execution; an approved invocation passed. New native test code initially required correcting `unwrap_err` usage and matching the disposable fixture's nullable legacy schema; no production schema was relaxed. Scoped lint caught synchronous mount-effect state updates, corrected through the cancellable initialization microtask. A browser label locator and reduced-motion assertion were corrected to match actual labels and `transition-property: none`. Theme screenshots initially captured a transition midpoint; the final run waits for remaining header transitions, measures actual composited text contrast and respects reduced motion. Earlier failed/preliminary invocations are not reported as successful checks.

No new inference was run. Preserve accepted Increment 4 model/operational evidence and previous desktop AI/CMS checks without repetition merely for confirmation. Linux installed runtime, NVDA/manual accessibility, model licensing, signing and public distribution remain separate.

## Final candidate identity

Local receipt/artifacts: `.retranca-local/phase65-packaged-pilot/11c29cfd-4e20-4994-a22f-0cca2a360276/`. Source baseline is published `6d0a4f3` plus pending package source and the runtime corrections described here. Version remains `0.1.0`; no release tag was created.

| Artifact | Bytes | SHA-256 |
| --- | --- | --- |
| `retranca-pilot.exe` | 19,273,728 | `f06acaa8f69bf6b194fba2bf60320623627287cf025fc6a956ab8b18dabbcb4b` |
| `Retranca OS Pilot_0.1.0_x64-setup.exe` | 5,306,254 | `ba4050ba0787c0107c5605fd566510a783822a71860261bfe86976cbf53c51ff` |

The normal config remains `edcf235ae9e2af94956941f70cc6a5304d5a27e8eb1c36fc1d4cde967bf436c6`, pilot overlay `46d4f7008b2f0c12220275b574cb42ad308891e149d59ba03bbd31db10a2069c` and guard-helper `50acc20e2f151aa6fb0b49a0fe4eef79efb511d2c0406146da3ed1dcd74ee167`. Pilot identity remains `com.jornalistainclusivo.retranca.pilot` / **Retranca OS Pilot**, separate from the normal application. These hashes identify local files; they are not signing or reproducible-build attestation. Existing environment values were not inspected. Earlier runs `569a9ad8-fbba-4ad8-8c84-d7762b6bf5e1`, `3efbc880-394c-4407-9698-5c16ebb00668` and `c686486a-63ba-48c4-a911-1bbe77b68a0b` remain retained historical/preliminary candidates; use this final run for the corrective handoff.

Browser screenshots/receipts and the synthetic seed reproduction remain ignored under `.retranca-local/phase65-startup-home/`. No new dependency, schema migration, database version, IPC permission, production identity, model setting, CI configuration or model download was introduced.

## Owner acceptance — 2026-10-07

After the corrective installer handoff below, the owner reported **`1 OK; 2 OK; 3 OK`**: Início/creation with catalogs ready, article visibility/counts/restart, and category customization with safe reassignment/plain stage labels. This is owner-reported acceptance of the three bounded installed Windows checks associated with the final candidate `11c29cfd-4e20-4994-a22f-0cca2a360276`. It is not an additional agent-run observation or a full accessibility, model-quality, Linux or distribution acceptance. Preserve the original accepted AI/model checks and both pilot acceptance checkpoints; no repetition is needed solely for confirmation.

The owner separately authorized the local commit on 2026-10-07: **`Sim, autorizo. pode criar o commit.`** Commit scope: the 41 reviewed package-source/corrective files, including tests, specifications, decisions and acceptance documentation, with message `fix(phase-6.5): correct startup and add home experience`. Pautas, databases, raw captures and executable/installer artifacts remain outside Git. The resulting identity is recorded by Git history; push, manual CI, merge and release retain separate authorization gates. Existing CI #27 covers only the published baseline, not this round. No application-source change or repeat runtime test is needed for this authorization/documentation update.

## Accepted AntiGravity handoff — retained for traceability

Save and close an open pilot before updating it. Source edits do not automatically update an already installed executable. Install the final local candidate, then open its own **Retranca OS Pilot** shortcut; no development server is needed:

```powershell
cd C:\Users\RFERRAZ\Documents\retranca-editorial-os
git status --short --branch
Start-Process -FilePath '.retranca-local\phase65-packaged-pilot\11c29cfd-4e20-4994-a22f-0cca2a360276\Retranca OS Pilot_0.1.0_x64-setup.exe'
```

1. **Início and creation:** Início is first in navigation and opens initially. Read the instructions, use Tab to reach its actions and create/save a synthetic pauta named `TESTE RETOMADA 6.5`. Suggested stages/categories must be usable immediately. A never-used profile starts at zero articles; an already-used pilot retains its saved records.
2. **Visibility/counts and restart:** Open Kanban and choose **Mostrar todas as pautas** if filters are active. The saved test article must be visible and totals/overdue filters must correspond to discoverable records. If **Pautas para conferir** appears, each preserved unresolved record must have a CMS entry; do not delete it solely to make counts smaller. Close/reopen the pilot: saved work and catalogs must remain, without new automatic articles.
3. **Customization:** Rename one suggested category and confirm its associated test article shows the new label. Use synthetic pilot data only: removing a category that holds the test article must request a destination and retain that article after confirmation. Stage classification options must read **Ideia, Pesquisa, Redação, Revisão, Publicado**, without Backlog or AI recommendation suffixes. The last active category/publication-role protections remain intentional.

The owner reported `1 OK; 2 OK; 3 OK` on 2026-10-07 for this handoff. This accepts only the corrected installed Windows pilot; it does not authorize a commit, push, CI dispatch, merge, tag or release. Those actions require separate owner approval against the reviewable source scope. No repeat model generation or personal-data import is requested.
