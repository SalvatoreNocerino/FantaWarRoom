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
}

export interface BonusRule {
  id: string;
  name: string;
  value: number;
  enabled: boolean;
  category: 'bonus' | 'malus';
}

export interface ModifierTier {
  minScore: number;
  maxScore: number;
  bonus: number;
}

export interface MidfieldTier {
  minScore?: number;
  maxScore?: number;
  minDiff?: number;
  maxDiff?: number;
  bonus: number;
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
    tiers: ModifierTier[];
  };
  midfieldModifier: {
    enabled: boolean;
    tiers: MidfieldTier[];
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
  customPlayers: Player[];
  auctionHistory: RosterPlayer[];
}

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export interface AIRecommendation {
  maxBid: number;
  verdict: 'SUPER_MUST_HAVE' | 'GOOD_BUY' | 'OVERPRICED_RISK' | 'SKIP' | 'BARGAIN';
  reasoning: string;
  strategicNote: string;
}
