import { describe, it, expect } from 'vitest';
import { calculateTeamsSummary, formatFairValueRange } from '../src/utils/fantaEngine';
import { LeagueSettings, Player, RosterPlayer } from '../src/types';
import { PlayerPricing } from '../src/engine/types';

function makePricing(overrides: Partial<PlayerPricing> = {}): PlayerPricing {
  return {
    playerId: 'p1',
    value: 150,
    rangeMin: 120,
    rangeMax: 180,
    offertaConsigliata: 150,
    offertaMax: 150,
    fascia: 'Top',
    rankFvmRuolo: 1,
    titolareORiserva: 'Titolare',
    isWhichlist: false,
    urgenza: { level: 'verde', countRimasti: 0, denominatore: 0, label: '' },
    sostenibilita: { level: null, label: '' },
    ...overrides,
  };
}

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
    defensiveModifier: { enabled: false },
    midfieldModifier: { enabled: false },
    auctionRules: { callOrderRule: 'free' },
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

describe('formatFairValueRange', () => {
  it('usa il range min/max del motore di pricing quando disponibile', () => {
    const player = makePlayer({ fairValueBracket: '100-200 FM' });
    const pricing = makePricing({ rangeMin: 130, rangeMax: 210 });
    // Il bracket statico del listone (100-200) viene ignorato: conta solo
    // il range calcolato dal motore per il budget/lega reali.
    expect(formatFairValueRange(player, pricing)).toBe('130-210 FM');
  });

  it('usa il bracket statico del listone come fallback quando il motore non ha ancora prezzato il giocatore', () => {
    const player = makePlayer({ fairValueBracket: '100-200 FM' });
    expect(formatFairValueRange(player, undefined)).toBe('100-200 FM');
  });

  it('restituisce N/D se non c\'è né pricing né bracket statico', () => {
    const player = makePlayer({ fairValueBracket: undefined });
    expect(formatFairValueRange(player, undefined)).toBe('N/D');
  });
});

// La vecchia euristica getLivePlayerRecommendation() è stata rimossa: la
// raccomandazione di prezzo live ora viene dal motore deterministico in
// src/engine/pricingEngine.ts, verificato da test/pricingEngine.golden.test.ts
// e test/pricingEngine.test.ts.
