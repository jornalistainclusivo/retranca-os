'use client';

import React, { useState, useEffect } from 'react';
import { useEntitlement } from '@/lib/contexts/EntitlementContext';

export const DeveloperTools: React.FC = () => {
  const { isPremium, setDeveloperPremium, selectedModel, setSelectedModel } = useEntitlement();
  const [isOpen, setIsOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Fetch models via Tauri IPC when opened
      import('@tauri-apps/api/core').then(({ invoke }) => {
        invoke<string[]>('get_ollama_models')
          .then((models) => {
            setAvailableModels(models);
          })
          .catch(err => console.error("Failed to fetch Ollama models via IPC", err));
      }).catch(err => console.error("Failed to load Tauri core", err));
    }
  }, [isOpen]);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-10 right-4 z-[9999]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-neutral-800 text-neutral-300 hover:bg-neutral-700 p-2 rounded shadow-lg border border-neutral-700 text-xs font-bold font-mono"
      >
        [DEV]
      </button>

      {isOpen && (
        <div className="absolute bottom-12 right-0 w-64 bg-neutral-900 border border-neutral-700 p-4 rounded shadow-2xl flex flex-col gap-4">
          <h3 className="text-sm font-bold text-neutral-200 border-b border-neutral-800 pb-2">Developer Tools</h3>
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">Premium Entitlement</span>
              <button 
                onClick={() => setDeveloperPremium(!isPremium)}
                className={`px-2 py-1 text-xs rounded font-bold ${isPremium ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50' : 'bg-neutral-800 text-neutral-400 border border-neutral-700'}`}
              >
                {isPremium ? 'ON' : 'OFF'}
              </button>
            </div>
            <p className="text-[10px] text-neutral-500 leading-tight">
              Toggles developer premium entitlement via Rust IPC. Will fail in release builds.
            </p>

            <div className="flex items-center justify-between mt-2 border-t border-neutral-800 pt-3">
              <span className="text-xs text-neutral-400">Ollama Model</span>
              <select
                value={selectedModel || ''}
                onChange={(e) => setSelectedModel(e.target.value || null)}
                className="bg-neutral-800 text-neutral-300 text-xs rounded border border-neutral-700 p-1 max-w-[120px]"
              >
                <option value="">-- None --</option>
                {availableModels.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <p className="text-[10px] text-neutral-500 leading-tight">
              Explicit model selection for testing in developer mode.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
