'use client';

import { AiTextMarkdown } from '@/components/AiTextMarkdown';
import { restoreAiCancelFocus, useModalDialog } from '@/lib/hooks/useModalDialog';
import { AiJobSession } from '@/lib/adapters/aiJobSession';

import type { AiAction } from '@/types/ai';

import { useAiRuntime } from '@/lib/contexts/AiRuntimeContext';
import {
  onStreamToken,
  onStreamDone,
  onStreamCanceled,
  onStreamError,
  onStreamNotice,
} from '@/lib/adapters/localAiAdapter';
import { SidecarProvider, OllamaProvider } from '@/lib/adapters/aiProviderRouter';
import type { ProviderType, AiOrchestrationRequest } from '@/types/ai';

import React, { useState, useEffect } from 'react';
import { Article, ArticleStatus, CategoryTag, ChecklistItem, WorkflowStage, CategoryEntity, ChecklistTemplate } from '@/types/editorial';
import { fetchChecklistTemplates } from '@/lib/api/articles';
import { evaluateAiAction } from '@/lib/utils/aiActionEvaluator';
import { runArticleSave } from '@/lib/utils/articleSave';
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
  Check,
  ShieldAlert
} from 'lucide-react';

interface ArticleModalProps {
  article: Article | null;
  workflowStages: WorkflowStage[];
  categories: CategoryEntity[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (article: Article) => void | Promise<void>;
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
  const fieldId = React.useId();
  const dialogRef = useModalDialog(isOpen && !!article, onClose);
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
  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCancelling, setAiCancelling] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  const [aiCancelError, setAiCancelError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [contextNotices, setContextNotices] = useState<{ notice_code: string, message: string, omitted?: string[] }[]>([]);
  const analysisContent = typeof formData.analysisContent === 'string' ? formData.analysisContent : '';
  const [visualDescriptions, setVisualDescriptions] = useState(() => new Map<string, string>());
  const visualDescription = article ? visualDescriptions.get(article.id) ?? '' : '';
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { selectedModel } = useAiRuntime();

  useEffect(() => {
    fetchChecklistTemplates().then(setChecklistTemplates).catch(console.error);
  }, []);

  const aiJobIdRef = React.useRef<string | null>(null);
  const aiJobActiveRef = React.useRef(false);
  const sessionRef = React.useRef<AiJobSession | null>(null);
  const cancelHadFocusRef = React.useRef(false);
  const sessionKey = isOpen && article ? article.id : null;
  const saveSessionRef = React.useRef<AbortController | null>(null);
  const [previousSessionKey, setPreviousSessionKey] = useState(sessionKey);
  const cleanupListeners = React.useCallback(() => {
    restoreAiCancelFocus(dialogRef.current, cancelHadFocusRef.current);
    cancelHadFocusRef.current = false;
    sessionRef.current?.finish();
    sessionRef.current = null;
    aiJobIdRef.current = null;
  }, [dialogRef]);
  
  useEffect(() => {
    if (sessionKey === null) return;
    const saveSession = new AbortController();
    saveSessionRef.current = saveSession;
    return () => {
      saveSession.abort();
      sessionRef.current?.dispose();
      cleanupListeners();
      aiJobActiveRef.current = false;
    };
  }, [sessionKey, cleanupListeners]);

  if (sessionKey !== previousSessionKey) {
    setPreviousSessionKey(sessionKey);
    setAiLoading(false);
    setAiCancelling(false);
    setAiStatus('');
    setAiCancelError(null);
    setSaveError(null);
    setSaving(false);
    if (article && sessionKey !== null) {
      setFormData({ ...article });
      setAiResponse(null);
      setContextNotices([]);
      setCopied(false);
    }
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
      id: `custom_${crypto.randomUUID()}`,
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

  const handleApplyTemplate = () => {
    if (!selectedTemplateId) return;
    const template = checklistTemplates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    const newItems: ChecklistItem[] = template.items.map(item => ({
      id: `ci_${crypto.randomUUID()}`,
      label: item.label,
      completed: false,
      category: 'editorial' as any
    }));

    setFormData(prev => ({
      ...prev,
      checklists: [...prev.checklists, ...newItems]
    }));
    setSelectedTemplateId('');
  };

  const handleDeleteChecklistItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      checklists: prev.checklists.filter((c) => c.id !== id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const saveSession = saveSessionRef.current;
    if (saving || !saveSession || saveSession.signal.aborted) return;
    setSaving(true);
    setSaveError(null);
    // Add history log entry
    const newHistory = [
      {
        id: `h_${crypto.randomUUID()}`,
        date: new Date().toISOString(),
        action: `Edição de detalhes CMS salvas (Etapa: ${workflowStages.find(s => s.id === formData.workflowStageId)?.displayName || formData.status})`,
      },
      ...formData.history,
    ];

    await runArticleSave(() => onSave({ ...formData, analysisContent, history: newHistory }), saveSession.signal, {
      onSaved: onClose,
      onError: () => setSaveError('Não foi possível salvar a pauta. Seu texto continua aqui; tente novamente.'),
      onSettled: () => setSaving(false),
    });
  };

  // Quick AI Assistant action call via local Tauri IPC
  const handleAiAction = async (actionType: AiAction) => {
    if (aiJobActiveRef.current) return;
    aiJobActiveRef.current = true;

    // Cleanup previous listeners to prevent duplicates and memory leaks
    cleanupListeners();

    setAiLoading(true);
    setAiCancelling(false);
    setAiStatus('Preparando geração...');
    setAiCancelError(null);
    setAiResponse(null);
    setContextNotices([]);

    const jobId = `article_ai_${crypto.randomUUID()}`;
    const session = new AiJobSession(jobId, provider === 'OLLAMA' ? OllamaProvider : SidecarProvider);
    sessionRef.current = session;
    aiJobIdRef.current = jobId;
    let buffer = '';

    try {
      if (provider !== 'OLLAMA' && provider !== 'SIDECAR') {
        throw new Error(`Provedor de inferência local indisponível ou não suportado: ${provider}`);
      }
      if (provider === 'OLLAMA' && !selectedModel) throw new Error('Nenhum modelo OLLAMA selecionado.');
        await session.listen(() => onStreamNotice((ev) => {
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
        }));

        await session.listen(() => onStreamToken((ev) => {
          if (ev.job_id !== aiJobIdRef.current || session.cancellationRequested) return;
          buffer += ev.token;
          setAiResponse(buffer);
          setAiStatus('Gerando...');
        }));

        await session.listen(() => onStreamDone((ev) => {
          if (ev.job_id !== aiJobIdRef.current) return;
          setAiLoading(false);
          setAiCancelling(false);
          setAiStatus('Geração concluída.');
          aiJobActiveRef.current = false;
          cleanupListeners();
        }));

        await session.listen(() => onStreamCanceled((ev) => {
          if (ev.job_id !== aiJobIdRef.current) return;
          setAiLoading(false);
          setAiCancelling(false);
          setAiStatus('Geração cancelada.');
          aiJobActiveRef.current = false;
          cleanupListeners();
        }));

        await session.listen(() => onStreamError((ev) => {
          if (ev.job_id !== aiJobIdRef.current) return;
          buffer += `\n\nErro: ${ev.message}`;
          setAiResponse(buffer);
          setAiLoading(false);
          setAiCancelling(false);
          setAiStatus('Erro na geração.');
          aiJobActiveRef.current = false;
          cleanupListeners();
        }));

      if (aiJobIdRef.current !== jobId || session.cancellationRequested) return;

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

      await session.start(request);
    } catch (err: unknown) {
      if (aiJobIdRef.current !== jobId) return;
      const message = err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err);
      setAiResponse(`Erro ao iniciar inferência local: ${message}`);
      setAiLoading(false);
      setAiCancelling(false);
      setAiStatus('Erro ao iniciar geração.');
      aiJobActiveRef.current = false;
      
      cleanupListeners();
    }
  };

  const handleCancelAi = async () => {
    const session = sessionRef.current;
    if (!session || aiCancelling) return;
    cancelHadFocusRef.current = !!dialogRef.current?.querySelector('[data-ai-cancel]')?.contains(document.activeElement);
    setAiCancelling(true);
    setAiStatus('Cancelando geração...');
    setAiCancelError(null);
    try {
      await session.cancel();
      if (sessionRef.current !== session) return;
      setAiLoading(false);
      setAiCancelling(false);
      setAiStatus('Geração cancelada.');
      aiJobActiveRef.current = false;
      cleanupListeners();
    } catch (error) {
      if (sessionRef.current !== session) return;
      setAiCancelling(false);
      setAiCancelError(`Falha ao cancelar: ${error instanceof Error ? error.message : String(error)}. Tente novamente.`);
      setAiStatus('Geração em andamento.');
    }
  };

  return (
    <dialog ref={dialogRef} aria-labelledby={`${fieldId}-dialog-title`} className={`fixed inset-0 m-0 border-0 w-full max-w-none h-full max-h-none overflow-y-auto hidden open:flex items-center justify-center transition-all motion-reduce:transition-none backdrop:bg-slate-900/60 backdrop:backdrop-blur-xs ${isFocusMode ? 'bg-white dark:bg-slate-950 p-0' : 'bg-transparent p-3 sm:p-6'}`}>
      <div className={`bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col transition-all ${isFocusMode ? 'w-full h-full max-w-5xl max-h-screen border-x shadow-2xl my-auto' : 'border rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto max-h-[92vh]'}`}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <span className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Layers className="w-4 h-4 text-blue-600" />
            </span>
            <div>
              <h2 id={`${fieldId}-dialog-title`} tabIndex={-1} data-dialog-initial-focus className="text-base font-bold text-slate-900 dark:text-slate-100 focus-visible:outline-2 focus-visible:outline-sky-500">
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
              type="button"
              aria-label="Fechar pauta"
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
        <form id={`${fieldId}-form`} onSubmit={handleSubmit} aria-busy={saving} className="flex-1 overflow-y-auto p-6">
          <fieldset disabled={saving} className="min-w-0 space-y-6">
          
          {/* Section 1: Core Fields (Title, Status, Category, Date) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Title */}
            <div className="md:col-span-3">
              <label htmlFor={`${fieldId}-title`} className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                Título da Matéria *
              </label>
              <input
                type="text"
                required
                id={`${fieldId}-title`}
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Ex: IA para Acessibilidade: Ferramentas para Redações"
                className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Stage */}
            <div>
              <label htmlFor={`${fieldId}-stage`} className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                Etapa do Fluxo
              </label>
              <select
                id={`${fieldId}-stage`}
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
                <label htmlFor={`${fieldId}-summary`} className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Resumo
                </label>
                <textarea
                  rows={2}
                  id={`${fieldId}-summary`}
                  value={formData.summary}
                  onChange={(e) => handleChange('summary', e.target.value)}
                  placeholder="Síntese da notícia ou reportagem..."
                  className="w-full p-2.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label htmlFor={`${fieldId}-objective`} className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Objetivo da Matéria
                </label>
                <textarea
                  rows={2}
                  id={`${fieldId}-objective`}
                  value={formData.objective}
                  onChange={(e) => handleChange('objective', e.target.value)}
                  placeholder="Qual o impacto e mensagem principal para a sociedade?"
                  className="w-full p-2.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label htmlFor={`${fieldId}-content`} className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Conteúdo para análise (Texto completo)
                </label>
                <textarea
                  rows={2}
                  id={`${fieldId}-content`}
                  data-ai-retry
                  value={analysisContent}
                  onChange={(e) => handleChange('analysisContent', e.target.value)}
                  aria-describedby={`${fieldId}-analysis-help`}
                  placeholder="Cole o texto da matéria para validação (opcional)..."
                  className="w-full p-2.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p id={`${fieldId}-analysis-help`} className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  Texto desta pauta. Para mantê-lo ao reabrir o aplicativo, selecione Salvar Pauta no CMS.
                </p>
              </div>

              <div>
                <label htmlFor={`${fieldId}-visual`} className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Descrição Visual para Alt Text (Apenas Sessão)
                </label>
                <textarea
                  rows={2}
                  id={`${fieldId}-visual`}
                  value={visualDescription}
                  onChange={(e) => setVisualDescriptions(previous => new Map(previous).set(article.id, e.target.value))}
                  placeholder="Descreva a imagem (cores, objetos, pessoas, contexto) para gerar o Alt Text..."
                  className="w-full p-2.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label htmlFor={`${fieldId}-keyword`} className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Palavra-Chave SEO
                </label>
                <input
                  type="text"
                  id={`${fieldId}-keyword`}
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
                <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse motion-reduce:animate-none" />
                <span>Assistência de IA para esta Pauta (IA Local)</span>
              </div>
              <span role="status" aria-live="polite" className="text-xs text-indigo-600 dark:text-indigo-300 font-medium">{aiStatus}</span>
              {aiLoading && (
                <button type="button" onClick={handleCancelAi} data-ai-cancel disabled={aiCancelling} className="px-3 py-2 text-xs rounded-lg bg-red-600 text-white focus-visible:outline-2 focus-visible:outline-sky-500 disabled:opacity-50">
                  {aiCancelling ? 'Cancelando...' : 'Cancelar geração'}
                </button>
              )}
              {aiCancelError && <p role="alert" className="text-xs text-red-700 dark:text-red-300">{aiCancelError}</p>}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {(() => {
                const getButtonStyles = (state: string) => {
                  if (state === 'UNAVAILABLE') {
                    return "bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-60";
                  }
                  if (state === 'RECOMMENDED') {
                    return "bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100 shadow-sm ring-1 ring-amber-500/50";
                  }
                  return "bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100";
                };

                const evalContext = {
                  semanticClassification: workflowStages.find(stage => stage.id === formData.workflowStageId)?.semanticClassification ?? null,
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
                      onClick={gapsCheck.state !== 'UNAVAILABLE' && !aiLoading ? () => handleAiAction('research_gaps') : undefined}
                      disabled={gapsCheck.state === 'UNAVAILABLE' || aiLoading}
                      aria-disabled={gapsCheck.state === 'UNAVAILABLE' || aiLoading}
                      tabIndex={gapsCheck.state !== 'UNAVAILABLE' && !aiLoading ? 0 : -1}
                      title={gapsCheck.state === 'UNAVAILABLE' ? `Requer: ${gapsCheck.missing}` : aiLoading ? "Ação em andamento" : "Pesquisar Lacunas"}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border min-h-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 motion-reduce:transition-none transition-all ${getButtonStyles(gapsCheck.state)} ${(gapsCheck.state === 'UNAVAILABLE' || aiLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                      Pesquisar Lacunas {(gapsCheck.state === 'UNAVAILABLE') && `(Falta ${gapsCheck.missing})`}
                    </button>
                    <button
                      type="button"
                      onClick={simplifyCheck.state !== 'UNAVAILABLE' && !aiLoading ? () => handleAiAction('plain_language') : undefined}
                      disabled={simplifyCheck.state === 'UNAVAILABLE' || aiLoading}
                      aria-disabled={simplifyCheck.state === 'UNAVAILABLE' || aiLoading}
                      tabIndex={simplifyCheck.state !== 'UNAVAILABLE' && !aiLoading ? 0 : -1}
                      title={simplifyCheck.state === 'UNAVAILABLE' ? `Requer: ${simplifyCheck.missing}` : aiLoading ? "Ação em andamento" : "Simplificar Linguagem"}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border min-h-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 motion-reduce:transition-none transition-all ${getButtonStyles(simplifyCheck.state)} ${(simplifyCheck.state === 'UNAVAILABLE' || aiLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      🗣️ Simplificar Linguagem {(simplifyCheck.state === 'UNAVAILABLE') && `(Falta ${simplifyCheck.missing})`} {simplifyCheck.state === 'RECOMMENDED' && <span> — Recomendado</span>}
                    </button>
                    <button
                      type="button"
                      onClick={inclusivityCheck.state !== 'UNAVAILABLE' && !aiLoading ? () => handleAiAction('validate_inclusivity') : undefined}
                      disabled={inclusivityCheck.state === 'UNAVAILABLE' || aiLoading}
                      aria-disabled={inclusivityCheck.state === 'UNAVAILABLE' || aiLoading}
                      tabIndex={inclusivityCheck.state !== 'UNAVAILABLE' && !aiLoading ? 0 : -1}
                      title={inclusivityCheck.state === 'UNAVAILABLE' ? `Requer: ${inclusivityCheck.missing}` : aiLoading ? "Ação em andamento" : "Validar Inclusividade"}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border min-h-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 motion-reduce:transition-none transition-all ${getButtonStyles(inclusivityCheck.state)} ${(inclusivityCheck.state === 'UNAVAILABLE' || aiLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      🤝 Validar Inclusividade {(inclusivityCheck.state === 'UNAVAILABLE') && `(Falta ${inclusivityCheck.missing})`} {inclusivityCheck.state === 'RECOMMENDED' && <span> — Recomendado</span>}
                    </button>

                    <button
                      type="button"
                      onClick={altTextCheck.state !== 'UNAVAILABLE' && !aiLoading ? () => handleAiAction('generate_alt_text') : undefined}
                      disabled={altTextCheck.state === 'UNAVAILABLE' || aiLoading}
                      aria-disabled={altTextCheck.state === 'UNAVAILABLE' || aiLoading}
                      tabIndex={altTextCheck.state !== 'UNAVAILABLE' && !aiLoading ? 0 : -1}
                      title={altTextCheck.state === 'UNAVAILABLE' ? `Requer: ${altTextCheck.missing}` : aiLoading ? "Ação em andamento" : "Gerar Alt Text WCAG"}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border min-h-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 motion-reduce:transition-none transition-all ${getButtonStyles(altTextCheck.state)} ${(altTextCheck.state === 'UNAVAILABLE' || aiLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      ♿ Alt Text WCAG {(altTextCheck.state === 'UNAVAILABLE') && `(Falta ${altTextCheck.missing})`} {altTextCheck.state === 'RECOMMENDED' && <span> — Recomendado</span>}
                    </button>
                    <button
                      type="button"
                      onClick={seoCheck.state !== 'UNAVAILABLE' && !aiLoading ? () => handleAiAction('generate_seo') : undefined}
                      disabled={seoCheck.state === 'UNAVAILABLE' || aiLoading}
                      aria-disabled={seoCheck.state === 'UNAVAILABLE' || aiLoading}
                      tabIndex={seoCheck.state !== 'UNAVAILABLE' && !aiLoading ? 0 : -1}
                      title={seoCheck.state === 'UNAVAILABLE' ? `Requer: ${seoCheck.missing}` : aiLoading ? "Ação em andamento" : "Otimizar Meta Tags SEO"}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border min-h-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 motion-reduce:transition-none transition-all ${getButtonStyles(seoCheck.state)} ${(seoCheck.state === 'UNAVAILABLE' || aiLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      🔍 Otimizar Meta Tags SEO {(seoCheck.state === 'UNAVAILABLE') && `(Falta ${seoCheck.missing})`} {seoCheck.state === 'RECOMMENDED' && <span> — Recomendado</span>}
                    </button>
                    <button
                      type="button"
                      onClick={editorialCheck.state !== 'UNAVAILABLE' && !aiLoading ? () => handleAiAction('editorial_review') : undefined}
                      disabled={editorialCheck.state === 'UNAVAILABLE' || aiLoading}
                      aria-disabled={editorialCheck.state === 'UNAVAILABLE' || aiLoading}
                      tabIndex={editorialCheck.state !== 'UNAVAILABLE' && !aiLoading ? 0 : -1}
                      title={editorialCheck.state === 'UNAVAILABLE' ? `Requer: ${editorialCheck.missing}` : aiLoading ? "Ação em andamento" : "Revisão Editorial"}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border min-h-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 motion-reduce:transition-none transition-all ${getButtonStyles(editorialCheck.state)} ${(editorialCheck.state === 'UNAVAILABLE' || aiLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      📋 Revisão Editorial {(editorialCheck.state === 'UNAVAILABLE') && `(Falta ${editorialCheck.missing})`} {editorialCheck.state === 'RECOMMENDED' && <span> — Recomendado</span>}
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
                    Resultado da IA Local{aiLoading && <span aria-hidden="true" className="ml-1 animate-pulse motion-reduce:animate-none">●</span>}:
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
                  <AiTextMarkdown>
                    {aiResponse}
                  </AiTextMarkdown>
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

            {/* Checklist Templates (Available to all tiers per Slice 6 contract) */}
            {checklistTemplates.length > 0 && (
              <div className="flex items-center space-x-2 mt-4 bg-sky-500/10 p-2 rounded-lg border border-sky-500/20">
                <ShieldAlert className="w-4 h-4 text-sky-500 flex-shrink-0" />
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                  <option value="">Aplicar template salvo...</option>
                  {checklistTemplates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleApplyTemplate}
                  disabled={!selectedTemplateId}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-500 text-white hover:bg-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Aplicar
                </button>
              </div>
            )}
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

          </fieldset>
        </form>

        {/* Footer */}
        {saveError && <p role="alert" className="px-6 py-2 text-sm text-red-700 dark:text-red-300">{saveError}</p>}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="submit"
            form={`${fieldId}-form`}
            disabled={saving}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/30 transition-all flex items-center gap-2 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Salvando pauta...' : 'Salvar Pauta no CMS'}</span>
          </button>
        </div>

      </div>
    </dialog>
  );
};
