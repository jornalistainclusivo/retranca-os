# Phase 6.5 Increment 6 — Packaged recovery validation

Date: 2026-10-08 (America/Sao_Paulo). Scope: the [bounded Windows specification](../specifications/phase-6.5/PHASE-6.5-INCREMENT-6-PACKAGED-RECOVERY.md) and its Ollama 0.40.1 prerequisite correction. Status: corrected local source and Windows candidate prepared; all three bounded installed recovery checks passed by owner report on 2026-10-08. Broader reader/visual observations remain pending.

## Integration and preserved work

[PR #8](https://github.com/jornalistainclusivo/retranca-os/pull/8) merged as `0d2be58344323fb022942b8190465859651fac12`. Authenticated API confirmed all four [main CI #34](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37785724612) jobs passed on that SHA. This covers the baseline, not the later pending compatibility patch or an installed package.

The original AntiGravity checkout remains clean/synchronized on `codex/phase-6.5-runtime-pilot` at `2ac806fb44f2e7a7eb37f17b300d839fc1b8536d`. Work proceeds on `codex/phase-6.5-packaged-recovery` in `C:\Users\RFERRAZ\.codex\worktrees\phase65-packaged-recovery\retranca-editorial-os`, based on the main merge above. Accepted native/model and earlier Windows checkpoints retain their scope. The owner checkout and previously installed executables do not automatically receive worktree changes.

## Compatibility correction and verification

The initial candidate blocked the owner's updated runtime before the three recovery checks could start. The owner reported interim `0.40.0`, paused work during an update, then confirmed final `0.40.1` and authorized resumption. A fresh `/api/version` query independently confirmed `0.40.1`; this field reports the installed server, not an application version setting changed by Retranca.

The [ADR-016 amendment](../decisions/ADR-016-PRODUCTION-LOCAL-AI-PROVIDER.md#compatibility-amendment--2026-10-08) and [native contract](../specifications/phase-6.5/PHASE-6.5-INCREMENT-2-PROVIDER-READINESS.md) pin upstream `cf2a313a298066d572c36812e5ad30a21c0db13b`. Review confirms the final `:local` parser and local show/generate guards before remote proxy dispatch. The smallest fix adds exactly `0.40.1` to native and renderer support, retaining `0.35.1`, fresh metadata bounds, completion/GGUF checks and local-only generation. Unknown/modified/prerelease versions, including unaccepted `0.40.0`, remain blocked. No new provider, endpoint, IPC shape, dependency, permission, schema or daemon/model configuration is included.

| Check | Observed result and boundary |
| --- | --- |
| Full frontend suite | Pass — `node node_modules/vitest/vitest.mjs run` through explicit Node 24.19.0: 380 tests / 30 files. New fixtures accept both audited versions and reject purported READY for unknown/modified versions. No real inference. |
| Full lint and types | Pass — `node node_modules/eslint/bin/eslint.js . --ignore-pattern src-tauri` and `node node_modules/typescript/bin/tsc --noEmit` through Node 24.19.0. Existing ESLint ignore/Vite configuration warnings are retained. |
| Formatting and full native release suite | Pass — `cargo fmt --manifest-path src-tauri/Cargo.toml --check`; `cargo test --manifest-path src-tauri/Cargo.toml --release --locked`, using the separate pilot target directory. The live manual inference test remains ignored. |
| Native regression boundaries | Pass — both audited-version metadata paths and exact `:local` generation payload; unsupported versions stop before catalog/show; remote/non-completion cases cannot dispatch. Synthetic TCP cancellation observes client teardown with 0.40.1 metadata. This does not prove server/GPU termination. |
| Actual native metadata only | Pass — `cargo run --manifest-path src-tauri/Cargo.toml --example local_ai_readiness_probe --release --locked -- --model gemma4:latest`: `READY / LOCAL_REQUEST_ENFORCED`, server `0.40.1`, 249 ms, exit zero. No prompts, generation, download, app startup or editorial storage. Owner digest/raw metadata are not included here. |
| Fresh affected Windows package | Pass — unchanged helper `--build`, Node 24.19.0, Next.js 16.3.6 static export/types, locked native release without default features, x64 current-user NSIS; 91.065 seconds. Signature `NotSigned`. |
| Installed cancel/preserve 1; fresh generation 2; close/reopen/restart 3 | Pass by owner report — `1 OK; 2 OK; 3 OK`, 2026-10-08, following the corrected candidate handoff. Initial blocked candidate remains untested/superseded. |
| Actual NVDA, zoom/reflow, contrast and reduced motion | `not-tested` — broader manual sample remains separately pending. |

Existing provisioning `unused_mut` and test-only signing-key warnings remain. The build succeeded without suppressing warnings or changing dependencies. Source fixtures and metadata readiness do not establish installed WebView delivery, output quality, process attestation, atomic model identity or WCAG conformance.

## Current package identity

Current candidate: `.retranca-local/phase65-packaged-pilot/edae554b-088c-4588-9fb0-859c2a1f29b0/` in the worktree above. Pilot identity remains `com.jornalistainclusivo.retranca.pilot`, product `Retranca OS Pilot`, version `0.1.0`. The helper's ignored `build.json` records compilation, baseline/configuration/helper hashes and retained immutable output copies.

**The baseline SHA alone does not identify this package's source.** It was compiled with the pending compatibility patch below. Configuration/helper/manifests/locks/CI files remain identical to main; no commit/push/CI is implied.

| Changed source/test file | SHA-256 at build handoff |
| --- | --- |
| `src-tauri/src/local_ai_readiness.rs` | `5c960015e553a1d9fef5c3611aa9be3f1c30ad217e6200c80c6aa3634b40d919` |
| `src-tauri/src/ollama_gateway.rs` (regression fixtures only) | `ffa7b37f154e6f0889a1911dfbaed44ef977e691595734523d6c0e28d4b4985b` |
| `lib/api/localAiReadiness.ts` | `64887883890954e7f35e3613deb3b4c31c287ff87eeea47f870908baa0685fb2` |
| `__tests__/local-ai-readiness.test.ts` | `a68eb8a5399f51cc0b2ce2f5038d0895b1fe454b0686a09a954c829554536463` |

| Artifact | Bytes | SHA-256 |
| --- | --- | --- |
| `retranca-pilot.exe` | 19,273,728 | `89ad1719f4a95ed5c71da6121a9f40b1093b0353aff2ca6b8324fdd560d224bf` |
| `Retranca OS Pilot_0.1.0_x64-setup.exe` | 5,305,229 | `cea5d2ebd20aeb1c25facc259adadedfb2451f860c2970bf780aa39d07de8e86` |

## AntiGravity handoff

Save open work and close the installed pilot before updating. If the same-version installer offers reinstall or removal, choose reinstall while preserving data. Prior generated NSIS inspection confirmed this same-version choice avoids uninstall; optional application-data deletion on uninstall is outside this handoff. Stop on an unexpected removal/prerequisite/security prompt rather than deleting data or changing protection.

Run from any AntiGravity working directory:

```powershell
$pilotInstaller = 'C:\Users\RFERRAZ\.codex\worktrees\phase65-packaged-recovery\retranca-editorial-os\.retranca-local\phase65-packaged-pilot\edae554b-088c-4588-9fb0-859c2a1f29b0\Retranca OS Pilot_0.1.0_x64-setup.exe'
Get-FileHash -Algorithm SHA256 -LiteralPath $pilotInstaller
Start-Process -FilePath $pilotInstaller
```

Compare the hash with the installer row above. Open the installed pilot's shortcut, select the existing `gemma4:latest` and use **Verificar modelo**; confirm readiness on server `0.40.1`. Then resume the same three [synthetic recovery checks](../specifications/phase-6.5/PHASE-6.5-INCREMENT-6-PACKAGED-RECOVERY.md#owner-handoff--three-focused-checks). Do not substitute `npx tauri dev`: the preserved owner checkout still contains the earlier gate.

The agent did not install/launch the package, inspect an editorial database or generate text. The path is local, not a public GitHub release. App closure or READY alone is not acceptance of checks 1–3. Temporary AI suggestions need not persist; saved original article content must persist.

## Historical initial candidate

Initial run `7f0bcb56-0f0c-4641-bc45-1db7d7b5ad90` compiled from unchanged main source in 175.371 seconds, with documentation-only pending preparation. It retained the old 0.35.1 gate and is superseded for this updated-runtime handoff. Preserve its local receipt/binaries and earlier documentation/artifact checks (81 local link targets); do not transfer acceptance to the corrected package.

Initial executable: 19,273,216 bytes, SHA-256 `1e87bce49482064827d6cf842338a2b4bbf0323f33e41ff7aba280f8e4457659`. Initial installer: 5,304,723 bytes, SHA-256 `3342235e770d6a3b3fc68d6369ef09d04ac76aa9785e69131775d7c3e44faa98`. Dependencies were installed from the unchanged lock: 540 packages via npm 10.9.0/Node 24.19.0; existing esbuild-kit deprecations and optional cleanup EPERM warning did not prevent installation.

## Owner-reported installed acceptance — 2026-10-08

After the corrected installer handoff, the owner replied exactly `1 OK; 2 OK; 3 OK`. Record this as bounded acceptance of candidate `edae554b-088c-4588-9fb0-859c2a1f29b0` under the supplied synthetic-article script: cancellation while preserving saved original content, a usable subsequent completed generation, and Escape/close/reopen/new-generation/restart with original content retained.

The requested model/runtime were the existing `gemma4:latest` and Ollama `0.40.1`; the preceding native metadata observation independently confirmed readiness. The reply supplies functional outcomes, not raw runtime traces, installer-hash remeasurement, per-control focus measurements or NVDA/zoom/contrast observations. It does not establish general model quality, daemon/GPU termination, process attestation or WCAG conformance. Keep the broader manual sample `not-tested` and preserve earlier accepted checkpoints without another generation sequence.

Only documentation/checkpoints changed after this acceptance; the four source/test hashes and compiled artifact identities above remain unchanged. The source suites/build need not be repeated for this record. No commit, push or CI dispatch follows from reporting test results.

## Remaining limits and authorization

Corrected source checks and local package are complete; the three installed recovery checks are accepted by owner report. Broader manual accessibility, new-source publication/CI and integration remain pending. No complete Phase 6.5, security, accessibility, Linux, signing or public-release acceptance is claimed. Preserve accepted previous samples. Commit, push, manual CI, PR, tag and release require their own authorization. Full backup/restore, licensing, residual dependency findings, future embedded engine and attachments remain in their separately scoped queues.
