import React from 'react';

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'title'> {
  title: React.ReactNode;
  description?: string;
}

/** Selectable card wrapping a visually-hidden radio input. */
export const RadioCard: React.FC<Props> = ({ title, description, checked, className = '', ...rest }) => (
  <label
    className={`block p-4 rounded-xl border cursor-pointer transition-colors ${
      checked ? 'bg-accent/10 border-accent text-ink' : 'bg-surface-2 border-border text-muted hover:border-border-strong'
    } ${className}`}
  >
    <input type="radio" className="sr-only" checked={checked} {...rest} />
    <span className={`block font-bold text-sm ${checked ? 'text-ink' : 'text-ink-soft'}`}>{title}</span>
    {description && <span className="block text-[11px] mt-1 text-muted">{description}</span>}
  </label>
);
