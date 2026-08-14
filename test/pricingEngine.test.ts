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
    const base = strategy({ aggressiveness: 0.5, roleBudgetPct: { P: 0, D: 1, C: 0, A: 0 } });

    const withoutWishlist = priceAllPlayers(players, lg, base, []).get('d1')!;
    const withWishlist = priceAllPlayers(players, lg, { ...base, wishlistIds: ['d1'] }, []).get('d1')!;

    expect(withWishlist.offertaConsigliata).toBeGreaterThan(withoutWishlist.offertaConsigliata);
    // Boost massimo teorico è 15% (BOOST_WHICHLIST_MAX) * aggressività(0.5) = 7.5%.
    const impliedBoost = withWishlist.offertaConsigliata / withoutWishlist.offertaConsigliata - 1;
    expect(impliedBoost).toBeCloseTo(0.075, 2);
  });

  it('con aggressività 0 il whichlist non aggiunge nulla', () => {
    const players = [player({ id: 'd1', role: 'D', fvm: 100 })];
    const lg = league({ rosterSlots: { P: 0, D: 1, C: 0, A: 0 } });
    const base = strategy({ aggressiveness: 0, roleBudgetPct: { P: 0, D: 1, C: 0, A: 0 } });

    const withoutWishlist = priceAllPlayers(players, lg, base, []).get('d1')!;
    const withWishlist = priceAllPlayers(players, lg, { ...base, wishlistIds: ['d1'] }, []).get('d1')!;
    expect(withWishlist.offertaConsigliata).toBe(withoutWishlist.offertaConsigliata);
  });
});

describe('pricingEngine — performance storica', () => {
  // La formula Excel esclude il fattore storico solo se Fm è vuoto o le
  // presenze sono vuote/zero — NON verifica che le presenze superino la
  // soglia minima (quella soglia filtra solo la media di ruolo). Un
  // giocatore con poche presenze riceve comunque un aggiustamento se ha
  // un Fm registrato.
  const lg = league({ rosterSlots: { P: 0, D: 0, C: 0, A: 3 }, numTeams: 1 });
  const strat = strategy({ roleBudgetPct: { P: 0, D: 0, C: 0, A: 1 } });

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
  // 10 giocatori di ruolo A, percentile a scaglioni di 0.1: rank 1-2 Top,
  // 3-4 Buono, 5-7 Media, 8-10 Scommessa (vedi SOGLIE_FASCIA in modelParams.ts).
  const players = [
    player({ id: 'top1-qta1', role: 'A', fvm: 100, qtA: 1 }), // Top, ma Qt.A=1: escluso
    player({ id: 'top2', role: 'A', fvm: 90, qtA: 10 }), // Top, libero: contato
    player({ id: 'buono1', role: 'A', fvm: 80, qtA: 10 }), // Buono, libero: contato
    player({ id: 'buono2-qta1', role: 'A', fvm: 70, qtA: 1 }), // Buono, ma Qt.A=1: escluso
    player({ id: 'media1', role: 'A', fvm: 60, qtA: 10 }), // Media, libero: NON contato (non è Top/Buono)
    player({ id: 'media2', role: 'A', fvm: 50, qtA: 10 }),
    player({ id: 'media3', role: 'A', fvm: 40, qtA: 10 }),
    player({ id: 'scomm1', role: 'A', fvm: 30, qtA: 10 }),
    player({ id: 'scomm2', role: 'A', fvm: 20, qtA: 10 }),
    player({ id: 'scomm3', role: 'A', fvm: 10, qtA: 10 }),
  ];
  const lg = league({ rosterSlots: { P: 0, D: 0, C: 0, A: 5 } });
  const strat = strategy({ roleBudgetPct: { P: 0, D: 0, C: 0, A: 1 } });

  it('esclude i giocatori con Qt.A=1 dai "rimasti" di fascia', () => {
    const stats = computeLeaguePoolStats(players, lg, []);
    expect(stats.byRole.A.topRimasti).toBe(1); // top1-qta1 escluso, resta top2
    expect(stats.byRole.A.buoniRimasti).toBe(1); // buono2-qta1 escluso, resta buono1
  });

  it('la scarsità conta solo i liberi di qualità (Top/Buono), non Media/Scommessa', () => {
    const stats = computeLeaguePoolStats(players, lg, []);
    // Liberi di qualità: top2 + buono1 = 2 (i 6 Media/Scommessa non contano, né top1/buono2 con Qt.A=1)
    expect(stats.byRole.A.giocatoriLiberiListone).toBe(2);
  });
});

