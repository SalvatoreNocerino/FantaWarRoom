import React from 'react';
import { LucideIcon, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

type Tone = 'success' | 'warning' | 'error' | 'info';

const TONE_CLASS: Record<Tone, string> = {
  success: 'bg-accent/10 border-accent/40 text-accent',
  warning: 'bg-warning/10 border-warning/40 text-warning',
  error: 'bg-negative/10 border-negative/40 text-negative',
  info: 'bg-info/10 border-info/40 text-info',
};

const TONE_ICON: Record<Tone, LucideIcon> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertTriangle,
  info: Info,
};

interface Props {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}

export const Alert: React.FC<Props> = ({ tone = 'info', className = '', children }) => {
  const Icon = TONE_ICON[tone];
  return (
    <div className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-xs font-semibold ${TONE_CLASS[tone]} ${className}`}>
      <Icon className="w-4 h-4 shrink-0" />
      <span className="text-ink-soft">{children}</span>
    </div>
  );
};
