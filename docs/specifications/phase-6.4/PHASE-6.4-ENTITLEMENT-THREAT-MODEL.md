# Phase 6.4 Entitlement Threat Model

## 1. Status
THREAT MODEL — ANALYSIS ONLY — NO ENTITLEMENT ARCHITECTURE APPROVED

## 2. Objective
Identify and model the security threats related to the implementation of PRO Entitlement in Retranca OS, factoring in the limitations of a local-first desktop trust model.

## 3. Assets
- editorial content;
- workflow configuration;
- category configuration;
- checklist templates;
- entitlement state;
- any future entitlement proof/material, if used;
- downgrade-preserved configuration;
- local persistence integrity;
- commercial mutation authorization state.

## 4. Trust Boundaries
- React/TypeScript UI;
- Tauri IPC boundary;
- Rust/native application layer;
- SQLite/local files;
- OS / local privileged user;
- network boundary IF external verification is later selected;
- future external commercial authority IF one is selected.

*(Note: Rust/Tauri is only more trusted relative to frontend state within the application model. No hypothetical external service is labeled as already trusted or authoritative).*

## 5. Threat Model — Attacker Capabilities
**Ordinary User:**
- frontend state modification;
- direct IPC invocation;
- network interruption.

**Local Privileged/Admin Attacker:**
- local DB/file editing;
- binary patching;
- memory tampering;
- entitlement material copying;
- replay of stale entitlement state;
- rollback to older local state;
- system clock manipulation;
- developer/debug override abuse;
- downgrade-state manipulation;
- spoofed/replayed verification responses;
- TOCTOU (Time-of-Check to Time-of-Use) between displayed status and protected mutation.

## 6. Security Invariants
- authorization outside frontend-only state;
- authenticity;
- freshness;
- replay resistance;
- rollback awareness;
- data-preserving downgrade;
- recoverability;
- frontend state alone cannot constitute production entitlement authority;
- hidden/disabled UI cannot be the only protection for PRO mutations;
- DEVELOPER_PREMIUM cannot grant production entitlement in release;
- protected commercial mutations require authorization at a boundary more trusted than frontend UI state;
- entitlement uncertainty must never destroy editorial data;
- preserved PRO-created data remains recoverable;
- temporary verification failure must respect the approved local-first product behavior;
- downgrade enforcement must preserve content/configuration;
- any local proof, IF used, must have authenticity/freshness properties appropriate to the selected architecture.

## 7. Offline Product × Security Tension
**PRODUCT:** Temporary verification failure cannot itself block previously valid PRO work/configuration editing.
**SECURITY:** Indefinitely accepting stale/forged local state could defeat commercial entitlement.

**Decision Dimensions (No decisions made yet):**
- freshness;
- revocation expectations;
- offline duration;
- local clock trust;
- rollback resistance;
- machine/install association;
- recovery;
- entitlement refresh;
- user support/recovery;
- false denial versus false grant tradeoff.

## 8. Downgrade vs Temporary Unverifiability
**TEMPORARILY UNVERIFIABLE:**
- previously valid PRO;
- ordinary work continues;
- existing PRO configuration use/editing is not blocked solely because verification is temporarily unavailable.

**DOWNGRADED FREE:**
- content/configuration preserved;
- no silent remapping;
- new PRO configuration changes denied.

## 9. Risk Register

*(Note: Qualitative likelihood ratings are analytical estimates, not measured probabilities. "Required Security Property" remains mechanism-neutral).*

| Threat | Attacker Class | Likelihood | Impact | Affected Asset | Required Security Property | Residual Risk / Unknown |
| --- | --- | --- | --- | --- | --- | --- |
| Frontend bypass | Ordinary User | HIGH | LOW | Commercial Auth | Authorization outside frontend-only state | LOW |
| Direct IPC invocation | Ordinary User | MEDIUM | HIGH | Commercial Auth | Authorization outside frontend-only state | LOW |
| Forged PRO state | Admin | MEDIUM | HIGH | Commercial Auth | Authenticity | UNKNOWN |
| Stale/replayed entitlement | Admin | HIGH | HIGH | Commercial Auth | Freshness / Replay resistance | UNKNOWN |
| Copied entitlement | Admin | LOW | HIGH | Commercial Auth | Recoverability | UNKNOWN |
| Local state rollback | Admin | LOW | MEDIUM | Com. Auth / Config | Rollback awareness | UNKNOWN |
| Clock rollback | Admin | HIGH | HIGH | Commercial Auth | Freshness | UNKNOWN |
| Downgrade bypass | Admin | MEDIUM | HIGH | Commercial Auth | Authorization outside frontend | LOW |
| Unauthorized PRO mutation while Free | Ordinary User | MEDIUM | HIGH | Workflow Config | Authorization outside frontend | LOW |
| Configuration corruption/loss | System | LOW | HIGH | Config / Editor Data | Data-preserving downgrade | LOW |
| Developer/debug abuse | Admin | LOW | HIGH | Commercial Auth | Authenticity | LOW |
| TOCTOU | Admin | LOW | MEDIUM | Commercial Auth | Atomicity | LOW |
| Indefinite offline/stale-state abuse | Ordinary User | MEDIUM | MEDIUM | Commercial Auth | Freshness | UNKNOWN |
| Denial of service against legitimate PRO | System/Network | LOW | HIGH | Editor Data | Recoverability | LOW |
| Destructive downgrade | System | LOW | HIGH | Editor Data | Data-preserving downgrade | LOW |
| External-verification spoofing | Admin/Network | LOW | HIGH | Commercial Auth | Authenticity / Replay resistance | UNKNOWN |

## 10. Explicit Non-Decisions
This document explicitly confirms NO decision yet on:
- workflow persistence representation;
- identifier format;
- semantic-role representation;
- category schema;
- checklist-template schema;
- entitlement authority implementation;
- licensing/activation model;
- authentication requirement;
- external provider;
- payment provider;
- proof/token/license format;
- cryptographic format;
- offline freshness duration;
- secure-storage mechanism;
- machine binding;
- revocation mechanism;
- downgrade enforcement implementation.

## 11. Document Status
Human architecture decisions are required before ADRs can be accepted and before SDD may begin.
