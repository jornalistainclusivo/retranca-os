import type { AiAction } from '@/types/ai';

// We reuse ensureTauri from localAiAdapter or create a shared context.
// For now we'll import it from localAiAdapter or rewrite it to export.
// Let's refactor ensureTauri into a shared util or export it from localAiAdapter.
import { tauriInvoke, ensureTauri } from './tauriContext';

export interface AiProvider {
  startInference(jobId: string, action: AiAction, prompt: string): Promise<void>;
  cancelInference(jobId: string): Promise<void>;
}

export const SidecarProvider: AiProvider = {
  async startInference(jobId: string, action: AiAction, prompt: string) {
    const ready = await ensureTauri();
    if (!ready || !tauriInvoke) throw new Error('Tauri runtime not available');

    const SIDECAR_BINARY = 'llama-sidecar';
    await tauriInvoke('start_inference', {
      job_id: jobId,
      program: SIDECAR_BINARY,
      args: ['--action', action, '--prompt', prompt],
    });
  },
  async cancelInference(jobId: string) {
    const ready = await ensureTauri();
    if (!ready || !tauriInvoke) throw new Error('Tauri runtime not available');
    await tauriInvoke('cancel_inference', { job_id: jobId });
  }
};

export const OllamaProvider: AiProvider = {
  async startInference(jobId: string, action: AiAction, prompt: string) {
    const ready = await ensureTauri();
    if (!ready || !tauriInvoke) throw new Error('Tauri runtime not available');

    const model = 'llama3:latest';

    await tauriInvoke('start_ollama_inference', {
      job_id: jobId,
      model: model,
      prompt: `[Action: ${action}]\n\n${prompt}`,
    });
  },
  async cancelInference(jobId: string) {
    const ready = await ensureTauri();
    if (!ready || !tauriInvoke) throw new Error('Tauri runtime not available');
    console.warn("cancelInference not fully supported for Ollama yet");
  }
};
