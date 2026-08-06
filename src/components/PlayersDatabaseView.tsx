import React, { useState, useMemo } from 'react';
import { Player, PlayerRole } from '../types';
import { Database, Plus } from 'lucide-react';
import { PlayersFilterBar } from './players-database/PlayersFilterBar';
import { PlayersTable } from './players-database/PlayersTable';
import { PlayerDetailModal } from './players-database/PlayerDetailModal';
import { AddPlayerModal } from './players-database/AddPlayerModal';

interface PlayersDatabaseViewProps {
  allPlayers: Player[];
  wishlistIds: string[];
  blacklistIds: string[];
  totalBudget?: number;
  onToggleWishlist: (id: string) => void;
  onToggleBlacklist: (id: string) => void;
  onAddCustomPlayer: (player: Player) => void;
}

// Orchestratore: possiede solo i filtri e quale modal è aperto.
// Tabella, filtri e i due modal vivono in ./players-database/.
export const PlayersDatabaseView: React.FC<PlayersDatabaseViewProps> = ({
  allPlayers,
  wishlistIds,
  blacklistIds,
  totalBudget = 500,
  onToggleWishlist,
  onToggleBlacklist,
  onAddCustomPlayer,
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<PlayerRole | 'ALL'>('ALL');
  const [teamFilter, setTeamFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlayerModal, setSelectedPlayerModal] = useState<Player | null>(null);

  const teamsList = useMemo(() => {
    const teams = new Set(allPlayers.map((p) => p.team));
    return Array.from(teams).sort();
  }, [allPlayers]);

  const filteredPlayers = useMemo(() => {
    return allPlayers.filter((p) => {
      const matchRole = roleFilter === 'ALL' || p.role === roleFilter;
      const matchTeam = teamFilter === 'ALL' || p.team === teamFilter;
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.team.toLowerCase().includes(search.toLowerCase());
      return matchRole && matchTeam && matchSearch;
    });
  }, [allPlayers, roleFilter, teamFilter, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2 text-emerald-400">
            <Database className="w-6 h-6" />
            <span>3. Listone Serie A 2026 ({allPlayers.length} Giocatori)</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Lista compatta di tutti i calciatori. Clicca su un calciatore per aprire la scheda di dettaglio.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition-colors self-start sm:self-auto shadow-lg shadow-emerald-600/30 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Aggiungi Nuovo Giocatore</span>
        </button>
      </div>

      <PlayersFilterBar
        search={search}
        setSearch={setSearch}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        teamFilter={teamFilter}
        setTeamFilter={setTeamFilter}
        teamsList={teamsList}
      />

      <PlayersTable
        players={filteredPlayers}
        wishlistIds={wishlistIds}
        blacklistIds={blacklistIds}
        totalBudget={totalBudget}
        onToggleWishlist={onToggleWishlist}
        onToggleBlacklist={onToggleBlacklist}
        onSelectPlayer={setSelectedPlayerModal}
      />

      {selectedPlayerModal && (
        <PlayerDetailModal
          player={selectedPlayerModal}
          wishlistIds={wishlistIds}
          blacklistIds={blacklistIds}
          totalBudget={totalBudget}
          onClose={() => setSelectedPlayerModal(null)}
          onToggleWishlist={onToggleWishlist}
          onToggleBlacklist={onToggleBlacklist}
        />
      )}

      {showAddModal && (
        <AddPlayerModal onClose={() => setShowAddModal(false)} onAddCustomPlayer={onAddCustomPlayer} />
      )}
    </div>
  );
};
