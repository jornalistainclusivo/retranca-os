import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchLocalAiReadiness, LocalAiReadinessUnavailableError } from '@/lib/api/localAiReadiness';
import type { LocalAiReadinessReport, LocalAiReadinessState } from '@/types/localAiReadiness';

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/core', () => ({ invoke }));

const selectedModel = 'synthetic/editorial:stable';
const digest = 'a1'.repeat(32);

function reportFor(state: LocalAiReadinessState): LocalAiReadinessReport {
  const report: LocalAiReadinessReport = {
    state,
    runtime_version: null,
    model: selectedModel,
    resolved_model: null,
    digest: null,
    capabilities: [],
    execution: 'UNKNOWN',
    message: 'Synthetic readiness diagnostic.',
  };
  if (state === 'NO_SELECTION' || state === 'INVALID_MODEL') report.model = null;
  if (state === 'UNSUPPORTED_RUNTIME') report.runtime_version = '0.0.0';
  if (['MODEL_MISSING', 'REMOTE_MODEL', 'UNSUPPORTED_CAPABILITY', 'READY'].includes(state)) {
    report.runtime_version = '0.35.1';
  }
  if (['REMOTE_MODEL', 'UNSUPPORTED_CAPABILITY', 'READY'].includes(state)) {
    report.resolved_model = selectedModel;
  }
  if (state === 'UNSUPPORTED_CAPABILITY') {
    report.digest = digest;
    report.capabilities = ['embedding'];
  }
  if (state === 'READY') {
    report.digest = digest;
    report.capabilities = ['completion'];
    report.execution = 'LOCAL_REQUEST_ENFORCED';
  }
  return report;
}

