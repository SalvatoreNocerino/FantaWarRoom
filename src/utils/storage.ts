import { AppData, LeagueSettings, StrategySettings } from '../types';

export const STORAGE_KEY = 'fanta_war_room_app_data_v2';

export const DEFAULT_LEAGUE_SETTINGS: LeagueSettings = {
  name: 'Lega Fantacalcio 2026',
  numTeams: 8,
  totalBudget: 500,
  equalInitialCredits: true,
  rosterSlots: {
    P: 3,
    D: 8,
    C: 8,
    A: 6,
  },
  participants: [
    { name: 'FC Real Fantasia', isMyTeam: true, initialBudget: 500 },
    { name: 'AC Picchia', isMyTeam: false, initialBudget: 500 },
    { name: 'Atletico Van Goof', isMyTeam: false, initialBudget: 500 },
    { name: 'Dinamo Barella', isMyTeam: false, initialBudget: 500 },
    { name: 'Speranza FC', isMyTeam: false, initialBudget: 500 },
    { name: 'Real Madrink', isMyTeam: false, initialBudget: 500 },
    { name: 'AS Birra', isMyTeam: false, initialBudget: 500 },
    { name: 'Bayer Leverkusen', isMyTeam: false, initialBudget: 500 },
  ],
  bonusRules: [
    { id: 'goal_att', name: 'Gol Attaccante', value: 3, enabled: true, category: 'bonus' },
    { id: 'goal_cen', name: 'Gol Centrocampista', value: 3.5, enabled: true, category: 'bonus' },
    { id: 'goal_dif', name: 'Gol Difensore', value: 4, enabled: true, category: 'bonus' },
    { id: 'goal_por', name: 'Gol Portiere', value: 5, enabled: true, category: 'bonus' },
    { id: 'assist', name: 'Assist', value: 1, enabled: true, category: 'bonus' },
    { id: 'assist_fermo', name: 'Assist da Calcio da Fermo', value: 1, enabled: true, category: 'bonus' },
    { id: 'rigore_parato', name: 'Rigore Parato', value: 3, enabled: true, category: 'bonus' },
    { id: 'clean_sheet', name: 'Imbattibilità Portiere (Clean Sheet)', value: 1, enabled: true, category: 'bonus' },
    { id: 'gol_subito', name: 'Gol Subito', value: -1, enabled: true, category: 'malus' },
    { id: 'rigore_sbagliato', name: 'Rigore Sbagliato', value: -3, enabled: true, category: 'malus' },
    { id: 'autogol', name: 'Autogol', value: -2, enabled: true, category: 'malus' },
    { id: 'ammonizione', name: 'Ammonizione', value: -0.5, enabled: true, category: 'malus' },
    { id: 'espulsione', name: 'Espulsione', value: -1, enabled: true, category: 'malus' },
  ],
  defensiveModifier: {
    enabled: false,
  },
  midfieldModifier: {
    enabled: false,
  },
  auctionRules: {
    callOrderRule: 'free',
    alphabetStartLetter: 'A',
  },
};

export const DEFAULT_STRATEGY_SETTINGS: StrategySettings = {
  aggressionScore: 50,
  budgetAllocationPct: {
    P: 8,
    D: 17,
    C: 25,
    A: 50,
  },
  wishlistIds: [],
  blacklistIds: [],
  playerNotes: {},
};

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        league: DEFAULT_LEAGUE_SETTINGS,
        strategy: DEFAULT_STRATEGY_SETTINGS,
        importedListone: null,
        customPlayers: [],
        auctionHistory: [],
      };
    }
    const parsed = JSON.parse(raw);
    const loadedLeague = { ...DEFAULT_LEAGUE_SETTINGS, ...(parsed.league || {}) };
    const loadedStrategy = { ...DEFAULT_STRATEGY_SETTINGS, ...(parsed.strategy || {}) };

    return {
      league: loadedLeague,
      strategy: loadedStrategy,
      importedListone: parsed.importedListone || null,
      customPlayers: parsed.customPlayers || [],
      auctionHistory: parsed.auctionHistory || [],
    };
  } catch (err) {
    console.error('Error loading app data from localStorage:', err);
    return {
      league: DEFAULT_LEAGUE_SETTINGS,
      strategy: DEFAULT_STRATEGY_SETTINGS,
      importedListone: null,
      customPlayers: [],
      auctionHistory: [],
    };
  }
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error saving app data to localStorage:', err);
  }
}

export function resetAppData(): AppData {
  const fresh: AppData = {
    league: DEFAULT_LEAGUE_SETTINGS,
    strategy: DEFAULT_STRATEGY_SETTINGS,
    importedListone: null,
    customPlayers: [],
    auctionHistory: [],
  };
  saveAppData(fresh);
  return fresh;
}
