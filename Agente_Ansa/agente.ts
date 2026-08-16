// Agente Ansa — scandaglia il web (via ricerca Google integrata in Gemini)
// per trovare, per ciascun giocatore del listone: le statistiche della
// stagione 2025/26 (presenze, titolarità, gol, assist, cartellini) e una
// previsione fantacalcistica di una riga per la stagione 2026/27 entrante.
//
// Uso:
//   npx tsx Agente_Ansa/agente.ts --limit 10
//   npx tsx Agente_Ansa/agente.ts --role P --tier 1
//   npx tsx Agente_Ansa/agente.ts --force            (ignora la cache e rifà tutti)
//   npx tsx Agente_Ansa/agente.ts --dry-run           (mostra solo chi verrebbe processato)
//
// Richiede GEMINI_API_KEY nell'.env.local alla radice del progetto.
// Vedi README.md in questa cartella per i dettagli.

import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import { FANTACALCIO_IT_LISTONE } from '../src/data/presetListoni/fantacalcioIt.ts';
import type { Player, PlayerRole, PlayerLastYearStats } from '../src/types.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

// Ricarica esplicitamente .env.local dalla radice: questo script gira con
// Node/tsx fuori da Vite, quindi le VITE_* env non vengono iniettate automaticamente.
loadEnv({ path: path.join(ROOT_DIR, '.env.local') });

const OUT_TXT = path.join(__dirname, 'previsioni.txt');
const CACHE_JSON = path.join(__dirname, '.cache', 'previsioni-cache.json');
// L'app legge questo file a runtime (src/data/presetListoni/index.ts) per
// arricchire il listone base con statistiche + previsione. Sta dentro src/
// (non in Agente_Ansa/) così Vite lo bundla come un normale asset dell'app.
const ENRICHMENT_JSON = path.join(ROOT_DIR, 'src', 'data', 'presetListoni', 'arricchimento.json');

const ROLE_LABEL: Record<PlayerRole, string> = {
  P: 'Portiere',
  D: 'Difensore',
  C: 'Centrocampista',
  A: 'Attaccante',
};

const NO_INFO_TOKEN = 'NESSUNA_INFORMAZIONE';
const NO_INFO_DISPLAY = 'Nessuna Informazione Disponibile';

// --- CLI args -----------------------------------------------------------

interface Args {
  limit?: number;
  offset: number;
  role?: PlayerRole;
  team?: string;
  tier?: number;
  top?: number;
  concurrency: number;
  delayMs: number;
  model: string;
  force: boolean;
  dryRun: boolean;
  names?: string[];
}

function parseArgs(argv: string[]): Args {
  const get = (flag: string) => {
    const idx = argv.indexOf(flag);
    return idx !== -1 ? argv[idx + 1] : undefined;
  };
  const has = (flag: string) => argv.includes(flag);

  const namesRaw = get('--names');

  return {
    limit: get('--limit') ? Number(get('--limit')) : undefined,
    offset: get('--offset') ? Number(get('--offset')) : 0,
    role: get('--role') as PlayerRole | undefined,
    team: get('--team'),
    tier: get('--tier') ? Number(get('--tier')) : undefined,
    top: get('--top') ? Number(get('--top')) : undefined,
    concurrency: get('--concurrency') ? Number(get('--concurrency')) : 2,
    delayMs: get('--delay-ms') ? Number(get('--delay-ms')) : 1200,
    model: get('--model') ?? process.env.GEMINI_MODEL ?? 'gemini-flash-latest',
    force: has('--force'),
    dryRun: has('--dry-run'),
    names: namesRaw ? namesRaw.split(',').map((s) => s.trim().toLowerCase()) : undefined,
  };
}

// --- Cache ------------------------------------------------------------------

interface CacheEntry {
  name: string;
  team: string;
  role: PlayerRole;
  lastYearStats: PlayerLastYearStats | null;
  aiForecast: string | null;
  status: 'ok' | 'error';
  updatedAt: string;
}

interface Cache {
  model: string;
  entries: Record<string, CacheEntry>;
}

async function loadCache(): Promise<Cache> {
  try {
    const raw = await fs.readFile(CACHE_JSON, 'utf-8');
    return JSON.parse(raw) as Cache;
  } catch {
    return { model: '', entries: {} };
  }
}

