import React from 'react';
import { LeagueSettings } from '../../types';
import { CheckCircle2 } from 'lucide-react';

interface Props {
  formData: LeagueSettings;
  setFormData: React.Dispatch<React.SetStateAction<LeagueSettings>>;
}

export const VALID_FORMATIONS = ['3-4-3', '3-5-2', '4-3-3', '4-4-2', '4-5-1', '5-3-2', '5-4-1', '3-6-1', '6-3-1'];

export const FormationsSection: React.FC<Props> = ({ formData, setFormData }) => {
  const handleToggleFormation = (fmt: string) => {
    setFormData((prev) => {
      const exists = prev.selectableFormations.includes(fmt);
      const updated = exists
        ? prev.selectableFormations.filter((f) => f !== fmt)
        : [...prev.selectableFormations, fmt];
      return { ...prev, selectableFormations: updated };
    });
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
      <h2 className="text-lg font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
        <span className="w-6 h-6 rounded bg-emerald-950 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center">
          1.6
        </span>
        <span>Moduli Tattici Consentiti (Solo Difesa - Centrocampo - Attacco)</span>
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {VALID_FORMATIONS.map((fmt) => {
          const isChecked = formData.selectableFormations.includes(fmt);
          return (
            <button
              key={fmt}
              type="button"
              onClick={() => handleToggleFormation(fmt)}
              className={`py-3 px-4 rounded-xl font-mono font-bold border transition-all flex items-center justify-between ${
                isChecked
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-800'
              }`}
            >
              <span>{fmt}</span>
              {isChecked && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </button>
          );
        })}
      </div>
    </section>
  );
};
