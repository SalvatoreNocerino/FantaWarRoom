import React from 'react';
import { Player, LeagueSettings } from '../../types';
import { PlayerPricing, PressioneLevel, SostenibilitaLevel } from '../../engine/types';
import { Search, X } from 'lucide-react';

interface Props {
  activePlayer: Player | null;
  pricing: PlayerPricing | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: Player[];
  onSelectPlayer: (id: string) => void;
  buyerTeam: string;
  setBuyerTeam: (team: string) => void;
  bidPrice: number;
  setBidPrice: (price: number) => void;
  league: LeagueSettings;
  isOverBudget: boolean;
  onConfirmAssignment: () => void;
}

const pressureTone: Record<PressioneLevel, string> = {
  verde: 'text-emerald-400',
  giallo: 'text-amber-400',
  rosso: 'text-red-400',
  esaurito: 'text-slate-400',
};

const sostenibilitaTone: Record<NonNullable<SostenibilitaLevel>, string> = {
  ok: 'text-emerald-400',
  attenzione: 'text-amber-400',
  rischio: 'text-red-400',
};

const sostenibilitaExplanation: Record<NonNullable<SostenibilitaLevel>, string> = {
  ok: 'Compatibile col ritmo di spesa che ti puoi permettere.',
  attenzione: 'Fattibile, ma ti restringe le prossime chiamate.',
  rischio: 'Rischi di restare senza budget per gli slot che mancano.',
};

function StatBlock({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">{label}</span>
      <span className={`text-3xl sm:text-4xl font-black tabular-nums leading-tight ${tone ?? 'text-white'}`}>{value}</span>
    </div>
  );
}

export const PlayerPricingCard: React.FC<Props> = ({
  activePlayer,
  pricing,
  searchQuery,
  setSearchQuery,
  searchResults,
  onSelectPlayer,
  buyerTeam,
  setBuyerTeam,
  bidPrice,
  setBidPrice,
  league,
  isOverBudget,
  onConfirmAssignment,
}) => {
  const [searchOpen, setSearchOpen] = React.useState(false);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5">
      {/* Ricerca rapida */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
          placeholder="Cerca giocatore chiamato..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-slate-500"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSearchOpen(false);
            }}
            className="absolute right-3 top-3 text-slate-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {searchOpen && searchQuery && searchResults.length > 0 && (
          <div className="absolute z-20 mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
            {searchResults.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onSelectPlayer(p.id);
                  setSearchQuery('');
                  setSearchOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 flex items-center justify-between"
              >
                <span className="truncate">{p.name}</span>
                <span className="text-slate-500 text-xs shrink-0 ml-2">
                  {p.role} · {p.team}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!activePlayer ? (
        <div className="text-center text-slate-500 text-sm py-10">Cerca un giocatore per iniziare.</div>
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-2 border-b border-slate-800 pb-4">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{activePlayer.name}</h2>
              <span className="text-xs text-slate-500">
                {activePlayer.role} · {activePlayer.team}
                {pricing && <> · Rank #{pricing.rankFvmRuolo} {pricing.titolareORiserva === 'Titolare' ? '(Titolare)' : '(Riserva)'}</>}
              </span>
            </div>
            {pricing?.isWhichlist && (
              <span className="shrink-0 text-[11px] font-semibold text-slate-300 border border-slate-700 rounded-full px-2 py-0.5">
                Preferito
              </span>
            )}
          </div>

          {pricing && (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                <StatBlock label="Valore" value={pricing.value} />
                <StatBlock label="Range" value={`${pricing.rangeMin}–${pricing.rangeMax}`} />
                <StatBlock label="Max Bid" value={pricing.maxBidDinamico} tone="text-cyan-400" />
                <StatBlock
                  label="Pressione Ruolo"
                  value={
                    <span className="inline-flex items-baseline gap-1.5">
                      <span>{pricing.pressioneRuolo.countRimasti}</span>
                      <span className="text-sm font-semibold">/{pricing.pressioneRuolo.denominatore}</span>
                    </span>
                  }
                  tone={pressureTone[pricing.pressioneRuolo.level]}
                />
              </div>

              <p className={`text-xs -mt-2 ${pressureTone[pricing.pressioneRuolo.level]}`}>{pricing.pressioneRuolo.label}</p>

              {pricing.sostenibilita.level && (
                <div className="flex items-start gap-2 bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <span className={`text-sm font-bold shrink-0 ${sostenibilitaTone[pricing.sostenibilita.level]}`}>
                    Sostenibilità: {pricing.sostenibilita.label}
                  </span>
                  <span className="text-xs text-slate-400">{sostenibilitaExplanation[pricing.sostenibilita.level]}</span>
                </div>
              )}
            </>
          )}

          {/* Azione: assegna il giocatore chiamato */}
          <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-slate-800">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase text-slate-500 font-semibold">Squadra</label>
              <select
                value={buyerTeam}
                onChange={(e) => setBuyerTeam(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-slate-500"
              >
                {league.participants.map((team) => (
                  <option key={team.name} value={team.name}>
                    {team.name} {team.isMyTeam ? '(io)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase text-slate-500 font-semibold">Prezzo</label>
              <input
                type="number"
                min={1}
                value={bidPrice}
                onChange={(e) => setBidPrice(Math.max(1, Number(e.target.value)))}
                className={`w-24 bg-slate-950 border rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-center focus:outline-none ${
                  isOverBudget ? 'border-red-500 text-red-400' : 'border-slate-800 text-white focus:border-slate-500'
                }`}
              />
            </div>

            <button
              type="button"
              onClick={onConfirmAssignment}
              disabled={!activePlayer || isOverBudget}
              className="ml-auto bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-5 py-2 rounded-lg text-sm transition-colors"
            >
              Assegna
            </button>
          </div>
          {isOverBudget && <p className="text-xs text-red-400">Budget insufficiente per {buyerTeam}.</p>}
        </>
      )}
    </div>
  );
};
