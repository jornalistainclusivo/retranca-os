# ADR 013: Open Single Edition

## Status

Accepted — Human Product and Architecture Decision, 2026-09-30 (America/Sao_Paulo).

The product owner explicitly confirmed: “Sim, adotar edição única aberta”, with workflow stages, categories, and checklist templates editable by everyone, without an account or subscription. This authorizes the replacement of the Phase 6.4 commercial access policy and its native/UI implementation on the existing feature branch.

Supersedes ADR-011 and ADR-012 for product access, commercial authorization, and entitlement lifecycle. ADR-008, ADR-009, and ADR-010 remain authoritative for AI trust boundaries, workflow semantics, and persistence. This decision takes precedence over the older Free/PRO clauses in Phase 6.4 documents; historical approvals and validation reports remain historical evidence.

## Context

Phase 6.4 customization is implemented, but its commercial adapter was deliberately deferred. The five-state entitlement design adds an activation/verification dependency that the product owner no longer wants. Granting a permanent fabricated `ProActive` state or promoting the debug premium override would preserve this complexity and misrepresent commercial evidence.

## Decision

Retranca OS has one open edition. All implemented editorial and structural customization capabilities are available locally to every user. There is no commercial capability gate, login, subscription, activation, or entitlement refresh.

- Remove native commercial authorization checks and their state/provider dependency from all ten structural commands. Direct IPC calls and UI calls use the same domain validation and transactions.
- Remove the entitlement IPC commands, developer premium switch, entitlement context, and commercial lock presentation. Keep model selection in an independent AI runtime context.
- Expose local Ollama model selection in normal builds. AI execution still requires a supported runtime/provider, an explicitly selected Ollama model when applicable, and valid evidence. Browser storage compatibility does not supply a native AI runtime.
- Semantic classification affects recommendations only. Stage names, ordering, publication role, and legacy status do not grant or deny an evidence-valid AI action.
- Preserve stable identities, safe reassignment, exactly one active publication role, copied checklist instances/history, nonempty/unique names, schema readiness, canonical domain errors, and rollback behavior.
- Preserve the authoritative Rust AI validation, prompt projection/escaping, context budget, and debug-only raw inference IPC boundary from ADR-008.

No database migration or data rewrite is required for this access-policy change. Existing customized data remains usable. The repository branch name and older document filenames are retained for continuity; they do not imply a paid tier.

## Alternatives

- **Keep Free/PRO:** Rejected by the product owner; commercial activation and verification are unnecessary for the chosen product.
- **Always report PRO or enable developer premium:** Rejected; an open product should not manufacture commercial authorization or rely on a debug override.
- **Open the UI only:** Rejected; native commands would still deny customization in normal/release use.

## Validation and acceptance

- **TEST-OPEN-001:** A fresh local configuration can create, rename/update, reorder, and safely remove stages/categories/templates without an entitlement provider. Native schema and domain failures still reject invalid operations atomically.
- **TEST-OPEN-002:** Customization and AI entry controls render without commercial locks or an entitlement context. Local model selection is exposed in normal builds.
- **TEST-OPEN-003:** Native operations retain referential integrity, publication invariants, template copy independence, and history preservation.
- **TEST-AI-001/002:** Unclassified stages preserve valid-evidence availability; recommended semantics cannot bypass native evidence validation. The six editorial AI actions remain available subject to evidence/runtime requirements.
- Validate frontend tests, lint/build/type checking, native debug/release tests, formatting, and raw-inference registration checks.

The old entitlement transition, downgrade-denial, and developer premium tests are retired, rather than counted as security coverage for an access policy that no longer exists.

## Consequences and limits

This removes commercial state/verification work from the remaining development scope. Domain integrity and AI safety still require validation. It does not change the project's legal license, add cloud AI, enable collaboration, or implement a commercial service. Those would require separate decisions.

Independent technical/security review, merge authorization, and release/tag authorization remain pending. This policy approval does not claim any of those gates passed.

## References

- [ADR-008](ADR-008-EDITORIAL-AI-ORCHESTRATION-BOUNDARY.md)
- [ADR-009](ADR-009-DYNAMIC-WORKFLOW-AND-AI-SEMANTICS.md)
- [ADR-010](ADR-010-CATEGORY-AND-CHECKLIST-PERSISTENCE.md)
- [Phase 6.4 implementation plan](../architecture/PHASE-6.4-IMPLEMENTATION-PLAN.md)
- [Current validation report](../testing/PHASE-6.4-SLICE-7-OPEN-EDITION-VALIDATION.md)
