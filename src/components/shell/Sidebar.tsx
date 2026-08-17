import React from 'react';
import { ActiveTab } from './navItems';
import { NavList } from './NavList';
import { BudgetStat } from './BudgetStat';
import { ResetDataButton } from './ResetDataButton';
import { PlayerRole } from '../../types';

interface Props {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  myCredits: number;
  mySlotsNeeded: number;
  countMyRole: Record<PlayerRole, number>;
  rosterSlots: Record<PlayerRole, number>;
  leagueName: string;
  onResetData: () => void;
}

export const Sidebar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  myCredits,
  mySlotsNeeded,
  countMyRole,
  rosterSlots,
  leagueName,
  onResetData,
}) => (
  <aside className="hidden md:flex md:flex-col w-64 shrink-0 h-screen sticky top-0 bg-surface border-r border-border-soft">
    <div className="p-5 flex items-center gap-3 border-b border-border-soft">
      <div className="w-9 h-9 rounded-xl bg-accent text-accent-ink flex items-center justify-center font-black text-sm shrink-0">
        WR
      </div>
      <div className="min-w-0">
        <h1 className="font-extrabold text-sm text-ink flex items-center gap-1.5">
          <span>FantaWarRoom</span>
        </h1>
        <span className="text-xs text-muted block truncate">{leagueName}</span>
      </div>
    </div>

    <div className="flex-1 overflow-y-auto p-3">
      <NavList activeTab={activeTab} onSelect={setActiveTab} />
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
  </aside>
);
