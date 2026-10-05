export class LocalModelInventoryUnavailableError extends Error {
  constructor() {
    super('A consulta de modelos requer o aplicativo desktop. Abra o Retranca no desktop e tente novamente.');
    this.name = 'LocalModelInventoryUnavailableError';
  }
}

/** Read exact native inventory tags without installing or selecting a model. */
export async function fetchLocalAiModels(): Promise<string[]> {
  if (typeof window === 'undefined'
    || !(window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__) {
    throw new LocalModelInventoryUnavailableError();
  }

  const { invoke } = await import('@tauri-apps/api/core');
  const result = await invoke<unknown>('get_ollama_models');
  if (!Array.isArray(result) || result.length > 1000
    || result.some(name => typeof name !== 'string' || !name.length || name.length > 256 || name.trim() !== name)) {
    throw new Error('O Ollama retornou uma lista de modelos inválida. Tente atualizar novamente.');
  }
  return [...new Set(result as string[])];
}
