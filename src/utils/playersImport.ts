import { Player, PlayerRole } from '../types';

export class PlayersImportError extends Error {}

// Interpreta il contenuto di un file listone (JSON array o CSV/TSV con
// separatore auto-rilevato) e restituisce un array di Player. Pura, senza
// I/O: chi la chiama si occupa di leggere il file (FileReader) e di
// mostrare feedback all'utente.
export function parsePlayersFileContent(text: string, filename: string): Player[] {
  const isJson = filename.toLowerCase().endsWith('.json');

  if (isJson) {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      throw new PlayersImportError('Il file JSON deve contenere un array di giocatori.');
    }
    return parsed as Player[];
  }

  return parsePlayersCsv(text);
}

export function parsePlayersCsv(text: string): Player[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const firstLine = lines[0];
  let delim = ';';
  if (firstLine.includes(';')) delim = ';';
  else if (firstLine.includes('\t')) delim = '\t';
  else if (firstLine.includes(',')) delim = ',';

  const hasHeader =
    firstLine.toLowerCase().includes('nome') ||
    firstLine.toLowerCase().includes('name') ||
    firstLine.toLowerCase().includes('ruolo');
  const startIdx = hasHeader ? 1 : 0;

  const imported: Player[] = [];

  for (let i = startIdx; i < lines.length; i++) {
    const rawCols = lines[i].split(delim).map((c) => c.replace(/^["']|["']$/g, '').trim());
    if (rawCols.length < 3) continue;

    const name = rawCols[0] || rawCols[1];
    const rawRole = (rawCols[1] || rawCols[0] || 'A').toUpperCase();
    let role: PlayerRole = 'A';
    if (rawRole.startsWith('P')) role = 'P';
    else if (rawRole.startsWith('D')) role = 'D';
    else if (rawRole.startsWith('C')) role = 'C';
    else if (rawRole.startsWith('A')) role = 'A';

    const team = rawCols[2] || 'Serie A';
    const price = parseFloat(rawCols[3] || '1') || 1;

    if (!name || name.length <= 1) continue;

    imported.push({
      id: `imp_${i}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      role,
      team,
      basePrice: price,
      expectedFantaAvg: 6.5,
      expectedGoalsAssists: 'N/A',
      tier: 3,
      notes: 'Caricato da Listone personalizzato',
      fairValueBracket: `${price * 3}-${price * 4} FM`
    });
  }

  return imported;
}
