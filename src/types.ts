export type PlayerRole = 'P' | 'D' | 'C' | 'A';

export interface PlayerLastYearStats {
  appearances: number;
  goals: number;
  assists: number;
  fantaAvg: number;
}

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  team: string; // e.g. Inter, Juventus, Milan, Napoli, etc.
  basePrice: number; // Quotazione iniziale
  expectedFantaAvg: number; // Fantamedia prevista
  expectedGoalsAssists: string; // es. "18G, 5A"
  tier: 1 | 2 | 3 | 4 | 5; // 1 = Top, 5 = Scommessa
  notes: string;
  injuryStatus?: 'healthy' | 'minor' | 'injured' | 'doubt';
  isCustom?: boolean;
  lastYearStats?: PlayerLastYearStats;
  fairValueBracket?: string; // es. "35-50 FM", "15-25 FM", "1-5 FM"
  // --- Campi opzionali per il motore di pricing deterministico (src/engine) ---
  // Popolati quando il listone importato li contiene (es. export fantacalcio.it
  // con FVM + statistiche); se assenti il motore applica i rami "nessuno storico"
  // esattamente come nel foglio Excel di riferimento.
  fvm?: number; // FVM/1000 dal listone — è il valore su cui si basa il prezzo del motore
  presenze?: number; // Pv — presenze stagione precedente
  mv?: number; // Media voto stagione precedente
  fm?: number; // Fantamedia stagione precedente
  goals?: number;
  assists?: number;
}

export interface BonusRule {
  id: string;
  name: string;
  value: number;
  enabled: boolean;
  category: 'bonus' | 'malus';
}

export type CallOrderRule = 'free' | 'alphabetical' | 'valuation' | 'sealed_bid';

export interface TeamParticipant {
  name: string;
  isMyTeam: boolean;
  initialBudget: number;
}

export interface LeagueSettings {
  name: string;
  numTeams: number;
  totalBudget: number;
  equalInitialCredits: boolean;
  rosterSlots: {
    P: number;
    D: number;
    C: number;
    A: number;
  };
  participants: TeamParticipant[];
  bonusRules: BonusRule[];
  defensiveModifier: {
    enabled: boolean;
  };
  midfieldModifier: {
    enabled: boolean;
  };
  auctionRules: {
    callOrderRule: CallOrderRule;
    alphabetStartLetter?: string;
  };
  selectableFormations: string[];
}

export interface StrategySettings {
  preferredFormation: string;
  aggressionScore: number; // 0 (conservativo) to 100 (aggressivo)
  budgetAllocationPct: {
    P: number;
    D: number;
    C: number;
    A: number;
  };
  wishlistIds: string[];
  blacklistIds: string[];
}

export interface RosterPlayer {
  id: string;
  playerId: string;
  boughtByTeam: string;
  cost: number;
  timestamp: number;
}

export interface AppData {
  league: LeagueSettings;
  strategy: StrategySettings;
  /** Listone attivo (preset selezionato o file caricato) — null = usa INITIAL_SERIE_A_PLAYERS. */
  importedListone: Player[] | null;
  customPlayers: Player[];
  auctionHistory: RosterPlayer[];
}

