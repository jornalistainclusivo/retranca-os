import type { AiAction, AiOrchestrationRequest } from '@/types/ai';

// We reuse ensureTauri from localAiAdapter or create a shared context.
// For now we'll import it from localAiAdapter or rewrite it to export.
// Let's refactor ensureTauri into a shared util or export it from localAiAdapter.
import { tauriInvoke, ensureTauri } from './tauriContext';

export interface AiProvider {
  startInference(request: AiOrchestrationRequest): Promise<void>;
  cancelInference(jobId: string): Promise<void>;
}

export const SidecarProvider: AiProvider = {
  async startInference(request: AiOrchestrationRequest) {
    const ready = await ensureTauri();
    if (!ready || !tauriInvoke) throw new Error('Tauri runtime not available');

    request.provider = 'SIDECAR';
    await tauriInvoke('start_orchestrated_inference', { request });
  },
  async cancelInference(jobId: string) {
    const ready = await ensureTauri();
    if (!ready || !tauriInvoke) throw new Error('Tauri runtime not available');
    await tauriInvoke('cancel_inference', { jobId });
  }
};

export const OllamaProvider: AiProvider = {
  async startInference(request: AiOrchestrationRequest) {
    const ready = await ensureTauri();
    if (!ready || !tauriInvoke) throw new Error('Tauri runtime not available');

    if (!request.model) {
      throw new Error("Selecione um modelo Ollama em IA local antes de iniciar a geração.");
    }

    request.provider = 'OLLAMA';
    await tauriInvoke('start_orchestrated_inference', { request });
  },
  async cancelInference(jobId: string) {
    const ready = await ensureTauri();
    if (!ready || !tauriInvoke) throw new Error('Tauri runtime not available');
    await tauriInvoke('cancel_ollama_inference', { jobId });
  }
};
