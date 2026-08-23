import { Player } from '../types';
import { toNumber } from './playersImport';

export class RosterResultsImportError extends Error {}

export interface RosterResultRow {
  team: string;
  playerName: string;
  cost: number;
}

// Riga di chiusura di ogni gruppo-squadra nell'export tipico (es. FantaLab):
// non è un giocatore, è il totale speso — va scartata, non importata come
// un "giocatore" chiamato "Totale".
const SUMMARY_ROW_PATTERN = /^totale$/i;

function normalizeName(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export { normalizeName };

// L'export delle rose (es. FantaLab "Scarica rose") ha un blocco di 3 colonne
// per squadra: Nome | Costo | (vuota), ripetuto in orizzontale per ogni
// squadra della lega. Non assumiamo un numero fisso di squadre: lo
// deduciamo dall'header, cercando ogni colonna il cui nome è seguito da una
// colonna "costo" — funziona qualunque sia il numero di partecipanti.
function findTeamColumns(headerRow: unknown[]): { team: string; nameCol: number; costCol: number }[] {
  const groups: { team: string; nameCol: number; costCol: number }[] = [];
  for (let i = 0; i < headerRow.length; i++) {
    const team = String(headerRow[i] ?? '').trim();
    const nextHeader = String(headerRow[i + 1] ?? '')
      .trim()
      .toLowerCase();
    if (team && nextHeader === 'costo') {
      groups.push({ team, nameCol: i, costCol: i + 1 });
    }
  }
  return groups;
}

export async function parseRosterResultsXlsxBuffer(buffer: ArrayBuffer): Promise<RosterResultRow[]> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'array' });
  if (workbook.SheetNames.length === 0) {
    throw new RosterResultsImportError('Il file Excel non contiene fogli.');
  }

  // Come per il listone, l'header può non essere in riga 1 su alcuni export.
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, blankrows: false });

  let headerRowIdx = rows.findIndex((r) => findTeamColumns(r).length > 0);
  if (headerRowIdx === -1) {
    throw new RosterResultsImportError(
      'Non trovo colonne "Squadra"/"Costo" riconoscibili: il file non sembra un export di rose con prezzi.'
    );
  }

  const teamColumns = findTeamColumns(rows[headerRowIdx]);

  // Itera squadra per squadra (non riga per riga) così l'output resta
  // raggruppato per squadra invece che intrecciato per posizione di riga —
  // più comodo da presentare nella UI di riconciliazione.
  const results: RosterResultRow[] = [];
  for (const { team, nameCol, costCol } of teamColumns) {
    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row) continue;

      const name = String(row[nameCol] ?? '').trim();
      if (!name || SUMMARY_ROW_PATTERN.test(name)) continue;

      const cost = toNumber(row[costCol]);
      if (cost === null) continue; // riga senza prezzo leggibile: non è un'assegnazione valida

      results.push({ team, playerName: name, cost });
    }
  }

  return results;
}

// --- Riconciliazione: righe del file -> giocatori del listone + squadre di lega ---
//
// Il file ha nomi squadra "di fantasia" (i nomi scelti dai partecipanti,
// es. "NapoletanaGas") che vanno abbinati ai partecipanti reali della lega,
// e nomi giocatore che vanno abbinati al listone corrente — senza però la
// squadra Serie A reale come aiuto (il file non la contiene), quindi
// l'abbinamento è solo per nome.

export interface MatchedAssignment {
  row: RosterResultRow;
  playerId: string;
  boughtByTeam: string;
}

// Un nome giocatore che nel listone corrisponde a più di un calciatore
// (es. cognome comune): risolto automaticamente scegliendo quello con
// basePrice più vicino al costo pagato nel file, ma segnalato per una
// verifica manuale invece di sparire silenziosamente tra i "matched".
export interface AmbiguousResolution {
  row: RosterResultRow;
  boughtByTeam: string;
  chosenPlayerId: string;
  candidateCount: number;
}

export interface UnresolvedPlayerRow {
  row: RosterResultRow;
  boughtByTeam: string;
}

export interface MatchRosterResultsOutput {
  matched: MatchedAssignment[];
  ambiguous: AmbiguousResolution[]; // sottoinsieme già incluso in `matched`, elencato per revisione
  unresolvedPlayers: UnresolvedPlayerRow[]; // squadra risolta, ma nessun giocatore col quel nome nel listone
  unmatchedTeams: string[]; // nomi squadra del file senza nessun partecipante corrispondente (righe scartate)
}

function resolveTeamName(
  fileTeam: string,
  participants: { name: string }[],
  overrides: Record<string, string>
): string | null {
  if (overrides[fileTeam]) return overrides[fileTeam];
  const norm = normalizeName(fileTeam);
  const found = participants.find((p) => normalizeName(p.name) === norm);
  return found ? found.name : null;
}

export function matchRosterResults(
  rows: RosterResultRow[],
  participants: { name: string }[],
  allPlayers: Player[],
  teamNameOverrides: Record<string, string> = {}
): MatchRosterResultsOutput {
  const playersByNormName = new Map<string, Player[]>();
  for (const p of allPlayers) {
    const key = normalizeName(p.name);
    if (!playersByNormName.has(key)) playersByNormName.set(key, []);
    playersByNormName.get(key)!.push(p);
  }

  const matched: MatchedAssignment[] = [];
  const ambiguous: AmbiguousResolution[] = [];
  const unresolvedPlayers: UnresolvedPlayerRow[] = [];
  const unmatchedTeamsSet = new Set<string>();

  for (const row of rows) {
    const boughtByTeam = resolveTeamName(row.team, participants, teamNameOverrides);
    if (!boughtByTeam) {
      unmatchedTeamsSet.add(row.team);
      continue;
    }

    const candidates = playersByNormName.get(normalizeName(row.playerName)) ?? [];
    if (candidates.length === 0) {
      unresolvedPlayers.push({ row, boughtByTeam });
      continue;
    }

    let chosen = candidates[0];
    if (candidates.length > 1) {
      chosen = [...candidates].sort(
        (a, b) => Math.abs(a.basePrice - row.cost) - Math.abs(b.basePrice - row.cost)
      )[0];
      ambiguous.push({ row, boughtByTeam, chosenPlayerId: chosen.id, candidateCount: candidates.length });
    }

    matched.push({ row, playerId: chosen.id, boughtByTeam });
  }

  return { matched, ambiguous, unresolvedPlayers, unmatchedTeams: [...unmatchedTeamsSet] };
}
