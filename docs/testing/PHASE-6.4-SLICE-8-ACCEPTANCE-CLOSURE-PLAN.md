# Phase 6.4 Slice 8 — Acceptance Closure Plan

Date: 2026-10-01 (America/Sao_Paulo). Status: execution checklist; acceptance pending.

## Current checkpoint and decision authority

The planning checkpoint is `543d03333414698d9aa4d9976aabf4080e21bbc2` on `feat/phase-6.4-pro-workflow-customization`. The owner authorized and completed publication of that documentation commit. The workspace was clean when this planning review began.

The [remote CI run](https://github.com/jornalistainclusivo/retranca-os/actions/runs/36892534647) was rechecked through the GitHub API on 2026-10-01: `completed / success`, `head_sha = 8e22c18f37648322187727c0d5c56e7b1e734213`. Its four successful jobs and their coverage are recorded in the [cancellation/focus report](PHASE-6.4-SLICE-8-CANCELLATION-FOCUS-VALIDATION.md#subsequent-authorized-publication-and-remote-ci--2026-10-01). It does not represent CI on `543d033` or this later planning documentation. No open PR for this feature branch was returned by the GitHub API at this review checkpoint.

[ADR-013](../decisions/ADR-013-OPEN-SINGLE-EDITION.md) remains the product-access authority: one open edition, no account/subscription/commercial gate. ADR-008/009/010 and the amended [test specification](../specifications/phase-6.4/PHASE-6.4-TEST-SPECIFICATION.md) retain native AI evidence, workflow lifecycle, persistence and accessibility requirements. Historical Free/PRO tests are retired. This checklist introduces no new product or architecture decision.

### Subsequent reported defect — execute first

The owner then reported shared analysis text across articles and approved saving it with each article. [ADR-014](../decisions/ADR-014-ARTICLE-CMS-CONTENT-PERSISTENCE.md) and the [content corrective report](PHASE-6.4-ARTICLE-CONTENT-VALIDATION.md) define the later implementation. The earlier application-close response unblocked compilation only. The owner subsequently reported the three content checks as passing (`1 OK; 2 OK; 3 OK`, 2026-10-01) and authorized continuing development. Review and consolidate that accepted corrective; no repeat migration or accepted smoke test is requested. The agent did not inspect actual database/backup files. Image/text/document utilities are preserved in [attachment discovery](../specifications/ARTICLE-ATTACHMENTS-DISCOVERY.md).

The [review follow-up](PHASE-6.4-ARTICLE-CONTENT-REVIEW.md) records fixed malformed-import render errors, guarded save callbacks and final local frontend checks. Its frozen scan retains a partial coverage flag and does not close independent Gate B. Current Header JSON import does not persist its collection into native SQLite; packaged SIDECAR executable resolution also remains unverified. These limitations need explicit ownership before acceptance/release rather than being treated as passing behavior.

## Ordered work and exit evidence

| Order | Work | Current evidence | Exit evidence / responsibility |
| --- | --- | --- | --- |
| 1 | Exercise all six editorial AI actions with the owner's real installed Ollama model. | Plain Language and cancellation/retry have owner-reported smoke acceptance; all-action inference remains partial. | Action, exact model tag, input fields, completion/error and observed result recorded separately for each action. Implementation/QA prepares the script; owner reports desktop observations. |
| 2 | Complete accessibility and error-path checks in the desktop target. | Sampled browser focus and owner-reported desktop keyboard checks passed. | Keyboard operation of customization and AI, NVDA names/status/errors, zoom/reflow, contrast and reduced motion; missing evidence/runtime failures must be clear and recoverable. Manual QA is required; synthetic coverage is recorded separately. |
| 3 | Assess packaged-runtime acceptance and review the final source changes (Gate B). | Production installation/model provisioning is not tested. The historical security scan targeted an older range and had partial coverage. | Independent technical/security review identifies blockers, verifies fixes and explicitly addresses packaging/runtime gaps. A successful build or mock sidecar is not installation or real inference evidence. |
| 4 | Consolidate the accepted round and prepare a PR. | No PR is open for this feature branch. | Owner separately authorizes commit/push. Gate B passes before PR readiness. The existing PR workflow then validates the actual published revision; reviewers inspect the final diff and unresolved limitations. |
| 5 | Integrate the accepted Phase 6.4 work and design Phase 6.5. | Merge and release/tag approvals are pending. README identifies Phase 6.5 as Production Provider & Model Experience. | Human merge authorization (Gate C); separately approved Phase 6.5 specifications/plan. Release/tag still requires Gate D. |

An unresolved mandatory criterion remains open. If a packaging/provider task belongs to Phase 6.5, Gate B must identify the boundary explicitly; changing Phase 6.4 acceptance requires a documented human decision. Deferral is not a passing test or permission to publish a release.

## Next desktop handoff: all-action inference

After the content corrective's migration and desktop handoff are accepted, use a disposable test article, without unpublished material or source data. Opening **Nova Pauta** prepares an unsaved article; explicit CMS save creates its persisted record. Do not use an existing editorial article or reset the database. Saving the fields below is unnecessary for session inference. These are synthetic test inputs, not a news report or an actual image.

Start the existing desktop workflow in AntiGravity:

```powershell
cd C:\Users\RFERRAZ\Documents\retranca-editorial-os
git status --short --branch
ollama list
npx tauri dev
```

Select the actual installed model in **IA local** and record its exact inventory tag. `gemma4:latest` is the owner's previously indicated selection; use the inventory spelling, without inventing a model, pulling another model or substituting fixture inference. Model availability is not established by this planning review.

Fill the article fields:

| UI field | Test value |
| --- | --- |
| Título | `Teste de acessibilidade em bibliotecas` |
| Objetivo da Matéria | `Planejar uma reportagem sobre acesso a bibliotecas e identificar o que precisa de apuração.` |
| Conteúdo para análise (Texto completo) | `Texto de teste. A reunião será realizada amanhã, às 10 horas, na biblioteca. A pauta propõe perguntar como as pessoas acessam o espaço e os serviços.` |
| Palavra-Chave SEO | `acessibilidade em bibliotecas` |
| Descrição Visual para Alt Text (Apenas Sessão) | `Cena fictícia para teste: uma pessoa em cadeira de rodas está diante de uma estante de livros, com um corredor livre ao lado.` |

Execute one action at a time in **Assistência de IA para esta Pauta (IA Local)**. Wait for completion before the next action; copy a brief observed result or the exact error.

| Action ID | UI control | Minimum native evidence |
| --- | --- | --- |
| `research_gaps` | Pesquisar Lacunas | Title or objective. |
| `plain_language` | Simplificar Linguagem | Content or summary. |
| `validate_inclusivity` | Validar Inclusividade | Content or summary. |
| `generate_alt_text` | Alt Text WCAG | Nonempty visual description; image upload is not supported evidence for this native action. |
| `generate_seo` | Otimizar Meta Tags SEO | Keyword and content or summary. |
| `editorial_review` | Revisão Editorial | Content and objective. |

Report `action ID: OK / failed; model tag; observed result / exact error`. A functional pass means the real model completes, the result is readable, controls recover and old job tokens do not mix into the next action. Output wording is variable. Record unsupported factual assertions or invented image details as output-quality issues rather than silently accepting them. This script does not establish comprehensive AI quality or accessibility conformance. All six results remain **not recorded by this round**.

Negative evidence cases, unavailable runtime and reader/zoom checks belong to the next QA pass. Do not ask the owner to repeat the already accepted cancellation/keyboard smoke unless a relevant change or regression justifies it. Automated tests remain the implementer's responsibility.

## Delivery controls and limits

Keep the current branch and editorial database. Apply targeted fixes when evidence demonstrates a failure. The original planning review performed no dependency, migration, CI/authentication change, model download, installer execution, commit, push, PR, merge, tag or release; no runtime source changed during that planning-only review. The subsequent reported content defect and its executed local tests are tracked separately above; no actual editorial database was migrated in that corrective preparation.

Before public distribution, the product owner must also resolve the repository's currently undeclared licensing terms, recorded in [README](../../README.md#15-licensing-status); ADR-013 does not select a legal license. Phase 6.5 must define its own production model/provider and installation experience rather than inheriting an untested default.

This document prepares acceptance; it does not grant Gate B/C/D approval. Ask before each subsequent commit/push and before any action requiring separate authorization under the existing project/user rules.
