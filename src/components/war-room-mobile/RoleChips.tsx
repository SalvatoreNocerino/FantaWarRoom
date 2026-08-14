import React from 'react';
import { PlayerRole } from '../../types';
import { COLORS, FONT_UI, ROLES_WITH_ALL } from './tokens';

interface Props {
  value: PlayerRole | 'ALL';
  onChange: (role: PlayerRole | 'ALL') => void;
}

export const RoleChips: React.FC<Props> = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: 6 }}>
    {ROLES_WITH_ALL.map((r) => {
      const active = r === value;
      return (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          style={{
            height: 30,
            padding: '0 10px',
            borderRadius: 8,
            border: `1px solid ${active ? 'rgba(61,220,151,.45)' : COLORS.borderInput}`,
            background: active ? 'rgba(61,220,151,.14)' : 'transparent',
            color: active ? COLORS.accent : COLORS.textMuted,
            font: `700 11px ${FONT_UI}`,
            cursor: 'pointer',
          }}
        >
          {r === 'ALL' ? 'TUTTI' : r}
        </button>
      );
    })}
  </div>
);
