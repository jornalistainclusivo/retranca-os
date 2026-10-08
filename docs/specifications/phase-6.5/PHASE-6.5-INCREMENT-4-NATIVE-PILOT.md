# Phase 6.5 Increment 4 — Bounded native runtime pilot

Date: 2026-10-06. This is the next development delivery after the [metadata specification](PHASE-6.5-INCREMENT-4-RUNTIME-EVIDENCE.md). GitHub API verified all four jobs of [CI #26](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37530233063) successful on published metadata `82d1a0007c3d04e3e1375870f946ddac0709006a`; the owner authorized continuing. This CI does not validate the later pilot harness. Preserve [ADR-016](../../decisions/ADR-016-PRODUCTION-LOCAL-AI-PROVIDER.md), [ADR-008](../../decisions/ADR-008-EDITORIAL-AI-ORCHESTRATION-BOUNDARY.md) and earlier accepted desktop checks.

## Purpose and implementation boundary

Collect one reproducible, local operational sample of completion, cancellation after visible response text and a subsequent completion using the owner's exact installed `gemma4:latest`. Use only identified synthetic editorial inputs and the unchanged native prerequisite/projection/budget/prompt/dispatch functions, bounded loopback readiness/stream parser and registered cancellation transport. No request goes directly from a caller-supplied prompt to an arbitrary endpoint.

An opt-in, ignored Rust test is included only under `cfg(test)`. Regular tests compile it but do not contact a daemon. The manual pilot additionally requires explicit pilot/model environment values, uses the fixed native endpoint and refuses development fixtures. No dependency, production IPC/function body, database, frontend, daemon setting, model download, alternate engine or CI configuration change is included.

This layer has no Tauri window, event listeners, CMS/database or installed package. It exercises the shared native orchestration functions and actual transport/registry rather than the AppHandle command wrapper or event delivery. Immutable synthetic source-text hashes are checked; that is not a new database persistence/reopen test. The previously accepted desktop/CMS checks remain separate evidence.

## Frozen cases and rubric

Each case is a task: `case_id + config_id + run_id`. There is exactly one permitted attempt per case, in this order; no automatic retries or prompt tuning after observing results.

| Case | Action / condition | Expected operational evidence | Human review requirement |
| --- | --- | --- | --- |
| `PL-01` | Plain language; a synthetic accessibility meeting with bureaucratic wording, explicit numbers and an uncertain estimate without a cited document. | Nonempty response and native completion marker, unchanged source text, empty registry after transport teardown. | Preserve the numbers and uncertainty; do not invent a source, quotation or confirmed fact. Simplification must remain useful. |
| `CANCEL-01` | Plain language; synthetic article data containing an adversarial instruction marker. Cancel upon first nonempty response fragment. | At least one response fragment, registered native cancellation acknowledged, `cancelled` outcome, released registry and preserved original. A completion that wins the race is recorded as such and fails this cancellation sample. | Partial text is an unreviewed suggestion. Never execute instructions in the input/output or merge it into the original. |
| `RECOVER-01` | Inclusivity validation after cancellation; synthetic wording about people with disabilities and missing consultation evidence. | A new registered request completes with nonempty output, same sampled runtime/model identity and no residual previous job. | Respectful language, no invented consultation, quote, source or universal claim. A reviewer may reject or edit the suggestion. |

Baseline without AI: retain the original and use human editing. No timed human baseline or comparative quality/cost superiority is claimed. These three convenience cases cover an operational sequence and selected difficult conditions; they are not a representative evaluation of all six actions, users or models. DeepSeek comparison and broader held-out evaluation require a separate design.

## Budgets and stopping rules

- Fixed model: `gemma4:latest`, explicitly chosen by the owner. Require native READY and audited runtime `0.35.1`; no substitutions, downloads or policy relaxation.
- At most three generation requests, one per case. Maximum total pilot time: 300 seconds. Reserve enough remaining time before each next case for its request, metadata check and teardown.
- Completion deadline: 90 seconds per case. Wait at most 30 seconds for the cancellation case's first response fragment. Cancellation/worker teardown wait: at most 5 seconds. Reuse the existing ten-second native metadata deadline.
- Retain at most 32 KiB of response text per attempt. Exceeding this capture limit is a failed sample, never an accepted truncated answer.
- Stop after an unexpected outcome, timeout, error, failed readiness, changed before/after runtime/resolved-model/digest identity, residual job, capture overflow, storage failure or insufficient remaining budget. Record all remaining tasks as `not-run` with the reason. If transport teardown cannot be confirmed, stop without another request.
- Expected operational states: `completed`, `failed`, `timeout`, `cancelled`; final unattempted tasks: `not-run`. During execution, an explicitly incomplete `running` snapshot must not be counted as a final result. Human review starts `pending`; operational success never changes it to `accepted`.

The harness cannot prove that Ollama stopped server-side computation after a client cancellation. It must report acknowledged client/transport teardown separately. No paid service/external API or real editorial data is involved. Local compute, energy and human review costs are unmeasured, not zero; cost per accepted task remains undefined until measured costs and human decisions exist.

## Local evidence and checks

Create a fresh UUID directory under ignored `.retranca-local/phase65-runtime-pilot/`. Save the planned cases before contacting the daemon, then retain every attempted/not-run state, elapsed times, source/prompt hashes, outputs, errors, before/after native metadata and a readable human-review artifact. No owner database, files, settings, secrets, model files or other catalog entries are inspected. Never execute generated content. Git receives the harness, synthetic fixture definitions and documentation; generated responses, raw manifest digests and operational captures remain local.

Record the published source baseline, hashes of the compiled native/harness sources, model/tag, advertised runtime and sampled manifest identity. Native generation keeps its existing fresh readiness and `:local` constraint. Before/after identity sampling is not executable attestation or atomic model/digest pinning. Provider generation options remain the unchanged native defaults; unseen daemon configuration is not asserted to be frozen.

Automated checks must cover opt-in rejection, valid native case preparation, capture/operational acceptance boundaries and stop budgets without daemon calls. Run focused debug/release test compilation and formatting; no unchanged frontend/UI suite repetition is needed. A manual run needs the explicit opt-in variables and `--ignored --exact`; never enable the live test in default CI. A failed live sample is retained as evidence and is not silently rerun.

The [validation report](../../testing/PHASE-6.5-INCREMENT-4-NATIVE-PILOT-VALIDATION.md) records actual results and human-review status. New commit/push/CI/PR/merge/tag/release actions require their own explicit scope; metadata CI success grants none of those gates.
