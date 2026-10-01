# Phase 6.4 — Article Content Review Follow-up

Date: 2026-10-01 (America/Sao_Paulo). Status: targeted fixes validated locally; the owner subsequently authorized a local consolidation commit of the 32 prepared files. Publication remains separately controlled. Full independent Gate B and broader Slice 8 acceptance remain open.

## Outcome and owner acceptance

The owner reported `1 OK; 2 OK; 3 OK` for the original article isolation/save/restart script and authorized continued development. Preserve that acceptance without reinterpreting the earlier application-close response as a test or migration approval. [ADR-014](../decisions/ADR-014-ARTICLE-CMS-CONTENT-PERSISTENCE.md) and the [content validation report](PHASE-6.4-ARTICLE-CONTENT-VALIDATION.md) retain the implementation/recovery contract and actual native test results.

The subsequent corrective review found two independent, low-severity local modal-render failures from externally supplied JSON. The author of the file controls the data; a victim must deliberately import and open the article. No execution of code, exfiltration, cross-user access, prototype pollution, native process termination or broad persistent outage was demonstrated.

| Finding on the reviewed snapshot | Evidence | Targeted correction and verification |
| --- | --- | --- |
| `candidate-9ee1edc37b28702e`, reserved article ID | `constructor`, `toString` and `__proto__` selected inherited values from a plain visual-description object; the text evaluator threw. | Visual drafts now use `Map`. Three real-modal markup regressions verify safe opening and unavailable alt-text without description. |
| `candidate-503251b56364e555`, nonstring `analysisContent` | Number/boolean/object content survived array-only JSON parsing and reached the text evaluator. | Import rejects nonstring/non-null content before replacing storage; the modal tolerates existing malformed values as empty evidence. Four invalid-input storage regressions preserve the prior article set; normal/legacy import and three real-modal regressions pass. |

A separate correctness issue concerned old save completion closing a newer dialog. Save callbacks now use the dialog session's abort signal. Closing or switching suppresses old success/error/settled callbacks; form editing is disabled during saving. The signal does not cancel a database write or restore previous content. Six deferred-write tests cover successful/failed current saves, late success/failure, already closed sessions and an old failure after a new session succeeds. These are callback-level tests, not a real desktop driver-delay experiment.

## Review provenance and limits

Codex Security diff scan `a2b40ebb-5950-4a61-b3ab-8b7c5e719f67` targeted the frozen local patch against `543d03333414698d9aa4d9976aabf4080e21bbc2`, digest `codex-security-snapshot/v1:sha256:af28e8077136283b5595272346b9d1e08b7793470d20cdb0629961fe6bc3965e`. It was sealed once with two low-severity findings. The fixes above were applied afterward; the original sealed result was not rewritten or represented as a scan of the final source.

The reviewer and parent inspected all sixteen authoritative changed source paths and the supporting native integration test. Frontend discovery used an independent worker. The assigned native/database worker could not read a retained artifact and completed no source review; the parent reviewed those paths directly. Do not claim an independent native security pass. The original modal was reproduced through seven isolated SSR assertions, with normal and legacy negative controls; no owner database, native application, provider or network was used.

**Canonical coverage limitation:** after sealing, the plugin returned `coverage.completeness = partial` and retained the earlier `assigned-diff-reviews` checkpoint deferral even though seventeen final surfaces have review receipts. Preserve that returned status. No post-seal artifact edit or second scan was performed to remove it. This scan is supporting evidence, not a complete independent Gate B sign-off. The indexed `sourceExcerpt` is from the baseline; the retained `codeEvidence` and reproduction concern the frozen working-tree patch.

Canonical artifacts remain in the local Codex Security workbench under the scan ID. The directory is machine-specific and is not a repository dependency. Contributor-facing reproduction and regression coverage live in the source tests; receipts/source snippets remain in the sealed scan.

The plugin recorded aggregated rollout usage across two threads: 10,592,124 input tokens, including 10,154,240 cached input tokens; 53,206 output tokens, including 21,562 reasoning output tokens; total 10,645,330. This is the tool's token metric, not a billing amount, credit estimate or promise of remaining quota. The one-time entitlement check reported Daybreak unavailable; that advisory did not establish a code finding or stop the local review.

## Final executed verification

- `npm test`: 236 tests passed, 20 files.
- `npm run lint`, `npx tsc --noEmit`, `npm run build`: passed after the fixes.
- Native source unchanged after the executed Windows debug/release suites: 106 tests in each profile, documented in the content validation report. No unnecessary native recompilation or owner database startup was requested.
- No new production dependency, CI/authentication change, actual database migration/restore, push, PR, merge, tag or release was performed. No commit was created during validation; the owner subsequently authorized local consolidation of this prepared checkpoint.

The owner's original three checks remain accepted. This follow-up adds automated edge-case coverage; it does not silently establish desktop latency/error handling, NVDA or production packaging acceptance.

## Existing acceptance boundaries and next handoff

The Header JSON import currently replaces browser storage and interface state without persisting the imported collection into desktop SQLite (`components/Header.tsx` -> `updateArticlesState(updated)` without a saved-article mutation). Carrying `analysisContent` in the JSON representation is not native backup restoration. Treat import persistence/restore semantics as separately scoped work.

Production SIDECAR resolution also needs acceptance: the bundle declares `bin/llama-sidecar`, while the existing supervisor uses `Command::new("llama-sidecar")`. That mismatch is a source-backed packaging gap; no attacker control of PATH was established. A successful build does not prove the packaged executable is found or inference succeeds.

The owner subsequently explicitly authorized the local commit of the 32 prepared corrective/documentation files. This authorization is recorded in the consolidation checkpoint; obtain its revision with `git log -1 --oneline`. Push requires its own approval. Continue the [Slice 8 acceptance plan](PHASE-6.4-SLICE-8-ACCEPTANCE-CLOSURE-PLAN.md): six actions using the actual installed model tag, remaining desktop accessibility/error checks, packaged-runtime scope and full independent review. Image/text/document attachments remain [discovery](../specifications/ARTICLE-ATTACHMENTS-DISCOVERY.md); no binary storage or multimodal capability decision was implemented.

AntiGravity commands to inspect the prepared work, without committing or publishing:

```powershell
cd C:\Users\RFERRAZ\Documents\retranca-editorial-os
git status --short --branch
git diff --stat
```

The existing all-action script is in the acceptance plan; no repeat of the accepted article three-step script is requested merely for reconfirmation.
