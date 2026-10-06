'use client';

import React, { useState, useEffect } from 'react';
import { Download, AlertTriangle, Loader2, XCircle, HardDrive, X } from 'lucide-react';
import type { ModelStatus, DownloadProgressEvent } from '@/types/ai';
import { useModalDialog } from '@/lib/hooks/useModalDialog';
import { subscribeModelDownloadProgress } from '@/lib/api/modelProvisioning';

interface ModelDownloadModalProps {
  isOpen: boolean;
  developmentFixturesEnabled?: boolean;
  modelStatus: ModelStatus;
  onStartDownload: () => void;
  onDismiss: () => void;
  errorMessage?: string | null;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${parseFloat((bytes / 1024 ** index).toFixed(1))} ${units[index]}`;
}

function ModelDownloadProgress() {
  const [download, setDownload] = useState<DownloadProgressEvent>({ progress: 0, bytes_downloaded: 0, bytes_total: 0 });
  useEffect(() => subscribeModelDownloadProgress(setDownload), []);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3" role="status">
        <Loader2 className="w-5 h-5 text-blue-600 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Baixando modelo...</span>
      </div>
      <div className="space-y-2">
        <div
          className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={download.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Download do modelo"
        >
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${download.progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span>{formatBytes(download.bytes_downloaded)} / {formatBytes(download.bytes_total)}</span>
          <span className="font-bold text-blue-600 dark:text-blue-400">{download.progress}%</span>
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Você pode fechar este aviso; o download continuará. Mantenha o aplicativo aberto até a conclusão e a verificação do modelo.
      </p>
    </div>
  );
}

export const ModelDownloadModal: React.FC<ModelDownloadModalProps> = ({
  isOpen,
  developmentFixturesEnabled = false,
  modelStatus,
  onStartDownload,
  onDismiss,
  errorMessage,
}) => {
  const visible = developmentFixturesEnabled === true && isOpen && modelStatus !== 'READY';
  const dialogRef = useModalDialog(visible, onDismiss);

  useEffect(() => {
    const dialog = dialogRef.current;
    // A state change can remove the focused download/retry button.
    if (visible && dialog?.open && !dialog.contains(document.activeElement)) {
      dialog.querySelector<HTMLElement>('[data-dialog-initial-focus]')?.focus();
    }
  }, [visible, modelStatus, dialogRef]);

  if (!visible) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 m-0 border-0 w-full max-w-none h-full max-h-none overflow-y-auto bg-transparent backdrop:bg-slate-900/70 backdrop:backdrop-blur-sm hidden open:flex items-center justify-center p-4"
      aria-labelledby="model-download-title"
      onKeyDown={event => {
        if (event.key !== 'Tab') return;
        const controls = event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not([disabled])');
        const first = controls[0];
        const last = controls[controls.length - 1];
        const atHeading = document.activeElement?.hasAttribute('data-dialog-initial-focus');
        // Keep boundary Tab presses in the notice rather than browser chrome.
        if (event.shiftKey && (document.activeElement === first || atHeading)) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md shadow-2xl my-auto max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <HardDrive className="w-5 h-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="model-download-title" tabIndex={-1} data-dialog-initial-focus className="text-base font-bold text-slate-900 dark:text-slate-100 focus-visible:outline-2 focus-visible:outline-blue-500">
                Modelo de teste do Retranca
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Simulação explícita de desenvolvimento
              </p>
            </div>
            <button type="button" onClick={onDismiss} aria-label="Fechar aviso de modelo" className="shrink-0 min-w-11 min-h-11 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-blue-500">
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">

          {/* MISSING state */}
          {modelStatus === 'MISSING' && (
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <Download className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-800 dark:text-amber-200">
                  <p className="font-bold mb-1">Arquivo de teste não instalado</p>
                  <p>Este modo usa arquivos e respostas sintéticos para testar o aplicativo. Não é um motor de IA. Para gerar textos reais, use seu modelo no Ollama em IA local.</p>
                </div>
              </div>
              <button
                onClick={onStartDownload}
                className="w-full px-4 py-2.5 text-sm font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>Baixar arquivo de teste</span>
              </button>
              <button
                onClick={onDismiss}
                className="w-full px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Fechar aviso
              </button>
            </div>
          )}

          {/* DOWNLOADING state */}
          {modelStatus === 'DOWNLOADING' && <ModelDownloadProgress />}

          {/* VERIFYING state */}
          {modelStatus === 'VERIFYING' && (
            <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800" aria-live="polite">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin motion-reduce:animate-none shrink-0" aria-hidden="true" />
              <div className="text-xs text-blue-800 dark:text-blue-200">
                <p className="font-bold">Verificando integridade...</p>
                <p>Validando assinatura Ed25519 e hash SHA-256 do modelo.</p>
                <p className="mt-1">Você pode fechar este aviso. Mantenha o aplicativo aberto até a verificação terminar.</p>
              </div>
            </div>
          )}

          {/* INCOMPATIBLE state */}
          {modelStatus === 'INCOMPATIBLE' && (
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800" role="alert">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                <div className="text-xs text-red-800 dark:text-red-200">
                  <p className="font-bold mb-1">Hardware incompatível</p>
                  <p>Este dispositivo não atende aos critérios do provisionamento de teste (mínimo 8 GB RAM, arquitetura x86_64 com AVX2 ou aarch64). Isso não avalia a capacidade do seu modelo no Ollama.</p>
                  <p className="mt-1">Outros provedores de IA local (como Ollama) ainda podem ser utilizados, caso estejam disponíveis.</p>
                </div>
              </div>
              <button
                onClick={onDismiss}
                className="w-full px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Entendido
              </button>
            </div>
          )}

          {/* FAILED state */}
          {modelStatus === 'FAILED' && (
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800" role="alert">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                <div className="text-xs text-red-800 dark:text-red-200">
                  <p className="font-bold mb-1">Falha no provisionamento</p>
                  <p>{errorMessage || 'Ocorreu um erro durante o download ou a verificação do modelo. Tente novamente.'}</p>
                </div>
              </div>
              <button
                onClick={onStartDownload}
                className="w-full px-4 py-2.5 text-sm font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Download className="w-4 h-4" />
                <span>Tentar Novamente</span>
              </button>
              <button
                onClick={onDismiss}
                className="w-full px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Fechar
              </button>
            </div>
          )}

        </div>
      </div>
    </dialog>
  );
};
