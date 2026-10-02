'use client';

import React, { useState, useEffect, useId, useRef } from 'react';
import { useAiRuntime } from '@/lib/contexts/AiRuntimeContext';

export const LocalAiSettings: React.FC = () => {
  const { selectedModel, setSelectedModel } = useAiRuntime();
  const [isOpen, setIsOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const modelRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (isOpen) {
      let active = true;
      modelRef.current?.focus();
      // Fetch models via Tauri IPC when opened
      import('@tauri-apps/api/core').then(({ invoke }) => {
        invoke<string[]>('get_ollama_models')
          .then((models) => {
            if (!active) return;
            setAvailableModels(models);
            setMessage(models.length ? '' : 'Nenhum modelo Ollama disponível. Instale um modelo no Ollama e reabra esta configuração.');
          })
          .catch(() => {
            if (active) setMessage('Não foi possível consultar o Ollama. Verifique se o aplicativo desktop e o Ollama estão em execução.');
          });
      }).catch(() => {
        if (active) setMessage('Configuração de IA local indisponível neste ambiente.');
      });
      return () => { active = false; };
    }
  }, [isOpen]);


  return (
    <div className="fixed bottom-10 right-4 z-[9999]">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { setMessage('Consultando modelos locais...'); setIsOpen(!isOpen); }}
        aria-label="Configuração de IA local"
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="bg-neutral-800 text-neutral-300 hover:bg-neutral-700 min-h-8 p-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-lg border border-neutral-700 text-xs font-bold"
      >
        IA local
      </button>

      {isOpen && (
        <div id={panelId} onKeyDown={event => { if (event.key === 'Escape') { setIsOpen(false); triggerRef.current?.focus(); } }} className="absolute bottom-12 right-0 w-64 max-w-[calc(100vw-2rem)] bg-neutral-900 border border-neutral-700 p-4 rounded shadow-2xl flex flex-col gap-4">
          <h3 className="text-sm font-bold text-neutral-200 border-b border-neutral-800 pb-2">Configuração de IA local</h3>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor={`${panelId}-model`} className="text-xs text-neutral-300">Modelo Ollama</label>
              <select
                ref={modelRef}
                id={`${panelId}-model`}
                value={selectedModel || ''}
                onChange={(e) => setSelectedModel(e.target.value || null)}
                className="bg-neutral-800 text-neutral-300 text-xs rounded border border-neutral-700 min-h-8 p-1 max-w-[120px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <option value="">Selecione um modelo</option>
                {availableModels.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-neutral-300 leading-tight">
              Selecione um modelo disponível no Ollama instalado neste computador.
            </p>
            <p role="status" aria-atomic="true" className="text-xs text-neutral-300">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};
