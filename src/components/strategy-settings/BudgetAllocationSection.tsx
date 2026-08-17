import React, { useState, useEffect } from 'react';
import { PlayerRole } from '../../types';
import { RefreshCw } from 'lucide-react';
import { Card, SectionHeader, Badge, Alert } from '../ui';

const roleLabel: Record<string, string> = {
  P: 'Portieri (P)',
  D: 'Difensori (D)',
  C: 'Centrocampisti (C)',
  A: 'Attaccanti (A)',
};

// Sotto-componente solo per poter tenere una draft di testo locale per riga
// (le regole degli hook vietano un useState dentro il .map() del genitore).
// Testuale + strip di tutto ciò che non è cifra: un <input type="number">
// controllato lascerebbe comunque digitare "." (e con esso stati intermedi
// tipo "8."); qui il punto non entra proprio nel valore. La draft evita che
// cancellare la cifra faccia scattare subito lo 0 (vedi useNumberDraft).
const PctInput: React.FC<{ pct: number; onChange: (pct: number) => void }> = ({ pct, onChange }) => {
  const [draft, setDraft] = useState(String(pct));

  useEffect(() => setDraft(String(pct)), [pct]);

  return (
    <input
      type="text"
      inputMode="numeric"
      value={draft}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '');
        setDraft(digits);
        if (digits !== '') onChange(Math.min(100, parseInt(digits, 10)));
      }}
      onBlur={() => setDraft(String(pct))}
      className="w-full bg-field border border-border-strong rounded px-3 py-1.5 text-ink font-bold text-sm"
    />
  );
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
  const isAllocationValid = Math.abs(totalAllocationPct - 100) < 0.25;

  return (
    <Card className="p-6 space-y-5">
      <SectionHeader
        title="Target Budget per Ruolo (Totale Allocazione: 100%)"
        action={
          <div className="flex items-center gap-3 font-mono text-xs">
            <Badge tone={isAllocationValid ? 'accent' : 'negative'} variant="outline">
              Totale: {totalAllocationPct}%
            </Badge>

            {!isAllocationValid && (
              <button type="button" onClick={onAutoBalance} className="text-accent hover:underline flex items-center gap-1 normal-case">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Bilancia (8-17-25-50)</span>
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
                <PctInput pct={pct} onChange={(n) => onChangeRole(role, n)} />
                <span className="text-muted">%</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
