import React from 'react';

interface Props {
  label: string;
  value: React.ReactNode;
  tone?: 'default' | 'accent' | 'warning' | 'negative';
  className?: string;
}

const TONE_CLASS: Record<NonNullable<Props['tone']>, string> = {
  default: 'text-ink',
  accent: 'text-accent',
  warning: 'text-warning',
  negative: 'text-negative',
};

/** Uppercase muted label + large mono value — used for VALORE/RANGE/RESIDUI-style tiles. */
export const StatTile: React.FC<Props> = ({ label, value, tone = 'default', className = '' }) => (
  <div className={`bg-surface-2 border border-border-soft rounded-[11px] p-2.5 ${className}`}>
    <div className="text-[9.5px] tracking-wide uppercase text-muted font-bold">{label}</div>
    <div className={`font-mono font-bold text-lg mt-0.5 ${TONE_CLASS[tone]}`}>{value}</div>
  </div>
);
