import React from 'react';
import { Player, LeagueSettings, StrategySettings } from '../../types';
import { calculateDynamicFairValueBracket, TeamSummary } from '../../utils/fantaEngine';
import { DollarSign, RefreshCw, Minus, Plus, AlertTriangle, Undo2, CheckCircle } from 'lucide-react';

interface Props {
  activePlayer: Player | null;
  league: LeagueSettings;
  strategy: StrategySettings;
  buyerTeam: string;
  setBuyerTeam: (team: string) => void;
  bidPrice: number;
  setBidPrice: (price: number) => void;
  handleAddBid: (amount: number) => void;
  isOverBudget: boolean;
  buyerTeamSummary?: TeamSummary;
  auctionHistoryLength: number;
  handleUndo: () => void;
  handleConfirmAssignment: () => void;
}

export const ActivePlayerBiddingPanel: React.FC<Props> = ({
  activePlayer,
  league,
  strategy,
  buyerTeam,
  setBuyerTeam,
  bidPrice,
  setBidPrice,
  handleAddBid,
  isOverBudget,
  buyerTeamSummary,
  auctionHistoryLength,
  handleUndo,
  handleConfirmAssignment
}) => {
  if (!activePlayer) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
        Tutti i calciatori del listone sono stati aggiudicati!
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 relative">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-black text-white text-xs ${
                activePlayer.role === 'P'
                  ? 'bg-amber-600'
                  : activePlayer.role === 'D'
                  ? 'bg-emerald-600'
                  : activePlayer.role === 'C'
                  ? 'bg-blue-600'
                  : 'bg-red-600'
              }`}
            >
              {activePlayer.role}
            </span>

            <span className="text-xs font-bold bg-slate-800 text-slate-200 px-2.5 py-1 rounded-md">{activePlayer.team}</span>

            <span className="text-xs font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-500/30 font-mono">
              Stima Fair Value: {calculateDynamicFairValueBracket(activePlayer, league.totalBudget)}
            </span>

            {strategy.wishlistIds.includes(activePlayer.id) && (
              <span className="text-xs bg-red-950 text-red-300 border border-red-500/40 px-2 py-0.5 rounded font-bold">
                ❤️ In Wishlist
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{activePlayer.name}</h2>
        </div>

        <div className="text-right font-mono">
          <span className="text-xs text-slate-400 block font-sans">Quotazione Base</span>
          <span className="text-2xl font-black text-amber-400">{activePlayer.basePrice} FM</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[10px]">FM Prevista</span>
          <strong className="text-emerald-400 text-sm font-mono font-bold">{activePlayer.expectedFantaAvg}</strong>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[10px]">Bonus Previsti</span>
          <strong className="text-cyan-400 text-sm font-mono font-bold">{activePlayer.expectedGoalsAssists}</strong>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[10px]">Tier Asta</span>
          <strong className="text-amber-400 text-sm font-mono font-bold">
            {activePlayer.tier === 1 ? '⭐ TOP (Tier 1)' : `Tier ${activePlayer.tier}`}
          </strong>
        </div>
      </div>

      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Controllo Offerta Live (Tastiera Numerica Rapid)</span>
          </h3>

          <button
            onClick={() => setBidPrice(Math.max(1, activePlayer.basePrice))}
            className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1 underline"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset a Base ({activePlayer.basePrice})</span>
          </button>
        </div>

        <div>
          <label className="block text-slate-400 text-[11px] mb-1 font-semibold">Squadra Acquirente</label>
          <select
            value={buyerTeam}
            onChange={(e) => setBuyerTeam(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:border-emerald-500 focus:outline-none"
          >
            {league.participants.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name} {p.isMyTeam ? '★ (TUA SQUADRA)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-slate-400 text-[11px] font-semibold">Prezzo Aggiudicazione (FM)</label>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleAddBid(-1)}
              className="bg-slate-900 border border-slate-700 text-slate-200 w-12 h-12 rounded-xl font-black text-xl hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center shrink-0"
            >
              <Minus className="w-5 h-5" />
            </button>

            <input
              type="number"
              min={1}
              value={bidPrice}
              onChange={(e) => setBidPrice(Math.max(1, Number(e.target.value)))}
              className="flex-1 bg-slate-900 border-2 border-emerald-500/60 rounded-xl py-2.5 text-center text-amber-400 font-mono font-black text-2xl focus:outline-none"
            />

            <button
              type="button"
              onClick={() => handleAddBid(1)}
              className="bg-slate-900 border border-slate-700 text-slate-200 w-12 h-12 rounded-xl font-black text-xl hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center shrink-0"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-1 font-mono">
            <button
              type="button"
              onClick={() => handleAddBid(1)}
              className="bg-slate-900 border border-slate-700 hover:border-emerald-500 hover:bg-emerald-950/40 text-emerald-300 font-bold py-2 rounded-xl text-xs active:scale-95 transition-all"
            >
              +1 FM
            </button>
            <button
              type="button"
              onClick={() => handleAddBid(5)}
              className="bg-slate-900 border border-slate-700 hover:border-emerald-500 hover:bg-emerald-950/40 text-emerald-300 font-bold py-2 rounded-xl text-xs active:scale-95 transition-all"
            >
              +5 FM
            </button>
            <button
              type="button"
              onClick={() => handleAddBid(10)}
              className="bg-slate-900 border border-slate-700 hover:border-emerald-500 hover:bg-emerald-950/40 text-emerald-300 font-bold py-2 rounded-xl text-xs active:scale-95 transition-all"
            >
              +10 FM
            </button>
            <button
              type="button"
              onClick={() => handleAddBid(25)}
              className="bg-slate-900 border border-slate-700 hover:border-amber-500 hover:bg-amber-950/40 text-amber-300 font-bold py-2 rounded-xl text-xs active:scale-95 transition-all"
            >
              +25 FM
            </button>
          </div>
        </div>

        {isOverBudget && (
          <div className="mt-2 bg-red-950/80 border border-red-500/80 rounded-xl p-3 flex items-center space-x-2 text-xs text-red-300 font-bold">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              Offerta non consentita! Supera il budget residuo di {buyerTeam} ({buyerTeamSummary?.remainingCredits ?? 0} FM disponibili).
            </span>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          {auctionHistoryLength > 0 && (
            <button
              type="button"
              onClick={handleUndo}
              className="text-slate-400 hover:text-red-400 text-xs font-bold flex items-center space-x-1 py-1"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Annulla Ultima Aggiudicazione</span>
            </button>
          )}

          <button
            type="button"
            disabled={isOverBudget}
            onClick={handleConfirmAssignment}
            className={`w-full sm:w-auto ml-auto font-black px-6 py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all uppercase tracking-wide ${
              isOverBudget
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-lg shadow-emerald-600/30'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>Conferma Aggiudicazione a {buyerTeam}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
