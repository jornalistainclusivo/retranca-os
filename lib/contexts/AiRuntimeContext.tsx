'use client';

import React, { createContext, useContext, useState } from 'react';

interface AiRuntimeContextState {
  selectedModel: string | null;
  setSelectedModel: (model: string | null) => void;
}

const AiRuntimeContext = createContext<AiRuntimeContextState | undefined>(undefined);

export function AiRuntimeProvider({ children }: { children: React.ReactNode }) {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  return (
    <AiRuntimeContext.Provider value={{ selectedModel, setSelectedModel }}>
      {children}
    </AiRuntimeContext.Provider>
  );
}

export function useAiRuntime() {
  const context = useContext(AiRuntimeContext);
  if (!context) throw new Error('useAiRuntime must be used within an AiRuntimeProvider');
  return context;
}
