// Optional real-SQLite probe: Node 22.12 requires --experimental-sqlite.
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');
const root = fileURLToPath(new URL('../../', import.meta.url));
const probeDir = await mkdtemp(path.join(tmpdir(), 'retranca-cms-save-'));
const sqlite = new DatabaseSync(path.join(probeDir, 'discardable.db'));
const driver = {
  async execute(sql, params = []) {
    if (params.length) return sqlite.prepare(sql).run(...params);
    sqlite.exec(sql);
    return { rowsAffected: 0 };
  },
  async select(sql, params = []) { return sqlite.prepare(sql).all(...params); },
};

// Replace transport only; retain the production Drizzle bridge, adapter and save API.
globalThis.__retrancaCmsProbeDriver = driver;
globalThis.__retrancaCmsProbeInvoke = async command => {
  assert.equal(command, 'migrate_article_content');
  // Native backup/migration implementation has separate Rust tests.
  sqlite.exec("ALTER TABLE articles ADD COLUMN analysisContent TEXT NOT NULL DEFAULT ''; PRAGMA user_version = 2;");
  return { success: true };
};

try {
  const result = await build({
    stdin: {
      contents: `
        export { getDb } from '@/db/client';
        export { saveRawArticle, fetchAllRawArticles } from '@/lib/api/articles';
        export { fromArticleProps, toArticleProps } from '@/lib/adapters/articleAdapter';
        export { createNewArticle } from '@/lib/storage';
        export { DEFAULT_WORKFLOW_STAGES, DEFAULT_CATEGORIES } from '@/lib/initialData';
        export { scopedArticleRelationId } from '@/lib/utils/articleRelationIds';
        export { articles } from '@/db/schema';
      `,
      resolveDir: root, loader: 'ts',
    },
    bundle: true, write: false, platform: 'node', format: 'cjs', alias: { '@': root },
    plugins: [{
      name: 'isolated-cms-transport',
      setup(context) {
        context.onResolve({ filter: /^@tauri-apps\/(plugin-sql|api\/core)$/ }, args => ({
          path: args.path, namespace: 'cms-probe',
        }));
        context.onLoad({ filter: /.*/, namespace: 'cms-probe' }, args => ({
          contents: args.path.endsWith('plugin-sql')
            ? 'export default { get: () => globalThis.__retrancaCmsProbeDriver };'
            : 'export const invoke = (...args) => globalThis.__retrancaCmsProbeInvoke(...args);',
          loader: 'js',
        }));
      },
    }],
  });
  const compiledPath = path.join(probeDir, 'probe.cjs');
  await writeFile(compiledPath, result.outputFiles[0].text, 'utf8');
  const api = require(compiledPath);
  const db = await api.getDb();
  const create = title => ({
    ...api.createNewArticle(api.DEFAULT_WORKFLOW_STAGES, api.DEFAULT_CATEGORIES),
    title, analysisContent: `Saved content: ${title}`,
  });

  const first = create('Discardable A');
  await api.saveRawArticle(api.fromArticleProps(first));
  sqlite.prepare('UPDATE checklist_items SET id = ? WHERE articleId = ? AND label = ?')
    .run('c1', first.id, first.checklists[0].label);
  sqlite.prepare('UPDATE history_entries SET id = ? WHERE articleId = ?').run('h1', first.id);
  const firstSnapshot = sqlite.prepare('SELECT * FROM checklist_items WHERE articleId = ?').all(first.id);
  const firstHistory = sqlite.prepare('SELECT * FROM history_entries WHERE articleId = ?').all(first.id);

  const second = create('Discardable B');
  second.checklists[0].id = 'c1';
  second.history[0].id = 'h1';
  const raw = api.fromArticleProps(second);
  // Reproduce the partially persisted metadata left by the former non-atomic save.
  await db.insert(api.articles).values(raw.article);
  await api.saveRawArticle(raw);
  await api.saveRawArticle(raw);
  assert.deepEqual(sqlite.prepare('SELECT * FROM checklist_items WHERE articleId = ?').all(first.id), firstSnapshot);
  assert.deepEqual(sqlite.prepare('SELECT * FROM history_entries WHERE articleId = ?').all(first.id), firstHistory);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM checklist_items WHERE articleId = ?').get(second.id).count, 6);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM history_entries WHERE articleId = ?').get(second.id).count, 1);
  assert.equal(sqlite.prepare('SELECT articleId FROM checklist_items WHERE id = ?').get('c1').articleId, first.id);
  assert.equal(sqlite.prepare('SELECT articleId FROM history_entries WHERE id = ?').get('h1').articleId, first.id);
  const loaded = (await api.fetchAllRawArticles()).find(item => item.article.id === second.id);
  assert.equal(api.toArticleProps(loaded.article, loaded.checklists, loaded.history).analysisContent, second.analysisContent);

  const third = create('Discardable C');
  await api.saveRawArticle(api.fromArticleProps(third));
  const rejected = create('Discardable conflict');
  rejected.checklists[0].id = 'c1';
  sqlite.prepare('INSERT INTO checklist_items (id, articleId, label, completed) VALUES (?, ?, ?, 0)')
    .run(api.scopedArticleRelationId(rejected.id, 'c1'), first.id, 'Occupied scoped ID');
  await assert.rejects(api.saveRawArticle(api.fromArticleProps(rejected)), /ERR_CMS_RELATED_ID_CONFLICT/);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM articles WHERE id = ?').get(rejected.id).count, 0);
  console.log('PASS: real Drizzle/SQLite save, legacy collision recovery, retry identity, content reload, other-article preservation and pre-write rejection.');
} finally {
  delete globalThis.__retrancaCmsProbeDriver;
  delete globalThis.__retrancaCmsProbeInvoke;
  sqlite.close();
  // Remove only the directory created by this probe, never the editorial database.
  const resolved = path.resolve(probeDir);
  assert.equal(path.dirname(resolved), path.resolve(tmpdir()));
  assert.ok(path.basename(resolved).startsWith('retranca-cms-save-'));
  await rm(resolved, { recursive: true, force: true });
}
