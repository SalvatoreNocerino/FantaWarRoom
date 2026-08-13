import { describe, it, expect } from 'vitest';
import { priceAllPlayers, computeLeaguePoolStats } from '../src/engine/pricingEngine';
import { EnginePlayer, EngineLeagueConfig, EngineStrategyConfig, AuctionAssignment } from '../src/engine/types';
import { PlayerRole } from '../src/types';

// Unit test sui casi limite della logica di Output Utente. A differenza del
// golden test (che confronta con Excel), qui i numeri sono costruiti a mano
// con FVM/budget tondi per restare verificabili — dove il calcolo produce
// decimali, si sceglie un margine ampio dalla soglia invece di un valore
// esatto, per non rendere il test fragile ai piccoli scostamenti di arrotondamento.

function player(overrides: Partial<EnginePlayer> & Pick<EnginePlayer, 'id' | 'role' | 'fvm'>): EnginePlayer {
  return { name: overrides.id, team: 'Test', qtA: 10, ...overrides };
}

function league(overrides: Partial<EngineLeagueConfig> = {}): EngineLeagueConfig {
  return {
    numTeams: 1,
    totalBudget: 1000,
    rosterSlots: { P: 0, D: 0, C: 0, A: 0 },
    defensiveModifierEnabled: false,
    midfieldModifierEnabled: false,
    myTeamName: 'MyTeam',
    ...overrides,
  };
}

function strategy(overrides: Partial<EngineStrategyConfig> = {}): EngineStrategyConfig {
  return {
    preferredFormation: '0-0-0',
    aggressiveness: 1,
    roleBudgetPct: { P: 0.25, D: 0.25, C: 0.25, A: 0.25 },
    wishlistIds: [],
    ...overrides,
  };
}

describe('pricingEngine — whichlist boost', () => {
  it('scala con l\'aggressività (0 = nessun boost, pieno = boost massimo)', () => {
    const players = [player({ id: 'd1', role: 'D', fvm: 100 })];
    const lg = league({ rosterSlots: { P: 0, D: 1, C: 0, A: 0 } });
    const base = strategy({ preferredFormation: '1-0-0', aggressiveness: 0.5, roleBudgetPct: { P: 0, D: 1, C: 0, A: 0 } });

    const withoutWishlist = priceAllPlayers(players, lg, base, []).get('d1')!;
    const withWishlist = priceAllPlayers(players, lg, { ...base, wishlistIds: ['d1'] }, []).get('d1')!;

    expect(withWishlist.maxBidStrategico).toBeGreaterThan(withoutWishlist.maxBidStrategico);
    // Boost massimo teorico è 15% (BOOST_WHICHLIST_MAX) * aggressività(0.5) = 7.5%.
    const impliedBoost = withWishlist.maxBidStrategico / withoutWishlist.maxBidStrategico - 1;
    expect(impliedBoost).toBeCloseTo(0.075, 2);
  });

  it('con aggressività 0 il whichlist non aggiunge nulla', () => {
    const players = [player({ id: 'd1', role: 'D', fvm: 100 })];
    const lg = league({ rosterSlots: { P: 0, D: 1, C: 0, A: 0 } });
    const base = strategy({ preferredFormation: '1-0-0', aggressiveness: 0, roleBudgetPct: { P: 0, D: 1, C: 0, A: 0 } });

    const withoutWishlist = priceAllPlayers(players, lg, base, []).get('d1')!;
    const withWishlist = priceAllPlayers(players, lg, { ...base, wishlistIds: ['d1'] }, []).get('d1')!;
    expect(withWishlist.maxBidStrategico).toBe(withoutWishlist.maxBidStrategico);
  });
});

