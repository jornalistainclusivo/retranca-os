import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import {
  SQLITE_VERSION, SQLITE_SOURCE_ID, SQLITE_SOURCE_SHA3,
  staticLibraryName, validateProbe, validateCache,
} from '../prepare-sqlite-runtime.mjs';

const target = 'x86_64-pc-windows-msvc';
const options = ['THREADSAFE=1', 'ENABLE_COLUMN_METADATA', 'ENABLE_UNLOCK_NOTIFY', 'DEFAULT_FOREIGN_KEYS', 'ENABLE_FTS5'];
const probe = { sqlite_version: SQLITE_VERSION, sqlite_source_id: SQLITE_SOURCE_ID, target, compile_options: options };
const digest = content => createHash('sha256').update(content).digest('hex');

test('the engine proof rejects old SQLite, changed source, wrong target and disabled options', () => {
  assert.doesNotThrow(() => validateProbe(probe, target, SQLITE_SOURCE_SHA3));
  assert.throws(() => validateProbe({ ...probe, sqlite_version: '3.46.0' }, target, SQLITE_SOURCE_SHA3));
  assert.throws(() => validateProbe({ ...probe, sqlite_source_id: 'unknown' }, target, SQLITE_SOURCE_SHA3));
  assert.throws(() => validateProbe(probe, 'x86_64-unknown-linux-gnu', SQLITE_SOURCE_SHA3));
  assert.throws(() => validateProbe(probe, target, 'changed source hash'));
  assert.throws(() => validateProbe({ ...probe, compile_options: options.slice(1) }, target, SQLITE_SOURCE_SHA3));
});

test('native platform selection keeps static artifacts and rejects unsupported targets', () => {
  assert.equal(staticLibraryName(target), 'sqlite3.lib');
  assert.equal(staticLibraryName('x86_64-unknown-linux-gnu'), 'libsqlite3.a');
  assert.throws(() => staticLibraryName('x86_64-apple-darwin'));
});

test('an incomplete, stale, oversized or changed static cache is never accepted', () => {
  const directory = mkdtempSync(join(tmpdir(), 'retranca-sqlite-build-test-'));
  try {
    const inputs = { 'synthetic-recipe': digest('recipe') };
    assert.equal(validateCache(directory, target, inputs), false);
    writeFileSync(join(directory, 'sqlite3.lib'), 'synthetic static library');
    writeFileSync(join(directory, 'sqlite3.h'), 'synthetic header');
    const receipt = {
      schema_version: 1, ...probe, source_sha3_256: SQLITE_SOURCE_SHA3,
      library_file: 'sqlite3.lib', library_sha256: digest('synthetic static library'),
      header_sha256: digest('synthetic header'), input_hashes: inputs,
    };
    const save = () => writeFileSync(join(directory, 'build.json'), JSON.stringify(receipt));
    save();
    assert.equal(validateCache(directory, target, inputs), true);
    assert.equal(validateCache(directory, target, { 'synthetic-recipe': digest('changed recipe') }), false);
    assert.equal(validateCache(directory, 'x86_64-unknown-linux-gnu', inputs), false);
    receipt.sqlite_version = '3.46.0'; save();
    assert.equal(validateCache(directory, target, inputs), false);
    receipt.sqlite_version = SQLITE_VERSION;
    receipt.compile_options = options.join(','); save();
    assert.equal(validateCache(directory, target, inputs), false);
    receipt.compile_options = options; save();
    writeFileSync(join(directory, 'sqlite3.lib'), 'changed library');
    assert.equal(validateCache(directory, target, inputs), false);
    writeFileSync(join(directory, 'build.json'), ' '.repeat(16 * 1024 + 1));
    assert.equal(validateCache(directory, target, inputs), false);
  } finally {
    // Only this test's freshly created, fixed-prefix temporary directory is removed.
    const resolvedDirectory = resolve(directory);
    assert.ok(isAbsolute(directory));
    assert.equal(dirname(resolvedDirectory), resolve(tmpdir()));
    assert.ok(basename(resolvedDirectory).startsWith('retranca-sqlite-build-test-'));
    rmSync(resolvedDirectory, { recursive: true });
  }
});
