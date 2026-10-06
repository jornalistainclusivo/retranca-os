import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  downloadLocalModel,
  canProvisionDevelopmentModel,
  DevelopmentProvisioningDisabledError,
  ModelProvisioningUnavailableError,
  provisionedModelStatus,
  subscribeModelDownloadProgress,
} from '@/lib/api/modelProvisioning';
import type { DownloadProgressEvent, LocalAiCapabilities } from '@/types/ai';

const { invoke, listen } = vi.hoisted(() => ({ invoke: vi.fn(), listen: vi.fn() }));
vi.mock('@tauri-apps/api/core', () => ({ invoke }));
vi.mock('@tauri-apps/api/event', () => ({ listen }));

const capabilities: LocalAiCapabilities = {
  hardware: { total_ram_bytes: 16 * 1024 ** 3, architecture: 'x86_64', local_ai_supported: true },
  model_exists: true,
  ollama: { detected: true, endpoint: 'http://localhost:11434', reachable: true, models: ['synthetic-test-model'] },
  sidecar_ready: true,
  development_fixtures_enabled: true,
  selected_provider: 'OLLAMA',
};

describe('Native model provisioning lifecycle', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    invoke.mockResolvedValue(capabilities);
    vi.stubGlobal('window', { __TAURI_INTERNALS__: {} });
  });
  afterEach(() => vi.unstubAllGlobals());

  it.each([undefined, {}])('rejects outside the desktop without subscription or simulated readiness: %j', runtime => {
    vi.stubGlobal('window', runtime);
    const result = downloadLocalModel(vi.fn());
    expect(invoke).not.toHaveBeenCalled();
    expect(listen).not.toHaveBeenCalled();
    return expect(result).rejects.toBeInstanceOf(ModelProvisioningUnavailableError);
  });

  it('waits for native completion/readback and retains the native Ollama selection', async () => {
    const unlisten = vi.fn();
    const onVerifying = vi.fn();
    listen.mockResolvedValue(unlisten);
    invoke.mockImplementation(async (command: string) => {
      if (command === 'download_model') listen.mock.calls[0][1]({ payload: undefined });
      else return capabilities;
    });

    expect(await downloadLocalModel(onVerifying)).toEqual(capabilities);
    expect(onVerifying).toHaveBeenCalledOnce();
    expect(invoke.mock.calls.map(call => call[0])).toEqual(['preflight_check', 'download_model', 'preflight_check']);
    expect(invoke.mock.calls[1][1].jobId).toMatch(/^download_[\da-f-]+$/);
    expect(unlisten).toHaveBeenCalledOnce();
    listen.mock.calls[0][1]({ payload: undefined });
    expect(onVerifying).toHaveBeenCalledOnce();
  });

  it.each(['download_model', 'preflight_check'])('releases verification subscription after %s fails', async failedCommand => {
    const unlisten = vi.fn();
    listen.mockResolvedValue(unlisten);
    invoke.mockImplementation(async (command: string) => {
      if (command === failedCommand && invoke.mock.calls.length > 1) throw new Error('Synthetic native failure');
      return capabilities;
    });
    await expect(downloadLocalModel(vi.fn())).rejects.toThrow('Synthetic native failure');
    expect(unlisten).toHaveBeenCalledOnce();
    if (failedCommand === 'download_model') expect(invoke).toHaveBeenCalledTimes(2);
  });

  it('does not start a native download when verification subscription fails', async () => {
    listen.mockRejectedValue(new Error('Synthetic subscription failure'));
    await expect(downloadLocalModel(vi.fn())).rejects.toThrow('Synthetic subscription failure');
    expect(invoke).toHaveBeenCalledExactlyOnceWith('preflight_check');
  });

  it.each([null, undefined, {}, { ...capabilities, development_fixtures_enabled: false }, { ...capabilities, development_fixtures_enabled: 'true' }])('blocks provisioning with missing/disabled/invalid native policy: %j', async policy => {
    invoke.mockResolvedValue(policy);
    expect(canProvisionDevelopmentModel(policy as LocalAiCapabilities | null | undefined)).toBe(false);
    await expect(downloadLocalModel(vi.fn())).rejects.toBeInstanceOf(DevelopmentProvisioningDisabledError);
    expect(invoke).toHaveBeenCalledExactlyOnceWith('preflight_check');
    expect(listen).not.toHaveBeenCalled();
  });

  it('keeps a failed policy query recoverable without starting or subscribing', async () => {
    invoke.mockRejectedValueOnce(new Error('Synthetic policy failure'));
    await expect(downloadLocalModel(vi.fn())).rejects.toThrow('Synthetic policy failure');
    expect(listen).not.toHaveBeenCalled();
    const unlisten = vi.fn();
    listen.mockResolvedValue(unlisten);
    expect(await downloadLocalModel(vi.fn())).toEqual(capabilities);
    expect(invoke.mock.calls.map(call => call[0])).toEqual(['preflight_check', 'preflight_check', 'download_model', 'preflight_check']);
    expect(unlisten).toHaveBeenCalledOnce();
  });

  it('derives model state from native hardware/model facts independently of provider choice', () => {
    expect(provisionedModelStatus(capabilities)).toBe('READY');
    expect(provisionedModelStatus({ ...capabilities, model_exists: false })).toBe('MISSING');
    expect(provisionedModelStatus({ ...capabilities, hardware: { ...capabilities.hardware, local_ai_supported: false } })).toBe('INCOMPATIBLE');
  });

  it('unsubscribes a late progress registration and ignores callbacks after disposal', async () => {
    let resolveSubscription!: (release: () => void) => void;
    const unlisten = vi.fn();
    const onProgress = vi.fn();
    listen.mockImplementation(() => new Promise(resolve => { resolveSubscription = resolve; }));
    const dispose = subscribeModelDownloadProgress(onProgress);
    await vi.waitFor(() => expect(listen).toHaveBeenCalledOnce());
    dispose();
    resolveSubscription(unlisten);
    await vi.waitFor(() => expect(unlisten).toHaveBeenCalledOnce());
    listen.mock.calls[0][1]({ payload: { progress: 50, bytes_downloaded: 5, bytes_total: 10 } });
    dispose();
    expect(onProgress).not.toHaveBeenCalled();
    expect(unlisten).toHaveBeenCalledOnce();
  });

  it('bounds progress and ignores invalid numbers before forwarding native events', async () => {
    const unlisten = vi.fn();
    const onProgress = vi.fn();
    listen.mockResolvedValue(unlisten);
    const dispose = subscribeModelDownloadProgress(onProgress);
    await vi.waitFor(() => expect(listen).toHaveBeenCalledOnce());
    const emit = (payload: DownloadProgressEvent) => listen.mock.calls[0][1]({ payload });
    emit({ progress: 120, bytes_downloaded: 12, bytes_total: 10 });
    expect(onProgress).toHaveBeenLastCalledWith({ progress: 100, bytes_downloaded: 12, bytes_total: 10 });
    emit({ progress: NaN, bytes_downloaded: 0, bytes_total: 10 });
    emit({ progress: 10, bytes_downloaded: -1, bytes_total: 10 });
    listen.mock.calls[0][1]({ payload: null });
    expect(onProgress).toHaveBeenCalledOnce();
    dispose();
    expect(unlisten).toHaveBeenCalledOnce();
  });
});
