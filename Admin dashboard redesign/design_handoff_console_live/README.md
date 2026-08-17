# Handoff: Console Live — war room asta (mobile)

## Overview
Console Live è la schermata "war room" di un'app di asta fantacalcio: durante l'asta live il manager
deve decidere in pochi secondi quanto offrire su un giocatore chiamato, sapendo quanto gli resta,
chi resta libero nel ruolo e come stanno le squadre rivali.
Il redesign copre 4 schermate mobile (390×844) collegate da una tab bar:

1. **Chiamata** (`6a`) — hero con il giocatore in asta, max bid e statistiche prezzo, sotto i rimanenti nel ruolo
2. **Rose** (`6b`) — accordion di tutte le squadre della lega con crediti residui e reparti
3. **Listone** (`6c`) — ricerca/filtro ruolo: liberi con max bid, aggiudicati con prezzo pagato
4. **History** (`6d`) — KPI d'asta e ultime aggiudicazioni con scostamento dal valore

## About the Design Files
I file in questo bundle sono **design reference realizzati in HTML**: prototipi che mostrano aspetto e
comportamento previsti, **non codice di produzione da copiare**. Il compito è **ricreare queste schermate
nell'ambiente del codebase di destinazione** (React/Vue/SwiftUI/native…) usando i pattern, i componenti e la
libreria di stile già esistenti. Se non esiste ancora un ambiente, scegliere il framework più adatto al progetto
e implementarvi i design. I dati nel prototipo sono mock: sostituirli con i dati reali dell'asta.

`Console Live - Redesign.dc.html` va aperto in un browser (richiede `support.js` accanto). Il documento è un
"design doc" con più turni di iterazione: **la versione da implementare è il turno 6 (opzioni 6a, 6b, 6c, 6d)**,
in cima al file. I turni 5 e 4 sono versioni precedenti (5a/5b mobile, 4a/4b desktop 1440px) — utili solo come storia.

## Fidelity
**High-fidelity.** Colori, tipografia, spaziature e interazioni sono definitivi per il mobile.
Ricreare la UI in modo fedele usando le librerie del codebase. Il desktop (turno 4) è hi-fi ma superato dal turno 6:
per il desktop chiedere conferma al designer prima di implementare.

## Screens / Views

Tutte le schermate: canvas 390×844, colonna flex — header fisso (58px circa), corpo scrollabile (`overflow-y:auto`),
tab bar fissa in basso. Sfondo pagina `#0a0b0f`, card `#11141a`, card annidate/righe `#0d1014`.

### Header (comune a tutte)
- padding `14px 16px 12px`, border-bottom `1px solid rgba(255,255,255,.07)`, flex row, gap 10px
- logo: 30×30, radius 9px, bg `#3ddc97`, testo `WR` 12px/800 su `#07160f`
- titolo 13px/800; sottotitolo 11px `#8a8f9c` (contesto della schermata)
- a destra: label `RESIDUI` 10px/700 letter-spacing .08em `#8a8f9c`, valore 16px/700 JetBrains Mono `#f5c451`

### Tab bar (comune)
- padding `6px 10px 14px`, bg `#0d1014`, border-top `1px solid rgba(255,255,255,.07)`
- grid 4 colonne, gap 4px; ogni tab 50px altezza, radius 12px, icona 18px + label 10px/700
- attiva: colore `#3ddc97` + bg `rgba(61,220,151,.1)`; inattiva `#8a8f9c`
- tab: Chiamata (icona shield-alert), Rose (users), Listone (database), History (history) — icone Lucide

