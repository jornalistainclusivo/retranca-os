# Phase 6.4 — Slice 6 corrective validation

Date: 2026-09-29 (America/Sao_Paulo).
Branch: `feat/phase-6.4-pro-workflow-customization`.
Baseline: `4f9df53` (feature branch consolidated with the merged Linux documentation and Windows/Linux CI).

## Changes and regression coverage

- Stage updates distinguish omitted classification (preserve) from explicit JSON `null` (clear). UI, native IPC, and browser persistence agree. Native SQLite regression coverage verifies publication-role preservation, invalid-classification rejection without partial writes, and all five entitlement authorization states.
- Both stage selectors expose the complete approved semantic vocabulary, including `PUBLISHED`. Semantic changes never assign or transfer the publication lifecycle role.
- Short non-empty stage/category names are accepted; the undocumented three-character minimum was removed. Empty and duplicate names remain rejected.
- Workflow display and reorder operations use active stages sorted by `orderIndex`; creation counts active stages only.
- Template editing copies item objects and updates them immutably. Cancel no longer changes the displayed original template. Empty items cause an explicit validation error instead of being silently removed from a submitted list.
- Protected template edit controls are disabled if entitlement changes to a denied state during an open edit. Existing configuration remains visible, and applying existing templates remains an ordinary editorial operation.
- Settings tabs have linked tab/panel IDs, roving tab stops, and ArrowLeft/ArrowRight/Home/End navigation. Inputs and icon buttons have accessible names and visible keyboard focus. Success/error feedback uses status/alert regions.
- Edit/cancel/save restores focus to the relevant trigger; stage reordering retains focus on an enabled ordering control; removal focuses the reassignment selector. Publication-stage removal explains the role transfer and its effect on articles already at the target.
- Symbolic tests that merely constructed payloads or simulated reordering were removed. Replacement tests render the actual `WorkflowEditor` across the five entitlement states and test the real adapter/SQLite update path.

## Automated validation

| Check | Result |
| --- | --- |
| `npm test` | 160 passed across 14 files |
| `npm run lint` | Passed; existing ESLintIgnoreWarning |
| `npm run build` | Passed; static export and TypeScript |
| `npm run lint:rs` | Passed; formatting and locked debug check |
| `cargo test --manifest-path src-tauri/Cargo.toml --locked` | 101 passed (70 unit + 31 integration) |
| `cargo check --manifest-path src-tauri/Cargo.toml --release --locked` | Passed |
| `cargo test --manifest-path src-tauri/Cargo.toml --release --locked` | 101 passed |
| `node scripts/security-enforcement-test.mjs` | Passed |
| `git diff --check` | Passed |

Existing Rust unused-import/variable warnings and the Vite configuration warning remain. No new package or test framework was installed.

## Interactive validation

The real component was bundled with existing local tooling and exercised in the in-app browser on an isolated localhost origin. Only the entitlement presentation hook was replaced by a selectable fixture; domain mutations used the existing browser storage/API implementation and disposable test data.

Verified: clearing classification while retaining publication role; creating the short name `IA`; duplicate-name error announcement; tab navigation by arrow/Home/End; stage reordering and focus; publication-removal explanation and required target; template item ordering and save; editing then canceling without changing the original; denied template controls after downgrade while editing; preserved template visibility in all five states; and template application to an article while confirmed Free.

Focus was checked against the actual active DOM element after stage save, stage reorder, removal entry, and template save. Browser interaction verifies the keyboard/focus scenarios above and the accessible markup, but is not a formal screen-reader or WCAG certification.

## Scope and remaining gates

This closes the corrective items identified for Slice 6 in this handoff. It does not declare the entire Phase 6.4 complete or pass independent Gate B. Validation here ran on Windows; the consolidated CI provides Windows/Linux verification when the branch is submitted.

Slice 7 remains pending: replace legacy AI recommendation statuses with dynamic stage classification and remove the old premium UI restriction from the six Free editorial AI actions. Slice 8 and the phase-wide security/integration review remain pending. Commercial entitlement adapters, payment, authentication, and production provider/model policy remain deferred.
