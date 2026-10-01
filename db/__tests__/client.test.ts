import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sqlite: { execute: vi.fn(), select: vi.fn() },
  get: vi.fn(), migrate: vi.fn(), invoke: vi.fn(), drizzle: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-sql', () => ({ default: { get: mocks.get } }));
vi.mock('@tauri-apps/api/core', () => ({ invoke: mocks.invoke }));
vi.mock('@/db/migrations/phase64Migrate', () => ({ runPhase64Migration: mocks.migrate }));
vi.mock('drizzle-orm/sqlite-proxy', () => ({ drizzle: mocks.drizzle }));

describe('native database initialization and save failures', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
    mocks.get.mockResolvedValue(mocks.sqlite);
    mocks.sqlite.execute.mockResolvedValue({ rowsAffected: 0 });
    mocks.migrate.mockResolvedValue(undefined);
    mocks.invoke.mockResolvedValue({ success: true });
    mocks.drizzle.mockImplementation(execute => ({ execute }));
  });

  it('serializes concurrent startup callers through one migration before returning the database', async () => {
    const { getDb } = await import('@/db/client');
    const [first, second] = await Promise.all([getDb(), getDb()]);
    expect(first).toBe(second);
    expect(mocks.get).toHaveBeenCalledTimes(1);
    expect(mocks.migrate).toHaveBeenCalledTimes(1);
    expect(mocks.invoke).toHaveBeenCalledExactlyOnceWith('migrate_article_content');
    expect(mocks.drizzle).toHaveBeenCalledTimes(1);
  });

  it('fails closed on migration failure and permits a subsequent initialization retry', async () => {
    mocks.invoke.mockRejectedValueOnce(new Error('Backup failed'));
    const { getDb } = await import('@/db/client');
    await expect(getDb()).rejects.toThrow('Backup failed');
    expect(mocks.drizzle).not.toHaveBeenCalled();
    await expect(getDb()).resolves.toBeDefined();
    expect(mocks.invoke).toHaveBeenCalledTimes(2);
  });

  it('propagates a failed SQL write instead of claiming a successful empty result', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { getDb } = await import('@/db/client');
    const database = await getDb();
    mocks.sqlite.execute.mockRejectedValueOnce(new Error('Write failed'));
    await expect(database.execute('UPDATE articles SET analysisContent = ? WHERE id = ?', ['A', 'article-a'], 'run'))
      .rejects.toThrow('Write failed');
    log.mockRestore();
  });
});
