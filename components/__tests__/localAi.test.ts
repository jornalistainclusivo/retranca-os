/**
 * Unit tests for the Local AI Adapter and AI State Machine types.
 *
 * These tests mock the Tauri API layer to validate the adapter logic
 * without requiring a running Tauri runtime.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  ModelStatus,
  GenerationState,
  AiStreamTokenEvent,
  AiStreamDoneEvent,
  AiStreamCanceledEvent,
  AiStreamErrorEvent,
  HardwareInfo,
} from '@/types/ai';

// ─── Type-level tests (compile-time validation) ─────────────────────────────

describe('AI State Machine Types', () => {
  it('ModelStatus accepts all valid states', () => {
    const states: ModelStatus[] = [
      'MISSING',
      'DOWNLOADING',
      'VERIFYING',
      'READY',
      'INCOMPATIBLE',
      'FAILED',
    ];
    expect(states).toHaveLength(6);
  });

  it('GenerationState accepts all valid states', () => {
    const states: GenerationState[] = [
      'IDLE',
      'QUEUED',
      'LOADING_MODEL',
      'GENERATING',
      'COMPLETED',
      'CANCELLING',
      'CANCELLED',
      'ERROR',
    ];
    expect(states).toHaveLength(8);
  });

  it('AiStreamTokenEvent is correctly shaped', () => {
    const event: AiStreamTokenEvent = { job_id: 'j1', token: 'hello' };
    expect(event.job_id).toBe('j1');
    expect(event.token).toBe('hello');
  });

  it('AiStreamErrorEvent carries a message', () => {
    const event: AiStreamErrorEvent = { job_id: 'j2', message: 'OOM' };
    expect(event.message).toBe('OOM');
  });

  it('HardwareInfo correctly marks unsupported hardware', () => {
    const hw: HardwareInfo = { total_ram_gb: 2.0, arch: 'armv7', is_supported: false };
    expect(hw.is_supported).toBe(false);
  });
});

// ─── Adapter logic tests (mocked Tauri) ─────────────────────────────────────

describe('localAiAdapter', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('checkHardware returns fallback when not inside Tauri', async () => {
    // In a node environment, dynamic import of @tauri-apps/api will fail,
    // and the adapter should return a safe fallback.
    const { checkHardware } = await import('@/lib/adapters/localAiAdapter');
    const result = await checkHardware();
    expect(result).toEqual({ total_ram_gb: 0, arch: 'unknown', is_supported: false });
  });

  it('startInference throws when not inside Tauri', async () => {
    const { SidecarProvider } = await import('@/lib/adapters/aiProviderRouter');
    await expect(
      SidecarProvider.startInference('job-1', 'generate_outline', 'test prompt'),
    ).rejects.toThrow('Tauri runtime not available');
  });

  it('cancelInference throws when not inside Tauri', async () => {
    const { SidecarProvider } = await import('@/lib/adapters/aiProviderRouter');
    await expect(SidecarProvider.cancelInference('job-1')).rejects.toThrow(
      'Tauri runtime not available',
    );
  });

  it('onStreamToken returns a no-op unlisten when not inside Tauri', async () => {
    const { onStreamToken } = await import('@/lib/adapters/localAiAdapter');
    const unlisten = await onStreamToken(() => {});
    expect(typeof unlisten).toBe('function');
    // calling it should not throw
    unlisten();
  });
});

// ─── Job isolation tests ─────────────────────────────────────────────────────

describe('Job ID isolation', () => {
  it('tokens from a different job_id are ignored by the consumer', () => {
    const activeJobId = 'job-active';
    const staleJobId = 'job-stale';
    let buffer = '';

    // Simulate the filtering logic from AiAssistantModal
    const handleToken = (event: AiStreamTokenEvent) => {
      if (event.job_id !== activeJobId) return;
      buffer += event.token;
    };

    handleToken({ job_id: staleJobId, token: 'IGNORED' });
    handleToken({ job_id: activeJobId, token: 'OK' });

    expect(buffer).toBe('OK');
    expect(buffer).not.toContain('IGNORED');
  });

  it('cancellation of one job does not affect another', () => {
    const jobs: Record<string, GenerationState> = {
      'job-a': 'GENERATING',
      'job-b': 'GENERATING',
    };

    // Simulate cancel for job-a only
    const canceledEvent: AiStreamCanceledEvent = { job_id: 'job-a' };
    if (jobs[canceledEvent.job_id]) {
      jobs[canceledEvent.job_id] = 'CANCELLED';
    }

    expect(jobs['job-a']).toBe('CANCELLED');
    expect(jobs['job-b']).toBe('GENERATING');
  });
});
