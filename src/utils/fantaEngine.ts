import { Player, LeagueSettings, RosterPlayer } from '../types';
import { PlayerPricing } from '../engine/types';

export interface TeamSummary {
  teamName: string;
  isMyTeam: boolean;
  initialBudget: number;
  totalSpent: number;
  remainingCredits: number;
  playersBoughtCount: number;
  slotsByRole: { P: number; D: number; C: number; A: number };
  slotsRemainingByRole: { P: number; D: number; C: number; A: number };
  totalSlotsNeeded: number;
  maxPossibleBid: number;
  averageCreditPerSlotRemaining: number;
}

export function calculateTeamsSummary(
  league: LeagueSettings,
  auctionHistory: RosterPlayer[],
  allPlayers?: Player[]
): TeamSummary[] {
  const teams: string[] = league.participants.map((p) => p.name);

  return teams.map((tName) => {
    const participant = league.participants.find((p) => p.name === tName);
    const isMy = participant?.isMyTeam || tName === 'FC Real Fantasia';
    const initBudget = league.equalInitialCredits
      ? league.totalBudget
      : participant?.initialBudget || league.totalBudget;

    const teamBids = auctionHistory.filter((b) => b.boughtByTeam === tName);
    const totalSpent = teamBids.reduce((acc, b) => acc + b.cost, 0);
    const remainingCredits = Math.max(0, initBudget - totalSpent);

    const slotsByRole = { P: 0, D: 0, C: 0, A: 0 };
    if (allPlayers) {
      teamBids.forEach((bid) => {
        const player = allPlayers.find((p) => p.id === bid.playerId);
        if (player && player.role in slotsByRole) {
          slotsByRole[player.role as keyof typeof slotsByRole]++;
        }
      });
    }

    const slotsRemainingByRole = {
      P: Math.max(0, league.rosterSlots.P - slotsByRole.P),
      D: Math.max(0, league.rosterSlots.D - slotsByRole.D),
      C: Math.max(0, league.rosterSlots.C - slotsByRole.C),
      A: Math.max(0, league.rosterSlots.A - slotsByRole.A),
    };

    const totalTargetSlots =
      league.rosterSlots.P +
      league.rosterSlots.D +
      league.rosterSlots.C +
      league.rosterSlots.A;

    const playersBoughtCount = teamBids.length;
    const totalSlotsNeeded = Math.max(0, totalTargetSlots - playersBoughtCount);

    // Max bid rule: Remaining Credits - (Total Remaining Slots - 1) * 1
    const maxPossibleBid =
      totalSlotsNeeded > 0
        ? Math.max(1, remainingCredits - (totalSlotsNeeded - 1))
        : 0;

    const averageCreditPerSlotRemaining =
      totalSlotsNeeded > 0
        ? Number((remainingCredits / totalSlotsNeeded).toFixed(1))
        : 0;

    return {
      teamName: tName,
      isMyTeam: isMy,
      initialBudget: initBudget,
      totalSpent,
      remainingCredits,
      playersBoughtCount,
      slotsByRole,
      slotsRemainingByRole,
      totalSlotsNeeded,
      maxPossibleBid,
      averageCreditPerSlotRemaining,
    };
  });
}

/**
 * Range Fair Value da mostrare in UI: usa il range min/max già calcolato dal
 * motore di pricing reale (src/engine/pricingEngine.ts, stesso numero da cui
 * arriva il Max Bid) per questo giocatore — niente riscalatura separata.
 *
 * In passato questo range veniva ricalcolato qui con un moltiplicatore
 * lineare `totalBudget / 500` sul bracket statico del listone (FVM*0.85 -
 * FVM*1.15): con leghe da 1000 crediti (lo standard di fantacalcio.it —
 * l'FVM stesso è già tarato su una lega da 1000 crediti a squadra, vedi
 * player.fvm) il moltiplicatore raddoppiava un numero già corretto, dando
 * range assurdi (es. 630-850 FM per un giocatore che il motore vero
 * prezzava intorno a 430). Il motore non ha questo problema perché il FVM
 * è usato solo in proporzione (quota sul budget di ruolo), mai come cifra
 * assoluta da moltiplicare per il budget totale.
 *
 * Se il motore non ha ancora prezzato questo giocatore (caso raro), usa il
 * bracket statico del listone come fallback, senza inventare fattori di
 * scala aggiuntivi.
 */
export function formatFairValueRange(player: Player, pricing: PlayerPricing | undefined): string {
  if (pricing) {
    return `${pricing.rangeMin}-${pricing.rangeMax} FM`;
  }
  return player.fairValueBracket ?? 'N/D';
}

// La raccomandazione di prezzo live durante l'asta è ora calcolata dal
// motore deterministico in src/engine/pricingEngine.ts (portato 1:1 dal
// modello Excel calibrato), non da questa euristica per tier. Vedi
// src/engine/useWarRoomEngine.ts.
