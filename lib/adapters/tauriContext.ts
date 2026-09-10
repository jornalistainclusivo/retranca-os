let tauriInvoke: ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null = null;
let tauriListen: ((event: string, handler: (event: { payload: unknown }) => void) => Promise<() => void>) | null = null;

export async function ensureTauri() {
  if (typeof window === 'undefined') return false;
  if (tauriInvoke && tauriListen) return true;

  try {
    const core = await import('@tauri-apps/api/core');
    const eventMod = await import('@tauri-apps/api/event');
    tauriInvoke = core.invoke;
    tauriListen = eventMod.listen as typeof tauriListen;
    return true;
  } catch {
    // Not running inside Tauri (e.g. browser dev, tests)
    return false;
  }
}

export { tauriInvoke, tauriListen };
