# ADR 011: PRO Entitlement Enforcement Boundary

## Status

Accepted — Human Architecture Decision

## Context

The current `DEVELOPER_PREMIUM` mechanism is a debug-only UI toggle used for testing. Production commercial entitlement does not yet exist. Because frontend-only enforcement is easily bypassable by end users, a stronger enforcement boundary is needed for PRO features. At the same time, the product's local-first behavior mandates that a temporary inability to verify commercial status must not destroy data or block previously-valid configuration.

## Security / Trust Model

This architecture explicitly distinguishes between:
- **React/TypeScript frontend:** Untrusted for authorization enforcement.
- **Tauri/native application boundary:** More trusted relative to frontend application state.
- **OS/local privileged attacker:** Fully untrusted environment.

Tauri/native is the designated application-level enforcement boundary. However, it is NOT trusted against a fully privileged attacker who can patch the binary, tamper with process memory, or arbitrarily modify local state.

## Evaluated Options

1. Frontend-only gating
2. Native/Tauri-only application enforcement
3. Hybrid UI visibility + native protected-mutation enforcement
4. Hybrid enforcement with locally usable entitlement state/proof and optional future external authority

## Decision

**Hybrid UI visibility + native protected-mutation enforcement.**

**Normative Requirements:**
- Frontend entitlement state is for presentation/discoverability only.
- Frontend state cannot constitute production authorization authority.
- Hidden or disabled UI alone is insufficient enforcement.
- Protected PRO configuration mutations require authorization at an application boundary more trusted than frontend state (i.e., the Tauri/native boundary).
- DEVELOPER_PREMIUM remains developer-only and MUST NOT become production entitlement authority.

The architecture must also support **locally usable entitlement state or proof** sufficient to satisfy the approved temporary-unverifiability behavior. The format of this proof is deferred.

## Downgrade vs Temporary Unverifiability

The system must distinguish between two states:

**TEMPORARILY UNVERIFIABLE PRO:**
- The user was previously valid PRO.
- Ordinary editorial work continues.
- Existing PRO configuration remains usable.
- Existing PRO configuration editing is not blocked solely because verification is temporarily unavailable.

**DOWNGRADED FREE:**
- Editorial content remains intact.
- Existing custom configuration remains preserved/recoverable.
- No destructive remapping occurs.
- New PRO configuration changes are denied.

## Security Consequences

- Frontend spoofing does not by itself authorize protected mutations, as the native layer validates authority.
- Direct IPC calls require application-level authorization.
- Local-admin bypass remains a residual risk, as the native boundary cannot prevent binary patching or memory manipulation.
- Fail-safe behavior strictly preserves editorial data.
- Entitlement uncertainty (verification failure) and confirmed Free (downgrade) represent fundamentally different states and must be handled distinctly to prevent destructive downgrade.

## Rejected Alternative

- *Frontend-only gating:* Rejected as fundamentally insufficient for commercial enforcement, as any user could trivially bypass UI restrictions.

## Deferred Decisions

The source of production entitlement remains deferred. The Human Architecture Decision DOES NOT mandate an external commercial verifier. Future models may include local activation-derived state, periodically refreshed external status, or a hybrid. 

The following are explicitly NOT decided by this ADR:
- licensing/activation model;
- identity requirement;
- authentication requirement;
- external verifier/provider;
- payment provider;
- entitlement material/proof format;
- cryptographic format;
- secure storage technology;
- freshness/offline duration limits;
- clock strategy;
- rollback resistance mechanism;
- machine/install association;
- revocation mechanism;
- recovery mechanism.
