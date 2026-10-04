# Phase 6.4 closure candidate — 2026-10-04

Status: scope frozen; local corrective validated; Gate B and merge acceptance pending.

## Frozen delivery and current revision

The owner directed this round to close Phase 6.4 without adding features. Keep the already accepted Phase 6.5 Increment 1 model inventory/recovery in the existing branch; subsequent increments belong in another branch. No history rewrite or feature removal is proposed.

On 2026-10-04, local HEAD and the GitHub feature branch matched `7e9702be4b687f1a89a50b4e2070d95f85a0080f`. GitHub comparison reported 84 commits ahead of `main`, zero behind; no open PR was returned. [CI 37212420511](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37212420511) completed successfully on that exact SHA: `frontend`, `rust (windows-latest)`, `rust (ubuntu-latest)` and required aggregate `rust`. The later corrective described here requires publication and its own PR checks; this CI does not validate the uncommitted candidate.

The live `main` protection requires `frontend` and `rust`, strict up-to-date checks and administrator enforcement. No protection or workflow was changed. Preserve the owner's separately authorized merge and tag/release gates.

## Bounded accessibility corrective

The owner confirmed saving and closing the application and `npx tauri dev` before edits.

| Finding | Candidate change | Observed verification | Remaining evidence |
| --- | --- | --- | --- |
| A11Y-CMS-LABELS-01 | Associate category, date, persona, CTA and notes with stable instance field IDs. Give internal/external links and estimated/spent time distinct visible labels. Name the custom checklist input. | Rendered association/unique-ID regression test; all 11 corrected labels activate their own controls in isolated Chrome. | Windows desktop/NVDA announcements. |
| A11Y-CMS-TEMPLATE-02 | Visible associated `Template de checklist` label; preserve template application behavior. | Chrome Space/arrow/Enter selection, Tab to Apply, Enter applies the synthetic item. | Native WebView/NVDA announcement and operation. |
| A11Y-CALENDAR-KEYBOARD-03 | Article pills are named native buttons with visible focus; previous/next month buttons are named. Existing modal hook retains focus restoration. | Tab reaches article; Enter and Space each open it; Escape closes and returns focus to the same article button. | Desktop/NVDA and broader Calendar zoom/layout review. |

The CMS candidate has internal `clientWidth = scrollWidth = 320` at a 320 CSS pixel viewport. All rendered labeled fields fit within that viewport. Screenshot inspection confirmed readable visible labels and reachable footer controls; this is a narrow reflow sample, not a test of every view or browser zoom setting. Chrome version: `154.0.8037.93`, Windows, isolated fresh browser context with a synthetic template and versioned example articles. No owner browser profile, native database, model or editorial export was accessed. Native IPC, save callbacks, provider choice, article values and persistence contracts were not changed.

The resumed focus check confirmed a solid 3-pixel computed Calendar focus outline and visually inspected its screenshot. The harness originally expected exactly 2 pixels and was corrected to accept the visible stronger outline; no product code changed for that check. The [prepared PR text](PHASE-6.4-PR-DRAFT.md) remains local until publication is explicitly authorized.

