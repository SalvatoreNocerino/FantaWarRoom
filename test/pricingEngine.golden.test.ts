import { describe, it, expect } from 'vitest';
import { priceAllPlayers } from '../src/engine/pricingEngine';
import { loadFullPlayerPool, loadGoldenRows, goldenLeagueConfig, goldenStrategyConfig } from './helpers/engineFixtures';

// Verifica riga-per-riga che il motore TS riproduca esattamente i valori
// calcolati da Excel (Strategia_Asta_FINAL_GPT.xlsx, foglio "Output Utente",
// stato asta vuoto) per 15 giocatori campione (P/D/C/A x 4 fasce, incluso un
// caso senza storico). Se questo test si rompe, il motore si è discostato
// dal file calibrato: non "correggerlo" cambiando la formula, verificare
// prima se il file Excel è stato ricalcolato o se i fixture sono stali.
describe('pricingEngine — golden test vs Excel (stato asta vuoto)', () => {
  const players = loadFullPlayerPool();
  const league = goldenLeagueConfig();
  const strategy = goldenStrategyConfig();
  const pricing = priceAllPlayers(players, league, strategy, []);
  const goldenRows = loadGoldenRows();

  it.each(goldenRows.map((row) => [row.C, row]))('%s matches Excel Output Utente', (_name, row) => {
    const p = pricing.get(String(row.A));
    expect(p, `giocatore id=${row.A} (${row.C}) non trovato nel pool`).toBeDefined();
    if (!p) return;

    expect(p.maxBidStrategico, 'Offerta Max (F)').toBe(row.F);
    expect(p.rangeMin, 'Valutazione Min (G)').toBe(row.G);
    expect(p.rangeMax, 'Valutazione Max (H)').toBe(row.H);
    expect(p.fascia, 'Fascia Aspettativa (P)').toBe(row.P);
    expect(p.rankFvmRuolo, 'Rank FVM nel Ruolo (V)').toBe(row.V);
    expect(p.titolareORiserva, 'Titolare/Riserva mercato (AF)').toBe(row.AF);
    expect(p.pressioneRuolo.label, 'Pressione Ruolo (AE)').toBe(row.AE);

    const sostenibilitaLabel = p.sostenibilita.label || null;
    expect(sostenibilitaLabel, 'Sostenibilità Budget (U)').toBe(row.U);
  });
});
