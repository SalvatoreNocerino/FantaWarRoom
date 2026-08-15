import React from 'react';
import { PlayerRole } from '../../types';
import { COLORS, FONT_UI, ROLES_WITH_ALL } from './tokens';

interface Props {
  value: PlayerRole | 'ALL';
  onChange: (role: PlayerRole | 'ALL') => void;
}

// Segmented control connesso (non chip separate) — coerente con
// RoleFilterChips in ../ui/Chip.tsx.
export const RoleChips: React.FC<Props> = ({ value, onChange }) => (
  <div style={{ display: 'inline-flex', borderRadius: 8, border: `1px solid ${COLORS.borderInput}`, overflow: 'hidden' }}>
    {ROLES_WITH_ALL.map((r, i) => {
      const active = r === value;
      return (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          style={{
            height: 30,
            padding: '0 10px',
            border: 0,
            borderLeft: i > 0 ? `1px solid ${COLORS.borderInput}` : 'none',
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
