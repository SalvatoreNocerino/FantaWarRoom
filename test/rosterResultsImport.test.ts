import { describe, it, expect } from 'vitest';
import {
  parseRosterResultsXlsxBuffer,
  matchRosterResults,
  normalizeName,
  type RosterResultRow,
} from '../src/utils/rosterResultsImport';
import { Player } from '../src/types';

// Costruisce un buffer xlsx in memoria con lo stesso layout usato dagli
// export reali (es. FantaLab "Scarica rose"): blocchi di 3 colonne per
// squadra (Nome | Costo | vuota), ripetuti in orizzontale, terminati da una
// riga "totale" per squadra.
async function buildRosterXlsx(teams: { name: string; players: { name: string; cost: number }[] }[]): Promise<ArrayBuffer> {
  const XLSX = await import('xlsx');
  const maxRows = Math.max(...teams.map((t) => t.players.length)) + 1; // +1 per la riga "totale"
  const aoa: (string | number | null)[][] = [];

  const header: (string | null)[] = [];
  teams.forEach(() => {});
  teams.forEach((t) => header.push(t.name, 'costo', null));
  aoa.push(header);

  for (let r = 0; r < maxRows; r++) {
    const row: (string | number | null)[] = [];
    teams.forEach((t) => {
      const isTotalRow = r === t.players.length;
      if (isTotalRow) {
        const total = t.players.reduce((s, p) => s + p.cost, 0);
        row.push('totale', total, null);
      } else if (r < t.players.length) {
        row.push(t.players[r].name, t.players[r].cost, null);
      } else {
        row.push(null, null, null);
      }
    });
    aoa.push(row);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ROSE');
  const out = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return out instanceof ArrayBuffer ? out : new Uint8Array(out).buffer;
}

describe('parseRosterResultsXlsxBuffer', () => {
  it('legge le rose di più squadre disposte in blocchi di 3 colonne, scartando la riga "totale"', async () => {
    const buffer = await buildRosterXlsx([
      { name: 'NapoletanaGas', players: [{ name: 'Milinkovic-Savic V.', cost: 40 }, { name: 'Malen', cost: 335 }] },
      { name: 'Napoli 1926', players: [{ name: 'Meret', cost: 71 }] },
    ]);

    const rows = await parseRosterResultsXlsxBuffer(buffer);

    expect(rows).toEqual([
      { team: 'NapoletanaGas', playerName: 'Milinkovic-Savic V.', cost: 40 },
      { team: 'NapoletanaGas', playerName: 'Malen', cost: 335 },
      { team: 'Napoli 1926', playerName: 'Meret', cost: 71 },
    ]);
    expect(rows.some((r) => r.playerName.toLowerCase() === 'totale')).toBe(false);
  });

  it('lancia un errore se il file non ha colonne Squadra/Costo riconoscibili', async () => {
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.aoa_to_sheet([['Ciao', 'Mondo']]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Foglio1');
    const out = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const buffer = out instanceof ArrayBuffer ? out : new Uint8Array(out).buffer;

    await expect(parseRosterResultsXlsxBuffer(buffer)).rejects.toThrow();
  });
});

function makePlayer(overrides: Partial<Player> & Pick<Player, 'id' | 'name' | 'basePrice'>): Player {
  return {
    role: 'A',
    team: 'Serie A',
    expectedFantaAvg: 6.5,
    expectedGoalsAssists: 'N/A',
    tier: 3,
    notes: '',
    fairValueBracket: '1-1 FM',
    ...overrides,
  };
}

describe('matchRosterResults', () => {
  const participants = [{ name: 'NapoletanaGas' }, { name: 'Napoli 1926' }];
  const allPlayers: Player[] = [
    makePlayer({ id: 'p1', name: 'Malen', basePrice: 30 }),
    makePlayer({ id: 'p2', name: 'Meret', basePrice: 15, role: 'P' }),
    // Due giocatori con lo stesso nome (cognome comune), prezzi diversi.
    makePlayer({ id: 'p3', name: 'Rossi', basePrice: 5 }),
    makePlayer({ id: 'p4', name: 'Rossi', basePrice: 50 }),
  ];

  it('abbina squadra e giocatore per nome esatto (normalizzato)', () => {
    const rows: RosterResultRow[] = [{ team: 'napoletanagas', playerName: 'malen', cost: 335 }];
    const result = matchRosterResults(rows, participants, allPlayers);

    expect(result.matched).toEqual([{ row: rows[0], playerId: 'p1', boughtByTeam: 'NapoletanaGas' }]);
    expect(result.unmatchedTeams).toEqual([]);
    expect(result.unresolvedPlayers).toEqual([]);
  });

  it('segnala le squadre del file senza corrispondenza tra i partecipanti', () => {
    const rows: RosterResultRow[] = [{ team: 'Squadra Fantasma', playerName: 'Malen', cost: 335 }];
    const result = matchRosterResults(rows, participants, allPlayers);

    expect(result.matched).toEqual([]);
    expect(result.unmatchedTeams).toEqual(['Squadra Fantasma']);
  });

  it('usa una mappatura manuale (override) per una squadra non riconosciuta automaticamente', () => {
    const rows: RosterResultRow[] = [{ team: 'Squadra Fantasma', playerName: 'Malen', cost: 335 }];
    const result = matchRosterResults(rows, participants, allPlayers, { 'Squadra Fantasma': 'NapoletanaGas' });

    expect(result.matched).toEqual([{ row: rows[0], playerId: 'p1', boughtByTeam: 'NapoletanaGas' }]);
    expect(result.unmatchedTeams).toEqual([]);
  });

  it('segnala un giocatore del file assente dal listone, senza bloccare le altre righe', () => {
    const rows: RosterResultRow[] = [
      { team: 'NapoletanaGas', playerName: 'Giocatore Inesistente', cost: 10 },
      { team: 'Napoli 1926', playerName: 'Meret', cost: 71 },
    ];
    const result = matchRosterResults(rows, participants, allPlayers);

    expect(result.matched).toEqual([{ row: rows[1], playerId: 'p2', boughtByTeam: 'Napoli 1926' }]);
    expect(result.unresolvedPlayers).toEqual([{ row: rows[0], boughtByTeam: 'NapoletanaGas' }]);
  });

  it('risolve un nome ambiguo scegliendo il candidato col basePrice più vicino al costo pagato', () => {
    const rows: RosterResultRow[] = [{ team: 'NapoletanaGas', playerName: 'Rossi', cost: 48 }];
    const result = matchRosterResults(rows, participants, allPlayers);

    // basePrice 50 (p4) è più vicino a 48 rispetto a basePrice 5 (p3).
    expect(result.matched).toEqual([{ row: rows[0], playerId: 'p4', boughtByTeam: 'NapoletanaGas' }]);
    expect(result.ambiguous).toEqual([{ row: rows[0], boughtByTeam: 'NapoletanaGas', chosenPlayerId: 'p4', candidateCount: 2 }]);
  });
});

describe('normalizeName', () => {
  it('ignora accenti, maiuscole e spazi extra', () => {
    expect(normalizeName('  Dodò  ')).toBe(normalizeName('dodo'));
    expect(normalizeName('Martinez L.')).toBe(normalizeName('martinez l')); // il punto diventa spazio/viene rimosso
  });
});
