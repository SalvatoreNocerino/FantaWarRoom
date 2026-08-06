import React from 'react';
import { LeagueSettings, CallOrderRule } from '../../types';

interface Props {
  formData: LeagueSettings;
  setFormData: React.Dispatch<React.SetStateAction<LeagueSettings>>;
}

const CALL_ORDER_OPTIONS: { value: CallOrderRule; title: string; titleColor: string; description: string }[] = [
  {
    value: 'free',
    title: 'A Chiamata Libera',
    titleColor: 'text-emerald-400',
    description: 'I fantallenatori chiamano a turno qualsiasi giocatore libero di qualsiasi ruolo.'
  },
  {
    value: 'alphabetical',
    title: 'Ordine Alfabetico',
    titleColor: 'text-cyan-400',
    description: 'Asta sequenziale ordinata per cognome. Scegli la lettera di partenza sotto!'
  },
  {
    value: 'valuation',
    title: 'Ruolo & Quotazione',
    titleColor: 'text-amber-400',
    description: 'Si parte dai portieri per quotazione decrescente fino agli attaccanti.'
  },
  {
    value: 'sealed_bid',
    title: 'Busta Chiusa',
    titleColor: 'text-purple-400',
    description: 'Offerte segrete simultanee per i giocatori in asta.'
  }
];

export const AuctionRulesSection: React.FC<Props> = ({ formData, setFormData }) => {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
      <h2 className="text-lg font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
        <span className="w-6 h-6 rounded bg-emerald-950 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center">
          1.5
        </span>
        <span>Regole Asta & Chiamata Giocatori</span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {CALL_ORDER_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              formData.auctionRules.callOrderRule === opt.value
                ? 'bg-emerald-950/40 border-emerald-500 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <input
              type="radio"
              name="callOrderRule"
              value={opt.value}
              checked={formData.auctionRules.callOrderRule === opt.value}
              onChange={() =>
                setFormData({ ...formData, auctionRules: { ...formData.auctionRules, callOrderRule: opt.value } })
              }
              className="sr-only"
            />
            <strong className={`block text-sm ${opt.titleColor} mb-1`}>{opt.title}</strong>
            {opt.description}
          </label>
        ))}
      </div>

      {formData.auctionRules.callOrderRule === 'alphabetical' && (
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center space-x-3 text-xs w-fit">
          <span className="text-slate-300 font-semibold">Lettera di Partenza:</span>
          <input
            type="text"
            maxLength={1}
            value={formData.auctionRules.alphabetStartLetter || 'A'}
            onChange={(e) =>
              setFormData({
                ...formData,
                auctionRules: { ...formData.auctionRules, alphabetStartLetter: e.target.value.toUpperCase() }
              })
            }
            className="w-10 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-bold text-amber-400 uppercase font-mono"
          />
        </div>
      )}
    </section>
  );
};
