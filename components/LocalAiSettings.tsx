'use client';

import React, { useState, useEffect, useId, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { useAiRuntime } from '@/lib/contexts/AiRuntimeContext';
import { fetchLocalAiModels, LocalModelInventoryUnavailableError } from '@/lib/api/localAiModels';
import { fetchLocalAiReadiness, LocalAiReadinessUnavailableError } from '@/lib/api/localAiReadiness';
import type { LocalAiReadinessReport } from '@/types/localAiReadiness';

type ReadinessView =
  | { phase: 'IDLE' | 'CHECKING'; message: string }
  | { phase: 'ERROR'; message: string }
  | { phase: 'RESOLVED'; message: string; report: LocalAiReadinessReport };

export const LocalAiSettings: React.FC = () => {
  const { selectedModel, setSelectedModel } = useAiRuntime();
  const [isOpen, setIsOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [readiness, setReadiness] = useState<ReadinessView>({ phase: 'IDLE', message: 'Selecione um modelo para verificar a disponibilidade de IA local.' });
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const modelRef = useRef<HTMLSelectElement>(null);
  const openRef = useRef(false);
  const loadingRef = useRef(false);
  const requestRef = useRef(0);
  const selectedModelRef = useRef(selectedModel);
  const readinessRequestRef = useRef(0);
  const readinessLoadingRef = useRef(false);
  const invalidateReadiness = useCallback(() => {
    readinessRequestRef.current += 1;
    readinessLoadingRef.current = false;
  }, []);
  const queryReadiness = useCallback(async (model: string | null) => {
    if (!openRef.current) return;
    const request = ++readinessRequestRef.current;
    readinessLoadingRef.current = Boolean(model);
    if (!model) {
      setReadiness({ phase: 'IDLE', message: 'Selecione um modelo para verificar a disponibilidade de IA local.' });
      return;
    }
    setReadiness({ phase: 'CHECKING', message: 'Verificando o modelo selecionado...' });
    try {
      const report = await fetchLocalAiReadiness(model);
      if (!openRef.current || request !== readinessRequestRef.current) return;
      setReadiness({ phase: 'RESOLVED', message: report.message, report });
    } catch (error) {
      if (!openRef.current || request !== readinessRequestRef.current) return;
      setReadiness({ phase: 'ERROR', message: error instanceof LocalAiReadinessUnavailableError
        ? error.message : 'Não foi possível verificar o modelo. Use Verificar modelo para tentar novamente.' });
    } finally {
      if (openRef.current && request === readinessRequestRef.current) readinessLoadingRef.current = false;
    }
  }, []);
  const closeSettings = useCallback(() => {
    openRef.current = false;
    loadingRef.current = false;
    requestRef.current += 1;
    invalidateReadiness();
    setIsOpen(false);
    triggerRef.current?.focus();
  }, [invalidateReadiness]);
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
        void queryReadiness(selectedModelRef.current);
      }
    }
  }, [queryReadiness]);
  const refreshModels = useCallback(() => {
    if (!openRef.current || loadingRef.current) return;
    invalidateReadiness();
    setReadiness({ phase: 'IDLE', message: 'Atualizando a lista antes de verificar o modelo...' });
    setIsLoading(true);
    setMessage('Consultando modelos locais...');
    void queryModels();
  }, [queryModels, invalidateReadiness]);

  useEffect(() => {
    selectedModelRef.current = selectedModel;
  }, [selectedModel]);

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
    invalidateReadiness();
  }, [invalidateReadiness]);

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
        <section id={panelId} aria-labelledby={`${panelId}-heading`} className="absolute bottom-12 right-0 w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-7rem)] overflow-y-auto bg-neutral-900 border border-neutral-700 p-4 rounded shadow-2xl flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2 border-b border-neutral-800 pb-2">
            <h3 id={`${panelId}-heading`} className="text-sm font-bold text-neutral-200">Configuração de IA local</h3>
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
                aria-describedby={`${panelId}-readiness`}
                onChange={(e) => {
                  const model = e.target.value;
                  if (!model || availableModels.includes(model)) {
                    invalidateReadiness();
                    setReadiness({ phase: 'IDLE', message: 'A escolha mudou. Aguardando verificação...' });
                    selectedModelRef.current = model || null;
                    setSelectedModel(model || null);
                    if (!loadingRef.current) void queryReadiness(model || null);
                  }
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
              Nesta versão, a IA usa o Ollama instalado neste computador e um modelo escolhido por você. Selecione um modelo disponível na lista. O motor embutido está previsto para uma etapa futura.
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
              <p className="text-xs text-amber-300 break-words">O modelo escolhido nesta sessão ({selectedModel}) não está na lista atual. Atualize os modelos ou selecione outro.</p>
            )}
          </div>
          <div className="flex flex-col gap-2 border-t border-neutral-700 pt-3">
            <h4 className="text-xs font-bold text-neutral-200">Disponibilidade de IA local</h4>
            <p id={`${panelId}-readiness`} role="status" aria-atomic="true" className="text-xs text-neutral-200 break-words">
              {readiness.message}
            </p>
            {readiness.phase === 'RESOLVED' && readiness.report.runtime_version && (
              <p className="text-xs text-neutral-300 break-words">Servidor Ollama: {readiness.report.runtime_version}</p>
            )}
            <button
              type="button"
              onClick={() => {
                if (!selectedModel || loadingRef.current || readinessLoadingRef.current) return;
                void queryReadiness(selectedModel);
              }}
              aria-disabled={!selectedModel || isLoading || readiness.phase === 'CHECKING'}
              className={`min-h-8 px-2 py-1 text-xs font-bold rounded bg-neutral-800 text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${!selectedModel || isLoading || readiness.phase === 'CHECKING' ? 'opacity-60' : 'hover:bg-neutral-700'}`}
            >
              Verificar modelo
            </button>
            <p className="text-xs text-neutral-300">A verificação é repetida a cada geração. Ela não avalia a qualidade do texto. Você pode continuar editando pautas sem IA.</p>
          </div>
        </section>
      )}
    </div>
  );
};
