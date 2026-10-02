# Phase 6.4 — Model Provisioning UI Validation

Date: 2026-10-02 (America/Sao_Paulo). Status: corrective implemented; automated and isolated browser checks passed; desktop/assistive-technology acceptance remains pending.

## Authority and scope

Starting source: `b2860c617856fe8048d3ac219a38c713c7f69c4d`, clean/synchronized feature branch. The owner replied **Tudo ok. prossiga.** to the previous import handoff. Its owner-reported acceptance and exact-source four-job successful CI are recorded in [local import validation](PHASE-6.4-LOCAL-IMPORT-VALIDATION.md). Preserve earlier CMS/AI/import observations; do not repeat them merely for reconfirmation.

The owner's continuing development/consolidation/publication/manual-CI authorization applies to this corrective. Existing [ADR-008](../decisions/ADR-008-EDITORIAL-AI-ORCHESTRATION-BOUNDARY.md) retains native provider authority, and [ADR-013](../decisions/ADR-013-OPEN-SINGLE-EDITION.md) retains the open edition. This round enforces those decisions; it introduces no new engine, dependency, migration, authentication or CI change. [Phase 6.5](../architecture/PHASE-6.5-PRODUCTION-EXPERIENCE-PLAN.md) remains a draft. Actual articles, databases, model files and credentials were not inspected or changed; no model download or inference was executed by the agent.

## Defects and resulting behavior

| Defect / impact | Resulting behavior | Verification |
| --- | --- | --- |
| A styled `div` claimed modality without dialog focus behavior; download/verification had no close control. Keyboard users could not dismiss every state consistently. | Reuse `useModalDialog` and native `<dialog>`; initially focus the heading, keep boundary Tab/Shift+Tab inside, support Escape and provide a named visible close button in all displayed states. READY/closed render nothing. | Actual component rendering and isolated browser keyboard observations. |
| Browser timers simulated VERIFYING/READY and selected SIDECAR without downloading anything. | Reject non-desktop provisioning immediately with a specific error, retry and close controls; no timer-generated readiness/provider selection. | Mocked IPC guard plus actual non-Tauri browser error/retry. |
| Native completion forced READY/SIDECAR rather than reading back native facts. | Await `download_model`, then `preflight_check`; derive model state from hardware/model facts and retain `selected_provider` from Rust, including OLLAMA. | Mocked native lifecycle tests; actual desktop provisioning is not exercised. |
| Verification listener was not removed after native failure; progress registration could resolve after close. | Verification cleanup runs on success/download failure/readback failure. Disposed progress subscriptions release late registrations and ignore stale/invalid events. Each downloading view starts at zero; progress is bounded to 0–100. | Failure/race/invalid-number regressions with mocked events. |
| Decorative download/verification spinners ignored reduced motion. | Stop spinner animation and progress transitions under reduced-motion preference; retain textual status and labelled progress. | Actual component markup and compiled CSS; real preference/reader experience pending. |

Closing this notice hides it; it **does not cancel** an ongoing native download or verification. The copy tells the user to keep the application open until completion. The model notice concerns the bundled model; an existing Ollama configuration remains usable independently. This does not certify the bundled mock-sidecar as a production engine or bind a verified model to it.

## Executed checks

| Check | Status | Evidence boundary |
| --- | --- | --- |
| `npm test` | pass: **272 / 24 files** | Final suite after the keyboard boundary correction. Nine new native-bridge lifecycle tests; replace seven constant/mirrored historical checks with ten actual component-rendering checks. The initial nine rendering checks failed against the old component, exposing missing dialog/close/READY/reduced-motion behavior. |
| `npm run lint` | pass | Existing `.eslintignore` deprecation warning remains. |
| `npx tsc --noEmit` | pass | Final corrected types. |
| `npm run build` | pass | Static export after the keyboard correction; compiled production frontend used for the browser check. |
| Browser keyboard/error/notice width | pass in sampled browser | Observations below; does not prove desktop WebView/NVDA or full-app conformance. |
| Native Rust tests in this round | not-tested | Rust source/contracts unchanged. The prior exact-source CI above remains historical evidence; no fresh local Rust count is claimed. |
| Native model download, model binding, packaged installer | not-tested | No actual model is downloaded or replaced. Mock transport is not production inference evidence. |
| NVDA, contrast audit, whole-app reflow/zoom, actual reduced-motion setting | not-tested | Still require separate desktop/manual coverage. |
| Full independent Gate B | needs-review | Prior sealed security scan retains partial canonical coverage. No new security scan or full review is claimed. |

