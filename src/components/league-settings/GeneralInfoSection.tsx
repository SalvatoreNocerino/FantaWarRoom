import React from 'react';
import { LeagueSettings } from '../../types';

interface Props {
  formData: LeagueSettings;
  setFormData: React.Dispatch<React.SetStateAction<LeagueSettings>>;
}

export const GeneralInfoSection: React.FC<Props> = ({ formData, setFormData }) => {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
      <h2 className="text-lg font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
        <span className="w-6 h-6 rounded bg-emerald-950 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center">
          1.1
        </span>
        <span>Informazioni Generali Lega</span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="block text-slate-400 mb-1 font-semibold">1.1.1 Nome della Lega</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold focus:border-emerald-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-semibold">1.1.2 Numero Partecipanti</label>
          <input
            type="number"
            min={4}
            max={20}
            value={formData.participants.length}
            onChange={(e) => setFormData({ ...formData, numTeams: Number(e.target.value) })}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-semibold">1.1.3 Budget Iniziale di Base (FM)</label>
          <input
            type="number"
            value={formData.totalBudget}
            onChange={(e) => setFormData({ ...formData, totalBudget: Number(e.target.value) })}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-amber-400 font-mono font-bold focus:border-emerald-500 focus:outline-none"
            required
          />
        </div>
      </div>

      <div className="flex items-center space-x-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
        <input
          type="checkbox"
          id="equalCreditsFlag"
          checked={formData.equalInitialCredits}
          onChange={(e) => setFormData({ ...formData, equalInitialCredits: e.target.checked })}
          className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
        />
        <label htmlFor="equalCreditsFlag" className="text-slate-300 font-medium cursor-pointer">
          <strong className="text-white">1.1.4 Tutte le squadre partono con gli stessi crediti</strong>
          <span className="block text-slate-400 text-[11px] mt-0.5">
            Disattiva per personalizzare il budget iniziale per ogni fantallenatore (es. penalizzazioni o riconferme).
          </span>
        </label>
      </div>
    </section>
  );
};
