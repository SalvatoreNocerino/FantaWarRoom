import React from 'react';
import { PlayerRole } from '../../types';
import { RefreshCw } from 'lucide-react';
import { Card, SectionHeader, Badge, Alert } from '../ui';

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
    <Card className="p-6 space-y-5">
      <SectionHeader
        number="2.3"
        title="Target Budget per Ruolo (Totale Allocazione: 100%)"
        action={
          <div className="flex items-center gap-3 font-mono text-xs">
            <Badge tone={isAllocationValid ? 'accent' : 'negative'} variant="outline">
              Totale: {totalAllocationPct}%
            </Badge>

            {!isAllocationValid && (
              <button type="button" onClick={onAutoBalance} className="text-accent hover:underline flex items-center gap-1 normal-case">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Bilancia (9.3-11.6-27.8-51.5)</span>
              </button>
            )}
          </div>
        }
      />

      {!isAllocationValid && <Alert tone="error">Attenzione: La somma delle 4 percentuali deve fare esattamente 100%.</Alert>}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        {(['P', 'D', 'C', 'A'] as PlayerRole[]).map((role) => {
          const pct = budgetAllocationPct[role];
          const creditsTarget = Math.round((totalBudget * pct) / 100);

          return (
            <div key={role} className="bg-surface-2 p-4 rounded-xl border border-border space-y-2">
              <div className="flex justify-between items-center">
                <Badge tone={{ P: 'info', D: 'accent', C: 'warning', A: 'negative' }[role] as 'info' | 'accent' | 'warning' | 'negative'}>
                  {roleLabel[role]}
                </Badge>
                <span className="font-mono font-bold text-warning text-sm">{creditsTarget} FM</span>
              </div>

              <div className="flex items-center gap-2 pt-1 font-mono">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={pct}
                  onChange={(e) => onChangeRole(role, Number(e.target.value))}
                  className="w-full bg-field border border-border-strong rounded px-3 py-1.5 text-ink font-bold text-sm"
                />
                <span className="text-muted">%</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
