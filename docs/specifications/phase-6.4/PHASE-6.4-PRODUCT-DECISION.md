# Phase 6.4 Product Decision

## 1. Status

APPROVED — HUMAN PRODUCT OWNER

## 2. Decision Context

Reference:
- PHASE-6.4-FREE-BASELINE-CAPABILITY-INVENTORY.md
- PHASE-6.4-PRODUCT-ACCESS-AND-MONETIZATION-DISCOVERY.md

This decision resolves the Product Discovery gate and becomes a normative input for the Phase 6.4 PRD.

## 3. Free Product Decision

The current functional Retranca OS baseline remains the Free product.
No existing Free capability may be removed or artificially restricted to manufacture the PRO tier.
Existing local AI capabilities and the six Phase 6.3 editorial AI actions remain part of the Free baseline.

## 4. PRO Product Direction

The initial PRO value proposition is: PRO = Editorial Workflow Customization.

The following capabilities are approved as the initial PRO product direction:
- rename workflow stages;
- add workflow stages;
- remove workflow stages;
- reorder workflow stages;
- custom categories;
- custom checklist templates.

The following capabilities remain DEFERRED:
- custom editorial metadata fields;
- multiple concurrent workflows;
- saved workflow templates;
- import/export configuration;
- team collaboration;
- cloud sync;
- managed backup;
- hosted AI services.

Approval as a PRO product capability does NOT authorize implementation.

## 5. Editorial AI Invariant

status recommends;
validated evidence determines action availability.

The technical mechanism used to preserve recommendation semantics for custom workflow stages is NOT decided in this Product Decision. It must be resolved later through architecture/design work.

## 6. Identity / Local-First Decision

A Retranca account or mandatory cloud login is NOT a product requirement for the local Free experience. The initial PRO product direction must preserve meaningful offline/local-first operation after valid entitlement activation.

Preserve:
Payment != Product Identity != Authentication != Authorization != Entitlement

The following remain UNDECIDED:
- licensing architecture;
- activation mechanism;
- identity architecture;
- authentication architecture;
- entitlement verification;
- secure credential/license storage;
- commercial provider;
- payment provider.

These require later architecture/security analysis.

## 7. Downgrade Safety Invariant

Downgrading from PRO to Free must NEVER:
- delete user content;
- silently remap custom workflow stages;
- corrupt articles;
- destroy custom categories;
- destroy custom checklist configuration.

PRO configuration and associated user data must remain recoverable. The exact downgrade UX remains undecided. Possible future UX such as frozen/read-only configuration, reactivation, or migration is NOT selected here.

## 8. Explicit Non-Authorization

This Human Product Decision authorizes subsequent Phase 6.4 product requirements work.

It does NOT authorize:
- application implementation;
- source-code changes;
- database migrations;
- entitlement implementation;
- authentication implementation;
- licensing implementation;
- payment integration;
- provider selection;
- Phase 6.5 provider/model work.

## 9. Next Authorized Product Phase

Phase 6.4 Product Requirements / PRD

Architecture, ADR, security design, SDD, and implementation remain subsequent gated work.
