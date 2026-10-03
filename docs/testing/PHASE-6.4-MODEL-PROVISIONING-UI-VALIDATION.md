# Phase 6.4 — Model Provisioning UI Validation

Date: 2026-10-02 (America/Sao_Paulo). Status: provisioning notice desktop checks accepted; settings entry/model selection accepted by the owner, with the subsequent dismissal corrective desktop retest and broader assistive-technology coverage pending.

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

**Historical script, subsequently accepted:** the owner reported `1 OK; 2 OK; 3 OK` for these three notice/provider/layout checks and supplied a desktop notice screenshot. Preserve that acceptance. The owner separately reported that the collapsed bottom-right local AI settings control could not be reached practically with Tab; that later defect is addressed below. The three accepted checks do not establish NVDA, actual model download or whole-app keyboard conformance.

Use the existing folder and feature branch. No pull/reset, migration, model pull or dependency installation is requested:

```powershell
cd C:\Users\RFERRAZ\Documents\retranca-editorial-os
git status --short --branch
npx tauri dev
```

1. **Notice keyboard:** if **Modelo embutido do Retranca** appears, use Tab/Shift+Tab and Escape. Expect focus on the title initially, cycling among notice buttons, and Escape closing it. Do not activate **Iniciar Download do Modelo**. If the notice does not appear because the bundled model is already present, report **não apareceu**; do not delete a model to force this check.
2. **Existing local provider:** open **IA local** and confirm your existing `gemma4:latest` selection remains available. Exercise one AI action on an unsaved disposable article if needed to verify the changed preflight integration. Expect the existing Ollama model to work; this targeted provider check does not replace the six-action acceptance already recorded. Do not install/pull or substitute another model.
3. **Notice layout / return to editing:** if the notice appears on a subsequent normal launch, resize the window and close it using the named X/button. Expect readable text and accessible close controls, followed by normal article editing. Do not reset articles or download a model to produce an error. Real download success/failure and NVDA announcement tests remain separately pending.

The owner subsequently reported `1 OK; 2 OK; 3 OK` for that historical script. The current scoped retest is below.

## Subsequent corrective — collapsed local AI settings trigger

Starting source: published `af1c01092debd802c659e9632ddf4a92fc0cca75`; its existing manual CI was dispatched as [run 37076408518](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37076408518). This follow-up does not infer or report that run's final result. The owner confirmed saving/closing the app before the layout edit; no owner process or editorial data was altered by the agent.

The isolated browser reproduced the practical barrier: with 30 built-in examples, the collapsed trigger had native `tabIndex=0`, was enabled and was reachable after **324 preceding controls**. Shift+Tab from it focused the last **Abrir no CMS** button, and Tab returned to it. This was excessive traversal caused by rendering `LocalAiSettings` after all page children, rather than removal from the tab sequence. Do not label that observation alone as proof of a normative WCAG failure.

The root layout now renders this single global settings control before the page children, inside the existing runtime provider. Its fixed bottom-right styling is retained. The button has `type="button"` and the accessible name **Configuração de IA local**; no positive tabindex, duplicate shortcut, provider-selection or persistence change is introduced. This follows the project's logical keyboard-order requirement, informed by [W3C Focus Order guidance](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html), [APG disclosure keyboard guidance](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) and [MDN tabindex guidance](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/tabindex), consulted on 2026-10-02. Whole-app conformance remains unverified.

| Check | Status / observation | Scope |
| --- | --- | --- |
| Final `npm test` | pass: **274 / 25 files** | Two new actual root-layout rendering checks prevent late/duplicate settings triggers and verify collapsed/named/enabled natural-order output. |
| Lint/types/build/diff whitespace | pass | Initial new-test lint issue was corrected; final lint, standalone types and focused/full tests passed. Production source did not change after the executed static build. Existing tooling deprecation warnings remain. |
| First Tab with settings closed | pass | In compiled isolated `127.0.0.1:3048`, after dismissing the startup notice, the first page Tab focused **Configuração de IA local** with `aria-expanded=false`; preceding-control count changed from 324 to 0. Fixed position and visible blue focus ring retained. |
| Enter / Space / Escape | pass | Enter and Space each opened settings and focused **Modelo Ollama**. Escape closed the panel and restored trigger focus; Tab continued to **Alternar Modo de Escrita**, and Shift+Tab returned to settings. Browser inventory failure was shown truthfully; no actual model was accessed/downloaded or used for inference. |
| Neighboring modal | pass in sample | Opening the AI assistant kept sampled Tab inside its native modal, rather than reaching the background settings control; Escape restored **IA Assistant** focus. No inference was started. |
| Owner desktop retest / NVDA | pending / not-tested | Prior notice acceptance is preserved; this new trigger behavior still needs desktop confirmation. Native source/contracts are unchanged; no fresh local Rust result is claimed. |

