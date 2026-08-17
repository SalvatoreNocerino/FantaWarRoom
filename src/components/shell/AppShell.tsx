import React, { useState } from 'react';
import { ActiveTab } from './navItems';
import { Sidebar } from './Sidebar';
import { MobileTopBar } from './MobileTopBar';
import { NavDrawer } from './NavDrawer';
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
  children: React.ReactNode;
}

/** Responsive app chrome: fixed left sidebar on desktop, top bar + off-canvas drawer on mobile. */
export const AppShell: React.FC<Props> = ({ children, ...navProps }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="md:flex md:min-h-screen">
      <Sidebar {...navProps} />
      <div className="flex-1 min-w-0">
        <MobileTopBar leagueName={navProps.leagueName} myCredits={navProps.myCredits} onOpenDrawer={() => setDrawerOpen(true)} />
        <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} {...navProps} />
        {children}
      </div>
    </div>
  );
};
