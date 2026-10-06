# Phase 6.5 Increment 3 — Production policy validation

Date: 2026-10-05 (America/Sao_Paulo). Scope: the [production policy specification](../specifications/phase-6.5/PHASE-6.5-INCREMENT-3-PRODUCTION-PROVIDER-POLICY.md). Status: implementation, scoped local verification and all three bounded owner desktop checks accepted. The owner subsequently authorized consolidation, push, CI, reviewed PR/merge and a technical milestone tag. Completion of those actions requires their own observed Git/GitHub results; packaged distribution is not accepted by this report.

## Baseline and implementation

The owner authorized continuing after successful CI #23 and confirmed the app was already closed. GitHub API verified [run 37389383428](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37389383428), all four jobs successful on `34bf047781e63e2f55f82600b99cff9686204b82`, branch `codex/phase-6.5-production-provider-contract`. Starting tree was clean and synchronized. That revision includes the published and accepted Increment 2 UI/native work; it is not in main and its CI does not validate this subsequent policy.

- Native `provider_policy` requires debug assertions plus explicit `dev-fixtures` for fixture use; release remains denied even with that feature. Orchestrated dispatch and the subprocess supervisor both check it before spawning.
- Normal preflight selects the supported Ollama route regardless of availability, leaving every request's readiness decision to the existing native gate. It reports the additive `development_fixtures_enabled` flag and does not inspect/hash legacy fixture manifests/models in normal builds. This avoids a cached NONE route after starting Ollama later.
- Native download denies before app-data access, registry insertion, trust-anchor use or network. The frontend checks fresh native policy before subscription/download, preserves fixture completion/readback cleanup and only displays its dialog with explicit opt-in. Missing/legacy policy cannot expose it.
- Default Tauri configuration omits external binaries. An explicit fixture overlay and the helper enable the existing synthetic sidecar in a separate application/app-data namespace. The fixture is labelled synthetic, and local settings explain the independently installed Ollama and preferred future embedded engine.
- ADR-007/016, roadmap, README, changelog, task checkpoint and prior Increment 2 reports now preserve the exact successful UI CI and the new increment's scope.

No dependency, lockfile, migration, CI workflow, authentication, model/cloud setting or editorial persistence change. The agent did not inspect or migrate private articles/database/exports/model files, download a model, run actual model inference, delete the fixture binary, commit, push, dispatch CI, merge or publish installers. The existing raw IPC registration remains debug-only; sidecar startup is additionally restricted by native policy.

## Verification

Environment: Windows checkout and existing dependencies; local Next.js 16.3.4 client-component/accessibility guides were read before editing. Rust checks use synthetic test data, mock loopback servers and temporary databases, not owner articles. Frontend/browser checks use controlled native IPC fixtures. Native compilation and a static build are distinct from an installed production package.

| Check | Executed result and scope |
| --- | --- |
| `npm test -- __tests__/model-provisioning.test.ts components/__tests__/phase54.test.ts` | **pass — 31 tests**: native policy absent/false/invalid, denial before download/subscriptions, policy failure/retry, lifecycle cleanup, hidden normal dialog states and synthetic wording. |
| `npm test` | **pass — 350 tests / 27 files** on final frontend source. |
| `npx tsc --noEmit` | **pass** on final source; static build also completed its type check. |
| `npm run lint` | **pass**; existing `.eslintignore` migration warning remains, without a rule suppression/configuration change. |
| `npm run build` | **pass** — Next.js 16.3.4 static export. |
| `cargo fmt --manifest-path src-tauri/Cargo.toml --check` | **pass** on final native source. |
| `cargo test --manifest-path src-tauri/Cargo.toml --locked --quiet` | **pass — 128 tests**: 82 library and 46 integration; normal policy, catalog/readiness/cancellation and existing synthetic persistence/domain coverage. |
| `cargo test --manifest-path src-tauri/Cargo.toml --release --locked --quiet` | **pass — 128 tests**; fixture permission and SIDECAR dispatch denied in standard release. |
| `cargo test --manifest-path src-tauri/Cargo.toml --locked --features dev-fixtures --lib --test phase64_ai_semantics --quiet` | **pass — 85 tests** (82 library + 3 editorial semantics); explicit debug fixtures admit the synthetic dispatch plan while normal Ollama remains preferred when available. No fixture subprocess or download was performed. |
| Same bounded native command with `--release` | **pass — 85 tests**; requesting the feature in standard release does not admit fixtures. All six valid editorial SIDECAR requests are rejected, while native evidence requirements remain tested. |
| `node scripts/security-enforcement-test.mjs` | **pass** — existing source-registration assertion for debug-only raw IPC. This assertion is not a new security audit or live IPC test. |
| Isolated compiled settings/bridge browser sample | **pass — 11 checks** with synthetic IPC in installed Chrome **154.0.8037.98**, whose executable version was rechecked. Keyboard/focus, old responses/errors/finally, retry, selection preservation, foreground-dialog precedence and 320 × 568 viewport bounds. Updated guidance/retry remained visible in the inspected screenshot. Browser/server closed after QA. |
| Source/configuration review and `git diff --check` | **pass** in the bounded self-review: native guards precede process spawn and download effects; default configuration has no external binary; explicit fixture overlay has another identifier; renderer cannot grant native fixture permission. No independent scan/agent review is claimed for this round. |
| Documentation local targets | **pass — 126 local targets in 12 changed documents**; file existence checked, not Markdown anchors or external URLs. |
| Remote branch identities | **verified with `git ls-remote`**: feature remains published UI `34bf047781e63e2f55f82600b99cff9686204b82`; main remains integrated `37b272c1ae048c5aa004211fd9d09178bd41709c`. This increment is uncommitted local work. |
| New owner desktop acceptance | **accepted — `1 OK; 2 OK; 3 OK`**, reported by the owner on 2026-10-05 for the three normal-startup checks below. Not an independent observation by the agent or an installer/NVDA/pilot evaluation. |
| New-source remote CI / installers / NVDA / real-daemon pilot | **not executed at the local verification checkpoint**. Record subsequent Git/GitHub evidence separately; preserve earlier accepted observations without extending their scope. |

