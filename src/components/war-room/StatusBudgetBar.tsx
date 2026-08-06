import React from 'react';
import { LeagueSettings } from '../../types';
import { TeamSummary } from '../../utils/fantaEngine';

export interface BudgetStatus {
  color: 'green' | 'orange' | 'red';
  text: string;
  badgeBg: string;
  cardBorder: string;
  textColor: string;
}

interface Props {
  myTeamName: string;
  league: LeagueSettings;
  myTeamSummary?: TeamSummary;
  budgetStatus: BudgetStatus;
}

export const StatusBudgetBar: React.FC<Props> = ({ myTeamName, league, myTeamSummary, budgetStatus }) => {
  return (
    <div className={`bg-slate-900 border-2 ${budgetStatus.cardBorder} rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden transition-all`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center space-x-2">
            <span className={`text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full uppercase font-mono ${budgetStatus.badgeBg}`}>
              ⚡ WAR ROOM LIVE CONSOLE
            </span>
            <span className="text-slate-400 text-xs font-semibold">Asta Fantacalcio</span>
          </div>

          <div className="flex items-center space-x-3 mt-1.5">
            <h1 className="text-xl sm:text-2xl font-black text-white truncate">{myTeamName}</h1>

            <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs font-bold font-mono">
              <span
                className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                  budgetStatus.color === 'green'
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                    : budgetStatus.color === 'orange'
                    ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                    : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                }`}
              ></span>
              <span className={budgetStatus.textColor}>{budgetStatus.text}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="bg-slate-950/90 border border-slate-800 p-2.5 rounded-xl">
            <span className="text-slate-400 text-[10px] block uppercase font-sans">Budget Residuo</span>
            <strong className="text-amber-400 text-sm font-black">
              {myTeamSummary?.remainingCredits ?? 0} / {league.totalBudget} FM
            </strong>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 p-2.5 rounded-xl">
            <span className="text-slate-400 text-[10px] block uppercase font-sans">Slot Rimanenti</span>
            <strong className="text-emerald-400 text-sm font-black">{myTeamSummary?.totalSlotsNeeded ?? 0} Giocatori</strong>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 p-2.5 rounded-xl">
            <span className="text-slate-400 text-[10px] block uppercase font-sans">Offerta Max Consentita</span>
            <strong className="text-cyan-400 text-sm font-black">{myTeamSummary?.maxPossibleBid ?? 0} FM</strong>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 p-2.5 rounded-xl col-span-2 sm:col-span-1">
            <span className="text-slate-400 text-[10px] block uppercase font-sans">Ruoli (P-D-C-A)</span>
            <div className="flex items-center space-x-1 text-[11px] font-bold mt-0.5">
              <span className="text-amber-400">P:{myTeamSummary?.slotsByRole?.P ?? 0}/{league.rosterSlots?.P ?? 3}</span>
              <span className="text-emerald-400">D:{myTeamSummary?.slotsByRole?.D ?? 0}/{league.rosterSlots?.D ?? 8}</span>
              <span className="text-blue-400">C:{myTeamSummary?.slotsByRole?.C ?? 0}/{league.rosterSlots?.C ?? 8}</span>
              <span className="text-red-400">A:{myTeamSummary?.slotsByRole?.A ?? 0}/{league.rosterSlots?.A ?? 6}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
