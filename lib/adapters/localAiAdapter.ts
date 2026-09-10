/**
 * Local AI Adapter — Tauri IPC Bridge
 *
 * Encapsulates all Tauri `invoke` calls and event listeners for the
 * local LLM sidecar. This is the ONLY module that imports from
 * `@tauri-apps/api`. All other frontend code must go through this adapter.
 */

import type {
  AiStreamTokenEvent,
  AiStreamDoneEvent,
  AiStreamCanceledEvent,
  AiStreamErrorEvent,
  HardwareInfo,
  AiAction,
} from '@/types/ai';

import { ensureTauri, tauriInvoke, tauriListen } from './tauriContext';

// ─── Hardware Detection ──────────────────────────────────────────────────────

export async function checkHardware(): Promise<HardwareInfo> {
  const ready = await ensureTauri();
  if (!ready || !tauriInvoke) {
    return { total_ram_bytes: 0, architecture: 'unknown', local_ai_supported: false };
  }
  return tauriInvoke('check_hardware', {}) as Promise<HardwareInfo>;
}

// Note: startInference and cancelInference have been moved to aiProviderRouter.ts

// ─── Event Listeners ─────────────────────────────────────────────────────────

export type UnlistenFn = () => void;

export async function onStreamToken(
  handler: (event: AiStreamTokenEvent) => void,
): Promise<UnlistenFn> {
  const ready = await ensureTauri();
  if (!ready || !tauriListen) return () => {};

  return tauriListen('ai-stream-token', (e) => {
    handler(e.payload as AiStreamTokenEvent);
  });
}

export async function onStreamDone(
  handler: (event: AiStreamDoneEvent) => void,
): Promise<UnlistenFn> {
  const ready = await ensureTauri();
  if (!ready || !tauriListen) return () => {};

  return tauriListen('ai-stream-done', (e) => {
    handler(e.payload as AiStreamDoneEvent);
  });
}

export async function onStreamCanceled(
  handler: (event: AiStreamCanceledEvent) => void,
): Promise<UnlistenFn> {
  const ready = await ensureTauri();
  if (!ready || !tauriListen) return () => {};

  return tauriListen('ai-stream-canceled', (e) => {
    handler(e.payload as AiStreamCanceledEvent);
  });
}

export async function onStreamError(
  handler: (event: AiStreamErrorEvent) => void,
): Promise<UnlistenFn> {
  const ready = await ensureTauri();
  if (!ready || !tauriListen) return () => {};

  return tauriListen('ai-stream-error', (e) => {
    handler(e.payload as AiStreamErrorEvent);
  });
}
