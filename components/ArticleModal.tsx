'use client';

import React, { useState } from 'react';
import { Article, ArticleStatus, CategoryTag, ChecklistItem } from '@/types/editorial';
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
  Maximize,
  Minimize
} from 'lucide-react';

interface ArticleModalProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (article: Article) => void;
  onDelete: (id: string) => void;
  isFocusMode: boolean;
  setIsFocusMode: (focus: boolean) => void;
}

const CATEGORIES: CategoryTag[] = [
  'IA',
  'Acessibilidade',
  'Inclusão',
  'SEO',
  'Docs',
  'Blog',
  'Social',
  'Linguagem Simples',
];

const STATUS_OPTIONS: { id: ArticleStatus; label: string }[] = [
  { id: 'ideia', label: 'Ideia (Cinza)' },
  { id: 'pesquisa', label: 'Pesquisa (Azul)' },
  { id: 'escrita', label: 'Escrita (Amarelo)' },
  { id: 'revisao', label: 'Revisão (Laranja)' },
  { id: 'publicado', label: 'Publicado (Verde)' },
];

export const ArticleModal: React.FC<ArticleModalProps> = ({
  article,
  isOpen,
  onClose,
  onSave,
  onDelete,
  isFocusMode,
  setIsFocusMode,
}) => {
  const [prevArticleId, setPrevArticleId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Article>(() => article || {
    id: '',
    title: '',
    status: 'ideia',
    categoryTag: 'Acessibilidade',
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
  
  const isPremiumMode = false; // Mock for freemium constraints

  if (article && article.id !== prevArticleId) {
    setPrevArticleId(article.id);
    setFormData({ ...article });
    setAiResponse(null);
  }

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
        action: `Edição de detalhes CMS salvas (Status: ${formData.status.toUpperCase()})`,
      },
      ...formData.history,
    ];

    onSave({
      ...formData,
      history: newHistory,
    });
    onClose();
  };

  // Quick AI Assistant action call
  const handleAiAction = async (actionType: 'generate_alt_text' | 'generate_seo' | 'check_accessibility' | 'validate_inclusivity') => {
    setAiLoading(true);
    setAiResponse(null);
    try {
      const res = await fetch('/api/gemini/editorial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          topic: formData.title,
          text: formData.notes || formData.summary,
          imageDescription: formData.title,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setAiResponse(data.result);
      } else {
        setAiResponse('Erro ao obter sugestão da inteligência artificial.');
      }
    } catch (err: any) {
      setAiResponse('Erro de conexão ao executar IA.');
    } finally {
      setAiLoading(false);
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

            {/* Status */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                Status Editorial
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value as ArticleStatus)}
                className="w-full px-3 py-2 text-xs font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.label}
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
                value={formData.categoryTag}
                onChange={(e) => handleChange('categoryTag', e.target.value as CategoryTag)}
                className="w-full px-3 py-2 text-xs font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
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
                <span>Assistência de IA para esta Pauta (Gemini 3.6 Flash)</span>
              </div>
              {aiLoading && <span className="text-xs text-indigo-600 font-medium">Gerando...</span>}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={isPremiumMode ? () => handleAiAction('generate_alt_text') : undefined}
                aria-disabled={!isPremiumMode}
                tabIndex={isPremiumMode ? 0 : -1}
                title={isPremiumMode ? "Alt Text WCAG com IA" : "Recurso Premium"}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                  isPremiumMode 
                    ? "bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100" 
                    : "bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-60"
                }`}
              >
                ♿ Alt Text WCAG com IA
              </button>
              <button
                type="button"
                onClick={isPremiumMode ? () => handleAiAction('generate_seo') : undefined}
                aria-disabled={!isPremiumMode}
                tabIndex={isPremiumMode ? 0 : -1}
                title={isPremiumMode ? "Otimizar Meta Tags SEO" : "Recurso Premium"}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                  isPremiumMode 
                    ? "bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100" 
                    : "bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-60"
                }`}
              >
                🔍 Otimizar Meta Tags SEO
              </button>
              <button
                type="button"
                onClick={isPremiumMode ? () => handleAiAction('check_accessibility') : undefined}
                aria-disabled={!isPremiumMode}
                tabIndex={isPremiumMode ? 0 : -1}
                title={isPremiumMode ? "Auditoria de Linguagem Simples" : "Recurso Premium"}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                  isPremiumMode 
                    ? "bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100" 
                    : "bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-60"
                }`}
              >
                ✨ Auditoria de Linguagem Simples
              </button>
              <button
                type="button"
                onClick={isPremiumMode ? () => handleAiAction('validate_inclusivity') : undefined}
                aria-disabled={!isPremiumMode}
                tabIndex={isPremiumMode ? 0 : -1}
                title={isPremiumMode ? "Validador Inclusivo" : "Recurso Premium"}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                  isPremiumMode 
                    ? "bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900" 
                    : "bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-60"
                }`}
              >
                🤝 Validador Inclusivo
              </button>
            </div>

            {aiResponse && (
              <div className="mt-3 p-3 bg-white dark:bg-zinc-900 rounded-lg border border-indigo-200 dark:border-indigo-800 text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
                <div className="font-bold text-indigo-600 mb-1">Resultado da IA:</div>
                {aiResponse}
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
