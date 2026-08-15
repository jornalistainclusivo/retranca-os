'use client';

import React, { useState } from 'react';
import { GOVERNANCE_DOCS } from '@/lib/initialData';
import { FileText, Copy, Check, Printer, ShieldCheck } from 'lucide-react';

export const GovernanceView: React.FC = () => {
  const [selectedType, setSelectedType] = useState<'BRD' | 'PRD' | 'SDD' | 'TSD'>('BRD');
  const [copied, setCopied] = useState(false);

  const doc = GOVERNANCE_DOCS.find((d) => d.type === selectedType) || GOVERNANCE_DOCS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(doc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <span className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Documentos de Governança Editorial (Retranca)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              BRD, PRD, SDD e TSD de especificação do Retranca OS
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
          </button>
        </div>
      </div>

      {/* Doc Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {GOVERNANCE_DOCS.map((d) => (
          <button
            key={d.type}
            onClick={() => setSelectedType(d.type)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              selectedType === d.type
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {d.title}
          </button>
        ))}
      </div>

      {/* Doc Content Display */}
      <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
        <div className="flex items-center justify-between text-[11px] font-sans text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-700">
          <span>Última atualização: {doc.lastUpdated}</span>
          <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">Versão 1.0 Oficial</span>
        </div>
        {doc.content}
      </div>

    </div>
  );
};
