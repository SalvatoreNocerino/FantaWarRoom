import { describe, it, expect } from 'vitest';
import { priceAllPlayers } from '../src/engine/pricingEngine';
import { loadFullPlayerPool, loadGoldenRows, goldenLeagueConfig, goldenStrategyConfig } from './helpers/engineFixtures';

// Verifica riga-per-riga che il motore TS riproduca esattamente i valori
// calcolati da Excel (Strategia_Asta_FINAL_GPT.xlsx, foglio "Output Utente",
// stato asta vuoto) per 15 giocatori campione (P/D/C/A x 4 fasce, incluso un
// caso senza storico) — ma SOLO per la Fascia Aspettativa e il Rank FVM, le
// uniche parti del modello rimaste identiche all'Excel. Se questo test si
// rompe, il motore si è discostato dal file calibrato senza che fosse
// voluto: non "correggerlo" cambiando la formula, verificare prima se il
// file Excel è stato ricalcolato o se i fixture sono stali.
//
// Non più verificati qui, per deviazioni deliberate rispetto all'Excel
// richieste esplicitamente (vedi commenti in modelParams.ts):
// - F/G/H (prezzo) e U (sostenibilità, che dipende dal prezzo): il
//   modificatore di scarsità ha un pavimento a 0% invece di poter scontare,
//   e conta solo i liberi Top/Buono (SCARSITA_SCONTO_MINIMO).
// - AF (Titolare/Riserva) e AE (Pressione Ruolo) per D/C/A: i titolari-per-
//   squadra-in-lega sono ora fissi (TITOLARI_PER_SQUADRA_LEGA) invece di
//   derivare dal modulo dell'utente, che non è rappresentativo delle
//   squadre avversarie. Per il ruolo P (titolari fisso a 1 anche
//   nell'Excel) questi due campi coincidono ancora, ma non li verifichiamo
//   qui per non complicare il confronto per ruolo — coperti da
//   pricingEngine.test.ts con numeri costruiti a mano.
describe('pricingEngine — golden test vs Excel (stato asta vuoto)', () => {
  const players = loadFullPlayerPool();
  const league = goldenLeagueConfig();
  const strategy = goldenStrategyConfig();
  const pricing = priceAllPlayers(players, league, strategy, []);
  const goldenRows = loadGoldenRows();

  it.each(goldenRows.map((row) => [row.C, row]))('%s matches Excel Output Utente (classificazione di mercato)', (_name, row) => {
    const p = pricing.get(String(row.A));
    expect(p, `giocatore id=${row.A} (${row.C}) non trovato nel pool`).toBeDefined();
    if (!p) return;

    expect(p.fascia, 'Fascia Aspettativa (P)').toBe(row.P);
    expect(p.rankFvmRuolo, 'Rank FVM nel Ruolo (V)').toBe(row.V);
  });
});
