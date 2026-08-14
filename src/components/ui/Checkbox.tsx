import React from 'react';

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'title'> {
  title: React.ReactNode;
  description?: string;
}

/** Checkbox + bold title + optional muted description, wrapped in a nested panel. */
export const Checkbox: React.FC<Props> = ({ title, description, id, className = '', ...rest }) => (
  <div className={`flex items-center gap-3 bg-surface-2 p-3.5 rounded-xl border border-border text-xs ${className}`}>
    <input
      type="checkbox"
      id={id}
      className="w-4 h-4 accent-accent rounded cursor-pointer shrink-0"
      {...rest}
    />
    <label htmlFor={id} className="text-ink-soft font-medium cursor-pointer">
      <strong className="text-ink">{title}</strong>
      {description && <span className="block text-muted text-[11px] mt-0.5">{description}</span>}
    </label>
  </div>
);
