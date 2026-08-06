import React from 'react';
import { Player } from '../../types';
import { calculateDynamicFairValueBracket } from '../../utils/fantaEngine';
import { X, Star, Tag, BarChart3, TrendingUp, Heart, Ban } from 'lucide-react';

const roleBg: Record<string, string> = {
  P: 'bg-amber-600',
  D: 'bg-emerald-600',
  C: 'bg-blue-600',
  A: 'bg-red-600',
};

interface PlayerDetailModalProps {
  player: Player;
  wishlistIds: string[];
  blacklistIds: string[];
  totalBudget: number;
  onClose: () => void;
  onToggleWishlist: (id: string) => void;
  onToggleBlacklist: (id: string) => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({
  player,
  wishlistIds,
  blacklistIds,
  totalBudget,
  onClose,
  onToggleWishlist,
  onToggleBlacklist,
}) => {
  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-950 border border-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
          <span
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-base text-white shadow-lg ${roleBg[player.role]}`}
          >
            {player.role}
          </span>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">{player.name}</h2>
              <span className="bg-slate-800 px-2.5 py-0.5 rounded text-xs font-bold text-slate-300">
                {player.team}
              </span>
            </div>
            {player.tier === 1 && (
              <span className="text-amber-400 text-xs font-bold flex items-center mt-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" /> TOP GIOCATORE
              </span>
            )}
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Quotazione Base Listone:</span>
            <span className="font-mono font-bold text-amber-400 text-sm">{player.basePrice} FM</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-900">
            <span className="text-slate-400 flex items-center space-x-1">
              <Tag className="w-3.5 h-3.5 text-cyan-400" />
              <span>Fair Value Consigliato:</span>
            </span>
            <span className="font-mono font-bold text-cyan-300 text-sm bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-500/30">
              {calculateDynamicFairValueBracket(player, totalBudget)}
            </span>
          </div>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
          <span className="text-slate-300 font-bold flex items-center space-x-1.5">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span>Statistiche Anno Scorso (2024/25)</span>
          </span>

          {player.lastYearStats ? (
            <div className="grid grid-cols-4 gap-2 text-center font-mono pt-1 text-slate-200">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Presenze</span>
                <strong className="text-white text-sm">{player.lastYearStats.appearances}</strong>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Gol</span>
                <strong className="text-emerald-400 text-sm">{player.lastYearStats.goals}</strong>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Assist</span>
                <strong className="text-cyan-400 text-sm">{player.lastYearStats.assists}</strong>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">FantaMedia</span>
                <strong className="text-amber-400 text-sm">{player.lastYearStats.fantaAvg}</strong>
              </div>
            </div>
          ) : (
            <span className="text-slate-500 italic block p-2">Nessun dato storico precedente disponibile</span>
          )}
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
          <span className="text-slate-300 font-bold flex items-center space-x-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Previsioni Stagione (2025/26)</span>
          </span>

          <div className="grid grid-cols-2 gap-2 font-mono pt-1">
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[10px] block">FantaMedia Prevista</span>
              <strong className="text-emerald-400 text-sm">{player.expectedFantaAvg}</strong>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[10px] block">Bonus Attesi (G+A)</span>
              <strong className="text-cyan-400 text-sm">{player.expectedGoalsAssists}</strong>
            </div>
          </div>
        </div>

        {player.notes && (
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
            <span className="text-slate-400 font-bold block">Note Tattiche & Consiglio:</span>
            <p className="text-slate-300 italic">"{player.notes}"</p>
          </div>
        )}

        <div className="flex items-center space-x-3 pt-2">
          <button
            type="button"
            onClick={() => onToggleWishlist(player.id)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-colors ${
              wishlistIds.includes(player.id)
                ? 'bg-red-600 text-white'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>{wishlistIds.includes(player.id) ? 'In Wishlist' : 'Aggiungi a Wishlist'}</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleBlacklist(player.id)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-colors ${
              blacklistIds.includes(player.id)
                ? 'bg-slate-700 text-red-400 border border-red-500'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Ban className="w-4 h-4" />
            <span>{blacklistIds.includes(player.id) ? 'In Blacklist' : 'Aggiungi a Blacklist'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
