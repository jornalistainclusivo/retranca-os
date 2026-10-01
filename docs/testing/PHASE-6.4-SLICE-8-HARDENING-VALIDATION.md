# Phase 6.4 — Slice 8 Integration and Hardening Checkpoint

Date: 2026-09-30 (America/Sao_Paulo).

Historical checkpoint, saved with authorization as `ac453e8` on 2026-10-01. Subsequent implementation and acceptance are tracked in [Slice 8 cancellation/focus validation](PHASE-6.4-SLICE-8-CANCELLATION-FOCUS-VALIDATION.md); the counts and unresolved behavior below describe this checkpoint, not the newer working tree.
Branch: `feat/phase-6.4-pro-workflow-customization`.
Saved baseline: `9fd69601567f60c5a922b0e6523160aecd5b063a` (Slice 7 / open single edition).
This checkpoint describes the subsequent Slice 8 changes. The product owner authorized their local consolidation commit on 2026-10-01; publication remains unauthorized. Identify that checkpoint with `git log --oneline` and its validation-report path.

## Outcome and authority

The product owner authorized proceeding with Slice 8 after a Windows desktop smoke check. [ADR-013](../decisions/ADR-013-OPEN-SINGLE-EDITION.md) remains the access-policy authority; [ADR-008](../decisions/ADR-008-EDITORIAL-AI-ORCHESTRATION-BOUNDARY.md), [ADR-009](../decisions/ADR-009-DYNAMIC-WORKFLOW-AND-AI-SEMANTICS.md), and [ADR-010](../decisions/ADR-010-CATEGORY-AND-CHECKLIST-PERSISTENCE.md) remain applicable.

Automated integration gates passed locally. This does not establish Gate B acceptance, remote CI for the current changes, or release readiness. No new dependency, schema migration, data rewrite, CI/authentication change, push, PR, merge, tag, or release was performed. Slice 8 remains open for the acceptance gaps listed below.

## Corrections and traceability

| Concern | Change | Evidence |
| --- | --- | --- |
| Dynamic publication metrics / ADR-009 | Header counts articles by the current stage's `PUBLICATION` lifecycle role. Legacy `status`, stage name/order, and AI semantics do not establish publication. | `__tests__/open-edition-entrypoints.test.ts`: custom publication stage, misleading `PUBLISHED` semantics, stale legacy status, unresolved stage. |
| Semantic vocabulary / IPC contract | Native stage creation now returns `ERR_INVALID_SEMANTIC_CLASSIFICATION`, matching update. Browser create/update reject invalid classifications before saving. Browser create rejects fractional/nonfinite ordering; unknown update IDs reject. | `src-tauri/tests/phase64_domain.rs`, `__tests__/phase64-browser-fallbacks.test.ts`: all five classifications, unclassified stage, canonical error, unchanged state on failure. |
| Active-name uniqueness | UI validation considers active stages/categories only, allowing reuse of inactive names while retaining active duplicate rejection. | `lib/utils/__tests__/workflowValidation.test.ts`. |
| Untrusted AI output / ADR-008 hardening | Both AI modals use `AiTextMarkdown`. Markdown images become description text, without image elements or preload hints. Formatting and explicit safe links remain. Raw HTML stays inactive under the existing renderer. | `__tests__/ai-text-markdown.test.ts`: inline/reference/relative images, raw HTML and unsafe link scheme negative controls. |
| Accessible control names | Article and assistant icon-only close buttons receive explicit labels and `type="button"`. | Source inspection; this does not verify focus containment or screen-reader experience. |
| Runtime-report accuracy | Ollama cancellation warning no longer claims that Rust drops the connection. The adapter does not abort it. | `lib/adapters/aiProviderRouter.ts`, `src-tauri/src/ollama_gateway.rs`; functional cancellation remains unresolved. |

Board, list, calendar, statistics, sidebar, and page publication filters were inspected for lifecycle-role use. This is source coverage, not an interactive end-to-end test of every view. Existing browser/native suites cover migration, reassignment, publication role, checklist copies/history, and failed-operation preservation. This round adds targeted regression coverage; it does not claim that all browser error envelopes or storage-failure behavior equal native transactions.

## Executed validation

