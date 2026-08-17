import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { ActiveTab } from './navItems';
import { NavList } from './NavList';
import { BudgetStat } from './BudgetStat';
import { ResetDataButton } from './ResetDataButton';
import { PlayerRole } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  myCredits: number;
  mySlotsNeeded: number;
  countMyRole: Record<PlayerRole, number>;
  rosterSlots: Record<PlayerRole, number>;
  leagueName: string;
  onResetData: () => void;
}

export const NavDrawer: React.FC<Props> = ({
  open,
  onClose,
  activeTab,
  setActiveTab,
  myCredits,
  mySlotsNeeded,
  countMyRole,
  rosterSlots,
  leagueName,
  onResetData,
}) => {
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
    <div className="md:hidden fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-page/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-72 max-w-[80vw] h-full bg-surface border-r border-border-soft flex flex-col">
        <div className="p-4 flex items-center gap-3 border-b border-border-soft">
          <div className="w-8 h-8 rounded-lg bg-accent text-accent-ink flex items-center justify-center font-black text-xs shrink-0">
            WR
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-extrabold text-sm text-ink">FantaWarRoom</h1>
            <span className="text-xs text-muted block truncate">{leagueName}</span>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-muted hover:text-ink" aria-label="Chiudi menu">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <NavList
            activeTab={activeTab}
            onSelect={(tab) => {
              setActiveTab(tab);
              onClose();
            }}
          />
        </div>

        <div className="p-3 border-t border-border-soft space-y-3">
          <BudgetStat myCredits={myCredits} mySlotsNeeded={mySlotsNeeded} countMyRole={countMyRole} rosterSlots={rosterSlots} />
          <ResetDataButton onResetData={onResetData} />
          <div className="flex items-center justify-center gap-3 text-[10px] text-faint pt-1">
            <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:text-muted">
              Privacy
            </a>
            <span>&middot;</span>
            <a href="/termini.html" target="_blank" rel="noopener noreferrer" className="hover:text-muted">
              Termini
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
