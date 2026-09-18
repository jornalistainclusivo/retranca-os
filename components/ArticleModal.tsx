'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import type { AiAction } from '@/types/ai';

import { useEntitlement } from '@/lib/contexts/EntitlementContext';
import {
  onStreamToken,
  onStreamDone,
  onStreamError,
  onStreamNotice,
} from '@/lib/adapters/localAiAdapter';
import { SidecarProvider, OllamaProvider } from '@/lib/adapters/aiProviderRouter';
import type { ProviderType, AiOrchestrationRequest } from '@/types/ai';

import React, { useState, useEffect } from 'react';
import { Article, ArticleStatus, CategoryTag, ChecklistItem, WorkflowStage, CategoryEntity } from '@/types/editorial';
import { evaluateAiAction } from '@/lib/utils/aiActionEvaluator';
import { 
  X, 
  Save, 
  Trash2, 
  Sparkles, 
  Plus, 
  CheckSquare, 
  Clock, 
  Link, 
  Tag, 
  FileText, 
  User, 
  Target, 
  Layers, 
  History,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Maximize,
  Minimize,
  Copy,
  Check
} from 'lucide-react';

interface ArticleModalProps {
  article: Article | null;
  workflowStages: WorkflowStage[];
  categories: CategoryEntity[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (article: Article) => void;
  onDelete: (id: string) => void;
  isFocusMode: boolean;
  setIsFocusMode: (focus: boolean) => void;
  provider?: ProviderType;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  article,
  workflowStages,
  categories,
  isOpen,
  onClose,
  onSave,
  onDelete,
  isFocusMode,
  setIsFocusMode,
  provider = 'NONE',
}) => {
  const [prevArticleId, setPrevArticleId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Article>(() => article || {
    id: '',
    title: '',
    status: 'ideia',
    categoryTag: 'Acessibilidade',
    workflowStageId: workflowStages.length > 0 ? workflowStages[0].id : undefined,
    categoryId: categories.length > 0 ? categories[0].id : undefined,
    tags: [],
    publishDate: '',
    summary: '',
    objective: '',
    keyword: '',
    persona: '',
    cta: '',
    internalLinks: '',
    externalLinks: '',
    estimatedTime: '',
    spentTime: '',
    notes: '',
    checklists: [],
    history: [],
    createdAt: '',
    updatedAt: '',
  });

  const [newChecklistLabel, setNewChecklistLabel] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [contextNotices, setContextNotices] = useState<{ notice_code: string, message: string, omitted?: string[] }[]>([]);
  const [analysisContent, setAnalysisContent] = useState('');
  const [visualDescription, setVisualDescription] = useState('');
  const [copied, setCopied] = useState(false);
  const aiJobIdRef = React.useRef<string | null>(null);
  const aiJobActiveRef = React.useRef(false);
  const unlistenFnsRef = React.useRef<(() => void)[]>([]);
  
  const { isPremium: isPremiumMode, selectedModel } = useEntitlement();

  useEffect(() => {
    return () => {
      if (unlistenFnsRef.current.length > 0) {
        unlistenFnsRef.current.forEach(unlisten => unlisten());
        unlistenFnsRef.current = [];
      }
    };
  }, []);

  if (article && article.id !== prevArticleId) {
    setPrevArticleId(article.id);
    setFormData({ ...article });
    setAiResponse(null);
    setContextNotices([]);
    setCopied(false);
  }

  const handleCopy = () => {
    if (aiResponse) {
      navigator.clipboard.writeText(aiResponse);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen || !article) return null;

  // Compute checklist progress
  const completedChecklists = formData.checklists.filter((c) => c.completed).length;
  const progressPercent =
    formData.checklists.length > 0
      ? Math.round((completedChecklists / formData.checklists.length) * 100)
      : 0;

  const handleChange = (field: keyof Article, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleToggleChecklist = (id: string) => {
    setFormData((prev) => {
      const updatedChecklists = prev.checklists.map((c) =>
        c.id === id ? { ...c, completed: !c.completed } : c
      );
      return {
        ...prev,
        checklists: updatedChecklists,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistLabel.trim()) return;
    const newItem: ChecklistItem = {
      id: `custom_${Date.now()}`,
      label: newChecklistLabel.trim(),
      completed: false,
      category: 'editorial',
    };
    setFormData((prev) => ({
      ...prev,
      checklists: [...prev.checklists, newItem],
    }));
    setNewChecklistLabel('');
  };

  const handleDeleteChecklistItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      checklists: prev.checklists.filter((c) => c.id !== id),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add history log entry
    const newHistory = [
      {
        id: `h_${Date.now()}`,
        date: new Date().toISOString(),
        action: `Edição de detalhes CMS salvas (Etapa: ${workflowStages.find(s => s.id === formData.workflowStageId)?.displayName || formData.status})`,
      },
      ...formData.history,
    ];

    onSave({
      ...formData,
      history: newHistory,
    });
    onClose();
  };

  // Quick AI Assistant action call via local Tauri IPC
  const handleAiAction = async (actionType: AiAction) => {
    if (aiJobActiveRef.current) return;
    aiJobActiveRef.current = true;

    // Cleanup previous listeners to prevent duplicates and memory leaks
    if (unlistenFnsRef.current.length > 0) {
      unlistenFnsRef.current.forEach(unlisten => unlisten());
      unlistenFnsRef.current = [];
    }

    setAiLoading(true);
    setAiResponse(null);
    setContextNotices([]);

    const jobId = `article_ai_${Date.now()}`;
    aiJobIdRef.current = jobId;
    let buffer = '';

    try {
      const localUnlistens: (() => void)[] = [];
      const cleanupLocal = () => {
        localUnlistens.forEach(u => u());
        localUnlistens.length = 0;
      };

      const cleanupListeners = () => {
        if (unlistenFnsRef.current.length > 0) {
          unlistenFnsRef.current.forEach(unlisten => unlisten());
          unlistenFnsRef.current = [];
        }
      };

      try {
        const unNotice = await onStreamNotice((ev) => {
          if (ev.job_id !== aiJobIdRef.current) return;
          if (ev.notice_code === 'CONTEXT_REDUCED' || ev.notice_code === 'EDITORIAL_WARNING') {
            setContextNotices(prev => {
              // do not overwrite, check for distinct notice
              if (prev.some(n => n.notice_code === ev.notice_code)) return prev;
              return [...prev, { notice_code: ev.notice_code, message: ev.message, omitted: ev.omitted_fields || [] }];
            });
          } else {
            console.warn(`[AI Context Notice] ${ev.notice_code}: ${ev.message}`);
          }
        });
        localUnlistens.push(unNotice);

        const unToken = await onStreamToken((ev) => {
          if (ev.job_id !== aiJobIdRef.current) return;
          buffer += ev.token;
          setAiResponse(buffer);
        });
        localUnlistens.push(unToken);

        const unDone = await onStreamDone((ev) => {
          if (ev.job_id !== aiJobIdRef.current) return;
          setAiLoading(false);
          aiJobActiveRef.current = false;
          cleanupListeners();
        });
        localUnlistens.push(unDone);

        const unError = await onStreamError((ev) => {
          if (ev.job_id !== aiJobIdRef.current) return;
          buffer += `\n\nErro: ${ev.message}`;
          setAiResponse(buffer);
          setAiLoading(false);
          aiJobActiveRef.current = false;
          cleanupListeners();
        });
        localUnlistens.push(unError);
      } catch (err) {
        cleanupLocal();
        aiJobActiveRef.current = false;
        throw err;
      }
      
      unlistenFnsRef.current = localUnlistens;

      const request: AiOrchestrationRequest = {
        job_id: jobId,
        action: actionType,
        provider: provider,
        model: selectedModel || undefined,
        context: {
          articleId: formData.id,
          editorialStatus: formData.status,
          categoryTag: formData.categoryTag,
          metadata: {
            title: formData.title || undefined,
            summary: formData.summary || undefined,
            objective: formData.objective || undefined,
            keyword: formData.keyword || undefined,
            persona: formData.persona || undefined,
            cta: formData.cta || undefined,
          },
          notes: formData.notes || undefined,
          links: {
             internal: formData.internalLinks || undefined,
             external: formData.externalLinks || undefined,
          },
          checklistsState: {
             total: formData.checklists.length,
             completed: completedChecklists,
             pendingItems: formData.checklists.filter(c => !c.completed).map(c => c.label)
          },
          content: analysisContent.trim() ? { source: 'pasted', text: analysisContent.trim() } : undefined,
          media: visualDescription.trim() ? [{ type: 'visual_description', data: visualDescription.trim() }] : undefined,
        }
      };

      let providerImpl;
      if (provider === 'OLLAMA') {
        if (!selectedModel) {
          throw new Error('Nenhum modelo OLLAMA selecionado.');
        }
        providerImpl = OllamaProvider;
      } else if (provider === 'SIDECAR') {
        providerImpl = SidecarProvider;
      } else {
        throw new Error(`Provedor de inferência local indisponível ou não suportado: ${provider}`);
      }

      await providerImpl.startInference(request);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err);
      setAiResponse(`Erro ao iniciar inferência local: ${message}`);
      setAiLoading(false);
      aiJobActiveRef.current = false;
      
      // Execute cleanup listeners safely since we are exiting early
      if (unlistenFnsRef.current.length > 0) {
        unlistenFnsRef.current.forEach(unlisten => unlisten());
        unlistenFnsRef.current = [];
      }
    }
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto flex items-center justify-center transition-all ${isFocusMode ? 'bg-white dark:bg-slate-950 p-0' : 'bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6'}`}>
      <div className={`bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col transition-all ${isFocusMode ? 'w-full h-full max-w-5xl max-h-screen border-x shadow-2xl my-auto' : 'border rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto max-h-[92vh]'}`}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <span className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Layers className="w-4 h-4 text-blue-600" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                CMS Editorial Local — {formData.id ? 'Editar Pauta' : 'Nova Pauta'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Estrutura completa com checklists de Acessibilidade, WCAG e SEO
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsFocusMode(!isFocusMode)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition-colors"
              title="Modo de Escrita Minimalista"
              aria-pressed={isFocusMode}
              aria-label="Alternar Modo de Escrita"
            >
              {isFocusMode ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => onDelete(formData.id)}
              className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition-colors"
              title="Excluir Pauta"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Banner Header */}
        <div className="bg-zinc-100 dark:bg-zinc-800 px-6 py-2.5 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center space-x-2 text-zinc-700 dark:text-zinc-300">
            <CheckSquare className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Progresso da Pauta ({completedChecklists} de {formData.checklists.length} itens):</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-32 bg-zinc-300 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-sky-600 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-bold text-sky-600 dark:text-sky-400">{progressPercent}%</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Core Fields (Title, Status, Category, Date) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Title */}
            <div className="md:col-span-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                Título da Matéria *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Ex: IA para Acessibilidade: Ferramentas para Redações"
                className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Stage */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                Etapa do Fluxo
              </label>
              <select
                value={formData.workflowStageId || ''}
                onChange={(e) => handleChange('workflowStageId', e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {workflowStages.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                Categoria Principal
              </label>
              <select
                value={formData.categoryId || ''}
                onChange={(e) => handleChange('categoryId', e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Publish Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                Data de Publicação
              </label>
              <input
                type="date"
                value={formData.publishDate}
                onChange={(e) => handleChange('publishDate', e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Section 2: CMS Editorial Fields (Resumo, Objetivo, Palavra-Chave, Persona, CTA, Links) */}
          <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
              <Target className="w-4 h-4" />
              Detalhamento de Conteúdo CMS
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Resumo
                </label>
                <textarea
                  rows={2}
                  value={formData.summary}
                  onChange={(e) => handleChange('summary', e.target.value)}
                  placeholder="Síntese da notícia ou reportagem..."
                  className="w-full p-2.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Objetivo da Matéria
                </label>
                <textarea
                  rows={2}
                  value={formData.objective}
                  onChange={(e) => handleChange('objective', e.target.value)}
                  placeholder="Qual o impacto e mensagem principal para a sociedade?"
                  className="w-full p-2.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Conteúdo para análise (Texto completo)
                </label>
                <textarea
                  rows={2}
                  value={analysisContent}
                  onChange={(e) => setAnalysisContent(e.target.value)}
                  placeholder="Cole o texto da matéria para validação (opcional)..."
                  className="w-full p-2.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Descrição Visual para Alt Text (Apenas Sessão)
                </label>
                <textarea
                  rows={2}
                  value={visualDescription}
                  onChange={(e) => setVisualDescription(e.target.value)}
                  placeholder="Descreva a imagem (cores, objetos, pessoas, contexto) para gerar o Alt Text..."
                  className="w-full p-2.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Palavra-Chave SEO
                </label>
                <input
                  type="text"
                  value={formData.keyword}
                  onChange={(e) => handleChange('keyword', e.target.value)}
                  placeholder="Ex: IA para acessibilidade"
                  className="w-full p-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Persona do Leitor
                </label>
                <input
                  type="text"
                  value={formData.persona}
                  onChange={(e) => handleChange('persona', e.target.value)}
                  placeholder="Ex: Editores e repórteres de redação digital"
                  className="w-full p-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Chamada para Ação (CTA)
                </label>
                <input
                  type="text"
                  value={formData.cta}
                  onChange={(e) => handleChange('cta', e.target.value)}
                  placeholder="Ex: Baixe o guia completo em PDF"
                  className="w-full p-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Links Internos & Externos
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formData.internalLinks}
                    onChange={(e) => handleChange('internalLinks', e.target.value)}
                    placeholder="URL Interna..."
                    className="p-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg"
                  />
                  <input
                    type="text"
                    value={formData.externalLinks}
                    onChange={(e) => handleChange('externalLinks', e.target.value)}
                    placeholder="URL Externa/Fonte..."
                    className="p-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tempo Estimado x Tempo Gasto
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formData.estimatedTime}
                    onChange={(e) => handleChange('estimatedTime', e.target.value)}
                    placeholder="Estimado (ex: 3h)"
                    className="p-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg"
                  />
                  <input
                    type="text"
                    value={formData.spentTime}
                    onChange={(e) => handleChange('spentTime', e.target.value)}
                    placeholder="Gasto (ex: 2h 15m)"
                    className="p-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Notas do Jornalista
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Lembretes, contatos de fontes..."
                  className="w-full p-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100"
                />
              </div>

            </div>
          </div>

          {/* Section 3: AI Quick Actions Banner */}
          <div className="bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800 dark:text-indigo-300">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                <span>Assistência de IA para esta Pauta (IA Local)</span>
              </div>
              {aiLoading && <span className="text-xs text-indigo-600 font-medium">Gerando...</span>}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {(() => {
                const getButtonStyles = (state: string, isPremium: boolean) => {
                  if (!isPremium || state === 'UNAVAILABLE') {
                    return "bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-60";
                  }
                  if (state === 'RECOMMENDED') {
                    return "bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100 shadow-sm ring-1 ring-amber-500/50";
                  }
                  return "bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100";
                };

                const evalContext = {
                  status: formData.status,
                  title: formData.title,
                  objective: formData.objective,
                  summary: formData.summary,
                  content: analysisContent,
                  keyword: formData.keyword,
                  visualDescription: visualDescription
                };

                const gapsCheck = evaluateAiAction('research_gaps', evalContext);
                const simplifyCheck = evaluateAiAction('plain_language', evalContext);
                const inclusivityCheck = evaluateAiAction('validate_inclusivity', evalContext);
                const altTextCheck = evaluateAiAction('generate_alt_text', evalContext);
                const seoCheck = evaluateAiAction('generate_seo', evalContext);
                const editorialCheck = evaluateAiAction('editorial_review', evalContext);

                return (
                  <>
                    <button
                      type="button"
                      onClick={isPremiumMode && gapsCheck.state !== 'UNAVAILABLE' && !aiLoading ? () => handleAiAction('research_gaps') : undefined}
                      disabled={!isPremiumMode || gapsCheck.state === 'UNAVAILABLE' || aiLoading}
                      aria-disabled={!isPremiumMode || gapsCheck.state === 'UNAVAILABLE' || aiLoading}
                      tabIndex={isPremiumMode && gapsCheck.state !== 'UNAVAILABLE' && !aiLoading ? 0 : -1}
                      title={!isPremiumMode ? "Recurso Premium" : gapsCheck.state === 'UNAVAILABLE' ? `Requer: ${gapsCheck.missing}` : aiLoading ? "Ação em andamento" : "Pesquisar Lacunas"}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${getButtonStyles(gapsCheck.state, isPremiumMode)} ${(!isPremiumMode || gapsCheck.state === 'UNAVAILABLE' || aiLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                      Pesquisar Lacunas {(gapsCheck.state === 'UNAVAILABLE' && isPremiumMode) && `(Falta ${gapsCheck.missing})`} {gapsCheck.state === 'RECOMMENDED' && '⭐'}
                    </button>
                    <button
                      type="button"
                      onClick={isPremiumMode && simplifyCheck.state !== 'UNAVAILABLE' && !aiLoading ? () => handleAiAction('plain_language') : undefined}
                      disabled={!isPremiumMode || simplifyCheck.state === 'UNAVAILABLE' || aiLoading}
                      aria-disabled={!isPremiumMode || simplifyCheck.state === 'UNAVAILABLE' || aiLoading}
                      tabIndex={isPremiumMode && simplifyCheck.state !== 'UNAVAILABLE' && !aiLoading ? 0 : -1}
                      title={!isPremiumMode ? "Recurso Premium" : simplifyCheck.state === 'UNAVAILABLE' ? `Requer: ${simplifyCheck.missing}` : aiLoading ? "Ação em andamento" : "Simplificar Linguagem"}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${getButtonStyles(simplifyCheck.state, isPremiumMode)} ${(!isPremiumMode || simplifyCheck.state === 'UNAVAILABLE' || aiLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      🗣️ Simplificar Linguagem {(simplifyCheck.state === 'UNAVAILABLE' && isPremiumMode) && `(Falta ${simplifyCheck.missing})`} {simplifyCheck.state === 'RECOMMENDED' && '⭐'}
                    </button>
                    <button
                      type="button"
                      onClick={isPremiumMode && inclusivityCheck.state !== 'UNAVAILABLE' && !aiLoading ? () => handleAiAction('validate_inclusivity') : undefined}
                      disabled={!isPremiumMode || inclusivityCheck.state === 'UNAVAILABLE' || aiLoading}
                      aria-disabled={!isPremiumMode || inclusivityCheck.state === 'UNAVAILABLE' || aiLoading}
                      tabIndex={isPremiumMode && inclusivityCheck.state !== 'UNAVAILABLE' && !aiLoading ? 0 : -1}
                      title={!isPremiumMode ? "Recurso Premium" : inclusivityCheck.state === 'UNAVAILABLE' ? `Requer: ${inclusivityCheck.missing}` : aiLoading ? "Ação em andamento" : "Validar Inclusividade"}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${getButtonStyles(inclusivityCheck.state, isPremiumMode)} ${(!isPremiumMode || inclusivityCheck.state === 'UNAVAILABLE' || aiLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      🤝 Validar Inclusividade {(inclusivityCheck.state === 'UNAVAILABLE' && isPremiumMode) && `(Falta ${inclusivityCheck.missing})`} {inclusivityCheck.state === 'RECOMMENDED' && '⭐'}
                    </button>

                    <button
                      type="button"
                      onClick={isPremiumMode && altTextCheck.state !== 'UNAVAILABLE' && !aiLoading ? () => handleAiAction('generate_alt_text') : undefined}
                      disabled={!isPremiumMode || altTextCheck.state === 'UNAVAILABLE' || aiLoading}
                      aria-disabled={!isPremiumMode || altTextCheck.state === 'UNAVAILABLE' || aiLoading}
                      tabIndex={isPremiumMode && altTextCheck.state !== 'UNAVAILABLE' && !aiLoading ? 0 : -1}
                      title={!isPremiumMode ? "Recurso Premium" : altTextCheck.state === 'UNAVAILABLE' ? `Requer: ${altTextCheck.missing}` : aiLoading ? "Ação em andamento" : "Gerar Alt Text WCAG"}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${getButtonStyles(altTextCheck.state, isPremiumMode)} ${(!isPremiumMode || altTextCheck.state === 'UNAVAILABLE' || aiLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      ♿ Alt Text WCAG {(altTextCheck.state === 'UNAVAILABLE' && isPremiumMode) && `(Falta ${altTextCheck.missing})`} {altTextCheck.state === 'RECOMMENDED' && '⭐'}
                    </button>
                    <button
                      type="button"
                      onClick={isPremiumMode && seoCheck.state !== 'UNAVAILABLE' && !aiLoading ? () => handleAiAction('generate_seo') : undefined}
                      disabled={!isPremiumMode || seoCheck.state === 'UNAVAILABLE' || aiLoading}
                      aria-disabled={!isPremiumMode || seoCheck.state === 'UNAVAILABLE' || aiLoading}
                      tabIndex={isPremiumMode && seoCheck.state !== 'UNAVAILABLE' && !aiLoading ? 0 : -1}
                      title={!isPremiumMode ? "Recurso Premium" : seoCheck.state === 'UNAVAILABLE' ? `Requer: ${seoCheck.missing}` : aiLoading ? "Ação em andamento" : "Otimizar Meta Tags SEO"}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${getButtonStyles(seoCheck.state, isPremiumMode)} ${(!isPremiumMode || seoCheck.state === 'UNAVAILABLE' || aiLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      🔍 Otimizar Meta Tags SEO {(seoCheck.state === 'UNAVAILABLE' && isPremiumMode) && `(Falta ${seoCheck.missing})`} {seoCheck.state === 'RECOMMENDED' && '⭐'}
                    </button>
                    <button
                      type="button"
                      onClick={isPremiumMode && editorialCheck.state !== 'UNAVAILABLE' && !aiLoading ? () => handleAiAction('editorial_review') : undefined}
                      disabled={!isPremiumMode || editorialCheck.state === 'UNAVAILABLE' || aiLoading}
                      aria-disabled={!isPremiumMode || editorialCheck.state === 'UNAVAILABLE' || aiLoading}
                      tabIndex={isPremiumMode && editorialCheck.state !== 'UNAVAILABLE' && !aiLoading ? 0 : -1}
                      title={!isPremiumMode ? "Recurso Premium" : editorialCheck.state === 'UNAVAILABLE' ? `Requer: ${editorialCheck.missing}` : aiLoading ? "Ação em andamento" : "Revisão Editorial"}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${getButtonStyles(editorialCheck.state, isPremiumMode)} ${(!isPremiumMode || editorialCheck.state === 'UNAVAILABLE' || aiLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      📋 Revisão Editorial {(editorialCheck.state === 'UNAVAILABLE' && isPremiumMode) && `(Falta ${editorialCheck.missing})`} {editorialCheck.state === 'RECOMMENDED' && '⭐'}
                    </button>
                  </>
                );
              })()}
            </div>

            {contextNotices.map((notice, i) => (
              <div 
                key={`${notice.notice_code}_${i}`}
                className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
                role="alert"
                aria-live="polite"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400">
                      Aviso do Assistente
                    </h4>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed">
                      {notice.message}
                    </p>
                    {notice.omitted && notice.omitted.length > 0 && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1">
                        <span className="font-semibold">Campos omitidos:</span> {notice.omitted.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {aiResponse && (
              <div 
                className="mt-3 p-4 bg-white dark:bg-zinc-900 rounded-lg border border-indigo-200 dark:border-indigo-800"
                aria-live={aiLoading ? "off" : "polite"}
                aria-atomic="false"
                role="log"
                aria-label="Resultado da IA Local"
              >
                <div className="flex items-center justify-between font-bold text-indigo-600 mb-2 text-xs">
                  <span>
                    Resultado da IA Local{aiLoading && <span className="ml-1 animate-pulse">●</span>}:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 text-[10px]"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <div className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans prose prose-sm dark:prose-invert prose-indigo max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-a:text-indigo-600 hover:prose-a:text-indigo-500">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {aiResponse}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Comprehensive Checklists (Pesquisa, SEO, Acessibilidade, WCAG, IA, Distribuição) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-sky-600" />
                Checklists de Validação Editorial ({completedChecklists}/{formData.checklists.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
              {formData.checklists.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs hover:border-sky-300 transition-all"
                >
                  <label className="flex items-center space-x-2.5 cursor-pointer flex-1 mr-2">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleChecklist(item.id)}
                      className="w-4 h-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className={`font-medium text-zinc-800 dark:text-zinc-200 ${item.completed ? 'line-through opacity-50' : ''}`}>
                      {item.label}
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleDeleteChecklistItem(item.id)}
                    className="text-zinc-400 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition-colors p-1"
                    title="Remover este item do checklist"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Add Custom Checklist Item */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Adicionar novo item de verificação..."
                value={newChecklistLabel}
                onChange={(e) => setNewChecklistLabel(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={handleAddChecklist}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 dark:bg-zinc-700 text-white hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </div>
          </div>

          {/* Section 5: History Log */}
          {formData.history && formData.history.length > 0 && (
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                Histórico de Edições
              </h4>
              <div className="space-y-1 max-h-24 overflow-y-auto text-[11px] text-zinc-500">
                {formData.history.map((h) => (
                  <div key={h.id} className="flex justify-between font-mono bg-zinc-50 dark:bg-zinc-800/40 p-1.5 rounded">
                    <span>{h.action}</span>
                    <span className="opacity-60">{new Date(h.date).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/30 transition-all flex items-center gap-2 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Pauta no CMS</span>
          </button>
        </div>

      </div>
    </div>
  );
};
