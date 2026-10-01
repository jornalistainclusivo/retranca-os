# Article Attachments — Product Discovery

Date: 2026-10-01. Status: requested utility; specification and implementation acceptance pending.

## User need

The product owner requested file inputs inside each article: images to consult while preparing visual descriptions, and text/document files to support the CMS workflow. These capabilities belong to the article rather than a shared global attachment list. The current article CMS offers text inputs; this discovery does not claim uploads have been implemented.

## Proposed delivery order

1. Article-scoped local image attachment and preview, with a human-authored visual description/alt-text field. Displaying an image does not mean the AI sees its pixels.
2. Explicit plain-text import into that article's analysis-content field. Show the proposed replacement and obtain confirmation before replacing existing text; preserve the original file.
3. Local document attachments with controlled opening and metadata. Parsing PDF/DOCX or OCR requires a separate format/dependency decision and acceptance tests; do not promise extraction from every format.
4. Optional multimodal AI evaluation only after provider/model capability contracts and responsible-AI acceptance are specified. The current native alt-text action accepts `visual_description` and rejects `image_asset`; attaching a file must not silently bypass it.

## Required design decisions before implementation

- Initial file formats and size/storage limits.
- Copying into an application-managed directory versus referencing an external file; behavior when the original moves or disappears.
- Stable attachment ID, article ID, filename/type/size and safe path ownership. Copy/associate atomically; avoid orphaned files and accidental cross-article references.
- Allowed image preview formats; validation beyond filename extensions; treatment of embedded active content and unsafe file-opening requests.
- Accessible file selection, progress/errors, keyboard controls and preview descriptions. A person must be able to consult or attach an image without invoking AI.
- Export/backup portability and restore behavior. The existing JSON-only article backup is insufficient to promise preservation of binary attachments.
- Separate confirmation and recovery rules for replacing content or deleting originals/attachments. Preserve source files by default.
- Local processing and explicit provider invocation; no automatic external upload.

## Proposed acceptance examples

- An image attached to article A appears only in A; article B's attachments and description are unchanged.
- The article retains its attachment association after restart; missing files produce a clear recoverable state.
- A text import previews its contents, modifies only the selected article when confirmed and remains available after explicit CMS save.
- Unsupported/oversized files fail clearly without altering article content or damaging the original file.
- Backup/restore preserves both article ownership and supported attached files under the approved storage design.

This is a backlog/discovery artifact, not an approved binary-storage schema or a Phase 6.5 implementation plan. [ADR-014](../decisions/ADR-014-ARTICLE-CMS-CONTENT-PERSISTENCE.md) addresses the immediate saved-text defect first. Attachments require their own agreed scope and architecture; do not expand the current migration into file storage.
