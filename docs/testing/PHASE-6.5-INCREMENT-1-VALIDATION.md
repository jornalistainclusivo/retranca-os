# Phase 6.5 — Increment 1 validation and desktop handoff

Date: 2026-10-03. Scope: local model inventory refresh/retry under the [increment specification](../specifications/phase-6.5/PHASE-6.5-INCREMENT-1-MODEL-INVENTORY.md). Implementer observations, owner acceptance and remote CI are distinct evidence.

## Entry and resulting behavior

The owner accepted the preceding settings X/Escape desktop checks and confirmed saving/closing the application before this increment. The API verified successful [CI 37080317950](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37080317950) on previous source `08218bf6c05d510904686d3a89c56d7bfe8826ae`: frontend, Rust Windows, Rust Linux and the required aggregate. The Node 20 Action-runtime warning and Ubuntu runner migration notice are separate maintenance items; workflows remain unchanged.

Local settings now exposes **Atualizar modelos**, querying the existing `get_ollama_models` native command. Loading, count, empty inventory and recoverable failure have readable messages. Query failure clears the displayed inventory; the selected model remains in session state and receives a warning if absent from the latest list. Only an explicit selector action changes that choice. No selection, installation, pull, download or inference occurs during refresh.

The refresh button uses `aria-disabled` plus a synchronous in-flight guard, retaining keyboard focus while preventing repeat activation during loading. Opening initiates the query from the user action and focuses the selector after rendering. Closing/unmounting invalidates the request epoch; stale results cannot update a closed or newer view. The underlying native HTTP query is not cancelled by closing settings and retains its existing timeout.

## Executed local checks

| Check | Result and boundary |
| --- | --- |
| `npm test` | **287 tests / 26 files passed**, including 13 new inventory-boundary cases. Exact native command, SSR/browser rejection without IPC, duplicate/exact tags, empty/malformed/oversized payloads and failure followed by retry use synthetic fixtures. |
| `npm run lint` | Passed on final source; the existing `.eslintignore` migration warning remains. No rule suppression was added. |
| `npx tsc --noEmit` | Passed; final static build also completed its TypeScript check. |
| `npm run build` | Passed on final source, generating the static application export. |
| Isolated compiled browser | Passed the keyboard and error/retry sample below. This environment has no Tauri IPC and cannot prove native inventory success. |
| `ollama list` | Read-only local CLI inventory included the existing `gemma4:latest`. This confirms a tag exists, not the new desktop UI, inference capability, vision support or packaged acceptance. |

The first sandbox test attempt failed before loading tests because Windows denied Vitest cache renames; the first sandbox build failed on compiler path canonicalization with access denied. Both were rerun with explicit tool approval outside the sandbox and passed. Vitest also emits an existing future-native-config warning; no dependency/toolchain configuration was changed.

Browser sample used only built-in example articles at a dedicated loopback static server, with no fake Tauri/model inventory:

- After dismissing the startup notice, first Tab reached **Configuração de IA local**; Enter opened settings and focused **Modelo Ollama**.
- Tab reached **Atualizar modelos**; Enter retried and preserved focus. The status truthfully required the desktop application, and the selector contained only its placeholder.
- Escape from refresh and Enter on the named X closed settings and returned focus to the trigger. Reopening performed a new query and displayed the recoverable browser error again.
- With settings open, the IA Assistant foreground dialog owned Escape; only that dialog closed, its invoker received focus, and settings remained open.
- The final screenshot is local/ignored at `.retranca-local/local-ai-model-refresh.png`; the functional test tab and loopback server were stopped after QA. No owner editorial database/export/credentials were read or published.

## Current AntiGravity check — only this increment

Run in the existing feature checkout:

```powershell
cd C:\Users\RFERRAZ\Documents\retranca-editorial-os
git status --short --branch
npx tauri dev
```

If the bundled-model notice appears, close it to use your current Ollama setup. Do not download a model for these checks.

1. Open **IA local** and choose your existing `gemma4:latest` if it is not already selected. Use **Atualizar modelos**. Expect the real installed list, a model count and the same selected model after completion.
2. Navigate from the selector with Tab to **Atualizar modelos**, then press Enter. Expect a new query, readable status and focus remaining on that button; the choice must not change.
3. Close settings and reopen it **without restarting the application**. Expect the same model choice and a fresh list. If a query fails during normal use, the same refresh control should permit another attempt without reopening.

The owner reported **`1 ok; 2 ok; 3 ok`** on 2026-10-03 for this exact handoff. Record installed-inventory refresh/choice retention, keyboard refresh/focus and close/reopen session retention as owner-accepted desktop checks; no repetition is requested. The agent did not independently inspect the owner desktop or obtain native traces. This report does not establish preference persistence after restarting, delayed native races, empty/error recovery in the desktop, NVDA or packaged acceptance.

## Publication and remaining gates

The owner's existing autonomy covers source/documentation consolidation, publication and the existing manual CI. Implementation `32e64a56084a5d42cef3275e00195c3262563e86` was published on the existing feature branch. On the owner's acceptance return, a single result lookup verified [CI 37141777120](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37141777120) as `completed / success` on that exact SHA, updated `2026-10-03T18:02:36Z`. Its frontend, Rust Windows, Rust Linux and stable required Rust aggregate jobs all passed. This is verified remote evidence for the implementation commit, separate from owner acceptance and later documentation-only commits. No continuous monitoring or workflow change was performed.

This acknowledgement only updates documentation; it does not introduce executable changes or new test results. Before integration, any required checks must cover the actual PR HEAD. The next handoff is the remaining accessibility/NVDA evidence and independent Gate B, followed by the reviewed production-provider/model contract in the draft below; no new engine or release is authorized by these three checks.

No native source/DTO, database migration, provider routing, engine, dependency or CI configuration changed. Native tests were not rerun locally for this UI-only increment. Delayed native-response/close/reopen races were reviewed in source, not exercised in a live desktop test. NVDA/status announcements, broader reflow/contrast/zoom and complete Phase 6.4 accessibility/Gate B remain open. This is not a WCAG conformance claim or production/release acceptance. The [production-experience draft](../architecture/PHASE-6.5-PRODUCTION-EXPERIENCE-PLAN.md) retains engine/provenance/capability/persisted-preference/packaging decisions and human merge/release Gates C/D.
