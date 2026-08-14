import { readFileSync } from 'fs';
import { join } from 'path';
import { EnginePlayer, EngineLeagueConfig, EngineStrategyConfig } from '../../src/engine/types';
import { DEFAULT_ROLE_BUDGET_PCT } from '../../src/engine/modelParams';
import { PlayerRole } from '../../src/types';

interface ListoneRow {
  id: number;
  role: PlayerRole;
  name: string;
  team: string;
  qtA: number;
  qtI: number;
  fvm: number;
}

interface StatisticheRow {
  id: number;
  role: PlayerRole;
  name: string;
  team: string;
  presenze: number | null;
  mv: number | null;
  fm: number | null;
  gol: number | null;
  assist: number | null;
}

const FIXTURES_DIR = join(__dirname, '..', 'fixtures');

/** Carica l'intero listone 2026/27 unito allo storico 2025/26, esattamente come fanno
 *  Output Utente!I:L/S:T tramite INDEX/MATCH sull'Id — un giocatore senza corrispondenza
 *  nelle statistiche resta con i campi storici undefined (= "" in Excel). */
export function loadFullPlayerPool(): EnginePlayer[] {
  const listone: ListoneRow[] = JSON.parse(readFileSync(join(FIXTURES_DIR, 'listone_2026_27.json'), 'utf-8'));
  const statistiche: StatisticheRow[] = JSON.parse(readFileSync(join(FIXTURES_DIR, 'statistiche_2025_26.json'), 'utf-8'));

  const statsById = new Map(statistiche.map((s) => [s.id, s]));

  return listone.map((p) => {
    const stats = statsById.get(p.id);
    return {
      id: String(p.id),
      role: p.role,
      name: p.name,
      team: p.team,
      qtA: p.qtA,
      fvm: p.fvm,
      presenze: stats?.presenze ?? undefined,
      mv: stats?.mv ?? undefined,
      fm: stats?.fm ?? undefined,
      gol: stats?.gol ?? undefined,
      assist: stats?.assist ?? undefined,
    };
  });
}

export interface GoldenOutputUtenteRow {
  A: number; // Id
  B: PlayerRole;
  C: string; // Nome
  F: number; // Offerta Max
  G: number; // Valutazione Min
  H: number; // Valutazione Max
  P: string; // Fascia Aspettativa
  U: string | null; // Sostenibilità Budget
  V: number; // Rank FVM nel Ruolo
  AE: string; // Pressione Ruolo
  AF: string; // Titolare/Riserva (mercato)
}

export function loadGoldenRows(): GoldenOutputUtenteRow[] {
  return JSON.parse(readFileSync(join(FIXTURES_DIR, 'golden_output_utente_rows.json'), 'utf-8'));
}

/** Config di lega/strategia identica a Info Lega / Info Strategia nel file Excel, stato asta vuoto. */
export function goldenLeagueConfig(): EngineLeagueConfig {
  return {
    numTeams: 8,
    totalBudget: 1000,
    rosterSlots: { P: 3, D: 8, C: 8, A: 6 },
    defensiveModifierEnabled: true, // Info Lega!B25 = "Si"
    midfieldModifierEnabled: false, // Info Lega!B26 = "No"
    myTeamName: 'xxx1', // Info Lega!B28
  };
}

export function goldenStrategyConfig(): EngineStrategyConfig {
  return {
    aggressiveness: 0.7, // Info Strategia!B6
    roleBudgetPct: DEFAULT_ROLE_BUDGET_PCT, // Parametri Modello!B50:B53 (questo file non ha whichlist né split custom)
    wishlistIds: [],
  };
}
