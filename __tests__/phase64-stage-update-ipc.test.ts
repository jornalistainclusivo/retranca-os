import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { updateWorkflowStage } from '@/lib/api/articles';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

describe('Workflow stage update IPC serialization', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { __TAURI_INTERNALS__: true });
    vi.mocked(invoke).mockResolvedValue({ success: true });
  });
  afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); });

  it('omits classification on rename so native state is preserved', async () => {
    await updateWorkflowStage('stage', 'Novo nome');
    expect(invoke).toHaveBeenCalledWith('update_workflow_stage', {
      request: { id: 'stage', display_name: 'Novo nome' },
    });
  });

  it('sends explicit null to remove classification', async () => {
    await updateWorkflowStage('stage', undefined, null);
    expect(invoke).toHaveBeenCalledWith('update_workflow_stage', {
      request: { id: 'stage', semantic_classification: null },
    });
  });
});
