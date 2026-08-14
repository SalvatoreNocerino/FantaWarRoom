import React from 'react';
import { ShieldAlert, Users, History, LucideIcon } from 'lucide-react';
import { COLORS } from './tokens';

export type MobileScreen = 'chiamata' | 'rose' | 'history';

const TABS: { id: MobileScreen; label: string; icon: LucideIcon }[] = [
  { id: 'chiamata', label: 'Chiamata', icon: ShieldAlert },
  { id: 'rose', label: 'Rose', icon: Users },
  { id: 'history', label: 'History', icon: History },
];

interface Props {
  active: MobileScreen;
  onChange: (screen: MobileScreen) => void;
}

export const TabBar: React.FC<Props> = ({ active, onChange }) => (
  <div
    style={{
      position: 'sticky',
      bottom: 0,
      zIndex: 10,
      padding: '6px 10px 14px',
      background: COLORS.bgNested,
      borderTop: `1px solid ${COLORS.borderDivider}`,
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 4,
    }}
  >
    {TABS.map((tab) => {
      const Icon = tab.icon;
      const isActive = tab.id === active;
      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          style={{
            height: 50,
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            border: 0,
            cursor: 'pointer',
            color: isActive ? COLORS.accent : COLORS.textMuted,
            background: isActive ? 'rgba(61,220,151,.1)' : 'transparent',
          }}
        >
          <Icon size={18} />
          <span style={{ fontSize: 10, fontWeight: 700 }}>{tab.label}</span>
        </button>
      );
    })}
  </div>
);
