# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to Semantic Versioning.

## [1.0.0] - 2026-08-10

### Added
- **Kanban Editorial Board:** Full drag-and-drop support with states (Ideia, Pesquisa, Escrita, Revisão, Publicado).
- **Local CMS Entity:** Individual article modal featuring metadata input, checklists, and summary fields.
- **Multimodal AI Assistant Modal:** 
  - Integration with `@google/genai` (Gemini 3.5 Flash).
  - Prompts dedicated to Plain Language, SEO, Alt Text (WCAG 2.2), Accessibility, and Inclusivity Validation.
  - Image upload support to generate Alt Text via computer vision.
  - File upload support (`.md`, `.txt`, `.csv`, `.json`) to pass large context to the AI model.
- **Rich AI Output Rendering:** Added `react-markdown` and `remark-gfm` + `@tailwindcss/typography` to properly format Gemini's responses in the UI.
- **Gamification:** Publish celebration triggers when moving articles to the final pipeline step.
- **Advanced Documentation:** Added PRD, SDD, C4 model diagrams, and technical specifications tailored for both human developers and autonomous AI agents.
