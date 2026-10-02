import type { DownloadProgressEvent, LocalAiCapabilities, ModelStatus } from '@/types/ai';

function isDesktopRuntime(): boolean {
  return typeof window !== 'undefined'
    && Boolean((window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);
}

export class ModelProvisioningUnavailableError extends Error {
  constructor() {
    super('O download de modelos está disponível no aplicativo desktop. Abra o Retranca no desktop para continuar.');
    this.name = 'ModelProvisioningUnavailableError';
  }
}

export function provisionedModelStatus(capabilities: LocalAiCapabilities): ModelStatus {
  if (!capabilities.hardware.local_ai_supported) return 'INCOMPATIBLE';
  return capabilities.model_exists ? 'READY' : 'MISSING';
}

/** Download only through native IPC and read back the native provider decision. */
export async function downloadLocalModel(onVerifying: () => void): Promise<LocalAiCapabilities> {
  if (!isDesktopRuntime()) throw new ModelProvisioningUnavailableError();

  const { invoke } = await import('@tauri-apps/api/core');
  const { listen } = await import('@tauri-apps/api/event');
  let active = true;
  const unlisten = await listen('download-verifying', () => {
    if (active) onVerifying();
  });

  try {
    await invoke('download_model', { jobId: `download_${crypto.randomUUID()}` });
    return await invoke<LocalAiCapabilities>('preflight_check');
  } finally {
    active = false;
    unlisten();
  }
}

/** Dispose even if the asynchronous native subscription resolves after close. */
export function subscribeModelDownloadProgress(onProgress: (progress: DownloadProgressEvent) => void): () => void {
  let disposed = false;
  let unlisten: (() => void) | undefined;

  if (isDesktopRuntime()) {
    void import('@tauri-apps/api/event').then(async ({ listen }) => {
      if (disposed) return;
      const release = await listen<DownloadProgressEvent>('download-progress', event => {
        if (disposed) return;
        if (!event.payload || typeof event.payload !== 'object') return;
        const { progress, bytes_downloaded, bytes_total } = event.payload;
        if (![progress, bytes_downloaded, bytes_total].every(value => Number.isFinite(value) && value >= 0)) return;
        onProgress({ progress: Math.min(100, progress), bytes_downloaded, bytes_total });
      });
      if (disposed) release();
      else unlisten = release;
    }).catch(() => {
      // The download command owns errors; progress subscription failure cannot claim success.
    });
  }

  return () => {
    if (disposed) return;
    disposed = true;
    unlisten?.();
  };
}
