import React from 'react';
import { Card, SectionHeader, Slider } from '../ui';

interface AggressivenessSectionProps {
  aggressionScore: number;
  onChange: (score: number) => void;
}

export const AggressivenessSection: React.FC<AggressivenessSectionProps> = ({ aggressionScore, onChange }) => {
  return (
    <Card className="p-6 space-y-4">
      <SectionHeader
        number="2.2"
        title="Stile Offerte durante l'Asta (Aggressività)"
        action={
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted font-semibold">Valore:</span>
            <input
              type="number"
              min={0}
              max={100}
              value={aggressionScore}
              onChange={(e) => onChange(Math.max(0, Math.min(100, Number(e.target.value))))}
              className="w-16 bg-field border border-border-strong rounded-lg px-2 py-1 text-center font-mono font-bold text-warning focus:border-accent focus:outline-none"
            />
            <span className="font-mono text-xl font-black text-warning">/ 100</span>
          </div>
        }
      />

      <div className="space-y-3">
        <Slider min={0} max={100} value={aggressionScore} onChange={(e) => onChange(Number(e.target.value))} />

        <div className="flex justify-between text-xs text-muted font-medium">
          <span className="text-accent">0 - Massimo Conservativo (Attesa rilanci, affari low-cost)</span>
          <span className="text-warning">50 - Bilanciato</span>
          <span className="text-negative">100 - Massimo Aggressivo (Rilanci pesanti sui Top)</span>
        </div>
      </div>
    </Card>
  );
};
