# Phase 6.5 Increment 7 — Accessibility validation

Date: 2026-10-08 (America/Sao_Paulo). Scope: [navigation states and Windows zoom](../specifications/phase-6.5/PHASE-6.5-INCREMENT-7-ACCESSIBILITY.md). Status: local correction implemented and all three bounded development checks accepted by owner report on 2026-10-08. The owner explicitly authorized the local commit of eleven reviewed files on 2026-10-08; its final identity is retained in the supplemental receipt. Push, CI dispatch, installer build/update and editorial database access are not included.

## Source identity and preserved work

Branch `codex/phase-6.5-accessibility` starts at main `95e6a2cec5880c419ef911d3e6b12e3786fbea48`, merging PR #9. All four automatic [main CI #37 jobs](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37816289826) passed on that exact SHA. That historical baseline CI does not validate this later round. Preserve Increment 6's separately accepted installed recovery sample and the original AntiGravity checkout.

The normal development checkout and installed Pilot are different application artifacts. The owner's current tests followed the explicit managed-worktree development instructions; they are not installed-package acceptance. Application version remains 0.1.0, so the version string alone does not identify a build.

## Local and owner observations

| Check | Result and boundary |
| --- | --- |
| Sidebar regression before its correction | Fail — 11 of 12 cases; Início already exposed its state. |
| Sidebar correction, full frontend suite | Pass — 392 tests / 31 files on Node 24.19.0, Vitest 4.1.11; types, ESLint and Next 16.3.6 static build also passed before the subsequent zoom configuration change. |
| Isolated browser sample | Pass — 21 Chrome Dev 157.0.8081.0 checks, zero page errors: seven page states, five filter states, CMS name/heading initial focus/labels/Escape return, local AI panel name/Escape return and Início width bounds at 1280/640/320 CSS pixels. Empty/synthetic storage and external-request blocking. These are browser observations, not native WebView zoom or NVDA speech. |
| Agent-controlled NVDA | Not-tested — Computer Use could not safely identify the browser URL and stopped the earlier attempt. No alternate UI control bypass was used. The owned browser lab was closed and installed NVDA was shut down; its documented `--check-running` returned 1. |
| Owner development check 1 — navigation/filter states with keyboard/NVDA | Pass by owner report on 2026-10-08: `1 ok`. No exact speech transcript or full reader coverage is claimed. |
| Owner development check 2 — CMS/local AI opening, Escape and focus return | Pass by owner report on 2026-10-08: `2 ok`. No new inference or complete saved article was requested. |
| Owner development check 3 before zoom correction | Fail by owner report: `3 não ok`; clarified `O atalho não ampliou a tela`. At that pre-correction checkpoint zoomed layout was not-tested, rather than an observed layout defect; the later development retest is recorded separately below. |
| Zoom/packaging regression before correction | Fail — two new cases fail because the Windows override is absent; the five existing packaging cases pass. |
| Targeted regressions after zoom correction | Pass — 19 tests across Sidebar state and packaged-pilot boundary files; seven packaging cases include normal Windows/Pilot zoom and rejection of disabled zoom/unrelated settings. |
| Pilot preflight after correction | Pass — explicit Node 24.19.0 helper `--check`; isolated identity 0.1.0 retained, no installer execution. |
| Types/lint and native configuration check after correction | Pass — full TypeScript check, scoped ESLint and `cargo check --manifest-path src-tauri/Cargo.toml --locked --offline` with the Windows configuration supplied through a process-local override; native dev-profile configuration compiled in 51.86 seconds. No app execution or installer generation. |
| Owner development check 3 after correction | Pass by owner report on 2026-10-08: `3 ok`, after the focused enlarge/reduce/reset and enlarged Início/local-AI-panel handoff. This does not establish exact zoom percentages or full visual coverage. |
| Installed Pilot zoom after this correction | Not-tested — this source change has not been built/installed as a new identified Pilot candidate. |

The existing Vite native-config warning, `.eslintignore` warning and native `unused_mut` warning in `src-tauri/src/provisioning/download.rs:93` remain visible. No dependency update or warning suppression was performed.

## Corrective scope

The local Tauri CLI schema sets omitted `zoomHotkeysEnabled` to false. The normal window and Pilot overlay omitted it, matching the reported nonfunctional shortcut. Add a Windows-only platform configuration preserving the normal window and enable the same flag in the Windows-only Pilot overlay. Validate both inputs and retain the new platform file in future build receipt hashes. Keep the shared non-Windows base, capability files and synthetic fixture overlay unchanged. No CSS scaling, new event listener, IPC permission, application identity, model setting or persistence change is included.

The packaging overlay replaces the window array, so relying only on the Windows platform file would omit the Pilot fix. The negative regression checks guard that variant and reject unrelated window/data-path overrides.

## Installed executable identity and remaining work

A read-only hash observation found the installed Pilot SHA256 `cd0090312defe3aa49245df600f9702a421055aa2a8da5355c09088a370eb095`, different from the previously identified corrected candidate SHA256 `89ad1719f4a95ed5c71da6121a9f40b1093b0353aff2ca6b8324fdd560d224bf`. Both reported version 0.1.0 and 19,273,728 bytes. The cause remains needs-review; do not infer corruption, a missing update or reproducible build identity from this difference. Do not erase historical owner acceptance or extend it to the current unidentified binary.

Local source/documentation review is complete and the owner accepted all three bounded development checks. Preserve them without repetition. The owner authorized the local commit with message `fix(phase-6.5): improve navigation states and Windows zoom`; retain its verified identity separately and request independent authorization for publication and CI. Later prepare a fresh identified Pilot artifact and separately scoped installation handoff. Comprehensive contrast, actual zoom/reflow percentages, reader announcements in untriggered error states, reduced motion, Linux/macOS/other readers, signing and distribution are not established by this sample. No full accessibility or production acceptance is claimed.
