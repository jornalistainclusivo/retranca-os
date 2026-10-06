import type { LocalAiReadinessReport, LocalAiReadinessState } from '@/types/localAiReadiness';

export class LocalAiReadinessUnavailableError extends Error {
  constructor() {
    super('A verificação de IA local requer o aplicativo desktop. Abra o Retranca no desktop e tente novamente.');
    this.name = 'LocalAiReadinessUnavailableError';
  }
}

const states: LocalAiReadinessState[] = [
  'NO_SELECTION', 'INVALID_MODEL', 'SERVER_UNREACHABLE', 'UNSUPPORTED_RUNTIME',
  'MODEL_MISSING', 'REMOTE_MODEL', 'UNSUPPORTED_CAPABILITY', 'VERIFICATION_FAILED', 'READY',
];

function validName(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 256
    && !/[\s\p{Cc}]/u.test(value);
}

function parseReport(result: unknown, requested: string | null): LocalAiReadinessReport {
  const invalid = () => new Error('O diagnóstico de IA local retornou dados inválidos. Tente verificar novamente.');
  if (!result || typeof result !== 'object' || Array.isArray(result)) throw invalid();
  const report = result as Record<string, unknown>;
  if (!states.includes(report.state as LocalAiReadinessState)
    || (report.execution !== 'UNKNOWN' && report.execution !== 'LOCAL_REQUEST_ENFORCED')
    || (report.model !== null && !validName(report.model))
    || (report.resolved_model !== null && !validName(report.resolved_model))
    || (report.runtime_version !== null && (typeof report.runtime_version !== 'string'
      || !report.runtime_version.length || report.runtime_version.length > 128
      || /[\s\p{Cc}]/u.test(report.runtime_version)))
    || (report.digest !== null && (typeof report.digest !== 'string' || !/^[a-f\d]{64}$/i.test(report.digest)))
    || typeof report.message !== 'string' || !report.message.trim() || report.message.length > 2048
    || !Array.isArray(report.capabilities) || report.capabilities.length > 32
    || report.capabilities.some(value => typeof value !== 'string' || !value.length
      || new TextEncoder().encode(value).length > 64 || /[\s\p{Cc}]/u.test(value))) throw invalid();

  if (report.state === 'NO_SELECTION') {
    if (requested !== null || report.model !== null) throw invalid();
  } else if (report.state === 'INVALID_MODEL') {
    if (report.model !== null) throw invalid();
  } else if (requested === null || report.model !== requested) throw invalid();

  if (report.resolved_model !== null
    && report.resolved_model !== requested && report.resolved_model !== `${requested}:latest`) throw invalid();
  if (report.state === 'READY') {
    if (report.execution !== 'LOCAL_REQUEST_ENFORCED' || report.runtime_version !== '0.35.1'
      || report.resolved_model === null || report.digest === null
      || !report.capabilities.includes('completion')) throw invalid();
  } else if (report.execution !== 'UNKNOWN') throw invalid();

  // Return only the public DTO; never forward extra native/provider metadata.
  return {
    state: report.state as LocalAiReadinessState,
    runtime_version: report.runtime_version as string | null,
    model: report.model as string | null,
    resolved_model: report.resolved_model as string | null,
    digest: report.digest as string | null,
    capabilities: [...report.capabilities] as string[],
    execution: report.execution as LocalAiReadinessReport['execution'],
    message: report.message,
  };
}

/** Inspect one session choice without sending editorial content or starting inference. */
export async function fetchLocalAiReadiness(model: string | null): Promise<LocalAiReadinessReport> {
  if (typeof window === 'undefined'
    || !(window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__) {
    throw new LocalAiReadinessUnavailableError();
  }
  const { invoke } = await import('@tauri-apps/api/core');
  return parseReport(await invoke<unknown>('get_local_ai_readiness', { model }), model);
}