describe('pricingEngine — performance storica', () => {
  // La formula Excel esclude il fattore storico solo se Fm è vuoto o le
  // presenze sono vuote/zero — NON verifica che le presenze superino la
  // soglia minima (quella soglia filtra solo la media di ruolo). Un
  // giocatore con poche presenze riceve comunque un aggiustamento se ha
  // un Fm registrato.
  const lg = league({ rosterSlots: { P: 0, D: 0, C: 0, A: 3 }, numTeams: 1 });
  const strat = strategy({ preferredFormation: '0-0-3', roleBudgetPct: { P: 0, D: 0, C: 0, A: 1 } });

  it('un giocatore sotto soglia presenze riceve comunque il fattore individuale', () => {
    const players = [
      player({ id: 'high', role: 'A', fvm: 300, presenze: 20, fm: 8 }), // sopra soglia, alza la media
      player({ id: 'low', role: 'A', fvm: 300, presenze: 20, fm: 6 }), // sopra soglia, abbassa la media
      player({ id: 'thin', role: 'A', fvm: 300, presenze: 3, fm: 9 }), // sotto soglia (10): media di ruolo = (8+6)/2 = 7
      player({ id: 'nodata', role: 'A', fvm: 300 }), // nessuno storico: fattore neutro
    ];
    const pricing = priceAllPlayers(players, lg, strat, []);

    // 'thin' ha lo stesso FVM di 'nodata' ma un Fm sopra media (9 vs media 7):
    // deve ricevere un prezzo più alto, dimostrando che il confronto individuale
    // avviene anche sotto la soglia minima di presenze.
    expect(pricing.get('thin')!.value).toBeGreaterThan(pricing.get('nodata')!.value);
  });

  it('presenze=0 o storico assente restano neutri (fattore = 1)', () => {
    const players = [
      player({ id: 'zero', role: 'A', fvm: 300, presenze: 0, fm: 9 }),
      player({ id: 'nodata', role: 'A', fvm: 300 }),
    ];
    const pricing = priceAllPlayers(players, lg, strat, []);
    expect(pricing.get('zero')!.value).toBe(pricing.get('nodata')!.value);
  });
});

describe('pricingEngine — scarsità e Qt.A=1', () => {
  it('esclude i giocatori con Qt.A=1 dai liberi e dai "rimasti" di fascia', () => {
    const players = [
      player({ id: 'top-qta1', role: 'A', fvm: 300, qtA: 1 }), // sarà fascia Top, ma Qt.A=1
      player({ id: 'media', role: 'A', fvm: 200, qtA: 10 }),
      player({ id: 'scommessa', role: 'A', fvm: 100, qtA: 10 }),
    ];
    const lg = league({ rosterSlots: { P: 0, D: 0, C: 0, A: 1 } });
    const strat = strategy({ preferredFormation: '0-0-1', roleBudgetPct: { P: 0, D: 0, C: 0, A: 1 } });

    const stats = computeLeaguePoolStats(players, lg, strat, []);
    expect(stats.byRole.A.topRimasti).toBe(0); // l'unico Top ha Qt.A=1, escluso
    expect(stats.byRole.A.giocatoriLiberiListone).toBe(2); // solo i due con Qt.A>1
  });
});

describe('pricingEngine — max bid dinamico limitato dal budget', () => {
  it('MIN(Offerta Max, Budget Spendibile) quando il budget residuo è scarso', () => {
    const players = [
      player({ id: 'main', role: 'A', fvm: 1000, qtA: 50 }),
      player({ id: 'dummy', role: 'A', fvm: 10, qtA: 50 }),
    ];
    const lg = league({ rosterSlots: { P: 0, D: 0, C: 0, A: 2 } });
    const strat = strategy({ preferredFormation: '0-0-1', aggressiveness: 1, roleBudgetPct: { P: 0, D: 0, C: 0, A: 1 } });
    const assignments: AuctionAssignment[] = [{ playerId: 'dummy', team: 'MyTeam', price: 950 }];

    const pricing = priceAllPlayers(players, lg, strat, assignments).get('main')!;
    // budget residuo 50, 1 slot ancora vuoto -> budget spendibile 49
    expect(pricing.maxBidDinamico).toBe(49);
    expect(pricing.maxBidStrategico).toBeGreaterThan(pricing.maxBidDinamico);
  });
});

