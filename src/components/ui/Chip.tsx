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

/** P/D/C/A + TUTTI role filter row, built on Chip. */
export const RoleFilterChips: React.FC<RoleFilterChipsProps> = ({ value, onChange, className = '' }) => (
  <div className={`flex gap-1.5 ${className}`}>
    {ROLES.map((r) => (
      <Chip key={r} active={r === value} onClick={() => onChange(r)}>
        {r === 'ALL' ? 'TUTTI' : r}
      </Chip>
    ))}
  </div>
);
