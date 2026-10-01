interface ArticleSaveCallbacks {
  onSaved: () => void;
  onError: () => void;
  onSettled: () => void;
}

/** Suppress stale UI callbacks; closing a session does not cancel a database write. */
export async function runArticleSave(
  save: () => void | Promise<void>,
  signal: AbortSignal,
  callbacks: ArticleSaveCallbacks,
): Promise<void> {
  if (signal.aborted) return;
  try {
    await save();
    if (!signal.aborted) callbacks.onSaved();
  } catch {
    if (!signal.aborted) callbacks.onError();
  } finally {
    if (!signal.aborted) callbacks.onSettled();
  }
}
