import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AiRuntimeProvider } from '@/lib/contexts/AiRuntimeContext';
import { LocalAiSettings } from '@/components/LocalAiSettings';
import { Header } from '@/components/Header';

describe('Open edition entry points', () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each(['development', 'production'])('exposes local model settings in %s without native entitlement IPC', environment => {
    vi.stubEnv('NODE_ENV', environment);
    const html = renderToStaticMarkup(React.createElement(AiRuntimeProvider, null,
      React.createElement(LocalAiSettings)));
    expect(html).toContain('IA local');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('Premium');
    expect(html).not.toContain('[DEV]');
  });

  it('exposes the AI assistant entry without an entitlement provider', () => {
    const html = renderToStaticMarkup(React.createElement(Header, {
      articles: [], searchTerm: '', setSearchTerm: vi.fn(), darkMode: false, setDarkMode: vi.fn(),
      isFocusMode: false, setIsFocusMode: vi.fn(), onOpenNewModal: vi.fn(), onOpenAiModal: vi.fn(),
      onArticlesUpdated: vi.fn(),
    }));
    const match = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].find(entry => entry[2].includes('IA Assistant'));
    expect(match).toBeDefined();
    expect(match![1]).not.toContain('aria-disabled="true"');
    expect(match![1]).not.toContain('tabindex="-1"');
    expect(html).not.toContain('Premium');
  });
});
