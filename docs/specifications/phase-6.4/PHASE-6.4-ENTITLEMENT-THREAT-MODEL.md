# Phase 6.4 Entitlement Threat Model

## 1. Status
PHASE 6.4 — SECURITY DISCOVERY

## 2. Objective
Identify and model the security threats related to the implementation of PRO Entitlement in Retranca OS. This model guides the architectural design of the entitlement and downgrade enforcement boundaries.

## 3. System Boundaries and Assets

### 3.1 Trust Boundaries
- **Untrusted:** React Frontend (UI state, local storage, memory).
- **Semi-Trusted:** Local SQLite Database (user has physical access to the file and can theoretically manipulate it outside the application).
- **Trusted (Enforcement):** Rust Tauri Backend (performs IPC validation, queries, and cryptographic checks).
- **Trusted (External):** Future Licensing/Auth Provider (Out of scope for Phase 6.4, but represents the ultimate source of truth for commercial status).

### 3.2 Assets to Protect
1. **PRO Capabilities (Commercial Integrity):** Prevent unauthorized access to PRO configuration creation.
2. **Editorial Content (Data Integrity):** Ensure commercial state transitions (downgrades) never corrupt, orphan, or delete user editorial data.
3. **Local-First Reliability (Availability):** Ensure network failures do not lock out valid users from their own local data.

## 4. Threat Scenarios (STRIDE)

### 4.1 Spoofing
- **Threat:** User spoofs a valid entitlement response by intercepting network traffic to the licensing provider.
- **Mitigation Requirement:** The Rust backend must cryptographically verify the entitlement material (e.g., using a public key to verify a signed JWT from the provider), rather than trusting boolean API responses.

### 4.2 Tampering
- **Threat 1 (Memory):** User tampers with the React state (e.g., using DevTools) to set `isPremium: true`.
- **Mitigation Requirement:** React state only controls UI visibility. The Rust backend must re-verify entitlement on every PRO IPC command (e.g., `create_custom_stage`).
- **Threat 2 (Database):** User modifies the SQLite database directly to insert custom workflow stages without PRO.
- **Mitigation Requirement:** While physical database access is inherently untrusted in a local app, the Rust backend must block the *application* from writing new PRO configurations if not entitled. (Note: Preventing direct SQLite tampering by advanced users is generally accepted as out-of-scope for standard local apps, but the application itself must not facilitate it).
- **Threat 3 (Token Tampering):** User modifies the locally cached entitlement token to extend its expiration date.
- **Mitigation Requirement:** Cached entitlement material must be cryptographically signed.

### 4.3 Repudiation
- **Threat:** User claims they did not downgrade, but their app restricts features.
- **Mitigation Requirement:** Clear UI indicators of entitlement status (Active, Expired, Offline) driven by the Rust backend.

### 4.4 Information Disclosure
- **Threat:** Entitlement tokens or cryptographic secrets are stored in plaintext in insecure locations.
- **Mitigation Requirement:** Entitlement material must be stored using the OS native secure credential store (e.g., macOS Keychain, Windows Credential Manager) via Tauri plugins, not in plaintext SQLite or localStorage.

### 4.5 Denial of Service
- **Threat:** Network outage prevents the app from contacting the licensing server, locking the user out of their editorial workflow.
- **Mitigation Requirement:** The system must implement a "Temporarily Unverifiable" state that trusts the last known valid, cryptographically verified local token until it reaches a hard offline expiration limit.

### 4.6 Elevation of Privilege
- **Threat:** A Free user figures out how to trigger the IPC command to create a custom stage because the command is exposed.
- **Mitigation Requirement:** All PRO-only IPC commands must internally perform the cryptographic entitlement check before executing the database transaction.

## 5. Security Invariants for Phase 6.4 Architecture
1. **Rust Authority:** Entitlement is strictly evaluated in Rust. The frontend only reflects Rust's evaluation.
2. **Cryptographic Trust:** Offline entitlement must rely on signed material, not boolean flags in a database.
3. **Fail-Safe Data:** Any entitlement evaluation failure must fail open for *reading* and *editing existing* data, but fail closed for *creating new* PRO configurations.

## 6. Next Steps
- HUMAN DECISION READINESS REQUIRED.
- Pending Human Authorization: Draft ADR for Entitlement Security and Downgrade Boundaries.
