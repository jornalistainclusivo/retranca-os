'use client';

import React, { useState, useEffect } from 'react';
import { GovernanceDoc } from '@/types/editorial';
import { getGovernanceDocs, createGovernanceDoc, updateGovernanceDoc, deleteGovernanceDoc } from '@/lib/api/governance';
import { toGovernanceDocProps, fromGovernanceDocProps } from '@/lib/adapters/governanceAdapter';
import { GovernanceList } from './governance/GovernanceList';
import { GovernanceEditor } from './governance/GovernanceEditor';

export const GovernanceView: React.FC = () => {
  const [docs, setDocs] = useState<GovernanceDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'edit'>('list');
  const [currentDoc, setCurrentDoc] = useState<GovernanceDoc | null>(null);

  const loadDocs = async () => {
    setIsLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
        const rawDocs = await getGovernanceDocs();
        const adaptedDocs = rawDocs.map(toGovernanceDocProps);
        setDocs(adaptedDocs);
      } else {
        // Fallback for non-Tauri environment if needed, or just empty
        setDocs([]);
      }
    } catch (e) {
      console.error("Error loading governance docs", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDocs();
  }, []);

  const handleEdit = (doc: GovernanceDoc) => {
    setCurrentDoc(doc);
    setViewMode('edit');
  };

  const handleCreateNew = () => {
    setCurrentDoc({
      id: '',
      type: 'PRD',
      title: '',
      description: '',
      content: '',
      lastUpdated: new Date().toISOString()
    });
    setViewMode('edit');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir permanentemente este documento?')) {
      try {
        if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
          await deleteGovernanceDoc(id);
          await loadDocs();
        }
      } catch (e) {
        console.error("Error deleting doc", e);
      }
    }
  };

  const handleSave = async (doc: GovernanceDoc) => {
    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
        const rawDoc = fromGovernanceDocProps(doc);
        if (!doc.id) {
          rawDoc.id = `gov_${Date.now()}`;
          await createGovernanceDoc(rawDoc);
        } else {
          await updateGovernanceDoc(doc.id, rawDoc);
        }
        await loadDocs();
      }
      setViewMode('list');
      setCurrentDoc(null);
    } catch (e) {
      console.error("Error saving doc", e);
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setCurrentDoc(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-slate-100"></div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {viewMode === 'list' ? (
        <GovernanceList 
          docs={docs} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
          onCreateNew={handleCreateNew} 
        />
      ) : (
        currentDoc && (
          <GovernanceEditor 
            doc={currentDoc} 
            onSave={handleSave} 
            onCancel={handleCancel} 
          />
        )
      )}
    </div>
  );
};
