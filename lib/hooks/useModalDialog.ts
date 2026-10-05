'use client';

import { useEffect, useRef } from 'react';

/** Restore focus when a focused cancel control disappears after a terminal event. */
export function restoreAiCancelFocus(dialog: HTMLDialogElement | null, hadFocus = false) {
  if (!dialog || (!hadFocus && !dialog.querySelector('[data-ai-cancel]')?.contains(document.activeElement))) return;
  requestAnimationFrame(() => {
    if (dialog.open) dialog.querySelector<HTMLElement>('[data-ai-retry]')?.focus();
  });
}

/** Use the browser's modal focus containment and keep React in charge of closing. */
export function useModalDialog(isOpen: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);

  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;
    const invoker = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const handleCancel = (event: Event) => {
      event.preventDefault();
      closeRef.current();
    };
    dialog.addEventListener('cancel', handleCancel);
    dialog.showModal();
    dialog.querySelector<HTMLElement>('[data-dialog-initial-focus]')?.focus();
    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      if (dialog.open) dialog.close();
      if (invoker?.isConnected) invoker.focus();
    };
  }, [isOpen]);

  return dialogRef;
}
