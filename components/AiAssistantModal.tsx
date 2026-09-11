'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, X, Send, Copy, Check, Lightbulb, Search, Eye, FileText, Paperclip, FileImage, StopCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AiAction, GenerationState } from '@/types/ai';
import { useEntitlement } from '@/lib/contexts/EntitlementContext';
import {
  onStreamToken,
  onStreamDone,
  onStreamCanceled,
  onStreamError,
} from '@/lib/adapters/localAiAdapter';
import { SidecarProvider, OllamaProvider } from '@/lib/adapters/aiProviderRouter';
import type { ProviderType } from '@/types/ai';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyIdea?: (title: string, summary: string) => void;
  provider?: ProviderType;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  onApplyIdea,
  provider = 'NONE',
}) => {
  const [prompt, setPrompt] = useState('');
  const [action, setAction] = useState<AiAction>('generate_outline');
  const [genState, setGenState] = useState<GenerationState>('IDLE');
  const [fileName, setFileName] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isPremium: isPremiumMode, selectedModel } = useEntitlement();

  // Streaming result stored in a ref to avoid re-renders per token,
  // and flushed to state on a 60fps animation frame for the typewriter effect.
  const streamBufferRef = useRef('');
  const [displayResult, setDisplayResult] = useState<string | null>(null);
  const jobIdRef = useRef<string | null>(null);
  const unlistenRefs = useRef<Array<() => void>>([]);
  const rafRef = useRef<number | null>(null);

  // Flush buffer to display on animation frame
  const flushBuffer = useCallback(() => {
    if (streamBufferRef.current) {
      setDisplayResult(streamBufferRef.current);
    }
    rafRef.current = requestAnimationFrame(flushBuffer);
  }, []);

  // Cleanup listeners and animation frame on unmount or modal close
  useEffect(() => {
    return () => {
      unlistenRefs.current.forEach((fn) => fn());
      unlistenRefs.current = [];
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setImageBase64(base64String);
        setImageMimeType(file.type);
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.csv') || file.type === 'application/json') {
      const text = await file.text();
      setPrompt((prev) => prev + (prev ? '\n\n' : '') + text);
      setImageBase64(null);
      setImageMimeType(null);
    } else {
      alert('Formato de arquivo não suportado. Por favor, envie imagens, TXT, MD, CSV ou JSON.');
      setFileName(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const jobId = `job_${Date.now()}`;
    jobIdRef.current = jobId;
    streamBufferRef.current = '';
    setDisplayResult(null);
    setGenState('QUEUED');

    // Cleanup previous listeners
    unlistenRefs.current.forEach((fn) => fn());
    unlistenRefs.current = [];

    try {
      // Register event listeners BEFORE starting inference
      const unToken = await onStreamToken((ev) => {
        if (ev.job_id !== jobIdRef.current) return;
        streamBufferRef.current += ev.token;
        setGenState('GENERATING');
      });
      const unDone = await onStreamDone((ev) => {
        if (ev.job_id !== jobIdRef.current) return;
        setGenState('COMPLETED');
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setDisplayResult(streamBufferRef.current);
      });
      const unCanceled = await onStreamCanceled((ev) => {
        if (ev.job_id !== jobIdRef.current) return;
        setGenState('CANCELLED');
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      });
      const unError = await onStreamError((ev) => {
        if (ev.job_id !== jobIdRef.current) return;
        streamBufferRef.current += `\n\nErro: ${ev.message}`;
        setDisplayResult(streamBufferRef.current);
        setGenState('ERROR');
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      });

      unlistenRefs.current = [unToken, unDone, unCanceled, unError];

      // Start the animation-frame flush loop
      rafRef.current = requestAnimationFrame(flushBuffer);

      // Start the actual inference via Tauri IPC
      setGenState('LOADING_MODEL');
      const providerImpl = provider === 'OLLAMA' ? OllamaProvider : SidecarProvider;
      await providerImpl.startInference(jobId, action, prompt, selectedModel || undefined);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err);
      setDisplayResult(`Erro ao iniciar inferência local: ${message}`);
      setGenState('ERROR');
    }
  };

  const handleCancel = async () => {
    if (!jobIdRef.current) return;
    setGenState('CANCELLING');
    try {
      const providerImpl = provider === 'OLLAMA' ? OllamaProvider : SidecarProvider;
      await providerImpl.cancelInference(jobIdRef.current);
    } catch {
      setGenState('ERROR');
    }
  };

  const handleCopy = () => {
    if (displayResult) {
      navigator.clipboard.writeText(displayResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isLoading = genState === 'QUEUED' || genState === 'LOADING_MODEL' || genState === 'GENERATING';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[85vh]">

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Assistente IA de Redação (Local)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Gere Alt Text WCAG 2.2, esboços em Linguagem Simples e otimizações SEO
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">

          {/* Action Types */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => setAction('generate_outline')}
              className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all ${
                action === 'generate_outline'
                  ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-400 text-blue-800 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Lightbulb className="w-4 h-4 text-blue-600" />
              <span>Esboço de Pauta</span>
            </button>

            <button
              type="button"
              onClick={() => setAction('generate_alt_text')}
              className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all ${
                action === 'generate_alt_text'
                  ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-400 text-blue-800 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Alt Text WCAG</span>
            </button>

            <button
              type="button"
              onClick={() => setAction('generate_seo')}
              className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all ${
                action === 'generate_seo'
                  ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-400 text-blue-800 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Search className="w-4 h-4 text-emerald-600" />
              <span>Otimização SEO</span>
            </button>

            <button
              type="button"
              onClick={() => setAction('check_accessibility')}
              className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all ${
                action === 'check_accessibility'
                  ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-400 text-blue-800 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Linguagem Simples</span>
            </button>

            <button
              type="button"
              onClick={() => setAction('validate_inclusivity')}
              className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all text-center leading-tight ${
                action === 'validate_inclusivity'
                  ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-400 text-blue-800 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Validador Inclusivo</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">
              {action === 'generate_alt_text'
                ? 'Descreva a Imagem ou Gráfico'
                : action === 'generate_seo'
                ? 'Informe o Tema ou Título da Pauta'
                : (action === 'check_accessibility' || action === 'validate_inclusivity')
                ? 'Cole o Rascunho do Texto para Análise'
                : 'Tema ou Ideia Central da Matéria'}
            </label>

            <div className="flex flex-col gap-2 relative">
              <textarea
                required={!imageBase64}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  action === 'generate_alt_text'
                    ? 'Ex: Gráfico de barras mostrando aumento no uso de leitores de tela em 2026 (Ou anexe uma imagem)'
                    : 'Ex: Tecnologias Assistivas no Jornalismo Regional'
                }
                className="w-full min-h-[100px] px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium resize-y"
                disabled={isLoading}
              />
              {fileName && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-xs font-medium border border-blue-200 dark:border-blue-800">
                  {imageBase64 ? <FileImage className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                  <span className="truncate max-w-[200px]">{fileName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFileName(null);
                      setImageBase64(null);
                      setImageMimeType(null);
                    }}
                    className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between mt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,.txt,.md,.csv,.json"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="Anexar arquivo"
                  title="Anexar arquivo (Imagem, TXT, MD, CSV, JSON)"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  {isLoading && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-3 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      aria-label="Cancelar geração"
                    >
                      <StopCircle className="w-3.5 h-3.5" />
                      <span>Cancelar</span>
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading || !isPremiumMode}
                    className={`px-4 py-2 text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isPremiumMode
                        ? "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                        : "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    }`}
                    aria-disabled={!isPremiumMode || isLoading}
                    tabIndex={isPremiumMode ? 0 : -1}
                    title={isPremiumMode ? "Gerar com IA Local" : "Gerar com IA (Recurso Premium)"}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isLoading ? 'Processando...' : 'Gerar com IA'}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Streaming Result Output (Typewriter) */}
          {displayResult && (
            <div
              className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 relative"
              aria-live="polite"
              aria-atomic="false"
              role="log"
              aria-label="Resultado da IA Local"
            >
              <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
                <span>
                  Resultado da IA Local
                  {genState === 'GENERATING' && <span className="ml-1 animate-pulse">●</span>}
                  {genState === 'CANCELLED' && <span className="ml-1 text-amber-500">(Cancelado)</span>}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-[10px]"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans prose prose-sm dark:prose-invert prose-blue max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-a:text-blue-600 hover:prose-a:text-blue-500">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {displayResult}
                </ReactMarkdown>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
