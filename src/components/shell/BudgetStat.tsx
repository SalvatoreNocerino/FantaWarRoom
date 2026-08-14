import React from 'react';

interface Props {
  myCredits: number;
  mySlotsNeeded: number;
}

export const BudgetStat: React.FC<Props> = ({ myCredits, mySlotsNeeded }) => (
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
);
