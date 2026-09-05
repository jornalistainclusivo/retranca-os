'use client';

import React, { useState } from 'react';
import { Sparkles, X, Send, Copy, Check, Lightbulb, Search, Eye, FileText, Paperclip, FileImage } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyIdea?: (title: string, summary: string) => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  onApplyIdea,
}) => {
  const [prompt, setPrompt] = useState('');
  const [action, setAction] = useState<'generate_outline' | 'generate_alt_text' | 'generate_seo' | 'check_accessibility' | 'validate_inclusivity'>('generate_outline');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isPremiumMode = false; // Mock for freemium constraints

  
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

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/gemini/editorial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          topic: prompt,
          text: prompt,
          imageDescription: prompt,
          imageBase64,
          imageMimeType,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setResult(data.result);
      } else {
        setResult('Erro ao obter resposta da IA.');
      }
    } catch (err) {
      setResult('Erro de conexão com o serviço Gemini.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
                Assistente IA de Redação (Retranca)
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
              <Eye className="w-4 h-4 text-indigo-600" />
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
              <FileText className="w-4 h-4 text-purple-600" />
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
                <button
                  type="submit"
                  disabled={loading || !isPremiumMode}
                  className={`px-4 py-2 text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isPremiumMode 
                      ? "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50" 
                      : "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  }`}
                  aria-disabled={!isPremiumMode}
                  tabIndex={isPremiumMode ? 0 : -1}
                  title={isPremiumMode ? "Gerar com IA" : "Gerar com IA (Recurso Premium)"}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? 'Processando...' : 'Gerar com IA'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Result Output */}
          {result && (
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 relative">
              <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
                <span>Resultado Sugerido pelo Gemini:</span>
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
                  {result}
                </ReactMarkdown>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