The first focused Vitest attempt ran zero tests because the sandbox denied a temporary-cache rename; the permitted retry passed. The first sandbox Next build failed on Windows path canonicalization/access denied before compilation; the permitted retry passed. Initial Rust integration still expected an always-enabled Sidecar plan: that historical semantics fixture now uses the approved Ollama plan, and a new integration test covers policy admission/denial for all six valid editorial actions, including mixed-case provider input. Final debug/release results above include this correction.

An initial local lint found React internals in a pre-existing generated, Git-ignored browser bundle. The QA artifact was moved to a non-source `.bundle` extension, and its ignored generator updated to use that extension; final lint passed. No tracked source was moved or linter rule/configuration weakened. Other retained warnings concern future Vite native-config loading and the existing Rust `unused_mut` / test `signing_key`; neither was changed in this bounded policy task.

The 11-check browser sample uses the actual compiled settings/context/bridge and final static CSS, with external requests blocked and no real daemon/editorial storage. Its scripts/screenshots remain ignored under `.retranca-local/phase65-readiness-ui/`. Normal provisioning suppression is additionally covered through actual-component static rendering and the native-policy bridge tests; no live desktop startup is claimed. The dedicated fixture overlay/helper was reviewed but not launched against real app data. Separate identity in configuration is not full fixture-installer acceptance.

## Owner AntiGravity handoff — new normal startup policy only

Keep the current branch and local changes:

```powershell
cd C:\Users\RFERRAZ\Documents\retranca-editorial-os
git status --short --branch
npx tauri dev
```

Use `npx tauri dev` for your normal editorial environment. `npm run dev:desktop` is now explicitly the synthetic developer fixture helper, with a separate data namespace, and is not the command for this handoff. Do not download/update models or change Ollama settings for these checks.

1. Start Retranca normally. Expect the editorial interface without the former **Modelo embutido do Retranca** download notice.
2. Before selecting an AI model, open any existing article, confirm the editable CMS fields are usable and close with **Cancelar**. No new article, saved change or AI generation is needed.
3. Open **IA local**. Expect the explanation that this version uses separately installed Ollama and a user-chosen model, with an embedded engine planned later. Choose an existing model and confirm the current readiness diagnostic remains available. If blocked, report only the exact displayed message, not your article text.

The owner reported `1 OK; 2 OK; 3 OK` on 2026-10-05. These three bounded desktop observations are accepted. Earlier accepted generation/cancel/CMS and settings focus checks are preserved and need not be repeated solely for confirmation.

## Authorized source integration — 2026-10-05

After accepting the three checks, the owner explicitly requested all four proposed steps: document/consolidate, push/CI, prepare/review/merge the PR and choose/create an appropriate milestone tag. This authorizes those actions for the combined Increment 2 and 3 source delivery, preserving integrated Increment 1. It does not authorize an installer release, dependency/migration/CI configuration change or publication of private editorial data. The [integration checkpoint](PHASE-6.5-INCREMENTS-2-3-INTEGRATION.md) records the scope, tag rationale and evidence boundaries. Successful CI alone is not the source of authorization.

## Remaining gates

Local verification and the three new desktop observations are complete. Consolidation, push, existing CI, reviewed PR/merge and the milestone tag now have explicit owner authorization; each completion remains contingent on observed results, with no bypass of branch protection. Prepared Increment 3 scope: **30 files**, comprising 17 source/test/build/developer configuration files and 13 documents, including the integration checkpoint. Runtime/model identities, representative actual-daemon synthetic pilot, licensing, broader NVDA/zoom/contrast checks and installed Windows/Linux recovery remain open. A real embedded engine is the preferred future delivery and is not implemented here. No distributable release is authorized.
