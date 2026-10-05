import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchLocalAiModels, LocalModelInventoryUnavailableError } from '@/lib/api/localAiModels';

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/core', () => ({ invoke }));

describe('Local model inventory native boundary', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal('window', { __TAURI_INTERNALS__: {} });
  });
  afterEach(() => vi.unstubAllGlobals());

  it.each([undefined, {}])('rejects non-desktop environments without native calls: %j', async runtime => {
    vi.stubGlobal('window', runtime);
    await expect(fetchLocalAiModels()).rejects.toBeInstanceOf(LocalModelInventoryUnavailableError);
    expect(invoke).not.toHaveBeenCalled();
  });

  it('returns exact installed tags once, in native order, without selecting/installing a model', async () => {
    invoke.mockResolvedValue(['synthetic/editorial:stable', 'synthetic-text:latest', 'synthetic/editorial:stable']);
    expect(await fetchLocalAiModels()).toEqual(['synthetic/editorial:stable', 'synthetic-text:latest']);
    expect(invoke).toHaveBeenCalledExactlyOnceWith('get_ollama_models');
  });

  it('keeps an empty native inventory empty', async () => {
    invoke.mockResolvedValue([]);
    expect(await fetchLocalAiModels()).toEqual([]);
  });

  it.each([null, {}, [''], [' synthetic:latest'], ['synthetic:latest '], [7], ['x'.repeat(257)], Array(1001).fill('synthetic:latest')])('rejects malformed/oversized native inventory %#', async payload => {
    invoke.mockResolvedValue(payload);
    await expect(fetchLocalAiModels()).rejects.toThrow('lista de modelos inválida');
  });

  it('propagates native failure and permits a later successful query', async () => {
    invoke.mockRejectedValueOnce(new Error('Synthetic native outage')).mockResolvedValueOnce(['synthetic-recovery:stable']);
    await expect(fetchLocalAiModels()).rejects.toThrow('Synthetic native outage');
    expect(await fetchLocalAiModels()).toEqual(['synthetic-recovery:stable']);
    expect(invoke).toHaveBeenCalledTimes(2);
  });
});