## Implementer browser observations

The compiled `out` frontend was served on a dedicated `127.0.0.1:3047` origin, using only built-in examples. The agent did not open the owner's Tauri database. The initial port query was insufficient to establish that the AntiGravity server had stopped; Next subsequently reported its active process. No owner process was killed. Both owner process IDs were later absent. Only the agent-owned static server/tab were stopped/closed after QA, and the viewport override was reset.

1. `dialog.open` and `:modal` were true; the named dialog locator matched once; focus started on `model-download-title`. Tab reached the header close, download and footer close controls. An initial native-dialog build let the boundary Tab leave the page for browser chrome; the scoped boundary handler corrected it. Final Tab wrapped footer-to-header, and Shift+Tab wrapped header-to-footer, with focus inside the dialog.
2. Escape removed the dialog. The next observed Header keyboard traversal reached **Nova Pauta**; background controls were usable again. The auto-open notice's captured invoker was the document body, so this observation does not establish restoration to a specific initiating button.
3. In the non-Tauri browser, pressing the download control showed the desktop-required error, not READY. Retrying kept the recoverable error; replacing the focused start/retry control moved focus back to the heading. No model transfer or inference occurred.
4. The notice/error controls remained visible without horizontal dialog overflow at **320 CSS px** (`innerWidth=320`; client width/scroll width both 308 including scrollbar allowance). The browser's existing 125% scaling required a 400-pixel viewport override to obtain that CSS width. An additional narrower 256-CSS-pixel observation retained its controls. This is notice-only evidence, not whole-Kanban reflow proof.
5. The named header close was keyboard-activated and removed the dialog. Local screenshots remain ignored in `.retranca-local/provisioning-dialog.jpg` and `.retranca-local/provisioning-error-320.jpg`; they contain only built-in examples.

The [APG modal-dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) supplies interaction guidance; [MDN's dialog reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) documents native behavior. Both were consulted on 2026-10-02. Neither an accessibility tree nor these sampled checks establishes full WCAG conformance or actual screen-reader experience.

## AntiGravity handoff — only checks affected by this round

Use the existing folder and feature branch. No pull/reset, migration, model pull or dependency installation is requested:

```powershell
cd C:\Users\RFERRAZ\Documents\retranca-editorial-os
git status --short --branch
npx tauri dev
```

1. **Notice keyboard:** if **Modelo embutido do Retranca** appears, use Tab/Shift+Tab and Escape. Expect focus on the title initially, cycling among notice buttons, and Escape closing it. Do not activate **Iniciar Download do Modelo**. If the notice does not appear because the bundled model is already present, report **não apareceu**; do not delete a model to force this check.
2. **Existing local provider:** open **IA local** and confirm your existing `gemma4:latest` selection remains available. Exercise one AI action on an unsaved disposable article if needed to verify the changed preflight integration. Expect the existing Ollama model to work; this targeted provider check does not replace the six-action acceptance already recorded. Do not install/pull or substitute another model.
3. **Notice layout / return to editing:** if the notice appears on a subsequent normal launch, resize the window and close it using the named X/button. Expect readable text and accessible close controls, followed by normal article editing. Do not reset articles or download a model to produce an error. Real download success/failure and NVDA announcement tests remain separately pending.

Report `1 OK; 2 OK; 3 OK`, **não apareceu**, or the exact affected behavior. These are current desktop checks, distinct from the previous accepted import script.

## Remaining gates

Owner desktop notice/provider observations, assistive-technology/manual accessibility, real packaged engine/model binding and full independent Gate B remain open. Successful local frontend checks or the previous import CI do not close them. Merge/tag/release still require human Gates C/D. Existing manual CI may be dispatched for the new published corrective revision; its result must be verified separately when the owner returns.
