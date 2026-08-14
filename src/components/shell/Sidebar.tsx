import React from 'react';
import { ActiveTab } from './navItems';
import { NavList } from './NavList';
import { BudgetStat } from './BudgetStat';
import { AuthBlock } from './AuthBlock';
import { AppUser } from '../../lib/supabase';

interface Props {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  myCredits: number;
  mySlotsNeeded: number;
  leagueName: string;
  onResetData: () => void;
  currentUser: AppUser | null;
  onLogin: () => void;
  onLogout: () => void;
  isCloudSyncing: boolean;
}

export const Sidebar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  myCredits,
  mySlotsNeeded,
  leagueName,
  onResetData,
  currentUser,
  onLogin,
  onLogout,
  isCloudSyncing,
}) => (
  <aside className="hidden md:flex md:flex-col w-64 shrink-0 h-screen sticky top-0 bg-surface border-r border-border-soft">
    <div className="p-5 flex items-center gap-3 border-b border-border-soft">
      <div className="w-9 h-9 rounded-xl bg-accent text-accent-ink flex items-center justify-center font-black text-sm shrink-0">
        WR
      </div>
      <div className="min-w-0">
        <h1 className="font-extrabold text-sm text-ink flex items-center gap-1.5">
          <span>FantaWarRoom</span>
          <span className="bg-accent/10 text-accent border border-accent/30 text-[9px] font-mono px-1.5 py-0.5 rounded">PRO</span>
        </h1>
        <span className="text-xs text-muted block truncate">{leagueName}</span>
      </div>
    </div>

    <div className="flex-1 overflow-y-auto p-3">
      <NavList activeTab={activeTab} onSelect={setActiveTab} />
    </div>

    <div className="p-3 border-t border-border-soft space-y-3">
      <BudgetStat myCredits={myCredits} mySlotsNeeded={mySlotsNeeded} />
      <AuthBlock currentUser={currentUser} onLogin={onLogin} onLogout={onLogout} isCloudSyncing={isCloudSyncing} onResetData={onResetData} />
    </div>
  </aside>
);
