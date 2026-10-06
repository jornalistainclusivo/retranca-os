# Phase 6.5 Increment 2 — Readiness UI validation and handoff

Date: 2026-10-05 (America/Sao_Paulo). Scope: the [readiness UI specification](../specifications/phase-6.5/PHASE-6.5-INCREMENT-2-READINESS-UI.md), building on the published native implementation. Local observations, remote CI and owner desktop acceptance are distinct evidence. This report does not close Phase 6.5 or approve an installer/release.

## Baseline and authorization

The owner separately authorized native commit, push and manual CI. Native implementation `d944a114f935cbab7222068c22fe22bc26f12fb1` is on `codex/phase-6.5-production-provider-contract`. On the owner's successful-CI return, GitHub API confirmed [run 37356369629](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37356369629) `completed / success` on that exact SHA, including frontend, Rust Windows, Rust Ubuntu and required Rust aggregate. This confirms the native baseline, not the subsequent UI source.

The owner then authorized the next development step and confirmed the application was already closed. Preserve their accepted simplification/cancellation/original-CMS-text checks, and the earlier inventory/selection/X/Escape acceptances. New diagnostics do not change CMS persistence or save temporary AI suggestions.

## Implemented behavior

- `types/localAiReadiness.ts` mirrors the public native DTO, separate from provisioning/generation state.
- `lib/api/localAiReadiness.ts` checks desktop availability and validates the unknown response, enum/bounds, selected/resolved tag consistency and required READY evidence. Only the minimal diagnostic crosses this bridge; no editorial context, endpoint or inference request.
- `components/LocalAiSettings.tsx` displays pending/native messages, server version and safe IPC-error recovery. Opening/refreshing consults inventory first, then the current session choice. Explicit selection and **Verificar modelo** query that choice. Neither query replaces it.
- Independent request epochs discard old replies/errors/finally callbacks after model change, inventory refresh, close or unmount. READY is removed before a fresh check; reopening has no cached readiness. The original bounded native query continues until settlement/deadline if its view closes.
- Retry retains keyboard focus with `aria-disabled` plus synchronous request guards. The selector describes its readiness status. The named, scrollable panel retains initial selector focus, X/Escape closure, trigger return and foreground-dialog precedence.

[ADR-016](../decisions/ADR-016-PRODUCTION-LOCAL-AI-PROVIDER.md) and [ADR-008](../decisions/ADR-008-EDITORIAL-AI-ORCHESTRATION-BOUNDARY.md) retain authority. The diagnostic never authorizes dispatch; Rust rechecks every generation. No native source/IPC modification, provider choice, dependency/lock, schema migration, cloud setting, model download/configuration or CI change occurred. No owner article, database, export, credentials or model file was inspected.

## Executed local verification

Environment: Windows checkout, existing dependencies and locked native baseline. The Next.js 16.3.4 local client-component/accessibility guides and the `inclusive-accessibility-review` skill were read for the affected interface.

