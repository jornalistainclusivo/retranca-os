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

// ─── Dynamic Tauri Import (SSR-safe) ────────────────────────────────────────

let tauriInvoke: ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null = null;
let tauriListen: ((event: string, handler: (event: { payload: unknown }) => void) => Promise<() => void>) | null = null;

async function ensureTauri() {
  if (typeof window === 'undefined') return false;
  if (tauriInvoke && tauriListen) return true;

  try {
    const core = await import('@tauri-apps/api/core');
    const eventMod = await import('@tauri-apps/api/event');
    tauriInvoke = core.invoke;
    tauriListen = eventMod.listen as typeof tauriListen;
    return true;
  } catch {
    // Not running inside Tauri (e.g. browser dev, tests)
    return false;
  }
}

// ─── Hardware Detection ──────────────────────────────────────────────────────

export async function checkHardware(): Promise<HardwareInfo> {
  const ready = await ensureTauri();
  if (!ready || !tauriInvoke) {
    return { total_ram_gb: 0, arch: 'unknown', is_supported: false };
  }
  return tauriInvoke('check_hardware', {}) as Promise<HardwareInfo>;
}

// ─── Inference ───────────────────────────────────────────────────────────────

const SIDECAR_BINARY = 'llama-sidecar'; // Resolved by Tauri at runtime

export async function startInference(
  jobId: string,
  action: AiAction,
  prompt: string,
): Promise<void> {
  const ready = await ensureTauri();
  if (!ready || !tauriInvoke) {
    throw new Error('Tauri runtime not available');
  }

  await tauriInvoke('start_inference', {
    job_id: jobId,
    program: SIDECAR_BINARY,
    args: ['--action', action, '--prompt', prompt],
  });
}

export async function cancelInference(jobId: string): Promise<void> {
  const ready = await ensureTauri();
  if (!ready || !tauriInvoke) {
    throw new Error('Tauri runtime not available');
  }

  await tauriInvoke('cancel_inference', { job_id: jobId });
}

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
