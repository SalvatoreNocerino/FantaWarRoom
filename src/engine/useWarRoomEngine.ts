import { useMemo } from 'react';
import { Player, LeagueSettings, StrategySettings, RosterPlayer } from '../types';
import { priceAllPlayers, computeMyTeamBudget } from './pricingEngine';
import { toEnginePlayer, toEngineLeagueConfig, toEngineStrategyConfig, toAuctionAssignments } from './adapter';

/**
 * Calcolo di pricing usato dalla console Live (war-room-mobile): un solo
 * posto dove listone + lega + strategia + storico vengono convertiti nei
 * tipi del motore e prezzati.
 */
export function useWarRoomEngine(
  allPlayers: Player[],
  league: LeagueSettings,
  strategy: StrategySettings,
  auctionHistory: RosterPlayer[]
) {
  const myTeamName = useMemo(
    () => league.participants.find((p) => p.isMyTeam)?.name || league.participants[0]?.name || '',
    [league.participants]
  );

  const enginePlayers = useMemo(() => allPlayers.map(toEnginePlayer), [allPlayers]);
  const engineLeague = useMemo(() => toEngineLeagueConfig(league), [league]);
  const engineStrategy = useMemo(() => toEngineStrategyConfig(strategy), [strategy]);
  const assignments = useMemo(() => toAuctionAssignments(auctionHistory), [auctionHistory]);

  const pricingMap = useMemo(
    () => priceAllPlayers(enginePlayers, engineLeague, engineStrategy, assignments),
    [enginePlayers, engineLeague, engineStrategy, assignments]
  );
  const myTeamBudget = useMemo(
    () => computeMyTeamBudget(enginePlayers, engineLeague, assignments),
    [enginePlayers, engineLeague, assignments]
  );

  const assignedPlayerIds = useMemo(() => new Set(auctionHistory.map((h) => h.playerId)), [auctionHistory]);
  const availablePlayers = useMemo(
    () => allPlayers.filter((p) => !assignedPlayerIds.has(p.id)),
    [allPlayers, assignedPlayerIds]
  );

  return { myTeamName, pricingMap, myTeamBudget, assignedPlayerIds, availablePlayers, assignments };
}