async function saveCache(cache: Cache): Promise<void> {
  await fs.mkdir(path.dirname(CACHE_JSON), { recursive: true });
  await fs.writeFile(CACHE_JSON, JSON.stringify(cache, null, 2), 'utf-8');
}

// --- Selezione giocatori ---------------------------------------------------

function selectPlayers(all: Player[], args: Args): Player[] {
  let players = all;
  if (args.role) players = players.filter((p) => p.role === args.role);
  if (args.team) players = players.filter((p) => p.team.toLowerCase() === args.team!.toLowerCase());
  if (args.tier) players = players.filter((p) => p.tier === args.tier);
  if (args.names) players = players.filter((p) => args.names!.includes(p.name.toLowerCase()));

  if (args.top) {
    // --top ignora i ruoli e ordina tutto il pool per quotazione base
    // (valore) decrescente: prende i migliori N a prescindere dal ruolo,
    // invece dei migliori N per ciascun ruolo. È quello che ci si aspetta
    // da "i 200 migliori giocatori" — i quotati 1 (di norma fuori rosa)
    // restano naturalmente esclusi per ultimi.
    players = [...players].sort((a, b) => b.basePrice - a.basePrice || (b.fvm ?? 0) - (a.fvm ?? 0) || a.name.localeCompare(b.name));
    if (args.offset) players = players.slice(args.offset);
    return players.slice(0, args.top);
  }

  // Ordine stabile: ruolo (P,D,C,A) poi tier poi nome, comodo sia per il file
  // di output sia per processare prima i giocatori più rilevanti (tier bassi).
  const roleOrder: Record<PlayerRole, number> = { P: 0, D: 1, C: 2, A: 3 };
  players = [...players].sort((a, b) => {
    if (roleOrder[a.role] !== roleOrder[b.role]) return roleOrder[a.role] - roleOrder[b.role];
    if (a.tier !== b.tier) return a.tier - b.tier;
    return a.name.localeCompare(b.name);
  });

  if (args.offset) players = players.slice(args.offset);
  if (args.limit) players = players.slice(0, args.limit);
  return players;
}

// --- Chiamata Gemini con ricerca web ---------------------------------------

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;

// Formato a campi separati da "|" invece di JSON strutturato: con
// responseSchema/JSON mode abbiamo verificato che Gemini tende a "inventare"
// numeri per i campi che lo schema obbliga a riempire, ignorando i risultati
// di ricerca reali. In testo libero grounded sulla ricerca resta accurato.
function buildPrompt(player: Player): string {
  return (
    `Sei un analista di fantacalcio esperto del campionato italiano di Serie A. ` +
    `Cerca sul web le statistiche ufficiali di "${player.name}" (${player.team}, ruolo ${ROLE_LABEL[player.role]}) ` +
    `nel campionato di Serie A 2025/26 (stagione conclusa): presenze totali, presenze da titolare, gol, assist, ` +
    `cartellini gialli, cartellini rossi. Cerca anche notizie recenti (forma, infortuni, gerarchie, mercato). ` +
    `Poi scrivi una previsione fantacalcistica pratica di una riga (max 220 caratteri, in italiano, niente markdown) ` +
    `per la stagione 2026/27 entrante, utile per chi deve valutarlo in asta o schierarlo in formazione. ` +
    `Rispondi SOLO con una riga in questo formato esatto, senza altro testo, markdown o spiegazioni: ` +
    `PRESENZE|TITOLARE|GOL|ASSIST|GIALLI|ROSSI|PREVISIONE\n` +
    `Regole: se non trovi un dato numerico preciso per un campo, scrivi -1 in quel campo (non inventarlo). ` +
    `Se non trovi assolutamente nessuna informazione utile su questo giocatore (nemmeno per la previsione), ` +
    `scrivi esattamente ${NO_INFO_TOKEN} in tutti e 7 i campi.`
  );
}

interface ParsedResult {
  lastYearStats: PlayerLastYearStats | null;
  aiForecast: string | null;
}

