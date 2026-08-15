import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface Props {
  open: boolean;
  title?: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
}

// Sostituisce window.confirm() per le azioni distruttive/irreversibili
// (reset dati, sostituzione listone, cancellazione) — un dialog nativo del
// browser rompe il dark theme dell'app.
export const ConfirmDialog: React.FC<Props> = ({
  open,
  title = 'Conferma',
  message,
  confirmLabel = 'Conferma',
  cancelLabel = 'Annulla',
  tone = 'default',
  onConfirm,
  onCancel,
}) => (
  <Modal open={open} onClose={onCancel} title={title} maxWidth="max-w-sm">
    <p className="text-sm text-ink-soft leading-relaxed">{message}</p>
    <div className="flex justify-end gap-2 pt-2">
      <Button variant="ghost" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button variant={tone === 'destructive' ? 'danger' : 'primary'} onClick={onConfirm}>
        {confirmLabel}
      </Button>
    </div>
  </Modal>
);
