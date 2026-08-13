import { PlayerRole } from '../types';

/**
 * Un giocatore del listone così come lo vede il motore di pricing: dati di
 * mercato (Qt.A/FVM, da "Input Giocatori") + storico stagione precedente
 * (da "Input Statistiche"), quando disponibile. Sottoinsieme minimo dei
 * campi richiesti dalla logica di Output Utente — deliberatamente
 * indipendente dal tipo `Player` dell'app per restare puro e testabile.
 */
export interface EnginePlayer {
  id: string;
  role: PlayerRole;
  name: string;
  team: string;
  /** Qt.A — quotazione all'asta dal listone. */
  qtA: number;
  /** FVM/1000 dal listone — è il valore su cui si basa il prezzo. */
  fvm: number;
  /** Pv — presenze (partite a voto) stagione precedente. undefined = nessuno storico. */
  presenze?: number;
  /** Mv — media voto stagione precedente. */
  mv?: number;
  /** Fm — fantamedia stagione precedente. */
  fm?: number;
  gol?: number;
  assist?: number;
}

/** Un'assegnazione già avvenuta in asta. */
export interface AuctionAssignment {
  playerId: string;
  team: string;
  price: number;
}

/** Configurazione di lega necessaria al motore — sottoinsieme di LeagueSettings. */
export interface EngineLeagueConfig {
  numTeams: number;
  totalBudget: number;
  rosterSlots: Record<PlayerRole, number>;
  defensiveModifierEnabled: boolean;
  midfieldModifierEnabled: boolean;
  myTeamName: string;
}

/** Configurazione di strategia necessaria al motore — sottoinsieme di StrategySettings. */
export interface EngineStrategyConfig {
  /** Formato "D-C-A", es. "3-4-3". */
  preferredFormation: string;
  /** 0 (conservativo) - 1 (aggressivo). Nell'app è 0-100: va normalizzato prima di passarlo. */
  aggressiveness: number;
  /** % del budget totale per ruolo, deve sommare a 1 (o vicino). Default calibrato in modelParams.DEFAULT_ROLE_BUDGET_PCT. */
  roleBudgetPct: Record<PlayerRole, number>;
  /** Id dei giocatori in whichlist/preferiti. */
  wishlistIds: string[];
}

export type PressioneLevel = 'verde' | 'giallo' | 'rosso' | 'esaurito';
export type SostenibilitaLevel = 'ok' | 'attenzione' | 'rischio' | null;
export type Fascia = 'Top' | 'Buono' | 'Nella Media' | 'Scommessa/Riserva';
export type TitolareRiserva = 'Titolare' | 'Riserva';

export interface PressioneRuolo {
  level: PressioneLevel;
  /** Top+Buoni rimasti (se il giocatore è Titolare di mercato) o Media+Scommesse rimaste (se Riserva). */
  countRimasti: number;
  /** Titolari Residui o Riserve Residue in lega, a seconda del ramo. */
  denominatore: number;
  label: string;
}

export interface Sostenibilita {
  level: SostenibilitaLevel;
  label: string;
}

/** Aggregati di pool per ruolo — dipendono dal listone + dallo stato corrente dell'asta. Vedi Parametri Modello righe 32-60. */
export interface RolePoolStats {
  role: PlayerRole;
  slotTotaliLega: number;
  slotAncoraDaRiempireLega: number;
  giocatoriLiberiListone: number;
  rapportoOffertaDomanda: number | null;
  sommaFVMPool: number;
  nTitolariLega: number;
  sommaFVMTitolari: number;
  sommaFVMRiserve: number;
  titolariResidui: number;
  riserveResidue: number;
  fantamediaMediaRuolo: number | null;
  topRimasti: number;
  buoniRimasti: number;
  mediaRimasti: number;
  scommesseRimaste: number;
}

export interface LeaguePoolStats {
  budgetTotaleLega: number;
  byRole: Record<PlayerRole, RolePoolStats>;
}

/** Bookkeeping della squadra dell'utente — equivalente a Output Utente!W:Z / La Mia Rosa. */
export interface MyTeamBudget {
  budgetResiduo: number;
  slotResidui: number;
  budgetMinimoRiserva: number;
  budgetSpendibile: number;
  creditoMedioPerSlotRimanente: number | null;
}

/** Output del motore per un singolo giocatore — equivalente a una riga di Output Utente. */
export interface PlayerPricing {
  playerId: string;
  /**
   * Stima di valore centrale (prezzo base corretto da modificatori, prima
   * dello Spread% che apre il Range). Non è una colonna diretta del foglio
   * Excel (lì il range nasce già "aperto"): è il punto medio del calcolo,
   * utile in UI come singolo numero di riferimento accanto al Range.
   */
  value: number;
  rangeMin: number;
  rangeMax: number;
  maxBidStrategico: number;
  maxBidDinamico: number;
  fascia: Fascia;
  rankFvmRuolo: number;
  titolareORiserva: TitolareRiserva;
  isWhichlist: boolean;
  pressioneRuolo: PressioneRuolo;
  sostenibilita: Sostenibilita;
}
