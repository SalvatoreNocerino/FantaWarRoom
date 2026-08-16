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
