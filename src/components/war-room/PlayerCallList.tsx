import React from 'react';
import { Player, PlayerRole, StrategySettings } from '../../types';
import { Search } from 'lucide-react';

interface Props {
  filteredSearchList: Player[];
  activePlayer: Player | null;
  strategy: StrategySettings;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  roleFilter: PlayerRole | 'ALL';
  setRoleFilter: (r: PlayerRole | 'ALL') => void;
  setSelectedPlayerId: (id: string) => void;
}

export const PlayerCallList: React.FC<Props> = ({
  filteredSearchList,
  activePlayer,
  strategy,
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  setSelectedPlayerId
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
      <h3 className="text-xs font-bold text-white flex items-center space-x-2">
        <Search className="w-4 h-4 text-emerald-400" />
        <span>Ricerca Rapida Giocatore da Chiamare</span>
      </h3>

      <div className="space-y-2">
        <input
          type="text"
          placeholder="Cerca per nome o squadra..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
        />

        <div className="grid grid-cols-5 gap-1">
          {(['ALL', 'P', 'D', 'C', 'A'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`py-1 rounded text-[11px] font-bold transition-colors ${
                roleFilter === r ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
        {filteredSearchList.map((p) => {
          const isSelected = activePlayer?.id === p.id;
          const isWishlist = strategy.wishlistIds.includes(p.id);

          return (
            <button
              key={p.id}
              onClick={() => setSelectedPlayerId(p.id)}
              className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs ${
                isSelected
                  ? 'bg-emerald-950/80 border-emerald-500 text-white font-bold shadow-md'
                  : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <span
                  className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[10px] font-bold text-white shrink-0 ${
                    p.role === 'P' ? 'bg-amber-600' : p.role === 'D' ? 'bg-emerald-600' : p.role === 'C' ? 'bg-blue-600' : 'bg-red-600'
                  }`}
                >
                  {p.role}
                </span>
                <span className="truncate">{p.name}</span>
                <span className="text-[10px] text-slate-400 font-semibold">({p.team})</span>
                {isWishlist && <span className="text-red-400 text-[10px]">❤️</span>}
              </div>

              <span className="font-mono text-amber-400 font-bold shrink-0 ml-2">{p.basePrice} FM</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
