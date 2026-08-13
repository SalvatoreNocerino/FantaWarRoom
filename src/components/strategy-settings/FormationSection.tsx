import React from 'react';

interface FormationSectionProps {
  preferredFormation: string;
  selectableFormations: string[];
  onChange: (formation: string) => void;
}

export const FormationSection: React.FC<FormationSectionProps> = ({
  preferredFormation,
  selectableFormations,
  onChange,
}) => {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
      <h2 className="text-lg font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
        <span className="w-6 h-6 rounded bg-cyan-950 text-cyan-400 font-mono text-xs font-bold flex items-center justify-center">
          2.1
        </span>
        <span>Modulo di Riferimento Tattico</span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block text-slate-400 mb-1.5 font-semibold">Seleziona Modulo Principale</label>
          <select
            value={preferredFormation}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono font-bold text-sm focus:border-cyan-500 focus:outline-none"
          >
            {selectableFormations.map((fmt) => (
              <option key={fmt} value={fmt}>
                {fmt}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 text-xs flex items-center">
          <p>
            Il motore di pricing della Console Live userà il modulo {preferredFormation} per calcolare quanti
            titolari per ruolo servono in lega (es. più difensori titolari con un 3-5-2, più attaccanti con un 4-3-3).
          </p>
        </div>
      </div>
    </section>
  );
};
