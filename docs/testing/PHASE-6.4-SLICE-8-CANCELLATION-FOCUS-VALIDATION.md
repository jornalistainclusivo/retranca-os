# Phase 6.4 — Slice 8 Cancellation and Dialog Focus

Date: 2026-10-01 (America/Sao_Paulo).
Branch: `feat/phase-6.4-pro-workflow-customization`.
Saved baseline: `ac453e8` (`fix(phase-6.4): harden Slice 8 integration and AI rendering`).
Scope: subsequent local implementation. The product owner explicitly authorized its consolidation commit on 2026-10-01 and requires a new confirmation before each further commit or push. Identify the saved checkpoint by the commit message below and this report path.

## Result and implementation

The prior [Slice 8 checkpoint](PHASE-6.4-SLICE-8-HARDENING-VALIDATION.md) was consolidated locally with explicit authorization. This round implements two of its remaining acceptance gaps, under [ADR-008](../decisions/ADR-008-EDITORIAL-AI-ORCHESTRATION-BOUNDARY.md) and [ADR-013](../decisions/ADR-013-OPEN-SINGLE-EDITION.md):

- Ollama cancellation now invokes `cancel_ollama_inference`. A native registry owns each HTTP task, rejects concurrent duplicate job IDs, signals cancellation, and waits for transport teardown. The worker drops its request/response future before emitting one terminal event (`ai-stream-done`, `ai-stream-canceled`, or `ai-stream-error`) and acknowledging completion. Cancellation also covers model validation and request setup. Unknown/completed job IDs are idempotent no-ops.
- Both AI consumers capture the provider for the session, await the native start acknowledgement before canceling, ignore obsolete job events, release subscriptions that finish registering after close, and request cancellation on close/unmount. The article dialog now exposes **Cancelar geração**; both consumers retain the busy state until cancellation ends, announce its result and preserve retryable cancellation errors separately from streaming content. Closing while preparation is pending prevents a later job from starting.
- The NDJSON parser preserves UTF-8 split across HTTP chunks. Malformed JSON, provider error records, broken transport and a missing completion marker become errors. A final record without a newline is accepted when it contains `done: true`.
- Article and assistant use native `<dialog>` with `showModal()`, a title association, initial heading focus, Escape synchronized with React, and focus restoration to the invoker. The browser supplies background inertness and the modal top layer. Removing a focused AI cancel button restores focus to the analysis input; the owner reported the desktop checks below as passing. Assistant inputs now have associated labels.

No production dependency, lockfile, schema migration, CI configuration, authentication, commercial gate, prompt/action policy or model choice was changed. Raw inference IPC remains debug-only. No push, PR, merge, tag or release was performed. This round is not a complete Slice 8 closure or Gate B approval.

The local Next development server also generated root `AGENTS.md` and `CLAUDE.md` automatically (`node_modules/next/dist/server/lib/generate-agent-files.js`). Their contents were reviewed: the managed Next guidance and its Claude include, without a manual governance-policy change. The owner authorized their inclusion with this round's code, tests and documentation in the 20-file consolidation. Existing project/user authorization rules still apply.

## Automated validation

| Command | Result | Evidence scope |
| --- | --- | --- |
| `npm run lint` | pass | Existing ESLint ignore-file warning remains. |
| `npm test` | pass — 211 tests / 18 files | Ten new tests cover native cancellation routing, unavailable-runtime/errors, session start/cancel races, closed/late subscriptions, retry and normal cleanup. Fixtures are deterministic tests, not model inference. |
| `npx tsc --noEmit` | pass | Current TypeScript tree. |
| `npm run build` | pass | Static frontend production build; does not establish installer/runtime readiness. |
| `cargo fmt --manifest-path src-tauri/Cargo.toml --check` | pass | Current Rust formatting. |
| `cargo check --manifest-path src-tauri/Cargo.toml --locked` | pass | Native compilation. |
| `cargo test --manifest-path src-tauri/Cargo.toml --locked` | pass — 102 tests | 67 unit + 35 integration. Five new gateway tests include split UTF-8/provider errors, valid/truncated/malformed streams, cancellation before dispatch, duplicate/idempotent registry behavior and cancellation during a live TCP stream. |
| `cargo test --manifest-path src-tauri/Cargo.toml --release --locked` | pass — 102 tests | Same suite in release profile. |
| `node scripts/security-enforcement-test.mjs` | pass | Static registration guard for raw debug-only inference commands; not an independent security audit. |
| `git diff --check` | pass | Whitespace review; untracked new files are additionally inspected. |

The native transport test serves a controlled HTTP stream on an ephemeral loopback port, waits for the first token, cancels through the actual registry, and observes peer EOF/reset. The count stays at one after cancellation acknowledgement and the registry is empty. It does not run an Ollama daemon, exercise Tauri event delivery inside a WebView, or prove that server/GPU work stops. Existing Rust warnings in provisioning code and the Vitest config-loader warning remain outside this change.

## Browser interaction evidence

Agent-operated Codex in-app browser at `http://127.0.0.1:3011`, using the repository's Next development server and browser fallback data. This separate origin isolates the check from the owner's desktop SQLite data and usual port 3000 storage. No model fixture server or model inference was used.

