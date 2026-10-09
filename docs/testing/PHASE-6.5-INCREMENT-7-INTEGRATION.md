# Phase 6.5 Increment 7 — Integration and installed Windows zoom

Date: 2026-10-08 (America/Sao_Paulo). Status: source integrated; exact-source main CI passed; bounded installed Windows zoom accepted by owner report. The full phase and public distribution are not complete.

## Source and CI identity

| Item | Verified identity or outcome |
| --- | --- |
| Source branch retained | `codex/phase-6.5-accessibility` |
| Source commit | `71d35267762da9b785213343c70827a5b843e384` |
| Pull request | [PR #10](https://github.com/jornalistainclusivo/retranca-os/pull/10), normal merge after explicit owner authorization |
| Integrated main | `92a16d25e617a0345367e7843da8ab16c7fbb5fe` |
| Merge parents | `95e6a2cec5880c419ef911d3e6b12e3786fbea48` and source `71d3526` |
| Source/main tracked tree | `782fc122be37266b1b5884cd79d5c298a29c2d04` |
| Exact integrated-source CI | [CI #40 / run 37854563619](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37854563619): frontend, Rust Ubuntu, Rust Windows and Rust aggregate passed |

Authenticated GitHub API reverified merged PR #10, exact main SHA and successful CI #40 during the documentation review. Source commit, push, manual CI, Draft/Ready and merge had their own owner authorization. The feature branch was retained. No new tag or installer release was created.

## Identified local package

Candidate `fd2d53cf-6b5b-4141-acb6-919ba7765cfa` was compiled from source `71d3526`, whose tracked tree equals integrated main. The local build used Windows x64, Node.js 24.19.0, Tauri CLI 2.11.4, application version 0.1.0, unsigned current-user NSIS and an existing WebView2 runtime. Build duration: 68,168 ms.

| Artifact | Bytes | SHA256 |
| --- | --- | --- |
| Raw `retranca-pilot.exe` retained after bundling | 19,273,728 | `657eae7078a25e397a58b027336dfee021efd5a89fc93dd6997386152a3f2b3e` |
| Local `Retranca OS Pilot_0.1.0_x64-setup.exe` | 5,305,486 | `d16e83444fba54fa8e13cb9544bf1cb3e16b5606ddae8bfc7e38a908cfcecb53` |
| Installed NSIS `retranca-pilot.exe` | 19,273,728 | `723522ea94b6dd95eb0c6c9744a49089f0f29bc16067779c8e55a80cbe19c36d` |

Private binaries, logs and the build receipt remain in Git-ignored local storage. This table identifies them; it is not a public download link.

## Installed executable identity

The owner executed the authorized installer. An initial guard returned False because the handoff incorrectly compared the installed executable with the restored raw executable hash.

Read-only full-byte comparison found exactly three changes at offsets 15,322,848 through 15,322,850: `UNK` becomes `NSS` within `__TAURI_BUNDLE_TYPE_VAR_UNK`. The [pinned Tauri CLI 2.11.4 bundler source](https://github.com/tauri-apps/tauri/blob/tauri-cli-v2.11.4/crates/tauri-bundler/src/bundle.rs) applies the NSIS marker before packaging and restores the raw file afterward.

Applying only that exact transformation to a candidate copy in memory produced the installed file byte-for-byte and the installed SHA256 above. No candidate/installed file was changed, no installer was rerun and no database was read. The installer payload was not independently extracted; the observed identity proof combines the exact binary comparison and pinned upstream behavior. This does not establish reproducible builds or signature verification.

The earlier [source validation](PHASE-6.5-INCREMENT-7-ACCESSIBILITY-VALIDATION.md) preserves its previous unidentified-binary observation as historical evidence. The new candidate has its own confirmed identity; no earlier installed acceptance was erased.

## Owner installed acceptance

The affected installed handoff requested maximizing the Pilot; using Ctrl+plus, Ctrl+minus and Ctrl+0; and checking that enlarged Início guidance/controls and the IA local close control remained reachable. No new article or model generation was requested.

After identity confirmation, the owner reported on 2026-10-08: **“Ok, teste realizado e passou, funciona 100% em todo o aplicativo.”** Record this as owner-reported pass for the requested Windows installed zoom check, with reported coverage throughout the app. The statement is not a measured accessibility score.

Preserve the separately accepted three development checks and prior installed recovery/startup samples without repetition. Exact zoom percentages, comprehensive contrast/reflow/reader coverage, installed Linux, complete backup/restoration, signing and distribution remain separately bounded criteria.

## Documentation continuation

The owner authorized a public-documentation creation round from verified main in `codex/phase-6.5-public-documentation`, reusing the clean attached managed worktree and preserving the original AntiGravity checkout and retained branches. It consolidates the README, first-use/development guides, documentation index and active checkpoints. It introduces no runtime, dependency, schema, CI, licensing or model change. Documentation checks passed for the ten-file round: 153 local links/anchors, parsed Markdown, real manifest/command identities and diff/whitespace/conflict/private-path guards. Public release availability and exact PR/main CI identities were checked through GitHub API; new official prerequisite links were read. Application tests were not repeated for Markdown-only edits.

At the current lookup, GitHub releases returned no published installer assets and the source tree had no LICENSE file. Do not label a source ZIP or a private Pilot path as one-click application installation. The packaging raw-versus-NSIS payload receipt distinction remains a concrete development correction; public release requires its own decisions and authorization.
