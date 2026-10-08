# Phase 6.5 Increment 7 — Navigation states and Windows zoom

Date: 2026-10-08 (America/Sao_Paulo). Status: local implementation; all three bounded development checks accepted by owner report on 2026-10-08. This is a bounded accessibility increment, not full WCAG or distribution acceptance.

## Baseline and decisions

Start `codex/phase-6.5-accessibility` from approved main `95e6a2cec5880c419ef911d3e6b12e3786fbea48`, the merge of [PR #9](https://github.com/jornalistainclusivo/retranca-os/pull/9). The exact-source automatic main CI #37 passed all four jobs; the separate [validation](../../testing/PHASE-6.5-INCREMENT-7-ACCESSIBILITY-VALIDATION.md) retains the run link and scope. Reuse the attached managed worktree and preserve the owner's original AntiGravity checkout, accepted Increment 6 runtime sample and local editorial data.

No new ADR is needed for these semantic controls and native zoom setting. Preserve [ADR-013](../../decisions/ADR-013-OPEN-SINGLE-EDITION.md) open edition, [ADR-017](../../decisions/ADR-017-OPEN-EDITORIAL-STARTUP-AND-CATEGORY-CUSTOMIZATION.md) startup/customization, and the existing ADR-008/014/016 authority, persistence and provider contracts. No dependency, version, schema, runtime/model or CI change is included.

## Interface contract

- All seven Sidebar page selectors retain native button semantics, explicit button type and exactly one `aria-current="page"`; the page navigation landmark has the accessible name `Páginas do Retranca`.
- All five deadline filters expose `aria-pressed`, with exactly one true state. Display, counts and filtering behavior remain unchanged.
- Preserve existing CMS label associations, declared dialog-heading initial focus, Escape dismissal and invoker-focus return, as well as the local AI panel's X/Escape handling and foreground-dialog precedence.
- Use the real native Windows page zoom control, not CSS scaling or a custom keyboard listener. The normal Windows override `tauri.windows.conf.json` preserves the complete normal window settings and adds only `zoomHotkeysEnabled: true`.
- The separate Windows-only Pilot overlay also enables zoom because its window array replaces the normal/platform array. The packaging validator permits only this new window option, requires it enabled, validates the normal Windows override and includes that override in its build input hashes.

[Tauri platform configuration](https://v2.tauri.app/reference/config/#platform-specific-configuration) supports the Windows override. Its [zoom option](https://v2.tauri.app/reference/config/#zoomhotkeysenabled) controls WebView2 zoom; the installed CLI schema defines the omitted option as false. Linux/macOS use a different polyfill and require an additional permission. This correction leaves their base configuration and all capabilities unchanged; it does not establish zoom support there. Synthetic fixture overlays remain outside this native-zoom handoff.

## Verification and owner handoff

Protect exclusive current-page/filter states, the two Windows configuration variants, rejection of disabled zoom/unrelated overrides and the existing isolated packaging boundary. Check the packaging preflight, types/lint and locked offline native configuration compilation. Preserve earlier passed frontend/static/browser checks in their original scope rather than rerunning them as native zoom evidence.

The owner reported `1 ok, 2 ok, 3 não ok`, then clarified that the shortcut did not enlarge the page. Record navigation/reader and dismissal as pass by owner report on the development checkout; record zoom activation as fail before correction and zoomed layout as not-tested. The owner subsequently reported `3 ok` after the focused zoom correction retest on 2026-10-08, completing the three development checks. Preserve the original failure as historical evidence; no repeat of passed checks is needed. These outcomes do not apply to the installed Pilot executable.

The completed correction handoff repeated only check 3 using the same development checkout:

```powershell
npx --no-install tauri dev
```

Activate and maximize the Retranca window. On Início, use Ctrl + plus to enlarge, Ctrl + minus to reduce and Ctrl + 0 to restore. At an enlarged size, inspect the guidance and controls, then open IA local and ensure its content and close control remain reachable, using scrolling when needed. If a shortcut does not work or content is cut/overlapped, report the precise state; do not count an unavailable zoom test as pass. No saved article, inference, model download or repeated checks 1–2 are requested.

Save any open work and close the app/Ctrl+C before source changes. Shut down NVDA after reader testing, as requested by the owner. No reader restart is necessary solely for this visual zoom retest.

## Completion and limits

Implementation, local compilation, owner development acceptance, remote CI and installed package acceptance are distinct. A fresh Pilot build/update with its own identified artifacts is needed before installed zoom acceptance; existing executables are not modified by source changes. Do not transfer prior package results to an unidentified or different executable.

Keep contrast, full zoom/reflow coverage, reader error/status announcements, reduced-motion observations and other platforms explicitly untested where appropriate. [Keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html), [Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html) and [Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) guide this sample, without certifying WCAG conformance.

The owner explicitly authorized the eleven-file local commit on 2026-10-08. Push, manual CI, integration and distribution remain separately authorized gates; the resulting commit identity belongs in its verified supplemental receipt.
