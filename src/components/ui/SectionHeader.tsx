import React from 'react';

interface Props {
  /** e.g. "1.1" — the numbered badge before the title. */
  number?: string;
  title: string;
  /** Optional right-aligned slot (action button, status chip, count). */
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<Props> = ({ number, title, action, className = '' }) => (
  <h2 className={`text-base font-bold text-ink flex items-center gap-2.5 border-b border-border-soft pb-3 ${className}`}>
    {number && (
      <span className="w-6 h-6 rounded bg-accent/15 text-accent font-mono text-xs font-bold flex items-center justify-center shrink-0">
        {number}
      </span>
    )}
    <span className="flex-1 min-w-0">{title}</span>
    {action && <span className="shrink-0">{action}</span>}
  </h2>
);