### 1. Chiamata (6a)
**Purpose**: decidere l'offerta sul giocatore in asta.
- Corpo: padding `14px 16px 18px`, colonna gap 14px.
- **Hero card**: radius 18px, border `1px solid rgba(61,220,151,.28)`,
  bg `linear-gradient(180deg,rgba(61,220,151,.10),rgba(61,220,151,0) 62%)` sopra `#11141a`, padding 16px, gap 14px.
  - Riga superiore: badge ruolo 36×36 radius 11px (colore ruolo su fondo colore+`22`), colonna con
    eyebrow `IN ASTA ORA` (10px/800, `#3ddc97`, uppercase, letter-spacing .12em), **campo nome giocatore**
    (input trasparente, 20px/800, letter-spacing -.02em; placeholder = giocatore selezionato, colore `#edeef2`)
    e meta 11.5px `#8a8f9c` ("Inter · rank #1 · titolare"); a destra bottone chevron 34×34 radius 10px
    (`#0d1014`, border `rgba(255,255,255,.1)`).
  - **Dropdown giocatore** (aperto su focus del campo o tap sul chevron): pannello `#0d1014`, border
    `rgba(255,255,255,.1)`, radius 14px; riga di chip filtro ruolo (TUTTI/P/D/C/A, 30px, radius 8px; attiva
    bg `rgba(61,220,151,.14)`, border `rgba(61,220,151,.45)`, testo `#3ddc97`); lista max-height 216px scrollabile
    con righe (ruolo, nome 13px/600, club+rank 10.5px mono `#5d6270`, max bid 13px/700 `#3ddc97`); riga selezionata
    bg `rgba(61,220,151,.07)`; footer bottone "Chiudi" 40px, testo 11.5px/700 `#8a8f9c`.
    Solo giocatori **non ancora assegnati**; ricerca per nome o club; il filtro ruolo è indipendente dalla ricerca.
  - **Numeri**: label `MAX BID` 10px/700 uppercase `#8a8f9c` + valore 64px/700 JetBrains Mono `#3ddc97`
    line-height .88, letter-spacing -.035em. A destra: `OFFERTA MAX` + valore 26px/700 mono `#f5c451`
    (tetto = residui − slot ancora da riempire) e sotto la riga di scostamento 10.5px `#8a8f9c`
    ("+19 sopra il valore" / "−4 sotto il valore" / "in linea col valore"), calcolata su offerta − valore del **giocatore selezionato**.
  - **Griglia 3 colonne** (gap 8px, celle `#0d1014` radius 11px padding 10px): VALORE, RANGE, RESIDUI DOPO.
    Label 9.5px/700 uppercase `#8a8f9c`, valore 19px/700 mono (15px per il range).
- **Rimanenti nel ruolo**: intestazione ("Se lo perdi, restano i centrocampisti" 12.5px/800 + badge ruolo +
  conteggio "5 liberi · max bid" 11px `#5d6270`). Card radius 16px con righe 12px/14px:
  tier badge TOP (`#3ddc97`) / BUO (`#f5c451`) 9px mono con bordo, nome 13px/600, club 12px `#5d6270`,
  "val NN" 11px mono `#5d6270`, max bid 15px/700 nel colore del tier. **La lista segue il ruolo del giocatore
  selezionato** (attaccante → attaccanti, centrocampista → centrocampisti…), ordinata per max bid decrescente,
  primi 3 = TOP, resto = BUO. Ogni riga è tappabile e seleziona quel giocatore. Footer link "Vedi tutti gli attaccanti"
  (articolo corretto per ruolo) 12px/700 `#c9ccd4` + chevron-right 14px.
