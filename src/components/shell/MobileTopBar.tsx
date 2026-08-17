import React from 'react';
import { Menu } from 'lucide-react';

interface Props {
  leagueName: string;
  myCredits: number;
  onOpenDrawer: () => void;
}

export const MobileTopBar: React.FC<Props> = ({ leagueName, myCredits, onOpenDrawer }) => (
  <header className="md:hidden sticky top-0 z-30 bg-surface border-b border-border-soft px-4 py-3 flex items-center gap-3">
    <button type="button" onClick={onOpenDrawer} className="p-1.5 -ml-1.5 text-ink" aria-label="Apri menu">
      <Menu className="w-5 h-5" />
    </button>
    <img src="/icon.png" alt="FantaWarRoom" className="w-7 h-7 rounded-lg shrink-0 object-cover" />
    <div className="min-w-0 flex-1">
      <div className="text-xs font-bold text-ink truncate">{leagueName}</div>
    </div>
    <div className="text-right shrink-0">
      <div className="text-[9px] text-muted font-bold tracking-wide">RESIDUI</div>
      <div className="font-mono text-sm font-bold text-warning leading-none">{myCredits}</div>
    </div>
  </header>
);
