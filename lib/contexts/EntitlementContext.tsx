'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export type EntitlementType = 'FREE' | 'DEVELOPER_PREMIUM';

export interface EntitlementStatus {
  type: EntitlementType;
  is_premium: boolean;
}

interface EntitlementContextState {
  type: EntitlementType;
  isPremium: boolean;
  refreshEntitlements: () => Promise<void>;
  setDeveloperPremium: (enabled: boolean) => Promise<void>;
  selectedModel: string | null;
  setSelectedModel: (model: string | null) => void;
}

const EntitlementContext = createContext<EntitlementContextState | undefined>(undefined);

export function EntitlementProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<EntitlementStatus>({ type: 'FREE', is_premium: false });
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const refreshEntitlements = async () => {
    try {
      const data = await invoke<EntitlementStatus>('get_entitlements');
      setStatus(data);
    } catch (e) {
      console.error('Failed to get entitlements', e);
      setStatus({ type: 'FREE', is_premium: false });
    }
  };

  useEffect(() => {
    refreshEntitlements();
  }, []);

  const setDeveloperPremium = async (enabled: boolean) => {
    try {
      await invoke('set_developer_premium', { enabled });
      await refreshEntitlements();
    } catch (e) {
      console.error('Failed to set developer premium', e);
    }
  };

  return (
    <EntitlementContext.Provider 
      value={{ 
        type: status.type, 
        isPremium: status.is_premium, 
        refreshEntitlements, 
        setDeveloperPremium,
        selectedModel,
        setSelectedModel
      }}
    >
      {children}
      {status.type === 'DEVELOPER_PREMIUM' && (
        <div className="fixed bottom-0 left-0 right-0 bg-amber-500 text-black text-center text-xs font-bold py-1 z-[9999] uppercase tracking-widest">
          Developer Mode - Premium Capabilities Unlocked
        </div>
      )}
    </EntitlementContext.Provider>
  );
}

export function useEntitlement() {
  const context = useContext(EntitlementContext);
  if (context === undefined) {
    throw new Error('useEntitlement must be used within an EntitlementProvider');
  }
  return context;
}
