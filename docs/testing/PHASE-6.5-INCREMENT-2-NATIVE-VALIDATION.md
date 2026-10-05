# Phase 6.5 Increment 2 — Native readiness validation

Date: 2026-10-05 (America/Sao_Paulo). Status: native implementation locally validated, with bounded owner-reported functional acceptance and explicitly authorized local consolidation. Readiness UI, exact runtime/model identity evidence, publication/new published-source CI and installers remain pending. This report does not close Increment 2 as a whole or approve release.

## Baseline, authority and changes

Branch: `codex/phase-6.5-production-provider-contract`, created from integrated `37b272c1ae048c5aa004211fd9d09178bd41709c`. [Resumption](PHASE-6.5-RESUMPTION-2026-10-05.md) records the verified PR/main CI and initial documentation-only preparation. Those results apply to the merge, not this new uncommitted source.

The owner accepted external local Ollama first, retaining an embedded engine as the preferred future delivery, then explicitly authorized Increment 2 native readiness/capability/local execution work. [ADR-016](../decisions/ADR-016-PRODUCTION-LOCAL-AI-PROVIDER.md) and the [technical contract](../specifications/phase-6.5/PHASE-6.5-INCREMENT-2-PROVIDER-READINESS.md) record the accepted direction, pinned primary-source evidence and trust limits.

- [local_ai_readiness.rs](../../src-tauri/src/local_ai_readiness.rs): minimal metadata-only query; audited server version, selected catalog identity, textual completion, GGUF/architecture and local-request evidence; bounded responses and total deadline.
- [ollama_gateway.rs](../../src-tauri/src/ollama_gateway.rs): recheck before every generation; send only the constrained `:local` selector; preserve registry/stream cancellation and existing events, adding readiness error codes. Existing model inventory and legacy membership lookup now share the bounded catalog, retaining exact order/output and the legacy alias.
- [lib.rs](../../src-tauri/src/lib.rs): register the query while preserving debug-only raw inference commands. Existing release orchestration remains the prompt authority.

No frontend, dependency/lock, database migration, workflow/CI, authentication, cloud configuration or engine replacement was changed. No owner article/database/export/credentials/model file was read; tests use synthetic names, editorial strings, temporary database fixtures and ephemeral loopback servers. The agent did not start the daemon, download/update/select a real model or perform real inference.

## Executed local verification

Environment: Windows checkout, existing locked Rust dependency graph and build fixture. No production installer was executed. Initial sandbox commands intermittently failed with `InitializeDefaultDrives`, denied directory canonicalization or `must be run in a work tree`; permitted retries outside the sandbox passed. These access failures were environmental, not test passes.

| Command | Observed result |
| --- | --- |
| `cargo fmt --check` (in `src-tauri`) | Passed after applying standard formatting. |
| `cargo check --locked` | Passed in debug. |
| `cargo check --release --locked` | Passed in release, including query/handler compilation. |
| `cargo test --locked` | Passed 124 tests: 79 library unit tests plus 45 integration tests; zero failures. |
| `cargo test --release --locked --quiet` | Passed the same 124 tests; zero failures. |
| `cargo test --locked local_ai_readiness --quiet` and release equivalent | Final seven metadata fixtures passed in each profile after test-only refinements. |
| `node scripts/security-enforcement-test.mjs` | Passed the existing source-registration check for debug-only raw inference. This is not binary/installed-runtime attestation or a full security scan. |
| `git diff --check` and local Markdown link check | Tracked whitespace check passed; the final link check verified 99 local targets across 11 changed documents. |

Ten tests were added: seven metadata/readiness tests and three gateway enforcement/cancellation tests. Existing stream and live-cancel fixtures were adapted to the new metadata sequence. After full-suite passes, only synthetic fixture assertions/bodies/listener bounds were refined; the seven affected metadata tests were rechecked in debug/release. Production Rust behavior did not change after the full-suite checks. No frontend source changed, so the previously accepted frontend suite/build was not repeated.

Existing warnings remain in `provisioning/download.rs` (`unused_mut`) and the existing `provisioning/security.rs` test (`signing_key` unused). They did not fail compilation/tests and were not changed as unrelated cleanup.

## Behavior evidence and review

