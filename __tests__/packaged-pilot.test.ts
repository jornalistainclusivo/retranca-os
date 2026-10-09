import { describe, expect, it } from 'vitest';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { validatePilotConfig, validateWindowsZoomConfig, validateBuildEnvironment, parseMode, selectInstaller, PILOT_IDENTIFIER, validateReceiptToolchain, deriveUnsignedNsisIdentity, copyPilotArtifacts, VERIFIED_NSIS_CLI_VERSION } from '../scripts/packaging/build-local-pilot.mjs';

const read = (file: string) => JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'));
const configs = () => [read('../src-tauri/tauri.conf.json'), read('../src-tauri/tauri.pilot.conf.json')];

describe('isolated packaged pilot boundary', () => {
  it('keeps the database and application identity separate using the real configurations', () => {
    const [base, overlay] = configs();
    expect(validatePilotConfig(base, overlay).identifier).toBe(PILOT_IDENTIFIER);
    expect(overlay.identifier).not.toBe(base.identifier);
    expect(overlay.productName).not.toBe(base.productName);
    expect(parseMode([])).toBe('--check');
  });

  it('preserves normal Windows window settings while enabling native zoom in both variants', () => {
    const [base, overlay] = configs();
    const windows = read('../src-tauri/tauri.windows.conf.json');
    expect(() => validateWindowsZoomConfig(base, windows)).not.toThrow();
    expect(windows.app.windows[0]).toEqual({ ...base.app.windows[0], zoomHotkeysEnabled: true });
    expect(overlay.app.windows[0].zoomHotkeysEnabled).toBe(true);
    expect(base.app.windows[0].zoomHotkeysEnabled).toBeUndefined();
  });

  it('rejects disabled zoom and unrelated overrides before accepting a Windows pilot configuration', () => {
    for (const value of [false, undefined]) {
      const [base, overlay] = configs();
      overlay.app.windows[0].zoomHotkeysEnabled = value;
      expect(() => validatePilotConfig(base, overlay)).toThrow();
    }
    for (const change of [
      (windows: ReturnType<typeof read>) => { windows.app.windows[0].zoomHotkeysEnabled = false; },
      (windows: ReturnType<typeof read>) => { windows.app.windows[0].dataDirectory = 'C:/private'; },
      (windows: ReturnType<typeof read>) => { windows.app.windows[0].title = 'Unexpected identity'; },
      (windows: ReturnType<typeof read>) => { windows.identifier = 'com.unexpected'; },
    ]) {
      const [base] = configs();
      const windows = read('../src-tauri/tauri.windows.conf.json');
      change(windows);
      expect(() => validateWindowsZoomConfig(base, windows)).toThrow();
    }
  });

  it('rejects namespace collisions, custom data paths and absolute database preloads', () => {
    const changes: Array<(base: ReturnType<typeof read>) => void> = [
      base => { base.identifier = PILOT_IDENTIFIER; },
      base => { base.app.directories = { config: 'C:/private' }; },
      base => { base.app.windows[0].dataDirectory = 'C:/private'; },
      base => { base.app.windows[0].dataDirectory = ''; },
      base => { base.plugins.sql.preload = ['sqlite:C:/private/article.db']; },
    ];
    for (const change of changes) {
      const [base, overlay] = configs();
      change(base);
      expect(() => validatePilotConfig(base, overlay)).toThrow();
    }
  });

  it('rejects model resources, fixture sidecars, installer hooks and runtime installation', () => {
    const changes: Array<(base: ReturnType<typeof read>, overlay: ReturnType<typeof read>) => void> = [
      (base) => { base.bundle.externalBin = ['bin/llama-sidecar']; },
      (base) => { base.bundle.resources = ['private.db']; },
      (base) => { base.bundle.resources = { 'private.db': 'private.db' }; },
      (base) => { base.bundle.windows = { nsis: { installerHooks: 'unsafe.nsh' } }; },
      (base) => { base.build.beforeBundleCommand = 'unexpected command'; },
      (_base, overlay) => { overlay.bundle.resources = ['model.gguf']; },
      (_base, overlay) => { overlay.bundle.windows.nsis.installerHooks = 'unsafe.nsh'; },
      (_base, overlay) => { overlay.bundle.windows.webviewInstallMode = { type: 'downloadBootstrapper' }; },
      (_base, overlay) => { overlay.build = { beforeBuildCommand: 'unexpected command' }; },
    ];
    for (const change of changes) {
      const [base, overlay] = configs();
      change(base, overlay);
      expect(() => validatePilotConfig(base, overlay)).toThrow();
    }
  });

  it('rejects inherited authority overrides and arbitrary build arguments', () => {
    expect(() => validateBuildEnvironment({})).not.toThrow();
    for (const key of ['TAURI_CONFIG', 'RUSTFLAGS', 'CARGO_ENCODED_RUSTFLAGS', 'CARGO_BUILD_RUSTFLAGS', 'CARGO_BUILD_TARGET']) {
      expect(() => validateBuildEnvironment({ [key]: 'unexpected' })).toThrow(key);
    }
    for (const args of [['--features'], ['--build', '--debug'], ['--install']]) {
      expect(() => parseMode(args)).toThrow();
    }
  });

  it('accepts one new installer while rejecting old, absent or ambiguous build outputs', () => {
    const old = { name: 'old-setup.exe', modifiedAt: 99 };
    const fresh = { name: 'pilot-setup.exe', modifiedAt: 101 };
    expect(selectInstaller([old, fresh], 100)).toBe('pilot-setup.exe');
    expect(() => selectInstaller([old], 100)).toThrow();
    expect(() => selectInstaller([], 100)).toThrow();
    expect(() => selectInstaller([fresh, { name: 'another-setup.exe', modifiedAt: 102 }], 100)).toThrow();
  });
});

