# Phase 6.5 — Increment 2: Provider and model readiness contract

Date: 2026-10-05. Status: the native portion is implemented, locally validated, functionally accepted within the bounded owner handoff and published as `d944a114f935cbab7222068c22fe22bc26f12fb1`; all four jobs passed [CI 37356369629](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37356369629) on that exact source. The [readiness UI integration](PHASE-6.5-INCREMENT-2-READINESS-UI.md) is implemented locally with automated checks passed and [separate browser observations/desktop handoff](../../testing/PHASE-6.5-INCREMENT-2-UI-VALIDATION.md). The owner reported the three UI desktop checks passing on 2026-10-05 (`1 OK; 2 OK; 3 OK`). UI publication and new exact-source CI remain pending. Exact runtime/model identity evidence and distribution remain pending; native CI does not cover subsequent UI changes. [ADR-016](../../decisions/ADR-016-PRODUCTION-LOCAL-AI-PROVIDER.md) records accepted external local Ollama for the first production path and an embedded engine as the preferred future delivery. Preserve the accepted Increment 1. Native checks do not grant distribution/release acceptance. Actual commands, results and owner observations are recorded in the [native validation report](../../testing/PHASE-6.5-INCREMENT-2-NATIVE-VALIDATION.md).

## Baseline and preservation

Start from merged `37b272c1ae048c5aa004211fd9d09178bd41709c` on `codex/phase-6.5-production-provider-contract`. The [resumption checkpoint](../../testing/PHASE-6.5-RESUMPTION-2026-10-05.md) records Git ancestry and current main CI. Preserve [Increment 1](PHASE-6.5-INCREMENT-1-MODEL-INVENTORY.md): explicit refresh/retry, exact installed tags, no implicit selection/download, choice retention within the session, focus restoration, foreground-dialog precedence and late-result invalidation. Do not repeat its accepted desktop script solely for confirmation.

## Increment requirements and delivery scope

| ID | Contract requirement |
| --- | --- |
| RE-65.2-001 | Readiness separates runtime unreachable, no selection, selected tag absent, verification pending, unsupported capability, known remote/unknown provenance, ready and recoverable failure. Use truthful user messages and accessible status/error announcements. Do not confuse readiness with the existing generation state machine. |
| RE-65.2-002 | Rust reads exact selected-model inventory/details with bounded requests and responses. Define supported versions and a DTO containing only necessary facts; never forward arbitrary model templates or secrets to the renderer or accept endpoint/system-instruction overrides. |
| RE-65.2-003 | Establish the reliable local-execution constraint and failure policy before coding the dispatch gate. A loopback address, model name, missing remote marker or checkbox alone cannot certify provenance. Recheck relevant facts immediately before generation; stale UI readiness is not authority. If the required evidence is unavailable, block dispatch rather than inventing a passed state. This contract trusts the separately installed daemon; it does not attest its process. |
| RE-65.2-004 | Require textual completion for the six existing visible editorial actions under ADR-008. The native action enum has eight textual actions; the same Ollama gate covers all of them. Unknown/unsupported metadata is blocked; it cannot create image-input support. Keep text-based descriptions separate from a future image attachment protocol. |
| RE-65.2-005 | Refresh, failure, cancellation and close never substitute/download a model or erase the selected session tag. Invalidate late verification responses when model/view changes. Editorial CMS work stays available when AI is not ready. |
| RE-65.2-006 | Preserve native prompt/context authority and request cancellation. Specify any production-sidecar exposure/fallback change explicitly after provider acceptance; do not ship the mock fixture as an inference engine. |

The native portion published in `d944a11` implements the Rust query, bounded catalog and per-generation gate below and preserved the existing frontend generation error/cancel events. The subsequent [bounded UI delivery](PHASE-6.5-INCREMENT-2-READINESS-UI.md) now integrates loading/status, query-result invalidation, dedicated recovery messages and accessible announcements in RE-65.2-001/005 locally, using this contract without changing native authority. Existing refresh, exact selection and focus behavior are preserved; a query result never authorizes dispatch. Tests use invented inputs, not real article content.

