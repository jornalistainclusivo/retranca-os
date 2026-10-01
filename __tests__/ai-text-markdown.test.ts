import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AiTextMarkdown } from '@/components/AiTextMarkdown';

const render = (text: string) => renderToStaticMarkup(React.createElement(AiTextMarkdown, null, text));

describe('Generated AI text rendering', () => {
  it.each([
    '![Editorial description](https://example.invalid/pixel.png?marker=public-test)',
    '![Editorial description](/pixel.png)',
    '![Editorial description][image]\n\n[image]: https://example.invalid/pixel.png',
  ])('preserves image descriptions without image elements or preload requests: %s', input => {
    const html = render(input);
    expect(html).toContain('Editorial description');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<link');
    expect(html).not.toContain('src=');
    expect(html).not.toContain('example.invalid');
  });

  it('keeps text formatting and explicit links, without activating raw HTML or unsafe URLs', () => {
    const html = render('**Review** [source](https://example.invalid/source) [unsafe](javascript:alert%281%29)\n\n<img src="https://example.invalid/raw.png">');
    expect(html).toContain('<strong>Review</strong>');
    expect(html).toContain('href="https://example.invalid/source"');
    expect(html).not.toContain('href="javascript:');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<link');
    expect(html).toContain('&lt;img');
  });
});
