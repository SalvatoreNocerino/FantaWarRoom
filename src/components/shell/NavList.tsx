import React from 'react';
import { NAV_ITEMS, ActiveTab } from './navItems';

interface Props {
  activeTab: ActiveTab;
  onSelect: (tab: ActiveTab) => void;
  className?: string;
}

/** Shared nav-item list rendered by both Sidebar (desktop) and NavDrawer (mobile). */
export const NavList: React.FC<Props> = ({ activeTab, onSelect, className = '' }) => (
  <nav className={`space-y-1 ${className}`}>
    {NAV_ITEMS.map((item) => {
      const Icon = item.icon;
      const active = activeTab === item.id;
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            active ? 'bg-accent text-accent-ink' : 'text-muted hover:text-ink hover:bg-surface-2'
          }`}
        >
          <Icon className="w-4 h-4 shrink-0" />
          <span>{item.label}</span>
        </button>
      );
    })}
  </nav>
);
