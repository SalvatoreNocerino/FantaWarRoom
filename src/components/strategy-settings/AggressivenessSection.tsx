import React from 'react';

interface AggressivenessSectionProps {
  aggressionScore: number;
  onChange: (score: number) => void;
}

export const AggressivenessSection: React.FC<AggressivenessSectionProps> = ({ aggressionScore, onChange }) => {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <span className="w-6 h-6 rounded bg-cyan-950 text-cyan-400 font-mono text-xs font-bold flex items-center justify-center">
            2.2
          </span>
          <span>Stile Offerte durante l'Asta (Aggressività)</span>
        </h2>
        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-400 font-semibold">Valore:</span>
          <input
            type="number"
            min={0}
            max={100}
            value={aggressionScore}
            onChange={(e) => onChange(Math.max(0, Math.min(100, Number(e.target.value))))}
            className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-amber-400 focus:border-cyan-500 focus:outline-none"
          />
          <span className="font-mono text-xl font-black text-amber-400">/ 100</span>
        </div>
      </div>

      <div className="space-y-3">
        <input
          type="range"
          min={0}
          max={100}
          value={aggressionScore}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-cyan-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
        />

        <div className="flex justify-between text-xs text-slate-400 font-medium">
          <span className="text-emerald-400">0 - Massimo Conservativo (Attesa rilanci, affari low-cost)</span>
          <span className="text-amber-400">50 - Bilanciato</span>
          <span className="text-red-400">100 - Massimo Aggressivo (Rilanci pesanti sui Top)</span>
        </div>
      </div>
    </section>
  );
};
