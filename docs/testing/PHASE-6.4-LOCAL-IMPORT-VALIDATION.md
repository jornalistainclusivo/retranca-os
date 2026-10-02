# Phase 6.4 — Local Article Import Validation

Date: 2026-10-02 (America/Sao_Paulo). Status: implemented and validated locally; owner desktop import acceptance and remaining gates pending.

## Starting point and authority

The starting tree was clean/synchronized on `feat/phase-6.4-pro-workflow-customization` at `089174088a780d6fd481e395c4e89c48b7a8c0d5`. The GitHub API confirmed [CI run 37064072955](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37064072955) as completed/success on that exact SHA, updated `2026-10-02T21:20:20Z`: frontend, Rust Windows/Linux and required Rust aggregate all passed. This is baseline evidence, not CI for the changes in this report.

The owner authorized the next development stages with full autonomy. That authorization covers this coherent code/documentation consolidation, publication and existing manual CI; prior per-action confirmations are historical. Merge/release remain separately gated. The owner selected preservation import, clarified local-only actual editorial data, then requested continuing while unsure about alternatives. [ADR-015](../decisions/ADR-015-LOCAL-ARTICLE-IMPORT-PRESERVATION.md) records the conservative default. No owner database, backup, export, image, .env or credential was read or modified by the agent.

## Delivered behavior

- Local file import adds only new IDs and preserves existing article content/checklists/history, including newer imported duplicates.
- Native schema-2 managed-pool command validates input/references and persists the whole new batch atomically. Invalid input, conflicting related identities and SQL errors leave the batch uncommitted.
- Browser fallback follows preservation semantics. Header announces added/preserved counts, errors and retry; file controls remain available on small screens. Desktop example reset is blocked.
- Export remains article-only JSON, not a full SQLite/customization/attachment backup.
- Sidecar dispatch and preflight resolve a fixed canonical sibling of the application executable, with no PATH/CWD fallback. This corrects location selection only: the bundled mock-sidecar is not a real engine, and verified model-to-engine binding remains unresolved.
- Git exclusions cover common local DB/backup/export filenames and dedicated private folders. Synthetic tracked-name checks found no matches for the examined DB/backup/export/.env patterns; this is not a Git-history or secret-content audit.

## Executed checks

| Check | Result | Scope |
| --- | --- | --- |
| `npm test` | 260 passed / 23 files | Includes 13 new import cases. After correcting parameterized malformed cases, the focused suite and final complete 260-case suite both passed. The handoff JSON also parsed successfully through the actual parser. |
| `npm run lint`, `npx tsc --noEmit`, `npm run build` | Passed | Final corrected types and static export. Existing ESLint ignore deprecation notice remains. |
| `cargo test --manifest-path src-tauri/Cargo.toml --locked` | 114 passed | Windows debug; six new file-backed native import cases and two path cases. |
| Same command with `--release` | 114 passed | Windows release. Unix-only symlink rejection remains for Linux CI. |
| Rust format/debug/release check | Passed | Existing unrelated warnings remain. |
| `node scripts/security-enforcement-test.mjs` | Passed | Debug-only raw inference registration stays excluded from release. |
| `git diff --check` | Passed | Tracked patch whitespace. |
| Private-file filename checks | Passed within examined patterns | Seven invented ignored paths; no actual editorial files inspected. |

Tests use invented articles, explicit non-engine path fixtures and temporary SQLite files. File-backed tests exercise actual SQLx writes/reopening/rollback on disposable data; mocked frontend IPC tests verify routing, not desktop runtime.

## Implementer browser observations

A dedicated `127.0.0.1:3046` browser origin used only built-in examples and one invented import article. No owner Tauri database or personal browser origin was used.

1. Import added one synthetic article; total changed from 30 to 31.
2. Repeat import showed `0 pauta(s) adicionada(s); 1 pauta(s) já existente(s) preservada(s)`, without duplication.
3. Invalid JSON object showed `Arquivo de pautas inválido. Nenhuma pauta foi alterada.`; total stayed 31, and retrying the same valid file succeeded.
4. Reload retained the synthetic article. A 320 px viewport check found import/export/reset controls visible with named buttons; observed button targets were about 28 px. This is a Header observation, not full-app reflow/WCAG proof.

