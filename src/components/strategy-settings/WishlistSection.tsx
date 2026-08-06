import React from 'react';
import { Player, PlayerRole } from '../../types';
import { calculateDynamicFairValueBracket } from '../../utils/fantaEngine';
import { Heart, Trash2 } from 'lucide-react';

const roleBg: Record<string, string> = {
  P: 'bg-amber-600',
  D: 'bg-emerald-600',
  C: 'bg-blue-600',
  A: 'bg-red-600',
};

const roleLabelPlural: Record<string, string> = {
  P: 'Portieri',
  D: 'Difensori',
  C: 'Centrocampisti',
  A: 'Attaccanti',
};

interface WishlistSectionProps {
  allPlayers: Player[];
  wishlistPlayers: Player[];
  totalBudget: number;
  playerSearchSelect: string;
  onAddPlayer: (playerId: string) => void;
  onRemovePlayer: (playerId: string) => void;
}

export const WishlistSection: React.FC<WishlistSectionProps> = ({
  allPlayers,
  wishlistPlayers,
  totalBudget,
  playerSearchSelect,
  onAddPlayer,
  onRemovePlayer,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-cyan-300 flex items-center space-x-2">
        <Heart className="w-4 h-4 text-red-400" />
        <span>2.4.1 Seleziona Giocatori per la Wishlist</span>
      </h3>

      <div className="flex gap-2">
        <select
          value={playerSearchSelect}
          onChange={(e) => onAddPlayer(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
        >
          <option value="">-- Cerca o Seleziona Giocatore dal Listone --</option>
          {allPlayers.map((p) => (
            <option key={p.id} value={p.id}>
              [{p.role}] {p.name} ({p.team}) - Base: {p.basePrice} FM - FairValue:{' '}
              {calculateDynamicFairValueBracket(p, totalBudget)}
            </option>
          ))}
        </select>
      </div>

      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
        {wishlistPlayers.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            La tua wishlist è vuota. Seleziona i giocatori dal menu sopra o chiedi un consiglio all'AI sotto!
          </div>
        ) : (
          <div className="divide-y divide-slate-800 text-xs">
            {(['P', 'D', 'C', 'A'] as PlayerRole[]).map((role) => {
              const rolePlayers = wishlistPlayers.filter((p) => p.role === role);
              if (rolePlayers.length === 0) return null;

              return (
                <div key={role} className="p-3">
                  <div className="font-bold text-slate-400 mb-2 flex items-center space-x-2">
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center text-[10px] text-white font-mono ${roleBg[role]}`}
                    >
                      {role}
                    </span>
                    <span>
                      {roleLabelPlural[role]} ({rolePlayers.length})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {rolePlayers.map((p) => (
                      <div
                        key={p.id}
                        className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <strong className="text-white block truncate">{p.name}</strong>
                          <span className="text-[11px] text-slate-400">
                            {p.team} • FM: {p.expectedFantaAvg} • Fair Value:{' '}
                            {calculateDynamicFairValueBracket(p, totalBudget)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemovePlayer(p.id)}
                          className="text-slate-500 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
