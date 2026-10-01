import { describe, expect, it, vi } from 'vitest';
import { runArticleSave } from '@/lib/utils/articleSave';

function deferredWrite() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function callbacks() {
  return { onSaved: vi.fn(), onError: vi.fn(), onSettled: vi.fn() };
}

describe('article save callbacks belong to the active dialog session', () => {
  it('waits for persistence before closing the current dialog', async () => {
    const write = deferredWrite();
    const handlers = callbacks();
    const saving = runArticleSave(() => write.promise, new AbortController().signal, handlers);
    expect(handlers.onSaved).not.toHaveBeenCalled();
    write.resolve();
    await saving;
    expect(handlers.onSaved).toHaveBeenCalledOnce();
    expect(handlers.onSettled).toHaveBeenCalledOnce();
    expect(handlers.onError).not.toHaveBeenCalled();
  });

  it('keeps the current dialog open when persistence fails', async () => {
    const handlers = callbacks();
    await runArticleSave(() => Promise.reject(new Error('Write failed')), new AbortController().signal, handlers);
    expect(handlers.onSaved).not.toHaveBeenCalled();
    expect(handlers.onError).toHaveBeenCalledOnce();
    expect(handlers.onSettled).toHaveBeenCalledOnce();
  });

  it.each(['resolve', 'reject'] as const)('ignores late %s after a dialog session closes', async outcome => {
    const write = deferredWrite();
    const session = new AbortController();
    const handlers = callbacks();
    const saving = runArticleSave(() => write.promise, session.signal, handlers);
    session.abort();
    if (outcome === 'resolve') write.resolve();
    else write.reject(new Error('Late failure'));
    await saving;
    for (const handler of Object.values(handlers)) expect(handler).not.toHaveBeenCalled();
  });

  it('does not begin a write for an already closed session', async () => {
    const session = new AbortController();
    session.abort();
    const write = vi.fn();
    await runArticleSave(write, session.signal, callbacks());
    expect(write).not.toHaveBeenCalled();
  });

  it('lets a new session save while the old write finishes without changing its callbacks', async () => {
    const oldWrite = deferredWrite();
    const oldSession = new AbortController();
    const oldHandlers = callbacks();
    const oldSaving = runArticleSave(() => oldWrite.promise, oldSession.signal, oldHandlers);
    oldSession.abort();
    const currentHandlers = callbacks();
    await runArticleSave(() => Promise.resolve(), new AbortController().signal, currentHandlers);
    oldWrite.reject(new Error('Old write failed'));
    await oldSaving;
    expect(currentHandlers.onSaved).toHaveBeenCalledOnce();
    expect(currentHandlers.onSettled).toHaveBeenCalledOnce();
    expect(currentHandlers.onError).not.toHaveBeenCalled();
    for (const handler of Object.values(oldHandlers)) expect(handler).not.toHaveBeenCalled();
  });
});
