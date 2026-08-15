import React from 'react';
import { PlayerRole } from '../../types';
import { RoleBadge } from '../ui';

interface Props {
  myCredits: number;
  mySlotsNeeded: number;
  countMyRole?: Record<PlayerRole, number>;
  rosterSlots?: Record<PlayerRole, number>;
}

const ROLES: PlayerRole[] = ['P', 'D', 'C', 'A'];

export const BudgetStat: React.FC<Props> = ({ myCredits, mySlotsNeeded, countMyRole, rosterSlots }) => (
  <div className="space-y-2">
    <div className="grid grid-cols-2 gap-2 bg-surface-2 rounded-xl p-3 text-xs font-mono">
      <div>
        <span className="text-muted block text-[10px] font-sans">Crediti</span>
        <span className="text-warning font-bold">{myCredits} FM</span>
      </div>
      <div>
        <span className="text-muted block text-[10px] font-sans">Slot</span>
        <span className="text-info font-bold">{mySlotsNeeded} liberi</span>
      </div>
    </div>

    {countMyRole && rosterSlots && (
      <div className="grid grid-cols-4 gap-1.5">
        {ROLES.map((role) => (
          <div key={role} className="flex flex-col items-center gap-1 bg-surface-2 rounded-lg py-1.5">
            <RoleBadge role={role} size="sm" />
            <span className="font-mono text-[10px] font-bold text-ink-soft">
              {countMyRole[role]}/{rosterSlots[role]}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);
