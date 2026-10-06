# Phase 6.5 Increments 2 and 3 — Source integration milestone

Date: 2026-10-05 (America/Sao_Paulo). Scope: the accepted native readiness, readiness diagnostic/recovery UI and normal-production provider policy. This is a source milestone, not completion of the whole Phase 6.5 or acceptance of distributable installers.

Resumed 2026-10-06 under the same explicit owner authorization. Live Git/GitHub confirmed the same main baseline and feature head, 30 prepared Increment 3 files, no open PR and no subsequent CI run. Do not interpret the overnight pause as revoking authorization or repeat accepted desktop tests solely for confirmation.

## Authorization and baseline

The owner reported all three Increment 3 desktop checks passing and explicitly requested the four proposed steps: document/consolidate, push/CI, prepare/review/merge the PR and create an appropriate milestone tag after checking version history. That instruction supplies the authorization for this bounded sequence. Do not infer installer release, dependency/migration changes, CI configuration changes or publication of private data from it.

The baseline is integrated `main` at `37b272c1ae048c5aa004211fd9d09178bd41709c`, preserving Phase 6.4 and accepted Increment 1. Increment 2 native `d944a114f935cbab7222068c22fe22bc26f12fb1` and UI `34bf047781e63e2f55f82600b99cff9686204b82` are published on `codex/phase-6.5-production-provider-contract`, with successful four-job [native CI](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37356369629) and [UI CI #23](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37389383428). Neither historical run validates the subsequent Increment 3 policy.

## Candidate and evidence boundaries

- Preserve the exact session model choice, Rust editorial authority, fresh per-generation readiness, cancellation and local editorial persistence.
- Normal builds support independently installed Ollama. Synthetic sidecar/provisioning require explicit debug fixtures; the default bundle omits that executable. The real embedded engine remains a preferred future delivery.
- Increment 3 local checks and owner acceptance are recorded in its [validation report](PHASE-6.5-INCREMENT-3-PRODUCTION-POLICY-VALIDATION.md). No executable code changes are planned during consolidation; documentation records acceptance, authority and the integration rationale.
- Review the combined diff before publication. Use only code, documentation and synthetic tests; private articles, database, images, exports, backups, models and ignored local QA files remain outside Git.
- Let the existing PR workflow validate the published candidate, requiring `frontend`, Rust Windows, Rust Ubuntu and the `rust` aggregate. Verify the PR head and successful checks immediately before merging; do not bypass protection or duplicate successful checks solely for confirmation.
- Use a merge commit to retain both accepted Increment 2 commits and the Increment 3 consolidation. Verify resulting main identity and its existing automatic CI before publishing the tag.

At preparation, GitHub protection requires successful `frontend` and `rust` checks with an up-to-date base, and administrator enforcement is enabled. The authorized sequence must respect those requirements. Commit, remote CI, merge and tag are established only by their resulting Git/GitHub records, not by this prepared checkpoint.

An independent bounded read-only static review of the combined Increments 2 and 3 found no actionable correctness/regression defect. It covered native readiness/DTO/bounds, repeated local constraints before generation, cancellation, sidecar/download guards, fixture configuration isolation, renderer/native parsing, stale-response/focus handling and associated tests. The reviewer ran no tests, performed no mutations and accessed no private editorial data. This is static review evidence, not a new security audit, installer acceptance or proof of absence of defects.

## Milestone tag rationale

All seven live GitHub tags were inspected. History includes `v1.0.0-main` and `v1.1.0-main`, then `v0.6.0-phase6-provisioning` / `v0.6.1-phase6-hardening`, and later `v0.1.0-phase-6.2-developer-runtime` / `v0.1.0-phase-6.3-editorial-ai-orchestration`. These names do not form a single chronological artifact-version sequence. The npm, Cargo and Tauri application manifests still declare `0.1.0`; this milestone does not change them.

Chosen technical marker: **`milestone-phase-6.5-increments-2-3`**. Its name explicitly limits the scope, avoids claiming a new artifact SemVer or full-phase completion and does not replace any historical tag. Recheck that it is absent immediately before creation. Create an annotated tag on the reviewed, integrated main merge SHA after successful CI; include the PR, source SHA, CI evidence, accepted desktop checks and outstanding distribution gates in its annotation. Push only this tag, without force or moving existing refs. No GitHub Release or installer assets are included.

## Next development / distribution gates

Continue on a new branch from the integrated baseline. Plan exact runtime/model identity and a representative synthetic actual-daemon pilot, installed Windows/Linux startup/persistence/inference/cancel/recovery, relevant accessibility including NVDA/zoom/contrast, and code/runtime/model licensing. Article-only JSON export is not full backup/restore. Remaining dependency maintenance retains its separate scope. The embedded engine needs its own real-engine/protocol/model-binding decision and acceptance. Preserve accepted desktop scripts instead of asking for repetition without a new change.
