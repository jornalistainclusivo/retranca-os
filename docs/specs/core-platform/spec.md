---
jinc-spec-version: 1.0.0
project-name: Jornalista Inclusivo OS
feature-name: Core Platform & AI Assistant
status: draft
prd-ref: docs/PRD.md
sdd-ref: docs/SDD.md
related-branch: main
coverage: "6/6 FRs mapped"
created-at: 2026-08-10
authors: AI Assistant
---

# 📖 Technical Specification: Core Platform & AI Assistant

## Coverage Report

| FR | Requirement Summary | Spec Element | Status |
|---|---|---|---|
| FR-001 | Kanban Board & States | `ArticleStatus` type + `ArticleStateMachine` | 🟢 Covered |
| FR-002 | Article Local CMS | `Article` interface | 🟢 Covered |
| FR-003 | AI Assistant Actions | `AiActionType` + `POST /api/gemini/editorial` | 🟢 Covered |
| FR-004 | File Upload & Markdown | `AiRequestPayload.imageBase64` + UI markdown | 🟢 Covered |
| FR-005 | Accessibility (WCAG 2.2) | `BR-A11Y-001` Focus rings rule | 🟢 Covered |
| FR-006 | Gamification | `BR-GAM-001` Publish celebration | 🟢 Covered |

---

### 1. Core Domain Models

#### 🤖 AI-Ready Layer (Machine Consumable)
*(See `spec.types.ts` for full Zod schemas and TypeScript interfaces).*

#### 🔧 Implementation Layer (Human + AI)
The core entity is the `Article` stored in LocalStorage. It holds metadata, checklists, and current status. 

#### 🔗 Traceability Layer (Human)
Aligns with PRD Section 3 (CMS Local Integrado).

---

### 2. API Contract: AI Assistant

#### 🤖 AI-Ready Layer (Machine Consumable)
*(See `spec.openapi.yaml` for OpenAPI 3.1 specification).*

#### 🔧 Implementation Layer (Human + AI)
- **Endpoint:** `POST /api/gemini/editorial`
- Handled via Next.js Route Handlers to keep API keys hidden (Server-side only).
- Converts `imageBase64` to Gemini `inlineData` array when a valid image file is provided.
- **I/O Example:**
  - Input: `{ "action": "validate_inclusivity", "text": "Texto teste" }`
  - Output: `{ "result": "## Avaliação Inclusiva..." }`

#### 🔗 Traceability Layer (Human)
Addresses FR-003 and FR-004. Satisfies ADR 001 and ADR 002 from SDD.

---

### 3. State Machine: Article Lifecycle

#### 🤖 AI-Ready Layer (Machine Consumable)
*(See `diagrams/article-state.md`).*
States: `ideia` | `pesquisa` | `escrita` | `revisao` | `publicado`

#### 🔧 Implementation Layer (Human + AI)
Transitions are linear but allow jumping back to previous states via drag-and-drop or select menus. 

---

### 4. Business Rules

**BR-A11Y-001: Mandatory Focus Rings**
  - **Precondition:** User is navigating the interface via keyboard.
  - **Input:** Focus event on any interactive element (button, input, link, text area).
  - **Invariant:** All interactive elements MUST have explicit `focus-visible` styling indicating active state.
  - **Output/Action:** Display high-contrast focus ring (e.g., `focus-visible:ring-2 focus-visible:ring-blue-500`).
  - **Violation:** Element is focused but visually indistinguishable from unfocused elements.

**BR-GAM-001: Publish Celebration**
  - **Precondition:** Article status is not `publicado`.
  - **Input:** User changes status to `publicado`.
  - **Invariant:** LocalStorage updates the state immediately.
  - **Output/Action:** Trigger UI gamification feedback (e.g., confetti or toast notification) celebrating the inclusive publication.

---

### 5. Critical Path (Gherkin)

```gherkin
Feature: AI Assistant Editorial

  Scenario: Happy path — Generate Plain Language Validation
    Given an article in "escrita" state with drafted text
    When the user requests "validate_inclusivity" via the AI Assistant modal
    Then the system calls the Next.js API with the drafted text payload
    And the system displays the Markdown-rendered inclusion report from Gemini
```
