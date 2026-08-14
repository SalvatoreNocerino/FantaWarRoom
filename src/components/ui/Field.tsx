import React from 'react';

interface Props {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

/** Labeled wrapper for a form control — label above, optional hint below. */
export const Field: React.FC<Props> = ({ label, hint, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="block text-muted mb-1 text-xs font-semibold">{label}</span>
    {children}
    {hint && <span className="block text-faint text-[11px] mt-1">{hint}</span>}
  </label>
);
