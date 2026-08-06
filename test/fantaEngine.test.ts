import { describe, it, expect } from 'vitest';
import {
  calculateTeamsSummary,
  calculateDynamicFairValueBracket,
  getLivePlayerRecommendation,
} from '../src/utils/fantaEngine';
import { LeagueSettings, StrategySettings, Player, RosterPlayer } from '../src/types';

function makeLeague(overrides: Partial<LeagueSettings> = {}): LeagueSettings {
  return {
    name: 'Lega Test',
    numTeams: 2,
    totalBudget: 500,
    equalInitialCredits: true,
    rosterSlots: { P: 3, D: 8, C: 8, A: 6 },
    participants: [
      { name: 'La mia squadra', isMyTeam: true, initialBudget: 500 },
      { name: 'Avversario', isMyTeam: false, initialBudget: 500 },
    ],
    bonusRules: [],
    defensiveModifier: { enabled: false, tiers: [] },
    midfieldModifier: { enabled: false, tiers: [] },
    auctionRules: { callOrderRule: 'free' },
    selectableFormations: ['4-3-3'],
    ...overrides,
  };
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    name: 'Giocatore Test',
    role: 'A',
    team: 'Inter',
    basePrice: 20,
    expectedFantaAvg: 7,
    expectedGoalsAssists: '10G',
    tier: 3,
    notes: '',
    ...overrides,
  };
}

describe('calculateTeamsSummary', () => {
  it('calcola crediti residui e slot rimanenti correttamente dopo alcuni acquisti', () => {
    const league = makeLeague();
    const players: Player[] = [
      makePlayer({ id: 'p1', role: 'A' }),
      makePlayer({ id: 'p2', role: 'D' }),
    ];
    const history: RosterPlayer[] = [
      { id: 'h1', playerId: 'p1', boughtByTeam: 'La mia squadra', cost: 50, timestamp: 1 },
      { id: 'h2', playerId: 'p2', boughtByTeam: 'La mia squadra', cost: 10, timestamp: 2 },
    ];

    const summary = calculateTeamsSummary(league, history, players);
    const mine = summary.find((t) => t.teamName === 'La mia squadra')!;

    expect(mine.totalSpent).toBe(60);
    expect(mine.remainingCredits).toBe(440);
    expect(mine.slotsByRole.A).toBe(1);
    expect(mine.slotsByRole.D).toBe(1);
    // 3+8+8+6 = 25 slot totali, 2 giocatori già presi -> 23 rimanenti
    expect(mine.totalSlotsNeeded).toBe(23);
  });

  it('applica la regola N-1 per il massimo rilancio possibile', () => {
    const league = makeLeague({ rosterSlots: { P: 1, D: 1, C: 1, A: 1 } }); // 4 slot totali
    const history: RosterPlayer[] = [
      { id: 'h1', playerId: 'p1', boughtByTeam: 'La mia squadra', cost: 100, timestamp: 1 },
    ];

    const summary = calculateTeamsSummary(league, history, [makePlayer({ id: 'p1' })]);
    const mine = summary.find((t) => t.teamName === 'La mia squadra')!;

    // 500 - 100 = 400 residui, 3 slot rimanenti -> max bid = 400 - (3-1) = 398
    expect(mine.remainingCredits).toBe(400);
    expect(mine.totalSlotsNeeded).toBe(3);
    expect(mine.maxPossibleBid).toBe(398);
  });

  it('non va mai sotto 1 credito di offerta massima anche con budget quasi esaurito', () => {
    const league = makeLeague({ rosterSlots: { P: 1, D: 1, C: 1, A: 1 } });
    const history: RosterPlayer[] = [
      { id: 'h1', playerId: 'p1', boughtByTeam: 'La mia squadra', cost: 497, timestamp: 1 },
    ];

    const summary = calculateTeamsSummary(league, history, [makePlayer({ id: 'p1' })]);
    const mine = summary.find((t) => t.teamName === 'La mia squadra')!;

    expect(mine.remainingCredits).toBe(3);
    expect(mine.maxPossibleBid).toBeGreaterThanOrEqual(1);
  });

  it('non scende mai sotto zero crediti anche se si spende oltre il budget iniziale', () => {
    const league = makeLeague();
    const history: RosterPlayer[] = [
      { id: 'h1', playerId: 'p1', boughtByTeam: 'La mia squadra', cost: 9999, timestamp: 1 },
    ];

    const summary = calculateTeamsSummary(league, history, [makePlayer({ id: 'p1' })]);
    const mine = summary.find((t) => t.teamName === 'La mia squadra')!;

    expect(mine.remainingCredits).toBe(0);
  });
});

describe('calculateDynamicFairValueBracket', () => {
  it('scala una fascia esplicita in proporzione al budget della lega', () => {
    const player = makePlayer({ fairValueBracket: '100-200 FM' });
    // budget 250 -> ratio 0.5
    expect(calculateDynamicFairValueBracket(player, 250)).toBe('50-100 FM');
    // budget 500 -> ratio 1 (nessuna variazione)
    expect(calculateDynamicFairValueBracket(player, 500)).toBe('100-200 FM');
  });

  it('usa una stima dinamica per ruolo quando manca la fascia esplicita', () => {
    const attaccante = makePlayer({ role: 'A', basePrice: 10, fairValueBracket: undefined });
    const difensore = makePlayer({ role: 'D', basePrice: 10, fairValueBracket: undefined });

    const rangeAttaccante = calculateDynamicFairValueBracket(attaccante, 500);
    const rangeDifensore = calculateDynamicFairValueBracket(difensore, 500);

    // Gli attaccanti hanno moltiplicatori più alti dei difensori a parità di quotazione base
    const [minA] = rangeAttaccante.split('-').map((s) => parseInt(s, 10));
    const [minD] = rangeDifensore.split('-').map((s) => parseInt(s, 10));
    expect(minA).toBeGreaterThan(minD);
  });
});

describe('getLivePlayerRecommendation', () => {
  const strategy: StrategySettings = {
    preferredFormation: '4-3-3',
    aggressionScore: 50,
    budgetAllocationPct: { P: 8, D: 15, C: 27, A: 50 },
    wishlistIds: [],
    blacklistIds: [],
  };

  it('consiglia un budget più alto per un giocatore tier 1 rispetto a un tier 3', () => {
    const league = makeLeague();
    const teamsSummary = calculateTeamsSummary(league, [], []);

    const top = makePlayer({ id: 'top', tier: 1, basePrice: 60 });
    const scommessa = makePlayer({ id: 'low', tier: 3, basePrice: 5 });

    const recoTop = getLivePlayerRecommendation(top, league, strategy, teamsSummary);
    const recoLow = getLivePlayerRecommendation(scommessa, league, strategy, teamsSummary);

    expect(recoTop.maxBid).toBeGreaterThan(recoLow.maxBid);
    expect(recoTop.maxBid).toBeGreaterThan(0);
  });

  it('non consiglia mai di offrire più dei crediti residui della mia squadra', () => {
    const league = makeLeague();
    const history: RosterPlayer[] = [
      { id: 'h1', playerId: 'other', boughtByTeam: 'La mia squadra', cost: 490, timestamp: 1 },
    ];
    const teamsSummary = calculateTeamsSummary(league, history, [makePlayer({ id: 'other' })]);

    const top = makePlayer({ id: 'top', tier: 1, basePrice: 80 });
    const reco = getLivePlayerRecommendation(top, league, strategy, teamsSummary);

    const myCredits = teamsSummary.find((t) => t.isMyTeam)!.remainingCredits;
    expect(reco.maxBid).toBeLessThanOrEqual(myCredits);
  });
});
