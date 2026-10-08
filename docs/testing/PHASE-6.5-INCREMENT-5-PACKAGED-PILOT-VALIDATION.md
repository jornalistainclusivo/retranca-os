# Phase 6.5 Increment 5 — Packaged pilot validation

Date: 2026-10-06 (America/Sao_Paulo); source checkpoint updated 2026-10-07. Scope: the [isolated Windows packaged pilot](../specifications/phase-6.5/PHASE-6.5-INCREMENT-5-PACKAGED-PILOT.md). Status: local builds and both original/corrective owner-reported bounded installed Windows checkpoints are accepted. The combined packaging/corrective source was published as `71d25c0` and all four CI #28 jobs passed; main source integration and broader distribution remain separate. Historical candidate receipts below retain their original scope.

Current source checkpoint: [CI #28 / run 37657094508](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37657094508) was verified through authenticated API on `71d25c088887231001329ae3d9fc659dcc6ad5a5`, with successful frontend, Windows/Linux Rust and aggregate jobs. The authorized [dependency consolidation](PHASE-6.5-POST-SECURITY-CONSOLIDATION.md) preserves package/application identity, helper/configuration source and earlier installed acceptance; it does not update the installed executable. Raw receipts, owner data and model output remain local and excluded from Git. No repeat inference or installer acceptance is required merely to restate the existing evidence.

## Verified baseline and authority

Later owner acceptance — 2026-10-07: the owner also reported `1 OK; 2 OK; 3 OK` for the final corrective installer described in the [current startup/Início validation](PHASE-6.5-INCREMENT-5-STARTUP-AND-HOME-VALIDATION.md). That supersedes the pending corrective installed-acceptance wording in the historical follow-up below. Both original and corrective bounded acceptances are retained; new-source commit/publication/CI and broader distribution remain separate.

Current follow-up — 2026-10-07: the owner reported `1 OK; 2 OK; 3 OK` for the original installed pilot, then supplied defects in review A–D. Preserve that bounded acceptance; it does not establish release readiness. The owner authorized startup/count corrections, an Início page and suggested-category editing under ADR-017. The [corrective validation and updated installer handoff](PHASE-6.5-INCREMENT-5-STARTUP-AND-HOME-VALIDATION.md) supersede the original candidate for current testing. The original receipt, hashes and instructions below remain historical, rather than being overwritten with claims about a later binary. New installed-runtime acceptance remains pending; no repeat model generation is needed solely to reconfirm the accepted original checks.

GitHub API confirmed [CI #27 / run 37537545421](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37537545421) completed successfully on published `6d0a4f3d83aefb45c8f78d5d5d70b9eac85b6ef7`, branch `codex/phase-6.5-runtime-pilot`: frontend, Rust Ubuntu, Rust Windows and required Rust aggregate all passed. The branch was clean and synchronized at resumption. Commit, push and manual dispatch had separate owner authorization; the owner then authorized continuing development. This CI validates the native-pilot delivery, not new packaging files.

Preserve the accepted native operational sequence and the owner's two completed-output decisions. Do not rerun the model solely to reconfirm them. Current work builds a distinct local candidate and prepares the first installed-package observations without opening the owner's database or changing their Ollama configuration.

## Checks and observations

| Check | Result |
| --- | --- |
| `npm test -- __tests__/packaged-pilot.test.ts` | **Pass — 5 tests**, real configuration isolation and rejection of colliding/custom data paths, resources/fixtures/hooks/runtime installation, inherited build overrides and stale/ambiguous installers. |
| `node scripts/packaging/build-local-pilot.mjs --check` | **Pass** — distinct pilot identity, unchanged `0.1.0`, existing WebView2 required; no compilation/installation. |
| `node node_modules/typescript/bin/tsc --noEmit` | **Pass** on the prepared helper/test source. |
| ESLint scoped to helper and test | **Pass**; existing `.eslintignore` migration warning remains. |
| `node scripts/packaging/build-local-pilot.mjs --build` | **Pass** outside the sandbox — Next.js `16.3.4` static export/types, Cargo locked release compilation with no default features and one x64 NSIS bundle. Total helper time **207.715 s**, including frontend/native/bundling and artifact capture; native compiler reported 2 min 51 s. No installer or application executed. |
| Artifact SHA-256/size and local receipt | **Pass** — two uniquely retained artifacts in local run `569a9ad8-fbba-4ad8-8c84-d7762b6bf5e1`, with configuration/helper input hashes, sizes, output hashes and compiled status. |
| Generated installer metadata | **Pass** — generated `installer.nsi` identifies `Retranca OS Pilot`, `retranca-pilot`, `com.jornalistainclusivo.retranca.pilot` and `currentUser`; install/uninstall/shortcut keys are based on the distinct product, with default install path under local app data. This is generated-script inspection, not an executed installer test. |
| Windows `Get-AuthenticodeSignature` on the retained installer | **NotSigned**, as explicitly requested for this local pilot. Signing/public distribution remains open. |
| Final documentation/artifact isolation checks | **Pass** — 126 local Markdown file targets exist, tracked diff whitespace and five new-file whitespace/conflict/final-newline checks pass. Both retained artifact hashes and both configuration hashes match the build receipt. `git check-ignore` confirms the installer/receipt and separate target executable are ignored; Git status lists exactly the 11 intended source/documentation files. Link existence does not validate anchors or remote pages. |
| Owner installation, separate data, restart persistence and packaged inference | Pending; installer not executed by the agent. |
| Linux installed package, broader accessibility, public licensing/signing/security release gates | Separate; not supplied by this Windows candidate. |

Two unsuccessful test invocations are retained as preparation evidence: an initial `.test.mjs` name did not match this repository's `**/__tests__/**/*.test.ts` include rule, so the new test was renamed without changing Vitest/CI configuration. The next invocation was blocked by sandbox `EPERM` on Vite's temporary-file rename before tests ran; the explicitly permitted out-of-sandbox invocation passed all five tests. Vite's existing future native-config-loader warning remains; no unrelated configuration or warning cleanup is included.

After the successful build, preflight coverage was tightened for mapped resources, empty explicit data directories and inherited installer hooks/bundle commands. Final five focused tests, helper check, TypeScript and scoped lint passed again because these source guards changed. The application source, both Tauri configurations and actual CLI/Cargo build arguments did not change; no second candidate or model sequence was generated. The original build receipt preserves the helper hash used for that build, separately from the final preflight-helper source. The native compiler's existing `unused_mut` provisioning warning remains; the unsigned-build warning is intentional. The ordinary frontend build used the existing local build environment; no `.env` values were inspected or recorded by the agent, and this is not a sanitized/reproducible public-release environment claim.

## Local candidate identities

Receipt and immutable output copies: `.retranca-local/phase65-packaged-pilot/569a9ad8-fbba-4ad8-8c84-d7762b6bf5e1/`. Source baseline: published `6d0a4f3` plus the locally prepared pilot overlay/helper. Existing dependency manifests/locks, application code, normal configuration and version were preserved.

| Artifact | Bytes | SHA-256 |
| --- | --- | --- |
| `retranca-pilot.exe` | 19,269,120 | `ad0ba48f3475f2384d5d610967a6245db56e3da98f830de01cbca9c4ebb4e4eb` |
| `Retranca OS Pilot_0.1.0_x64-setup.exe` | 5,303,413 | `19196f3ce2e20c5c591f743d2b89c5b22c3c6b4edaa3a1337b10d68a6e742490` |

The default config hash remained `edcf235ae9e2af94956941f70cc6a5304d5a27e8eb1c36fc1d4cde967bf436c6`; pilot overlay hash was `46d4f7008b2f0c12220275b574cb42ad308891e149d59ba03bbd31db10a2069c`. The build receipt retains the invocation-helper hash `da51c9167e0fa8714f073f11909cc0e0924c80b02d304a2a0ee894f8df36a04a`. These are bounded local file identities, not signature, process attestation or proof of identical builds on another machine.

Final guard-helper source hash after the documented follow-up: `50acc20e2f151aa6fb0b49a0fe4eef79efb511d2c0406146da3ed1dcd74ee167`. The original receipt is preserved rather than overwritten with a claim that this newer guard source produced the already captured binary.

## Handoff and limits

The pilot uses a different application identifier, product name and binary filename, backed by source inspection of resolved SQL `2.4.0` and Tauri `2.11.5` path behavior. The build helper does not open an application, database or Ollama connection. Actual data separation and packaged event delivery require the three owner checks in the specification. No real article import/export or automatic model download is requested.

The owner can run these commands from AntiGravity to check the candidate and, if choosing to perform the local test, open its installer:

```powershell
cd C:\Users\RFERRAZ\Documents\retranca-editorial-os
Get-FileHash -Algorithm SHA256 -LiteralPath '.retranca-local\phase65-packaged-pilot\569a9ad8-fbba-4ad8-8c84-d7762b6bf5e1\Retranca OS Pilot_0.1.0_x64-setup.exe'
Start-Process -FilePath '.retranca-local\phase65-packaged-pilot\569a9ad8-fbba-4ad8-8c84-d7762b6bf5e1\Retranca OS Pilot_0.1.0_x64-setup.exe'
```

Install the named pilot for the current user, open its own shortcut and follow the three specification checks; no dev server is required. If Windows security blocks this unsigned artifact, retain/report the message rather than changing protection settings. Personal article content appearing in the pilot is a stop condition. Report `1 OK; 2 OK; 3 OK` or the exact issue for this installed candidate; previous native/desktop acceptance is not being repeated or extended automatically.

Raw logs, receipts, binaries and model outputs remain ignored/local. Generated binary hashes may be documented as bounded build evidence; no owner content or model manifest digest belongs in Git. The reported eight default-branch security alerts from the preceding push are an unresolved release-review input, not independently validated findings from this increment. Project/runtime/model licensing, signing, installation/update/recovery and Linux acceptance remain open.

No new-round commit, push, CI, PR/merge, tag or release is requested or executed by this validation. The owner must approve any next consequential action against the concrete delivered scope.
