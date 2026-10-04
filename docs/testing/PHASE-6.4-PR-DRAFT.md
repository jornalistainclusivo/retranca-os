# Phase 6.4 — open editorial workflows and closure corrections

This PR integrates the editorial customization work after the Phase 6.3 baseline. Authors can use dynamic workflow stages, categories and checklist templates in one open edition (ADR-013). Stage semantics and publication roles govern the views and editorial AI recommendations; native Rust continues to enforce AI evidence/runtime requirements.

Article analysis text is saved per article (ADR-014), with a managed schema-2 migration and backup preparation. JSON import adds new IDs and preserves existing articles atomically in desktop SQLite (ADR-015). AI cancellation, modal dismissal/focus handling and the already accepted model inventory/recovery increment are included. The closure corrective associates CMS/template labels and makes Calendar article opening keyboard-operable through native buttons.

Unused development Firebase tooling is removed; js-yaml and aligned Vitest/UI resolve to patched versions. README now identifies the current integration state, platform evidence and distribution limits. Future features belong to a separate branch.

## Validation

- Local closure candidate: 289 frontend tests across 26 files; types, lint and Next static build passed.
- Isolated Chrome on Windows: 11 corrected label associations and label activation; template selection/application by keyboard; Calendar Tab/Enter/Space and Escape focus return; sampled CMS reflow at 320 CSS pixels passed.
- [CI 37212420511](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37212420511) passed frontend, Windows/Linux Rust and required `rust` aggregate on `7e9702be4b687f1a89a50b4e2070d95f85a0080f`. This precedes the closure corrective. Final PR checks must validate the published candidate.
- Earlier owner-reported AI, CMS persistence/import, settings and inventory checks remain accepted on their recorded revisions. The sealed static security review covers its stated earlier immutable range; it is not a new independent scan of this closure patch.

## Acceptance and limitations

Keep this PR in Draft until Gate B is resolved against the agreed acceptance criteria. Desktop/NVDA confirmation of the new corrective and explicit owner decisions on remaining manual/runtime evidence are pending. Browser checks do not establish full WCAG conformance.

The current audit still reports seven affected npm package entries (one critical, six high); Linux glib 0.18.5 remains `needs_review`. Static triage found no supported Next ImageResponse or editorial glob-input route in the current application; affected packages remain, and Linux indirect/optimized runtime behavior is unverified. The proposed limited source-integration risk decision has not been accepted. No default-branch Dependabot alert was dismissed.

Windows development operation has owner-reported evidence. CI checks/tests pass on Windows/Linux; it does not build/install release bundles, prove real bundled inference or establish clean install/upgrade/recovery. Installer/model delivery, license selection and release acceptance remain separate. No database migration, model download or installer was executed during this closure corrective.

Specific owner authorization is required for merge and separately for tag/release. A milestone tag is optional after an authorized merge; installable releases are not justified by current evidence.

Full evidence, bounded desktop handoff and open decisions: [Phase 6.4 closure candidate](PHASE-6.4-CLOSURE-2026-10-04.md).