| Command | Result |
| --- | --- |
| `npm test` | PASS — 201 tests in 17 files. |
| `npm run lint` | PASS. |
| `npm run build` | PASS — production export and TypeScript check. |
| `npm run lint:rs` | PASS — formatting and locked Cargo check. |
| `npm run test:rs` | PASS — 97 tests: 62 unit and 35 integration. |
| `npm run test:rs:release` | PASS — the same 97 tests in release profile. |
| `node scripts/security-enforcement-test.mjs` | PASS — raw inference registration remains debug-only. |
| `git diff --check` | PASS. |

The initial debug test rebuild was blocked by the running `app.exe` on Windows. The product owner saved their work, closed Retranca, and stopped development; the subsequent debug execution passed. This was a file-lock failure before tests, not a test assertion failure. Rust sources were unchanged after the passing native executions; frontend gates were rerun after Markdown/control-label corrections.

Existing tool warnings remain: Vite configuration format, ESLint's legacy ignore file, Rust test `unused_mut`, and absent production signing-key configuration. Passing release tests do not verify a production installer or a provisioned real sidecar.

## Security review boundary

A Codex Security diff review was started for the immutable range `6ce03fd4b3530b4176b4907a4d25d5a47effb7dd..9fd69601567f60c5a922b0e6523160aecd5b063a`, scan `8847f33b-37e0-42ef-900e-da814c3919da`. Its inventory contains 22 changed source files, including deletions. A separate architecture review maps native SQL, AI orchestration, local runtime, provisioning, and Markdown boundaries. The scan of that saved commit does not automatically validate subsequent working-tree fixes.

The locked original Markdown renderer was exercised with a public `example.invalid` marker. It emitted an external `<img>` and React image preload hint. No external request, personal content, real model output, XSS execution, or editorial-data exfiltration was observed in this reproduction. The correction removes those automatic-resource elements; regression tests demonstrate its generated markup. Explicit links can still contact a destination when a person chooses to follow them.

Managed finalization succeeded for scan `8847f33b-37e0-42ef-900e-da814c3919da`. All 22 inventory files were reviewed, but security coverage is **partial**: the two independent Markdown-resource candidates remain `deferred` because actual WebView traffic and attacker-induced model output were not reproduced. There are no finalized reportable findings; that does not mean an all-clear review. The later working-tree rendering correction is covered separately by regression tests and does not alter the immutable target.

Local generated artifact: `C:\Users\RFERRAZ\.codex\state\plugins\codex-security\scans\retranca-editorial-os\9fd69601567f60c5a922b0e6523160aecd5b063a_20260930T233815Z_mze6yj1p\report.md`. Portable artifact references: `artifacts/01_context/architecture.json`, `artifacts/01_context/threat_model.md`, `artifacts/02_validation/markdown-resource-rendering.txt`. These plugin artifacts are local evidence outside the repository; the scope, decision, proof gaps, and current correction are documented here for contributors.

The plugin reports cumulative usage across three associated threads: total `15744223`, input `15677244`, cached input `14940288` tokens (`coverage=complete`, source `codex_rollout`). This is the tool's associated-thread measurement, not isolated Slice 8 turn usage or an estimate of account credits.

Security review is not commercial-gate restoration; retirement of Free/PRO is the authorized product decision.

## Remote state checked separately

Read-only GitHub verification found no open PR for this repository. The remote feature branch was still at `6ce03fd`; local `9fd6960` was ahead by one commit before this checkpoint's uncommitted changes.

