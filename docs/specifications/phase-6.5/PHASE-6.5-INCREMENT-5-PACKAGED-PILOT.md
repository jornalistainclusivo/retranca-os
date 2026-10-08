# Phase 6.5 Increment 5 — Isolated Windows packaged pilot

Date: 2026-10-06. Development continuation authorized after all four jobs of [CI #27](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37537545421) passed on native-pilot source `6d0a4f3d83aefb45c8f78d5d5d70b9eac85b6ef7`. This increment prepares a local Windows package for the next installed-runtime observation in the [production experience plan](../../architecture/PHASE-6.5-PRODUCTION-EXPERIENCE-PLAN.md). Preserve accepted [ADR-016](../../decisions/ADR-016-PRODUCTION-LOCAL-AI-PROVIDER.md) and article-owned local data; no provider, schema, dependency, permission or CI configuration change is included.

## Deliverable and isolation

Use an explicit Tauri build overlay, never the default build configuration: product `Retranca OS Pilot`, binary `retranca-pilot`, identifier `com.jornalistainclusivo.retranca.pilot` and a window title identifying the local pilot. Keep version `0.1.0`. Build the existing application in release mode with normal native Ollama authority, no `dev-fixtures`, no bundled model/sidecar, no custom resources or installer hooks and no automatic inference.

The resolved SQL plugin `2.4.0` maps `sqlite:retranca.db` beneath Tauri's `app_config_dir`; resolved Tauri `2.11.5` derives that directory and the default Windows WebView data directory from the application identifier. Therefore the distinct pilot identifier provides a separate database and browser storage namespace. Validate the relative database preload and absence of custom data-directory overrides before building. This is source-backed isolation design; first installed startup remains a separate observation. Do not inspect, copy, import, migrate or delete the owner's existing database or normal application directories.

Generate only an unsigned NSIS candidate for the current Windows user. The pilot requires an already installed WebView2 runtime and sets its installer mode to `skip`; it must not install another runtime, Ollama or a model. Normal production configuration remains unchanged. An unsigned local build is not a publicly approved release, and no signing credentials are read or configured by this helper.

## Developer helper and evidence

- `node scripts/packaging/build-local-pilot.mjs --check` validates the fixed overlay without compilation, daemon calls, application startup or installer execution.
- `node scripts/packaging/build-local-pilot.mjs --build` explicitly opts into Windows release compilation and NSIS bundling using the installed Tauri CLI, the existing frontend build and Cargo's locked dependency graph. Builder tooling may need its normal cache/download; no new project dependency is added.
- Use a separate ignored Cargo target directory and a fresh UUID receipt directory under `.retranca-local/phase65-packaged-pilot/`. Do not reuse the normal debug/release executable or label an old installer as the new result.
- Reject conflicting Tauri/Rust build overrides, unexpected overlay resources/hooks/data paths and unsupported platforms/arguments. Keep fixed child arguments and avoid shell interpolation.
- Retain the source baseline, hashes of the two configuration files and helper, build result/log, artifact paths/sizes/SHA-256 and elapsed time locally. On failure retain a failed receipt; do not retry automatically or install/launch an artifact. These hashes identify local files, not reproducibility, process attestation or a signed release.

## Installed owner handoff

Only after a local candidate is built and its exact file/hash is recorded, ask the owner to install it for their current Windows user and open **Retranca OS Pilot** outside the repository and without `npx tauri dev`. Use synthetic content only, never import or reproduce actual articles. Three new checks apply to this package:

1. The pilot window opens from the installed shortcut with the pilot title. Actual personal articles are absent. If personal content appears, stop without editing and report it; no database inspection or cleanup is requested.
2. Create a synthetic article named `Piloto de instalação 6.5`, summary `Teste de instalação com uma reunião fictícia` and objective `Verificar salvamento e resposta da IA no pacote local`. Paste analysis text `EXERCÍCIO SINTÉTICO. Em uma reunião fictícia, 12 pessoas avaliaram duas propostas. A decisão final ainda está pendente.` Save, close the application and reopen it from its shortcut. Only this pilot article must retain that exact analysis text. These supplied fields avoid asking the owner to invent a test article; native simplification requires nonempty analysis text or summary, not completion of the editorial checklist.
3. In this installed pilot, select existing `gemma4:latest` and run **Simplificar linguagem** on the synthetic analysis text. Observe response delivery in the actual packaged window and check preservation of numbers/uncertainty. This is one package-specific generation, not another native harness run or model comparison. No download or substitution is requested. If readiness is blocked, record the exact message and stop rather than relaxing policy.

The owner may defer installation. Report automated configuration/build checks separately from installation, actual Tauri events/CMS, human output acceptance and broader keyboard/NVDA. Packaged cancellation/teardown, uninstall/update, recovery without Ollama, clean-machine prerequisites, Linux packaging/runtime, accessibility, license decisions and remediation of relevant security alerts remain separate gates. Never disable platform security protections to complete a test.

## Validation and publication

Focused tests must prevent namespace/data-path collisions, fixture/resource bundling, inherited authority overrides and stale/multiple installer selection. The unchanged frontend/native suites have accepted exact-source CI evidence; build the new package and test the new helper rather than repeating the previous live pilot for confirmation.

The [validation report](../../testing/PHASE-6.5-INCREMENT-5-PACKAGED-PILOT-VALIDATION.md) must distinguish prepared, compiled, installed and accepted states. Source commit/push/manual CI/PR/merge/tag/release retain separate authorization. No public binary upload, installer execution, owner-data migration or change to branch protection is authorized by development continuation.

Official Tauri references consulted 2026-10-06: [Windows installer](https://v2.tauri.app/distribute/windows-installer/) and [configuration](https://v2.tauri.app/reference/config/). Installed CLI `2.11.4` help confirms configuration merge, NSIS selection, unsigned builds and arguments passed to Cargo. The installed Next.js static-export guide confirms the existing `next build`/`out` flow; no frontend configuration change is needed.