| Check | Result | Observation |
| --- | --- | --- |
| Assistant title and initial focus | pass | Named dialog, `:modal` true, active element is its heading. |
| Assistant forward keyboard navigation | pass within sampled controls | Close, action controls, input, attachment and generate were reached. Application background controls were not reached; the browser temporarily leaves document focus at its chrome boundary, then Tab returns to the dialog. No claim that document focus always remains on a descendant. |
| Assistant Escape / return | pass | Dialog removed; focus returned to **IA Assistant**. |
| Article title and initial focus | pass | Named modal dialog; heading receives focus. |
| Article forward/reverse boundaries | pass | Two Tabs from the last control returned to the first dialog control; reverse navigation returned to **Salvar Pauta no CMS**. |
| Article writing mode / Escape | pass | Native modality retained when writing mode enabled; Escape removed the dialog and returned focus to **Nova Pauta**. |

The **Nova Pauta** entry creates an empty article immediately in this isolated fallback store; no editorial content was entered or saved. Keyboard coverage is sampled, not a full form audit. The owner subsequently reported the three desktop scenarios below as passing; these are user-reported results, separate from agent-observed browser evidence. NVDA announcements, zoom/reflow, contrast and reduced motion remain **not-tested**. No WCAG conformance claim is made.

The native-dialog choice follows [MDN's dialog documentation](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) and the [WAI modal-dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), consulted 2026-10-01. APG is interaction guidance, not a conformance certification. MDN marks the base dialog feature widely available; the actual desktop target still requires verification.

## AntiGravity: three focused manual checks

Restart the desktop development process so the new Rust command is loaded. If it is running, save editorial work, close Retranca and use Ctrl+C in that terminal. Then run on the same feature branch:

```powershell
cd C:\Users\RFERRAZ\Documents\retranca-editorial-os
git status --short --branch
npx tauri dev
```

In **IA local**, select your actual installed `gemma4:latest` (or the real model tag shown by your inventory). No fixture or fabricated model is needed. Use only public test text, not unpublished material or source data.

| Check | Steps | Expected |
| --- | --- | --- |
| 1 — Cancel and retry | Open **IA Assistant → Esboço de Pauta**. Enter **Crie um roteiro detalhado de reportagem sobre acessibilidade em bibliotecas públicas.** Select **Gerar com IA**, then **Cancelar** while loading/generating. Repeat once, canceling as soon as the control appears. After cancellation, run **Linguagem Simples** with **A reunião será realizada amanhã, às 10 horas, na biblioteca.** | **Geração cancelada.**, no new visible tokens for the canceled job, controls become available, focus returns to the text input when cancel was focused, and the next generation completes without mixing the old response. A generation already completed is a valid completion race; repeat with a longer public topic if needed. |
| 2 — Close during generation / article cancel | Start a generation and press Escape before it completes. Reopen the assistant and run the short public text above. Open a temporary test article, paste that text in **Conteúdo para análise**, invoke **Simplificar Linguagem**, then **Cancelar geração**. Close without saving the test content. | Escape closes and returns focus; reopened dialog accepts a new job without old tokens. Article cancellation announces its result and re-enables AI actions. After reopening, an explicitly visible previous partial result can be retained; continued updates from its old job must not occur. |
| 3 — Desktop keyboard dialogs | Open assistant and article separately. Use Tab/Shift+Tab through their controls, including the beginning/end; press Escape to close. Test article writing mode as well. | Visible focus, background **IA local** and other application controls are unreachable while modal, Escape closes, and focus returns to the entry button. No mouse is required to close. |

Report **1 OK/falhou; 2 OK/falhou; 3 OK/falhou**, including the precise failing step/message.

### Owner-reported acceptance — 2026-10-01

The owner replied **“1 ok; 2 ok; 3 ok”** for this round's script. This is a new confirmation, distinct from the earlier checkpoint's three checks.

| Scenario | Status | Evidence |
| --- | --- | --- |
| Cancel and retry | pass — owner report | `1 ok`: cancellation and subsequent generation smoke scenario accepted. |
| Close/reopen and article cancellation | pass — owner report | `2 ok`: session close/reopen and article cancel smoke scenario accepted. |
| Desktop keyboard dialogs | pass — owner report | `3 ok`: keyboard/Escape/focus-return smoke scenario accepted. |

The exact model tag, generated text, timing, individual focus trace and native event log were not supplied with this confirmation. Do not infer them, all-action AI acceptance, server/GPU interruption or complete accessibility conformance. Recording this report changes documentation only; automated checks above were run in the implementation round and were not rerun for this documentation-only update. Manual acceptance is not commit/push authorization.

## Limits and next handoff

Cancellation interrupts the client's registered HTTP task. It does not promise to stop Ollama server/GPU computation, unload a model or shut down the daemon. A completion event can legitimately win a click race. Close/unmount cancellation is best effort if native IPC fails; transport failure is not reported as successful cancellation while the dialog remains open.

The desktop smoke scenarios are accepted by owner report. The owner subsequently stated **“Sim, autorizo criar o comitê local desta rodada. Podemos seguir. Você está autorizado.”** on 2026-10-01. This explicitly authorizes `fix(phase-6.4): cancel Ollama jobs and manage dialog focus`, covering this round's code, tests, documentation and the reviewed Next-generated guidance files (20 files). It does not authorize a push or another commit. Publishing requires a separate push confirmation and exact-commit Windows/Linux CI evidence. Gate B still needs independent technical/security acceptance; all six actual actions, packaged runtime/model provisioning and broader accessibility remain separate acceptance work. The historical security scan and prior CI evidence do not validate this subsequent patch.
