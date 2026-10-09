import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import console from 'node:console';

export const SQLITE_VERSION = '3.51.3';
export const SQLITE_SOURCE_ID = '2026-03-13 10:38:09 737ae4a34738ffa0c3ff7f9bb18df914dd1cad163f28fd6b6e114a344fe6d618';
export const SQLITE_SOURCE_SHA3 = '32d5424f97e0a7fc5ed2f6335afbb58be4e0298bd7117a34e39d345ff13d859e';
export const RECIPE_FILES = [
  'scripts/build/prepare-sqlite-runtime.mjs',
  'tools/sqlite-runtime/Cargo.toml',
  'tools/sqlite-runtime/Cargo.lock',
  'tools/sqlite-runtime/build.rs',
  'tools/sqlite-runtime/src/main.rs',
];
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const digest = (bytes, algorithm = 'sha256') => createHash(algorithm).update(bytes).digest('hex');
const fileHash = filename => digest(readFileSync(filename));
const requiredOptions = ['THREADSAFE=1', 'ENABLE_COLUMN_METADATA', 'ENABLE_UNLOCK_NOTIFY', 'DEFAULT_FOREIGN_KEYS', 'ENABLE_FTS5'];

export function staticLibraryName(target) {
  if (target.includes('windows-msvc')) return 'sqlite3.lib';
  if (target.includes('linux-gnu')) return 'libsqlite3.a';
  throw new Error('This SQLite build supports native MSVC Windows and GNU Linux only.');
}

export function validateProbe(probe, target, sourceHash) {
  if (probe.sqlite_version !== SQLITE_VERSION || probe.sqlite_source_id !== SQLITE_SOURCE_ID
    || probe.target !== target || sourceHash !== SQLITE_SOURCE_SHA3
    || !Array.isArray(probe.compile_options)
    || requiredOptions.some(option => !probe.compile_options.includes(option))) {
    throw new Error('The compiled SQLite engine does not match the pinned source, target or required options.');
  }
}

export function validateCache(directory, target, inputs) {
  try {
    const receiptPath = join(directory, 'build.json');
    if (lstatSync(receiptPath).isSymbolicLink() || lstatSync(receiptPath).size > 16 * 1024) return false;
    const receipt = JSON.parse(readFileSync(receiptPath, 'utf8'));
    const library = staticLibraryName(target);
    if (receipt.schema_version !== 1 || receipt.sqlite_version !== SQLITE_VERSION
      || receipt.sqlite_source_id !== SQLITE_SOURCE_ID || receipt.source_sha3_256 !== SQLITE_SOURCE_SHA3
      || receipt.target !== target || receipt.library_file !== library
      || JSON.stringify(receipt.input_hashes) !== JSON.stringify(inputs)
      || !Array.isArray(receipt.compile_options)
      || requiredOptions.some(option => !receipt.compile_options?.includes(option))) return false;
    for (const [name, hash] of [[library, receipt.library_sha256], ['sqlite3.h', receipt.header_sha256]]) {
      const filename = join(directory, name);
      if (!lstatSync(filename).isFile() || lstatSync(filename).isSymbolicLink() || fileHash(filename) !== hash) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function ensureBuildDirectory(directory) {
  for (const ancestor of [root, join(root, '.retranca-local'), join(root, '.retranca-local/sqlite-runtime'), directory]) {
    if (existsSync(ancestor) && (!lstatSync(ancestor).isDirectory() || lstatSync(ancestor).isSymbolicLink())) {
      throw new Error('SQLite build directory must not redirect to another location.');
    }
    mkdirSync(ancestor, { recursive: true });
  }
}

function publishFile(source, destination) {
  const temporary = `${destination}.${randomUUID()}.pending`;
  copyFileSync(source, temporary);
  renameSync(temporary, destination);
}

export function prepareSqliteRuntime() {
  const rustc = execFileSync('rustc', ['-vV'], { cwd: root, encoding: 'utf8', windowsHide: true });
  const target = /^host: (.+)$/m.exec(rustc)?.[1];
  if (!target) throw new Error('Cannot identify the native Rust target.');
  const libraryName = staticLibraryName(target);
  const inputHashes = Object.fromEntries(RECIPE_FILES.map(relative => [relative, fileHash(join(root, relative))]));
  const directory = join(root, '.retranca-local/sqlite-runtime', SQLITE_VERSION);
  ensureBuildDirectory(directory);
  if (validateCache(directory, target, inputHashes)) {
    console.log(`SQLite ${SQLITE_VERSION}: verified static cache for ${target}.`);
    return;
  }

  // Override only the helper's SQLite selection. The app's Cargo config remains forced.
  const output = execFileSync('cargo', [
    'run', '--release', '--locked', '--manifest-path', 'tools/sqlite-runtime/Cargo.toml',
    '--config', 'env.LIBSQLITE3_SYS_USE_PKG_CONFIG.value="0"',
  ], {
    cwd: root,
    env: { ...process.env, CARGO_TARGET_DIR: join(root, 'tools/sqlite-runtime/target') },
    encoding: 'utf8', maxBuffer: 256 * 1024, windowsHide: true,
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  const probe = JSON.parse(output);
  const source = readFileSync(join(probe.source_directory, 'sqlite3.c'));
  validateProbe(probe, target, digest(source, 'sha3-256'));
  const librarySource = join(probe.library_directory, libraryName);
  const headerSource = join(probe.source_directory, 'sqlite3.h');
  const receipt = {
    schema_version: 1, sqlite_version: SQLITE_VERSION, sqlite_source_id: SQLITE_SOURCE_ID,
    source_sha3_256: SQLITE_SOURCE_SHA3, target, library_file: libraryName,
    library_sha256: fileHash(librarySource), header_sha256: fileHash(headerSource),
    compile_options: probe.compile_options, input_hashes: inputHashes,
  };
  if (RECIPE_FILES.some(relative => fileHash(join(root, relative)) !== inputHashes[relative])) {
    throw new Error('SQLite build inputs changed during compilation.');
  }
  publishFile(librarySource, join(directory, libraryName));
  publishFile(headerSource, join(directory, 'sqlite3.h'));
  const pending = join(directory, `build.${randomUUID()}.pending`);
  writeFileSync(pending, `${JSON.stringify(receipt, null, 2)}\n`, { flag: 'wx' });
  renameSync(pending, join(directory, 'build.json'));
  if (!validateCache(directory, target, inputHashes)) throw new Error('Published SQLite build failed verification.');
  console.log(`SQLite ${SQLITE_VERSION}: pinned source verified and statically prepared for ${target}.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { prepareSqliteRuntime(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
