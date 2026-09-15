# Phase 6.4 Product Access & Monetization Discovery

## 1. Executive Summary
This document explores the product strategy and commercial model for Retranca OS Phase 6.4. The central hypothesis is that the Free tier provides a complete, standardized editorial experience, while the PRO tier delivers value through deep **editorial workflow customization**. This document identifies candidate PRO capabilities, establishes guarantees for the Free baseline, and explores the role of identity and entitlement without dictating technical enforcement.

## 2. Product Baseline
The starting point is the current functional Retranca OS (Phase 6.3), defined in the `PHASE-6.4-FREE-BASELINE-CAPABILITY-INVENTORY.md`. This baseline operates as a fully functional, local-first, AI-assisted editorial OS with a fixed taxonomy and workflow.

## 3. Product Principles
- **Additive Value:** The Free product is the current functional Retranca OS baseline. PRO must add value through additional capabilities rather than by removing existing Free functionality.
- Monetization != artificial restriction of existing utility.
- Customization != core usability.
- Local AI != premium entitlement.
- Feature visibility != authorization.

## 4. Why a PRO Tier May Exist
A PRO tier exists to solve the tension between a highly opinionated standard workflow (ideal for solo journalists or small teams wanting out-of-the-box best practices) and the bespoke realities of professional newsrooms (which have established desks, specific metadata requirements, and unique operational stages). PRO exists to adapt Retranca to the user's specific editorial reality.

## 5. Target Users
| Segment | Standard Workflow Fit | Customization Needs | Coordination Complexity | Willingness to Pay | Likely PRO Value |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Independent Journalist** | High | Low | Low | Low-Medium | Low (Standard suffices) |
| **Freelancer** | High | Medium (by client) | Low | Medium | Medium (Checklists/Tags) |
| **Small Newsroom (2-5)** | Medium | High | Medium | Medium-High | High (Custom stages/categories) |
| **Digital Publication** | Low-Medium | High | High | High | High (Custom taxonomy/workflows) |
| **Larger Newsroom** | Low | Critical | Critical | High | Critical (Requires enterprise features deferred for now) |

*Hypothesis:* The sweet spot for initial PRO workflow customization is the Small Newsroom to Digital Publication segments.

## 6. Core Monetization Hypothesis
**PRO = Editorial Workflow Customization.**
The Free tier teaches the user how to use a robust editorial standard. The PRO tier allows the user to break that standard and mold the software to their own business processes.

## 7. Free Product Guarantee
The following capabilities are explicitly guaranteed to remain Free. They will NOT be moved behind a paywall or artificially restricted:
- Standard Kanban workflow with current 5 editorial stages (Ideia, Pesquisa, Escrita, Revisão, Publicado).
- Standard category set and arbitrary tagging.
- Article/CMS management (CRUD).
- All current views (List, Calendar, Statistics).
- Notes and checklists functionality (using standard templates).
- Local SQLite persistence and offline capabilities.
- Existing local editorial AI capabilities and the 6 Phase 6.3 editorial actions.

## 8. PRO Capability Candidates
Based on the Core Hypothesis, the following capabilities have been evaluated:

| Capability | User Value | Target Persona | UX Complexity | Arch Impact | PRO Fit | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Rename Workflow Stages** | High | Small Newsroom | Low | Medium | STRONG | **PRO CANDIDATE** |
| **Add/Remove/Reorder Stages**| High | Digital Pub | Medium | High | STRONG | **PRO CANDIDATE** |
| **Custom Categories** | High | Freelancer/Pub | Low | Medium | STRONG | **PRO CANDIDATE** |
| **Custom Checklist Templates**| Medium | Small Newsroom | Medium | Medium | STRONG | **PRO CANDIDATE** |
| **Custom Editorial Fields** | High | Digital Pub | High | High | POSSIBLE | **DEFER** |
| **Saved Workflow Templates** | Low-Med | Freelancer | High | High | WEAK | **REJECT** |
| **Multiple Workflows** | High | Larger Newsroom | High | High | POSSIBLE | **DEFER** |
| **Import/Export Config** | Medium | Admin/IT | Low | Medium | POSSIBLE | **DEFER** |

*Note: Architectural impact ("Arch Impact") is provided as consultative evidence by the Software Architect, not as the deciding product factor.*

