import React from 'react';
import { LeagueSettings, PlayerRole } from '../../types';
import { MyTeamBudget } from '../../engine/types';

interface Props {
  myTeamName: string;
  league: LeagueSettings;
  myTeamBudget: MyTeamBudget;
  slotsOccupiedByRole: Record<PlayerRole, number>;
}

const ROLES: PlayerRole[] = ['P', 'D', 'C', 'A'];

export const BudgetSidebar: React.FC<Props> = ({ myTeamName, league, myTeamBudget, slotsOccupiedByRole }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
      <div>
        <span className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Squadra</span>
        <h3 className="text-sm font-bold text-white truncate">{myTeamName}</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <span className="text-[11px] uppercase text-slate-500 font-semibold block">Budget Residuo</span>
          <span className="text-2xl font-black text-white tabular-nums">{myTeamBudget.budgetResiduo}</span>
          <span className="text-[11px] text-slate-500"> / {league.totalBudget}</span>
        </div>
        <div>
          <span className="text-[11px] uppercase text-slate-500 font-semibold block">Slot Residui</span>
          <span className="text-2xl font-black text-white tabular-nums">{myTeamBudget.slotResidui}</span>
        </div>
        <div>
          <span className="text-[11px] uppercase text-slate-500 font-semibold block">Credito medio/slot</span>
          <span className="text-2xl font-black text-white tabular-nums">
            {myTeamBudget.creditoMedioPerSlotRimanente !== null ? Math.round(myTeamBudget.creditoMedioPerSlotRimanente) : '—'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs pt-3 border-t border-slate-800">
        {ROLES.map((role) => (
          <div key={role} className="flex items-baseline gap-1">
            <span className="text-slate-500 font-semibold">{role}</span>
            <span className="text-slate-200 font-mono">
              {slotsOccupiedByRole[role]}/{league.rosterSlots[role]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
