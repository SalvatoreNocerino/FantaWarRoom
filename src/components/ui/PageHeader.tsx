import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<Props> = ({ icon: Icon, title, subtitle, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-soft pb-4">
    <div>
      <h1 className="text-xl font-bold flex items-center gap-2 text-accent">
        <Icon className="w-5 h-5" />
        <span>{title}</span>
      </h1>
      {subtitle && <p className="text-muted text-xs sm:text-sm mt-1">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0 self-start sm:self-auto">{action}</div>}
  </div>
);
