'use client';

import React, { useState, useEffect } from 'react';
import { Download, AlertTriangle, CheckCircle2, Loader2, XCircle, HardDrive } from 'lucide-react';
import type { ModelStatus, DownloadProgressEvent } from '@/types/ai';

interface ModelDownloadModalProps {
  isOpen: boolean;
  modelStatus: ModelStatus;
  onStartDownload: () => void;
  onDismiss: () => void;
}

export const ModelDownloadModal: React.FC<ModelDownloadModalProps> = ({
  isOpen,
  modelStatus,
  onStartDownload,
  onDismiss,
}) => {
  const [progress, setProgress] = useState(0);
  const [bytesDownloaded, setBytesDownloaded] = useState(0);
  const [bytesTotal, setBytesTotal] = useState(0);

  // Listen for download-progress events from Tauri
  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const setupListener = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event');
        unlisten = await listen('download-progress', (event) => {
          const payload = event.payload as DownloadProgressEvent;
          setProgress(payload.progress);
          setBytesDownloaded(payload.bytes_downloaded);
          setBytesTotal(payload.bytes_total);
        }) as unknown as () => void;
      } catch {
        // Not in Tauri environment
      }
    };

    if (modelStatus === 'DOWNLOADING') {
      setupListener();
    }

    return () => {
      if (unlisten) unlisten();
    };
  }, [modelStatus]);

  if (!isOpen) return null;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="model-download-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <span className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <HardDrive className="w-5 h-5" />
            </span>
            <div>
              <h2 id="model-download-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                Modelo de IA do Retranca
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Provisionamento do modelo para inferência offline
              </p>
            </div>
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
                  <p className="font-bold mb-1">Download necessário</p>
                  <p>O modelo de IA do Retranca ainda não foi provisionado neste dispositivo. O download é necessário para executá-lo offline.</p>
                </div>
              </div>
              <button
                onClick={onStartDownload}
                className="w-full px-4 py-2.5 text-sm font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>Iniciar Download do Modelo</span>
              </button>
              <button
                onClick={onDismiss}
                className="w-full px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Fechar (continuar sem Sidecar)
              </button>
            </div>
          )}

          {/* DOWNLOADING state */}
          {modelStatus === 'DOWNLOADING' && (
            <div className="space-y-4" aria-live="polite" aria-atomic="true">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Baixando modelo...
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div
                  className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Download do modelo: ${progress}% concluído`}
                >
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>{formatBytes(bytesDownloaded)} / {formatBytes(bytesTotal)}</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Não feche a aplicação durante o download. O modelo será verificado automaticamente após a conclusão.
              </p>
            </div>
          )}

          {/* VERIFYING state */}
          {modelStatus === 'VERIFYING' && (
            <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800" aria-live="polite">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
              <div className="text-xs text-blue-800 dark:text-blue-200">
                <p className="font-bold">Verificando integridade...</p>
                <p>Validando assinatura Ed25519 e hash SHA-256 do modelo.</p>
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
                  <p>Este dispositivo não atende aos requisitos mínimos para execução do modelo de IA distribuído pelo Retranca (mínimo 8 GB RAM, arquitetura x86_64 com AVX2 ou aarch64).</p>
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
                  <p>Ocorreu um erro durante o download ou a verificação do modelo. Tente novamente.</p>
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
    </div>
  );
};
