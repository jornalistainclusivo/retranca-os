# ADR 012: Hybrid Local-First Entitlement Architecture

## Status
Accepted — Human Architecture Decision

## Context
Phase 6.4 introduces commercial PRO entitlement strictly for Editorial Workflow Customization. The Free tier remains the current functional baseline. The existing local AI capability remains Free, and the six Phase 6.3 editorial AI actions remain Free. 

ADR-011 established the enforcement boundary: a hybrid of UI visibility and native/Tauri protected-mutation enforcement. However, ADR-011 intentionally deferred the source and lifecycle of production entitlement. Product requirements require meaningful local-first use and safe handling of temporary verification failure. The threat model identifies stale/replayed state, rollback, clock manipulation, copied entitlement material, false denial, and revocation limitations as material risks.

**Key Distinctions Preserved:**
- Payment != Product Identity != Authentication != Authorization != Entitlement
- Local AI capability != paid capability
- Developer override != production entitlement

## Evaluated Architecture Families
We previously considered three architectural families for entitlement authority:

**A. Local activation-derived entitlement authority:**
A valid commercial activation produces locally usable entitlement material/state. Runtime operation remains offline. 
*Trade-offs:* High resilience and local-first strength, but creates high copying/replay risks and difficult or delayed revocation.

**B. Periodically refreshed external authority + local continuity:**
External commercial authority is consulted periodically, while a previously-valid local representation supports temporary offline use.
*Trade-offs:* Strong revocation controls, but makes the external refresh authority the dominant model, creating a stronger connectivity and availability dependence than desired for Retranca OS's local-first product requirement.

**C. Hybrid local-first entitlement grant + optional online refresh/revocation:**
Initial activation establishes local entitlement state/proof. External refresh/revocation capability may exist when connectivity is available, but normal editorial operation remains local-first.
*Trade-offs:* Provides resilient offline behavior and balances the false-denial/false-grant trade-off, though it introduces complex implementation of hybrid states.

## Decision
We will use **Option C: Hybrid local-first entitlement grant with optional online refresh / revocation capability**.

**Normative Properties:**
- Production PRO authorization at runtime can be derived from locally usable production entitlement state/proof.
- Continuous connectivity is NOT required for ordinary editorial operation.
- A future external commercial authority MAY issue, refresh, update, or revoke entitlement when available.
- An external authority is NOT required to be continuously reachable.
- No specific commercial provider is selected.
- No specific network protocol is selected.

The local production representation must support security properties appropriate to its later mechanism:
- Authenticity
- Integrity
- Freshness where validity is time-bounded
- Replay-awareness/resistance
- Recovery semantics

## Commercial Model Flexibility
The architecture MUST NOT assume PRO is necessarily subscription-only, perpetual-only, or account-bound. It is capable of representing later commercial policies such as:
- Non-expiring entitlement
- Time-bounded entitlement
- Refreshable/revocable entitlement

These are CAPABILITIES of the architecture. They are NOT pricing decisions. No specific billing cadence (e.g., monthly, annual), trial, or subscription provider is selected.

## Application Entitlement States
The architecture defines the following states:

### UNKNOWN
No sufficient entitlement decision has been established.
- Protected PRO configuration mutations: **DENIED**.
- Editorial data/configuration: **PRESERVED** and usable for ordinary editorial work.

### FREE_CONFIRMED
Sufficient authoritative information establishes that PRO is not currently active.
- Protected PRO configuration mutations: **DENIED**.
- Existing editorial data and preserved custom configuration remain intact and usable under downgrade rules.

### PRO_ACTIVE
A valid production PRO entitlement is established.
- Protected PRO configuration mutations: **ALLOWED**, subject to normal business/data-integrity validation.

### PRO_TEMPORARILY_UNVERIFIABLE
Previously-valid PRO has been credibly established, but current verification/refresh is temporarily unavailable.
This state MUST NOT be entered solely because this is a first launch, the machine is offline, or no entitlement evidence exists.
- Ordinary editorial work continues.
- Existing PRO configuration remains usable.
- Configuration editing is not blocked solely because verification is temporarily unavailable.

