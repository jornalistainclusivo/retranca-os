import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  BACKUP_TABLES, createWorkspaceBackup, listWorkspaceBackups, verifyWorkspaceBackup,
  workspaceBackupErrorMessage, WorkspaceBackupResponseError, WorkspaceBackupUnavailableError,
} from '@/lib/api/workspaceBackup';
import { WorkspaceBackupPanel } from '@/components/WorkspaceBackupPanel';

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/core', () => ({ invoke }));
const operationId = '11111111-1111-4111-8111-111111111111';
const fixture = () => ({ directory: '/synthetic/fixtures/backups/workspace-' + operationId, receipt: {
  format_version: 1, operation_id: operationId, source_app_identifier: 'com.jornalistainclusivo.retranca.fixtures',
  app_version: '0.1.0', created_at_unix_ms: 1_791_629_407_000, sqlite_version: '3.51.3', database_schema_version: 2,
  database_size: 16384, database_sha256: 'a'.repeat(64), schema_sha256: 'b'.repeat(64),
  table_counts: Object.fromEntries(BACKUP_TABLES.map(table => [table, 0])),
} });

describe('Internal workspace backup IPC boundary', () => {
  beforeEach(() => { vi.resetAllMocks(); vi.stubGlobal('window', { __TAURI_INTERNALS__: {} }); });
  afterEach(() => vi.unstubAllGlobals());

  it.each([undefined, {}])('does not use browser storage or IPC outside desktop: %j', async runtime => {
    vi.stubGlobal('window', runtime);
    await expect(listWorkspaceBackups()).rejects.toBeInstanceOf(WorkspaceBackupUnavailableError);
    await expect(createWorkspaceBackup()).rejects.toBeInstanceOf(WorkspaceBackupUnavailableError);
    await expect(verifyWorkspaceBackup(operationId)).rejects.toBeInstanceOf(WorkspaceBackupUnavailableError);
    expect(invoke).not.toHaveBeenCalled();
  });

  it('creates only through native completion and verifies only by operation ID', async () => {
    invoke.mockResolvedValue(fixture());
    expect(await createWorkspaceBackup()).toEqual(fixture());
    expect(invoke).toHaveBeenCalledExactlyOnceWith('create_workspace_backup');
    invoke.mockClear();
    expect(await verifyWorkspaceBackup(operationId)).toEqual(fixture());
    expect(invoke).toHaveBeenCalledExactlyOnceWith('verify_internal_workspace_backup', { operationId });
  });

  it('does not report success until the native promise completes', async () => {
    let finish!: (value: unknown) => void;
    invoke.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    let complete = false;
    const pending = createWorkspaceBackup().then(value => { complete = true; return value; });
    await vi.waitFor(() => expect(invoke).toHaveBeenCalledOnce());
    expect(complete).toBe(false);
    finish(fixture());
    await expect(pending).resolves.toEqual(fixture());
  });

  it.each(['../outside', 'C:/private/file', 'abc', '11111111-1111-1111-8111-111111111111'])('rejects invalid IDs without native invocation: %s', async value => {
    await expect(verifyWorkspaceBackup(value)).rejects.toBeInstanceOf(WorkspaceBackupResponseError);
    expect(invoke).not.toHaveBeenCalled();
  });

  it.each([
    (value: ReturnType<typeof fixture>) => { value.receipt.format_version = 2; },
    (value: ReturnType<typeof fixture>) => { value.receipt.database_schema_version = 3; },
    (value: ReturnType<typeof fixture>) => { value.receipt.database_size = 256 * 1024 * 1024 + 1; },
    (value: ReturnType<typeof fixture>) => { value.receipt.database_size = 0; },
    (value: ReturnType<typeof fixture>) => { value.receipt.database_sha256 = 'invalid'; },
    (value: ReturnType<typeof fixture>) => { value.receipt.source_app_identifier = 'other.application'; },
    (value: ReturnType<typeof fixture>) => { value.receipt.operation_id = '22222222-2222-4222-8222-222222222222'; },
    (value: ReturnType<typeof fixture>) => { delete value.receipt.table_counts.articles; },
    (value: ReturnType<typeof fixture>) => { value.receipt.table_counts.articles = -1; },
    (value: ReturnType<typeof fixture>) => { value.receipt.created_at_unix_ms = Number.POSITIVE_INFINITY; },
  ])('rejects an unsupported/malformed completed receipt %#', async alter => {
    const value = fixture(); alter(value); invoke.mockResolvedValue(value);
    await expect(verifyWorkspaceBackup(operationId)).rejects.toBeInstanceOf(WorkspaceBackupResponseError);
  });

  it('returns inventory as unverified IDs, rejects duplicates, and never requests file contents', async () => {
    const value = { directory: '/synthetic/backups', source_app_identifier: fixture().receipt.source_app_identifier,
      entries: [{ operation_id: operationId, modified_at_unix_ms: 0 }] };
    invoke.mockResolvedValue(value);
    expect(await listWorkspaceBackups()).toEqual(value);
    expect(invoke).toHaveBeenCalledExactlyOnceWith('list_workspace_backups');
    invoke.mockResolvedValue({ ...value, entries: [...value.entries, ...value.entries] });
    await expect(listWorkspaceBackups()).rejects.toBeInstanceOf(WorkspaceBackupResponseError);
  });

  it('preserves native rejection and emits safe error text without private paths/content', async () => {
    const failure = { code: 'ERR_WORKSPACE_BACKUP', retryable: false, details: { stage: 'receipt', private: 'C:/private/editorial.sqlite3' } };
    invoke.mockRejectedValue(failure);
    await expect(createWorkspaceBackup()).rejects.toBe(failure);
    expect(workspaceBackupErrorMessage(failure)).not.toContain('C:/private');
    expect(workspaceBackupErrorMessage({ details: { stage: 'busy' }, message: 'secret' })).not.toContain('secret');
    expect(workspaceBackupErrorMessage({ code: 'ERR_WORKSPACE_BACKUP', details: { stage: 'busy' } })).toContain('Outra operação');
  });

  it('keeps the entry point disabled until editorial startup is ready', () => {
    const html = renderToStaticMarkup(React.createElement(WorkspaceBackupPanel, { workspaceReady: false }));
    const trigger = html.match(/<button\b([^>]*)>Backup do espaço editorial<\/button>/);
    expect(trigger?.[1]).toContain('disabled');
    expect(trigger?.[1]).toContain('aria-haspopup="dialog"');
    expect(invoke).not.toHaveBeenCalled();
  });
});
