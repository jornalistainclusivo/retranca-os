import { describe, expect, it, vi } from 'vitest';
import { AiJobSession } from '@/lib/adapters/aiJobSession';
import type { AiOrchestrationRequest } from '@/types/ai';
import { OllamaProvider } from '@/lib/adapters/aiProviderRouter';
import { ensureTauri, tauriInvoke } from '@/lib/adapters/tauriContext';

vi.mock('@/lib/adapters/tauriContext', () => ({ ensureTauri: vi.fn(), tauriInvoke: vi.fn() }));

const request = { job_id: 'job' } as AiOrchestrationRequest;
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const provider = () => ({ startInference: vi.fn(async () => {}), cancelInference: vi.fn(async () => {}) });

describe('AI session lifecycle', () => {
  it('routes Ollama cancellation to the registered native command', async () => {
    vi.mocked(ensureTauri).mockResolvedValue(true);
    vi.mocked(tauriInvoke!).mockResolvedValue(undefined);
    await OllamaProvider.cancelInference('owned-job');
    expect(tauriInvoke).toHaveBeenLastCalledWith('cancel_ollama_inference', { jobId: 'owned-job' });
  });

  it('rejects cancellation without a native runtime', async () => {
    vi.mocked(ensureTauri).mockResolvedValue(false);
    const priorCalls = vi.mocked(tauriInvoke!).mock.calls.length;
    await expect(OllamaProvider.cancelInference('job')).rejects.toThrow('Tauri runtime not available');
    expect(vi.mocked(tauriInvoke!).mock.calls).toHaveLength(priorCalls);
  });

  it('preserves a native cancellation error for the dialog to announce', async () => {
    vi.mocked(ensureTauri).mockResolvedValue(true);
    vi.mocked(tauriInvoke!).mockRejectedValueOnce(new Error('transport error'));
    await expect(OllamaProvider.cancelInference('job')).rejects.toThrow('transport error');
  });

  it('cancels only after native start acknowledgement and coalesces repeated clicks', async () => {
    const native = provider();
    const ack = deferred<void>();
    native.startInference.mockReturnValue(ack.promise);
    const session = new AiJobSession('job', native);
    const start = session.start(request);
    const cancel = session.cancel();
    expect(session.cancel()).toBe(cancel);
    expect(native.cancelInference).not.toHaveBeenCalled();
    ack.resolve();
    await Promise.all([start, cancel]);
    expect(native.cancelInference).toHaveBeenCalledExactlyOnceWith('job');
  });

  it('does not start native inference when canceled during subscription setup', async () => {
    const native = provider();
    const session = new AiJobSession('job', native);
    await session.cancel();
    await session.start(request);
    expect(native.startInference).not.toHaveBeenCalled();
    expect(native.cancelInference).not.toHaveBeenCalled();
  });

  it('releases late subscriptions and prevents a closed dialog from starting a job', async () => {
    const native = provider();
    const session = new AiJobSession('job', native);
    const pending = deferred<() => void>();
    const unlisten = vi.fn();
    const listen = session.listen(() => pending.promise);
    session.dispose();
    pending.resolve(unlisten);
    await listen;
    await session.start(request);
    expect(unlisten).toHaveBeenCalledOnce();
    expect(native.startInference).not.toHaveBeenCalled();
  });

  it('cancels a closing session while native start is in flight', async () => {
    const native = provider();
    const ack = deferred<void>();
    native.startInference.mockReturnValue(ack.promise);
    const session = new AiJobSession('job', native);
    const start = session.start(request);
    session.dispose();
    ack.resolve();
    await start;
    await session.cancel();
    expect(native.cancelInference).toHaveBeenCalledExactlyOnceWith('job');
  });

  it('allows retry after a cancellation transport error', async () => {
    const native = provider();
    native.cancelInference.mockRejectedValueOnce(new Error('transport error'));
    const session = new AiJobSession('job', native);
    await session.start(request);
    await expect(session.cancel()).rejects.toThrow('transport error');
    expect(session.cancellationRequested).toBe(false);
    await session.cancel();
    expect(native.cancelInference).toHaveBeenCalledTimes(2);
  });

  it('cleans every listener once on normal completion without canceling the provider', async () => {
    const native = provider();
    const session = new AiJobSession('job', native);
    const unlisten = vi.fn();
    await session.listen(async () => unlisten);
    await session.start(request);
    session.finish();
    session.finish();
    expect(unlisten).toHaveBeenCalledOnce();
    expect(native.cancelInference).not.toHaveBeenCalled();
  });

  it('does not issue a cancellation command when native start failed', async () => {
    const native = provider();
    native.startInference.mockRejectedValueOnce(new Error('missing model'));
    const session = new AiJobSession('job', native);
    await expect(session.start(request)).rejects.toThrow('missing model');
    await session.cancel();
    expect(native.cancelInference).not.toHaveBeenCalled();
  });
});