### PRO_UNAVAILABLE
The application cannot currently authorize PRO mutations, but cannot truthfully classify the state as confirmed Free/downgrade.
Conceptually, continuity/freshness requirements can no longer be satisfied; required local entitlement state cannot be validated; entitlement state is corrupted; or status cannot currently be established.
- Protected PRO configuration mutations: **DENIED**.
- Editorial data and preserved configuration: **MUST remain intact, readable, recoverable, and usable for ordinary editorial work**.
CRITICAL: `PRO_UNAVAILABLE` != `FREE_CONFIRMED`. We do not silently convert uncertainty into a confirmed downgrade.

## State Transition Principles
- `UNKNOWN` → `PRO_ACTIVE` only after valid PRO is established.
- `UNKNOWN` → `FREE_CONFIRMED` only after sufficient authoritative Free/non-PRO decision.
- `PRO_ACTIVE` → `PRO_TEMPORARILY_UNVERIFIABLE` when current verification is unavailable AND previously-valid continuity remains acceptable.
- `PRO_TEMPORARILY_UNVERIFIABLE` → `PRO_ACTIVE` when valid PRO is re-established.
- `PRO_TEMPORARILY_UNVERIFIABLE` → `PRO_UNAVAILABLE` when temporary continuity can no longer be accepted but no confirmed Free/downgrade decision exists.
- `PRO_ACTIVE` or `PRO_TEMPORARILY_UNVERIFIABLE` → `FREE_CONFIRMED` only when sufficient authoritative information confirms PRO is no longer active.
- `PRO_UNAVAILABLE` → `PRO_ACTIVE` when valid PRO is restored.
- `PRO_UNAVAILABLE` → `FREE_CONFIRMED` when sufficient information confirms no active PRO entitlement.

## Offline / Revocation Trade-off
Because Retranca OS is local-first, instantaneous commercial revocation while a device is completely offline is NOT guaranteed. This is an accepted architectural limitation. Revocation or update becomes effective according to the eventual production design when local validity/freshness semantics require reevaluation, or an approved future authority can be reached and provides updated entitlement status.

## Recovery Invariant
Loss, corruption, rollback, expiration, or inability to validate entitlement material MUST NOT destroy or silently rewrite:
- Articles
- Workflow configuration
- Category configuration
- Checklist templates
- Article checklist state/history

Commercial entitlement recovery may later involve reactivation, revalidation, refresh, or another approved recovery flow. Those mechanisms remain deferred.

## Trust Boundary
ADR-011 remains authoritative. Frontend UI state != production authorization. Protected PRO customization mutations are authorized at the Tauri/native application boundary using the application entitlement decision. Tauri/native is more trusted than frontend application state, but it is NOT tamper-proof against a fully privileged local attacker. Residual local-admin risk remains accepted/documented.

## Rejected Alternatives
Option A was not selected because a purely local entitlement authority weakens practical revocation/freshness controls. Option B was not selected because making external refresh authority the dominant model creates stronger connectivity/availability dependence than desired for Retranca's local-first product requirement. 

## Deferred Decisions
Explicitly deferred items:
- Commercial provider
- Payment provider
- Activation channel
- Billing cadence
- Account model
- Authentication provider
- Entitlement proof/license/token format
- Cryptographic algorithm
- Signing key topology
- Secure-storage implementation
- Exact freshness duration
- Exact temporary continuity duration
- Machine/install binding
- Revocation protocol
- Clock/rollback implementation
- Entitlement recovery UX/protocol

## Relationships
- **ADR-011:** Defines WHERE protected PRO mutations are enforced.
- **ADR-012:** Defines the production entitlement architecture FAMILY and lifecycle semantics used by that enforcement boundary.
- **ADR-009 & ADR-010:** Remain independent domain/persistence decisions.
- **ADR-012** does NOT alter Phase 6.3 AI entitlement scope.
