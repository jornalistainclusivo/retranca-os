'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import {
  createWorkspaceBackup, isWorkspaceBackupDesktop, listWorkspaceBackups, verifyWorkspaceBackup,
  workspaceBackupApplicationName, workspaceBackupErrorMessage,
  type InternalBackupInventory, type VerifiedInternalBackup,
} from '@/lib/api/workspaceBackup';

type Operation = 'IDLE' | 'LISTING' | 'CREATING' | 'VERIFYING';
const control = 'min-h-10 px-3 py-2 rounded-lg border border-slate-400 dark:border-slate-500 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60 motion-reduce:transition-none';

export function WorkspaceBackupPanel({ workspaceReady }: { workspaceReady: boolean }) {
  const panelId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const running = useRef(false);
  const mounted = useRef(true);
  const [open, setOpen] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const [operation, setOperation] = useState<Operation>('IDLE');
  const [inventory, setInventory] = useState<InternalBackupInventory | null>(null);
  const [selected, setSelected] = useState('');
  const [verified, setVerified] = useState<VerifiedInternalBackup | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const busy = operation !== 'IDLE';

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  function acceptInventory(value: InternalBackupInventory, preferred?: string) {
    setInventory(value);
    setSelected(previous => {
      const candidate = preferred ?? previous;
      return value.entries.some(entry => entry.operation_id === candidate) ? candidate : value.entries[0]?.operation_id ?? '';
    });
  }

  async function refresh() {
    if (running.current) return;
    running.current = true;
    setOperation('LISTING'); setError(''); setMessage('Consultando backups internos...');
    try {
      const value = await listWorkspaceBackups();
      if (!mounted.current) return;
      acceptInventory(value);
      setMessage(value.entries.length ? `${value.entries.length} pasta(s) encontrada(s). Selecione uma para verificar.` : 'Nenhum backup interno encontrado.');
    } catch (failure) {
      if (mounted.current) { setInventory(null); setSelected(''); setMessage(''); setError(workspaceBackupErrorMessage(failure)); }
    } finally { running.current = false; if (mounted.current) setOperation('IDLE'); }
  }

  function show() {
    dialog.current?.showModal(); setOpen(true); heading.current?.focus();
    const available = isWorkspaceBackupDesktop(); setDesktop(available);
    if (available) void refresh();
  }

  async function perform(kind: 'CREATING' | 'VERIFYING') {
    if (running.current || !workspaceReady || !desktop || (kind === 'VERIFYING' && !selected)) return;
    running.current = true;
    setOperation(kind); setError(''); setVerified(null);
    setMessage(kind === 'CREATING' ? 'Criando e verificando a cópia dos dados salvos...' : 'Verificando arquivo, recibo e dados do backup...');
    try {
      const result = kind === 'CREATING' ? await createWorkspaceBackup() : await verifyWorkspaceBackup(selected);
      if (!mounted.current) return;
      if (inventory && result.receipt.source_app_identifier !== inventory.source_app_identifier) throw new Error('Application mismatch');
      setVerified(result); setSelected(result.receipt.operation_id);
      setMessage(kind === 'CREATING' ? 'Backup criado e verificado. O espaço editorial em uso foi preservado.' : 'Backup verificado nesta operação. Nenhum dado foi restaurado.');
      if (kind === 'CREATING') {
        try {
          const value = await listWorkspaceBackups();
          if (mounted.current) acceptInventory(value, result.receipt.operation_id);
        } catch {
          if (mounted.current) setError('O backup foi criado e verificado, mas a lista não pôde ser atualizada. Use Atualizar lista.');
        }
      }
    } catch (failure) {
      if (mounted.current) { setMessage(''); setError(workspaceBackupErrorMessage(failure)); }
    } finally { running.current = false; if (mounted.current) setOperation('IDLE'); }
  }

  return <>
    <button type="button" ref={trigger} onClick={show} disabled={!workspaceReady}
      aria-haspopup="dialog" aria-controls={panelId} aria-expanded={open}
      className={`${control} text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900`}>
      {busy ? 'Backup em andamento' : 'Backup do espaço editorial'}
    </button>
    <dialog ref={dialog} id={panelId} aria-labelledby={`${panelId}-title`}
      onClose={() => { setOpen(false); if (!document.querySelector('dialog[open]')) trigger.current?.focus(); }}
      onKeyDown={event => {
        if (event.key !== 'Tab' || event.defaultPrevented) return;
        const controls = [...event.currentTarget.querySelectorAll<HTMLButtonElement | HTMLSelectElement>('button:not([disabled]), select:not([disabled])')]
          .filter(element => element.getClientRects().length > 0);
        const first = controls[0], last = controls[controls.length - 1];
        if (!first || !last) return;
        if (event.shiftKey && (document.activeElement === first || document.activeElement === heading.current)) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }}
      className="m-auto w-[calc(100%_-_2rem)] max-w-2xl max-h-[calc(100dvh_-_2rem)] overflow-y-auto break-words rounded-xl border border-slate-400 bg-white p-4 sm:p-6 text-slate-900 dark:bg-slate-900 dark:text-slate-100 backdrop:bg-slate-950/60">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 ref={heading} tabIndex={-1} id={`${panelId}-title`} className="min-w-0 flex-1 basis-full sm:basis-0 text-lg font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Backup do espaço editorial</h2>
        <button type="button" className={control} onClick={() => dialog.current?.close()} aria-label="Fechar painel de backup">Fechar</button>
      </div>
      <p className="mt-4 text-sm">Preserva pautas salvas, checklists, histórico, etapas, categorias, modelos de checklist, governança e registros de conquistas. Salve os rascunhos antes de criar a cópia.</p>
      <p className="mt-2 text-sm">O backup fica neste computador e não tem criptografia acrescentada pelo aplicativo. Ollama, modelos de IA e textos ainda não salvos ficam fora da cópia. Cópia externa e restauração não estão disponíveis nesta etapa.</p>
      <p className="mt-2 text-sm">Limites desta etapa: banco de até 256 MiB e 128 pastas internas, incluindo tentativas incompletas.</p>
      {!desktop && <p className="mt-4 text-sm">Disponível no aplicativo desktop. O armazenamento do navegador usa outro formato.</p>}
      {inventory && <div className="mt-4 text-sm">
        <p>Aplicação: <strong>{workspaceBackupApplicationName(inventory.source_app_identifier)}</strong></p>
        <p className="mt-1">Pasta interna:</p><p className="break-all font-mono">{inventory.directory}</p>
      </div>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={`${control} bg-blue-700 text-white`} disabled={busy || !desktop || !workspaceReady} onClick={() => void perform('CREATING')}>Criar backup dos dados salvos</button>
        <button type="button" className={control} disabled={busy || !desktop} onClick={() => void refresh()}>Atualizar lista</button>
      </div>
      {inventory && inventory.entries.length > 0 && <div className="mt-5">
        <label htmlFor={`${panelId}-selection`} className="block text-sm font-semibold">Backup interno para verificar</label>
        <select id={`${panelId}-selection`} value={selected} disabled={busy} onChange={event => { setSelected(event.target.value); setMessage('Selecione Verificar backup para conferir esta cópia.'); setError(''); }}
          aria-describedby={`${panelId}-inventory-note`} className="mt-2 w-full min-h-10 rounded-lg border border-slate-400 bg-white p-2 text-sm dark:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
          {inventory.entries.map(entry => <option key={entry.operation_id} value={entry.operation_id}>{entry.operation_id}</option>)}
        </select>
        <p id={`${panelId}-inventory-note`} className="mt-2 text-sm">A lista inclui tentativas incompletas. Encontrar uma pasta não comprova que o backup está íntegro.</p>
        <button type="button" className={`${control} mt-2`} disabled={busy || !selected || !workspaceReady} onClick={() => void perform('VERIFYING')}>Verificar backup selecionado</button>
      </div>}
      <p role="status" aria-atomic="true" className="mt-4 text-sm">{message}</p>
      {error && <p role="alert" className="mt-2 text-sm text-red-800 dark:text-red-200">{error}</p>}
      {busy && <p className="mt-2 text-sm">Você pode fechar este painel. A operação continua; reabra para consultar o resultado.</p>}
      {verified && selected === verified.receipt.operation_id && <div className="mt-4 border-t border-slate-300 pt-3 text-sm">
        <h3 className="font-semibold">Resultado da última verificação</h3>
        <p>Aplicação de origem: {workspaceBackupApplicationName(verified.receipt.source_app_identifier)}</p>
        <p>Criado em: {new Date(verified.receipt.created_at_unix_ms).toLocaleString('pt-BR')}</p>
        <p>Tamanho: {(verified.receipt.database_size / 1024 ** 2).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} MiB; pautas salvas: {verified.receipt.table_counts.articles}.</p>
        <p className="mt-2 break-all font-mono">{verified.directory}</p>
        <p className="mt-2">Este resultado descreve a cópia conferida nesta operação. Verifique novamente antes de usar o arquivo.</p>
      </div>}
    </dialog>
  </>;
}
