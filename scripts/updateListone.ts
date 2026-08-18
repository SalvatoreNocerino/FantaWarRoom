// Aggiorna src/data/presetListoni/fantacalcioIt.ts leggendo la pagina
// pubblica delle quotazioni di fantacalcio.it (nessun login richiesto: i
// dati sono renderizzati lato server in una tabella HTML, vedi indagine in
// chat). Pensato per girare quotidianamente via job schedulato (vedi
// .github/workflows o routine equivalente) che poi committa e pusha il
// risultato — non fa il push da solo.
//
// Uso:
//   npx tsx scripts/updateListone.ts             # scarica e scrive i file
//   npx tsx scripts/updateListone.ts --dry-run    # scarica e riepiloga, non scrive nulla
//   npx tsx scripts/updateListone.ts --html-file path/to/quotazioni.html   # usa un file locale invece di scaricare (debug)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Player, PlayerRole } from '../src/types';
import { FANTACALCIO_IT_LISTONE as OLD_LISTONE } from '../src/data/presetListoni/fantacalcioIt';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const QUOTAZIONI_URL = 'https://www.fantacalcio.it/quotazioni-fantacalcio';
const OUTPUT_PATH = path.join(ROOT, 'src/data/presetListoni/fantacalcioIt.ts');
const ENRICHMENT_PATH = path.join(ROOT, 'src/data/presetListoni/arricchimento.json');
// Sotto questa soglia il parsing viene considerato fallito (pagina cambiata,
// blocco anti-bot, errore di rete parziale, ecc.): meglio fermarsi senza
// toccare i dati esistenti che pubblicare un listone dimezzato.
const MIN_EXPECTED_PLAYERS = 400;

interface ScrapedRow {
  fcId: string;
  name: string;
  team: string;
  role: PlayerRole;
  price: number;
  fvm: number | null;
}

function normalizeIdentity(name: string, team: string): string {
  const norm = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]/g, '');
  return `${norm(name)}|${norm(team)}`;
}

