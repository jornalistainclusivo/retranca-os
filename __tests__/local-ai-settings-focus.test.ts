import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import RootLayout from '@/app/layout';

const renderLayout = () => renderToStaticMarkup(RootLayout({
  children: React.createElement('main', null,
    Array.from({ length: 30 }, (_, index) => React.createElement('button', {
      type: 'button', key: index,
    }, `Synthetic editorial control ${index}`)),
  ),
}));

describe('Local AI settings keyboard entry', () => {
  it('places the single global settings trigger before editorial controls in actual layout output', () => {
    const buttons = [...renderLayout().matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)];
    expect(buttons).toHaveLength(31);
    expect(buttons[0][1]).toContain('aria-label="Configuração de IA local"');
    expect(buttons.filter(button => button[1].includes('aria-label="Configuração de IA local"'))).toHaveLength(1);
    expect(buttons[1][2]).toBe('Synthetic editorial control 0');
  });

  it('keeps the collapsed trigger named, enabled and in the natural tab order', () => {
    const [first] = [...renderLayout().matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)];
    expect(first[1]).toContain('type="button"');
    expect(first[1]).toContain('aria-expanded="false"');
    expect(first[1]).toContain('aria-controls=');
    expect(first[1]).not.toMatch(/\bdisabled(?:=|\s|$)/);
    expect(first[1]).not.toContain('tabindex=');
    expect(first[2]).toBe('IA local');
  });
});
