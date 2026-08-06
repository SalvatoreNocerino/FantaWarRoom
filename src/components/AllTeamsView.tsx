import React, { useState, useMemo } from 'react';
import { Player, LeagueSettings, StrategySettings, RosterPlayer, PlayerRole } from '../types';
import { calculateTeamsSummary, TeamSummary } from '../utils/fantaEngine';
import { Users, UserCheck, Share2, ChevronRight, X, Award, ShieldAlert } from 'lucide-react';

interface AllTeamsViewProps {
  allPlayers: Player[];
  league: LeagueSettings;
  strategy: StrategySettings;
  auctionHistory: RosterPlayer[];
}

export const AllTeamsView: React.FC<AllTeamsViewProps> = ({
  allPlayers,
  league,
  strategy,
  auctionHistory,
}) => {
  const [selectedTeamName, setSelectedTeamName] = useState<string | null>(null);

  const teamSummaries = useMemo(
    () => calculateTeamsSummary(league, auctionHistory, allPlayers),
    [league, auctionHistory, allPlayers]
  );

  const selectedTeamSummary = useMemo(() => {
    if (!selectedTeamName) return null;
    return teamSummaries.find((t) => t.teamName === selectedTeamName) || null;
  }, [selectedTeamName, teamSummaries]);

  const selectedTeamBids = useMemo(() => {
    if (!selectedTeamName) return [];
    return auctionHistory.filter((b) => b.boughtByTeam === selectedTeamName);
  }, [selectedTeamName, auctionHistory]);

  const selectedTeamPlayersWithCost = useMemo(() => {
    return selectedTeamBids.map((bid) => {
      const player = allPlayers.find((p) => p.id === bid.playerId);
      return { bid, player };
    });
  }, [selectedTeamBids, allPlayers]);

  const copyTeamSquadToClipboard = (tName: string) => {
    const summary = teamSummaries.find((t) => t.teamName === tName);
    const bids = auctionHistory.filter((b) => b.boughtByTeam === tName);

    let text = `📋 ROSA ${tName.toUpperCase()} (${league.name})\n`;
    text += `💰 Crediti Rimanenti: ${summary?.remainingCredits || 0} / ${summary?.initialBudget || league.totalBudget} FM\n\n`;

    (['P', 'D', 'C', 'A'] as PlayerRole[]).forEach((role) => {
      const items = bids
        .map((b) => ({ bid: b, player: allPlayers.find((p) => p.id === b.playerId) }))
        .filter((item) => item.player?.role === role);

      text += `--- RUOLO ${role} (${items.length}/${league.rosterSlots[role]}) ---\n`;
      items.forEach((item) => {
        text += `• ${item.player?.name} (${item.player?.team}) - ${item.bid.cost} FM\n`;
      });
      text += '\n';
    });

    navigator.clipboard.writeText(text);
    alert(`Rosa di "${tName}" copiata negli appunti! Pronta da condividere.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold flex items-center space-x-2 text-cyan-400">
          <Users className="w-6 h-6" />
          <span>4. Squadre della Lega ({teamSummaries.length} Fantallenatori)</span>
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Monitora crediti residui, offerta massima teorica e slot coperti per tutte le squadre. Clicca su qualsiasi card per vederne i dettagli della rosa.
        </p>
      </div>

      {/* Grid of All Teams Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teamSummaries.map((team) => {
          const totalMaxSlots =
            league.rosterSlots.P +
            league.rosterSlots.D +
            league.rosterSlots.C +
            league.rosterSlots.A;

          return (
            <div
              key={team.teamName}
              onClick={() => setSelectedTeamName(team.teamName)}
              className={`rounded-2xl p-5 border cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between ${
                team.isMyTeam
                  ? 'bg-emerald-950/40 border-emerald-500/80 shadow-xl shadow-emerald-950/50'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Team Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div className="truncate">
                    <h2 className="font-extrabold text-base text-white truncate flex items-center space-x-2">
                      <span>{team.teamName}</span>
                      {team.isMyTeam && (
                        <span className="bg-emerald-500 text-slate-950 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                          TUA SQUADRA
                        </span>
                      )}
                    </h2>
                    <span className="text-xs text-slate-400">
                      Giocatori: {team.playersBoughtCount} / {totalMaxSlots}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Crediti Res.</span>
                    <span className="font-mono text-xl font-bold text-amber-400">
                      {team.remainingCredits} FM
                    </span>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Offerta Max Consentita</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {team.maxPossibleBid} FM
                    </span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Media / Slot Rimasto</span>
                    <span className="font-mono font-bold text-cyan-400 text-sm">
                      {team.averageCreditPerSlotRemaining} FM
                    </span>
                  </div>
                </div>

                {/* Slot Progress Bars by Role */}
                <div className="space-y-2 text-xs">
                  {(['P', 'D', 'C', 'A'] as PlayerRole[]).map((role) => {
                    const bidsForRole = auctionHistory.filter((b) => {
                      if (b.boughtByTeam !== team.teamName) return false;
                      const pl = allPlayers.find((p) => p.id === b.playerId);
                      return pl?.role === role;
                    });

                    const slotsTaken = bidsForRole.length;
                    const slotsTarget = league.rosterSlots[role];
                    const pct = Math.min(100, Math.round((slotsTaken / slotsTarget) * 100));

                    return (
                      <div key={role} className="space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-bold text-slate-300">
                            {role === 'P' ? 'Portieri' : role === 'D' ? 'Difensori' : role === 'C' ? 'Centrocampisti' : 'Attaccanti'} ({slotsTaken}/{slotsTarget})
                          </span>
                          <span className="text-slate-500 font-mono">{pct}%</span>
                        </div>

                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all ${
                              role === 'P'
                                ? 'bg-amber-500'
                                : role === 'D'
                                ? 'bg-emerald-500'
                                : role === 'C'
                                ? 'bg-blue-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Click Indicator */}
              <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-cyan-400 font-bold">
                <span>Vedi Dettagli Rosa</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Roster Detail Modal */}
      {selectedTeamName && selectedTeamSummary && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-6 text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold flex items-center space-x-2 text-cyan-400">
                  <UserCheck className="w-6 h-6" />
                  <span>Dettaglio Rosa: {selectedTeamName}</span>
                  {selectedTeamSummary.isMyTeam && (
                    <span className="bg-emerald-500 text-slate-950 text-xs font-mono font-bold px-2 py-0.5 rounded">
                      TUA SQUADRA
                    </span>
                  )}
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Budget Iniziale: {selectedTeamSummary.initialBudget} FM | Spesi: {selectedTeamSummary.totalSpent} FM | Rimasti: **{selectedTeamSummary.remainingCredits} FM**
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyTeamSquadToClipboard(selectedTeamName)}
                  className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Copia Rosa</span>
                </button>

                <button
                  onClick={() => setSelectedTeamName(null)}
                  className="text-slate-400 hover:text-white p-1.5 bg-slate-800 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Role Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['P', 'D', 'C', 'A'] as PlayerRole[]).map((role) => {
                const roleItems = selectedTeamPlayersWithCost.filter(
                  (item) => item.player?.role === role
                );
                const maxSlots = league.rosterSlots[role];
                const roleSpent = roleItems.reduce((acc, i) => acc + i.bid.cost, 0);

                return (
                  <div
                    key={role}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-white text-xs ${
                            role === 'P'
                              ? 'bg-amber-600'
                              : role === 'D'
                              ? 'bg-emerald-600'
                              : role === 'C'
                              ? 'bg-blue-600'
                              : 'bg-red-600'
                          }`}
                        >
                          {role}
                        </span>
                        <h3 className="font-bold text-white text-sm">
                          {role === 'P' ? 'Portieri' : role === 'D' ? 'Difensori' : role === 'C' ? 'Centrocampisti' : 'Attaccanti'}
                        </h3>
                      </div>

                      <div className="text-right font-mono text-xs">
                        <span className="text-slate-400 block text-[10px]">
                          {roleItems.length} / {maxSlots} acq.
                        </span>
                        <span className="font-bold text-amber-400">{roleSpent} FM</span>
                      </div>
                    </div>

                    {roleItems.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                        Nessun acquisto per il ruolo {role}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {roleItems.map(({ bid, player }) => (
                          <div
                            key={bid.id}
                            className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-white block">
                                {player?.name || 'Giocatore'}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {player?.team} • FM prev: {player?.expectedFantaAvg || '-'}
                              </span>
                            </div>

                            <span className="font-mono text-amber-400 font-bold text-sm">
                              {bid.cost} FM
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