| Requirement | Synthetic evidence |
| --- | --- |
| Selection/runtime/capability | No selection/invalid input/unreachable server, exact tag and retained alias, missing model, unsupported version, absent completion, missing architecture, bad digest, remote markers in tags/show and READY. |
| Metadata bounds | Valid JSON exceeding version/catalog byte limits, duplicate/invalid/excessive catalog names, chunked JSON without Content-Length, malformed responses, rejected redirects and expired total deadline. |
| No editorial transmission on blocked readiness | Gateway fixtures expect **zero** generation POSTs and no tokens for unsupported version, missing/remote model, unsupported capability and unknown local metadata. |
| Fresh constraint/no fallback | Exact `:local` POST body; simulated rejection after inspection produces a provider error without unconstrained retry. A changed remote catalog is re-read and blocks the next generation. |
| Cancellation | Pre-canceled requests contact no provider; pending metadata transport closes before acknowledgement/any generation; live generation cancellation still closes streaming and releases the registry. |
| Minimal IPC output | Only diagnostic fields serialize; synthetic system/template/license text and private selector do not appear in the report. |

A focused independent read-only review confirmed the native gate and reported the existing unrestricted inventory reader. The implementation now shares bounded catalog validation; a second read-only pass confirmed that finding resolved and found no material introduced defect in the reviewed scope. This is a focused static review, not exhaustive security/accessibility assessment. The worker did not run tests or contact the daemon.

## Limits and next delivery

- Support currently requires **server** `0.35.1`; the observed CLI version is insufficient. All other server versions/formats with unverifiable metadata are blocked without modifying the person's installation. Only GGUF/architecture/completion metadata is accepted initially.
- The separately installed daemon must be trusted to implement the audited `SourceLocal` behavior. Reported version/loopback/digest do not independently attest its executable or process. `READY` means the dispatch contract is satisfied, not that inference succeeded or hardware/context/quality was evaluated.
- Manifest digest is observed before generation, without atomic pinning; a tag may change to another local model. Remote substitution is refused by the audited daemon's per-request constraint. The race fixture simulates its 404 rejection and verifies client behavior; it does not exercise a race in the actual Ollama process.
- One invalid/duplicate catalog entry or exceeded bound rejects the entire list. Existing generation NDJSON buffering has no per-line/total volume ceiling; that previous streaming limit remains a separately scoped hardening item, rather than a guarantee of this metadata contract.
- The gate covers the Ollama path. Existing preflight/sidecar policy is preserved; the development fixture is not certified as a production inference engine. Embedded preference, runtime integrity/licensing, Windows/Linux installation and broader accessibility remain separate gates.
- No new CI run, Linux local test, refreshed actual-daemon version/model inventory, agent-run inference, NVDA/keyboard observation or installer acceptance is claimed. The owner subsequently reported the complete simplification handoff without perceived inconsistencies, in addition to earlier cancellation/original-text preservation. This functional acceptance does not supply exact runtime/model identity, output-quality or broader UI evidence. Previous accepted Increment 1 settings checks are retained, not repeated or generalized to this new behavior.

The next implementation connects this query to settings/status/retry UI, with truthful pending/failure states, accessible announcements and stale-result invalidation without changing session choice. Preserve the accepted functional handoff below; new UI checks, exact runtime/model identity, comparative synthetic evaluation and distribution remain separate evidence. The owner subsequently authorized local consolidation as recorded below. Push, PR, CI dispatch, merge, tag and release are not covered by that authorization.

## AntiGravity — bounded functional desktop handoff

Handoff status: **functionally accepted by the owner**, as recorded below. Do not repeat accepted steps solely for confirmation. Exact runtime/model identity and broader pilot evidence remain pending. Keep real editorial text out of the diagnostic report. Use the already installed/configured Ollama; do not replace its installation/model just to obtain a pass. An existing prepared article is sufficient for the owner's functional check; a new invented article was a suggestion to avoid editing production work, not a requirement of Simplificar Linguagem. Agent-run fixtures and later comparative pilots continue to use invented inputs.

```powershell
cd C:\Users\RFERRAZ\Documents\retranca-editorial-os
git branch --show-current
git status --short --branch
Invoke-RestMethod -Uri http://127.0.0.1:11434/api/version | Select-Object version
npx tauri dev
```

The branch should be `codex/phase-6.5-production-provider-contract`; pending changes existed during the handoff and a clean tree is expected after the authorized local consolidation. The read-only version query does not start Ollama. If unreachable or a version other than `0.35.1` appears, record that result and the Retranca error; do not update/downgrade/download anything. Unsupported-version blocking is an expected protective outcome, not a functional inference pass.

