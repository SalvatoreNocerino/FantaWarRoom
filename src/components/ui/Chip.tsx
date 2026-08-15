import React from 'react';
import { PlayerRole } from '../../types';

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

/** Generic toggle/filter chip — segmented-control style button. */
export const Chip: React.FC<ChipProps> = ({ active = false, className = '', children, ...rest }) => (
  <button
    type="button"
    className={`h-[30px] px-2.5 rounded-lg border text-xs font-bold transition-colors ${
      active ? 'bg-accent/15 border-accent text-accent' : 'bg-transparent border-border-strong text-muted hover:text-ink-soft'
    } ${className}`}
    {...rest}
  >
    {children}
  </button>
);

const ROLES: (PlayerRole | 'ALL')[] = ['ALL', 'P', 'D', 'C', 'A'];

interface RoleFilterChipsProps {
  value: PlayerRole | 'ALL';
  onChange: (role: PlayerRole | 'ALL') => void;
  className?: string;
}

/** P/D/C/A + TUTTI role filter, come segmented control connesso (non chip separate). */
export const RoleFilterChips: React.FC<RoleFilterChipsProps> = ({ value, onChange, className = '' }) => (
  <div className={`inline-flex rounded-lg border border-border-strong overflow-hidden ${className}`}>
    {ROLES.map((r, i) => (
      <button
        key={r}
        type="button"
        onClick={() => onChange(r)}
        className={`flex-1 h-[30px] px-2.5 flex items-center justify-center text-xs font-bold transition-colors ${
          i > 0 ? 'border-l border-border-strong' : ''
        } ${r === value ? 'bg-accent/15 text-accent' : 'bg-transparent text-muted hover:text-ink-soft hover:bg-surface-2'}`}
      >
        {r === 'ALL' ? 'TUTTI' : r}
      </button>
    ))}
  </div>
);
