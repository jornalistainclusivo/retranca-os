# ADR 009: Dynamic Workflow and Editorial AI Semantics

## Status

Accepted — Human Architecture Decision

## Context

The current `ArticleStatus` is a closed status type/enum representation, but Phase 6.4 requires user-customizable workflow stages (renaming, reordering, adding, removing). At the same time, Phase 6.3 currently uses status for its AI orchestrator recommendation logic.

Specifically, current Phase 6.3 UI recommendation behavior uses editorial status in TypeScript to distinguish RECOMMENDED from AVAILABLE. This frontend evaluation is UX/presentation behavior and is NOT authoritative security or orchestration authorization. Rust/Tauri revalidates evidence prerequisites authoritatively before AI execution. Phase 6.4 dynamic stages therefore require recommendation semantics to evolve without weakening evidence-based action availability. Display customization cannot be allowed to silently change AI availability semantics, nor can it break the predictable orchestration required for Phase 6.3 functionality.

## Evaluated Options

1. Stable dynamic stages without semantic classification
2. Stable semantic core + custom presentation
3. Dynamic stages + optional semantic classification
4. Derived semantic inference from stage names / heuristics

## Decision

**Dynamic stages with stable identity + OPTIONAL semantic classification.**

This architecture explicitly separates:
- **stage identity**
- **stage display name**
- **stage ordering**
- **optional recommendation semantic classification**

**Normative Requirements:**
- Stage identity survives rename.
- Stage identity survives reorder.
- Identifier FORMAT is NOT selected by this ADR.
- The standard five-stage Free workflow remains the default product baseline.
- Custom stages may optionally carry an editorial semantic classification.
- Semantic classification influences recommendation behavior only.
- Semantic classification MUST NOT determine action availability.
- Custom workflow stages MUST NOT map one-to-one to AI actions.
- A custom stage without semantic classification may have no stage-specific recommendation.
- Absence of a recommendation MUST NOT disable an AI action whose evidence prerequisites are satisfied.
- Stage removal must never orphan articles; affected articles must be resolved before removal can complete.

## Phase 6.3 Compatibility

**status recommends; validated evidence determines action availability.**

This ADR explicitly EXTENDS and DOES NOT REPLACE:
`ADR-008-EDITORIAL-AI-ORCHESTRATION-BOUNDARY.md`

ADR-008 remains authoritative for:
- TypeScript UI evaluation versus Rust authoritative validation;
- trusted/untrusted orchestration boundary;
- static trusted instructions;
- context-budget authority;
- provider dispatch boundary.

ADR-009 changes only the workflow/status model needed for Phase 6.4 customization and recommendation semantics.

## Consequences

- The current closed status type/enum representation must evolve into dynamic entities.
- Default Free stages need migration/backward compatibility to the new dynamic structure.
- Recommendation behavior can remain deterministic by referencing the optional semantic classification.
- Unclassified custom stages remain valid (but may lack specific AI recommendations).
- Subsystems like List, Kanban, Calendar, and Stats must eventually consume dynamic stages.

## Rejected Alternatives

- *Stable dynamic stages without semantic classification:* Rejected because it would decouple workflow from the Phase 6.3 orchestrator entirely, losing valuable editorial recommendations.
- *Stable semantic core + custom presentation:* Rejected as it is too restrictive for PRO users who need entirely novel stages that don't neatly map to a rigid core.
- *Derived semantic inference from stage names / heuristics:* Rejected because probabilistic inference conflicts with the deterministic orchestration requirements of Phase 6.3.

## Deferred Decisions

The following are explicitly deferred:
- identifier format (UUID vs integer vs string);
- exact database schema;
- migration SQL/mechanics;
- IPC/DTO structures or payloads;
- final Rust struct / TypeScript types;
- semantic classification vocabulary;
- UX for assigning/changing classification where applicable;
- recommendation UI copy;
- provider/model behavior.
