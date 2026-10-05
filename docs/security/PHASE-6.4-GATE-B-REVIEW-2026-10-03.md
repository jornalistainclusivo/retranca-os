# Phase 6.4 Gate B — Static review and dependency triage

Date: 2026-10-03 (America/Sao_Paulo). Status: static changed-source review completed; **Gate B remains open**. No dependency or UI corrective has been applied by this checkpoint.

## Subsequent frozen-scope closure candidate — 2026-10-04

[The current closure record](../testing/PHASE-6.4-CLOSURE-2026-10-04.md) verifies successful exact-source PR CI on `8fd28e1`, records the owner-accepted CMS/template/Calendar checks with NVDA 2026.2 and keyboard, and supplies static applicability triage for seven residual npm package entries plus Linux glib. It preserves the sealed range/results below and the 12 still-open default-branch alerts. No direct Next ImageResponse/editorial glob-input path was established; affected versions remain. The follow-up searched all 442 resolved Linux package sources and found the glib iterator/entry point only within glib, with no application/downstream caller. This supports the limited source-integration recommendation while preserving the affected package and packaged-runtime gap; it does not change the earlier immutable triage receipt or dismiss an alert. The owner subsequently approved that evidence-backed boundary: Gate B closes for code integration only. Publication of the six documentation updates, Ready and merge commit are explicitly authorized, with merge conditional on four successful jobs on the final HEAD. Broader manual/runtime evidence and distribution gates remain open; tag/release are not authorized. The original checkpoint below remains historical.

## Subsequent authorized dependency correction — 2026-10-04

After explicit owner authorization, unused development Firebase was removed and the final lock resolves js-yaml 4.3.2 and aligned Vitest/UI 4.1.11. Clean installation, types, 287 frontend tests, lint and static build passed. A fresh independent candidate review inspected the complete semantic dependency delta, nested/aliased copies, exact peers and platform bindings without finding a concrete bypass or regression. This is subsequent evidence on the dependency patch, not an amendment to the sealed scan's frozen source range.

The [validation checkpoint](../testing/PHASE-6.4-RESUMPTION-2026-10-04.md) records exact lock/audit hashes, commands, warnings and recovery. All package families covered by the original 11 npm alert records are absent from the final audit; nevertheless, the full audit reports 7 other affected-package entries (1 critical, 6 high), or 1 critical Next entry excluding development dependencies. GitHub alert state was not refreshed or dismissed during this correction. Linux glib and the three accessibility findings below remain open, as do exact-source remote CI, broader runtime acceptance and Gates B/C/D. No owner article data was accessed.

## Result and immutable scope

The frozen range is `528be4fb5d0a368eb187afe237b0e95fffb710f0..0d2f5e9300bfa7bfdf57ce7effd4a5cc42ae9eb1`, on `feat/phase-6.4-pro-workflow-customization`. It includes accepted Phase 6.4 changes and Phase 6.5 Increment 1.

The independent architecture, native and frontend reviews, plus coordinated data/test review, reported **zero new security findings introduced by this diff**. This is not a repository-wide absence-of-vulnerabilities claim. The 12 imported dependency alerts below were open at intake on 2026-10-03.

| Coverage | Result |
| --- | --- |
| Compact changed-source inventory | All 76 items read in full with their diffs; deleted sources read at the baseline. |
| Additional changed support | 11 files: six native test sources, synthetic import fixture, SQLite verification script, Cargo lock, Git attributes and exclusions. |
| Non-executable context | 41 documentation/context files accounted separately; selected ADR/specification/validation statements informed scope, without auditing every historical statement. |
| Canonical coverage | Complete for this static diff contract; 128 raw changed paths accounted; no deferred candidate. |
| Runtime checks during this review | No test, build, app, installer or PoC executed. Earlier test/CI results remain historical evidence on their own revisions. |
| Private data | No owner database, backup, article export, model or credential accessed. |