The four successful checks were attached to main `528be4fb5d0a368eb187afe237b0e95fffb710f0`: frontend, Windows Rust, Linux Rust, and the stable Rust aggregate. [Observed workflow run](https://github.com/jornalistainclusivo/retranca-os/actions/runs/36639105653). Those results do not validate `9fd6960` or this working tree. No continuous GitHub monitor was configured.

## Acceptance gaps and contributor handoff

| Verification | Status | Next evidence required |
| --- | --- | --- |
| Automated frontend/native integration | pass | Results above, tied to this working tree. |
| Windows development interface | pass (product-owner report) | Product owner reopened the current Slice 8 development app and reported successful operation on 2026-09-30. This is an interface smoke check, not evidence for every acceptance scenario below. |
| Real Ollama inference for all six actions | partial (product-owner report) | Linguagem Simples passed with the owner's installed local model and the public test text in the script below. The other five actions and their error paths remain untested manually in this checkpoint. No fixture output counts as live inference. |
| Ollama cancellation | needs-review | Implement and verify native request cancellation; the existing adapter is a no-op. UI stopping display does not establish runtime interruption. |
| Keyboard, NVDA, zoom/reflow, contrast, reduced motion | partial keyboard smoke; remaining checks not-tested | Product owner reached the article close button with Tab and closed it with Enter, with visible focus. Screen-reader experience, other controls, zoom/reflow, contrast, reduced motion, focus containment/return and overlay stacking remain unverified. |
| AI dialog focus behavior | needs-review | Existing modal wrappers lack a complete dialog/focus-management implementation; close-button labels alone do not resolve it. |
| Packaged production runtime / model provisioning | not-tested | Verify installer, actual sidecar resolution/model linkage, production manifest trust configuration. Mock sidecar output is not real inference. |
| Windows/Linux CI for this checkpoint | not-tested | Separately authorized publication followed by checks on the exact published commit. |
| Gate B | pending | Technical/security acceptance must explicitly address the remaining runtime/accessibility/packaging gaps. |
| Gates C/D | pending | Separate human merge and release/tag authorization. |

Next work must preserve the editorial database and the current branch. No reset, seed restoration, destructive checkout, or migration is required to inspect these changes. The prior Slice 7 commit remains recoverable. The product owner's 2026-10-01 authorization covers the local consolidation of this checkpoint and continued implementation of the documented next steps; another commit or any push still requires a new explicit confirmation. Local consolidation does not establish a remote backup.

## AntiGravity commands

### Product-owner smoke-test script for this checkpoint

Opening the app has already been confirmed. The following short script is the requested manual handoff, not a complete release or accessibility audit. Automated suites remain the implementer's responsibility; do not ask the product owner to repeat them routinely.

| Step | Action | Expected result | Evidence status |
| --- | --- | --- | --- |
| 1 — Stage validation | Open **Configurações Editoriais → Etapas do Fluxo**. Add an unused temporary name such as **Teste Slice 8**, with **Sem classificação**. Try adding the same name again. Do not change existing stages or move editorial articles for this test. | First creation appears once; duplicate creation shows a clear error and does not create a second stage. | pass — product owner reported **1 OK** on 2026-09-30. |
| 2 — Actual local AI | In **IA local**, select the installed model you normally use. Open **IA Assistant → Linguagem Simples**, enter the public test text **A reunião será realizada amanhã, às 10 horas, na biblioteca.**, and select **Gerar com IA**. Wait for completion. | Actual local model returns readable text; no runtime/model error and no permanently stuck generation indicator. The precise wording is not an acceptance requirement. | pass — product owner reported **2 OK** on 2026-09-30. This covers one action, not all six. |
| 3 — Basic keyboard close | Open an article. Use Tab to reach its close button and press Enter. | Focus indicator is visible and the article closes. Record inability to reach/identify the button as a failure. | pass — product owner reported **3 OK** on 2026-09-30. Complete dialog focus containment/return remains separate pending work. |

Report each result as **1 OK/falhou; 2 OK/falhou; 3 OK/falhou**, with the step and visible error text if something fails. Passing these checks does not close native Ollama cancellation, all-action inference, screen-reader coverage, or production packaging. The navigation's remaining **Configurações PRO** caption was corrected to **Configurações Editoriais** while preparing this handoff; it does not alter access or persistence behavior.

Recorded response: **“1 OK; 2 OK; 3 OK”**, received from the product owner on 2026-09-30 (America/Sao_Paulo). These are user-reported manual results, not agent-observed runtime traces. The exact model tag, generated response and duration were not captured in this confirmation; do not invent them or infer broad AI/accessibility conformance from this smoke script.

Inspect the current work:

```powershell
cd C:\Users\RFERRAZ\Documents\retranca-editorial-os
git status --short --branch
git diff --stat
```

Open the desktop interface with the actual local Ollama configuration:

```powershell
npx tauri dev
```

Select your installed model in **IA local**. This command invokes the configured Next development server; no separate `npm run dev` is necessary. Before rebuilding Rust tests, save your work, close the application, and stop `npx tauri dev` with Ctrl+C. Do not pull/reset over pending changes. Commit and push require explicit authorization under the user's operational instructions.
