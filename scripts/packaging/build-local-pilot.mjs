import { execFileSync, spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { constants, copyFileSync, createWriteStream, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import console from 'node:console';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const overlayPath = join(root, 'src-tauri/tauri.pilot.conf.json');
const basePath = join(root, 'src-tauri/tauri.conf.json');
const windowsPath = join(root, 'src-tauri/tauri.windows.conf.json');
export const PILOT_IDENTIFIER = 'com.jornalistainclusivo.retranca.pilot';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const allowedKeys = (object, keys) => Object.keys(object).every(key => keys.includes(key));

export function validatePilotConfig(base, overlay) {
  assert(base.identifier !== PILOT_IDENTIFIER, 'Pilot and normal application identifiers must differ.');
  assert(overlay.identifier === PILOT_IDENTIFIER && overlay.productName === 'Retranca OS Pilot'
    && overlay.mainBinaryName === 'retranca-pilot', 'Unexpected pilot identity.');
  assert(allowedKeys(overlay, ['$schema', 'identifier', 'productName', 'mainBinaryName', 'app', 'bundle']), 'Unexpected pilot configuration override.');
  assert(allowedKeys(overlay.app, ['windows']) && overlay.app.windows.length === 1, 'Unexpected pilot window configuration.');
  const window = overlay.app.windows[0];
  assert(window.label === 'main' && window.title.includes('Piloto local'), 'Pilot window must identify the isolated application.');
  assert(allowedKeys(window, ['label', 'title', 'width', 'height', 'resizable', 'fullscreen', 'zoomHotkeysEnabled']), 'Unexpected window override or data path.');
  assert(window.zoomHotkeysEnabled === true, 'The Windows pilot must enable native page zoom.');
  assert(!base.app.directories && !base.app.windows.some(item => Object.hasOwn(item, 'dataDirectory')), 'Custom application data paths are not allowed in this pilot.');
  assert(JSON.stringify(base.plugins?.sql?.preload) === JSON.stringify(['sqlite:retranca.db']), 'The pilot requires the existing relative database preload.');
  assert((base.bundle.resources == null || (Array.isArray(base.bundle.resources) && base.bundle.resources.length === 0))
    && Array.isArray(base.bundle.externalBin) && base.bundle.externalBin.length === 0, 'Normal resources or sidecars cannot enter the pilot.');
  assert(!base.bundle.windows?.nsis?.installerHooks && !base.bundle.windows?.nsis?.template
    && !base.build.beforeBundleCommand, 'Custom installer hooks, templates or bundle commands are not allowed in this pilot.');
  const bundle = overlay.bundle;
  assert(allowedKeys(bundle, ['active', 'targets', 'externalBin', 'windows'])
    && bundle.active === true && JSON.stringify(bundle.targets) === '["nsis"]'
    && Array.isArray(bundle.externalBin) && bundle.externalBin.length === 0, 'Unexpected pilot resources, hooks or bundle targets.');
  assert(allowedKeys(bundle.windows, ['webviewInstallMode', 'nsis'])
    && JSON.stringify(bundle.windows.webviewInstallMode) === '{"type":"skip"}'
    && JSON.stringify(bundle.windows.nsis) === '{"installMode":"currentUser"}', 'The pilot must use current-user NSIS without installing WebView2.');
  return { identifier: PILOT_IDENTIFIER, productName: overlay.productName, version: base.version };
}

export function validateWindowsZoomConfig(base, overlay) {
  assert(allowedKeys(overlay, ['$schema', 'app']) && allowedKeys(overlay.app, ['windows'])
    && base.app.windows.length === 1 && overlay.app.windows.length === 1, 'Unexpected Windows configuration override.');
  const expectedWindow = { ...base.app.windows[0], zoomHotkeysEnabled: true };
  const window = overlay.app.windows[0];
  assert(allowedKeys(window, Object.keys(expectedWindow))
    && Object.keys(expectedWindow).every(key => JSON.stringify(window[key]) === JSON.stringify(expectedWindow[key])),
    'The Windows override must preserve the normal window and enable native page zoom only.');
}

export function validateBuildEnvironment(environment) {
  for (const key of ['TAURI_CONFIG', 'RUSTFLAGS', 'CARGO_ENCODED_RUSTFLAGS', 'CARGO_BUILD_RUSTFLAGS', 'CARGO_BUILD_TARGET']) {
    assert(!environment[key], `Conflicting build override: ${key}.`);
  }
}

export function parseMode(args) {
  assert(args.length <= 1 && (!args.length || ['--check', '--build'].includes(args[0])), 'Use --check or --build only.');
  return args[0] ?? '--check';
}

export function selectInstaller(candidates, startedAt) {
  const fresh = candidates.filter(item => item.name.endsWith('-setup.exe') && item.modifiedAt >= startedAt);
  assert(fresh.length === 1, 'Expected exactly one freshly generated NSIS installer; old or ambiguous outputs are not accepted.');
  return fresh[0].name;
}

const hashFile = path => createHash('sha256').update(readFileSync(path)).digest('hex');

async function compile(args, targetDir, logPath) {
  const log = createWriteStream(logPath, { flags: 'wx' });
  await new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: root,
      env: { ...process.env, CARGO_TARGET_DIR: targetDir },
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout.on('data', chunk => { process.stdout.write(chunk); log.write(chunk); });
    child.stderr.on('data', chunk => { process.stderr.write(chunk); log.write(chunk); });
    child.once('error', reject);
    child.once('close', (code, signal) => {
      log.end();
      if (code === 0) resolvePromise();
      else reject(new Error(`Package build failed (exit ${code}, signal ${signal ?? 'none'}).`));
    });
  });
}

