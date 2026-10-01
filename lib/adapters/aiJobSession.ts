import type { AiOrchestrationRequest } from '@/types/ai';

interface JobProvider {
  startInference(request: AiOrchestrationRequest): Promise<void>;
  cancelInference(jobId: string): Promise<void>;
}

/** Own subscriptions and synchronize cancellation with the native start acknowledgement. */
export class AiJobSession {
  private listeners: (() => void)[] = [];
  private active = true;
  private startPromise: Promise<void> | null = null;
  private cancelPromise: Promise<void> | null = null;
  cancellationRequested = false;

  constructor(readonly jobId: string, private readonly provider: JobProvider) {}

  async listen(subscribe: () => Promise<() => void>) {
    const unlisten = await subscribe();
    if (this.active) this.listeners.push(unlisten);
    else unlisten();
  }

  async start(request: AiOrchestrationRequest) {
    if (!this.active || this.cancellationRequested) return;
    this.startPromise = this.provider.startInference(request);
    await this.startPromise;
  }

  cancel(): Promise<void> {
    this.cancellationRequested = true;
    this.cancelPromise ??= (async () => {
      if (!this.startPromise) return;
      try { await this.startPromise; } catch { return; }
      // Start acknowledgement precedes cancellation, so the native registry already owns the job.
      await this.provider.cancelInference(this.jobId);
    })().catch(error => {
      this.cancelPromise = null;
      this.cancellationRequested = false;
      throw error;
    });
    return this.cancelPromise;
  }

  finish() {
    this.active = false;
    this.listeners.splice(0).forEach(unlisten => unlisten());
  }

  dispose() {
    this.finish();
    if (this.startPromise) {
      void this.cancel().catch(error => console.error('Could not cancel closed AI session', error));
    }
  }
}
