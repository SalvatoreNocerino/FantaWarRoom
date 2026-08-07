import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parsePlayersCsv, parsePlayersXlsxBuffer, parsePlayersFileContent } from '../src/utils/playersImport';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

describe('parsePlayersCsv — file reale Fantapazz', () => {
  const csvText = readFileSync(path.join(fixturesDir, 'listone_fantapazz.csv'), 'utf-8');

  it('importa tutti i 671 giocatori del listone reale, riconoscendo le colonne dall\'header', () => {
    const players = parsePlayersCsv(csvText);
    expect(players.length).toBe(671);
  });

  it('assegna nome, ruolo, squadra e prezzo corretti al primo portiere (Svilar)', () => {
    const players = parsePlayersCsv(csvText);
    const svilar = players.find((p) => p.name === 'Svilar');

    expect(svilar).toBeDefined();
    expect(svilar!.role).toBe('P');
    expect(svilar!.team).toBe('Roma');
    expect(svilar!.basePrice).toBe(35);
  });

  it('gestisce correttamente i nomi tra virgolette con spazi/punti (es. "Martinez J.")', () => {
    const players = parsePlayersCsv(csvText);
    const found = players.find((p) => p.name === 'Martinez J.');
    expect(found).toBeDefined();
    expect(found!.role).toBe('P');
  });

  it('assegna tier 1 al giocatore più caro di ciascun ruolo', () => {
    const players = parsePlayersCsv(csvText);
    const attaccanti = players.filter((p) => p.role === 'A');
    const piuCaro = [...attaccanti].sort((a, b) => b.basePrice - a.basePrice)[0];
    expect(piuCaro.tier).toBe(1);
  });

  it('non contiene righe spazzatura (nomi vuoti o a 1 carattere)', () => {
    const players = parsePlayersCsv(csvText);
    players.forEach((p) => expect(p.name.length).toBeGreaterThan(1));
  });
});

describe('parsePlayersXlsxBuffer — file reale fantacalcio.it', () => {
  const buffer = readFileSync(path.join(fixturesDir, 'quotazioni_fantacalcio.xlsx'));
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

  it('importa i giocatori dal foglio "Tutti" senza duplicarli con i fogli per ruolo', async () => {
    const players = await parsePlayersXlsxBuffer(arrayBuffer);
    // Il foglio "Tutti" ha 493 righe dati; se duplicassimo con Portieri/Difensori/
    // Centrocampisti/Attaccanti avremmo quasi il doppio.
    expect(players.length).toBe(493);
  });

  it('esclude i giocatori del foglio "Ceduti"', async () => {
    const players = await parsePlayersXlsxBuffer(arrayBuffer);
    const rossi = players.find((p) => p.name === 'Rossi F.' && p.team === 'Atalanta');
    expect(rossi).toBeUndefined();
  });

  it('salta correttamente la riga titolo sopra l\'header e legge Qt.A come prezzo, non Qt.I', async () => {
    const players = await parsePlayersXlsxBuffer(arrayBuffer);
    const lautaro = players.find((p) => p.name === 'Martinez L.' && p.team === 'Inter');

    expect(lautaro).toBeDefined();
    expect(lautaro!.role).toBe('A');
    expect(lautaro!.basePrice).toBe(35); // Qt.A, non Qt.A M (mantra) né FVM
    expect(lautaro!.tier).toBe(1);
  });

  it('usa il ruolo classico (R) e non quello Mantra (RM)', async () => {
    const players = await parsePlayersXlsxBuffer(arrayBuffer);
    // Dimarco ha RM = "E;W" (esterno/ala in Mantra) ma R = "D" in classic
    const dimarco = players.find((p) => p.name === 'Dimarco');
    expect(dimarco).toBeDefined();
    expect(dimarco!.role).toBe('D');
  });

  it('usa il FVM ufficiale per costruire la fascia di fair value quando disponibile', async () => {
    const players = await parsePlayersXlsxBuffer(arrayBuffer);
    const lautaro = players.find((p) => p.name === 'Martinez L.' && p.team === 'Inter')!;
    // FVM reale = 370 -> fascia attesa 315-425 (370*0.85 e 370*1.15 arrotondati)
    expect(lautaro.fairValueBracket).toBe('315-425 FM');
  });
});

describe('parsePlayersFileContent — dispatch per estensione file', () => {
  it('un file .json con array di giocatori viene interpretato come JSON, non CSV', () => {
    const json = JSON.stringify([
      { id: 'x', name: 'Test Player', role: 'A', team: 'Roma', basePrice: 10, expectedFantaAvg: 6, expectedGoalsAssists: 'N/A', tier: 3, notes: '' },
    ]);
    const players = parsePlayersFileContent(json, 'mio_listone.json');
    expect(players.length).toBe(1);
    expect(players[0].name).toBe('Test Player');
  });

  it('un JSON che non è un array lancia PlayersImportError', () => {
    expect(() => parsePlayersFileContent('{"non":"un array"}', 'listone.json')).toThrow();
  });
});
