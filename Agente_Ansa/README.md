# Agente Ansa

Agente AI che scandaglia il web (ricerca Google integrata in Gemini) per
ogni giocatore del listone FantaWarRoom (`src/data/presetListoni/fantacalcioIt.ts`,
~550 giocatori) e recupera:

- le **statistiche della stagione 2025/26** (presenze, presenze da titolare,
  gol, assist, cartellini gialli/rossi);
- una **previsione fantacalcistica di una riga** per la stagione 2026/27
  entrante.

Scrive due output:

1. `previsioni.txt` (in questa cartella) — riepilogo leggibile, per uso umano.
2. `src/data/presetListoni/arricchimento.json` — dati strutturati che **l'app
   legge a runtime** (`src/data/presetListoni/index.ts`) per popolare le
   sezioni "Statistiche Anno Scorso" e "Previsioni Stagione" nella scheda
   dettaglio giocatore. Aggiornalo rilanciando lo script; l'app lo riprende
   automaticamente al prossimo refresh, senza bisogno di altre modifiche.

## Setup

Serve una API key Gemini (Google AI Studio: https://aistudio.google.com/apikey).

È già configurata in `.env.local` alla radice del progetto:

```
GEMINI_API_KEY="AQ...."
```

(riusa la chiave "Default Gemini Key" del progetto "Default Gemini Project"
su AI Studio — la creazione di una chiave dedicata è stata bloccata da Google
come "richiesta sospetta", probabilmente per l'automazione browser usata.
Se preferisci una chiave dedicata solo a questo script, creala manualmente da
https://aistudio.google.com/apikey e sostituisci il valore).

## Uso

Dalla radice del progetto:

```bash
# prova su pochi giocatori prima di lanciare tutto il listone
npx tsx Agente_Ansa/agente.ts --limit 5

# vedere chi verrebbe processato senza chiamare l'API
npx tsx Agente_Ansa/agente.ts --dry-run --role P --tier 1

# solo i portieri di tier 1
npx tsx Agente_Ansa/agente.ts --role P --tier 1

# solo una squadra
npx tsx Agente_Ansa/agente.ts --team Inter

# giocatori specifici (per nome, come compare nel listone)
npx tsx Agente_Ansa/agente.ts --names "Martinez L.,McTominay"

# tutto il listone (~550 giocatori: lento, valuta i costi/i limiti di rate della tua chiave)
npx tsx Agente_Ansa/agente.ts
```

Oppure, tramite lo script già presente in `package.json`:

```bash
npm run agente-ansa -- --limit 5
```

### Opzioni principali

| Flag            | Default               | Descrizione                                                   |
|-----------------|------------------------|-----------------------------------------------------------------|
| `--limit N`     | tutti                  | processa solo i primi N giocatori selezionati                   |
| `--offset N`    | 0                      | salta i primi N                                                  |
| `--role P/D/C/A`| tutti                  | filtra per ruolo                                                 |
| `--team NOME`   | tutte                  | filtra per squadra                                               |
| `--tier 1-5`    | tutti                  | filtra per tier (1 = top)                                        |
| `--names a,b,c` | —                      | filtra per nome esatto (case-insensitive, come compare nel listone) |
| `--concurrency` | 2                      | richieste parallele a Gemini                                      |
| `--delay-ms`    | 1200                   | pausa tra una richiesta e l'altra per worker (rate limiting)      |
| `--model`       | `gemini-flash-latest`  | modello Gemini da usare                                           |
| `--force`       | off                    | ignora la cache e rigenera anche i giocatori già fatti             |
| `--dry-run`     | off                    | mostra solo la selezione, nessuna chiamata API                     |

## Come funziona

1. Legge il listone base da `src/data/presetListoni/fantacalcioIt.ts`.
2. Applica i filtri passati da CLI.
3. Per ogni giocatore non ancora presente in cache, fa **una sola chiamata**
   Gemini con lo strumento di ricerca web (`googleSearch`, thinking
   disattivato) e un prompt che chiede statistiche 2025/26 + previsione
   2026/27 in un formato a campi separati da `|` (non JSON: con
   `responseSchema`/JSON mode il modello tende a inventare i campi numerici
   invece di usare i risultati di ricerca reali — verificato empiricamente).
4. Se un campo numerico non viene trovato, il modello scrive `-1`; se non
   trova assolutamente nulla sul giocatore, scrive `NESSUNA_INFORMAZIONE` su
   tutta la riga. Le statistiche vengono considerate disponibili solo se
   presenze/gol/assist sono stati trovati; i campi minori mancanti (titolarità,
   cartellini) vengono azzerati per semplicità.
5. Salva ogni risultato in `.cache/previsioni-cache.json` **subito dopo ogni
   giocatore** — così un run interrotto (rete, rate limit, crash) può
   ripartire da dove si era fermato rilanciando lo stesso comando: i
   giocatori già in cache con esito `ok` vengono saltati.
6. Alla fine (o rilanciando lo script senza filtri) rigenera sia
   `previsioni.txt` sia `arricchimento.json` a partire da tutta la cache
   disponibile.

## Output

`previsioni.txt` — una riga per giocatore, raggruppate per ruolo:

```
## Centrocampista
McTominay (Napoli, C) — 2025/26: 33p (0 tit.) • 10g • 3a • 1🟨 0🟥 | 2026/27: Top di reparto assoluto...
```

`src/data/presetListoni/arricchimento.json` — dati strutturati per giocatore
(`lastYearStats`, `aiForecast`), keyed by id del listone. È l'unico file di
questo agente che vive dentro `src/`: l'app lo importa e lo fonde col listone
base a runtime (vedi `src/data/presetListoni/index.ts`). Se un giocatore non
è ancora stato processato, semplicemente non compare nel JSON e l'app mostra
"Nessuna Informazione Disponibile" nella sua scheda.

`.cache/previsioni-cache.json` — dati grezzi (non versionato in git): risposta
completa per ogni giocatore, con stato `ok`/`error` e timestamp. Serve solo a
far ripartire i run interrotti.

## Limiti noti

- Le statistiche/previsioni dipendono dalla qualità dei risultati di ricerca
  di Gemini nel momento in cui giri lo script: rilanciare con `--force`
  produce risultati leggermente diversi run dopo run (specialmente per i
  campi minori come titolarità/cartellini, più difficili da trovare).
- Su ~550 giocatori, con `--delay-ms 1200` e `--concurrency 2`, il run
  completo richiede circa 5-6 ore e un numero di chiamate pari al numero di
  giocatori: valuta i limiti/costi della tua chiave prima di lanciarlo tutto
  in una volta. Conviene segmentare per ruolo/tier con più run separati.