1. If the supported server is already running, choose an existing exact model in IA local. Use an already prepared article with analysis text (prefer an example/test draft), run Simplificar Linguagem and let it finish without canceling. Verify the streamed response finishes without a generation error. Record only server version and exact selected tag plus success/error, without article text.
2. Start another generation and cancel it. Verify that Retranca stops its generation state and allows a later retry. Report app behavior only; do not infer GPU/server compute termination from the button.
3. Save/reopen the test article after the AI result or blocked/error result. Confirm CMS remains usable and preserves the original text in **Conteúdo para análise**, plus the saved article fields. The separate AI suggestion panel is temporary: partial or completed output is not included in CMS save and is cleared when the article is reopened. To retain a reviewed suggestion, use **Copiar**, paste it explicitly into a suitable article field (for example journalist notes), and then save; do not overwrite the original merely to perform this check. This checks the new readiness/error boundary; do not repeat already accepted global settings/focus scripts.

Report `1 OK; 2 OK; 3 OK` only for checks actually run, otherwise `not run` and the displayed reason. After testing, save/close Retranca and end `npx tauri dev` with Ctrl+C before another compilation. X/Escape/NVDA checks for the forthcoming readiness UI will have their own script.

## Owner follow-up — canceled suggestion and CMS persistence

On 2026-10-05, the owner reported selecting a model, starting Simplificar Linguagem, canceling after text began streaming, saving and reopening the article. They then clarified that **only the AI-generated fragment disappeared**, while the original article text remained. Record this as owner-reported generation start, cancellation and preservation of the original CMS content. A completed simplification, exact server/model identity and dedicated readiness UI/accessibility checks were not supplied by this report; do not turn it into acceptance of the whole matrix.

Static source inspection confirmed the existing behavior in [ArticleModal.tsx](../../components/ArticleModal.tsx): `aiResponse` is separate session state, reopening resets it, and saving passes article fields/`analysisContent`/history rather than the AI response. **Copiar** copies the suggestion; the **Aplicar** control elsewhere in the modal applies a checklist template, not AI output. A focused independent read-only check corroborated the separation. No private article was inspected and no runtime/code/persistence contract changed in this follow-up.

The initial desktop handoff said to confirm the saved text without explicitly distinguishing original CMS content from the generated suggestion. The owner-facing explanation and step 3 above clarify this ambiguity. Persisting AI outputs/history or adding an explicit apply-to-field workflow would require a separately specified increment; cancellation must not silently replace the article's original text.

## Owner acceptance — completed simplification

Later on 2026-10-05, after being asked to let one simplification finish without canceling, the owner reported: “teste realizado e parece que tá tudo normal. Não vi nenhuma inconsistência.” Record this as owner-reported successful completion without perceived functional inconsistencies. Together with the previous cancellation and original-content preservation observations, it closes the three bounded functional handoff checks; they do not need repetition solely for confirmation.

Exact server/model tag, output, latency, editorial-quality assessment and whether the article was an example or real content were not provided or independently inspected. Do not relabel this as a controlled synthetic comparison, daemon/process attestation, full readiness UI/accessibility acceptance, published-source CI or installer acceptance. A focused read-only continuity check agreed this is sufficient to prepare consolidation of the native round with those limits retained. No executable changes or new test-suite runs were required to record this acceptance.

## Local consolidation authorization — 2026-10-05

The owner explicitly authorized the requested **local Git commit only** for the 14 prepared files on `codex/phase-6.5-production-provider-contract`: three native Rust files and eleven documentation/checkpoint files. The commit message is `feat(phase-6.5): enforce native local AI readiness`. Record its actual SHA from Git after execution; it is intentionally not embedded in its own committed content.

This local consolidation preserves the executed checks and bounded functional acceptance. Only documentation was updated after those checks to record owner observations/authorization and current status. No fresh executable tests are needed for these documentary changes. Actual article/model/database/credential files are outside the commit. Publication, manual CI, merge, tag/release and the next UI implementation are separate actions; no remote success is implied by a local commit.

AntiGravity verification after consolidation:

```powershell
cd C:\Users\RFERRAZ\Documents\retranca-editorial-os
git status --short --branch
git log -1 --oneline
```

Expected: the same branch, no changed-file rows and the commit message above. This new branch was created without an upstream; a clean local tree alone does not mean the commit was pushed or checked by remote CI.
