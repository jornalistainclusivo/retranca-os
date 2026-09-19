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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      {status.type === 'DEVELOPER_PREMIUM' && (
        <div className="bg-amber-500 text-black text-center text-xs font-bold py-1 uppercase tracking-widest relative z-[9999]" role="status" aria-live="polite">
          Developer Mode - Premium Capabilities Unlocked
        </div>
      )}
      {children}
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
