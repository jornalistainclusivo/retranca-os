# Phase 6.4 — Slice 7 and Open Single Edition Validation

Date: 2026-09-30 (America/Sao_Paulo).
Branch: `feat/phase-6.4-pro-workflow-customization` (historical name retained).
Baseline: `6ce03fd` (Slice 6 corrective, already synchronized with origin before this work).
This report accompanies the local consolidation checkpoint authorized by the product owner on 2026-09-30. No push, merge, tag, or release is included.

## Approved scope change

The product owner explicitly approved one open edition without account or subscription. [ADR-013](../decisions/ADR-013-OPEN-SINGLE-EDITION.md) supersedes the commercial policy from ADR-011/012 and the older Phase 6.4 commercial clauses. ADR-008/009/010 still govern native AI validation, semantics/lifecycle separation, and persistence.

The original Slice 7 work was extended by this approved product decision. This is an access-policy implementation, not a fabricated PRO entitlement or promotion of the debug premium override.

## Implementation and requirement traceability

| Requirement | Implementation / evidence |
| --- | --- |
| BR-AI-001/003/004, TEST-AI-001/002 | `aiActionEvaluator` consumes the current stage's optional classification. All six actions are tested across five classifications plus null, with valid, missing, and whitespace-only evidence. Recommendations never bypass prerequisites. |
| ADR-009: identity/display/order/lifecycle separation | `ArticleModal` looks up the selected stage by `workflowStageId`. It does not infer recommendations from names, order, lifecycle role, or legacy status. Unresolved stage yields no recommendation, while valid evidence remains available. Real rendered UI tests cover stale legacy status, renamed stages, null, and semantic PUBLISHED without a publication role. |
| ADR-008: authoritative native evidence | New Rust integration tests deserialize the real orchestration DTO and exercise evidence validation, projection, budget, prompt assembly, and dispatch planning for six actions across five preserved legacy wire statuses. Missing/blank evidence fails native validation. AI prompts/models and trust boundaries are unchanged. |
| TEST-OPEN-001/003 | All ten native structural command functions are exercised without an entitlement provider. Creation/update/reorder/removal and category/template operations succeed; schema failure and existing rollback/reference/publication tests remain enforced. Applied checklist labels survive template update/deletion. |
| TEST-OPEN-002 | Real `WorkflowEditor`, `Header`, and AI modal rendering has no commercial lock. Production/development rendering exposes local model settings. No entitlement context or entitlement IPC request is needed. |
| Local runtime access | `AiRuntimeContext` holds only manual model selection. `LocalAiSettings` replaces developer premium controls and exposes Ollama model selection in normal builds. Model-query failure is announced; Escape closes the panel and restores trigger focus. The assistant's Linguagem Simples control now requests canonical `plain_language`. |
| Accessibility of affected controls | AI action buttons retain native disabled states for missing evidence/running jobs, explicit textual recommendation, visible focus, minimum height, and reduced-motion handling. AI evidence/stage labels are associated with their controls. Document language is pt-BR. |

Native commercial authorization and its managed state are removed from `phase64.rs` and command registration. `entitlements.rs`, `EntitlementContext`, and the developer premium switch are retired. No new dependency, migration, CI change, payment/authentication integration, data rewrite, or live model provisioning was performed.

The Phase 6.3 `editorialStatus` and `categoryTag` wire fields remain compatibility metadata. Rust evidence validation and prompt projection do not use them as action-availability authority; dynamic recommendation classification is frontend presentation data. No AI IPC contract expansion is required.

## Automated validation

Baseline before edits: 160 frontend tests, 101 Rust tests, lint, Rust formatting/check passed.

| Check | Result |
| --- | --- |
| `npm test` | 192 passed across 16 files |
| `npm run lint` | Passed |
| `npm run build` | Passed; TypeScript and static export |
| `npm run lint:rs` | Passed; formatting and locked debug check |
| `npm run test:rs` | 96 passed (62 unit + 34 integration) |
| `npm run test:rs:release` | 96 passed (62 unit + 34 integration) |
| `node scripts/security-enforcement-test.mjs` | Passed; raw inference registrations remain debug-only |
| `git diff --check` | Passed |

Eight entitlement unit tests, five frontend entitlement-helper tests, obsolete paid-denial UI scenarios, and four symbolic premium-lock tests were retired. Counts must not be compared as unchanged coverage: the current suite validates the new open policy and retains the domain/AI integrity tests.

Existing Vite configuration, ESLintIgnoreWarning, and Rust unused-variable warnings remain. No test framework was installed.

## Interactive validation

The actual components were bundled with existing tooling on isolated `127.0.0.1:43867`, using disposable data and the real browser storage/API implementation. The production React build mode and real AI runtime context were used. The native model-list/stream/provider boundary was replaced by a fixture: it records requests and completes jobs without calling a model, network inference service, or user database.

Verified in the browser:

