import { Player, LeagueSettings, StrategySettings, RosterPlayer } from '../types';

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

export function calculateDynamicFairValueBracket(player: Player, totalBudget: number): string {
  const budgetRatio = totalBudget / 500;

  if (player.fairValueBracket) {
    // Parse range e.g. "180-230 FM"
    const match = player.fairValueBracket.match(/(\d+)\s*-\s*(\d+)/);
    if (match) {
      const min = Math.round(parseInt(match[1], 10) * budgetRatio);
      const max = Math.round(parseInt(match[2], 10) * budgetRatio);
      return `${min}-${max} FM`;
    }
  }

  // Fallback dynamic calculation based on basePrice and role
  const basePriceScaled = player.basePrice * budgetRatio;
  let minMult = 2.5;
  let maxMult = 4.0;

  if (player.role === 'A') {
    minMult = 3.5;
    maxMult = 5.5;
  } else if (player.role === 'C') {
    minMult = 2.5;
    maxMult = 4.0;
  } else if (player.role === 'D') {
    minMult = 2.0;
    maxMult = 3.0;
  } else if (player.role === 'P') {
    minMult = 2.5;
    maxMult = 3.5;
  }

  const min = Math.max(1, Math.round(basePriceScaled * minMult));
  const max = Math.max(min + 1, Math.round(basePriceScaled * maxMult));
  return `${min}-${max} FM`;
}

export function getLivePlayerRecommendation(
  player: Player,
  league: LeagueSettings,
  strategy: StrategySettings,
  teamsSummary: TeamSummary[]
): { maxBid: number; reasoning: string } {
  const myTeam = teamsSummary.find((t) => t.isMyTeam);
  const myCredits = myTeam ? myTeam.remainingCredits : league.totalBudget;

  const rolePct = strategy.budgetAllocationPct[player.role] || 25;
  const roleBudget = Math.round((league.totalBudget * rolePct) / 100);

  // Calculate recommended bid based on player tier and base price
  const budgetRatio = league.totalBudget / 500;
  let maxBid = Math.max(1, Math.round(player.basePrice * budgetRatio * (1 + strategy.aggressionScore / 100)));

  if (player.tier === 1) {
    maxBid = Math.min(myCredits - 5, Math.round(roleBudget * 0.55));
  } else if (player.tier === 2) {
    maxBid = Math.min(myCredits - 10, Math.round(roleBudget * 0.3));
  } else {
    maxBid = Math.min(Math.round(15 * budgetRatio), Math.max(1, Math.round(player.basePrice * budgetRatio)));
  }

  maxBid = Math.max(1, maxBid);

  const fairVal = calculateDynamicFairValueBracket(player, league.totalBudget);
  const reasoning = `Modulo ${strategy.preferredFormation} | Fair Value: ${fairVal} | Consigliato max: ${maxBid} FM (${
    player.tier === 1 ? 'TOP di reparto!' : 'Buon acquisto per la rosa.'
  })`;

  return { maxBid, reasoning };
}