Browser screenshots remain in ignored local QA storage. The dedicated browser tab/server were closed after testing. Actual keyboard file chooser and NVDA announcement behavior remain untested.

## Security review and operational MCP diagnosis

Codex Security scan `cbc3ef33-5f68-4f46-8d82-c6c106a89dfe` completed/sealed at `2026-10-02T21:57:04.764065Z`, against base `0891740` and frozen snapshot `codex-security-snapshot/v1:sha256:0b56b309456ee9e69ed6e6f68820b0d07e27cb3844e0a6a397c069bb5e7affea`. Independent architecture and frontend/native compact discovery reviewed the 12 canonical inventory files; the parent reviewed supplemental native tests/.gitignore. No candidate was recorded and the sealed result has zero reported findings.

**Canonical coverage is partial.** The implementer mistakenly saved supplemental evidence as temporary staging and referenced it from coverage. The tool excluded those receipts from the sealed result and marked the surfaces `needs_follow_up`. Preserve that original result; do not claim complete evidence retention or silently edit the completed scan. Future scans must save retained threat model/coverage evidence with `storage: persistent` before referencing it. Documentation and the synthetic handoff fixture added after sealing are not covered by that frozen scan. Measured token usage was not returned. Daybreak access was not granted; protected results may be withheld. Full-branch Gate B remains open.

At the owner's request, a read-only MCP check confirmed that the GitHub connector returned repository metadata and Codex Security completed its typed tool calls. Plugin metadata showed Codex Security and its optional GitHub dependency installed/enabled. CLI MCP listing succeeded outside the sandbox after an isolated home-resolution failure. No MCP config, credential or permission was changed; disabled app-injected entries were not blindly re-enabled. These are specific observations, not proof that every MCP works. Follow the [official OpenAI troubleshooting guidance](https://developers.openai.com/plugins/deploy/troubleshooting) to isolate server/tool/client failures if a separate concrete error occurs.

## AntiGravity: only the new import checks

Start from the existing folder/branch:

```powershell
cd C:\Users\RFERRAZ\Documents\retranca-editorial-os
git status --short --branch
npx tauri dev
```

No pull/reset or database migration command is requested. Do not repeat previously accepted CMS/AI smoke merely to reconfirm it.

Use the clearly invented [synthetic JSON](../../__tests__/fixtures/article-import-synthetic.json). It contains one disposable test article, without actual sources or reporting. Do not upload your exports or screenshots containing private text to GitHub.

1. **New record and restart:** import that file using the Header import button. Expect one added article named `Synthetic import fixture — disposable` (or one preserved if already imported). Close/reopen the app and confirm the article remains.
2. **Preservation/retry:** edit only that test article's title or text, save it, then import the same original file again. Expect zero additions/one preserved, retaining the edited local title/text and existing articles.
3. **Invalid file/recovery:** create a local temporary JSON containing `{}`, attempt import and confirm the error with no missing/changed articles. Reimport the valid synthetic file and confirm controls work.

Report `1 OK; 2 OK; 3 OK` or the observed error. These checks add a test article; they do not replace or delete existing articles. If the standard stage/category was deactivated, the new import should reject clearly; report the message rather than changing real workflow configuration just for the test.

## Remaining limitations and next steps

Owner desktop import acceptance, full keyboard/NVDA/zoom/reduced-motion QA, final whole-branch independent Gate B and real packaged-engine/installer evidence remain pending. No fresh Linux/runtime result is claimed by local Windows tests. The [Phase 6.5 plan](../architecture/PHASE-6.5-PRODUCTION-EXPERIENCE-PLAN.md) is a draft; it introduces no engine, dependency, model download or attachment implementation. Merge/tag/release remain separate decisions.
