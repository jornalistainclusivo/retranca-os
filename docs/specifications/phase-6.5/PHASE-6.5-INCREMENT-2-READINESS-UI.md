# Phase 6.5 Increment 2 — Local AI readiness UI

Date: 2026-10-05. Scope: the renderer consumer of the implemented [native contract](PHASE-6.5-INCREMENT-2-PROVIDER-READINESS.md). The owner authorized the next development step after successful [native-source CI 37356369629](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37356369629) on `d944a114f935cbab7222068c22fe22bc26f12fb1` and confirmed the application was already closed before editing. Local UI verification and human acceptance are recorded separately in the [UI validation report](../../testing/PHASE-6.5-INCREMENT-2-UI-VALIDATION.md).

## Authority and preservation

[ADR-016](../../decisions/ADR-016-PRODUCTION-LOCAL-AI-PROVIDER.md) and [ADR-008](../../decisions/ADR-008-EDITORIAL-AI-ORCHESTRATION-BOUNDARY.md) remain unchanged in authority. This consumer shows a diagnostic, never grants permission to dispatch. Rust repeats the metadata/local-request check before every Ollama generation. Preserve accepted [Increment 1](PHASE-6.5-INCREMENT-1-MODEL-INVENTORY.md), the owner's three native functional observations, exact session model choice, editable CMS and temporary AI suggestions.

No new engine, dependency, schema/preference migration, model installation/download, cloud setting, attachment support, native contract or workflow change is included. Existing model tags are selected by the person; synthetic fixture names are only test inputs.

## Behavior and recovery

| ID | Requirement |
| --- | --- |
| UI-65.2-001 | Opening settings refreshes inventory. After it settles, inspect the current selected tag; no selection displays an instruction without a readiness IPC. Inspect again after an explicit selection change or inventory refresh. |
| UI-65.2-002 | Use only `get_local_ai_readiness({model})` through a desktop-only bridge. Send no article/context/endpoint. Validate the unknown DTO and return only its public fields; malformed, mismatched or inconsistent READY reports are errors. No direct HTTP from the renderer. |
| UI-65.2-003 | Display pending, native final-state messages and safe recoverable IPC errors. Report the server version when available. READY describes a local-request constraint, not quality, hardware sufficiency, successful inference, process attestation or immutable model identity. |
| UI-65.2-004 | **Verificar modelo** retries the current choice. Retain keyboard focus with `aria-disabled` plus a synchronous guard while the check or inventory query is pending. **Atualizar modelos** remains independently available during readiness, invalidates its old result and rechecks after inventory settles. |
| UI-65.2-005 | Selection change, refresh, close and unmount invalidate pending diagnostics immediately. Old responses/errors/finally callbacks cannot replace a newer view or unlock a newer pending request. Reopening requires fresh evidence. Closing discards results, not the underlying bounded Rust request; no new query-cancel IPC is added. |
| UI-65.2-006 | Diagnostics never call `setSelectedModel`. Preserve the requested tag even if missing, rejected or resolved through the retained native `:latest` alias. Inventory errors do not erase it. Clearing the choice requires the explicit selector action. |
| UI-65.2-007 | Preserve select focus on opening, named X/Escape closure, trigger focus return and foreground-dialog precedence. Native asynchronous results do not move focus. Associate the selector with the readiness status, use polite atomic announcements and keep all controls reachable in a bounded, scrollable panel on small viewports. |

## Bridge validation

`types/localAiReadiness.ts` mirrors the native DTO, separate from model provisioning and generation states. `lib/api/localAiReadiness.ts` rejects unsupported environments before loading Tauri, uses `invoke<unknown>` and copies only public DTO fields. Native rejection remains an error, rendered with a fixed recovery message rather than arbitrary exception details.

Known enum/evidence values, nullable scalars, bounded names/version/message/capabilities and hexadecimal digest shape are checked. A reported model must match the requested tag; invalid input may be redacted by native `INVALID_MODEL`. A resolved tag must equal the request or its retained `:latest` alias. READY additionally requires audited server `0.35.1`, digest, resolved model, textual completion and `LOCAL_REQUEST_ENFORCED`. All blocked states require `UNKNOWN`. These consistency checks consume the Rust report; they are not an independent provenance check.

The renderer owns loading/view state and independent readiness/inventory request epochs. Checks start from explicit selection/retry actions or the current inventory query's completion; even immediately settled refreshes trigger a new diagnostic. A current-choice reference covers selection changes during inventory loading. The session choice is never replaced by `resolved_model`, and a prior READY result is removed before a new check.

## Verification and handoff

1. Native-bridge unit fixtures cover nine states, SSR/browser rejection, exact/null IPC arguments, bounds, unknown/malformed DTOs, contradictory readiness, selection/alias preservation and failure/retry. No fixture is a real owner model.
2. Exercise the actual compiled component with controlled synthetic IPC promises: A→B and delayed A, close/reopen and delayed old completion/error/finally, refresh during checking, repeat activation, missing choice and recovery. State whether these are isolated fixture observations or real-desktop evidence.
3. Exercise keyboard opening/retry/X/Escape/focus, a foreground native HTML dialog and small-viewport overflow. Real NVDA/Tauri/runtime behavior and broader accessibility remain separate; do not infer reader announcements from markup alone.
4. Run existing frontend tests, types, lint and static build. No Rust code is changed, so previously verified native CI remains the baseline and does not cover this new UI source. Record new published-source CI only after authorized commit/push/dispatch.

The owner handoff asks only for new diagnostic/retry/focus checks, not a repeat of the accepted six AI actions, cancellation or CMS persistence. If something fails, request the displayed readiness message rather than private article content.

The owner subsequently reported **`1 OK; 2 OK; 3 OK`** on 2026-10-05 for this bounded desktop handoff. The [UI validation report](../../testing/PHASE-6.5-INCREMENT-2-UI-VALIDATION.md#owner-acceptance--diagnostic-recheck-and-focus) records the accepted observations and unsupplied runtime/reader evidence. Preserve that acceptance. The owner subsequently authorized push/manual CI separately; published UI `34bf047781e63e2f55f82600b99cff9686204b82` passed all four jobs of [CI #23 / run 37389383428](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37389383428). Broader pilot/distribution and later increment publication remain separate.
