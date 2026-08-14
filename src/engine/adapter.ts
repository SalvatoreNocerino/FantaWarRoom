/**
 * Ponte tra i tipi dell'app (Player, LeagueSettings, StrategySettings,
 * RosterPlayer) e i tipi puri del motore di pricing (src/engine). Tiene il
 * motore indipendente dal resto dell'app: se il modello dati dell'app
 * cambia, si aggiorna solo questo file.
 */

import { Player, LeagueSettings, StrategySettings, RosterPlayer } from '../types';
import { EnginePlayer, EngineLeagueConfig, EngineStrategyConfig, AuctionAssignment } from './types';

export function toEnginePlayer(player: Player): EnginePlayer {
  return {
    id: player.id,
    role: player.role,
    name: player.name,
    team: player.team,
    qtA: player.basePrice,
    // Senza FVM reale (listone importato senza quella colonna) usiamo la
    // quotazione come proxy: il motore resta comunque proporzionale e
    // coerente, solo meno preciso di quando il FVM è disponibile.
    fvm: player.fvm ?? player.basePrice,
    presenze: player.presenze,
    mv: player.mv,
    fm: player.fm,
    gol: player.goals,
    assist: player.assists,
  };
}

export function toEngineLeagueConfig(league: LeagueSettings): EngineLeagueConfig {
  const myTeamName = league.participants.find((p) => p.isMyTeam)?.name ?? league.participants[0]?.name ?? '';
  return {
    numTeams: league.numTeams,
    totalBudget: league.totalBudget,
    rosterSlots: league.rosterSlots,
    defensiveModifierEnabled: league.defensiveModifier.enabled,
    midfieldModifierEnabled: league.midfieldModifier.enabled,
    myTeamName,
  };
}

export function toEngineStrategyConfig(strategy: StrategySettings): EngineStrategyConfig {
  const { P, D, C, A } = strategy.budgetAllocationPct;
  return {
    aggressiveness: strategy.aggressionScore / 100,
    roleBudgetPct: { P: P / 100, D: D / 100, C: C / 100, A: A / 100 },
    wishlistIds: strategy.wishlistIds,
  };
}

export function toAuctionAssignments(history: RosterPlayer[]): AuctionAssignment[] {
  return history.map((h) => ({ playerId: h.playerId, team: h.boughtByTeam, price: h.cost }));
}
