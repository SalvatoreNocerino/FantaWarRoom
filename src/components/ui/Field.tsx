import React from 'react';

interface Props {
  label: string;
  /** e.g. "1.1.1" — stesso chip accent di SectionHeader, in scala ridotta per stare inline. */
  number?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

/** Labeled wrapper for a form control — label above, optional hint below. */
export const Field: React.FC<Props> = ({ label, number, hint, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="flex items-center gap-1.5 text-muted mb-1 text-xs font-semibold">
      {number && (
        <span className="rounded bg-accent/15 text-accent font-mono text-[10px] font-bold px-1 shrink-0">{number}</span>
      )}
      {label}
    </span>
    {children}
    {hint && <span className="block text-faint text-[11px] mt-1">{hint}</span>}
  </label>
);
