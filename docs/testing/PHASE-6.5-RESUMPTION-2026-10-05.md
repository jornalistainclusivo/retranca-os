# Phase 6.5 resumption — 2026-10-05

Initial preparation status: integrated baseline verified; new branch created; first provider direction accepted, future embedded-engine preference recorded; technical readiness proposal prepared. Application behavior was unchanged at that preparatory checkpoint. The subsequent authorized native implementation is recorded separately in the [Increment 2 validation](PHASE-6.5-INCREMENT-2-NATIVE-VALIDATION.md); its current limits supersede this document's preparatory next-step wording.

## Verified current checkpoint

- [PR #5](https://github.com/jornalistainclusivo/retranca-os/pull/5) is closed/merged, with merge commit `37b272c1ae048c5aa004211fd9d09178bd41709c`. GitHub's current `main` and fetched `origin/main` point to that commit.
- [Main CI 37248233721](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37248233721) completed successfully on that exact merge SHA. Individual jobs `frontend`, `rust (windows-latest)`, `rust (ubuntu-latest)` and required aggregate `rust` all returned `success`.
- The old checkout was clean on `feat/phase-6.4-pro-workflow-customization` at `cdc7a43`. Created `codex/phase-6.5-production-provider-contract` from fetched `origin/main`, with no upstream to the main branch and no reset/history rewrite. The existing branch remains intact.
- The accepted Increment 1 implementation `32e64a56084a5d42cef3275e00195c3262563e86` and final feature HEAD `cdc7a43` are ancestors of the merge. The merge tree matches the final feature tree; preserve refresh/retry, exact tags, session selection and keyboard/focus behavior.
- `ollama --version` reported CLI 0.35.1 and a warning that it could not connect to a running instance. This is a narrow observation, not a supported-version declaration or proof of absent models. No runtime was started and no inventory/model file, owner article, database, backup or credential was inspected.

The owner-approved [6.4 closure](PHASE-6.4-CLOSURE-2026-10-04.md) accepted **bounded source integration**. Broad accessibility, affected-package maintenance, installed engine/model behavior, installers and distribution remain open. Do not reopen accepted 6.4 functional checks or describe limited Gate B closure as release readiness. Audit counts in prior documents are dated snapshots; no fresh vulnerability inventory was executed in this round.

## Next bounded increment

Follow the [production-experience plan](../architecture/PHASE-6.5-PRODUCTION-EXPERIENCE-PLAN.md), starting with the provider contract. The owner accepted external local Ollama for the first production path, with the explicit condition that an embedded engine remains the preferred future delivery. [ADR-016](../decisions/ADR-016-PRODUCTION-LOCAL-AI-PROVIDER.md) records this bounded direction and its relationship to ADR-007. [Increment 2](../specifications/phase-6.5/PHASE-6.5-INCREMENT-2-PROVIDER-READINESS.md) proposes readiness/provenance/capability requirements and their matrix; those technical mechanisms are not implemented or validated by the provider choice.

The independent read-only continuity review agrees that provider/technical-contract preparation comes before engine binding or selection persistence. Its document check found two factual inconsistencies, corrected before delivery: current native inventory validation also accepts an implicit `:latest` alias, and the README roadmap still described 6.4 integration as pending. Historical Gate B statements in the plan and Increment 1 documents are superseded by the bounded closure above; original test and owner-acceptance evidence remains historical and preserved.

The owner additionally reports better informal experience with the Gemma 4 model currently used and DeepSeek. Record both as preferred pilot candidates, without a measured comparative-performance claim, automatic model selection or download. The exact DeepSeek tag and current installed identities remain unverified; the earlier Gemma handoff used `gemma4:latest`. No model capability or provenance is inferred from these family names.

## Verification and delivery boundary

Only documentation changed, with nothing staged. Branch/base identity, Increment 1/final-feature ancestry, equal merged/final-feature trees, local links and `git diff --check` passed. Initial sandbox Git reads failed with `must be run in a work tree`; permitted retries outside the sandbox passed. Existing LF/CRLF conversion notices are retained. Do not rerun the accepted application suite for documentation alone. The last actual merged application has the successful CI recorded above; no new local runtime tests, native inference, model download or installer execution are claimed.

No commit, push, PR, CI dispatch, merge, tag or release is included in this preparation. The provider direction is now accepted; the next work is the supported native technical contract and a new numbered desktop handoff only when behavior changes.

## AntiGravity

```powershell
cd C:\Users\RFERRAZ\Documents\retranca-editorial-os
git branch --show-current
git status --short --branch
```

Expect `codex/phase-6.5-production-provider-contract` and pending documentation edits. Do not use Sync Changes until publication of this new branch is authorized. The existing interface may be opened with `npx tauri dev`; this preparation adds no new UI behavior to test.
