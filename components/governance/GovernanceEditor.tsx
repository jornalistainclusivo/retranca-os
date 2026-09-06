import React, { useState, useEffect, useRef } from 'react';
import { GovernanceDoc } from '@/types/editorial';
import { ArrowLeft, Save, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface GovernanceEditorProps {
  doc: GovernanceDoc;
  onSave: (doc: GovernanceDoc) => void;
  onCancel: () => void;
}

export const GovernanceEditor: React.FC<GovernanceEditorProps> = ({ doc, onSave, onCancel }) => {
  const [formData, setFormData] = useState<GovernanceDoc>(doc);
  const [previewMode, setPreviewMode] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focar no título ao abrir o editor, respeitando CS 2.4.3
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave({
      ...formData,
      lastUpdated: new Date().toISOString()
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-full">
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onCancel}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Voltar sem salvar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {doc.id ? 'Editar Documento' : 'Novo Documento'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setPreviewMode(!previewMode)}
            className="px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            {previewMode ? 'Modo Edição' : 'Visualizar Markdown'}
          </button>
          <button 
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar Alterações
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <label htmlFor="type" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tipo
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="PAUTA">Pauta</option>
              <option value="ENTREVISTA">Entrevista</option>
              <option value="RASCUNHO">Rascunho</option>
              <option value="PESQUISA">Pesquisa</option>
              <option value="OUTRO">Outro</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Título
            </label>
            <input
              ref={titleInputRef}
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ex: Pauta sobre Acessibilidade"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Subtítulo / Descrição
          </label>
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Breve resumo sobre o propósito deste documento..."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex-1 flex flex-col min-h-[400px]">
          <label htmlFor="content" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Corpo do Texto (Markdown)
          </label>
          
          {previewMode ? (
            <div className="flex-1 border border-slate-300 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-950 overflow-y-auto prose dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {formData.content || '*Nenhum conteúdo.*'}
              </ReactMarkdown>
            </div>
          ) : (
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="# Novo Documento&#10;&#10;Escreva aqui usando Markdown..."
              className="flex-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono resize-none"
            />
          )}
        </div>
      </div>
    </div>
  );
};
