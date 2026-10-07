import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const load = createRequire(import.meta.url);
const typographyLoad = createRequire(load.resolve('@tailwindcss/typography'));
const typographyUtils = typographyLoad('./utils.js') as {
  commonTrailingPseudos(selector: string): [string | null, string];
};
const parserPath = typographyLoad.resolve('postcss-selector-parser');

describe('Typography parser security and compatibility', () => {
  it.each([
    ['h1, h2', null, 'h1, h2'],
    ['p::selection', '::selection', 'p'],
    ['ul > li::marker, ol > li::marker', '::marker', 'ul > li, ol > li'],
    ['a::before, b::after', null, 'a::before, b::after'],
    ['a[href="x,y"]::after, b::after', '::after', 'a[href="x,y"], b'],
    [':is(.a, .b)::before, :where(.c)::before', '::before', ':is(.a, .b), :where(.c)'],
  ])('preserves trailing pseudo-element behavior for %s', (selector, pseudo, rebuilt) => {
    expect(typographyUtils.commonTrailingPseudos(selector!)).toEqual([pseudo, rebuilt]);
  });

  it.each(['class', 'id'] as const)(
    'handles a large flat %s selector in a bounded isolated process',
    (kind) => {
      const source = `
        const assert = require('node:assert/strict');
        const parser = require(process.argv[1]);
        const selector = (process.argv[2] === 'id' ? '#a' : '.a').repeat(200000);
        const ast = parser().astSync(selector);
        assert.equal(ast.nodes.length, 1);
        assert.equal(ast.nodes[0].nodes.length, 200000);
        assert.equal(ast.toString(), selector);
      `;
      const child = spawnSync(
        process.execPath,
        ['--max-old-space-size=512', '-e', source, parserPath, kind],
        { encoding: 'utf8', timeout: 15000, maxBuffer: 1024 * 1024 },
      );
      expect(child.error, child.stderr).toBeUndefined();
      expect(child.status, child.stderr).toBe(0);
    },
    20000,
  );
});
