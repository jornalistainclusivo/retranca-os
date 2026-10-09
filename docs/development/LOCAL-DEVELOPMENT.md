# Retranca OS — Local development

Date: 2026-10-09. This guide prepares the source checkout; public installers remain unavailable. For application use, see the [Portuguese getting-started guide](../user-guide/GETTING-STARTED.md).

## Prerequisites

Install Git, Node.js/npm, Rust/Cargo and the [native Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your operating system. On Windows, development requires the Microsoft C++ Build Tools with Desktop development with C++, an MSVC Rust toolchain and WebView2. Linux requires its distribution's native libraries.

Use a 64-bit Node.js environment that satisfies the complete lockfile: 20.19 or newer within Node 20, 22.13 or newer within Node 22, or Node 24 and newer. Next.js 16.3.8 alone declares Node 20.9 or newer, but Vite 8 and the TypeScript ESLint visitor dependencies impose stricter requirements. The local dependency-maintenance round passed with Node.js 24.19.0 and npm 10.9.0; the existing frontend CI uses Node.js 20. These are recorded environments, not a validated version/platform matrix. See the [maintenance evidence](../decisions/ADR-018-DEPENDENCY-SECURITY-MAINTENANCE.md#manutenção-local--2026-10-09).

Ollama is optional for planning/CMS use. Actual assistance requires an installed local model, the audited server version and native readiness. No cloud API key is needed. See [ADR-016](../decisions/ADR-016-PRODUCTION-LOCAL-AI-PROVIDER.md), whose current accepted server set is exactly 0.35.1 and 0.40.1.

## Clone and start the desktop

Create a new checkout in a directory of your choice:

```sh
git clone https://github.com/jornalistainclusivo/retranca-os.git
cd retranca-os
npm ci
```

For an existing checkout, enter its own directory instead of cloning over it. Check `git status --short --branch` before switching branches or updating source; preserve pending work.

For the current candidate checkout, start normal desktop development with `npm run desktop:dev`. It prepares the pinned SQLite engine and then invokes the installed Tauri CLI, which starts `npm run dev` automatically. A fresh clone above obtains published main; it does not include these candidate changes. `npm ci` installs the lockfile without deliberately upgrading dependencies and requires network access for uncached packages.

Save open edits, close the app and stop the development command with Ctrl+C before a change that may restart Tauri. Source updates do not update an already installed Pilot executable.

## Pinned native SQLite build

These commands describe the current checkout. The SQLite build integration is local work on `codex/phase-6.5-workspace-backup`, based on `9768a87`; local commit has been authorized; integration into main remains pending. A fresh clone of published main does not contain these candidate scripts yet.

`npm run desktop:dev` prepares the pinned SQLite engine before starting normal Tauri development. `npm run desktop:build` prepares it before the normal desktop build. The fixture command `npm run dev:desktop` also prepares it but retains synthetic identity/runtime. These commands have different scopes.

For direct Cargo or direct Tauri CLI use, prepare once from the checkout root, and repeat after build-recipe changes:

```sh
npm run sqlite:prepare
npx --no-install tauri dev
```

The [separate Rust build tool](../../tools/sqlite-runtime/Cargo.toml) and its lock compile SQLite 3.51.3. The [Node preparer](../../scripts/build/prepare-sqlite-runtime.mjs) verifies the official source checksum, actual engine identity/options and native target, then records artifact/recipe hashes. The private cache in `.retranca-local/sqlite-runtime/3.51.3/` contains only build artifacts; it is not the editorial database or a backup.

The [.cargo configuration](../../.cargo/config.toml) supplies the static library paths automatically. The app refuses absent or mismatched preparation instead of linking an old/system engine. If that guard fails, return to this checkout's root and run `npm run sqlite:prepare`; review the reported failure rather than altering application data or bypassing the guard. An uncached helper build requires access to its locked crates and a native C compiler. No separate SQLite DLL installation is required.

The recipe supports native Windows MSVC and Linux GNU; cross-compilation and other platforms are rejected. Local Windows debug/release and a Tauri build without an installer passed; Linux and the candidate CI remain unexecuted. Native CI selects Node 24 for this helper, while frontend CI retains Node 20. See the [implementation evidence and limits](../decisions/ADR-018-DEPENDENCY-SECURITY-MAINTENANCE.md#integração-local-do-build-sqlite--2026-10-09).

## Preview, desktop and synthetic fixtures

| Command | Scope |
| --- | --- |
| `npm run desktop:dev` | Prepare SQLite and start normal native desktop with the supported external Ollama path. |
| `npm run dev` | Web frontend preview. It does not provide the native Tauri inference runtime or the same desktop database. |
| `npm run dev:desktop` | Explicit developer fixtures: synthetic sidecar/provisioning, separate identity and storage. It is not the normal real-Ollama entry point. |

Normal bundle configuration excludes the synthetic sidecar. The fixture target needs its matching target-triple binary; the existing CI workflow shows the Linux mock build. Do not interpret fixture output as real inference.

## Validation commands

From the repository root:

```sh
npx --no-install tsc --noEmit --incremental false
npm run lint
npm test
npm run build
node --test scripts/build/__tests__/sqlite-runtime.test.mjs
npm run sqlite:prepare
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo check --manifest-path src-tauri/Cargo.toml --locked
cargo test --manifest-path src-tauri/Cargo.toml --locked
cargo check --manifest-path src-tauri/Cargo.toml --release --locked
cargo test --manifest-path src-tauri/Cargo.toml --release --locked
```

The frontend uses a Next.js static export in `out`, consumed by Tauri; do not introduce server-only routes as a replacement for native IPC. See the installed Next.js guide at `node_modules/next/dist/docs/01-app/02-guides/static-exports.md` before changing that boundary.

The [existing CI](../../.github/workflows/ci.yml) checks frontend and native Windows/Linux source and requires both Rust jobs through its aggregate. It does not build, install or publish the Pilot. New source needs its own evidence; preserve accepted results when no new change requires repeating them.

## Private Windows pilot build

The reviewed helper builds an isolated unsigned Windows x64 NSIS pilot for local testing. It requires WebView2 already installed and omits bundled models/fixtures. Its application identifier is `com.jornalistainclusivo.retranca.pilot`, distinct from the normal application's `com.jornalistainclusivo.retranca`.

```sh
node scripts/packaging/build-local-pilot.mjs --check
node scripts/packaging/build-local-pilot.mjs --build
```

The first command validates configuration and the audited Tauri CLI version only. The second compiles and saves private artifacts, logs and `build.json` in `.retranca-local/phase65-packaged-pilot/<candidate>/`; it does not launch the installer, app or model. These files remain Git-ignored and are not public release assets.

**Hash distinction:** receipt schema 2 assigns separate roles to the restored raw executable and NSIS installer, and records an expected unsigned installed-executable hash. Tauri CLI 2.11.4 patches the bundle marker for NSIS and later restores the raw executable; the raw hash therefore differs from the installed payload hash. The helper derives the expected hash in memory without changing the raw file. The [artifact-identity contract](../specifications/phase-6.5/PHASE-6.5-PACKAGING-ARTIFACT-IDENTITY.md) defines the audited toolchain and rejects absent, duplicate, mixed, patched or unrecognized markers.

The [bounded validation](../testing/PHASE-6.5-PACKAGING-ARTIFACT-IDENTITY-VALIDATION.md) covers the receipt helper and checks the accepted candidate against its previously recorded installed hash. A derived expectation is not an installed-file observation, signature verification or installer acceptance. Historical receipts remain unchanged. Signed packages and future toolchains need separate review; do not normalize arbitrary binary differences.

## Data and publication boundaries

Desktop SQLite uses the existing relative `sqlite:retranca.db` preload in the application's configuration directory. Normal desktop, Pilot and fixture namespaces differ. Preserve existing data and migration safeguards; do not delete a database to update an executable.

JSON article exports are not full backups. Their preserved-ID/reference policy is recorded in [ADR-015](../decisions/ADR-015-LOCAL-ARTICLE-IMPORT-PRESERVATION.md). Keep editorial databases, exports, model output and raw test captures local.

The [Phase 6.5 plan](../architecture/PHASE-6.5-PRODUCTION-EXPERIENCE-PLAN.md) retains installed Linux, broader accessibility, backup/restore, unresolved dependency/security questions, third-party licensing/signing and distribution criteria. The project's own code and documentation are available under the [MIT License](../../LICENSE); dependencies, runtimes and AI models retain their own licenses. This guide does not create a tag or publish an installer.
