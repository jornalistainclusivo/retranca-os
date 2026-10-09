# Phase 6.5 — Windows pilot packaging artifact identity

Date: 2026-10-08. Status: local correction prepared; commit, publication and integration pending. This additive receipt contract follows the [isolated packaged-pilot boundary](PHASE-6.5-INCREMENT-5-PACKAGED-PILOT.md); it changes no application, persistence or AI-provider contract and requires no new architecture decision.

## Problem and audited scope

The raw executable restored after an unsigned NSIS build is not byte-identical to the installed payload. In the pinned [Tauri CLI 2.11.4 bundler source](https://github.com/tauri-apps/tauri/blob/tauri-cli-v2.11.4/crates/tauri-bundler/src/bundle.rs), packaging changes the internal bundle token from `__TAURI_BUNDLE_TYPE_VAR_UNK` to `__TAURI_BUNDLE_TYPE_VAR_NSS` and restores the raw executable afterward. The [accepted candidate identity comparison](../../testing/PHASE-6.5-INCREMENT-7-INTEGRATION.md#installed-executable-identity) demonstrated this exact transformation.

Scope is the existing unsigned Windows x64 NSIS Pilot built with `--no-sign`, audited CLI version `2.11.4` and existing isolated product/configuration. This is a derived expectation, not extraction from an installer or observation of an installed executable. It does not support signed output or certify arbitrary executable bytes.

## Receipt schema 2

The existing `build.json` fields remain; schema 2 adds `receipt_schema: 2`, `tauri_cli_version`, artifact roles and `expected_installed_executable`.

| Record | Identity and meaning |
| --- | --- |
| `artifacts[0]`, role `raw-executable` | Exclusive copy of the restored compiled executable; its actual file path, size and SHA-256. |
| `artifacts[1]`, role `nsis-installer` | Exclusive copy of the selected fresh installer; its actual file path, size and SHA-256. |
| `expected_installed_executable` | Expected unsigned NSIS executable identity: file name, byte count, expected SHA-256, raw SHA-256, `NSS` marker, audited CLI version and explicit derived/not-observed verification text. |

The expected record is not a copied artifact and has no installed path. Application-installed acceptance remains pending in a newly produced receipt. Existing receipts and previously accepted installation evidence remain historical and are not rewritten.

Input hashes now also record the installed CLI package metadata and npm lockfile. Existing configuration/helper input checks, separate target/output directories, locked native build, clean-source requirement, installer selection and lifecycle guards remain. These hashes identify selected inputs; they are not a complete source/build attestation or signature.

## Validation and failure behavior

1. Read the installed CLI version and require exactly `2.11.4` before `--check` or an expensive build. An upgrade needs a new upstream review and regression evidence.
2. Require binary `Buffer` input and exactly one bundle-marker prefix. Reject absent, duplicate, mixed, already patched, partial or unknown markers.
3. Copy the raw bytes in memory, replace only the audited fixed-length token and hash the expected bytes. Preserve the original input and raw file.
4. Copy raw executable and installer with exclusive-create semantics. Hash the copied files and require the copied raw hash to match the raw input used for derivation.
5. Accept `compiled` only after artifact identity and the existing input-stability guards succeed. A derivation/copy failure cannot report successful compilation.

No fallback uses the raw hash as the installed hash. No rule normalizes arbitrary binary differences. No model/app/installer execution, database change, dependency upgrade or release publication is part of this correction.

## Evidence and remaining boundaries

See the [bounded local validation](../../testing/PHASE-6.5-PACKAGING-ARTIFACT-IDENTITY-VALIDATION.md) and [developer build commands](../../development/LOCAL-DEVELOPMENT.md#private-windows-pilot-build).

Synthetic regression tests and comparison with the accepted candidate cover this producer's current derivation. They do not validate a newly built installer, installation on another computer, signatures, future toolchains, Linux packaging, model quality or accessibility conformance. Public distribution remains governed by the [Phase 6.5 plan](../../architecture/PHASE-6.5-PRODUCTION-EXPERIENCE-PLAN.md).