describe('pricingEngine — pavimento del modificatore di scarsità', () => {
  // 7 giocatori di ruolo A, fvm 100..70: rank 1-3 sono Top/Buono (percentile
  // 1.0/0.857/0.714), il resto Media/Scommessa. Il target (fvm 100, rank 1)
  // è Titolare in entrambi gli scenari (4 titolari-per-squadra fissi per l'A,
  // vedi TITOLARI_PER_SQUADRA_LEGA in modelParams.ts). sommaFVMTitolari
  // dipende solo da nTitolariLega (numTeams x titolari fissi), non da
  // rosterSlots: il prezzo base del target resta identico nei due scenari,
  // isolando l'effetto del solo modificatore di scarsità.
  const players = [100, 95, 90, 85, 80, 75, 70].map((fvm, i) => player({ id: `p${i}`, role: 'A', fvm, qtA: 10 }));
  const strat = strategy({ aggressiveness: 1, roleBudgetPct: { P: 0, D: 0, C: 0, A: 1 } });

  it('scenario abbondante (rapporto 1.5, sconterebbe -10% con la vecchia formula) dà lo stesso prezzo dello scenario neutro (rapporto 1.0)', () => {
    // Scenario A: 2 slot A in lega, 3 liberi di qualità -> rapporto 3/2 = 1.5 (abbondanza)
    const abundant = priceAllPlayers(players, league({ rosterSlots: { P: 0, D: 0, C: 0, A: 2 } }), strat, []).get('p0')!;
    // Scenario B: 3 slot A in lega, 3 liberi di qualità -> rapporto 3/3 = 1.0 (neutro, invariato anche con la vecchia formula)
    const neutral = priceAllPlayers(players, league({ rosterSlots: { P: 0, D: 0, C: 0, A: 3 } }), strat, []).get('p0')!;

    expect(abundant.value).toBe(neutral.value);
  });
});

describe('pricingEngine — max bid dinamico limitato dal budget', () => {
  it('MIN(Offerta Max, Budget Spendibile) quando il budget residuo è scarso', () => {
    const players = [
      player({ id: 'main', role: 'A', fvm: 1000, qtA: 50 }),
      player({ id: 'dummy', role: 'A', fvm: 10, qtA: 50 }),
    ];
    const lg = league({ rosterSlots: { P: 0, D: 0, C: 0, A: 2 } });
    const strat = strategy({ aggressiveness: 1, roleBudgetPct: { P: 0, D: 0, C: 0, A: 1 } });
    const assignments: AuctionAssignment[] = [{ playerId: 'dummy', team: 'MyTeam', price: 950 }];

    const pricing = priceAllPlayers(players, lg, strat, assignments).get('main')!;
    // budget residuo 50, 1 slot ancora vuoto -> budget spendibile 49
    expect(pricing.offertaMax).toBe(49);
    expect(pricing.offertaConsigliata).toBeGreaterThan(pricing.offertaMax);
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
    const strat = strategy({ aggressiveness: 1, roleBudgetPct: { P: 0, D: 0, C: 0, A: 1 } });

    const pricing = priceAllPlayers(players, lg, strat, []);
    expect(pricing.get('ok')!.sostenibilita.label).toBe('OK');
    expect(pricing.get('attenzione')!.sostenibilita.label).toBe('Attenzione');
    expect(pricing.get('rischio')!.sostenibilita.label).toBe('Rischio Alto');
  });
});

