import React from 'react';
import { PlayerRole } from '../../types';
import { Search } from 'lucide-react';

interface PlayersFilterBarProps {
  search: string;
  setSearch: (v: string) => void;
  roleFilter: PlayerRole | 'ALL';
  setRoleFilter: (v: PlayerRole | 'ALL') => void;
  teamFilter: string;
  setTeamFilter: (v: string) => void;
  teamsList: string[];
}

export const PlayersFilterBar: React.FC<PlayersFilterBarProps> = ({
  search,
  setSearch,
  roleFilter,
  setRoleFilter,
  teamFilter,
  setTeamFilter,
  teamsList,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cerca nome calciatore o squadra..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="grid grid-cols-5 gap-1">
          {(['ALL', 'P', 'D', 'C', 'A'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`py-2 rounded text-xs font-bold transition-all ${
                roleFilter === r
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">Tutte le Squadre Serie A</option>
          {teamsList.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
