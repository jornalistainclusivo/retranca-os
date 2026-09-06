import React from 'react';
import { GovernanceDoc } from '@/types/editorial';
import { FileText, Edit2, Trash2, Plus } from 'lucide-react';

interface GovernanceListProps {
  docs: GovernanceDoc[];
  onEdit: (doc: GovernanceDoc) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

export const GovernanceList: React.FC<GovernanceListProps> = ({ docs, onEdit, onDelete, onCreateNew }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-full">
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Bloco de notas
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gerencie anotações da sua redação de forma local.
          </p>
        </div>
        <button 
          onClick={onCreateNew}
          className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Documento</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {docs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <p>Nenhuma anotação encontrada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {docs.map(doc => (
              <div key={doc.id} className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex flex-col hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-slate-50 dark:bg-slate-950/50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                      {doc.type}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                      {doc.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => onEdit(doc)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      title="Editar documento"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      title="Excluir documento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1">
                  {doc.description || 'Sem descrição.'}
                </p>
                <div className="text-xs text-slate-400 dark:text-slate-500">
                  Atualizado em {new Date(doc.lastUpdated).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
