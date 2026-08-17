import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { ConfirmDialog } from '../ui';

interface Props {
  onResetData: () => void;
  /** compact = inline icon for the mobile top bar; full = labelled block for sidebar/drawer. */
  compact?: boolean;
}

export const ResetDataButton: React.FC<Props> = ({ onResetData, compact = false }) => {
  const [confirming, setConfirming] = useState(false);

  const confirmDialog = (
    <ConfirmDialog
      open={confirming}
      title="Azzerare tutti i dati?"
      message="Questo cancellerà l'asta in corso, i partecipanti e tutte le impostazioni salvate. L'azione non è reversibile."
      confirmLabel="Azzera dati"
      tone="destructive"
      onConfirm={() => {
        setConfirming(false);
        onResetData();
      }}
      onCancel={() => setConfirming(false)}
    />
  );

  if (compact) {
    return (
      <>
        <button type="button" onClick={() => setConfirming(true)} className="text-muted hover:text-negative p-1.5" title="Reset dati">
          <RotateCcw className="w-4 h-4" />
        </button>
        {confirmDialog}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-faint hover:text-negative flex items-center justify-center gap-1.5 py-1 text-xs w-full"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Reset dati</span>
      </button>
      {confirmDialog}
    </>
  );
};
