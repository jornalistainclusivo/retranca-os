# Phase 6.5 Increment 5 — Startup corrections and Início

Date: 2026-10-07. Scope: owner-authorized correction of screenshots A–D and implementation of the agreed initial page. Authority: [ADR-017](../../decisions/ADR-017-OPEN-EDITORIAL-STARTUP-AND-CATEGORY-CUSTOMIZATION.md), ADR-013 and existing domain/AI boundaries.

## Acceptance criteria

1. A fresh workspace loads suggested catalogs before creation, contains zero articles and does not seed articles on restart or after deleting the last article. Existing saved data/catalogs remain intact.
2. A load error is explicit, prevents creating/saving against incomplete state and offers retry. No sample fallback on read failure. A successful retry loads the actual snapshot.
3. Every saved article is discoverable. Unresolved references have a visible recovery section with an explicit CMS action; no automatic remapping/deletion. Displayed count versus total is explained when filters are applied. Deadline counts and filtering agree on local date/week/month rules.
4. Suggested and custom categories support rename and safe removal consistently in Rust, browser and UI. Duplicate/blank names, invalid targets and last active category removal remain blocked; referenced removal requires an explicit destination. Rename updates displayed labels by identity. Refresh after structural changes reloads affected articles and keeps new categories selectable.
5. Stage options use Ideia, Pesquisa, Redação, Revisão, Publicado and Sem classificação. Explain publication role separately, retaining exactly one active publication role. Technical origin labels become Sugerida / Criada por você.
6. Início uses the existing blue/slate/light/dark style. Sections: start/continue actions, suggested configuration and personalization, short workflow/CMS/checklist/local-AI instructions, recent saved articles and actual achievements. No account/premium language, fabricated milestones, mandatory AI or model downloads.
7. Achievements expose their exact criteria and achieved/in-progress state. Research/accessibility checklist criteria require at least one relevant item and completion of all relevant items in one saved article. They are self-recorded progress, not certification. Statistics reuse the same criteria.
8. Navigation/actions have visible keyboard focus, semantic controls, meaningful names and heading order. View changes focus the view heading; failures are announced. Layout wraps on small widths and supports reduced motion. Test compiled browser keyboard/viewport behavior; desktop/NVDA acceptance remains distinct.

## Evidence and boundaries

Use synthetic fixtures, mocked native bridges and disposable SQLite only; never read or mutate owner AppData/SQLite. An executable hash is an artifact observation, not application interaction or installer acceptance. Preserve owner `1 OK; 2 OK; 3 OK` as bounded original checks, with reported defects attached. Existing installed profiles may contain partial old example records: expose them for review without erasing them. Fresh NSIS receipt/binary identity and a clear owner script are required after runtime changes. No publication or CI dispatch implied.