describe('pricingEngine — sostenibilità budget', () => {
  it('classifica OK / Attenzione / Rischio Alto in base al credito medio per slot', () => {
    const players = [
      player({ id: 'ok', role: 'A', fvm: 50 }),
      player({ id: 'attenzione', role: 'A', fvm: 110 }),
      player({ id: 'rischio', role: 'A', fvm: 500 }),
      player({ id: 'filler1', role: 'A', fvm: 30 }),
      player({ id: 'filler2', role: 'A', fvm: 20 }),
    ];
    // 10 slot A, budget 1000, rosa vuota -> credito medio per slot = 100.
    // Soglie: OK <= 150, Attenzione <= 300, oltre Rischio Alto.
    const lg = league({ rosterSlots: { P: 0, D: 0, C: 0, A: 10 } });
    const strat = strategy({ preferredFormation: '0-0-5', aggressiveness: 1, roleBudgetPct: { P: 0, D: 0, C: 0, A: 1 } });

    const pricing = priceAllPlayers(players, lg, strat, []);
    expect(pricing.get('ok')!.sostenibilita.label).toBe('OK');
    expect(pricing.get('attenzione')!.sostenibilita.label).toBe('Attenzione');
    expect(pricing.get('rischio')!.sostenibilita.label).toBe('Rischio Alto');
  });
});

describe('pricingEngine — pressione di ruolo', () => {
  it('verde quando Top+Buoni rimasti >= 2x i titolari residui', () => {
    const players = [
      player({ id: 'p1', role: 'A', fvm: 100, qtA: 10 }), // Top
      player({ id: 'p2', role: 'A', fvm: 90, qtA: 10 }), // Buono
      player({ id: 'p3', role: 'A', fvm: 50, qtA: 10 }), // Media
      player({ id: 'p4', role: 'A', fvm: 10, qtA: 10 }), // Scommessa
    ];
    const lg = league({ rosterSlots: { P: 0, D: 0, C: 0, A: 2 } });
    const strat = strategy({ preferredFormation: '0-0-1', roleBudgetPct: { P: 0, D: 0, C: 0, A: 1 } });

    const pricing = priceAllPlayers(players, lg, strat, []).get('p1')!;
    expect(pricing.titolareORiserva).toBe('Titolare');
    expect(pricing.pressioneRuolo.level).toBe('verde');
    expect(pricing.pressioneRuolo.countRimasti).toBe(2); // p1 (Top) + p2 (Buono)
    expect(pricing.pressioneRuolo.denominatore).toBe(1); // 1 titolare, nessuno ancora preso
  });

  it('rosso quando i titolari residui superano abbondantemente Top+Buoni rimasti', () => {
    const players = ([100, 90, 70, 50, 30, 10] as const).map((fvm, i) =>
      player({ id: `p${i + 1}`, role: 'A', fvm, qtA: 10 })
    );
    const lg = league({ rosterSlots: { P: 0, D: 0, C: 0, A: 5 } });
    const strat = strategy({ preferredFormation: '0-0-4', roleBudgetPct: { P: 0, D: 0, C: 0, A: 1 } });

    const pricing = priceAllPlayers(players, lg, strat, []).get('p1')!;
    expect(pricing.titolareORiserva).toBe('Titolare');
    expect(pricing.pressioneRuolo.level).toBe('rosso');
  });

  it('"ruolo esaurito" quando slot e titolari sono tutti assegnati', () => {
    const players = [player({ id: 'p1', role: 'A', fvm: 100, qtA: 10 })];
    const lg = league({ rosterSlots: { P: 0, D: 0, C: 0, A: 1 } });
    const strat = strategy({ preferredFormation: '0-0-1', roleBudgetPct: { P: 0, D: 0, C: 0, A: 1 } });
    const assignments: AuctionAssignment[] = [{ playerId: 'p1', team: 'Altra Squadra', price: 50 }];

    const pricing = priceAllPlayers(players, lg, strat, assignments).get('p1')!;
    expect(pricing.pressioneRuolo.level).toBe('esaurito');
    expect(pricing.pressioneRuolo.label).toBe('— (ruolo esaurito)');
  });

  it('"titolari esauriti (solo riserve)" quando i titolari sono finiti ma restano slot di riserva', () => {
    const players = [
      player({ id: 'p1', role: 'A', fvm: 100, qtA: 10 }), // Titolare, verrà assegnato
      player({ id: 'p2', role: 'A', fvm: 10, qtA: 10 }), // Riserva, libero
    ];
    const lg = league({ rosterSlots: { P: 0, D: 0, C: 0, A: 2 } });
    const strat = strategy({ preferredFormation: '0-0-1', roleBudgetPct: { P: 0, D: 0, C: 0, A: 1 } });
    const assignments: AuctionAssignment[] = [{ playerId: 'p1', team: 'Altra Squadra', price: 50 }];

    const pricing = priceAllPlayers(players, lg, strat, assignments).get('p1')!;
    expect(pricing.pressioneRuolo.level).toBe('esaurito');
    expect(pricing.pressioneRuolo.label).toBe('🟠 Titolari esauriti (solo riserve)');
  });

  it('usa il segnale sulle riserve (non sui titolari) quando il giocatore chiamato è lui stesso una riserva', () => {
    const players = [
      player({ id: 'titolare', role: 'A', fvm: 100, qtA: 10 }),
      player({ id: 'riserva', role: 'A', fvm: 10, qtA: 10 }),
    ];
    const lg = league({ rosterSlots: { P: 0, D: 0, C: 0, A: 2 } });
    const strat = strategy({ preferredFormation: '0-0-1', roleBudgetPct: { P: 0, D: 0, C: 0, A: 1 } });

    const pricing = priceAllPlayers(players, lg, strat, []).get('riserva')!;
    expect(pricing.titolareORiserva).toBe('Riserva');
    // 1 riserva libera (se stessa, fascia "Nella Media" col percentile 0.5) su 1 slot di riserva residuo -> ratio 1 -> giallo
    expect(pricing.pressioneRuolo.level).toBe('giallo');
    expect(pricing.pressioneRuolo.label).toBe('🟡 Riserve nella norma');
  });
});

