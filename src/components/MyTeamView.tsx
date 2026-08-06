import React, { useMemo } from 'react';
import { Player, LeagueSettings, StrategySettings, RosterPlayer, PlayerRole } from '../types';
import { UserCheck, Share2, Award, Zap, ChevronRight } from 'lucide-react';

interface MyTeamViewProps {
  allPlayers: Player[];
  league: LeagueSettings;
  strategy: StrategySettings;
  auctionHistory: RosterPlayer[];
}

export const MyTeamView: React.FC<MyTeamViewProps> = ({
  allPlayers,
  league,
  strategy,
  auctionHistory,
}) => {
  const myBids = useMemo(
    () => auctionHistory.filter((b) => b.boughtByTeam === league.myTeamName),
    [auctionHistory, league.myTeamName]
  );

  const myPlayersWithCost = useMemo(() => {
    return myBids.map((bid) => {
      const player = allPlayers.find((p) => p.id === bid.playerId);
      return {
        bid,
        player,
      };
    });
  }, [myBids, allPlayers]);

  const totalSpent = useMemo(
    () => myBids.reduce((acc, b) => acc + b.cost, 0),
    [myBids]
  );

  const remainingCredits = Math.max(0, league.totalBudget - totalSpent);

  const countByRole = useMemo(() => {
    const counts: { [key in PlayerRole]: number } = { P: 0, D: 0, C: 0, A: 0 };
    myPlayersWithCost.forEach((item) => {
      if (item.player) {
        counts[item.player.role]++;
      }
    });
    return counts;
  }, [myPlayersWithCost]);

  const totalSlotsNeeded =
    Math.max(0, league.rosterSlots.P - countByRole.P) +
    Math.max(0, league.rosterSlots.D - countByRole.D) +
    Math.max(0, league.rosterSlots.C - countByRole.C) +
    Math.max(0, league.rosterSlots.A - countByRole.A);

  const avgPerSlotRemaining =
    totalSlotsNeeded > 0 ? Number((remainingCredits / totalSlotsNeeded).toFixed(1)) : 0;

  const copySquadToClipboard = () => {
    let summaryText = `📋 ROSA ${league.myTeamName.toUpperCase()} (${league.name})\n`;
    summaryText += `💰 Crediti Rimanenti: ${remainingCredits} / ${league.totalBudget}\n\n`;

    (['P', 'D', 'C', 'A'] as PlayerRole[]).forEach((role) => {
      const roleItems = myPlayersWithCost.filter((item) => item.player?.role === role);
      summaryText += `--- RUOLO ${role} (${roleItems.length}/${league.rosterSlots[role]}) ---\n`;
      roleItems.forEach((item) => {
        summaryText += `• ${item.player?.name} (${item.player?.team}) - ${item.bid.cost} FM\n`;
      });
      summaryText += '\n';
    });

    navigator.clipboard.writeText(summaryText);
    alert('Rosa copiata nei dati del blocco appunti! Pronta per condivisione.');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2 text-cyan-400">
            <UserCheck className="w-6 h-6" />
            <span>Mia Squadra: {league.myTeamName}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Visualizza la composizione della tua rosa, la spesa effettiva ed esporta il tuo team.
          </p>
        </div>

        <button
          onClick={copySquadToClipboard}
          className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors self-start sm:self-auto"
        >
          <Share2 className="w-4 h-4" />
          <span>Copia Rosa (WhatsApp / Note)</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Crediti Rimanenti</span>
          <span className="font-mono text-2xl font-black text-amber-400">
            {remainingCredits} FM
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Crediti Spesi</span>
          <span className="font-mono text-2xl font-black text-slate-200">
            {totalSpent} / {league.totalBudget} FM
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Slot Ancora Liberi</span>
          <span className="font-mono text-2xl font-black text-cyan-400">
            {totalSlotsNeeded} slot
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Media Crediti / Slot</span>
          <span className="font-mono text-2xl font-black text-emerald-400">
            {avgPerSlotRemaining} FM
          </span>
        </div>
      </div>

      {/* Roster Grouped By Role */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(['P', 'D', 'C', 'A'] as PlayerRole[]).map((role) => {
          const roleItems = myPlayersWithCost.filter((item) => item.player?.role === role);
          const maxSlots = league.rosterSlots[role];
          const color =
            role === 'P'
              ? 'amber'
              : role === 'D'
              ? 'emerald'
              : role === 'C'
              ? 'blue'
              : 'red';

          const roleSpent = roleItems.reduce((acc, i) => acc + i.bid.cost, 0);

          return (
            <div
              key={role}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-white text-xs ${
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
                  <h2 className="text-lg font-bold text-white">
                    {role === 'P' ? 'Portieri' : role === 'D' ? 'Difensori' : role === 'C' ? 'Centrocampisti' : 'Attaccanti'}
                  </h2>
                </div>

                <div className="text-right font-mono text-xs">
                  <span className="text-slate-400 block">
                    {roleItems.length} / {maxSlots} acq.
                  </span>
                  <span className="font-bold text-amber-400">{roleSpent} FM spesi</span>
                </div>
              </div>

              {roleItems.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  Nessun giocatore acquistato per il ruolo {role}.
                </div>
              ) : (
                <div className="space-y-2">
                  {roleItems.map(({ bid, player }) => (
                    <div
                      key={bid.id}
                      className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-white text-sm block">
                          {player?.name || 'Giocatore'}
                        </span>
                        <span className="text-slate-400">
                          {player?.team} • FM: {player?.expectedFantaAvg || '-'}
                        </span>
                      </div>

                      <div className="text-right font-mono">
                        <span className="text-amber-400 font-bold text-sm">
                          {bid.cost} FM
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