async function main() {
  const mode = parseMode(process.argv.slice(2));
  const base = JSON.parse(readFileSync(basePath, 'utf8'));
  const overlay = JSON.parse(readFileSync(overlayPath, 'utf8'));
  const windows = JSON.parse(readFileSync(windowsPath, 'utf8'));
  validateWindowsZoomConfig(base, windows);
  const identity = validatePilotConfig(base, overlay);
  validateBuildEnvironment(process.env);
  if (mode === '--check') {
    console.log(JSON.stringify({ configuration: 'valid', ...identity, webview2: 'already installed required', installer_execution: 'not requested' }));
    return;
  }
  assert(process.platform === 'win32', 'This first packaged pilot builds on Windows only; Linux needs separate native packaging evidence.');
  const baseline = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', windowsHide: true }).trim();
  const receiptDir = join(root, '.retranca-local/phase65-packaged-pilot', randomUUID());
  const targetDir = join(root, 'src-tauri/target/phase65-packaged-pilot');
  mkdirSync(receiptDir, { recursive: true });
  const receiptPath = join(receiptDir, 'build.json');
  const startedAt = Date.now();
  const inputFiles = [basePath, windowsPath, overlayPath, fileURLToPath(import.meta.url)];
  const receipt = {
    status: 'building', source_baseline: baseline, ...identity,
    platform: process.platform, architecture: process.arch, node_version: process.version,
    started_at: new Date(startedAt).toISOString(), target_directory: targetDir,
    input_hashes: inputFiles.map(path => ({ name: basename(path), sha256: hashFile(path) })),
    signing: 'disabled for this local pilot', artifacts: [], installed_runtime_acceptance: 'pending',
  };
  const save = () => writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  save();
  try {
    await compile([
      join(root, 'node_modules/@tauri-apps/cli/tauri.js'), 'build', '--config', overlayPath,
      '--bundles', 'nsis', '--no-sign', '--', '--locked', '--no-default-features',
    ], targetDir, join(receiptDir, 'build.log'));
    const nsisDir = join(targetDir, 'release/bundle/nsis');
    const installer = selectInstaller(readdirSync(nsisDir).map(name => ({ name, modifiedAt: statSync(join(nsisDir, name)).mtimeMs })), startedAt);
    for (const path of [join(targetDir, 'release/retranca-pilot.exe'), join(nsisDir, installer)]) {
      const destination = join(receiptDir, basename(path));
      copyFileSync(path, destination, constants.COPYFILE_EXCL);
      receipt.artifacts.push({ path: destination, bytes: statSync(destination).size, sha256: hashFile(destination) });
    }
    assert(receipt.input_hashes.every((item, index) => item.sha256 === hashFile(inputFiles[index])), 'Build configuration changed during compilation.');
    receipt.status = 'compiled';
  } catch (error) {
    receipt.status = 'failed';
    receipt.error = error.message;
    throw error;
  } finally {
    receipt.elapsed_ms = Date.now() - startedAt;
    save();
    console.log(`Local build receipt: ${receiptPath}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