// I portieri hanno titolari-per-squadra fisso a 1 (TITOLARI_PER_SQUADRA_LEGA.P,
// invariato dal cambiamento del punto 1: solo D/C/A sono passati a un numero
// fisso indipendente dal modulo). Uso il ruolo P in questi test per tenere
// titolariResidui piccolo e facile da verificare a mano (numTeams x 1).
describe('pricingEngine — pressione di ruolo', () => {
  it('verde quando Top+Buoni rimasti >= 2x i titolari residui', () => {
    const players = [
      player({ id: 'p1', role: 'P', fvm: 100, qtA: 10 }), // Top
      player({ id: 'p2', role: 'P', fvm: 90, qtA: 10 }), // Buono
      player({ id: 'p3', role: 'P', fvm: 50, qtA: 10 }), // Media
      player({ id: 'p4', role: 'P', fvm: 10, qtA: 10 }), // Scommessa
    ];
    const lg = league({ rosterSlots: { P: 2, D: 0, C: 0, A: 0 } }); // numTeams=1 -> 1 titolare P in lega
    const strat = strategy({ roleBudgetPct: { P: 1, D: 0, C: 0, A: 0 } });

    const pricing = priceAllPlayers(players, lg, strat, []).get('p1')!;
    expect(pricing.titolareORiserva).toBe('Titolare');
    expect(pricing.urgenza.level).toBe('verde');
    expect(pricing.urgenza.countRimasti).toBe(2); // p1 (Top) + p2 (Buono)
    expect(pricing.urgenza.denominatore).toBe(1); // 1 titolare, nessuno ancora preso
  });

  it('rosso quando i titolari residui superano abbondantemente Top+Buoni rimasti', () => {
    const players = ([100, 90, 70, 50, 30, 10] as const).map((fvm, i) =>
      player({ id: `p${i + 1}`, role: 'P', fvm, qtA: 10 })
    );
    // 4 squadre in lega -> 4 titolari P (1 a testa): Top+Buoni rimasti (2) / 4 = 0.5 -> rosso
    const lg = league({ numTeams: 4, rosterSlots: { P: 2, D: 0, C: 0, A: 0 } });
    const strat = strategy({ roleBudgetPct: { P: 1, D: 0, C: 0, A: 0 } });

    const pricing = priceAllPlayers(players, lg, strat, []).get('p1')!;
    expect(pricing.titolareORiserva).toBe('Titolare');
    expect(pricing.urgenza.level).toBe('rosso');
  });

  it('"ruolo esaurito" quando slot e titolari sono tutti assegnati', () => {
    const players = [player({ id: 'p1', role: 'P', fvm: 100, qtA: 10 })];
    const lg = league({ rosterSlots: { P: 1, D: 0, C: 0, A: 0 } });
    const strat = strategy({ roleBudgetPct: { P: 1, D: 0, C: 0, A: 0 } });
    const assignments: AuctionAssignment[] = [{ playerId: 'p1', team: 'Altra Squadra', price: 50 }];

    const pricing = priceAllPlayers(players, lg, strat, assignments).get('p1')!;
    expect(pricing.urgenza.level).toBe('esaurito');
    expect(pricing.urgenza.label).toBe('— (ruolo esaurito)');
  });

  it('"titolari esauriti (solo riserve)" quando i titolari sono finiti ma restano slot di riserva', () => {
    const players = [
      player({ id: 'p1', role: 'P', fvm: 100, qtA: 10 }), // Titolare, verrà assegnato
      player({ id: 'p2', role: 'P', fvm: 10, qtA: 10 }), // Riserva, libero
    ];
    const lg = league({ rosterSlots: { P: 2, D: 0, C: 0, A: 0 } });
    const strat = strategy({ roleBudgetPct: { P: 1, D: 0, C: 0, A: 0 } });
    const assignments: AuctionAssignment[] = [{ playerId: 'p1', team: 'Altra Squadra', price: 50 }];

    const pricing = priceAllPlayers(players, lg, strat, assignments).get('p1')!;
    expect(pricing.urgenza.level).toBe('esaurito');
    expect(pricing.urgenza.label).toBe('🟠 Titolari esauriti (solo riserve)');
  });

  it('usa il segnale sulle riserve (non sui titolari) quando il giocatore chiamato è lui stesso una riserva', () => {
    const players = [
      player({ id: 'titolare', role: 'P', fvm: 100, qtA: 10 }),
      player({ id: 'riserva', role: 'P', fvm: 10, qtA: 10 }),
    ];
    const lg = league({ rosterSlots: { P: 2, D: 0, C: 0, A: 0 } });
    const strat = strategy({ roleBudgetPct: { P: 1, D: 0, C: 0, A: 0 } });

    const pricing = priceAllPlayers(players, lg, strat, []).get('riserva')!;
    expect(pricing.titolareORiserva).toBe('Riserva');
    // 1 riserva libera (se stessa, fascia "Nella Media" col percentile 0.5) su 1 slot di riserva residuo -> ratio 1 -> giallo
    expect(pricing.urgenza.level).toBe('giallo');
    expect(pricing.urgenza.label).toBe('🟡 Riserve nella norma');
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
    const strat = strategy({ roleBudgetPct: { P: 0.25, D: 0.25, C: 0.25, A: 0.25 } });

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