The Codex Security scan `eabec0c4-20c8-47c0-a1b7-373663819e15` was sealed at `2026-10-03T23:07:52.099205Z`. Its retained canonical documents are `scan-manifest.json`, `findings.json`, `coverage.json`, `report.md` and `exports/results.sarif` in the local scan store; the exact threat model and supplemental triage remain attached to that scan. Local machine paths are intentionally not made repository requirements.

| Sealed artifact | SHA-256 |
| --- | --- |
| findings.json | `078f438305e6f5784db7d14756a8100d6184957f72d10a6f5b4280b5595cb4d4` |
| coverage.json | `51a9b6b973148414b4b24d93c2f6387e7d1ef74d1b5e1a7456a1c81cfad5d322` |
| Supplemental dependency triage JSON | `62c16aaf5fb44364e50903db7400f77aa7a77b372f6400d8f83a79dff71a23a4` |

## Boundaries verified statically

- Article import projects typed fields, limits records/bytes, preserves existing IDs and uses bound native SQLite writes in one transaction: [parser](../../lib/utils/articleImport.ts), [IPC adapter](../../lib/api/articleImport.ts), [native import](../../src-tauri/src/article_import.rs). This preserves [ADR-015](../decisions/ADR-015-LOCAL-ARTICLE-IMPORT-PRESERVATION.md).
- CMS save preflights relation ownership and collisions before writes; article text remains article-owned under [ADR-014](../decisions/ADR-014-ARTICLE-CMS-CONTENT-PERSISTENCE.md). Ordinary CMS save is multi-statement; full transactionality is not claimed.
- AI context travels through fixed IPC and native projection/budgeting. Raw inference commands are debug-only. Prompt escaping is structural protection, not proof against semantic prompt injection.
- The [sidecar resolver](../../src-tauri/src/sidecar_path.rs) uses a canonical sibling of the application executable, rejects non-files and escaping targets, and avoids PATH/CWD selection. Binary internals, real model consumption and installer behavior remain untested.
- [Model provisioning](../../src-tauri/src/provisioning/commands.rs) retains signature/hash checks. The trusted manifest signer controls its URL/name; readiness alone does not establish successful real inference.
- [AI Markdown](../../components/AiTextMarkdown.tsx) replaces images with text and retains the installed renderer's default URL/HTML controls. Explicit links can still be activated; desktop navigation was not exercised.
- Rust is the AI policy boundary, but **not the exclusive database writer**: [renderer SQL capabilities](../../src-tauri/capabilities/sql.json) and [Drizzle client](../../db/client.ts) remain authorized. The review does not invent a native-only persistence authorization guarantee.
- No applicable SECURITY.md was resolved. [ADR-013](../decisions/ADR-013-OPEN-SINGLE-EDITION.md), current source and explicit owner scope supplied boundary evidence. Open-edition removal of commercial gates is an approved product change.

## Accessibility findings and acceptance delta

These are static accessibility observations, separate from security scan findings and from the owner's already accepted functional checks.

| ID | Static failure / frozen source | Corrective boundary | Verification after correction |
| --- | --- | --- | --- |
| A11Y-CMS-LABELS-01 | [ArticleModal](../../components/ArticleModal.tsx), category/date lines 527–548 and metadata fields 641–720: visible sibling labels lack a programmatic control association; paired link/time fields also need distinct purpose names. | Reuse stable field IDs and native label associations; label any remaining placeholder-only editable control. Preserve article values and save behavior. | Rendered accessible names and label activation; keyboard operation, distinct paired names and desktop/NVDA. |
| A11Y-CMS-TEMPLATE-02 | [ArticleModal](../../components/ArticleModal.tsx), lines 964–973: template select has no associated label or ARIA name. An option does not name its select. | Add a visible native associated label without changing template semantics. | Named select, label activation and Enter/Space/arrow-key operation; NVDA announcement. |
| A11Y-CALENDAR-KEYBOARD-03 | [CalendarView](../../components/CalendarView.tsx), lines 133–148: article opener is a mouse-click div without keyboard focus/activation. Existing barrier persists in changed code. | Use a named native button, retain readable layout, visible focus and dialog focus return. | Tab plus Enter/Space opens the same article; closing returns focus; check reader and zoom/reflow. |

