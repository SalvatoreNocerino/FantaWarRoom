import React from 'react';
import { Player } from '../../types';
import { calculateDynamicFairValueBracket } from '../../utils/fantaEngine';
import { Heart, Ban, Star, Info } from 'lucide-react';

const roleBg: Record<string, string> = {
  P: 'bg-amber-600',
  D: 'bg-emerald-600',
  C: 'bg-blue-600',
  A: 'bg-red-600',
};

interface PlayersTableProps {
  players: Player[];
  wishlistIds: string[];
  blacklistIds: string[];
  totalBudget: number;
  onToggleWishlist: (id: string) => void;
  onToggleBlacklist: (id: string) => void;
  onSelectPlayer: (p: Player) => void;
}

export const PlayersTable: React.FC<PlayersTableProps> = ({
  players,
  wishlistIds,
  blacklistIds,
  totalBudget,
  onToggleWishlist,
  onToggleBlacklist,
  onSelectPlayer,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <th className="p-3 w-12 text-center">R</th>
              <th className="p-3">Calciatore & Squadra</th>
              <th className="p-3 text-center">Quot. Base</th>
              <th className="p-3">Fair Value Stimato</th>
              <th className="p-3 text-center">FM Prevista</th>
              <th className="p-3 text-center hidden md:table-cell">Stats 24/25</th>
              <th className="p-3 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {players.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  Nessun calciatore trovato con i filtri selezionati.
                </td>
              </tr>
            ) : (
              players.map((p) => {
                const isWish = wishlistIds.includes(p.id);
                const isBlack = blacklistIds.includes(p.id);
                const fairValStr = calculateDynamicFairValueBracket(p, totalBudget);

                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelectPlayer(p)}
                    className="hover:bg-slate-800/60 cursor-pointer transition-colors group"
                  >
                    <td className="p-3 text-center">
                      <span
                        className={`w-6 h-6 rounded inline-flex items-center justify-center font-mono font-bold text-xs text-white ${roleBg[p.role]}`}
                      >
                        {p.role}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <strong className="text-white text-sm group-hover:text-emerald-300 transition-colors">
                          {p.name}
                        </strong>
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold text-slate-300">
                          {p.team}
                        </span>
                        {p.tier === 1 && (
                          <span className="text-amber-400 text-[10px] font-bold flex items-center">
                            <Star className="w-3 h-3 fill-amber-400 mr-0.5" /> TOP
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3 text-center font-mono font-bold text-amber-400">
                      {p.basePrice} FM
                    </td>

                    <td className="p-3">
                      <span className="font-mono text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                        {fairValStr}
                      </span>
                    </td>

                    <td className="p-3 text-center font-mono font-bold text-emerald-400">
                      {p.expectedFantaAvg}
                    </td>

                    <td className="p-3 text-center hidden md:table-cell text-slate-400 font-mono text-[11px]">
                      {p.lastYearStats ? (
                        <span>
                          {p.lastYearStats.appearances}p •{' '}
                          <strong className="text-emerald-400">{p.lastYearStats.goals}g</strong> •{' '}
                          <strong className="text-cyan-400">{p.lastYearStats.assists}a</strong> (FM{' '}
                          {p.lastYearStats.fantaAvg})
                        </span>
                      ) : (
                        <span className="text-slate-600 italic">N/D</span>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      <div
                        className="flex items-center justify-end space-x-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => onToggleWishlist(p.id)}
                          title={isWish ? 'Rimuovi da Wishlist' : 'Aggiungi a Wishlist'}
                          className={`p-1.5 rounded-lg text-xs transition-colors ${
                            isWish
                              ? 'bg-red-600 text-white'
                              : 'bg-slate-950 text-slate-400 hover:text-red-400 border border-slate-800'
                          }`}
                        >
                          <Heart className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onToggleBlacklist(p.id)}
                          title={isBlack ? 'Rimuovi da Blacklist' : 'Aggiungi a Blacklist'}
                          className={`p-1.5 rounded-lg text-xs transition-colors ${
                            isBlack
                              ? 'bg-slate-700 text-red-400 border border-red-500'
                              : 'bg-slate-950 text-slate-400 hover:text-red-400 border border-slate-800'
                          }`}
                        >
                          <Ban className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectPlayer(p)}
                          title="Vedi Scheda Dettaglio"
                          className="p-1.5 bg-slate-950 hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-400 border border-slate-800 rounded-lg text-xs transition-colors"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