Preserve the existing CMS/output separation: partial and completed AI suggestions are session-only, cleared on reopening and not included in article save. Saving persists the original editable article fields/analysis text. Retaining a reviewed suggestion currently requires explicit **Copiar**, paste into an article field and save. An AI history/apply-to-field feature is not introduced by readiness; the [desktop handoff and owner clarification](../../testing/PHASE-6.5-INCREMENT-2-NATIVE-VALIDATION.md#owner-follow-up--canceled-suggestion-and-cms-persistence) make this distinction explicit.

Owner-reported model preference (2026-10-05): Gemma 4 currently used and DeepSeek performed best in their informal experience. This report has no supplied dataset, score, latency, model version/quantization or exact DeepSeek tag. Preserve selectable installed models; do not promote either family to a fixed default or infer vision support. A later comparative pilot must record exact installed identity/configuration, representative invented inputs, human quality review and latency. The previous `gemma4:latest` handoff is historical evidence, not a refreshed inventory.

## Native protocol and execution constraint

The supported **server** version is exactly `0.35.1`, checked through `GET /api/version`; a matching CLI version alone is insufficient. Support is pinned to upstream commit [`b0c1ca4f7549d7acdfa52a7dcffc934bc63a43ce`](https://github.com/ollama/ollama/tree/b0c1ca4f7549d7acdfa52a7dcffc934bc63a43ce). Other versions, including later releases, are blocked until separately audited and tested. No automatic update or downgrade occurs.

1. Reject absent/invalid selection before network access. Input/catalog names must be nonempty, at most 256 UTF-16 units, and contain no whitespace/control characters.
2. Consult server version, then bounded `GET /api/tags`. Resolve exact catalog membership first. Preserve the legacy `requested + ":latest"` alias only if exact membership is absent; do not alter the renderer's choice or invent a default.
3. Reject nonempty `remote_model` or `remote_host`. Require the selected manifest digest to contain 64 hexadecimal characters. Its role is diagnostic identity at inspection time, not atomic model pinning.
4. Request `POST /api/show` with `{"model":"<resolved_catalog_name>:local","verbose":false}`. Require `completion`, GGUF format and a nonempty architecture (maximum 128 bytes); reject remote/unknown/malformed evidence. Do not return templates, system instructions, license text, tensor data or arbitrary model metadata.
5. Immediately before **each** generation, repeat steps 1–4 natively. Only `READY` with its private selector can issue `POST /api/generate`; the request uses `<resolved_catalog_name>:local`, the existing native prompt and `stream:true`. No retry without the constraint, model substitution, remote fallback or download is performed.

In the pinned upstream implementation, the [model-reference parser](https://github.com/ollama/ollama/blob/b0c1ca4f7549d7acdfa52a7dcffc934bc63a43ce/internal/modelref/modelref.go#L28-L47) interprets the final `:local` as `SourceLocal`, retaining the remaining catalog name, namespace and registry port. The [generation handler](https://github.com/ollama/ollama/blob/b0c1ca4f7549d7acdfa52a7dcffc934bc63a43ce/server/routes.go#L329-L338) rejects remote configuration before proxy dispatch; the [show path](https://github.com/ollama/ollama/blob/b0c1ca4f7549d7acdfa52a7dcffc934bc63a43ce/server/routes.go#L1523-L1555) also enforces local resolution. This per-request constraint is the positive evidence used here; absent remote markers are only an additional check. Nested cloud/local requests rejected upstream are not made compatible by stripping suffixes.

The fixed production endpoint is `http://127.0.0.1:11434`. The Rust client disables proxies and redirects. No renderer endpoint, cloud toggle, process environment modification or `/api/status` dependency is accepted. The latter is [experimental in this version](https://github.com/ollama/ollama/blob/b0c1ca4f7549d7acdfa52a7dcffc934bc63a43ce/api/client.go#L479-L486); global cloud configuration is not needed to impose `SourceLocal` on this request.

## IPC and states

`get_local_ai_readiness({model: string | null})` returns a final report asynchronously, with no persisted/cache state and no article/context arguments:

```typescript
type LocalAiReadinessReport = {
  state: "NO_SELECTION" | "INVALID_MODEL" | "SERVER_UNREACHABLE"
    | "UNSUPPORTED_RUNTIME" | "MODEL_MISSING" | "REMOTE_MODEL"
    | "UNSUPPORTED_CAPABILITY" | "VERIFICATION_FAILED" | "READY";
  runtime_version: string | null;
  model: string | null;
  resolved_model: string | null;
  digest: string | null;
  capabilities: string[];
  execution: "UNKNOWN" | "LOCAL_REQUEST_ENFORCED";
  message: string;
};
```

This is the contract notation. The native published round added no frontend consumer/type; the [subsequent UI delivery](PHASE-6.5-INCREMENT-2-READINESS-UI.md) now supplies them locally, validating the unknown DTO through a desktop-only bridge. Rust registration is in [lib.rs](../../../src-tauri/src/lib.rs); the implementation is in [local_ai_readiness.rs](../../../src-tauri/src/local_ai_readiness.rs). The selector is private and skipped during serialization. Invalid renderer input is not echoed. Client-construction failure rejects the IPC with a fixed message.

| State | Meaning / dispatch policy |
| --- | --- |
| `NO_SELECTION` / `INVALID_MODEL` | Missing or invalid choice; block before consulting the daemon. |
| `SERVER_UNREACHABLE` | Initial version request cannot connect; block and allow a later manual retry. |
| `UNSUPPORTED_RUNTIME` | Server version differs from audited `0.35.1`; block without changing the daemon. |
| `MODEL_MISSING` | Neither exact choice nor retained legacy alias is in the catalog; block without substitution. |
| `REMOTE_MODEL` | Tags/show contain a remote marker; block before transmitting editorial content. |
| `UNSUPPORTED_CAPABILITY` | No advertised textual completion; block. |
| `VERIFICATION_FAILED` | Invalid/oversized/ambiguous metadata, unsuccessful HTTP response, unverifiable local metadata or total deadline expired; block. |
| `READY` | Metadata satisfies this dispatch contract, with `LOCAL_REQUEST_ENFORCED`; not proof of successful inference, quality, hardware sufficiency or packaged readiness. |

The query has no `CHECKING` state: the UI integration must own pending/cancel/view states separately and discard stale results. The standalone query has a deadline, without a new job/cancel IPC. A blocked generation emits existing `ai-stream-error` with `job_id`, fixed Portuguese `message` prefixed by `LOCAL_AI_<state>: `, and additive `error_code: "LOCAL_AI_<state>"`. Existing token/done/canceled payloads remain compatible. Generation cancellation covers its metadata future and streaming transport through the existing native registry; it does not guarantee termination of server-side/GPU work.

## Bounds, identity and production limits

- One total 10-second metadata deadline; per-generation client retains its existing 300-second request timeout for streaming. Catalog-only IPC/legacy membership lookup also have a 10-second deadline.
- Body limits apply to declared and actually received bytes: version 4 KiB, tags 2 MiB, show 4 MiB. Catalog maximum 1,000 names, no duplicate names; capabilities maximum 32, each nonempty, at most 64 bytes and without whitespace/control characters. The shared bounded catalog preserves order and `Vec<String>` inventory output. Any invalid/duplicate entry or exceeded bound fails the whole catalog, including when the requested model itself is valid.
- The daemon is trusted to implement its self-reported audited version. Loopback, version, digest and metadata do **not** independently attest its executable, process or configuration. A malicious/replaced daemon is outside the guarantee; installer/runtime integrity remains a later gate.
- The [tag digest identifies a manifest](https://github.com/ollama/ollama/blob/b0c1ca4f7549d7acdfa52a7dcffc934bc63a43ce/server/model_list.go#L58-L85), observed before show/generation. There is no supported atomic `@digest` binding here. A tag can change to another local model between checks; this contract does not promise immutable identity or unchanged capability. A later remote replacement is rejected by the audited daemon's `SourceLocal` constraint, rather than silently proxied.
- This first contract requires positive GGUF/architecture metadata and can conservatively block other locally executable formats. It performs no warmup, synthetic completion during readiness, context-fit/hardware measurement or comparative quality evaluation. Errors during actual generation remain recoverable provider errors.
- Existing preflight/provider selection is an availability hint, not this authority. The gate covers the Ollama path; it does not certify or remove the development sidecar. A real embedded engine and production fixture exposure still need their own specified delivery.

## Validation matrix

| ID | Evidence / scope |
| --- | --- |
| TEST-65.2-001 | Native fixtures cover exact tag/alias, absent runtime/model, malformed/oversized metadata, unsupported/unknown capability, known remote/unknown provenance, bounded timeout and changes between inspection and dispatch. Blocked cases must not submit generation content. Implemented with synthetic loopback fixtures; upstream enforcement is source-audited, not exercised against the actual daemon. |
| TEST-65.2-002 | Frontend/native-bridge tests cover truthful status/errors, selection preservation, retry and invalidation after model switch/close. Test behavior and boundaries, not a copy of the implementation. |
| TEST-65.2-003 | Compiled UI keyboard/reader sample covers the new controls/messages and preserves X/Escape/focus precedence. Browser fixtures are not proof of actual Ollama readiness or screen-reader output. |
| TEST-65.2-004 | Owner-authorized desktop pilot uses disposable invented articles and one exact existing model; record runtime/model identity, supported metadata and local-execution evidence, inference and cancellation. No pull/download/configuration change without separate authorization. |
| TEST-65.2-005 | Execute relevant frontend/native checks and exact published-source CI for executable changes. Installer Windows/Linux, licensing, broader accessibility and release remain separate gates. |

## Delivery exit and exclusions

The native portion is locally tested and functionally accepted in the owner's three bounded desktop checks. The owner separately authorized consolidation of the 14 prepared files, push and manual CI dispatch; native commit `d944a11` passed all four jobs, as recorded in the native validation report. Dedicated readiness UI and its accessible status/retry/late-result behavior are implemented and validated locally: 338 tests / 27 files, including 49 new bridge fixtures, types, lint and Next.js 16.3.4 static build passed, plus 11 isolated actual compiled-component/bridge checks with synthetic IPC. Browser observations remain separately recorded in the UI validation report. The three new UI desktop checks are owner-accepted; broader desktop/NVDA and new UI publication/CI are pending; native or UI Increment 2 has not been integrated into `main`. Exact runtime/model identity and broader pilot evidence remain separate; Increment 2 as a whole is not accepted yet. No engine replacement, preference persistence/migration, image upload, cloud configuration, dependency, Rust/IPC change for the UI, CI configuration change or installer is included. Native source publication does not authorize UI publication, merge, binaries, tag or release.
