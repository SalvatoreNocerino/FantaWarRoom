import React from 'react';
import { PlayerRole } from '../../types';
import { Search } from 'lucide-react';
import { Card, Select, RoleFilterChips } from '../ui';

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
    <Card className="p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
        <div className="relative">
          <Search className="w-4 h-4 text-faint absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cerca nome calciatore o squadra..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-field border border-border-strong rounded-lg pl-9 pr-3 py-2 text-xs text-ink focus:outline-none focus:border-accent"
          />
        </div>

        <RoleFilterChips value={roleFilter} onChange={setRoleFilter} className="w-full" />

        <Select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className="text-xs py-2">
          <option value="ALL">Tutte le Squadre Serie A</option>
          {teamsList.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </div>
    </Card>
  );
};