Relevant criteria are [WCAG 2.2 1.3.1](https://www.w3.org/TR/WCAG22/#info-and-relationships), [2.1.1](https://www.w3.org/TR/WCAG22/#keyboard) and [4.1.2](https://www.w3.org/TR/WCAG22/#name-role-value), Recommendation dated 2024-12-12, consulted 2026-10-03. A static failure establishes a missing implementation control, not an executed NVDA result. These sampled findings are not a comprehensive conformance audit.

Before an interface update that may reload the application, ask the owner to save and close the app and stop `npx tauri dev`. Closure confirmation is not functional acceptance. Preserve accepted AI/CMS/import/settings/inventory scripts; request only a bounded new corrective test, with explicit numbered steps and expected outcomes.

## Integration and production gates

The previous [CI 37141777120](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37141777120) passed four jobs on implementation `32e64a56084a5d42cef3275e00195c3262563e86`. It does not certify later documentation HEAD `0d2f5e9`, future lock changes or an installer. The warning about the Actions Node runtime remains separate maintenance; CI configuration was not changed.

Complete dependency maintenance and the scoped accessibility corrective next. Then finish keyboard/NVDA/error/reflow/reduced-motion evidence and define any production-runtime criterion in the [closure plan](../testing/PHASE-6.4-SLICE-8-ACCEPTANCE-CLOSURE-PLAN.md) and [Phase 6.5 draft](../architecture/PHASE-6.5-PRODUCTION-EXPERIENCE-PLAN.md). A deferral needs an explicit owner decision; it is not a pass. Review/merge remains Gate C and release/tag Gate D.

Plugin telemetry at sealing reports 23,504,064 total tokens across five threads, including 22,375,680 cached input tokens (source: `codex_rollout`). This is an aggregate telemetry snapshot, not an isolated maintenance-turn charge, billed cost or account usage-limit measurement.

## Dependabot static triage — 2026-10-03

Frozen feature revision: `0d2f5e9300bfa7bfdf57ce7effd4a5cc42ae9eb1`. GitHub source: [open Dependabot alerts](https://github.com/jornalistainclusivo/retranca-os/security/dependabot), authenticated REST intake; 12 open inputs (1 high, 10 medium, 1 low). GitHub manifest scope is the default branch. The feature npm lock matches the local main baseline; the Rust diff adds direct sqlx/uuid relationships without changing glib 0.18.5. Metadata severity is distinct from demonstrated product exploitability.

The owner clarified that the intended workflow is only Tauri/Ollama, without Firebase publication, emulators or MCP. The parent triaged all 12 records inline, preserving the two Vitest records and each separate morgan/ip-address/hono claim. Static only: no tests, builds, app, PoCs, private data or upstream exploit checks. No alert was dismissed or modified. No applicable SECURITY.md was resolved; source/product docs and explicit owner context supplied the next-best boundary evidence.

| Alert | Locked dependency | Metadata severity | First patched | Scoped verdict / confidence / rank |
| --- | --- | --- | --- | --- |
| [#34](https://github.com/jornalistainclusivo/retranca-os/security/dependabot/34) | undici 6.28.0 | low | 6.28.1 | not_actionable / high |
| [#32](https://github.com/jornalistainclusivo/retranca-os/security/dependabot/32) | morgan 1.11.0 | medium | 1.12.1 | not_actionable / high |
| [#31](https://github.com/jornalistainclusivo/retranca-os/security/dependabot/31) | ip-address 10.5.0 | medium | 10.5.1 | not_actionable / high |
| [#30](https://github.com/jornalistainclusivo/retranca-os/security/dependabot/30) | ip-address 10.5.0 | medium | 10.5.1 | not_actionable / high |
| [#28](https://github.com/jornalistainclusivo/retranca-os/security/dependabot/28) | morgan 1.11.0 | medium | 1.12.0 | not_actionable / high |
| [#27](https://github.com/jornalistainclusivo/retranca-os/security/dependabot/27) | js-yaml 4.3.1 | high | 4.3.2 | needs_review / medium / review 2 |
| [#26](https://github.com/jornalistainclusivo/retranca-os/security/dependabot/26) | hono 4.13.2 | medium | 4.13.5 | not_actionable / high |
| [#24](https://github.com/jornalistainclusivo/retranca-os/security/dependabot/24) | hono 4.13.2 | medium | 4.13.5 | not_actionable / high |
| [#23](https://github.com/jornalistainclusivo/retranca-os/security/dependabot/23) | vitest 4.1.10 | medium | 4.1.11 | needs_review / medium / review 3 |
| [#22](https://github.com/jornalistainclusivo/retranca-os/security/dependabot/22) | @vitest/mocker 4.1.10 | medium | 4.1.11 | needs_review / medium / review 4 |
| [#21](https://github.com/jornalistainclusivo/retranca-os/security/dependabot/21) | csv-parse 5.6.0 | medium | 7.0.2 | not_actionable / high |
| [#20](https://github.com/jornalistainclusivo/retranca-os/security/dependabot/20) | glib 0.18.5 | medium | 0.20.0 | needs_review / medium / review 1 |

### Boundary evidence

- `package.json:45` declares firebase-tools as development-only. Installed dependency consumers confirm its hosting logger, MCP/proxy tooling and authentication CSV importer; no app/project-script caller was found, and the owner explicitly excludes those workflows. The eight `not_actionable` verdicts refer to that supported product boundary, **not** to package safety, all possible Firebase deployments, or remote alert closure.
- `js-yaml` also comes from `@eslint/eslintrc`; its YAML configuration loader exists in the installed tool. This project selects flat JavaScript ESLint configuration, so an attacker-controlled YAML route in current CI is unproven. Keep the high affected-version alert pending and update the retained parser graph.
- `package.json:13,41,49` and `vitest.config.ts:11` select Node tests with Vitest 4.1.10. The [Vitest advisory](https://github.com/vitest-dev/vitest/security/advisories/GHSA-82fw-gwwq-j7x9) requires a public mock interceptor and reachable socket; none is configured here. Do not claim either an exploited file read or blanket tool safety. Update aligned Vitest/UI packages to a patched 4.1 release.
- `src-tauri/Cargo.lock:1541-1542` retains glib 0.18.5 through Tauri/Wry/GTK. [RUSTSEC-2024-0429](https://rustsec.org/advisories/RUSTSEC-2024-0429.html) concerns the `VariantStrIter` implementation and is patched in 0.20.0. Direct app calls were absent, while GTK/glib implementation was unavailable in the Windows cache; indirect Linux caller and optimized packaged execution remain unverified. A Cargo lock entry alone does not prove an exploitable crash. A forced isolated 0.20 replacement would not establish compatibility with the GTK 0.18 tree.

### Concrete remediation sequence

1. Remove the unused **development** dependency firebase-tools and regenerate npm lock coherently. This should eliminate eight exclusive alerts by removing their packages, subject to a fresh post-change tree/audit. It does not eliminate js-yaml retained by ESLint.
2. Update retained js-yaml to at least 4.3.2 and align Vitest/@vitest/ui to at least 4.1.11 within their current major. Prefer ordinary dependency resolution; do not use blanket `audit fix --force`, unsupported major overrides or partial text edits of generated locks.
3. Recheck lint, types, the frontend suite and static build; re-read the full post-change dependency audit. Existing code CI does not validate new locks. Dispatch the existing cross-platform CI only on the published correction.
4. Review the supported Tauri/GTK dependency chain for glib separately. Any patch, upstream fork, vendor dependency or production-runtime change needs a concrete reviewed proposal and the corresponding authorization; record Linux reachability/packaging gaps rather than dismissing the alert.
5. Re-read default-branch alert state after an explicitly authorized merge. A successful feature push or green CI does not close default-branch alerts by itself.

### Limitations

Four inputs remain `needs_review`; no input is a statically confirmed product exploit. This is a first-pass dependency triage, separate from the immutable changed-code security scan and from accessibility/installer acceptance. The structured result is retained at `artifacts/01_context/dependabot-static-triage.json`.
