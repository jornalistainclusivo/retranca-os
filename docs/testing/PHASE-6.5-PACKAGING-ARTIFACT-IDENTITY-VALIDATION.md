# Phase 6.5 — Packaging artifact identity validation

Date: 2026-10-08 (America/Sao_Paulo). Status: local checks passed; commit, push and remote CI/integration of this correction pending.

## Source and preserved evidence

- Baseline: main `b462e183b18a08e989b26520ddd3899ce2bd98dd`, authorized [PR #11](https://github.com/jornalistainclusivo/retranca-os/pull/11) documentation integration.
- All four [main CI #43 jobs](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37869770300) passed on that exact baseline. API updated time: 2026-10-09T01:41:40Z; local date: 2026-10-08. This is baseline evidence, not CI evidence for the pending patch.
- Local branch: `codex/phase-6.5-installer-receipts`, reusing the managed worktree while preserving the original AntiGravity checkout, historical branches and ignored candidates.
- Scope: two helper/test files and six documentation files. Application UI, Rust, configuration, dependencies, database, model, CI workflow, license and application version are unchanged.

The [contract](../specifications/phase-6.5/PHASE-6.5-PACKAGING-ARTIFACT-IDENTITY.md) records why the expected installed hash differs from the raw executable hash.

## Executed local checks

Environment: Windows, Node.js 24.19.0, installed Tauri CLI 2.11.4, Vitest 4.1.11 and the existing project lockfile.

| Check | Result and scope |
| --- | --- |
| `vitest run __tests__/packaged-pilot.test.ts` | 19 tests passed: seven existing boundary cases plus expected-hash/raw-preservation, six invalid-marker cases, three unsupported-version cases, binary-input rejection and actual exclusive-copy/receipt-role behavior using inert temporary files. |
| `tsc --noEmit --incremental false` | Passed using the current project configuration. |
| Scoped ESLint on the helper and packaging test | Passed. |
| `node scripts/packaging/build-local-pilot.mjs --check` | Passed; isolated Pilot identifier/product/version, audited CLI 2.11.4 and existing WebView2 prerequisite; no installer execution. |
| Accepted candidate hash comparison | Passed using only its retained raw executable and the new pure derivation; no application execution or installed-file reread. |

Vitest emitted the existing warning about ESM in a CommonJS-loaded configuration before a future Vite native-loader default. ESLint emitted the existing unsupported `.eslintignore` warning. Both commands succeeded; this bounded correction does not migrate test/lint configuration or suppress warnings.

## Accepted candidate comparison

Candidate: `fd2d53cf-6b5b-4141-acb6-919ba7765cfa`; 19,273,728 bytes.

| Identity | SHA-256 |
| --- | --- |
| Retained raw executable | `657eae7078a25e397a58b027336dfee021efd5a89fc93dd6997386152a3f2b3e` |
| New derived expected unsigned NSIS executable | `723522ea94b6dd95eb0c6c9744a49089f0f29bc16067779c8e55a80cbe19c36d` |
| Previously observed installed executable | `723522ea94b6dd95eb0c6c9744a49089f0f29bc16067779c8e55a80cbe19c36d` |

The previously observed value and owner acceptance come from the [installed identity record](PHASE-6.5-INCREMENT-7-INTEGRATION.md#installed-executable-identity). This comparison confirms the helper reproduces that recorded payload identity while retaining the raw hash; it does not create another installed observation or amend the old receipt.

## Review and limitations

The bounded source review covers marker/version guards, immutable raw bytes, separate artifact roles, expected-versus-observed wording and exclusive copies. All 131 local Markdown link/anchor checks passed across the six documentation files, with Markdown parsing, manifest/command consistency, exact eight-file scope, newline/whitespace/conflict/private-path guards and Git diff checks. Command results and final file identities are retained in the supplemental local checkpoint.

No new build, installer launch, installation, inference, editorial-data inspection or repeated manual test occurred. No Rust or frontend application build was repeated for a packaging receipt-only correction. Existing installed owner acceptance is preserved within its original scope.

The copied-artifact test exercises the real receipt-producing function with inert files; the full build/NSIS pipeline was not rerun. Signed or different-toolchain output, installer extraction, independent-platform acceptance and public release remain unvalidated by these checks. No tag or release was created.
