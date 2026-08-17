import { describe, it, expect, beforeEach } from 'vitest';
import { installLocalStorageMock } from './helpers/localStorageMock';

installLocalStorageMock();

const {
  loadAppData,
  saveAppData,
  resetAppData,
  STORAGE_KEY,
  DEFAULT_LEAGUE_SETTINGS,
  DEFAULT_STRATEGY_SETTINGS,
} = await import('../src/utils/storage');

beforeEach(() => {
  (globalThis as any).localStorage.clear();
});

describe('loadAppData', () => {
  it('restituisce i default quando non c\'è nulla salvato', () => {
    const data = loadAppData();
    expect(data.league).toEqual(DEFAULT_LEAGUE_SETTINGS);
    expect(data.strategy).toEqual(DEFAULT_STRATEGY_SETTINGS);
    expect(data.customPlayers).toEqual([]);
    expect(data.auctionHistory).toEqual([]);
  });

  it('unisce un backup parziale ai default senza perdere i dati salvati', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ league: { name: 'Lega Amici', numTeams: 10 } })
    );

    const data = loadAppData();
    expect(data.league.name).toBe('Lega Amici');
    expect(data.league.numTeams).toBe(10);
    // campi non presenti nel backup -> restano quelli di default
    expect(data.league.totalBudget).toBe(DEFAULT_LEAGUE_SETTINGS.totalBudget);
    expect(data.league.rosterSlots).toEqual(DEFAULT_LEAGUE_SETTINGS.rosterSlots);
  });

  it('scarta un modulo preferito non tra quelli selezionabili e ricade sul default', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ strategy: { preferredFormation: '9-9-9-non-valido' } })
    );

    const data = loadAppData();
    expect(data.strategy.preferredFormation).toBe('3-4-3');
  });

  it('filtra le formazioni selezionabili non valide e non resta mai con lista vuota', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ league: { selectableFormations: ['3-4-2-1', 'non-valido'] } })
    );

    const data = loadAppData();
    expect(data.league.selectableFormations.length).toBeGreaterThan(0);
    data.league.selectableFormations.forEach((f: string) => {
      expect(f).not.toBe('3-4-2-1');
    });
  });

  it('non va in crash su JSON salvato corrotto e ripristina i default', () => {
    localStorage.setItem(STORAGE_KEY, '{ questo non è json valido');
    const data = loadAppData();
    expect(data.league).toEqual(DEFAULT_LEAGUE_SETTINGS);
  });
});

describe('saveAppData + loadAppData round-trip', () => {
  it('salva e ricarica correttamente uno stato personalizzato', () => {
    const custom = {
      league: { ...DEFAULT_LEAGUE_SETTINGS, name: 'Lega Salvatore', totalBudget: 300 },
      strategy: { ...DEFAULT_STRATEGY_SETTINGS, aggressionScore: 80 },
      importedListone: null,
      customPlayers: [],
      auctionHistory: [],
    };

    saveAppData(custom);
    const reloaded = loadAppData();

    expect(reloaded.league.name).toBe('Lega Salvatore');
    expect(reloaded.league.totalBudget).toBe(300);
    expect(reloaded.strategy.aggressionScore).toBe(80);
  });
});

describe('resetAppData', () => {
  it('riporta tutto ai default e lo persiste', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ league: { name: 'Lega da cancellare' } }));

    const fresh = resetAppData();
    expect(fresh.league).toEqual(DEFAULT_LEAGUE_SETTINGS);

    const reloaded = loadAppData();
    expect(reloaded.league.name).toBe(DEFAULT_LEAGUE_SETTINGS.name);
  });
});

describe('engineSnapshot persistence', () => {
  it('salva e ricarica un\'asta con engineSnapshot completo', () => {
    const auctionWithSnapshot = {
      league: DEFAULT_LEAGUE_SETTINGS,
      strategy: DEFAULT_STRATEGY_SETTINGS,
      importedListone: null,
      customPlayers: [],
      auctionHistory: [
        {
          id: 'bid_test_001',
          playerId: 'player_1',
          boughtByTeam: 'Squadra 1',
          cost: 35,
          timestamp: Date.now(),
          engineSnapshot: {
            offertaMax: 38,
            value: 36,
            rangeMin: 30,
            rangeMax: 45,
            rankFvmRuolo: 5,
            titolareORiserva: 'Titolare',
            playerTier: 2,
            playerFvm: 150,
            playerMv: 6.5,
            playerFm: 6.2,
            buyerRemainingBefore: 150,
          },
        },
      ],
    };

    saveAppData(auctionWithSnapshot);
    const reloaded = loadAppData();

    expect(reloaded.auctionHistory).toHaveLength(1);
    expect(reloaded.auctionHistory[0].engineSnapshot).toBeDefined();
    expect(reloaded.auctionHistory[0].engineSnapshot?.offertaMax).toBe(38);
    expect(reloaded.auctionHistory[0].engineSnapshot?.playerTier).toBe(2);
    expect(reloaded.auctionHistory[0].cost).toBe(35);
  });

  it('gestisce correttamente aste senza engineSnapshot (retrocompatibilità)', () => {
    const oldAuction = {
      league: DEFAULT_LEAGUE_SETTINGS,
      strategy: DEFAULT_STRATEGY_SETTINGS,
      importedListone: null,
      customPlayers: [],
      auctionHistory: [
        {
          id: 'bid_old_001',
          playerId: 'player_1',
          boughtByTeam: 'Squadra 1',
          cost: 35,
          timestamp: Date.now(),
        },
      ],
    };

    saveAppData(oldAuction);
    const reloaded = loadAppData();

    expect(reloaded.auctionHistory).toHaveLength(1);
    expect(reloaded.auctionHistory[0].engineSnapshot).toBeUndefined();
    expect(reloaded.auctionHistory[0].cost).toBe(35);
  });
});