## 9. Workflow Customization Model
- **STANDARD CONTENT MODEL (Free):** Hardcoded `ArticleStatus`, fixed board columns. Guaranteed stable for independent users.
- **CUSTOMIZED EDITORIAL SYSTEM (PRO):** A configuration layer that allows the taxonomy to be overridden locally. Stages become dynamic entities (with configurable names, colors, and order). 

## 10. Taxonomy & Metadata Customization
Similar to the workflow, categories (`CategoryTag`) transition from a fixed closed-domain string literal to a dynamic, user-configurable entity in PRO. Custom editorial fields (like adding a specific "Sponsor" field) are highly valuable but deferred due to high architectural and UX complexity for this immediate phase.

## 11. Templates & Multiple Workflows
Supporting multiple concurrent workflows (e.g., one for "Podcasts", one for "Articles") introduces significant cognitive and architectural overhead. This is deferred. PRO will focus on customizing a *single* global workflow for the local instance.

## 12. Identity / Authentication / Entitlement Analysis
Does PRO automatically require a cloud identity (login)?
- **A. Product tier definition:** Defines capabilities, doesn't require identity.
- **B. Purchase/Licensing:** Requires an email/identity to record the transaction securely.
- **C. Identity:** Knowing *who* the user is locally.
- **D. Authentication:** Verifying identity.
- **E. Entitlement enforcement:** Validating if the current installation has PRO rights.

*Conclusion on Identity:* PRO can conceptually exist with a local license key (offline activation). However, account identity might be needed for license retrieval, purchase flows, and future sync features. 
**Identity is NOT strictly required for the product usage itself, but may be required for the commercial transaction and entitlement verification.** A decision is needed on whether to enforce via offline license keys or via an authenticated cloud session.

## 13. Future Commercial Capabilities
The following capabilities are explicitly separated from workflow-customization PRO and should be treated as future hypotheses (e.g., Phase 7 or "Team" tier):
- Team collaboration (multiplayer).
- Cloud sync / database replication.
- Managed backups.
- Centralized administration and shared organizational templates.
- Hosted inference endpoints (cloud AI).

## 14. Candidate Capability Matrix
| Capability | Current Free | Candidate Free | Candidate PRO | Deferred | Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Standard 5-stage Kanban | YES | YES | - | - | Core usability principle |
| Local AI Actions (6 core) | YES | YES | - | - | Core usability principle |
| Rename Stages | NO | - | YES | - | Direct workflow adaptation |
| Add/Remove Stages | NO | - | YES | - | Direct workflow adaptation |
| Custom Categories | NO | - | YES | - | Direct taxonomy adaptation |
| Custom Checklists | NO | - | YES | - | Direct workflow adaptation |
| Custom Metadata Fields | NO | - | - | YES | High complexity, defer |
| Multiple Workflows | NO | - | - | YES | High complexity, defer |
| Cloud Sync / Multiplayer | NO | - | - | YES | Entirely different product axis |

## 15. Risks
- **Architectural Risk:** Transforming hardcoded types (`ArticleStatus`, `CategoryTag`) into dynamic database entities requires careful migration of existing Free user data.
- **UX Risk:** Custom stages must map correctly to the AI Actions (which currently rely on fixed statuses to determine "Recommended" actions). If a user renames "Revisão" to "Quality Control", the AI context projection must still understand the semantic mapping.

## 16. Open Product Decisions
The Human Product Owner must decide on the following:
1. **Scope confirmation:** Are custom stages, categories, and checklists approved for Phase 6.4 PRO scope?
2. **AI Action Mapping:** When users create custom stages, do they manually map them to the 6 core AI Actions, or is that deferred?
3. **Identity vs. License Key:** Will PRO be activated via an online login session (Supabase/Auth0) or via an offline-capable license key (Paddle/LemonSqueezy activation)?
4. **Data boundaries:** If a user downgrades from PRO to Free, do their custom stages revert to the standard 5 stages (risking data loss), or are they frozen in a read-only custom state?

## 17. Recommended Next Phase
Pending Human Product Owner approval of this Discovery document and resolution of the Open Decisions, the next step is Technical Architecture (SDD) to determine how dynamic statuses will be persisted and how entitlement will be structurally enforced.

## 18. Non-Goals
This Discovery document **DOES NOT**:
- Implement PRO capabilities.
- Implement auth, licensing, or payments.
- Implement entitlement checks.
- Select a payment provider (Stripe, Paddle, etc.).
- Select an auth provider (Supabase, Auth0, Clerk, etc.).
- Redesign AI provider policies.
- Modify the current Free product.
