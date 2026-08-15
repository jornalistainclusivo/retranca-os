/**
 * @spec-source docs/specs/core-platform/spec.md
 * @generated 2026-08-10 — DO NOT EDIT MANUALLY
 * @prd-coverage FR-001, FR-002, FR-003, FR-004
 *
 * ⚠️ Source of truth is spec.md. Edit there, then regenerate this file.
 */

import { z } from "zod";

// ── Domain Types ──────────────────────────────────────────

export const ArticleStatusSchema = z.enum(["ideia", "pesquisa", "escrita", "revisao", "publicado"]);
export type ArticleStatus = z.infer<typeof ArticleStatusSchema>;

export const ChecklistItemSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  completed: z.boolean(),
  category: z.string().optional()
});
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

export const ArticleSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  status: ArticleStatusSchema,
  summary: z.string().optional(),
  targetPersona: z.string().optional(),
  checklist: z.array(ChecklistItemSchema).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type Article = z.infer<typeof ArticleSchema>;

// ── AI Assistant Payload Types ────────────────────────────

export const AiActionTypeSchema = z.enum([
  "generate_outline",
  "generate_alt_text",
  "generate_seo",
  "check_accessibility",
  "validate_inclusivity"
]);
export type AiActionType = z.infer<typeof AiActionTypeSchema>;

export const AiRequestPayloadSchema = z.object({
  action: AiActionTypeSchema,
  topic: z.string().optional(),
  text: z.string().optional(),
  imageDescription: z.string().optional(),
  imageBase64: z.string().optional(),
  imageMimeType: z.string().optional()
});
export type AiRequestPayload = z.infer<typeof AiRequestPayloadSchema>;

export const AiResponsePayloadSchema = z.object({
  result: z.string()
});
export type AiResponsePayload = z.infer<typeof AiResponsePayloadSchema>;
