/**
 * Phase 5 — AI State Machines & IPC Types
 *
 * Strict finite-state definitions for the local LLM runtime.
 * These types are the single source of truth for the frontend
 * and must match the Rust event payloads in `ai_supervisor.rs`.
 */

// ─── Model Provisioning State Machine ────────────────────────────────────────

/** Represents the lifecycle of the local AI model on disk. */
export type ModelStatus =
  | 'MISSING'
  | 'DOWNLOADING'
  | 'VERIFYING'
  | 'READY'
  | 'INCOMPATIBLE'
  | 'FAILED';

// ─── Generation (Inference) State Machine ────────────────────────────────────

/** Represents the lifecycle of a single inference request. */
export type GenerationState =
  | 'IDLE'
  | 'QUEUED'
  | 'LOADING_MODEL'
  | 'GENERATING'
  | 'COMPLETED'
  | 'CANCELLING'
  | 'CANCELLED'
  | 'ERROR';

// ─── AI Action Types ─────────────────────────────────────────────────────────

export type AiAction =
  | 'generate_outline'
  | 'generate_alt_text'
  | 'generate_seo'
  | 'check_accessibility'
  | 'validate_inclusivity';

// ─── Tauri Event Payloads (mirroring Rust structs) ───────────────────────────

export interface AiStreamTokenEvent {
  job_id: string;
  token: string;
}

export interface AiStreamDoneEvent {
  job_id: string;
}

export interface AiStreamCanceledEvent {
  job_id: string;
}

export interface AiStreamErrorEvent {
  job_id: string;
  message: string;
}

export interface DownloadProgressEvent {
  progress: number; // 0-100
  bytes_downloaded: number;
  bytes_total: number;
}

// ─── AI Capabilities (mirroring Rust struct) ───────────────────────────────────

export type ProviderType = 'SIDECAR' | 'OLLAMA' | 'CLOUD' | 'NONE';

export interface OllamaStatus {
  detected: boolean;
  endpoint: string;
  reachable: boolean;
  models: string[];
}

export interface HardwareInfo {
  total_ram_bytes: number;
  architecture: string;
  local_ai_supported: boolean;
}

export interface LocalAiCapabilities {
  hardware: HardwareInfo;
  model_exists: boolean;
  ollama: OllamaStatus;
  sidecar_ready: boolean;
  selected_provider: ProviderType;
}

// ─── Inference Request Payload ───────────────────────────────────────────────

export interface InferenceRequest {
  job_id: string;
  action: AiAction;
  prompt: string;
  context?: string;
}
