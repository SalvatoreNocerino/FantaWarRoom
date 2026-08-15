import React from 'react';
import { PlayerRole } from '../../types';

interface Props {
  name: string;
  role: PlayerRole;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<Props['size']>, string> = {
  sm: 'w-6 h-6 text-[9px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
};

// Stesse coppie bg/ring dei toni role-* di Badge.tsx — vedi commento su
// --color-role-* in index.css: colori dedicati, non aliasati agli stati.
const ROLE_CLASS: Record<PlayerRole, string> = {
  P: 'bg-role-p/15 text-role-p ring-role-p/40',
  D: 'bg-role-d/15 text-role-d ring-role-d/40',
  C: 'bg-role-c/15 text-role-c ring-role-c/40',
  A: 'bg-role-a/15 text-role-a ring-role-a/40',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// Avatar tondo con iniziali colorate per ruolo — non abbiamo foto reali dei
// giocatori nel listone, quindi sostituisce il pattern "avatar tondo" visto
// nei competitor con qualcosa di onesto rispetto ai dati che abbiamo.
export const PlayerAvatar: React.FC<Props> = ({ name, role, size = 'md', className = '' }) => (
  <span
    className={`inline-flex items-center justify-center rounded-full font-mono font-bold shrink-0 ring-2 ${SIZE_CLASS[size]} ${ROLE_CLASS[role]} ${className}`}
  >
    {getInitials(name)}
  </span>
);
