# Phase 6.4 Entitlement Threat Model

## 1. Status
THREAT MODEL — ANALYSIS ONLY — NO ENTITLEMENT ARCHITECTURE APPROVED

## 2. Objective
Identify and model the security threats related to the implementation of PRO Entitlement in Retranca OS, factoring in the limitations of a local-first desktop trust model.

## 3. Threat Model — Attacker Capabilities
**Ordinary User capabilities:**
- frontend state modification (DevTools, React Developer Tools);
- network interruption (going offline);
- direct IPC invocation (via console).

**Local privileged/admin attacker capabilities:**
- local DB/file editing (SQLite modifications);
- binary patching;
- memory tampering;
- entitlement material copying (moving a license file between machines);
- replay of stale entitlement state;
- rollback to older local state (restoring a file backup);
- system clock manipulation;
- developer/debug override abuse;
- downgrade-state manipulation;
- spoofed/replayed verification responses;
- TOCTOU (Time-of-Check to Time-of-Use) between displayed status and protected mutation.

## 4. Threat Model — Required Threats
This model analyzes the following threats generically (without assuming a specific architecture):
- **Frontend feature-flag bypass:** Attacker modifies React state to unlock UI.
- **Forged PRO state:** Attacker injects a fake local entitlement status.
- **Stale/replayed entitlement:** Attacker prevents the app from receiving a revocation signal by replaying old successful responses.
- **Copied entitlement between installations:** Attacker copies a valid PRO state from one machine to another.
- **Rollback attack:** Attacker restores a previous valid database/state file after their PRO expires.
- **Clock rollback:** Attacker changes OS time to prevent offline expiration.
- **Downgrade bypass:** Attacker manages to create new PRO configurations despite being in a downgraded state.
- **Unauthorized creation/mutation of PRO configuration while Free:** Attacker invokes IPC directly to create a custom stage.
- **Corruption or loss of preserved custom configuration:** System accidentally deletes custom stages during a downgrade or temporary offline state.
- **Developer premium abuse:** Attacker attempts to trigger the `DEVELOPER_PREMIUM` debug flag in a release build.
- **IPC authorization bypass:** Attacker finds a missing entitlement check on a protected mutation.
- **TOCTOU:** Attacker passes an entitlement check, then rapidly changes state before the database write occurs.
- **Temporary-offline abuse:** Attacker stays offline indefinitely to avoid revocation.
- **Indefinite stale entitlement risk:** The risk of trusting local state forever without re-validation.
- **Denial of service against legitimate PRO:** Legitimate user is locked out of PRO features due to network outage or local state corruption.
- **Accidental destructive downgrade:** The system correctly downgrades the user but improperly remaps or deletes their PRO data.
- **External-verification spoofing:** (IF an external verifier model were used) Attacker intercepts and modifies the network response from the licensing server.

## 5. Security Invariants — Properties, Not Mechanisms
- Frontend state alone cannot constitute production entitlement authority.
- Hidden/disabled UI cannot be the only protection for PRO mutations.
- `DEVELOPER_PREMIUM` cannot grant production entitlement in release.
- Protected commercial mutations require authorization at a boundary more trusted than frontend UI state.
- Entitlement uncertainty must never destroy editorial data.
- Preserved PRO-created data remains recoverable.
- Temporary verification failure must respect the approved local-first product behavior.
- Downgrade enforcement must preserve content/configuration.
- Any local proof, IF used, must have authenticity/freshness properties appropriate to the selected architecture.

*(Note: JWT, token, keychain, license file, server session are NOT selected mechanisms, merely OPTION EXAMPLES for future ADRs).*

## 6. Offline Product × Security Tension
**The Tension:**
- **PRODUCT:** Temporary verification failure cannot itself block previously valid PRO work/configuration editing.
- **SECURITY:** Indefinitely accepting stale/forged local state could defeat commercial entitlement.

**Decision Dimensions to evaluate (No decisions made yet):**
- freshness (how old can the local state be?);
- revocation expectations (how fast must a cancellation take effect?);
- offline duration (is there a limit?);
- local clock trust (how do we handle clock manipulation?);
- rollback resistance;
- machine/install association;
- recovery;
- entitlement refresh;
- user support/recovery;
- false denial versus false grant tradeoff.

## 7. Risk Register
| Threat | Likelihood | Impact | Affected Asset | Required Architectural Property | Residual Risk / Unknown |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Frontend bypass | HIGH | LOW | UI Integrity | Native IPC mutation enforcement | LOW (if IPC is secured) |
| IPC direct invocation | MEDIUM | HIGH | Com. Integrity | IPC boundary entitlement checks | LOW |
| Clock rollback | HIGH | MEDIUM | Com. Integrity | Clock-independent freshness/offline duration | UNKNOWN (Admin attacker) |
| Entitlement cloning | LOW | HIGH | Com. Integrity | Machine/install association | UNKNOWN (Depends on auth model) |
| Destructive downgrade | LOW | HIGH | Data Integrity | Downgrade preserves configuration | LOW (if DB schema is safe) |
| Spoofed external verify | LOW | HIGH | Com. Integrity | Cryptographic local verification | UNKNOWN |

## 8. Downgrade vs Temporary Unverifiability
These states must remain strictly distinct in any implementation:

**TEMPORARILY UNVERIFIABLE:**
- The user was previously valid PRO.
- Ordinary editorial work continues.
- Existing PRO configuration use/editing is **not blocked** solely by temporary verification failure.

**DOWNGRADED FREE:**
- PRO entitlement is explicitly no longer active.
- Editorial content and existing configuration are **preserved**.
- **New** PRO configuration changes are **denied**.
- No destructive remapping occurs.

*(Enforcement granularity for editing existing PRO configuration while downgraded is a decision dependency, not an assumed product behavior).*

## 9. Explicit Non-Decisions
This document explicitly confirms no decision yet on:
- workflow persistence representation;
- semantic role representation;
- category schema;
- checklist-template schema;
- entitlement authority implementation;
- licensing/activation model;
- identity/authentication requirement;
- external commercial provider;
- payment provider;
- local entitlement material format;
- cryptographic format;
- offline freshness duration;
- secure-storage technology;
- machine binding;
- revocation mechanism;
- downgrade enforcement implementation.