function titleCaseSlug(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function toRole(letter: string): PlayerRole {
  const l = letter.toUpperCase();
  if (l === 'P' || l === 'D' || l === 'C') return l;
  return 'A';
}

// La pagina usa entità numeriche per gli accenti (es. "Dod&#xF2;" per
// "Dodò"), non il carattere UTF-8 diretto: senza decodifica il nome
// scrappato non combacia con quello del listone precedente e perde
// l'arricchimento Agente_Ansa già fatto per quel giocatore.
function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function toNumber(raw: string): number | null {
  const n = parseFloat(raw.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

async function fetchQuotazioniHtml(): Promise<string> {
  const res = await fetch(QUOTAZIONI_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FantaWarRoomBot/1.0; +https://fantawarroom.vercel.app)' },
  });
  if (!res.ok) throw new Error(`Fetch quotazioni fallita: HTTP ${res.status}`);
  return res.text();
}

// La tabella "Classic" è renderizzata lato server dentro <tr class="player-row">,
// una riga per giocatore, con ruolo/squadra/id fantacalcio.it/prezzo/FVM negli
// attributi e nelle celle. Parsing per regex (niente dipendenza da un parser
// HTML): la struttura è regolare e senza <tr> annidati.
function parseRows(html: string): { rows: ScrapedRow[]; skipped: number } {
  const rows: ScrapedRow[] = [];
  let skipped = 0;
  const blocks = html.match(/<tr class="player-row"[\s\S]*?<\/tr>/g) ?? [];

  for (const block of blocks) {
    const roleMatch = block.match(/data-filter-role-classic="([a-z])"/);
    // Lo slug del giocatore (secondo segmento) può contenere entità HTML per
    // nomi accentati (es. "dod&#xF2;" per "dodò"): non lo usiamo, quindi
    // accettiamo qualunque carattere che non sia "/" o '"' invece di
    // restringerlo a [a-z0-9-] — altrimenti la riga fallisce il match ed è
    // scartata per intero.
    const linkMatch = block.match(
      /href="https:\/\/www\.fantacalcio\.it\/serie-a\/squadre\/([a-z0-9-]+)\/[^"/]+\/(\d+)"/
    );
    const nameMatch = block.match(/player-name player-link"[\s\S]*?<span>([^<]+)<\/span>/);
    const priceMatch = block.match(/class="player-classic-initial-price" data-col-key="c_qi">\s*([\d.,]+)/);
    const fvmMatch = block.match(/class="player-classic-fvm" data-col-key="c_fvm">\s*([\d.,]+)/);

    const price = priceMatch ? toNumber(priceMatch[1]) : null;

    if (!roleMatch || !linkMatch || !nameMatch || price === null) {
      skipped++;
      continue;
    }

    rows.push({
      fcId: linkMatch[2],
      team: titleCaseSlug(linkMatch[1]),
      name: decodeHtmlEntities(nameMatch[1]).trim(),
      role: toRole(roleMatch[1]),
      price,
      fvm: fvmMatch ? toNumber(fvmMatch[1]) : null,
    });
  }

  return { rows, skipped };
}

// Stessa formula di src/utils/playersImport.ts (buildFairValueBracket) —
// tenuta duplicata qui volutamente: questo script deve poter girare anche
// se in futuro l'import manuale cambia formula, senza doverle tenere
// sincronizzate a forza.
function buildFairValueBracket(price: number, fvm: number | null): string {
  if (fvm !== null && fvm > 0) {
    const min = Math.max(1, Math.round(fvm * 0.85));
    const max = Math.round(fvm * 1.15);
    return `${min}-${max} FM`;
  }
  return `${Math.round(price * 3)}-${Math.round(price * 4)} FM`;
}

// Stessa logica di assignTiersByRole in playersImport.ts: tier per
// percentile di prezzo nello stesso ruolo, niente soglie assolute.
function assignTiers(players: Player[]): void {
  const byRole = new Map<PlayerRole, Player[]>();
  for (const p of players) {
    if (!byRole.has(p.role)) byRole.set(p.role, []);
    byRole.get(p.role)!.push(p);
  }

  for (const rolePlayers of byRole.values()) {
    const sorted = [...rolePlayers].sort((a, b) => b.basePrice - a.basePrice);
    const n = sorted.length;
    sorted.forEach((p, i) => {
      const percentile = n > 1 ? i / (n - 1) : 0;
      if (percentile <= 0.15) p.tier = 1;
      else if (percentile <= 0.5) p.tier = 2;
      else p.tier = 3;
      p.expectedFantaAvg = p.tier === 1 ? 7.2 : p.tier === 2 ? 6.6 : 6.1;
    });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const htmlFileIdx = args.indexOf('--html-file');
  const htmlFile = htmlFileIdx !== -1 ? args[htmlFileIdx + 1] : null;

  const html = htmlFile ? fs.readFileSync(htmlFile, 'utf-8') : await fetchQuotazioniHtml();
  const { rows, skipped } = parseRows(html);

  console.log(`[updateListone] Righe riconosciute: ${rows.length}, scartate: ${skipped}.`);

  if (rows.length < MIN_EXPECTED_PLAYERS) {
    throw new Error(
      `Solo ${rows.length} giocatori trovati (attesi almeno ${MIN_EXPECTED_PLAYERS}): probabile cambio di formato ` +
        `della pagina fantacalcio.it. Mi fermo senza toccare i dati esistenti.`
    );
  }

  // Id stabile = fcit_<id numerico fantacalcio.it>, letto dall'URL del
  // profilo di ogni giocatore: a differenza degli id "imp_..." generati
  // dall'import manuale (timestamp + random), questo resta identico da un
  // giorno all'altro, così l'arricchimento (Agente_Ansa) sotto non deve
  // essere ri-migrato ad ogni run dopo il primo.
  const players: Player[] = rows.map((r) => ({
    id: `fcit_${r.fcId}`,
    name: r.name,
    role: r.role,
    team: r.team,
    basePrice: r.price,
    expectedFantaAvg: 6.5, // sovrascritto da assignTiers
    expectedGoalsAssists: 'N/A',
    tier: 3, // sovrascritto da assignTiers
    notes: 'Aggiornato automaticamente da fantacalcio.it',
    fairValueBracket: buildFairValueBracket(r.price, r.fvm),
    fvm: r.fvm ?? undefined,
  }));

  assignTiers(players);

  // Migra l'arricchimento (statistiche stagione scorsa + previsione
  // Agente_Ansa, vedi Agente_Ansa/README.md) dalle chiavi del listone
  // precedente a quelle nuove, riconoscendo i giocatori per nome+squadra
  // normalizzati. Chi non trova corrispondenza (nuovo acquisto, refuso nel
  // nome) semplicemente non porta con sé l'arricchimento — va rilanciato
  // Agente_Ansa per lui.
  const oldIdByIdentity = new Map<string, string>();
  for (const p of OLD_LISTONE) {
    oldIdByIdentity.set(normalizeIdentity(p.name, p.team), p.id);
  }

  let oldEnrichment: Record<string, unknown> = {};
  try {
    oldEnrichment = JSON.parse(fs.readFileSync(ENRICHMENT_PATH, 'utf-8'));
  } catch {
    // Nessun arricchimento pregresso: prima esecuzione o file assente, va bene.
  }

  const newEnrichment: Record<string, unknown> = {};
  let migrated = 0;
  for (const p of players) {
    const oldId = oldIdByIdentity.get(normalizeIdentity(p.name, p.team));
    if (oldId && oldEnrichment[oldId]) {
      newEnrichment[p.id] = oldEnrichment[oldId];
      migrated++;
    }
  }
  console.log(`[updateListone] Arricchimento migrato per ${migrated}/${players.length} giocatori.`);

  if (dryRun) {
    console.log(`[updateListone] Dry run: nessun file scritto.`);
    return;
  }

  const header =
    `import { Player } from '../../types';\n\n` +
    `// Aggiornato automaticamente ogni giorno da scripts/updateListone.ts a partire\n` +
    `// dalla pagina pubblica delle quotazioni di fantacalcio.it. Non modificare a\n` +
    `// mano: le modifiche verrebbero sovrascritte al prossimo refresh.\n` +
    `export const FANTACALCIO_IT_LISTONE: Player[] = `;

  fs.writeFileSync(OUTPUT_PATH, header + JSON.stringify(players, null, 2) + ';\n');
  fs.writeFileSync(ENRICHMENT_PATH, JSON.stringify(newEnrichment, null, 2) + '\n');

  console.log(`[updateListone] Scritti ${players.length} giocatori in ${path.relative(ROOT, OUTPUT_PATH)}.`);
}

main().catch((err) => {
  console.error('[updateListone] Errore:', err instanceof Error ? err.message : err);
  process.exit(1);
});