The agent-created browser tab/static server were closed/stopped after QA; default viewport sizing was retained. Screenshot `.retranca-local/local-ai-trigger-focus.jpg` is ignored and contains built-in examples only.

### Historical AntiGravity check — keyboard entry

Use the same start commands above. On a fresh launch, close the model notice with Escape if it appears. With dialogs closed, enter page keyboard navigation with Tab: **IA local** should receive visible focus immediately. Press Enter to open settings; focus should move to **Modelo Ollama**. Press Escape to close; focus should return to **IA local**. The following Tab should continue to **Modo Escrita**. Report **IA local por teclado: OK** or the step that failed. Do not repeat the previous three accepted checks, download a model or modify actual articles for this retest.

## Local AI settings dismissal corrective

Starting source: published `0620f3362872caf3b0347238319d195c7a21249c`. Its [manual CI dispatch](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37079216527) was previously observed in progress; no final result is inferred here. The owner confirmed keyboard entry and model selection, but reported Escape not closing settings and no visible X. The owner saved/closed the app before this edit.

Code inspection and the isolated compiled browser confirmed that the panel had no dedicated close button. The old Escape handler covered panel descendants only: Shift+Tab back to the opening trigger followed by Escape left it expanded. Escape from a collapsed model selector had passed in the previous browser sample; that sample did not establish desktop native-option-list behavior.

Add a named native **Fechar configuração de IA local** X button with a visible focus ring and 32-by-32 CSS-pixel target. Both the X and Escape restore focus to the opening trigger. Subscribe to document keydown only while settings are open, releasing the listener on close/unmount; ignore already-handled/composing events and defer to any foreground open dialog. The model-choice state and native IPC remain unchanged. This preserves the disclosure semantics described by [APG](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) and uses the event propagation documented by [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/keydown_event), consulted on 2026-10-02. Escape dismissal beyond the trigger is a project usability requirement, not a mandatory interaction claimed from the basic APG disclosure pattern.

| Check | Result / scope |
| --- | --- |
| `npm test`, lint, standalone types, static build | pass: **274 / 25 files**; no new test count claimed. Existing tooling warnings remain. Native Rust source/contracts are unchanged; no fresh local Rust run. |
| X button | pass in isolated compiled browser: visible/named; Shift+Tab from selector reaches it; Enter and pointer click each close and restore trigger focus. |
| Escape / traversal | pass in isolated compiled browser: first page Tab still reaches settings; Enter/Space opens and focuses selector; Escape from collapsed selector, opening trigger and following page control closes and restores trigger focus. |
| Foreground dialog | pass in sample: when AI assistant opens over settings, Escape closes only the assistant and restores its own trigger; settings stays open. A subsequent Escape closes settings and restores its trigger. No inference started. |
| Owner desktop / NVDA / populated native option list | pending / not-tested. Existing owner model-choice acceptance is preserved; the browser has no native Ollama inventory and displays its truthful error. If the system's option list consumes the first Escape, close that list before testing panel dismissal. |

QA used only built-in examples at `127.0.0.1:3049`; no owner data/model/download was accessed. Screenshot `.retranca-local/local-ai-settings-close.png` is ignored. The agent-created tab/server were closed/stopped after QA.

### Current AntiGravity check — close settings

Use the same start commands above; close any startup model notice with Escape. Test only these changed controls, without downloading/changing a model or editing articles:

1. Open **IA local**, then click its new **X**. Expect settings to close and focus to return to **IA local**.
2. Reopen with Enter. With the model option list closed, press Escape. Expect the same dismissal/focus return. Optionally Shift+Tab from the selector to X and press Enter to check the close button by keyboard.

Report **1 OK; 2 OK** or the exact failed step. The earlier accepted notice/provider checks do not need repetition.

## Remaining gates

On 2026-10-03 the owner explicitly accepted both X/Escape desktop closure checks. The GitHub API verified [CI 37080317950](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37080317950) as successful on `08218bf6c05d510904686d3a89c56d7bfe8826ae`, including frontend, Rust Windows/Linux and the required Rust aggregate. Node 20 Action-runtime deprecation warnings and upcoming Ubuntu-runner migration notices do not change that successful result; they are separate CI-maintenance work. This is not CI evidence for later revisions.

Assistive-technology/manual accessibility, real packaged engine/model binding and full independent Gate B remain open. Successful CI and owner-reported notice/entry/dismissal acceptance do not close them. Merge/tag/release still require human Gates C/D. The owner authorized the next bounded model-inventory/recovery increment without changing provider authority.
