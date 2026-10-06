# Current work — Phase 6.5 Increment 4 bounded native runtime pilot

- [x] Verify all four successful jobs of [CI #26](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37530233063) on published metadata `82d1a0007c3d04e3e1375870f946ddac0709006a`; preserve the clean/synchronized branch at resumption and earlier accepted desktop checks.
- [x] Owner authorized continuing development; prepare the [native pilot specification](docs/specifications/phase-6.5/PHASE-6.5-INCREMENT-4-NATIVE-PILOT.md) and separate [validation](docs/testing/PHASE-6.5-INCREMENT-4-NATIVE-PILOT-VALIDATION.md).
- [x] Implement an ignored, explicitly opted-in native test with three frozen synthetic cases, unchanged model/authority, registered cancellation, recovery, local output retention and bounded stop rules. No production function body, dependency, IPC, UI, schema, model/daemon preference or workflow change.
- [x] Pass five non-daemon harness tests in both Windows debug and release profiles; the live test remains ignored by default. Formatting passes. Existing provisioning warnings remain separate.
- [x] Complete one actual Windows debug sequence in 94.639 seconds: `PL-01` completed, `CANCEL-01` cancelled after its first fragment with teardown acknowledged, `RECOVER-01` completed. All three have released registries, preserved synthetic source files and stable sampled identity; no retries. Record model `gemma4:latest`, runtime `0.35.1` and exact scope in validation; raw metadata/outputs remain ignored/local.
- [x] Record the owner's `1 OK, 2 OK` on 2026-10-06: both completed synthetic suggestions accepted against the two bounded checks; `CANCEL-01` remains an unreviewed partial suggestion. Preserve the original execution ledger and retain a separate local human-review receipt; do not repeat generation or earlier UI/CMS checks.
- [x] Finish documentation/diff checks: 132 existing local link targets, clean tracked whitespace and three new files without whitespace/conflict/final-newline findings. Confirm all raw pilot captures ignored by Git.
- [x] Owner explicitly authorized the local commit of this prepared 11-file native-pilot round on 2026-10-06: `Sim, autorizo criar o commit local.` Use `test(phase-6.5): add bounded native runtime pilot`; exclude generated outputs, raw metadata and editorial data. ADR-016 records the current evidence without changing its provider direction.
- [ ] Obtain separate native-pilot push/manual CI/merge authority and verify each resulting checkpoint; metadata publication/CI authorization does not publish or validate the later harness.

# Previous checkpoint — Phase 6.5 Increment 4 runtime metadata preparation

- [x] Verify PR #6 merged as `1b7de720ff8f87060cd2f945b8c65ec598679471` and all four successful jobs in main CI #25 on that exact SHA.
- [x] Publish the authorized annotated `milestone-phase-6.5-increments-2-3` tag; GitHub tag object `a794672b5420f32b74279d1dbeef55058e7a42d0` targets the integrated merge. No installer release/version bump.
- [x] Owner authorized the next development step; create `codex/phase-6.5-runtime-pilot` from clean integrated main.
- [x] Prepare the [metadata specification](docs/specifications/phase-6.5/PHASE-6.5-INCREMENT-4-RUNTIME-EVIDENCE.md), reusing ADR-016/008 authority without changing production behavior.
- [x] Implement developer Rust inventory/readiness observations with explicit exact model choice, JSON output and fail-closed exit codes. No Tauri/database startup, prompt/inference/download or new dependency.
- [x] Owner selected `gemma4:latest` for one read-only metadata observation; do not substitute/download a model.
- [x] Verify final formatting, 5 Windows example tests, release type checking, actual catalog and owner-selected model metadata. Permitted query reports server `0.35.1` and `READY / LOCAL_REQUEST_ENFORCED` for `gemma4:latest`; keep raw observations/digests local and record failed sandbox attempts separately in [validation](docs/testing/PHASE-6.5-INCREMENT-4-RUNTIME-EVIDENCE-VALIDATION.md).
- [x] Finish documentation checks: 114 existing local link targets, tracked diff whitespace and the three new files' whitespace/conflict/final-newline checks. No new-source CI is claimed.
- [x] Specify later synthetic inference/cancellation cases, attempt/time limits and human quality review in the new bounded native pilot; installed Windows/Linux, licensing, accessibility and future embedded engine remain separate.
- [x] Owner explicitly authorized the local commit of this 10-file metadata round on 2026-10-06, with message `feat(phase-6.5): add local runtime metadata probe`. Keep observations, model digests and editorial data ignored/local.
- [x] Owner separately authorized metadata push and manual CI; publish `82d1a0007c3d04e3e1375870f946ddac0709006a` and verify all four successful jobs of CI #26 on that exact SHA. This CI does not validate the later native pilot harness; merge/release remain separately gated.

# Previous checkpoint — Phase 6.5 Increment 3 production provider policy

- [x] Verify UI CI #23 on published `34bf047781e63e2f55f82600b99cff9686204b82`; preserve accepted desktop checks.
- [x] Owner authorized continuing development and confirmed the app was already closed.
- [x] Specify [production policy](docs/specifications/phase-6.5/PHASE-6.5-INCREMENT-3-PRODUCTION-PROVIDER-POLICY.md) under accepted ADR-016/008.
- [x] Implement normal Ollama routing, explicit debug fixtures, native sidecar/download denial, omitted default test binary and truthful provisioning/settings UI.
- [x] Complete final local verification and record scoped results in [validation](docs/testing/PHASE-6.5-INCREMENT-3-PRODUCTION-POLICY-VALIDATION.md): 350 frontend tests, types/lint/static build, Rust format and 128 tests in each default debug/release profile, 85 in each explicit-feature debug/release sample, 11 isolated compiled settings checks, 126 local documentation targets and diff whitespace.
- [x] Owner accepted all three bounded normal-startup/CMS-without-AI/guidance-model-diagnostic checks (`1 OK; 2 OK; 3 OK`, 2026-10-05).
- [x] Owner explicitly authorized the four source-integration steps: documentation/commit, push/CI, reviewed PR/merge and an appropriately chosen technical milestone tag. Distribution release remains outside that scope.
- [x] Complete and verify the authorized source-integration sequence; the [integration checkpoint](docs/testing/PHASE-6.5-INCREMENTS-2-3-INTEGRATION.md) records exact PR/CI/merge/tag identities. Preserve branch protection and existing accepted checks.
- [ ] Retain runtime/model pilot, Windows/Linux installed packages, licensing and future embedded-engine delivery as separate gates.

No real article/database/model file was inspected or changed by the agent. Existing local files and owner Ollama configuration remain outside Git. No dependency, schema or CI configuration change is included.

# Previous checkpoint — Phase 6.5 Increment 2 readiness UI and recovery

## Integrated baseline and new continuation — 2026-10-05

- [x] Verify merged [PR #5](https://github.com/jornalistainclusivo/retranca-os/pull/5), `main`/`origin/main` at `37b272c1ae048c5aa004211fd9d09178bd41709c`, and all four successful jobs in [main CI 37248233721](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37248233721).
- [x] Preserve accepted Phase 6.5 Increment 1 and the completed 6.4 source-integration gate; retain broader accessibility/distribution limits.
- [x] Create `codex/phase-6.5-production-provider-contract` from fetched `origin/main`, preserving the previous clean branch/history.
- [x] Prepare [ADR-016](docs/decisions/ADR-016-PRODUCTION-LOCAL-AI-PROVIDER.md) and the proposed [Increment 2 readiness contract/matrix](docs/specifications/phase-6.5/PHASE-6.5-INCREMENT-2-PROVIDER-READINESS.md), following the existing draft plan.
- [x] Owner accepted external local Ollama for the first production path and explicitly retained an embedded engine as the preferred future delivery. Record the bounded ADR-007 amendment; no particular embedded engine, download or distribution is approved.
- [x] Record owner-preferred Gemma 4/DeepSeek candidates as informal experience; preserve model choice. Exact current tags/variants and comparative quality/latency remain to be verified in a later synthetic pilot.
- [x] Define the supported native contract from pinned Ollama 0.35.1 source: bounded metadata, textual completion, trusted daemon and per-request `:local` enforcement; no process-attestation/digest-pinning claim.
- [x] Implement query/registration, shared bounded catalog and fresh checks before every Ollama generation; preserve native prompt authority and cancellation during metadata/streaming.
- [x] Validate Rust debug/release and obtain focused independent read-only review; record results in the [native validation report](docs/testing/PHASE-6.5-INCREMENT-2-NATIVE-VALIDATION.md).
- [x] Record owner-reported completed simplification without perceived inconsistencies, earlier cancellation and original CMS text preservation; the three bounded functional checks are accepted and should not be repeated solely for confirmation. AI suggestions remain temporary; exact runtime/model identity and broader quality/accessibility evidence were not supplied.
- [x] Owner explicitly authorized the local Git commit of the 14 prepared native-round files on 2026-10-05; resulting commit `d944a114f935cbab7222068c22fe22bc26f12fb1`, message `feat(phase-6.5): enforce native local AI readiness`.
- [x] Owner separately authorized the native-round push and manual CI dispatch. Verify all four successful jobs in [CI 37356369629](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37356369629) on exact published native commit `d944a114f935cbab7222068c22fe22bc26f12fb1` and the same feature branch.
- [x] Owner authorized the next development step and confirmed the app was already closed before interface edits. This closure confirmation protects unsaved work; it is not a functional test.
- [x] Implement the [readiness UI/recovery specification](docs/specifications/phase-6.5/PHASE-6.5-INCREMENT-2-READINESS-UI.md), invalidating stale results while preserving exact session selection and focus.
- [x] Pass local automated verification: 338 frontend tests / 27 files, including 49 new bridge fixtures; types, lint and Next.js 16.3.4 static build. Retain the existing `.eslintignore` migration warning; no Rust/dependency/schema/CI configuration change.
- [x] Pass 11 checks of the actual compiled component/bridge with synthetic IPC in isolated Chrome 154.0.8037.98: stale replies, retry/focus, refresh/selection/error handling, close/reopen, foreground-dialog precedence, clearing choice, sampled 320 × 568 viewport bounds, browser restriction and pending unmount. Inspect screenshots and record scope in the [UI validation report](docs/testing/PHASE-6.5-INCREMENT-2-UI-VALIDATION.md); browser fixtures do not establish actual daemon or reader behavior.
- [x] Record owner acceptance of the three new diagnostic/recheck/focus desktop checks (`1 OK; 2 OK; 3 OK`, 2026-10-05). Preserve the accepted native handoff; do not request repetition solely for confirmation.
- [x] Owner explicitly authorized the local Git commit of the 13 UI-round files on 2026-10-05, with message `feat(phase-6.5): expose local AI readiness diagnostics`.
- [x] Owner separately authorized UI push/manual CI; all four jobs of [CI #23 / run 37389383428](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37389383428) passed exact published UI `34bf047781e63e2f55f82600b99cff9686204b82`. This does not validate later Increment 3 changes.
- [ ] Retain exact runtime/model identity and broader pilot evidence as separate gates.
- [ ] Retain separate dependency maintenance, licensing, preference persistence, attachments, packaged Windows/Linux and release gates. Do not reopen accepted scripts or introduce these features implicitly.

Historical Increment 2 checkpoint: [readiness UI specification](docs/specifications/phase-6.5/PHASE-6.5-INCREMENT-2-READINESS-UI.md) and [UI validation](docs/testing/PHASE-6.5-INCREMENT-2-UI-VALIDATION.md), following the published and CI-approved [native round](docs/testing/PHASE-6.5-INCREMENT-2-NATIVE-VALIDATION.md). Preserve its bounded owner functional acceptance. The UI passed automated checks and the isolated compiled-browser sample. The owner accepted the three diagnostic/recheck/focus desktop checks on 2026-10-05; UI publication and exact-source CI subsequently passed. At that checkpoint, Increment 2 integration and merge/tag/release authority were still pending. PR #6, main CI #25 and the published technical milestone supersede that earlier source-integration state, as recorded at the top. Runtime identity and broader desktop/NVDA/distribution acceptance remain open. Sections below retain historical scope.

## Closure candidate — 2026-10-04

- [x] Owner froze feature scope and confirmed saving/closing the app before interface edits; preserve already accepted Phase 6.5 Increment 1.
- [x] Verify feature/local HEAD `7e9702b` and all four successful jobs in [CI 37212420511](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37212420511). Feature is 84 commits ahead / zero behind main; no open PR at intake.
- [x] Correct CMS labels, template name and Calendar native keyboard opener; preserve values, callbacks, provider and persistence contracts.
- [x] Candidate frontend: 289 tests / 26 files, types, lint and static build passed. Isolated Chrome labels/template/Calendar Enter/Space/Escape focus return and sampled 320 CSS px CMS reflow passed.
- [x] Record current residual security triage, proposed integration boundary and Windows/Linux evidence limits; update README around current state.
- [x] Owner accepted the three bounded desktop/NVDA 2026.2 checks: CMS names/editing, template keyboard application and retested Calendar script.
- [x] Published corrective `8fd28e1` and Draft [PR #5](https://github.com/jornalistainclusivo/retranca-os/pull/5); [CI 37243860825](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37243860825) passed all four jobs on that exact SHA.
- [x] Investigate locked Linux source callers: all 442 resolved package sources searched; the affected glib iterator/entry point appears only within glib. Proposed upstream GTK-chain update Wry #1843 remains unreleased/open; keep package maintenance and distribution gates explicit.
- [x] Owner approved the bounded source-integration boundary on 2026-10-04; Gate B closes for code integration only. Broader manual accessibility and packaged-runtime validation remain open before distribution. Publishing the six documentation updates and Ready status are authorized.
- [x] Owner specifically authorized merge commit after all four jobs pass on the final published HEAD. Actual completion is tracked in PR #5; tag/release remain separately gated. New features belong to another branch.

Current entry point and bounded handoff: [closure candidate](docs/testing/PHASE-6.4-CLOSURE-2026-10-04.md). Subsequent sections retain historical results and authorizations; they do not turn unverified checks into passes.

## Resumed dependency correction — 2026-10-04

The owner resumed the explicitly authorized correction after the daily-limit stop. Firebase development tooling is removed, Vitest/UI lock is 4.1.11 and js-yaml is 4.3.2. Clean workspace installation, dependency graph verification, types, 287 frontend tests, lint and static build passed; the one fresh independent candidate review found no concrete bypass/regression. The final audit still reports 7 affected-package entries (1 critical, 6 high), or 1 critical Next entry excluding dev dependencies. Next/lint, Linux glib and accessibility remain separate work. Consolidate/publish and dispatch existing CI on the new revision under existing authority; check its result when the owner returns, without watching it to completion. Follow the [2026-10-04 validation checkpoint](docs/testing/PHASE-6.4-RESUMPTION-2026-10-04.md); preserve accepted functional scripts. Gate B and human merge/release gates remain open.

## Gate B static review / dependency intake — 2026-10-03

- [x] Complete immutable changed-source review on `528be4f..0d2f5e9`: all 76 compact source items plus 11 changed supporting files; 41 non-executable context paths accounted separately. Sealed scan `eabec0c4-20c8-47c0-a1b7-373663819e15` has complete static diff coverage and zero new reported security findings.
- [x] Triage all 12 open Dependabot records individually; keep GitHub alerts unchanged. Owner confirmed the current workflow uses only Tauri/Ollama, without Firebase publishing/emulators/MCP.
- [x] Record three separate static accessibility failures: CMS label associations, unnamed template selector and Calendar article keyboard opener. Earlier functional acceptance remains valid; no NVDA or new runtime pass is claimed.
- [x] Apply the explicitly authorized npm correction: remove unused development-only Firebase, patch js-yaml and aligned Vitest/UI, verify the final graph/audit and pass clean installation/types/frontend tests/lint/build plus independent patch review. Original 11 npm alert records' package families are no longer flagged in the final-lock audit; this does not close GitHub alerts or certify remaining dependencies.
- [ ] Confirm the dependency correction's published-source CI when the owner returns; separately plan remaining Next/lint-chain maintenance. No blanket audit fix or major downgrade.
- [ ] Resolve Linux glib through a compatible Tauri/GTK plan; no isolated major override or unapproved production dependency change.
- [ ] Save/close confirmation before interface updates; apply the bounded accessibility corrective, then provide a new numbered desktop/NVDA handoff without repeating accepted scripts.
- [ ] Complete remaining accessibility/runtime acceptance, exact published-source checks and human Gates C/D. **Gate B remains open** despite completed static source review.

Evidence, alert table, corrective sequence and limits: [Gate B review](docs/security/PHASE-6.4-GATE-B-REVIEW-2026-10-03.md). This checkpoint supersedes earlier partial-security-review status for the reviewed range only. No dependencies, migrations, CI/authentication or app code changed during this review.

## Resumed entry / Phase 6.5 Increment 1 — 2026-10-03

- [x] Verify application source `08218bf6c05d510904686d3a89c56d7bfe8826ae` [CI](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37080317950): frontend, Rust Windows/Linux and required aggregate passed.
- [x] Owner explicitly accepted both desktop settings X/Escape checks; no repetition requested.
- [x] Record Node 20 Action-runtime warning and Ubuntu migration notices as separate CI maintenance; workflow unchanged.
- [x] Prepare [bounded inventory/recovery specification](docs/specifications/phase-6.5/PHASE-6.5-INCREMENT-1-MODEL-INVENTORY.md); preserve existing provider policy/session selection and owner model configuration.
- [x] Implement named model refresh/retry, bounded native inventory and late-response invalidation; preserve session model choice.
- [x] Final frontend 287 / 26 files, lint/types/static build and isolated compiled-browser keyboard/error/retry/modal observations passed; [validation and current desktop handoff](docs/testing/PHASE-6.5-INCREMENT-1-VALIDATION.md).
- [x] Owner accepted all three new inventory desktop checks (`1 ok; 2 ok; 3 ok`, 2026-10-03); no repetition requested.
- [x] Published increment `32e64a56084a5d42cef3275e00195c3262563e86` passed all four jobs in [CI 37141777120](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37141777120), verified once on the owner's return; updated `2026-10-03T18:02:36Z`. Later documentation commits require their own HEAD checks before integration.
- [ ] Complete outstanding accessibility/Gate B; production-engine/capability/persistence/packaging decisions and human Gates C/D remain separate.

The [saved pre-increment checkpoint](docs/testing/PHASE-6.4-RESUMPTION-2026-10-03.md) records the owner's 2026-10-02 stop request. Its application source `08218bf6c05d510904686d3a89c56d7bfe8826ae` now has verified successful CI and accepted X/Escape checks as recorded above. Use the new inventory handoff for current testing; preserve prior acceptance, then complete accessibility/Gate B and production phase ownership before integration.

## Current authority and local import checkpoint — 2026-10-02

This amendment supersedes earlier pending-publication/per-action-confirmation wording for this authorized round; historical test counts/results remain unchanged. The owner granted continued development autonomy, including source/documentation consolidation, publication and existing manual CI. Merge/release still require Gates C/D. Actual editorial data remains local; only code/docs/synthetic fixtures may be published.

- [x] Published CMS corrective `089174088a780d6fd481e395c4e89c48b7a8c0d5` passed all four jobs in [run 37064072955](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37064072955), rechecked on 2026-10-02.
- [x] ADR-015: conservative JSON import adds new IDs and preserves existing articles, with native atomic SQLite persistence and browser parity.
- [x] Local validation: frontend 260 / 23 files; Windows Rust debug/release 114 each; lint/types/build/format/check/security registration passed.
- [x] Isolated browser synthetic import, repeat, invalid-file/retry and reload observations; named file controls visible at 320 px.
- [x] Canonical application-sibling sidecar resolution implemented; actual engine/model binding and installer remain unverified.
- [x] Current-round security review completed with zero reported findings and **partial canonical coverage** due temporary receipt storage; full Gate B remains open.
- [x] Read-only MCP diagnosis: GitHub and Codex Security calls responded; no config/permission changes.
- [x] Prepare Phase 6.5 draft production-experience plan.
- [x] Owner reported the three desktop import checks as accepted: **Tudo ok. prossiga.** (2026-10-02). No owner database/export was independently inspected.
- [x] Published import source `b2860c617856fe8048d3ac219a38c713c7f69c4d` passed frontend, Rust Windows/Linux and required Rust aggregate in [run 37070928920](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37070928920), verified on that exact SHA; updated `2026-10-02T22:23:22Z`.
- [ ] Remaining accessibility/packaging scope, full Gate B, then human Gates C/D.

Current handoff: [local import validation](docs/testing/PHASE-6.4-LOCAL-IMPORT-VALIDATION.md), [ADR-015](docs/decisions/ADR-015-LOCAL-ARTICLE-IMPORT-PRESERVATION.md), [Phase 6.5 draft](docs/architecture/PHASE-6.5-PRODUCTION-EXPERIENCE-PLAN.md).

### Current corrective — model provisioning notice, 2026-10-02

- [x] Native named dialog, heading focus, Tab/Shift+Tab boundary cycle, Escape and close controls for every displayed state; READY/closed render nothing.
- [x] Remove simulated browser download readiness; await native completion/readback and retain Rust provider selection instead of forcing SIDECAR.
- [x] Dispose failed/late event subscriptions, reset per-view progress, bound valid numeric updates and stop decorative motion under reduced-motion preference.
- [x] Final frontend checks: 272 / 24 files, lint/types/static build; isolated compiled-browser keyboard/error/retry and 320 CSS px notice observations.
- [x] Owner reported notice/provider/layout desktop checks as passing (`1 OK; 2 OK; 3 OK`); supplied notice screenshot. NVDA and broader accessibility remain separate.
- [ ] Verify the published corrective's exact-source manual CI result when the owner returns; do not infer it from the previous import CI.
- [ ] Full independent Gate B, real engine/model binding and human Gates C/D remain open.

Current narrow handoff: [model provisioning UI validation](docs/testing/PHASE-6.4-MODEL-PROVISIONING-UI-VALIDATION.md). No native source change or actual model download was executed by the agent; earlier accepted CMS/AI/import scripts are preserved.

### Subsequent corrective — local AI settings keyboard entry

- [x] Reproduce collapsed trigger after 324 preceding controls in built-in examples; native Tab eligibility itself was present.
- [x] Render the single global settings control before page children, preserving fixed bottom-right placement; add explicit button type and accessible purpose name, without positive tabindex.
- [x] Final frontend checks: 274 / 25 files, lint/types/static build; isolated compiled-browser first Tab, Enter/Space opening, Escape return, subsequent Tab/Shift+Tab and sampled neighboring-modal behavior.
- [x] Owner confirmed keyboard entry and model choice; reported dismissal failure and missing X. Prior notice checks remain accepted.
- [ ] Verify new published-source CI separately; full Gate B, broader accessibility and human Gates C/D remain open.

### Local AI settings dismissal corrective

- [x] Reproduce Escape failure from the opening trigger and confirm missing close button; owner saved/closed the app before edits.
- [x] Add visible named X and scoped document Escape dismissal, trigger-focus return, listener cleanup and foreground-dialog precedence; preserve model choice.
- [x] Frontend 274 / 25 files, lint/types/build and isolated X pointer/Enter, Escape from selector/trigger/page and neighboring-dialog checks passed.
- [x] Owner explicitly accepted both desktop close checks on 2026-10-03; NVDA remains separate.
- [x] Published dismissal source `08218bf6c05d510904686d3a89c56d7bfe8826ae` passed exact-source CI 37080317950, verified on 2026-10-03. Full Gate B/human Gates C/D remain open.

The current scoped AntiGravity script is in the [dismissal follow-up](docs/testing/PHASE-6.4-MODEL-PROVISIONING-UI-VALIDATION.md#current-antigravity-check--close-settings). No native/provider/model/persistence change is introduced.

- [x] Slice 6 corrective delivered in `6ce03fd`.
- [x] Human decision: open single edition, recorded in ADR-013 (2026-09-30).
- [x] Slice 7: dynamic AI recommendation semantics and removal of commercial capability gates implemented locally.
- [x] Current validation recorded: frontend 192, Rust debug/release 96, lint/build/security registration checks passed.
- [x] User-reported Windows desktop development smoke check (`npx tauri dev`) documented.
- [x] Local consolidation authorized by the product owner on 2026-09-30; review and contributor handoff recorded with this checkpoint.
- [x] Slice 8 automated checkpoint: publication metrics, semantic error parity, active-name validation, and AI Markdown resource hardening.
- [x] Current working-tree validation: frontend 201, Rust debug/release 97, lint/build/security registration checks passed.
- [x] Slice 8 manual smoke script approved by the product owner: stage creation/duplicate rejection, real local Linguagem Simples inference, and keyboard article close (`1 OK; 2 OK; 3 OK`, 2026-09-30).
- [ ] Slice 8 acceptance closure: remaining all-action runtime evidence, manual accessibility, packaged-runtime acceptance and independent review. Cancellation smoke and source-commit remote CI are recorded separately below.
- [x] Approved Slice 8 checkpoint saved locally as `ac453e8` (2026-10-01).
- [x] Slice 8 follow-up implemented locally: native Ollama cancellation, session start/close race handling, UTF-8/terminal stream errors and native AI dialogs.
- [x] Follow-up local checks: frontend 211; Rust debug/release 102; lint/types/build/fmt/native check/security registration; sampled browser keyboard focus.
- [x] Follow-up owner desktop checks: cancellation/retry, close/reopen/article cancel and keyboard dialogs; owner reported `1 ok; 2 ok; 3 ok` on 2026-10-01. Exact model tag/runtime traces were not supplied.
- [x] Explicit owner authorization for this follow-up's local consolidation commit on 2026-10-01, including reviewed Next-generated guidance files.
- [x] Separate owner-authorized push delivered `9fd6960`, `ac453e8`, and `8e22c18` to the feature branch.
- [x] Owner-authorized manual CI on exact SHA `8e22c18f37648322187727c0d5c56e7b1e734213`: all four jobs passed (frontend, Rust Linux, Rust Windows, required Rust aggregate), [run 36892534647](https://github.com/jornalistainclusivo/retranca-os/actions/runs/36892534647), 2026-10-01.
- [x] Separate owner authorization for local consolidation of the remote CI evidence in this checklist and its validation report on 2026-10-01 (`docs(phase-6.4): record successful cross-platform CI`).
- [ ] Separate explicit confirmation before pushing or creating another commit.
- [ ] Independent technical/security review (Gate B).
- [ ] Human merge authorization (Gate C).
- [ ] Human release/tag authorization (Gate D).

See the [Slice 8 checkpoint and contributor handoff](docs/testing/PHASE-6.4-SLICE-8-HARDENING-VALIDATION.md) and the [saved Slice 7 validation](docs/testing/PHASE-6.4-SLICE-7-OPEN-EDITION-VALIDATION.md). The product owner authorized the local Slice 8 consolidation and continued implementation on 2026-10-01. Ask again before each subsequent commit or push, and before merge, tag, or release; implementation authorization does not grant those actions.

## Next execution — Slice 8 closure

### Immediate corrective — article CMS content

- [x] Owner decision: save full analysis text with each article, recorded in ADR-014.
- [x] Implement article-owned text, explicit CMS persistence, legacy adapter/browser compatibility and article-scoped session visual descriptions.
- [x] Prepare native schema-2 migration with backup, transactional upgrade, validation and serialized initialization; no agent-run migration on the actual editorial database.
- [x] Local checks: frontend 219; native Windows debug/release 106; lint/types/build/Rust format/check and security registration enforcement.
- [x] Implementer isolated-browser A/B save/reload observations, recorded separately from owner acceptance.
- [x] Owner confirmed saving/closing the running application to unblock compilation; owner clarified that A/B was not tested. This does not authorize migration or count as desktop acceptance.
- [x] Owner subsequently reported all three supplied checks as passing (`1 OK; 2 OK; 3 OK`, 2026-10-01) and authorized continued development. No further migration is scheduled; actual schema/backup files were not independently inspected.
- [x] Owner-reported acceptance: A/B separation, save/cancel/clear behavior and restart persistence. This does not request commit or authorize push.
- [x] Corrective diff reviewed with Codex Security: two low-severity malformed-import render failures reproduced and then fixed. Frontend independently reviewed; native/database review completed by the parent after worker artifact-access failure. The sealed scan retains a partial coverage flag; full Gate B remains open.
- [x] Final frontend follow-up: safe visual draft keys, imported content type checks and save-session callback isolation; 236 tests/20 files, lint/types/build passed. Native code unchanged since the executed 106 debug/release tests.
- [x] Owner explicitly authorized the local consolidation commit of this corrective round's 32 prepared files; authorization recorded in this checkpoint.
- [x] Owner separately authorized publication of `c03c928252ee498a87bb1abe221d3e4c7a07c93e` and manual CI. Frontend, Rust Windows/Linux and the required Rust aggregate passed in [run 36940623994](https://github.com/jornalistainclusivo/retranca-os/actions/runs/36940623994), rechecked on 2026-10-02.
- [ ] Full independent review (Gate B); the successful corrective CI does not close it.
- [x] Requested image/text/document utilities preserved in attachment discovery; no upload implementation or binary-storage architecture approved.

Current corrective report and AntiGravity handoff: [article content validation](docs/testing/PHASE-6.4-ARTICLE-CONTENT-VALIDATION.md). Functional owner acceptance and authorized publication/CI are recorded; full independent review remains before broader closure.

### Resumption — 2026-10-02

- [x] Owner authorized continued development; branch/remote/CI refreshed at `c03c928` with a clean starting tree and no open feature PR.
- [x] Confirm installed `gemma4:latest` through `ollama list`; no model download, substitution or inference by the agent.
- [x] Replace obsolete footer model/conformance labels; name article-list loading and respect reduced motion for the spinner and AI pulses.
- [x] UI follow-up local checks: 236 tests/20 files, lint/types/static build and tracked diff whitespace passed. Generated CSS includes the reduced-motion rule and screen-reader-only utility; actual desktop/NVDA observations remain pending. Native code is unchanged.
- [x] Owner reported all six AI options working on 2026-10-02. Aggregate functional acceptance recorded; individual outputs/runtime traces and detailed quality review were not supplied.
- [x] Subsequent CMS save defect reproduced: default checklist IDs reused across articles; SQLite unique-key collision and timestamp ID regressions. Fix unique creation IDs and preflight article-scoped related-row identities, preserving existing owned/native history IDs and retry stability.
- [x] Remove the requested **Recomendado** suffix from **Pesquisar Lacunas**; evidence/runtime policy unchanged.
- [x] Final corrective checks: 247 tests/22 files, lint/types/static build and tracked diff whitespace passed. Optional isolated production Drizzle/SQLite probe passed; no actual editorial database or Rust source changed.
- [x] Owner reported `1 OK, 2 OK, 3 OK` on 2026-10-02 for this corrective: recovered article saves/reopens with retained text/checklists and no Research Gaps suffix; another article saves independently; both texts remain after restart. Recorded as owner desktop observations, separate from the isolated SQL probe and earlier smoke.
- [x] Owner explicitly authorized this follow-up's local consolidation on 2026-10-02: **sim, criar commit local**, with message `fix(phase-6.4): prevent CMS save identity collisions`.
- [ ] Obtain separate authorization before pushing this follow-up; manual CI dispatch remains separately controlled.

Current script and evidence: [Slice 8 resumption validation](docs/testing/PHASE-6.4-SLICE-8-RESUMPTION-VALIDATION.md). No new migration, dependency, CI/authentication change or attachment implementation is introduced.

### Broader acceptance sequence

The [acceptance closure plan](docs/testing/PHASE-6.4-SLICE-8-ACCEPTANCE-CLOSURE-PLAN.md) records the published checkpoint, remaining evidence, owner desktop script and Phase 6.5 boundary. Preparing this plan does not establish new test results or acceptance.

- [x] Owner-reported functional completion of all six AI actions; detailed per-action quality/runtime evidence remains unrecorded.
- [ ] Complete remaining recoverable evidence/runtime failure checks.
- [ ] Complete desktop accessibility checks beyond the accepted keyboard smoke.
- [ ] Resolve packaged-runtime acceptance scope and complete independent technical/security review (Gate B).
- [ ] After separately authorized publication, prepare PR readiness and verify its published revision through the existing CI.
- [ ] Obtain human merge authorization (Gate C); define and approve Phase 6.5 specifications before its implementation. Release/tag requires separate Gate D authorization.

## Historical Phase 5 checklist

Current follow-up evidence and AntiGravity script: [Slice 8 cancellation/focus validation](docs/testing/PHASE-6.4-SLICE-8-CANCELLATION-FOCUS-VALIDATION.md). Prior reports preserve their historical test counts and acceptance limits.

- [x] ETAPA 0: GITOPS & PRESERVAÇÃO DE HISTÓRICO
  - [x] Commit `docs/GOVERNANCE.md`
  - [x] Commit `spikes/`

- [/] Fase 5.1: O Núcleo Nativo (Rust Core & Security)
  - [x] Implementar PKI (Ed25519, SHA-256, Atomic Rename) em `src-tauri/src/`
  - [x] Implementar Detecção de Hardware (RAM, CPU) em `src-tauri/src/`
  - [ ] Escrever `cargo test` para os módulos da Fase 5.1
  - [ ] Atualizar `CHANGELOG.md`
  - [ ] Commit da Fase 5.1 localmente

- [ ] Fase 5.2: O Supervisor de IA (Sidecar IPC)
  - [ ] Comando Tauri para spawn do Sidecar
  - [ ] Leitura de `stdout` e emissão de eventos
  - [ ] Comando Tauri `cancel_inference` com `kill` via Job ID

- [ ] Fase 5.3: Adapters & Máquina de Estados (TypeScript)
  - [ ] Definir Enums `ModelStatus` e `GenerationStatus`
  - [ ] Refatorar Adapters de IA do frontend (remover Gemini fallback)
  - [ ] Lógica de Graceful Degradation baseada em hardware

- [ ] Fase 5.4: Interface e UX (React)
  - [ ] Modal de Provisionamento com barra de progresso
  - [ ] Typewriter effect nos eventos Tauri
  - [ ] Bloqueio Freemium (`aria-disabled="true"`)
