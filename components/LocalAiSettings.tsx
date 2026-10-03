'use client';

import React, { useState, useEffect, useId, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { useAiRuntime } from '@/lib/contexts/AiRuntimeContext';
import { fetchLocalAiModels, LocalModelInventoryUnavailableError } from '@/lib/api/localAiModels';

export const LocalAiSettings: React.FC = () => {
  const { selectedModel, setSelectedModel } = useAiRuntime();
  const [isOpen, setIsOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const modelRef = useRef<HTMLSelectElement>(null);
  const openRef = useRef(false);
  const loadingRef = useRef(false);
  const requestRef = useRef(0);
  const closeSettings = useCallback(() => {
    openRef.current = false;
    loadingRef.current = false;
    requestRef.current += 1;
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);
  const queryModels = useCallback(async () => {
    if (!openRef.current || loadingRef.current) return;
    loadingRef.current = true;
    const request = ++requestRef.current;
    try {
      const models = await fetchLocalAiModels();
      if (!openRef.current || request !== requestRef.current) return;
      setAvailableModels(models);
      setMessage(models.length ? `${models.length} modelo(s) disponível(is).` : 'Nenhum modelo Ollama disponível. Instale um modelo no Ollama e atualize esta lista.');
    } catch (error) {
      if (!openRef.current || request !== requestRef.current) return;
      setAvailableModels([]);
      setMessage(error instanceof LocalModelInventoryUnavailableError
        ? error.message
        : 'Não foi possível consultar o Ollama. Verifique se ele está em execução e use Atualizar modelos para tentar novamente.');
    } finally {
      if (openRef.current && request === requestRef.current) {
        loadingRef.current = false;
        setIsLoading(false);
      }
    }
  }, []);
  const refreshModels = useCallback(() => {
    if (!openRef.current || loadingRef.current) return;
    setIsLoading(true);
    setMessage('Consultando modelos locais...');
    void queryModels();
  }, [queryModels]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing) return;
      // A foreground dialog owns Escape and its focus return.
      if (document.querySelector('dialog[open]')) return;
      event.preventDefault();
      closeSettings();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeSettings]);

  useEffect(() => {
    if (!isOpen) return;
    modelRef.current?.focus();
  }, [isOpen]);

  useEffect(() => () => {
    openRef.current = false;
    loadingRef.current = false;
    requestRef.current += 1;
  }, []);

  return (
    <div className="fixed bottom-10 right-4 z-[9999]">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (isOpen) closeSettings();
          else {
            openRef.current = true;
            setIsOpen(true);
            refreshModels();
          }
        }}
        aria-label="Configuração de IA local"
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="bg-neutral-800 text-neutral-300 hover:bg-neutral-700 min-h-8 p-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-lg border border-neutral-700 text-xs font-bold"
      >
        IA local
      </button>

      {isOpen && (
        <div id={panelId} className="absolute bottom-12 right-0 w-64 max-w-[calc(100vw-2rem)] bg-neutral-900 border border-neutral-700 p-4 rounded shadow-2xl flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2 border-b border-neutral-800 pb-2">
            <h3 className="text-sm font-bold text-neutral-200">Configuração de IA local</h3>
            <button
              type="button"
              onClick={closeSettings}
              aria-label="Fechar configuração de IA local"
              title="Fechar configuração de IA local"
              className="min-h-8 min-w-8 shrink-0 flex items-center justify-center rounded text-neutral-300 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor={`${panelId}-model`} className="text-xs text-neutral-300">Modelo Ollama</label>
              <select
                ref={modelRef}
                id={`${panelId}-model`}
                value={selectedModel && availableModels.includes(selectedModel) ? selectedModel : ''}
                onChange={(e) => {
                  const model = e.target.value;
                  if (!model || availableModels.includes(model)) setSelectedModel(model || null);
                }}
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
            <button
              type="button"
              onClick={refreshModels}
              aria-disabled={isLoading}
              className={`min-h-8 px-2 py-1 text-xs font-bold rounded bg-neutral-800 text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isLoading ? 'opacity-60' : 'hover:bg-neutral-700'}`}
            >
              Atualizar modelos
            </button>
            <p role="status" aria-atomic="true" className="text-xs text-neutral-300">{message}</p>
            {!isLoading && selectedModel && !availableModels.includes(selectedModel) && (
              <p className="text-xs text-amber-300">O modelo escolhido nesta sessão ({selectedModel}) não está na lista atual. Atualize os modelos ou selecione outro.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
