/** Model provisioning rendering checks; keyboard behavior requires a browser. */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ModelDownloadModal } from '@/components/ModelDownloadModal';
import type { ModelStatus } from '@/types/ai';

const render = (modelStatus: ModelStatus, isOpen = true, errorMessage?: string) => renderToStaticMarkup(
  React.createElement(ModelDownloadModal, { developmentFixturesEnabled: true, modelStatus, isOpen, errorMessage, onStartDownload: () => {}, onDismiss: () => {} }),
);

describe('Model provisioning dialog rendering', () => {
  it.each<ModelStatus>(['MISSING', 'DOWNLOADING', 'VERIFYING', 'INCOMPATIBLE', 'FAILED'])('hides %s unless development fixtures are explicitly enabled', modelStatus => {
    for (const developmentFixturesEnabled of [undefined, false]) {
      const html = renderToStaticMarkup(React.createElement(ModelDownloadModal, {
        developmentFixturesEnabled, modelStatus, isOpen: true, onStartDownload: () => {}, onDismiss: () => {},
      }));
      expect(html).toBe('');
    }
  });
  it('identifies the opt-in model and output as synthetic testing', () => {
    const html = render('MISSING');
    expect(html).toContain('Modelo de teste do Retranca');
    expect(html).toContain('arquivos e respostas sintéticos');
    expect(html).toContain('Baixar arquivo de teste');
    expect(html).not.toContain('Modelo embutido do Retranca');
  });
  it.each<ModelStatus>(['MISSING', 'DOWNLOADING', 'VERIFYING', 'INCOMPATIBLE', 'FAILED'])('%s has a native named dialog and a visible close control', status => {
    const html = render(status);
    expect(html).toContain('<dialog');
    expect(html).toContain('aria-labelledby="model-download-title"');
    expect(html).toContain('id="model-download-title"');
    expect(html).toContain('data-dialog-initial-focus');
    expect(html).toContain('aria-label="Fechar aviso de modelo"');
  });

  it('renders nothing when closed or ready', () => {
    expect(render('MISSING', false)).toBe('');
    expect(render('READY')).toBe('');
  });

  it('renders labelled bounded progress with text explaining that dismissing does not cancel', () => {
    const html = render('DOWNLOADING');
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="0"');
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="100"');
    expect(html).toContain('Você pode fechar este aviso; o download continuará');
    expect(html).toContain('role="status"');
  });

  it.each<ModelStatus>(['DOWNLOADING', 'VERIFYING'])('%s respects reduced motion', status => {
    expect(render(status)).toContain('motion-reduce:animate-none');
  });

  it('shows a specific recoverable error as text with retry and close controls', () => {
    const html = render('FAILED', true, 'Synthetic desktop-only error <script>');
    expect(html).toContain('role="alert"');
    expect(html).toContain('Synthetic desktop-only error &lt;script&gt;');
    expect(html).toContain('Tentar Novamente');
    expect(html).toContain('Fechar');
  });
});
