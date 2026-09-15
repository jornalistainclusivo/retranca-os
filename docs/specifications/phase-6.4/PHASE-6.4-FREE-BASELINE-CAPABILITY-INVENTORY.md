# Phase 6.4 Free Baseline Capability Inventory

## 1. Purpose
This document provides a factual, evidence-based inventory of the current functional Retranca OS baseline. It captures existing capabilities, identifies fixed architectural constraints, and serves as the definitive boundary for what constitutes the "Free" product tier. 

## 2. Baseline
- **Branch/Tag:** `v0.1.0-phase-6.3-editorial-ai-orchestration` (Phase 6.3 baseline).
- **Core Technology:** Tauri v2, Rust IPC, Next.js 16, React 19, SQLite local-first persistence.

## 3. Product Principle
The current functional Retranca OS baseline constitutes the Free product. Existing functionality belongs to the Free baseline unless explicitly decided otherwise in a later product discovery gate. This document does not remove or restrict any existing capability to manufacture a paid tier.

## 4. Editorial Workflow
| Capability | Implemented | Free Baseline | User Customizable | Evidence | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Kanban Board** | YES | YES | NO | `ActiveView` in `types/editorial.ts`, README | Core UI layout. |
| **Workflow Stages** | YES | YES | NO | `ArticleStatus` in `types/editorial.ts` | Hardcoded: `ideia`, `pesquisa`, `escrita`, `revisao`, `publicado`. |
| **Stage Movement** | YES | YES | NO | components/KanbanBoard.tsx | Articles can move between fixed stages via explicit UI status controls. |
| **Multiple Workflows**| NO | N/A | NO | `ArticleStatus` type | Only a single hardcoded workflow exists. |

## 5. CMS & Editorial Data
| Capability | Implemented | Free Baseline | User Customizable | Evidence | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Article Creation/Edit** | YES | YES | NO | `ArticleModal` in README | Core entity creation. |
| **Fixed Metadata Fields** | YES | YES | NO | `Article` interface in `types/editorial.ts` | Summary, objective, keyword, persona, cta, links, estimated/spent time, notes. |
| **Custom Fields** | NO | N/A | NO | `Article` interface | Schema is rigid and unmodifiable by users. |
| **Rich Content Body** | NO | N/A | NO | Phase 6.3 PRD V3 | Content body is pasted/selected on demand, not persisted locally yet. |

## 6. Classification & Filtering
| Capability | Implemented | Free Baseline | User Customizable | Evidence | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Fixed Categories** | YES | YES | NO | `CategoryTag` in `types/editorial.ts` | Hardcoded: 'IA', 'Acessibilidade', 'Inclusão', 'SEO', 'Docs', etc. |
| **Custom Category Creation**| NO | N/A | NO | `CategoryTag` type | Closed domain of categories. |
| **Article Tags** | YES | YES | YES | `tags: string[]` in `types/editorial.ts` | Users can assign arbitrary string tags. |
| **Time Filtering** | YES | YES | NO | `TimeFilter` in `types/editorial.ts` | Hardcoded periods: hoje, semana, mes, atrasados. |

## 7. Views
| Capability | Implemented | Free Baseline | User Customizable | Evidence | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Kanban View** | YES | YES | NO | `ActiveView` in `types/editorial.ts` | |
| **List View** | YES | YES | NO | `ActiveView` in `types/editorial.ts` | |
| **Calendar View** | YES | YES | NO | `ActiveView` in `types/editorial.ts` | |
| **Statistics View** | YES | YES | NO | `ActiveView` in `types/editorial.ts` | |
| **Governance Docs View** | YES | YES | NO | `ActiveView` in `types/editorial.ts`, README | Dedicated UI for BRD/PRD/SDD documents. |

## 8. Checklists
| Capability | Implemented | Free Baseline | User Customizable | Evidence | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Checklist Interaction** | YES | YES | PARTIAL | `ChecklistItem` in `types/editorial.ts` | Items can be completed. |
| **Checklist Categories** | YES | YES | NO | `category` in `ChecklistItem` | Hardcoded: 'pesquisa', 'seo', 'acessibilidade', etc. |
| **Custom Templates** | NO | N/A | NO | Codebase structure | No capability to create custom checklist templates. |

## 9. Editorial AI
| Capability | Implemented | Free Baseline | User Customizable | Evidence | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **6 Core Actions** | YES | YES | NO | Phase 6.3 PRD V3, README | Research Gaps, Plain Language, Inclusive Validator, Alt Text WCAG, SEO, Editorial Review. |
| **Context Projection** | YES | YES | NO | Phase 6.3 PRD V3 | Rust-orchestrated context budget & boundaries. |
| **Provider Selection** | DEVELOPER-ONLY | N/A | NO | CHANGELOG.md (Phase 6.2) | Manual local selection without production fallback. |

*Invariants:*
- Ollama capability != provider selection
- provider selection != Retranca provisioning
- Retranca provisioning != ModelStatus.READY

## 10. Local-First & Persistence
| Capability | Implemented | Free Baseline | User Customizable | Evidence | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SQLite DB** | YES | YES | NO | `db/schema.ts`, README | Handled via Tauri SQL Plugin & Drizzle ORM. |
| **Offline Capability** | YES | YES | NO | README | Core editorial CRUD and local persistence are designed to operate local-first/offline-capable. Local AI availability depends on runtime, model selection, and Phase 6.2/6.3 invariants. |

## 11. Accessibility
| Capability | Implemented | Free Baseline | User Customizable | Evidence | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Alt Text WCAG AI** | YES | YES | NO | Phase 6.3 PRD V3 | Strictly textual evidence (`visual_description`), no multimodal vision. |
| **UI Freeze (AI)** | YES | YES | NO | CHANGELOG.md | WCAG 2.2 / accessibility requirements guide the product and architecture during loading states. |

## 12. Developer-Only Capabilities
- **Model/Provider Selection:** Currently a developer runtime capability via local Ollama. No user-facing production UI exists for managing API keys, billing, or provider swapping.
- **Raw Inference IPC:** Raw IPC commands are debug-only and restricted/unavailable in release builds (orchestration is forced through the Rust boundary).

## 13. Current Customization Boundaries
The following product structures are strictly **fixed, hardcoded, closed-domain, or not user-customizable**:
- Workflow stages (names, ordering, quantity)
- Multiple concurrent workflows
- Categories (CategoryTag) and Category creation
- Checklist templates and their taxonomy
- Editorial metadata fields (e.g., adding a custom field)
- System labels and views

## 14. Capability Matrix
| Domain | Fixed Capability Implemented | Customization Implemented | Free Baseline Status |
| :--- | :--- | :--- | :--- |
| Workflow | YES | NO | Free |
| Metadata Fields | YES | NO | Free |
| Categories | YES | NO | Free |
| Checklists | YES | NO | Free |
| AI Actions (6 core) | YES | NO | Free |
| Database/Offline | YES | NO | Free |

## 15. Explicit Non-Conclusions
- This document **does not** define PRO features or tiers.
- This document **does not** define pricing.
- This document **does not** define authentication.
- This document **does not** define entitlement enforcement.
- This document **does not** authorize implementation of any kind.