function parseResponse(raw: string): ParsedResult {
  const parts = raw
    .trim()
    .split('|')
    .map((s) => s.trim());
  if (parts.length !== 7) {
    throw new Error(`Formato risposta inatteso (attesi 7 campi, trovati ${parts.length}): ${raw.slice(0, 200)}`);
  }

  const [presenze, titolare, gol, assist, gialli, rossi, previsioneRaw] = parts;

  const toIntOrNull = (v: string): number | null => {
    if (v === NO_INFO_TOKEN) return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };

  const stats = {
    appearances: toIntOrNull(presenze),
    starterAppearances: toIntOrNull(titolare),
    goals: toIntOrNull(gol),
    assists: toIntOrNull(assist),
    yellowCards: toIntOrNull(gialli),
    redCards: toIntOrNull(rossi),
  };

  // Consideriamo le statistiche disponibili solo se almeno presenze/gol/assist
  // sono stati trovati: sono i campi che un motore di ricerca trova quasi
  // sempre se il giocatore ha effettivamente giocato in Serie A 2025/26.
  // I campi minori mancanti (es. titolarità, cartellini) vengono azzerati
  // invece di lasciare un "-1" visibile in UI: è un'approssimazione accettata
  // per non complicare il tipo Player con troppi opzionali innestati.
  const hasCoreStats = stats.appearances !== null && stats.goals !== null && stats.assists !== null;
  const lastYearStats: PlayerLastYearStats | null = hasCoreStats
    ? {
        appearances: stats.appearances!,
        starterAppearances: stats.starterAppearances ?? 0,
        goals: stats.goals!,
        assists: stats.assists!,
        yellowCards: stats.yellowCards ?? 0,
        redCards: stats.redCards ?? 0,
      }
    : null;

  const previsione = previsioneRaw.replace(/\s+/g, ' ').trim();
  const aiForecast =
    !previsione || previsione === NO_INFO_TOKEN ? null : previsione.length > 300 ? previsione.slice(0, 297) + '…' : previsione;

  return { lastYearStats, aiForecast };
}

async function callGemini(model: string, prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error(
      'GEMINI_API_KEY mancante. Aggiungi GEMINI_API_KEY="..." a .env.local nella radice del progetto (vedi README in Agente_Ansa).'
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools: [{ googleSearch: {} }],
      // thinkingBudget: 0 disabilita il "ragionamento" interno del modello, che
      // altrimenti consuma quasi tutto maxOutputTokens prima di scrivere la
      // risposta vera e propria (troncandola con finishReason MAX_TOKENS).
      generationConfig: { temperature: 0.2, maxOutputTokens: 512, thinkingConfig: { thinkingBudget: 0 } },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Gemini HTTP ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((p: { text?: string }) => p.text ?? '')
    .join(' ')
    .trim();

  if (!text) throw new Error('Risposta Gemini vuota o in formato inatteso.');
  return text;
}

async function fetchPlayerData(model: string, player: Player, retries = 3): Promise<ParsedResult> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const raw = await callGemini(model, buildPrompt(player));
      return parseResponse(raw);
    } catch (err) {
      lastErr = err;
      const backoffMs = 2000 * 2 ** attempt;
      console.warn(`  ⚠ tentativo ${attempt + 1}/${retries + 1} fallito: ${(err as Error).message}`);
      if (attempt < retries) await sleep(backoffMs);
    }
  }
  throw lastErr;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Pool con concorrenza limitata ------------------------------------------

async function runPool<T>(items: T[], concurrency: number, worker: (item: T, index: number) => Promise<void>): Promise<void> {
  let next = 0;
  async function runner() {
    while (next < items.length) {
      const index = next++;
      await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => runner()));
}

// --- Output testuale ---------------------------------------------------------

function formatStatsLine(stats: PlayerLastYearStats | null): string {
  if (!stats) return NO_INFO_DISPLAY;
  return (
    `${stats.appearances}p (${stats.starterAppearances} tit.) • ${stats.goals}g • ${stats.assists}a • ` +
    `${stats.yellowCards}🟨 ${stats.redCards}🟥`
  );
}