The normative references consulted on 2026-10-04 are [WCAG 2.2 1.3.1](https://www.w3.org/TR/WCAG22/#info-and-relationships), [2.1.1](https://www.w3.org/TR/WCAG22/#keyboard), [2.4.7](https://www.w3.org/TR/WCAG22/#focus-visible) and [4.1.2](https://www.w3.org/TR/WCAG22/#name-role-value). No WCAG conformance or real screen-reader result is claimed.

## Local candidate checks

| Command / check | Result |
| --- | --- |
| `npm test` | Pass: 289 tests, 26 files, including two rendered-control regression tests. |
| `npx tsc --noEmit --incremental false` | Pass, exit 0. |
| `npm run lint` | Pass, exit 0; existing `.eslintignore` flat-config warning retained. |
| `npm run build` | Pass: Next 16.3.4 static export, `/` and `/_not-found`. |
| Isolated compiled-browser corrective script | Pass: labels, template keyboard operation, Calendar Enter/Space, Escape focus return and sampled CMS reflow. |
| `git diff --check` | Pass; existing LF/CRLF conversion warnings are not test failures. |

Restricted initial runs failed before meaningful validation: Vitest cache rename `EPERM`, SWC workspace canonicalization access denied and PowerShell filesystem initialization stalls. Authorized unrestricted retries passed. The test warning about a future Vite native config loader remains recorded. The first browser harness attempts used an unavailable Edge path and then an incorrectly normalized Windows static-server root; the repaired harness used installed Chrome. Selecting an unopened native select with Enter initially submitted the form's required-field validation; the successful script used Space to open the select, then arrow keys and Enter. These harness failures are not passing product checks.

Rust was not rerun for this frontend/documentation-only change. The prior exact-source CI supplies Windows/Linux native check/test evidence; the next PR must run its existing matrix on the final published revision. No migration, model download or installer was executed.

## Residual security triage and proposed decisions

This is a bounded static triage of the previously recorded residual packages, separate from UI/runtime checks and from the [sealed changed-source review](../security/PHASE-6.4-GATE-B-REVIEW-2026-10-03.md). It does not amend the sealed scan or claim an independent review of the new UI diff. The canonical SECURITY.md resolver returned no policy for `package.json` or `src-tauri`; product ADRs, actual configuration and the owner-confirmed Tauri/Ollama workflow supplied the next-best scope evidence.

A fresh `npm audit --json` returned exit 1 on 2026-10-04: seven affected-package entries, one critical and six high. Authenticated GitHub still reported the original 12 open default-branch Dependabot alerts. These are different inventories; the feature's Firebase/js-yaml/Vitest correction does not itself close default-branch alerts.

| Residual input | Static verdict / confidence | Evidence and proposed disposition |
| --- | --- | --- |
| `next` 16.3.4 / GHSA-vcvr-r3jv-pc5j | `not_actionable` for the supported current application / high | The [upstream advisory](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j) requires Node `next/og` ImageResponse with attacker-controlled SVG. No `next/og` or ImageResponse caller was found in app/components/lib; `next.config.ts` exports static assets and Tauri serves `out`. Recommend nonblocking source integration only within that boundary; patch to at least 16.3.6 in focused maintenance. The package remains affected. |
| `@next/eslint-plugin-next` | `not_actionable` for current application / medium | Propagated development glob-parser record; installed `get-root-dirs` reads developer `settings.next.rootDir`. Project configuration supplies no such pattern. No CMS-to-parser route established. Keep maintenance queued. |
| `brace-expansion` 1.1.18 and 5.0.9 | `not_actionable` for current application / medium | Three distinct advisory claims remain represented: [quadratic expansion](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr), [nested groups](https://github.com/advisories/GHSA-qhr7-859c-m2p7), [parseCommaParts](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p). Development lint consumers, not editorial input, supply patterns. Ordinary compatible resolution needs a separate check of both copies; do not override a major blindly. |
| `braces` 3.0.3 | `not_actionable` for current application / medium | Installed parser has the [reported deeply nested-pattern stack risk](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). The upstream source references identify recursive walkers; there is no demonstrated editorial/remote attacker route in this product. Keep tooling maintenance open. |
| `eslint-config-next` | `not_actionable` for current application / medium | Development configuration propagates the same parser metadata. Do not accept npm's proposed downgrade to Next 14 as a compatible fix. |
| `fast-glob` 3.3.1 | `not_actionable` for current application / medium | Developer root-directory glob consumer; current flat config uses fixed ignores and does not set `settings.next.rootDir`. No untrusted product input boundary established. |
| `micromatch` | `not_actionable` for current application / medium | Installed `index.js` imports `braces`; pattern exposure inherits the tooling boundary above. This is not a claim that arbitrary patterns are safe. |
| `glib` 0.18.5 / Dependabot #20 | `needs_review` / medium; review rank 1 | [RUSTSEC-2024-0429](https://rustsec.org/advisories/RUSTSEC-2024-0429.html) affects VariantStrIter and is patched in 0.20.0. Cargo.lock retains it through GTK 0.18/WebKitGTK. No direct app `VariantStrIter` or `str_iter` caller was found; indirect Linux callers and optimized packaged execution remain unverified. No forced isolated major replacement is proposed. |

Retained structured result: standalone Codex Security `artifacts/phase64-closure-2026-10-04/residual-triage.json`. No dynamic exploit validation was performed. Verdicts address demonstrated product applicability, not global package safety or alert dismissal. Re-triage if a Node service, SVG generation, external glob input or another deployment surface is introduced.

**Owner decision required:** the recommendation is to allow source integration after the bounded desktop accessibility checks and final PR CI, while keeping Linux glib as an explicit accepted residual risk and release blocker. Its owner is the product owner; the next maintenance branch must investigate compatible Tauri/GTK remediation and Linux runtime reachability before any distributed binary. Until that decision is explicitly accepted, glib remains open in Gate B. A Windows-only conclusion does not settle Linux.

## Integration versus distribution

| Environment | Verified evidence | Not verified |
| --- | --- | --- |
| Windows | Existing owner-reported desktop development checks; current exact-source Rust debug/release checks/tests in CI. | Packaged installer, clean installation/upgrade/recovery, real bundled engine/model binding. |
| Linux | Current CI Rust debug/release checks/tests with native libraries and a mock sidecar. | A human desktop run, installer, real sidecar inference and runtime/glib reachability. |

The CI workflow does not run `tauri build`, install bundles or produce release assets. Thus the supported evidence is cross-platform code validation, with owner-reported Windows development operation. It does not justify promising ready-to-install Windows/Linux releases.

Recommendation: after separately authorized merge, an optional milestone tag may mark Phase 6.4. A GitHub release with installable binaries should wait for packaged Windows/Linux validation, licensing decision and the outstanding runtime/security gates. A tag is not required to merge. Neither tag nor release is authorized by this candidate. No release was returned by the GitHub release API during this round.

## New bounded desktop handoff

Previously accepted AI, CMS save/isolation/restart, import, settings dismissal and model inventory checks remain accepted; do not repeat them solely for confirmation. The app may be reopened with `npx tauri dev` to see this local corrective. Use a disposable test article and synthetic template, without deleting or resetting any database.

1. In CMS, use keyboard/NVDA to reach category, publication date, persona, CTA, internal links, external links/sources, estimated time, spent time, notes and new checklist item. Expected: every control announces its distinct visible label and can be edited; clicking a label focuses its own control.
2. With a saved template, reach `Template de checklist`, select using the platform's native keyboard interaction, Tab to `Aplicar` and activate. Expected: the announced name is clear and the selected template is applied. Test input need not be saved to the actual CMS.
3. In Calendar, Tab to a visible article, open once with Enter and once with Space, close each time using Escape. Expected: the same article opens and focus returns to its Calendar button. Previous/next month controls announce their purpose.

Report `1/2/3: pass or exact failure`, and identify whether NVDA was used. Keyboard-only acceptance is distinct from screen-reader acceptance. Broader workflow/error announcements, zoom, contrast and reduced-motion evidence remains unrecorded; if these mandatory criteria are deferred, the owner must explicitly approve the bounded integration boundary. Deferral is not a passing test or WCAG conformance.

## Exit checklist

- [x] Freeze scope and preserve accepted checks.
- [x] Verify `7e9702b` CI and current feature/main relationship.
- [x] Apply and locally validate the three scoped accessibility corrections.
- [x] Record one static result per residual package input, including unresolved Linux glib.
- [x] Prepare current README, candidate evidence and PR text.
- [ ] Owner accepts the new desktop/NVDA checks, or explicitly records a limited source-integration decision with the remaining mandatory evidence open.
- [ ] Owner accepts the residual security/runtime boundary proposed above; no automatic Gate B closure.
- [x] Owner explicitly authorized commit/push of the 11 reviewed files and creation of a Draft PR on 2026-10-04; this does not accept the desktop checks or authorize merge/tag/release.
- [ ] Final published-source PR checks pass; review the current diff/mergeability and close Gate B only against the agreed criteria.
- [ ] Obtain specific merge authorization (Gate C); optional tag/release remains separately gated (Gate D).