| Check | Result and scope |
| --- | --- |
| `npm test -- __tests__/local-ai-readiness.test.ts` | **pass** — 49 native-bridge fixtures: nine states, browser/SSR rejection, exact/null arguments, malformed/oversized DTOs, inconsistent READY, mismatched model/alias and failure followed by retry. |
| `npm test` | **pass** — 338 tests / 27 files, including the existing inventory, SSR trigger order and AI/CMS tests. |
| `npx tsc --noEmit` | **pass** — typed client consumer; static build also completed its type check on the final executable source. |
| `npm run lint` | **pass** — existing `.eslintignore` migration warning retained; no production rule suppression. |
| `npm run build` | **pass** — static export compiled successfully. |
| Focused independent read-only review | **pass** in the inspected scope — current-choice handling during pending inventory, refresh/model/close/unmount invalidation, delayed finally and unchanged session ownership. No new material defect reported; review is not live reader/runtime testing. |
| Isolated compiled-component browser fixture | **pass** — 11 behavioral checks on the actual bundled component/context/bridge with controlled synthetic IPC; keyboard, stale responses/errors/finally, recovery, selection preservation, 320-pixel sample and teardown. Not real-daemon or reader evidence. |
| Three new owner desktop UI checks | **pass — owner-reported** on 2026-10-05: diagnostic, keyboard recheck with selection/focus retention, refresh and Escape/reopen behavior. See bounded acceptance below; no independent desktop trace was collected. |
| Broader desktop/NVDA/installed-daemon identity and pilot | **not-tested** in this UI round; earlier functional acceptance remains preserved. |
| New UI publication/CI | **pass** — separately authorized commit/push/dispatch, published UI source `34bf047781e63e2f55f82600b99cff9686204b82`, all four jobs of [CI #23 / run 37389383428](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37389383428) completed successfully. Applies to this UI revision, not later Increment 3 changes. |

Initial sandbox Vitest attempts failed on temporary-cache rename with zero tests; the explicitly permitted retries passed. The first sandbox Next build failed before configuration loading on Windows path canonicalization/access denied; the permitted retry passed. An initial effect-started synchronous state update failed the hooks lint rule; checks now start in user actions and valid inventory completion, avoiding a rule suppression. The existing future Vite native-config loader warning remains.

## Browser fixture observations

Executed through the existing bundled Playwright runtime and installed Chrome **154.0.8037.98**, in a temporary isolated headless profile. The fixture uses the actual component/context/bridge bundled with synthetic IPC promises and final static-build CSS, isolated from owner editorial storage and the real daemon. Its script/screenshots stay ignored under `.retranca-local/phase65-readiness-ui/`. Fixture names and states are invented test data, not offered production models. No real inference is performed; external requests were blocked. Browser and loopback server were closed after QA.

Observed checks:

1. First Tab/Enter opens the named settings trigger and focuses the selector. No selection shows instructions and sends no readiness IPC.
2. Select A then B; resolve A late. B keeps its pending state and choice; the old reply/finally cannot unlock the new check.
3. A rejected readiness IPC shows safe recovery. Enter retries without duplicate calls, retains focus and can display a valid report.
4. Close/reopen while checking; reject the old promise after a newer query starts. The new pending diagnostic/button guard is preserved, with fresh evidence required on reopening.
5. Refresh inventory while readiness is pending; settle old READY. The old result is ignored. If the latest inventory lacks the selected tag, the session choice remains and a native `MODEL_MISSING` report can be shown.
6. Inventory failure retains the session choice; a native `SERVER_UNREACHABLE` report remains recoverable.
7. A foreground native HTML dialog owns Escape and returns its own invoker focus, leaving settings open. The named settings X then closes and returns trigger focus.
8. Explicitly clearing selection shows instructions and sends no readiness IPC, including attempted retry activation.
9. At 320×568 CSS pixels, the panel bounds stay in the viewport without horizontal document overflow; wrapped text and the keyboard-focused retry remain visible. The local screenshot was visually inspected.
10. Without Tauri, inventory and readiness truthfully require the desktop application, make no native calls/fallback and preserve the prior choice. The local browser-error screenshot was visually inspected.
11. Unmount during pending readiness, then resolve its promise: the component stays removed and no browser runtime error occurs.

The initial browser launch attempts could not resolve a bundled Chromium/Edge installation; no browser was downloaded. QA then used the verified installed `C:\Program Files\Google\Chrome\Application\chrome.exe` with tool permission. Two initial harness observations required corrections to the fixture itself: await the React-rendered pending state before an assertion, and use keyboard activation for the teardown fixture button obscured by the intentionally floating panel. Final execution passed all 11 checks; these harness changes did not modify product code. This sample does not simulate NVDA speech, actual Tauri IPC, all viewport/zoom/contrast conditions or model execution.

Status markup follows [W3C guidance for status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html), and trigger expanded/control semantics follow the informational [APG disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/), consulted 2026-10-05. Polite atomic live-region markup allows notification without taking focus; actual NVDA speech is **not-tested**, and this is not a WCAG conformance claim.

## Owner AntiGravity handoff — only the new diagnostic

Keep the existing branch and local changes:

```powershell
cd C:\Users\RFERRAZ\Documents\retranca-editorial-os
git status --short --branch
npx tauri dev
```

If the bundled-model notice appears, close it and use the existing Ollama/model configuration. Do not download/update a model or change daemon settings for these checks.

1. Open **IA local**, choose one of your existing installed models and wait. Expect a diagnostic under **Disponibilidade de IA local** and a server version when available. A compatible model reports availability for text generation with local execution required in the request. If a blocked/error message appears, report its exact text; do not paste your article.
2. Tab to **Verificar modelo** and press Enter. Expect a checking message followed by a new result, with the same selected model and focus still on that button.
3. Use **Atualizar modelos**. Expect the same session choice and a fresh diagnostic after inventory refresh. From **Verificar modelo**, press Escape; expect settings to close and focus to return to **IA local**. Reopen and expect fresh verification, keeping the session choice.

Reply `1 OK; 2 OK; 3 OK`, or identify the failed step and its message. No new article, generation, CMS persistence or canceled-suggestion test is required for this handoff. These three checks do not replace a full delayed-response/error matrix, installed runtime identity/pilot, screen-reader/contrast/zoom evidence, packaging or licensing review.

## Owner acceptance — diagnostic, recheck and focus

On 2026-10-05 (America/Sao_Paulo), the owner replied **`1 OK; 2 OK; 3 OK`** to the exact three-check handoff above. Record the displayed diagnostic, keyboard recheck with unchanged selection/button focus, inventory refresh with retained choice, Escape/trigger focus return and fresh verification after reopening as owner-accepted desktop observations. Do not repeat these checks solely for confirmation.

No exact tag, server-version value, diagnostic text, native trace or new screen-reader result was supplied. This acceptance does not independently attest the daemon, certify inference quality/hardware, close the broader accessibility/pilot/installer gates or authorize Git publication. Existing 338 tests and 11 fixture observations remain separate evidence. Only documentation changed to record this report; no executable checks were repeated.

## Authorized local consolidation

After the three-check acceptance, the owner explicitly authorized the local Git commit of the **13 prepared UI-round files** on 2026-10-05: three frontend source/type files, one native-bridge test file and nine documentation files. Scope: readiness diagnostics/recovery, unchanged session choice/native authority, executed local checks, bounded owner acceptance and continuity records.

Commit message: `feat(phase-6.5): expose local AI readiness diagnostics`. The parent is published native implementation `d944a114f935cbab7222068c22fe22bc26f12fb1`; Git supplies the resulting commit identity after creation rather than embedding its own SHA here. No executable source changed after the recorded tests; later edits only record owner acceptance and authorization. Actual articles, database/configuration/model files and ignored local QA artifacts are outside the commit.

This authorization covers the local commit. UI push, manual CI dispatch, PR/merge, tag and release remain separate actions. The new revision's remote CI must be verified independently; previous native CI cannot certify it.

## Published UI and exact-source CI — 2026-10-05

The owner separately authorized the UI push and manual CI dispatch after local consolidation. Commit `34bf047781e63e2f55f82600b99cff9686204b82` (`feat(phase-6.5): expose local AI readiness diagnostics`) is synchronized with its remote feature branch. On the owner's successful-CI return, the GitHub API confirmed [CI #23 / run 37389383428](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37389383428) `completed / success` on that exact SHA and branch, with frontend, Rust Windows, Rust Ubuntu and the required Rust aggregate successful. Preserve this evidence and the accepted three desktop checks; do not rerun them solely for confirmation. Neither native nor UI Increment 2 is integrated into main.

The owner authorized subsequent development and confirmed the app was already closed. The [Increment 3 policy](../specifications/phase-6.5/PHASE-6.5-INCREMENT-3-PRODUCTION-PROVIDER-POLICY.md) records its separate source/validation boundary. Prior commit/push/CI authorizations do not cover this new increment or grant merge/release. Earlier authorization paragraphs above retain their historical checkpoint scope.

## Remaining gates

The three new diagnostic/retry/focus desktop checks are owner-accepted, and the published UI has passed exact-source CI above. New Increment 3 consolidation/publication/CI, PR/merge, tag and release require their own scope/authorization. Exact runtime/model identity and representative synthetic pilot remain separate from the earlier bounded generation acceptance. Real embedded engine, dependency maintenance, persisted preferences, attachments, code/runtime/model licensing and installed Windows/Linux packages remain separately specified work.