describe('Local AI readiness native boundary', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal('window', { __TAURI_INTERNALS__: {} });
  });
  afterEach(() => vi.unstubAllGlobals());

  it.each([undefined, {}])('rejects outside the desktop without native calls: %j', async runtime => {
    vi.stubGlobal('window', runtime);
    await expect(fetchLocalAiReadiness(selectedModel)).rejects.toBeInstanceOf(LocalAiReadinessUnavailableError);
    expect(invoke).not.toHaveBeenCalled();
  });

  it.each<LocalAiReadinessState>([
    'NO_SELECTION',
    'INVALID_MODEL',
    'SERVER_UNREACHABLE',
    'UNSUPPORTED_RUNTIME',
    'MODEL_MISSING',
    'REMOTE_MODEL',
    'UNSUPPORTED_CAPABILITY',
    'VERIFICATION_FAILED',
    'READY',
  ])('preserves the native %s report instead of inventing readiness', async state => {
    const report = reportFor(state);
    const model = state === 'NO_SELECTION' ? null : state === 'INVALID_MODEL' ? 'synthetic invalid name' : selectedModel;
    invoke.mockResolvedValue(report);

    expect(await fetchLocalAiReadiness(model)).toEqual(report);
    expect(invoke).toHaveBeenCalledExactlyOnceWith('get_local_ai_readiness', { model });
  });

  it('preserves the exact chosen tag and sends no editorial content or model operations', async () => {
    const model = 'localhost:5010/synthetic/editorial:stable';
    const report = { ...reportFor('READY'), model, resolved_model: model };
    invoke.mockResolvedValue(report);

    expect(await fetchLocalAiReadiness(model)).toEqual(report);
    expect(invoke).toHaveBeenCalledExactlyOnceWith('get_local_ai_readiness', { model });
  });

  it('keeps a resolved legacy alias diagnostic without replacing the requested choice', async () => {
    const model = 'synthetic-editorial';
    const report = { ...reportFor('READY'), model, resolved_model: `${model}:latest` };
    invoke.mockResolvedValue(report);

    const result = await fetchLocalAiReadiness(model);
    expect(result.model).toBe(model);
    expect(result.resolved_model).toBe(`${model}:latest`);
    expect(invoke).toHaveBeenCalledExactlyOnceWith('get_local_ai_readiness', { model });
  });

  it.each([
    null,
    {},
    [],
    'READY',
    { ...reportFor('READY'), state: 'UNRECOGNIZED' },
    { ...reportFor('READY'), execution: 'LOCAL_CERTIFIED' },
    { ...reportFor('READY'), runtime_version: 35 },
    { ...reportFor('READY'), model: 7 },
    { ...reportFor('READY'), resolved_model: [] },
    { ...reportFor('READY'), digest: 'not-a-manifest-digest' },
    { ...reportFor('READY'), capabilities: 'completion' },
    { ...reportFor('READY'), capabilities: [7] },
    { ...reportFor('READY'), capabilities: [''] },
    { ...reportFor('READY'), capabilities: ['completion', 'invalid capability'] },
    { ...reportFor('READY'), message: null },
    { ...reportFor('READY'), message: '' },
    { ...reportFor('READY'), runtime_version: '0'.repeat(10000) },
    { ...reportFor('READY'), model: 'x'.repeat(10000) },
    { ...reportFor('READY'), resolved_model: 'x'.repeat(10000) },
    { ...reportFor('READY'), capabilities: Array(33).fill('completion') },
    { ...reportFor('READY'), capabilities: ['completion', 'x'.repeat(10000)] },
    { ...reportFor('READY'), message: 'x'.repeat(10000) },
  ])('rejects malformed or oversized native reports %#', async payload => {
    invoke.mockResolvedValue(payload);
    await expect(fetchLocalAiReadiness(selectedModel)).rejects.toThrow();
    expect(invoke).toHaveBeenCalledExactlyOnceWith('get_local_ai_readiness', { model: selectedModel });
  });

  it.each([
    { ...reportFor('READY'), runtime_version: '0.35.2' },
    { ...reportFor('READY'), runtime_version: null },
    { ...reportFor('READY'), execution: 'UNKNOWN' },
    { ...reportFor('READY'), model: null },
    { ...reportFor('READY'), resolved_model: null },
    { ...reportFor('READY'), digest: null },
    { ...reportFor('READY'), capabilities: ['embedding'] },
    { ...reportFor('READY'), capabilities: [] },
    { ...reportFor('REMOTE_MODEL'), execution: 'LOCAL_REQUEST_ENFORCED' },
    { ...reportFor('VERIFICATION_FAILED'), execution: 'LOCAL_REQUEST_ENFORCED' },
  ])('rejects inconsistent execution evidence instead of displaying READY %#', async payload => {
    invoke.mockResolvedValue(payload);
    await expect(fetchLocalAiReadiness(selectedModel)).rejects.toThrow();
  });

  it.each([
    { ...reportFor('READY'), model: 'synthetic-other:stable' },
    { ...reportFor('READY'), resolved_model: 'synthetic-other:stable' },
    { ...reportFor('MODEL_MISSING'), model: 'synthetic-other:stable' },
  ])('rejects reports belonging to another selection or resolution %#', async payload => {
    invoke.mockResolvedValue(payload);
    await expect(fetchLocalAiReadiness(selectedModel)).rejects.toThrow();
  });

  it('propagates a native failure and allows a later manual retry', async () => {
    const report = reportFor('READY');
    invoke.mockRejectedValueOnce(new Error('Synthetic native outage')).mockResolvedValueOnce(report);

    await expect(fetchLocalAiReadiness(selectedModel)).rejects.toThrow();
    expect(await fetchLocalAiReadiness(selectedModel)).toEqual(report);
    expect(invoke).toHaveBeenCalledTimes(2);
    expect(invoke).toHaveBeenNthCalledWith(1, 'get_local_ai_readiness', { model: selectedModel });
    expect(invoke).toHaveBeenNthCalledWith(2, 'get_local_ai_readiness', { model: selectedModel });
  });
});