describe('pricingEngine — modificatore di ruolo', () => {
  it('il boost si applica solo a D/C quando il modificatore di lega è attivo, non a P/A', () => {
    const roles: PlayerRole[] = ['P', 'D', 'C', 'A'];
    const players = roles.map((role) => player({ id: `x-${role}`, role, fvm: 100 }));
    const lg = (defOn: boolean, midOn: boolean) =>
      league({
        rosterSlots: { P: 1, D: 1, C: 1, A: 1 },
        defensiveModifierEnabled: defOn,
        midfieldModifierEnabled: midOn,
      });
    const strat = strategy({ preferredFormation: '1-1-1', roleBudgetPct: { P: 0.25, D: 0.25, C: 0.25, A: 0.25 } });

    const off = priceAllPlayers(players, lg(false, false), strat, []);
    const on = priceAllPlayers(players, lg(true, true), strat, []);

    // toBeCloseTo con poca precisione: entrambi i lati sono arrotondati
    // indipendentemente (ROUND si applica dopo il modificatore), quindi il
    // rapporto tra i due interi non è mai esattamente 1.15.
    expect(on.get('x-D')!.value / off.get('x-D')!.value).toBeCloseTo(1.15, 1);
    expect(on.get('x-C')!.value / off.get('x-C')!.value).toBeCloseTo(1.15, 1);
    expect(on.get('x-P')!.value).toBe(off.get('x-P')!.value);
    expect(on.get('x-A')!.value).toBe(off.get('x-A')!.value);
  });
});
