import React from 'react';
import { PlayerRole } from '../../types';

type Tone = 'accent' | 'warning' | 'negative' | 'info' | 'muted' | 'role-p' | 'role-d' | 'role-c' | 'role-a';

// Tailwind's scanner needs literal class strings — never interpolate a
// token name into a class (e.g. `bg-role-${role}` won't be picked up).
const TONE_SOFT: Record<Tone, string> = {
  accent: 'bg-accent/15 text-accent',
  warning: 'bg-warning/15 text-warning',
  negative: 'bg-negative/15 text-negative',
  info: 'bg-info/15 text-info',
  muted: 'bg-border text-muted',
  'role-p': 'bg-role-p/15 text-role-p',
  'role-d': 'bg-role-d/15 text-role-d',
  'role-c': 'bg-role-c/15 text-role-c',
  'role-a': 'bg-role-a/15 text-role-a',
};

const TONE_OUTLINE: Record<Tone, string> = {
  accent: 'border-accent text-accent',
  warning: 'border-warning text-warning',
  negative: 'border-negative text-negative',
  info: 'border-info text-info',
  muted: 'border-border-strong text-muted',
  'role-p': 'border-role-p text-role-p',
  'role-d': 'border-role-d text-role-d',
  'role-c': 'border-role-c text-role-c',
  'role-a': 'border-role-a text-role-a',
};

// Colori-ruolo dedicati (vedi --color-role-* in index.css) — non più
// aliasati ai toni di stato: un ruolo non deve leggersi come un errore o un
// successo.
const ROLE_TONE: Record<PlayerRole, Tone> = { P: 'role-p', D: 'role-d', C: 'role-c', A: 'role-a' };

interface BadgeProps {
  tone?: Tone;
  variant?: 'soft' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ tone = 'muted', variant = 'soft', size = 'md', className = '', children }) => {
  const toneClass = variant === 'outline' ? TONE_OUTLINE[tone] : TONE_SOFT[tone];
  const sizeClass = size === 'sm' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-xs';
  const border = variant === 'outline' ? 'border' : '';
  return (
    <span
      className={`inline-flex items-center justify-center rounded font-mono font-bold uppercase tracking-wide ${toneClass} ${border} ${sizeClass} ${className}`}
    >
      {children}
    </span>
  );
};

interface RoleBadgeProps {
  role: PlayerRole;
  size?: 'sm' | 'md' | 'lg';
  dimmed?: boolean;
}

const ROLE_SQUARE_SIZE: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-5 h-5 text-[10px] rounded',
  md: 'w-9 h-9 text-sm rounded-lg',
  lg: 'w-11 h-11 text-base rounded-xl',
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md', dimmed = false }) => (
  <span
    className={`inline-flex items-center justify-center font-mono font-bold shrink-0 ${ROLE_SQUARE_SIZE[size]} ${TONE_SOFT[ROLE_TONE[role]]} ${dimmed ? 'opacity-50' : ''}`}
  >
    {role}
  </span>
);
