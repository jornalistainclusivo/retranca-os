# Phase 6.4 — open editorial workflows and closure corrections

This PR integrates the editorial customization work after the Phase 6.3 baseline. Authors can use dynamic workflow stages, categories and checklist templates in one open edition (ADR-013). Stage semantics and publication roles govern the views and editorial AI recommendations; native Rust continues to enforce AI evidence/runtime requirements.

Article analysis text is saved per article (ADR-014), with a managed schema-2 migration and backup preparation. JSON import adds new IDs and preserves existing articles atomically in desktop SQLite (ADR-015). AI cancellation, modal dismissal/focus handling and the already accepted model inventory/recovery increment are included. The closure corrective associates CMS/template labels and makes Calendar article opening keyboard-operable through native buttons.

Unused development Firebase tooling is removed; js-yaml and aligned Vitest/UI resolve to patched versions. README now identifies the current integration state, platform evidence and distribution limits. Future features belong to a separate branch.

## Validation

- Local closure candidate: 289 frontend tests across 26 files; types, lint and Next static build passed.
- Isolated Chrome on Windows: 11 corrected label associations and label activation; template selection/application by keyboard; Calendar Tab/Enter/Space and Escape focus return; sampled CMS reflow at 320 CSS pixels passed.
- [PR CI 37243860825](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37243860825) passed frontend, Windows/Linux Rust and required `rust` aggregate on `8fd28e1f007cd0b46441b6b165361d819855b913`, including the closure corrective. Later documentation publication requires its own HEAD checks.
- Windows desktop, NVDA 2026.2 and keyboard: the owner accepted CMS names/editing, template selection/application, and the retested Calendar script. These are human reports, not independently captured speech transcripts.
- Earlier owner-reported AI, CMS persistence/import, settings and inventory checks remain accepted on their recorded revisions. The sealed static security review covers its stated earlier immutable range; it is not a new independent scan of this closure patch.

## Acceptance and limitations

The owner approved the bounded source-integration scope on 2026-10-04 and authorized documentation publication, Ready status and merge commit only after the four jobs pass on the final published HEAD. Gate B is closed for this limited code-integration scope. The three desktop/NVDA checks are accepted; broader error/status announcements, zoom, contrast, reduced motion and installer/runtime evidence remain open before distribution. Sampled automated and manual checks do not establish full WCAG conformance.

The current audit still reports seven affected npm package entries (one critical, six high). Static triage found no supported Next ImageResponse or editorial glob-input route. The follow-up searched all 442 resolved Linux package source directories: `VariantStrIter` / `array_iter_str` matches were confined to glib itself, with no application/downstream caller found. glib 0.18.5 remains affected; this narrows source reachability uncertainty without proving zero risk or packaged Linux acceptance. The proposed upstream GTK-chain update in Wry PR #1843 is still open and raises the Rust minimum; no unsupported major override or unreleased fork is introduced. The owner accepted bounded source integration using this evidence, retaining alerts/maintenance and blocking binary distribution until its applicable gates are satisfied. No default-branch Dependabot alert was dismissed.

Windows development operation has owner-reported evidence. CI checks/tests pass on Windows/Linux; it does not build/install release bundles, prove real bundled inference or establish clean install/upgrade/recovery. Installer/model delivery, license selection and release acceptance remain separate. No database migration, model download or Retranca installer was executed during this closure corrective.

Ready status and merge are explicitly authorized with the final-HEAD CI condition above. Tag/release are not authorized. A milestone tag is optional after merge; installable releases are not justified by current evidence.

Full evidence, bounded desktop handoff and open decisions: [Phase 6.4 closure candidate](PHASE-6.4-CLOSURE-2026-10-04.md).
