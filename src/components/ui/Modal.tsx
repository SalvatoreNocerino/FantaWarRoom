import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  maxWidth?: string;
  children: React.ReactNode;
}

/** Centered overlay modal — closes on backdrop click or Escape, always shows an X. */
export const Modal: React.FC<Props> = ({ open, onClose, title, maxWidth = 'max-w-lg', children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-page/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`bg-surface border border-border rounded-2xl p-6 w-full ${maxWidth} max-h-[90vh] overflow-y-auto space-y-4 relative`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="text-lg font-bold text-ink pr-8">{title}</h2>}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 bg-surface-2 border border-border rounded-lg text-muted hover:text-ink"
        >
          <X className="w-4 h-4" />
        </button>
        {children}
      </div>
    </div>
  );
};
