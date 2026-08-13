import React from 'react';
import { PlayerRole } from '../../types';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const roleBg: Record<string, string> = {
  P: 'bg-amber-600',
  D: 'bg-emerald-600',
  C: 'bg-blue-600',
  A: 'bg-red-600',
};

const roleLabel: Record<string, string> = {
  P: 'Portieri (P)',
  D: 'Difensori (D)',
  C: 'Centrocampisti (C)',
  A: 'Attaccanti (A)',
};

interface BudgetAllocationSectionProps {
  budgetAllocationPct: Record<PlayerRole, number>;
  totalBudget: number;
  onChangeRole: (role: PlayerRole, pct: number) => void;
  onAutoBalance: () => void;
}

export const BudgetAllocationSection: React.FC<BudgetAllocationSectionProps> = ({
  budgetAllocationPct,
  totalBudget,
  onChangeRole,
  onAutoBalance,
}) => {
  const totalAllocationPct =
    budgetAllocationPct.P + budgetAllocationPct.D + budgetAllocationPct.C + budgetAllocationPct.A;
  // Tolleranza 0.25: lo split calibrato di default (9.3/11.6/27.8/51.5) somma 100.2.
  const isAllocationValid = Math.abs(totalAllocationPct - 100) < 0.25;

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <span className="w-6 h-6 rounded bg-cyan-950 text-cyan-400 font-mono text-xs font-bold flex items-center justify-center">
            2.3
          </span>
          <span>Target Budget per Ruolo (Totale Allocazione: 100%)</span>
        </h2>

        <div className="flex items-center space-x-3 font-mono text-xs">
          <span
            className={`font-bold px-3 py-1 rounded-lg border ${
              isAllocationValid
                ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                : 'bg-red-950 text-red-400 border-red-500/40'
            }`}
          >
            Totale: {totalAllocationPct}%
          </span>

          {!isAllocationValid && (
            <button
              type="button"
              onClick={onAutoBalance}
              className="text-cyan-400 hover:underline flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Bilancia (9.3-11.6-27.8-51.5)</span>
            </button>
          )}
        </div>
      </div>

      {!isAllocationValid && (
        <div className="bg-red-950/60 border border-red-500 text-red-200 p-3 rounded-xl text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>Attenzione: La somma delle 4 percentuali deve fare esattamente 100%.</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        {(['P', 'D', 'C', 'A'] as PlayerRole[]).map((role) => {
          const pct = budgetAllocationPct[role];
          const creditsTarget = Math.round((totalBudget * pct) / 100);

          return (
            <div key={role} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className={`font-bold px-2 py-0.5 rounded text-white ${roleBg[role]}`}>{roleLabel[role]}</span>
                <span className="font-mono font-bold text-amber-400 text-sm">{creditsTarget} FM</span>
              </div>

              <div className="flex items-center space-x-2 pt-1 font-mono">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={pct}
                  onChange={(e) => onChangeRole(role, Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-white font-bold text-sm"
                />
                <span className="text-slate-400">%</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