describe('unsigned NSIS artifact identity', () => {
  const raw = () => Buffer.from('synthetic-header\0__TAURI_BUNDLE_TYPE_VAR_UNK\0synthetic-tail');
  const expected = () => Buffer.from('synthetic-header\0__TAURI_BUNDLE_TYPE_VAR_NSS\0synthetic-tail');
  const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

  it('derives the installed payload hash without changing the raw bytes or calling it an observation', () => {
    const bytes = raw();
    const before = Buffer.from(bytes);
    const identity = deriveUnsignedNsisIdentity(bytes, VERIFIED_NSIS_CLI_VERSION);
    expect(identity.sha256).toBe(sha256(expected()));
    expect(identity.raw_sha256).toBe(sha256(before));
    expect(identity.sha256).not.toBe(identity.raw_sha256);
    expect(identity.bytes).toBe(before.length);
    expect(identity.bundle_marker).toBe('NSS');
    expect(identity.verification).toContain('not an installed-file observation');
    expect(bytes).toEqual(before);
  });

  it.each([
    ['absent', Buffer.from('no marker')],
    ['duplicate', Buffer.concat([raw(), raw()])],
    ['mixed', Buffer.concat([raw(), expected()])],
    ['already patched', expected()],
    ['unknown', Buffer.from('__TAURI_BUNDLE_TYPE_VAR_MSI')],
    ['partial', Buffer.from('__TAURI_BUNDLE_TYPE_VAR_')],
  ])('rejects a %s marker instead of predicting a misleading installed hash', (_name, bytes) => {
    expect(() => deriveUnsignedNsisIdentity(bytes, VERIFIED_NSIS_CLI_VERSION)).toThrow();
  });

  it.each(['2.11.5', '2.11.4-beta.1', ''])('rejects an unaudited CLI version %s before accepting a payload', version => {
    expect(() => validateReceiptToolchain(version)).toThrow('audited Tauri CLI');
    expect(() => deriveUnsignedNsisIdentity(raw(), version)).toThrow('audited Tauri CLI');
  });

  it('requires raw binary bytes rather than text or an arbitrary object', () => {
    expect(() => deriveUnsignedNsisIdentity('text', VERIFIED_NSIS_CLI_VERSION)).toThrow('Buffer');
  });

  it('records raw and installer artifacts separately from the expected payload and never overwrites them', () => {
    const laboratory = mkdtempSync(join(tmpdir(), 'retranca-nsis-receipt-'));
    try {
      const rawPath = join(laboratory, 'retranca-pilot.exe');
      const installerPath = join(laboratory, 'Pilot_0.1.0_x64-setup.exe');
      const receiptDir = join(laboratory, 'receipt');
      mkdirSync(receiptDir);
      writeFileSync(rawPath, raw());
      const installer = Buffer.from('synthetic inert installer');
      writeFileSync(installerPath, installer);
      const receipt = copyPilotArtifacts(rawPath, installerPath, receiptDir, VERIFIED_NSIS_CLI_VERSION);
      expect(receipt.artifacts.map((item: { role: string }) => item.role)).toEqual(['raw-executable', 'nsis-installer']);
      expect(receipt.artifacts[0].sha256).toBe(sha256(raw()));
      expect(receipt.artifacts[1].sha256).toBe(sha256(installer));
      expect(receipt.expected_installed_executable.file_name).toBe('retranca-pilot.exe');
      expect(receipt.expected_installed_executable.sha256).toBe(sha256(expected()));
      expect(readFileSync(rawPath)).toEqual(raw());
      expect(readFileSync(receipt.artifacts[0].path)).toEqual(raw());
      expect(() => copyPilotArtifacts(rawPath, installerPath, receiptDir, VERIFIED_NSIS_CLI_VERSION)).toThrow();
      expect(readFileSync(receipt.artifacts[0].path)).toEqual(raw());
      expect(readFileSync(receipt.artifacts[1].path)).toEqual(installer);
    } finally {
      if (dirname(resolve(laboratory)) !== resolve(tmpdir()) || !basename(laboratory).startsWith('retranca-nsis-receipt-')) {
        throw new Error('Refusing cleanup outside the created receipt laboratory.');
      }
      rmSync(laboratory, { recursive: true, force: true });
    }
  });
});