async function writeOutputFile(all: Player[], cache: Cache): Promise<void> {
  const roleOrder: Record<PlayerRole, number> = { P: 0, D: 1, C: 2, A: 3 };
  const sorted = [...all].sort((a, b) => {
    if (roleOrder[a.role] !== roleOrder[b.role]) return roleOrder[a.role] - roleOrder[b.role];
    if (a.tier !== b.tier) return a.tier - b.tier;
    return a.name.localeCompare(b.name);
  });

  const lines: string[] = [];
  lines.push(`# Previsioni Agente Ansa — generato il ${new Date().toISOString()}`);
  lines.push(`# Modello: ${cache.model}`);
  lines.push('# Statistiche: stagione 2025/26 — Previsione: stagione 2026/27');
  lines.push('');

  let currentRole: PlayerRole | null = null;
  for (const p of sorted) {
    const entry = cache.entries[p.id];
    if (!entry) continue; // giocatore mai processato: non lo scriviamo nel file finale
    if (p.role !== currentRole) {
      currentRole = p.role;
      lines.push(`## ${ROLE_LABEL[p.role]}`);
    }
    const marker = entry.status === 'error' ? '⚠ ' : '';
    const statsStr = formatStatsLine(entry.lastYearStats);
    const forecastStr = entry.aiForecast ?? NO_INFO_DISPLAY;
    lines.push(`${marker}${p.name} (${p.team}, ${p.role}) — 2025/26: ${statsStr} | 2026/27: ${forecastStr}`);
  }

  await fs.writeFile(OUT_TXT, lines.join('\n') + '\n', 'utf-8');
}

// --- Arricchimento consumato dall'app ---------------------------------------

interface EnrichmentEntry {
  lastYearStats?: PlayerLastYearStats;
  aiForecast?: string;
}

async function writeEnrichmentJson(cache: Cache): Promise<void> {
  const enrichment: Record<string, EnrichmentEntry> = {};
  for (const [playerId, entry] of Object.entries(cache.entries)) {
    if (entry.status !== 'ok') continue;
    const value: EnrichmentEntry = {};
    if (entry.lastYearStats) value.lastYearStats = entry.lastYearStats;
    if (entry.aiForecast) value.aiForecast = entry.aiForecast;
    if (Object.keys(value).length > 0) enrichment[playerId] = value;
  }
  await fs.writeFile(ENRICHMENT_JSON, JSON.stringify(enrichment, null, 2), 'utf-8');
}

// --- Main -------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const selected = selectPlayers(FANTACALCIO_IT_LISTONE, args);

  if (selected.length === 0) {
    console.log('Nessun giocatore corrisponde ai filtri indicati.');
    return;
  }

  console.log(`Giocatori selezionati: ${selected.length} (modello: ${args.model}, concorrenza: ${args.concurrency})`);

  if (args.dryRun) {
    for (const p of selected) console.log(`  - ${p.name} (${p.team}, ${p.role}, tier ${p.tier})`);
    console.log('Dry run: nessuna chiamata effettuata.');
    return;
  }

  const cache = await loadCache();
  cache.model = args.model;

  const toProcess = args.force ? selected : selected.filter((p) => cache.entries[p.id]?.status !== 'ok');
  const skipped = selected.length - toProcess.length;
  if (skipped > 0) console.log(`Salto ${skipped} giocatori già presenti in cache (usa --force per rifarli).`);

  let done = 0;
  await runPool(toProcess, args.concurrency, async (player) => {
    try {
      const { lastYearStats, aiForecast } = await fetchPlayerData(args.model, player);
      cache.entries[player.id] = {
        name: player.name,
        team: player.team,
        role: player.role,
        lastYearStats,
        aiForecast,
        status: 'ok',
        updatedAt: new Date().toISOString(),
      };
      done++;
      console.log(`[${done}/${toProcess.length}] ${player.name}: ${formatStatsLine(lastYearStats)} | ${aiForecast ?? NO_INFO_DISPLAY}`);
    } catch (err) {
      cache.entries[player.id] = {
        name: player.name,
        team: player.team,
        role: player.role,
        lastYearStats: null,
        aiForecast: null,
        status: 'error',
        updatedAt: new Date().toISOString(),
      };
      done++;
      console.error(`[${done}/${toProcess.length}] ${player.name}: FALLITO — ${(err as Error).message}`);
    } finally {
      // Salva la cache dopo ogni giocatore: con centinaia di giocatori e
      // chiamate di rete, un crash a metà run non deve far perdere il lavoro
      // già fatto — al riavvio si riparte da dove ci si era fermati.
      await saveCache(cache);
    }
    if (args.delayMs > 0) await sleep(args.delayMs);
  });

  await writeOutputFile(FANTACALCIO_IT_LISTONE, cache);
  await writeEnrichmentJson(cache);
  console.log(`\nFatto. Output scritto in ${path.relative(ROOT_DIR, OUT_TXT)}`);
  console.log(`Arricchimento per l'app scritto in ${path.relative(ROOT_DIR, ENRICHMENT_JSON)}`);
}

main().catch((err) => {
  console.error('Errore fatale:', err);
  process.exit(1);
});