- Create a workflow stage, custom category, and checklist template with no entitlement state or premium toggle.
- Arrow-key navigation among configuration tabs, including selected tab/focus state.
- Current REVIEW semantics recommend actions despite the article's legacy `ideia` status.
- A PUBLICATION-role stage with null semantics leaves all six evidence-valid actions enabled and removes recommendation highlighting.
- Submit all six actions with Enter from the actual buttons; the fixture's visible DOM recorder confirms `research_gaps`, `plain_language`, `validate_inclusivity`, `generate_alt_text`, `generate_seo`, and `editorial_review`.
- Open normal model settings, focus the labeled model selector, select the fixture model, close with Escape, and restore focus to the trigger. Reopening preserves the current session selection.

Screenshot artifact: `C:/Users/RFERRAZ/.codex/visualizations/2026/09/29/01a0ef4e-72f0-7211-b79e-c7ca2d4eef7b/open-edition-slice7-validation.png`. The fixture model/dispatch recorder shown there are validation aids, not shipped product UI.

### User desktop smoke check (2026-09-30)

The product owner launched the current working tree with `npx tauri dev` on Windows and reported that the interface works according to the agreed plan. This is a user-reported desktop development smoke check. It does not independently establish successful inference with `gemma4:latest`, all-action coverage, packaged-build behavior, or assistive-technology conformance.

## Remaining work and limitations

Slice 7 and the approved open-edition access change are implemented and validated locally. Slice 8 still requires phase-wide integration/security hardening and independent review. Gate B has not passed; push, merge, tag, and release remain unauthorized. A local consolidation commit preserves this round; it is not a release-readiness decision.

Validation ran on Windows. Linux CI for this new working tree, packaged desktop runtime inference with actual Ollama/SIDECAR, and manual assistive-technology testing (NVDA/VoiceOver/TalkBack) have not been performed. Browser markup/keyboard checks are not WCAG certification. Installed runtime/model capability still determines whether local inference can execute; browser fallback supplies editorial storage compatibility, not native inference.

Historical entitlement threat models and Slice 6 reports are retained as historical evidence and superseded for current commercial access requirements. Formal license changes, cloud AI, collaboration, multiple workflows, and other deferred product capabilities were not introduced by ADR-013.

## Consolidation review and contributor handoff (2026-09-30)

The product owner authorized review and a local commit after the desktop smoke check. The review covered the tracked diff and the seven new files: runtime context/model settings, real UI rendering tests, native AI tests, ADR-013, and this report. No residual entitlement hook/provider/authorization call was found in application source. Native command changes remove commercial authorization plumbing while retaining schema checks, domain validation, and transactions. Package manifests, dependency locks, database migrations, and CI workflows are unchanged in this checkpoint.

Review corrections: aligned two JSX attributes, removed trailing whitespace caught when checking the newly staged model-settings component, corrected the README roadmap's obsolete identity/entitlement scope, documented direct desktop startup with real Ollama models, and distinguished local commit authorization from the pending review/merge/release gates. Automated checks listed above were rerun for consolidation. This focused review does not substitute for the independent phase-wide Slice 8/Gate B review.

One initial debug-test invocation stopped before executing the suite because Windows denied replacement of `src-tauri/target/debug/app.exe` (`os error 5`). A subsequent invocation completed with all 96 tests passing; release also passed all 96. No process was terminated and no build artifact or editorial database was deleted to obtain that result. Relative Markdown links in the contributor entry documents were also checked successfully.

### Reproduce the current interface

From the repository root, run `npx tauri dev`; it starts the frontend automatically. Keep Ollama running and use `ollama list` to identify an actually installed model. Select that exact tag in **IA local**, then open an article and provide the evidence required by the desired action. Model selection is session-only. Use a disposable article for verification and preserve existing local data. The browser fixture screenshot above is an optional local artifact outside the repository, not a required reproducibility input or proof of real inference.

### Validation commands

Run these from the repository root with the existing frontend dependencies and platform-specific Tauri prerequisites installed:

```shell
npm test
npm run lint
npm run build
npm run lint:rs
npm run test:rs
npm run test:rs:release
node scripts/security-enforcement-test.mjs
git diff --check
```

### Next checkpoint: Slice 8

- Review phase-wide native/browser persistence parity and dynamic stage/category integration across board, list, calendar, statistics, and header metrics. Header metrics still use legacy status; assess compatibility against dynamic publication roles rather than assuming the Slice 7 tests cover them.
- Check canonical error parity, including invalid semantic classification on stage creation, and verify rollback/data preservation for invalid operations.
- Exercise real Ollama inference, cancellation, and error reporting for the six actions with installed models; record model tag and runtime evidence. The user's interface confirmation does not establish all-action inference coverage.
- Perform manual keyboard/screen-reader, zoom/reflow, and modal/model-settings focus/stacking checks. Record limitations instead of declaring WCAG conformance from markup tests.
- Obtain independent technical/security review for Gate B. Following separate push authorization, run the existing Windows/Linux CI against the published commit; previous CI results do not validate this checkpoint.

To identify the saved work, use `git log -1 --oneline` and `git show --stat HEAD`. A local commit is recoverable through Git history but is not a remote backup. Do not reset/delete the editorial database to resume development. Any rollback touching data requires a separate preservation plan; this checkpoint introduces no schema migration or data rewrite.
