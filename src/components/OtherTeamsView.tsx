import React, { useMemo } from 'react';
import { Player, LeagueSettings, RosterPlayer, PlayerRole } from '../types';
import { calculateTeamsSummary } from '../utils/fantaEngine';
import { Users, AlertCircle, ShieldAlert } from 'lucide-react';

interface OtherTeamsViewProps {
  allPlayers: Player[];
  league: LeagueSettings;
  auctionHistory: RosterPlayer[];
}

export const OtherTeamsView: React.FC<OtherTeamsViewProps> = ({
  allPlayers,
  league,
  auctionHistory,
}) => {
  const summaries = useMemo(
    () => calculateTeamsSummary(league, auctionHistory),
    [league, auctionHistory]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-slate-100">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold flex items-center space-x-2 text-cyan-400">
          <Users className="w-6 h-6" />
          <span>Monitor della Lega & Avversari</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Monitora in tempo reale i crediti residui, il numero di slot coperti e la massima offerta teorica di ciascun fantallenatore.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {summaries.map((team) => {
          const totalMaxSlots =
            league.rosterSlots.P +
            league.rosterSlots.D +
            league.rosterSlots.C +
            league.rosterSlots.A;

          return (
            <div
              key={team.teamName}
              className={`rounded-2xl p-5 border transition-all ${
                team.isMyTeam
                  ? 'bg-emerald-950/40 border-emerald-500/60 shadow-xl shadow-emerald-950/50'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="truncate">
                  <h2 className="font-extrabold text-base text-white truncate flex items-center space-x-2">
                    <span>{team.teamName}</span>
                    {team.isMyTeam && (
                      <span className="bg-emerald-500 text-slate-950 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                        TU
                      </span>
                    )}
                  </h2>
                  <span className="text-xs text-slate-400">
                    Acquistati: {team.playersBoughtCount} / {totalMaxSlots}
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
                  <span className="text-slate-400 block">Offerta Max Consentita</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {team.maxPossibleBid} FM
                  </span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Media / Slot Mancante</span>
                  <span className="font-mono font-bold text-cyan-400 text-sm">
                    {team.averageCreditPerSlotRemaining} FM
                  </span>
                </div>
              </div>

              {/* Slot Progress Bars by Role */}
              <div className="space-y-2 text-xs">
                {(['P', 'D', 'C', 'A'] as PlayerRole[]).map((role) => {
                  const slotsTaken = team.slotsByRole[role];
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
          );
        })}
      </div>
    </div>
  );
};
