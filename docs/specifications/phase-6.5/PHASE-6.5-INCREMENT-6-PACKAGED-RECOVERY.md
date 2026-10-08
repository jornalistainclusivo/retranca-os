# Phase 6.5 Increment 6 — Packaged cancellation and recovery

Date: 2026-10-08 (America/Sao_Paulo). Status: corrected candidate prepared and all three bounded installed recovery checks accepted by owner report on 2026-10-08; broader accessibility remains pending. This document defines the installed Windows handoff; it does not accept the complete production-experience draft or a public release.

## Baseline and decision

[PR #8](https://github.com/jornalistainclusivo/retranca-os/pull/8) integrated Increments 4–5 and the dependency consolidation into main as `0d2be58344323fb022942b8190465859651fac12`. Authenticated GitHub API confirmed all four jobs of [main CI #34](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37785724612) succeeded on that exact merge SHA. Start this increment on `codex/phase-6.5-packaged-recovery` from this main, in a separate managed worktree; preserve the owner's original checkout and retained pilot branch.

The next evidence gap is installed WebView/IPC cancellation, recovery and focus. Preserve both accepted Increment 5 Windows checkpoints and the accepted Increment 4 native/model sample. A new package is warranted because the accepted corrective installer predates the integrated dependency maintenance; source integration does not update an installed executable. This is a focused operational handoff, not a repetition of the original three startup checks or another model comparison.

No new architectural decision is required: [ADR-008](../../decisions/ADR-008-EDITORIAL-AI-ORCHESTRATION-BOUNDARY.md) retains native prompt/event authority; [ADR-014](../../decisions/ADR-014-ARTICLE-CMS-CONTENT-PERSISTENCE.md) retains article-owned saved analysis; [ADR-016](../../decisions/ADR-016-PRODUCTION-LOCAL-AI-PROVIDER.md) retains external local Ollama for the first delivery and the preferred future embedded engine. Keep [ADR-017](../../decisions/ADR-017-OPEN-EDITORIAL-STARTUP-AND-CATEGORY-CUSTOMIZATION.md) startup/customization and the dated residual findings in [ADR-018](../../decisions/ADR-018-DEPENDENCY-SECURITY-MAINTENANCE.md). The compatibility correction below amends the exact supported-version set in ADR-016; it does not change the provider architecture. No engine, schema, dependency, application identity, version or CI contract change is included.

## Runtime prerequisite correction — 2026-10-08

The first integrated candidate retained the server `0.35.1` gate and blocked the owner's updated Ollama before these checks could begin. The owner reported interim `0.40.0`, then confirmed final `0.40.1` and authorized resumption. The displayed server version comes from `/api/version`, not an application setting changed by Retranca.

The bounded [ADR-016 amendment](../../decisions/ADR-016-PRODUCTION-LOCAL-AI-PROVIDER.md#compatibility-amendment--2026-10-08) and updated [native contract](PHASE-6.5-INCREMENT-2-PROVIDER-READINESS.md) add exactly `0.40.1` to Rust and renderer validation, preserving `0.35.1` and local-only dispatch checks. Pinned upstream paths were reviewed; the actual native metadata probe reports READY without submitting content. The rebuilt candidate supersedes the initial candidate for this handoff. Earlier accepted results retain their original scope; the owner subsequently reported these three recovery checks passed on the corrected candidate (`1 OK; 2 OK; 3 OK`, 2026-10-08). The validation record retains the bounded report and untested broader accessibility.

## Existing behavior to verify

| Boundary | Expected installed behavior | Existing implementation |
| --- | --- | --- |
| Cancel an active generation | The request reaches one terminal state, canceled-job fragments stop updating the view, actions recover and the original article text stays unchanged. Completion may legitimately win a cancellation race. | `components/ArticleModal.tsx`, `lib/adapters/aiJobSession.ts`, `src-tauri/src/ollama_gateway.rs` |
| Cancel while preparing / close the modal | A disposed session cannot start later; late subscriptions and obsolete job events cannot update the reopened modal. Closing requests cancellation of its registered client task. | `AiJobSession.listen/start/dispose`, article session cleanup and job ID checks |
| Cancellation failure | A visible, announced retryable error remains; an IPC failure is not represented as successful cancellation. | Article cancellation error and existing session retry behavior |
| Save and reopen | Saved `analysisContent` belongs to the same article. Generated suggestions are temporary; they are not automatically written into CMS content or persisted as AI drafts. | Article save payload/session and ADR-014 |
| Keyboard and modal focus | Cancel can be reached/activated by keyboard. On its removal, focus reaches the analysis input if cancel held focus. Escape closes the modal and returns focus to its invoker. | `lib/hooks/useModalDialog.ts`, `data-ai-cancel` / `data-ai-retry` |

Cancellation acknowledges teardown of the registered client HTTP task. It does not prove that Ollama server/GPU computation stopped, unload a model or shut down the daemon. A UI observation cannot establish process or model attestation. A retained partial suggestion may remain visible until the next generation or close; its absence after reopening is expected, not lost saved article content.

## Candidate preparation

Reuse the reviewed [Increment 5 packaging contract](PHASE-6.5-INCREMENT-5-PACKAGED-PILOT.md) and fixed `scripts/packaging/build-local-pilot.mjs` helper. Install only the existing lock in the isolated worktree, use explicit Node 24 for this local build, check configuration, then compile a new locked release/unsigned current-user NSIS candidate. Keep the existing distinct pilot product, identifier and version `0.1.0`; a validation build does not need another tag.

Retain a fresh UUID receipt, baseline SHA plus pending source-patch identity, executable/installer hashes and sizes, build results and warning boundaries. The compatibility follow-up changes native readiness and renderer validation, with regression fixtures. Verify configuration/helper/manifests/locks match main and capture the exact changed source file hashes used for the build. Raw logs/binaries and owner data stay local and ignored. The agent does not launch the installer, read an editorial database or perform new model inference.

## Owner handoff — three focused checks

Use the exact new candidate in the [validation record](../../testing/PHASE-6.5-INCREMENT-6-PACKAGED-RECOVERY-VALIDATION.md). Save any open work and close the pilot before manually updating it. Open the installed pilot's shortcut outside the repository, without `npx tauri dev`. Keep the existing Ollama installation and select the real installed `gemma4:latest`; if it is absent, report that prerequisite rather than download or substitute a model. Before the three checks, use **Verificar modelo** and confirm readiness on server `0.40.1`; report a blocked diagnostic without counting it as a recovery-test outcome.

Create a synthetic article, or reuse an existing synthetic test article after checking it contains no real editorial material. Choose any active stage/category already available; fill only these relevant fields and save before starting AI:

| Field | Value |
| --- | --- |
| Title | `TESTE CANCELAMENTO 6.5` |
| Summary | `Exercício fictício para verificar cancelamento e recuperação da IA local.` |
| Objective | `Verificar que cancelar a IA não altera o texto salvo da pauta.` |
| Content for analysis | `EXERCÍCIO SINTÉTICO. Em uma reunião fictícia, 12 pessoas avaliaram duas propostas para organizar uma biblioteca. A primeira proposta prevê ampliar os horários. A segunda prevê melhorar a sinalização. Nenhuma proposta foi aprovada. A decisão final ainda está pendente. Uma nova reunião será marcada após a análise dos custos.` |

| Check | Procedure | Pass condition |
| --- | --- | --- |
| 1 — Cancel and preserve | Reopen the saved article, start **Simplificar Linguagem**, reach **Cancelar geração** using Tab and activate with Enter while it is generating. Prefer canceling after the first fragment. Observe for five seconds after the terminal message. | Cancellation is reported, no further canceled-job fragments appear, AI actions recover, focus returns to **Conteúdo para análise** when cancel was focused, and the source field remains exactly the saved original. |
| 2 — Recover a new generation | In the same modal, run **Simplificar Linguagem** again and allow completion. | A fresh suggestion completes without mixed/old fragments or permanent busy state. The source field remains unchanged; the suggestion can be read/copied. This is an operational check, not a new broad model-quality evaluation. |
| 3 — Close, reopen and restart | Start one more generation, then press Escape while it is pending. Reopen the same saved article; check focus return on close and absence of continuing old updates. Run a final fresh generation to verify the reopened modal can recover. Save the unchanged article, close the pilot normally and reopen from its shortcut. Reselect the same model if necessary. | Closing returns focus to the invoker. The reopened modal accepts a fresh generation without receiving the old stream. On application restart, the synthetic title/content remain saved with that article. A previous AI suggestion need not persist; session model choice need not persist. |

Bound the sample to four planned generations and at most one conditional extra attempt if a completed response wins the cancel/close race. A completed race does not count as a cancellation pass. If cancellation remains pending for 30 seconds, or a generation has no usable outcome after 120 seconds, stop and report the observed state instead of repeating indefinitely. These are pilot observation limits, not implemented timeout or performance promises. No other AI action, benchmark, model download, daemon shutdown or private input is requested. If a saved original disappears, stop without further edits and report the synthetic case.

Reply `1 OK; 2 OK; 3 OK`, or identify the failed check and observed message. A save/close confirmation protects drafts; it is not functional acceptance. Keep detailed timing, reader/version and window observations local if collected; no screenshot of private content is needed.

## Manual accessibility follow-up

The functional checks include relevant keyboard/focus observations. Broader manual accessibility is a separately reported sample on this same candidate: run the CMS/AI journey with NVDA on Windows, record actual versions, verify control names and waiting/canceled/completed/error announcements, then inspect zoom/reflow, visible focus, contrast and reduced motion in pertinent states. An unavailable reader or untriggered error is `not-tested`, not pass. Do not ask the owner to shut down or reconfigure Ollama to fabricate a failure; reproduce such errors first with isolated fixtures if a correction becomes necessary.

Use `pass`, `fail`, `not-tested`, `not-applicable` with justification, and `needs-review` per observation. The [W3C modal dialog guidance](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) informs Escape/focus behavior; [status-message guidance](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) explains programmatically determinable announcements. Both references were checked on 2026-10-08; they do not certify this package. Keep WCAG 2.2 AA as the project target, without claiming conformance from source, CI or a small manual sample.

## Completion and remaining gates

This increment closes only when its exact package, bounded owner outcomes and applicable accessibility observations are recorded or explicitly left untested. Correct any reproduced defect through the smallest scoped source change, meaningful regression checks and a fresh affected candidate. Do not repeat passed source suites without a new change or concrete concern.

Commit, push, manual CI, PR integration, tag and release remain separately authorized actions. Installed Linux, absent-runtime/clean-machine behavior, full backup/restore, project/runtime/model licensing, residual dependency findings, signing, installer update/uninstall/recovery and public distribution remain outside this Windows sample. Article-only JSON export remains distinct from a full backup. The preferred embedded engine and attachment utilities stay in their separate architecture/discovery queues.
