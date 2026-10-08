# Phase 6.5 — Consolidation after dependency integration

Date: 2026-10-07 (America/Sao_Paulo). Scope: incorporate the accepted main dependency patch into the existing pilot-source branch, preserve its source and owner acceptance, and correct stale publication/CI checkpoints. The owner explicitly authorized the merge and one local commit; push, manual CI, pilot-source PR/merge and distribution retain separate authorization.

## Verified source identities

| Source | Exact identity | Current evidence |
| --- | --- | --- |
| Published pilot branch | `codex/phase-6.5-runtime-pilot`, `71d25c088887231001329ae3d9fc659dcc6ad5a5` | All four [CI #28](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37657094508) jobs passed. This source includes metadata/native pilot, packaging and the accepted startup/Início corrective. |
| Dependency source | `codex/security-dependencies`, `ad6d84ca22f09553e47b4a9c9d66bbcb1835f444` | The resumed original independent candidate-review cycle completed; all four CI #29/#30 jobs passed. [ADR-018](../decisions/ADR-018-DEPENDENCY-SECURITY-MAINTENANCE.md) records the bounded patch and residual findings. |
| Integrated main | `5f7ba349acafe2dc45b9bbadd3271bac4440d86a` | Authorized [PR #7](https://github.com/jornalistainclusivo/retranca-os/pull/7) merged with parents `1b7de720ff8f87060cd2f945b8c65ec598679471` and `ad6d84ca22f09553e47b4a9c9d66bbcb1835f444`. All four [main CI #31](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37695557140) jobs passed. Both source branches were retained. |

Authenticated GitHub API verified each run's exact SHA and successful frontend, Rust Windows, Rust Linux and required Rust aggregate. No open pilot PR existed at intake. These results do not validate a later combined Git revision.

## Consolidation and preservation

The local branch was clean and synchronized before `git fetch origin main`. A merge-tree preview retained the three Increment 4–5 commits and identified one README conflict, between integrated readiness/diagnostic history and dependency/security rows. The owner explicitly approved incorporating `5f7ba34` into the pilot branch with a local merge commit, preserving its work.

The merge was started with `--no-commit --no-ff` on the exact approved SHA. The README conflict was resolved by preserving both accepted pilot behavior and current main dependency status; its obsolete claim that removing SQLite triggers example seeding is corrected to the accepted empty-workspace/catalog behavior. CHANGELOG/task history is retained and superseded by current checkpoints. The production plan, ADR-018 and both pilot-validation entry points now record publication of `71d25c0` and CI #28 rather than describing them as pending.

Git diff guards confirmed that executable dependency/test files match main exactly: `package.json`, `package-lock.json`, `src-tauri/Cargo.lock` and `__tests__/dependency-typography-compatibility.test.ts`. Existing application, native, packaging/configuration and pilot source matches `71d25c0`; the complete changed-path allowlist contains only those four files and eight documentation files. The prepared commit's final merge identity is recorded in a local ignored receipt; no extra documentation commit is needed solely to insert a self-referential SHA.

Earlier complete local validation already exercised this same dependency patch over `71d25c0`: 372 frontend tests in 30 files; 141 Windows Rust tests in each debug/release profile, one ignored; types, lint, static Next 16.3.6 build, formatting and locked checks passed. [ADR-018](../decisions/ADR-018-DEPENDENCY-SECURITY-MAINTENANCE.md) retains the exact scope. Reuse that accepted evidence only after confirming identical executable files and preserved application source; do not present it as new execution or remote CI for this consolidation. Do not repeat the model, installer or unchanged full suite merely for confirmation.

The owner database, AppData, installed executable, model choice and raw pilot output are not read, copied, migrated or committed. The accepted installed candidate remains the one identified in the [startup/Início validation](PHASE-6.5-INCREMENT-5-STARTUP-AND-HOME-VALIDATION.md). A source dependency merge does not update that binary or transfer its acceptance to an unbuilt replacement. No UI/IPC/schema/CI protection change, model download, release tag or public binary is included.

## Current local verification

| Check | Result and boundary |
| --- | --- |
| Source preservation and exact dependency/test diff | Passed against the two immutable parent identities above; no app/native/packaging behavior change. |
| Root `npm ci --no-audit --no-fund` | Passed, 540 packages in 27 seconds, explicit bundled Node `24.19.0` and existing npm CLI. Root node_modules is aligned to the reviewed lock. The owner's Node installation/settings were not changed. |
| TypeScript `tsc --noEmit --incremental false` | Passed on the current root installation. |
| Focused dependency regression | Passed: eight tests in one file, `npm test -- __tests__/dependency-typography-compatibility.test.ts --exclude '**/.retranca-local/**'`. The first unscoped local invocation counted the same fixture in the ignored security worktree as well (16 checks in two files); the explicitly scoped run records the current checkout only. No test/CI configuration was changed. |
| `node scripts/packaging/build-local-pilot.mjs --check` | Passed: unchanged pilot identifier/product/version and preinstalled WebView2 requirement. No native compilation, installer execution or model call. |
| Documentation guard | Passed: eight files, 131 existing local Markdown targets, final newlines and no conflict markers; remote URLs/anchors were not validated. |
| Whitespace | `git diff --check` passed. Normal Windows LF/CRLF conversion notices are not errors. Final staged scope/whitespace is checked immediately before commit. |

Inherited esbuild-kit deprecation and Vite future config-loader warnings remain visible; no suppression or cleanup was added. Receipts and the small integration checker are ignored under `.retranca-local/phase65-resumption-2026-10-07/`. The earlier complete temporary-copy suites are preserved as earlier execution, not relabeled as new full local tests; exact combined-source remote CI remains pending.

## Current and next gates

1. Finish preservation/documentation checks and the explicitly authorized local merge commit.
2. Obtain separate push and existing manual CI authorization for the combined source. Bind the next run to the resulting SHA; CI #28 and #31 remain distinct accepted baselines.
3. After combined-source CI and a bounded review, prepare the Increment 4–5 pilot-source PR for main. Draft publication, readiness and merge keep their own authorization; no existing approval is silently reused for another PR.
4. Continue the [Phase 6.5 plan](../architecture/PHASE-6.5-PRODUCTION-EXPERIENCE-PLAN.md) with bounded packaged cancellation/recovery and manual accessibility evidence, preserving already accepted checks. Installed Linux runtime, licensing/security/signing and public distribution remain separate; no new feature is implicitly added during source consolidation.

Residual glib and the separately recorded braces chain remain unresolved. Source CI cannot close those findings, certify WCAG or establish a publicly distributable application. An embedded engine remains the preferred future delivery under ADR-016; existing external Ollama authority and user-selected models are preserved.

## AntiGravity

After the local commit, inspect the repository without resetting or switching its branch:

```powershell
cd C:\Users\RFERRAZ\Documents\retranca-editorial-os
git status --short --branch
git log -1 --oneline
```

The branch must remain `codex/phase-6.5-runtime-pilot`, with a clean worktree and the new merge ahead of its published pilot head. No new functional test or `npx tauri dev` is required solely for this documentation/source consolidation. The installed pilot is unchanged; any later rebuild/update requires its own identified candidate and bounded handoff.
