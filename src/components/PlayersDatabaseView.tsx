import React, { useState, useMemo } from 'react';
import { Player, PlayerRole, LeagueSettings, StrategySettings, RosterPlayer } from '../types';
import { Database, Plus } from 'lucide-react';
import { useWarRoomEngine } from '../engine/useWarRoomEngine';
import { PlayersFilterBar } from './players-database/PlayersFilterBar';
import { PlayersTable } from './players-database/PlayersTable';
import { PlayerDetailModal } from './players-database/PlayerDetailModal';
import { AddPlayerModal } from './players-database/AddPlayerModal';
import { PageHeader, Button } from './ui';

interface PlayersDatabaseViewProps {
  allPlayers: Player[];
  league: LeagueSettings;
  strategy: StrategySettings;
  auctionHistory: RosterPlayer[];
  wishlistIds: string[];
  blacklistIds: string[];
  totalBudget?: number;
  onToggleWishlist: (id: string) => void;
  onToggleBlacklist: (id: string) => void;
  onAddCustomPlayer: (player: Player) => void;
  /** Giocatore selezionato per la chiamata live, condiviso con Console Live. */
  selectedAuctionPlayerId: string | null;
  onSelectForAuction: (id: string) => void;
  /** Filtro ruolo condiviso con Console Live (per "vedi tutti gli attaccanti"). */
  roleFilter: PlayerRole | 'ALL';
  setRoleFilter: (r: PlayerRole | 'ALL') => void;
}

// Orchestratore: possiede solo i filtri di ricerca/squadra e quale modal è
// aperto. Il filtro ruolo è sollevato in App.tsx (condiviso con Console
// Live). Tabella, filtri e i due modal vivono in ./players-database/.
export const PlayersDatabaseView: React.FC<PlayersDatabaseViewProps> = ({
  allPlayers,
  league,
  strategy,
  auctionHistory,
  wishlistIds,
  blacklistIds,
  totalBudget = 500,
  onToggleWishlist,
  onToggleBlacklist,
  onAddCustomPlayer,
  selectedAuctionPlayerId,
  onSelectForAuction,
  roleFilter,
  setRoleFilter,
}) => {
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlayerModal, setSelectedPlayerModal] = useState<Player | null>(null);

  const { pricingMap } = useWarRoomEngine(allPlayers, league, strategy, auctionHistory);

  const teamsList = useMemo(() => {
    const teams = new Set(allPlayers.map((p) => p.team));
    return Array.from(teams).sort();
  }, [allPlayers]);

  const filteredPlayers = useMemo(() => {
    return allPlayers.filter((p) => {
      const matchRole = roleFilter === 'ALL' || p.role === roleFilter;
      const matchTeam = teamFilter === 'ALL' || p.team === teamFilter;
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) || p.team.toLowerCase().includes(search.toLowerCase());
      return matchRole && matchTeam && matchSearch;
    });
  }, [allPlayers, roleFilter, teamFilter, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-ink">
      <PageHeader
        icon={Database}
        title={`3. Listone Serie A (${allPlayers.length} Giocatori)`}
        subtitle="Listone completo, aggiornato live con l'andamento dell'asta: max bid per i liberi, prezzo pagato per gli aggiudicati. Clicca su un calciatore per la scheda di dettaglio."
        action={
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            <span>Aggiungi Nuovo Giocatore</span>
          </Button>
        }
      />

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
        auctionHistory={auctionHistory}
        pricingMap={pricingMap}
        wishlistIds={wishlistIds}
        blacklistIds={blacklistIds}
        totalBudget={totalBudget}
        onToggleWishlist={onToggleWishlist}
        onToggleBlacklist={onToggleBlacklist}
        onSelectPlayer={setSelectedPlayerModal}
        selectedAuctionPlayerId={selectedAuctionPlayerId}
        onSelectForAuction={onSelectForAuction}
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

      {showAddModal && <AddPlayerModal onClose={() => setShowAddModal(false)} onAddCustomPlayer={onAddCustomPlayer} />}
    </div>
  );
};
