import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { validatePilotConfig, validateBuildEnvironment, parseMode, selectInstaller, PILOT_IDENTIFIER } from '../scripts/packaging/build-local-pilot.mjs';

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
