import { Player, PlayerRole } from '../types';

export class PlayersImportError extends Error {}

// --- Risoluzione colonne via alias di header -------------------------------
//
// Invece di assumere un ordine di colonne fisso (che si rompe appena cambia
// il formato del file sorgente), normalizziamo ogni intestazione e la
// confrontiamo con liste di alias noti. Così sia "Ruolo;Calciatore;Squadra;
// Quotazione" (Fantapazz) sia "Id;R;RM;Nome;Squadra;Qt.A;...;FVM;..."
// (fantacalcio.it) vengono riconosciuti senza che l'utente tocchi il file.
function normalizeHeader(h: unknown): string {
  return String(h ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // rimuove accenti
    .replace(/[^a-z0-9]/g, ''); // tiene solo lettere/numeri: "Qt.A" -> "qta"
}

// Ordine = priorità: il primo alias trovato tra gli header vince.
// "r" prima di "rm" per il ruolo: "rm" è il ruolo Mantra, non quello classico.
const FIELD_ALIASES: Record<string, string[]> = {
  role: ['ruolo', 'r', 'role'],
  name: ['calciatore', 'nome', 'giocatore', 'name', 'player'],
  team: ['squadra', 'team', 'club'],
  price: ['quotazione', 'qta', 'prezzo', 'price', 'baseprice'],
  fairValue: ['fvm', 'fairvalue'],
  // Colonne di storico stagione precedente — presenti solo in alcuni export
  // (es. fantacalcio.it "statistiche"). Se assenti, il motore di pricing
  // applica il ramo "nessuno storico" esattamente come nel foglio Excel.
  presenze: ['pv', 'presenze'],
  mv: ['mv', 'mediavoto'],
  fm: ['fm', 'fantamedia'],
  goals: ['gf', 'gol', 'reti'],
  assists: ['ass', 'assist'],
};

interface ResolvedColumns {
  role: number;
  name: number;
  team: number;
  price: number;
  fairValue: number;
  presenze: number;
  mv: number;
  fm: number;
  goals: number;
  assists: number;
}

function resolveColumns(headers: unknown[]): ResolvedColumns {
  const normalized = headers.map(normalizeHeader);
  const findFirst = (aliases: string[]) => {
    for (const alias of aliases) {
      const idx = normalized.indexOf(alias);
      if (idx !== -1) return idx;
    }
    return -1;
  };
  return {
    role: findFirst(FIELD_ALIASES.role),
    name: findFirst(FIELD_ALIASES.name),
    team: findFirst(FIELD_ALIASES.team),
    price: findFirst(FIELD_ALIASES.price),
    fairValue: findFirst(FIELD_ALIASES.fairValue),
    presenze: findFirst(FIELD_ALIASES.presenze),
    mv: findFirst(FIELD_ALIASES.mv),
    fm: findFirst(FIELD_ALIASES.fm),
    goals: findFirst(FIELD_ALIASES.goals),
    assists: findFirst(FIELD_ALIASES.assists),
  };
}

function looksLikeHeaderRow(headers: unknown[]): boolean {
  const cols = resolveColumns(headers);
  // Un header valido deve almeno riconoscere ruolo e nome: sono le due
  // colonne che non possiamo indovinare in modo affidabile per posizione.
  return cols.role !== -1 && cols.name !== -1;
}

function toRole(raw: unknown): PlayerRole {
  const r = String(raw ?? '')
    .trim()
    .toUpperCase();
  if (r.startsWith('P')) return 'P';
  if (r.startsWith('D')) return 'D';
  if (r.startsWith('C')) return 'C';
  return 'A';
}

export function toNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

// --- Tiering automatico ------------------------------------------------
//
// I listoni importati non hanno un campo "tier": lo ricaviamo noi in base
// al percentile di prezzo all'interno dello stesso ruolo, così il Copilot AI
// tratta i big (es. Lautaro, Dimarco) come tier 1 anche se arrivano da un
// file esterno, invece di trattare tutti come tier 3 di default.
// Funziona a prescindere dalla scala di prezzi usata dal listone di origine
// (Fantapazz e fantacalcio.it hanno scale diverse) perché ragiona per
// percentile relativo, non per soglia assoluta.
function assignTiersByRole(players: Player[]): Player[] {
  const byRole = new Map<PlayerRole, Player[]>();
  for (const p of players) {
    if (!byRole.has(p.role)) byRole.set(p.role, []);
    byRole.get(p.role)!.push(p);
  }

  for (const rolePlayers of byRole.values()) {
    const sorted = [...rolePlayers].sort((a, b) => b.basePrice - a.basePrice);
    const n = sorted.length;
    sorted.forEach((p, i) => {
      const percentile = n > 1 ? i / (n - 1) : 0; // 0 = più caro, 1 = più economico
      if (percentile <= 0.15) p.tier = 1;
      else if (percentile <= 0.5) p.tier = 2;
      else p.tier = 3;
      // Stima indicativa (non un dato reale) usata come default quando manca
      // una FantaMedia attesa: utile ai calcoli del Copilot finché l'utente
      // non la corregge a mano nella scheda giocatore.
      p.expectedFantaAvg = p.tier === 1 ? 7.2 : p.tier === 2 ? 6.6 : 6.1;
    });
  }

  return players;
}

function readHistoricalStats(cols: ResolvedColumns, get: (idx: number) => unknown): HistoricalStats {
  return {
    presenze: cols.presenze !== -1 ? toNumber(get(cols.presenze)) : null,
    mv: cols.mv !== -1 ? toNumber(get(cols.mv)) : null,
    fm: cols.fm !== -1 ? toNumber(get(cols.fm)) : null,
    goals: cols.goals !== -1 ? toNumber(get(cols.goals)) : null,
    assists: cols.assists !== -1 ? toNumber(get(cols.assists)) : null,
  };
}

function buildFairValueBracket(price: number, fvm: number | null): string {
  if (fvm !== null && fvm > 0) {
    const min = Math.max(1, Math.round(fvm * 0.85));
    const max = Math.round(fvm * 1.15);
    return `${min}-${max} FM`;
  }
  // Nessun FVM ufficiale nel file: stima grezza dalla quotazione base.
  return `${Math.round(price * 3)}-${Math.round(price * 4)} FM`;
}

interface HistoricalStats {
  presenze: number | null;
  mv: number | null;
  fm: number | null;
  goals: number | null;
  assists: number | null;
}

function buildPlayer(
  index: number,
  name: string,
  role: PlayerRole,
  team: string,
  price: number,
  fvm: number | null,
  historical?: HistoricalStats
): Player {
  return {
    id: `imp_${index}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    role,
    team,
    basePrice: price,
    expectedFantaAvg: 6.5, // sovrascritto da assignTiersByRole
    expectedGoalsAssists: 'N/A',
    tier: 3, // sovrascritto da assignTiersByRole
    notes: 'Caricato da listone importato',
    fairValueBracket: buildFairValueBracket(price, fvm),
    fvm: fvm ?? undefined,
    presenze: historical?.presenze ?? undefined,
    mv: historical?.mv ?? undefined,
    fm: historical?.fm ?? undefined,
    goals: historical?.goals ?? undefined,
    assists: historical?.assists ?? undefined,
  };
}

// --- Entry point per file testuali (CSV / TSV / JSON) -----------------------

export function parsePlayersFileContent(text: string, filename: string): Player[] {
  const isJson = filename.toLowerCase().endsWith('.json');

  if (isJson) {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      throw new PlayersImportError('Il file JSON deve contenere un array di giocatori.');
    }
    return parsePlayersJson(parsed);
  }

  return parsePlayersCsv(text);
}

// Un JSON caricato dall'utente non è affidabile quanto un oggetto Player
// costruito internamente: può avere id mancanti/duplicati, ruoli in formato
// diverso (es. Mantra), prezzi come stringa, o nomi di campo completamente
// diversi (es. export grezzo di fantacalcio.it con "qtA" invece di
// "basePrice"). Instrada quindi ogni riga per lo stesso builder/sanitizer
// usato da CSV e XLSX, invece di fidarsi della forma dell'oggetto as-is.
function parsePlayersJson(parsed: unknown[]): Player[] {
  if (parsed.length === 0) return [];

  const sample = parsed[0];
  if (typeof sample !== 'object' || sample === null) {
    throw new PlayersImportError('Il file JSON deve contenere un array di oggetti giocatore.');
  }

  const keys = Object.keys(sample as Record<string, unknown>);
  const cols = resolveColumns(keys);
  if (cols.name === -1 || cols.role === -1) {
    throw new PlayersImportError('Il file JSON non contiene campi "nome"/"ruolo" riconoscibili.');
  }

  const imported: Player[] = [];

  parsed.forEach((raw, i) => {
    if (typeof raw !== 'object' || raw === null) return;
    const obj = raw as Record<string, unknown>;
    const get = (idx: number) => (idx !== -1 ? obj[keys[idx]] : undefined);

    const name = cols.name !== -1 ? String(get(cols.name) ?? '').trim() : '';
    if (!name || name.length <= 1) return;

    const role = toRole(get(cols.role) ?? 'A');
    const team = (cols.team !== -1 ? String(get(cols.team) ?? '').trim() : '') || 'Serie A';
    const price = toNumber(get(cols.price)) ?? 1;
    const fvm = cols.fairValue !== -1 ? toNumber(get(cols.fairValue)) : null;
    const historical = readHistoricalStats(cols, get);

    imported.push(buildPlayer(i, name, role, team, price, fvm, historical));
  });

  return assignTiersByRole(imported);
}

export function parsePlayersCsv(text: string): Player[] {
  // Rimuove un eventuale BOM UTF-8 iniziale (comune nei CSV esportati da
  // Excel/Windows), altrimenti finirebbe incollato al primo header.
  const cleanText = text.replace(/^\uFEFF/, '');
  const lines = cleanText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const firstLine = lines[0];
  let delim = ';';
  if (firstLine.includes(';')) delim = ';';
  else if (firstLine.includes('\t')) delim = '\t';
  else if (firstLine.includes(',')) delim = ',';

  const splitRow = (line: string) => line.split(delim).map((c) => c.replace(/^["']|["']$/g, '').trim());

  const firstCols = splitRow(firstLine);
  const hasHeader = looksLikeHeaderRow(firstCols);
  const cols = hasHeader
    ? resolveColumns(firstCols)
    : // Nessun header riconoscibile: assume il vecchio ordine posizionale
      // (Nome, Ruolo, Squadra, Quotazione) per compatibilità con file "grezzi".
      { name: 0, role: 1, team: 2, price: 3, fairValue: -1, presenze: -1, mv: -1, fm: -1, goals: -1, assists: -1 };
  const startIdx = hasHeader ? 1 : 0;

  const imported: Player[] = [];

  for (let i = startIdx; i < lines.length; i++) {
    const rawCols = splitRow(lines[i]);
    if (rawCols.length < 3) continue;

    const name = cols.name !== -1 ? rawCols[cols.name] : undefined;
    if (!name || name.length <= 1) continue;

    const role = toRole(cols.role !== -1 ? rawCols[cols.role] : 'A');
    const team = (cols.team !== -1 ? rawCols[cols.team] : '') || 'Serie A';
    const price = toNumber(cols.price !== -1 ? rawCols[cols.price] : null) ?? 1;
    const fvm = cols.fairValue !== -1 ? toNumber(rawCols[cols.fairValue]) : null;
    const historical = readHistoricalStats(cols, (idx) => rawCols[idx]);

    imported.push(buildPlayer(i, name, role, team, price, fvm, historical));
  }

  return assignTiersByRole(imported);
}

// --- Entry point per file Excel (.xlsx) --------------------------------

const EXCLUDED_SHEET_PATTERN = /cedut|svincolat/i; // giocatori non più validi per l'asta
const ALL_PLAYERS_SHEET_PATTERN = /tutti|all/i;

export async function parsePlayersXlsxBuffer(buffer: ArrayBuffer): Promise<Player[]> {
  // Import dinamico: xlsx pesa ~340KB minificati, non ha senso scaricarla ad
  // ogni caricamento dell'app quando serve solo per questa singola azione.
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'array' });
  const candidateSheets = workbook.SheetNames.filter((n) => !EXCLUDED_SHEET_PATTERN.test(n));
  if (candidateSheets.length === 0) {
    throw new PlayersImportError('Il file Excel non contiene fogli utilizzabili (solo "Ceduti"/"Svincolati"?).');
  }

  // Preferisce un foglio "Tutti"/"All" se esiste (evita di importare 2 volte
  // gli stessi giocatori quando il file ha anche i fogli divisi per ruolo).
  const primarySheet = candidateSheets.find((n) => ALL_PLAYERS_SHEET_PATTERN.test(n));
  const sheetsToRead = primarySheet ? [primarySheet] : candidateSheets;

  const imported: Player[] = [];
  let rowCounter = 0;

  for (const sheetName of sheetsToRead) {
    const sheet = workbook.Sheets[sheetName];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, blankrows: false });

    // L'header non è sempre in riga 1: alcuni export hanno una riga titolo
    // sopra (es. "Quotazioni Fantacalcio Stagione 2026 27"). Cerchiamo la
    // prima riga tra le prime 5 che assomiglia davvero a un header.
    let headerRowIdx = rows.findIndex((r) => looksLikeHeaderRow(r));
    if (headerRowIdx === -1 || headerRowIdx > 4) headerRowIdx = 0;

    const cols = resolveColumns(rows[headerRowIdx] || []);
    if (cols.name === -1 || cols.role === -1) {
      // Foglio senza colonne riconoscibili: lo saltiamo invece di importare
      // spazzatura (es. un eventuale foglio di note).
      continue;
    }

    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const name = cols.name !== -1 ? String(row[cols.name] ?? '').trim() : '';
      if (!name || name.length <= 1) continue;

      const role = toRole(cols.role !== -1 ? row[cols.role] : 'A');
      const team = (cols.team !== -1 ? String(row[cols.team] ?? '').trim() : '') || 'Serie A';
      const price = toNumber(cols.price !== -1 ? row[cols.price] : null) ?? 1;
      const fvm = cols.fairValue !== -1 ? toNumber(row[cols.fairValue]) : null;
      const historical = readHistoricalStats(cols, (idx) => row[idx]);

      imported.push(buildPlayer(rowCounter++, name, role, team, price, fvm, historical));
    }
  }

  return assignTiersByRole(imported);
}
