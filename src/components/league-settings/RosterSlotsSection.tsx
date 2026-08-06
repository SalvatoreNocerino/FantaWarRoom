import React from 'react';
import { LeagueSettings } from '../../types';

interface Props {
  formData: LeagueSettings;
  setFormData: React.Dispatch<React.SetStateAction<LeagueSettings>>;
}

const ROLE_FIELDS: { key: 'P' | 'D' | 'C' | 'A'; label: string; borderClass: string; textClass: string }[] = [
  { key: 'P', label: 'Portieri (P)', borderClass: 'border-amber-500/30', textClass: 'text-amber-400' },
  { key: 'D', label: 'Difensori (D)', borderClass: 'border-emerald-500/30', textClass: 'text-emerald-400' },
  { key: 'C', label: 'Centrocampisti (C)', borderClass: 'border-blue-500/30', textClass: 'text-blue-400' },
  { key: 'A', label: 'Attaccanti (A)', borderClass: 'border-red-500/30', textClass: 'text-red-400' }
];

export const RosterSlotsSection: React.FC<Props> = ({ formData, setFormData }) => {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
      <h2 className="text-lg font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
        <span className="w-6 h-6 rounded bg-emerald-950 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center">
          1.2
        </span>
        <span>Giocatori Per Squadra (Slot per Ruolo)</span>
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        {ROLE_FIELDS.map(({ key, label, borderClass, textClass }) => (
          <div key={key} className={`bg-slate-950 p-3 rounded-xl border ${borderClass}`}>
            <span className={`${textClass} font-bold block mb-1`}>{label}</span>
            <input
              type="number"
              min={1}
              value={formData.rosterSlots[key]}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  rosterSlots: { ...formData.rosterSlots, [key]: Number(e.target.value) }
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-white font-mono font-bold text-sm"
            />
          </div>
        ))}
      </div>
    </section>
  );
};