- **Barra offerta** (sopra la tab bar, bg `#0d1014`, border-top `rgba(255,255,255,.1)`, padding `10px 16px 12px`):
  stepper − / input / + (campo `#08090c`, border `rgba(255,255,255,.1)`, radius 12px, bottoni 46×46, valore 20px/700 mono),
  bottone "Offerta max" 46px (porta l'offerta al tetto), bottone "Assegna" 46px bg `#edeef2` testo `#0a0b0f` 15px/800 radius 12px.

### 2. Rose (6b)
**Purpose**: capire quanto possono spingere i rivali e come sta la propria rosa.
- Riga di contesto: "8 squadre · 12 aggiudicati" 12px/800 + hint "tocca per espandere" 11px `#5d6270`.
- Card unica radius 16px con una riga per squadra (accordion):
  - Testa (padding `13px 14px`, gap 10px, cursor pointer, border-bottom `rgba(255,255,255,.06)`):
    chevron-down/up 14px `#5d6270`, nome (13px/700; la propria squadra 800 e `#3ddc97` con bg riga `rgba(61,220,151,.06)`),
    slot "8/25" 10px mono `#5d6270`, crediti residui 15px/700 mono — colore `#3ddc97` ≥480, `#f5c451` ≥430, altrimenti `#ff6b6b`
    (la propria squadra sempre `#f5c451`).
  - Corpo espanso (bg `#0d1014`, padding `10px 14px 12px`, gap 10px): una riga per reparto con
    lettera ruolo (10px mono, colore ruolo), conteggio slot "3/8" 11px mono `#8a8f9c`, a destra il dato crediti,
    e sotto l'elenco giocatori con prezzo in testo compatto 11.5px/1.5 `#c9ccd4` (`text-wrap:pretty`) —
    così una rosa da 20+ giocatori resta leggibile senza allungare la schermata.
    Squadra vuota: "Nessun giocatore ancora acquistato" 11.5px `#5d6270`.
  - **Solo per la propria squadra**: barra spesa/budget di reparto (3px, radius 99px, traccia `rgba(255,255,255,.08)`,
    fill `rgba(255,255,255,.35)`, **rosso `#ff6b6b` solo se spesa > budget pianificato**) e dato "121/110".
    Per le altre squadre solo i crediti spesi ("34 cr"): il budget pianificato è un dato personale.
- Default: la propria squadra espansa, le altre collassate. Stato di apertura indipendente per squadra.

### 3. Listone (6c)
**Purpose**: consultare tutti i giocatori e i prezzi già fatti.
- Sotto l'header, blocco filtri (padding `12px 16px 10px`, border-bottom): campo ricerca con icona search 16px
  a 12px da sinistra (input `#12141a`, radius 12px, padding `12px 12px 12px 36px`, 14px) + riga chip ruolo
  (stessi stili del dropdown di 6a). **Ricerca e filtro sono condivisi con il dropdown di 6a** (stesso stato).
- Riga di conteggio "12 liberi · 12 aggiudicati" 11px `#5d6270` + a destra "max bid · prezzo pagato".
- Card radius 16px: prima i **liberi** (ruolo, nome 13px/600, club+rank 10.5px mono, max bid 15px/700 `#3ddc97`; tappabili,
  selezionano il giocatore per la chiamata), poi gli **aggiudicati** ordinati per prezzo decrescente:
  riga con `opacity:.62`, ruolo attenuato (colore ruolo + `80`), nome con sotto "a <squadra>" 10.5px `#5d6270`,
  club, e **prezzo pagato** 15px/700 mono `#8a8f9c` al posto del max bid (non più utile). Righe non tappabili.
- Stato vuoto: "Nessun giocatore libero con questo filtro" 12px `#5d6270`, padding 18px.

### 4. History (6d)
**Purpose**: leggere l'andamento prezzi della lega.
- Griglia 3 KPI (card `#11141a`, radius 12px, padding 11px): AGGIUDICATI 12, PREZZO MEDIO 39,
  VS VALORE +9% (`#f5c451`). Label 9.5px/700 uppercase, valore 20px/700 mono.
- "Ultime chiamate" 12.5px/800 + hint "prezzo · scostamento".
- Card radius 16px, righe padding `12px 14px`: lettera ruolo, nome 13px/600 con sotto
  "chiamato da <squadra> → <squadra vincente>" 11px `#5d6270`, a destra prezzo 15px/700 mono e
  scostamento 10.5px mono (`#ff6b6b` se sopra il valore, `#3ddc97` se sotto).

## Interactions & Behavior
- **Selezione giocatore**: focus sul campo nome o tap sul chevron apre il dropdown; digitando si filtra per nome/club;
  le chip filtrano per ruolo; tap su una riga seleziona, chiude il pannello e azzera la ricerca.
  Aggiorna hero (max bid, valore, range, badge ruolo, meta), scostamento, lista rimanenti e titolo/articolo.
- **Offerta**: − / + a step 1 (clamp 1–400), input numerico libero, "Offerta max" porta al tetto.
  Ogni variazione ricalcola "residui dopo" e lo scostamento dal valore. Lo stato dell'offerta è condiviso tra le schermate.
- **Rose**: tap sulla testa riga espande/collassa (chevron ruota da down a up). Più squadre possono restare aperte.
- **Listone**: tap su un libero lo seleziona come giocatore in asta (utile per prepararsi alla chiamata); gli aggiudicati non sono interattivi.
- **Navigazione**: tab bar, 4 destinazioni, stato conservato passando da una all'altra.
- Nessuna animazione richiesta oltre a transizioni brevi (150–200ms ease) su hover/tap e sull'apertura dei pannelli.
- Responsive: layout pensato per 390–430px di larghezza; l'altezza è flessibile (solo il corpo scrolla).

## State Management
- `bid` (numero, default 150; clamp 1–400)
- `selectedPlayerId` (giocatore in asta)
- `query` (stringa di ricerca, condivisa 6a/6c)
- `roleFilter` (`TUTTI|P|D|C|A`, condivisa 6a/6c)
- `pickerOpen` (bool, dropdown 6a)
- `expandedTeams` (mappa teamId → bool; default: propria squadra aperta)
- Derivati: giocatori liberi filtrati, rimanenti nel ruolo del selezionato con tier TOP/BUO,
  residui dopo l'offerta, tetto (residui − slot residui), scostamento dal valore, colori credito per squadra.
- Dati necessari dal backend: listone giocatori (nome, club, ruolo, rank, valore, range, max bid consigliato),
  aggiudicazioni (giocatore, squadra chiamante, squadra vincente, prezzo), rose e crediti residui per squadra,
  budget pianificati per reparto (solo utente).

## Design Tokens
Colori
- Sfondo pagina `#0a0b0f` · superficie card `#11141a` · superficie annidata / barre `#0d1014` · input `#08090c` / `#12141a`
- Bordi `rgba(255,255,255,.07)` (divisori), `rgba(255,255,255,.08)` (card), `rgba(255,255,255,.1)` (input/bottoni)
- Testo primario `#edeef2` · secondario `#c9ccd4` · muto `#8a8f9c` · debole `#5d6270`
- Accento/positivo `#3ddc97` (su fondo verde `#07160f`) · attenzione `#f5c451` · negativo `#ff6b6b` · info `#5bc8ff`
- Ruoli: P `#5bc8ff`, D `#3ddc97`, C `#f5c451`, A `#ff6b6b` (usati solo su lettere/badge, non sulle barre)
- Highlight riga propria/selezionata `rgba(61,220,151,.06–.10)`

Tipografia
- UI: Manrope 400/500/600/700/800 — 9.5 / 10 / 10.5 / 11 / 11.5 / 12 / 12.5 / 13 / 20px
- Numeri: JetBrains Mono 400/600/700 — 10 / 11 / 13 / 15 / 16 / 19 / 20 / 26 / 64px
- Label uppercase: 9.5–10px, weight 700, letter-spacing .06–.12em

Spaziatura: 4 / 6 / 8 / 10 / 12 / 14 / 16 / 18px · Radius: 4 / 5 / 8 / 9 / 10 / 11 / 12 / 14 / 16 / 18 / 99px
Hit target minimo 44px (stepper e bottoni 46–50px) · Barre di avanzamento 3–4px

## Screenshots
`screenshots/6a-chiamata.png`, `6b-rose.png`, `6c-listone.png`, `6d-history.png` — render a 2x delle quattro schermate (390×844 di design).

## Assets
- Icone: **Lucide** (`search`, `chevron-down`, `chevron-up`, `chevron-right`, `shield-alert`, `users`, `database`, `history`) — usare la libreria icone già presente nel codebase se diversa.
- Font: Manrope + JetBrains Mono (Google Fonts). Nessuna immagine.

## Files
- `Console Live - Redesign.dc.html` — prototipo interattivo; implementare **il turno 6 (6a–6d)** in cima al file. Turni 5 e 4 = storia iterazioni.
- `support.js` — runtime del prototipo, necessario solo per aprirlo in locale. Non fa parte del design.
