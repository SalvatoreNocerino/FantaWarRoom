/**
 * Motore di pricing deterministico per l'asta del fantacalcio.
 *
 * Porta 1:1 la logica del foglio "Output Utente" di
 * Strategia_Asta_FINAL_GPT.xlsx (colonne F/G/H/P/U/V/AE/AF), più gli
 * aggregati di "Parametri Modello" (righe 32-60) e "Stato Asta". Nessuna
 * chiamata AI/LLM: solo formule, per restare deterministico e istantaneo
 * durante un'asta live.
 *
 * Funzioni pure — nessuna dipendenza da React. Vedi test/pricingEngine.golden.test.ts
 * per la verifica riga-per-riga contro i valori calcolati dal file Excel.
 */

import { PlayerRole } from '../types';
import {
  BOOST_MODIFICATORE_RUOLO,
  BOOST_WHICHLIST_MAX,
  PESO_PERFORMANCE_STORICA,
  PERFORMANCE_STORICA_CAP,
  SPREAD_PCT,
  PRESENZE_MINIME_STORICO,
  SOGLIA_SOSTENIBILITA_OK,
  SOGLIA_SOSTENIBILITA_ATTENZIONE,
  PESO_MAX_SCARSITA,
  SCARSITA_SCONTO_MINIMO,
  ESCLUDI_QTA1_DA_SCARSITA,
  RISERVA_MINIMA_PER_SLOT,
  SOGLIA_PRESSIONE_VERDE,
  SOGLIA_PRESSIONE_GIALLA,
  PCT_BUDGET_RUOLO_AI_TITOLARI,
  TITOLARI_PER_SQUADRA_LEGA,
  SOGLIE_FASCIA,
} from './modelParams';
import {
  EnginePlayer,
  AuctionAssignment,
  EngineLeagueConfig,
  EngineStrategyConfig,
  LeaguePoolStats,
  RolePoolStats,
  MyTeamBudget,
  PlayerPricing,
  Fascia,
  TitolareRiserva,
  Urgenza,
  Sostenibilita,
} from './types';

const ROLES: PlayerRole[] = ['P', 'D', 'C', 'A'];

const clamp = (min: number, max: number, v: number) => Math.max(min, Math.min(max, v));

// --- Classificazione di mercato (indipendente dallo stato dell'asta) ------
//
// Rank FVM nel ruolo (V), Fascia Aspettativa (P) e Titolare/Riserva di
// mercato (AF) dipendono solo dal listone e dalla config di lega/strategia,
// non da chi è già stato chiamato: nel file Excel infatti le formule non
// filtrano mai su "Squadra Assegnata".

export interface MarketClassification {
  rank: number;
  countRoleTotal: number;
  fascia: Fascia;
  titolareORiserva: TitolareRiserva;
}

export function classifyMarket(players: EnginePlayer[], league: EngineLeagueConfig): Map<string, MarketClassification> {
  const result = new Map<string, MarketClassification>();

  for (const role of ROLES) {
    const rolePlayers = players.filter((p) => p.role === role);
    const countRoleTotal = rolePlayers.length;
    const nTitolariLega = league.numTeams * TITOLARI_PER_SQUADRA_LEGA[role];

    for (const player of rolePlayers) {
      const rank = 1 + rolePlayers.filter((other) => other.fvm > player.fvm).length;
      const percentile = countRoleTotal > 0 ? 1 - (rank - 1) / countRoleTotal : 0;

      let fascia: Fascia;
      if (percentile >= SOGLIE_FASCIA.top) fascia = 'Top';
      else if (percentile >= SOGLIE_FASCIA.buono) fascia = 'Buono';
      else if (percentile >= SOGLIE_FASCIA.media) fascia = 'Nella Media';
      else fascia = 'Scommessa/Riserva';

      const titolareORiserva: TitolareRiserva = rank <= nTitolariLega ? 'Titolare' : 'Riserva';

      result.set(player.id, { rank, countRoleTotal, fascia, titolareORiserva });
    }
  }

  return result;
}

// --- Aggregati di pool per ruolo (dipendono dallo stato dell'asta) --------

export function computeLeaguePoolStats(
  players: EnginePlayer[],
  league: EngineLeagueConfig,
  assignments: AuctionAssignment[],
  classification: Map<string, MarketClassification> = classifyMarket(players, league)
): LeaguePoolStats {
  const assignedIds = new Set(assignments.map((a) => a.playerId));
  const budgetTotaleLega = league.numTeams * league.totalBudget;

  const byRole = {} as Record<PlayerRole, RolePoolStats>;

  for (const role of ROLES) {
    const rolePlayers = players.filter((p) => p.role === role);
    const slotTotaliLega = league.numTeams * league.rosterSlots[role];
    const nTitolariLega = league.numTeams * TITOLARI_PER_SQUADRA_LEGA[role];

    const chiamati = rolePlayers.filter((p) => assignedIds.has(p.id)).length;
    const slotAncoraDaRiempireLega = slotTotaliLega - chiamati;

    const liberi = rolePlayers.filter((p) => !assignedIds.has(p.id));
    // Scarsità di ruolo: conta solo i liberi di qualità (Top/Buono). Un mercato
    // pieno di sole "Scommesse" non è davvero abbondante — su richiesta esplicita,
    // deviazione dall'Excel originale che contava tutti i liberi indistintamente.
    const giocatoriLiberiListone = liberi.filter(
      (p) =>
        (!ESCLUDI_QTA1_DA_SCARSITA || p.qtA > 1) &&
        (classification.get(p.id)?.fascia === 'Top' || classification.get(p.id)?.fascia === 'Buono')
    ).length;
    const rapportoOffertaDomanda = slotAncoraDaRiempireLega > 0 ? giocatoriLiberiListone / slotAncoraDaRiempireLega : null;

    const sommaFVMPool = rolePlayers
      .filter((p) => (classification.get(p.id)?.rank ?? Infinity) <= slotTotaliLega)
      .reduce((sum, p) => sum + p.fvm, 0);
    const sommaFVMTitolari = rolePlayers
      .filter((p) => (classification.get(p.id)?.rank ?? Infinity) <= nTitolariLega)
      .reduce((sum, p) => sum + p.fvm, 0);
    const sommaFVMRiserve = sommaFVMPool - sommaFVMTitolari;

    const titolariGiaAssegnati = rolePlayers.filter(
      (p) => assignedIds.has(p.id) && classification.get(p.id)?.titolareORiserva === 'Titolare'
    ).length;
    const titolariResidui = nTitolariLega - titolariGiaAssegnati;

    const riserveTotaliLega = slotTotaliLega - nTitolariLega;
    const riserveGiaAssegnate = rolePlayers.filter(
      (p) => assignedIds.has(p.id) && classification.get(p.id)?.titolareORiserva === 'Riserva'
    ).length;
    const riserveResidue = riserveTotaliLega - riserveGiaAssegnate;

    const storicoValidi = rolePlayers.filter(
      (p) => p.fm !== undefined && p.presenze !== undefined && p.presenze >= PRESENZE_MINIME_STORICO
    );
    const fantamediaMediaRuolo =
      storicoValidi.length > 0 ? storicoValidi.reduce((sum, p) => sum + (p.fm as number), 0) / storicoValidi.length : null;

    const rimastiByFascia = (fascia: Fascia) =>
      liberi.filter((p) => p.qtA > 1 && classification.get(p.id)?.fascia === fascia).length;

    byRole[role] = {
      role,
      slotTotaliLega,
      slotAncoraDaRiempireLega,
      giocatoriLiberiListone,
      rapportoOffertaDomanda,
      sommaFVMPool,
      nTitolariLega,
      sommaFVMTitolari,
      sommaFVMRiserve,
      titolariResidui,
      riserveResidue,
      fantamediaMediaRuolo,
      topRimasti: rimastiByFascia('Top'),
      buoniRimasti: rimastiByFascia('Buono'),
      mediaRimasti: rimastiByFascia('Nella Media'),
      scommesseRimaste: rimastiByFascia('Scommessa/Riserva'),
    };
  }

  return { budgetTotaleLega, byRole };
}

// --- Budget della squadra dell'utente (Output Utente!W:Z, La Mia Rosa) ----

export function computeMyTeamBudget(
  players: EnginePlayer[],
  league: EngineLeagueConfig,
  assignments: AuctionAssignment[]
): MyTeamBudget {
  const myAssignments = assignments.filter((a) => a.team === league.myTeamName);
  const budgetResiduo = league.totalBudget - myAssignments.reduce((sum, a) => sum + a.price, 0);

  const playerById = new Map(players.map((p) => [p.id, p]));
  const slotOccupatiByRole = { P: 0, D: 0, C: 0, A: 0 } as Record<PlayerRole, number>;
  for (const a of myAssignments) {
    const role = playerById.get(a.playerId)?.role;
    if (role) slotOccupatiByRole[role]++;
  }
  const slotResidui = ROLES.reduce((sum, role) => sum + Math.max(0, league.rosterSlots[role] - slotOccupatiByRole[role]), 0);

  const budgetMinimoRiserva = slotResidui * RISERVA_MINIMA_PER_SLOT;
  const budgetSpendibile = Math.max(0, budgetResiduo - budgetMinimoRiserva);
  const creditoMedioPerSlotRimanente = slotResidui > 0 ? budgetResiduo / slotResidui : null;

  return { budgetResiduo, slotResidui, budgetMinimoRiserva, budgetSpendibile, creditoMedioPerSlotRimanente };
}

// --- Pricing di un singolo giocatore (Output Utente!F/G/H/U/AE) -----------

function prezzoBase(
  player: EnginePlayer,
  classification: MarketClassification,
  rp: RolePoolStats,
  poolStats: LeaguePoolStats,
  strategy: EngineStrategyConfig
): number {
  const roleBudget = strategy.roleBudgetPct[player.role] * poolStats.budgetTotaleLega;
  if (classification.titolareORiserva === 'Titolare') {
    if (rp.sommaFVMTitolari === 0) return 0;
    return (player.fvm / rp.sommaFVMTitolari) * (PCT_BUDGET_RUOLO_AI_TITOLARI[player.role] * roleBudget);
  }
  if (rp.sommaFVMRiserve === 0) return 0;
  return (player.fvm / rp.sommaFVMRiserve) * ((1 - PCT_BUDGET_RUOLO_AI_TITOLARI[player.role]) * roleBudget);
}

function modificatoreRuolo(player: EnginePlayer, league: EngineLeagueConfig): number {
  if (player.role === 'D' && league.defensiveModifierEnabled) return 1 + BOOST_MODIFICATORE_RUOLO;
  if (player.role === 'C' && league.midfieldModifierEnabled) return 1 + BOOST_MODIFICATORE_RUOLO;
  return 1;
}

/**
 * NB: la formula Excel esclude un giocatore dal fattore storico solo se Fm è
 * vuoto, Presenze è vuota/zero, o la Fantamedia media di ruolo è
 * vuota/zero — NON verifica esplicitamente che le presenze del singolo
 * giocatore superino la soglia minima (quella soglia filtra solo quali
 * giocatori entrano nella media di ruolo, non il confronto individuale).
 * Replichiamo la formula esattamente com'è, non la sintesi del foglio Guida.
 */
function modificatoreStorico(player: EnginePlayer, rp: RolePoolStats): number {
  if (player.fm === undefined || player.presenze === undefined || player.presenze === 0 || !rp.fantamediaMediaRuolo) {
    return 1;
  }
  const raw = ((player.fm - rp.fantamediaMediaRuolo) / rp.fantamediaMediaRuolo) * PESO_PERFORMANCE_STORICA;
  return 1 + clamp(-PERFORMANCE_STORICA_CAP, PERFORMANCE_STORICA_CAP, raw);
}

function modificatoreScarsita(rp: RolePoolStats): number {
  if (!rp.rapportoOffertaDomanda) return 1;
  const raw = (1 / rp.rapportoOffertaDomanda - 1) * PESO_MAX_SCARSITA;
  return 1 + clamp(SCARSITA_SCONTO_MINIMO, PESO_MAX_SCARSITA * 1.5, raw);
}

function computeUrgenza(classification: MarketClassification, rp: RolePoolStats): Urgenza {
  if (classification.titolareORiserva === 'Titolare') {
    const countRimasti = rp.topRimasti + rp.buoniRimasti;
    const denominatore = rp.titolariResidui;
    if (denominatore <= 0) {
      const esaurito = rp.slotAncoraDaRiempireLega === 0;
      return {
        level: 'esaurito',
        countRimasti,
        denominatore,
        label: esaurito ? '— (ruolo esaurito)' : '🟠 Titolari esauriti (solo riserve)',
      };
    }
    const ratio = countRimasti / denominatore;
    if (ratio >= SOGLIA_PRESSIONE_VERDE) return { level: 'verde', countRimasti, denominatore, label: '🟢 Puoi aspettare' };
    if (ratio >= SOGLIA_PRESSIONE_GIALLA) return { level: 'giallo', countRimasti, denominatore, label: '🟡 Attesa rischiosa' };
    return { level: 'rosso', countRimasti, denominatore, label: '🔴 Non aspettare' };
  }

  const countRimasti = rp.mediaRimasti + rp.scommesseRimaste;
  const denominatore = rp.riserveResidue;
  if (denominatore <= 0) {
    return { level: 'esaurito', countRimasti, denominatore, label: '— (riserve esaurite)' };
  }
  const ratio = countRimasti / denominatore;
  if (ratio >= SOGLIA_PRESSIONE_VERDE) return { level: 'verde', countRimasti, denominatore, label: '🟢 Riserve abbondanti' };
  if (ratio >= SOGLIA_PRESSIONE_GIALLA) return { level: 'giallo', countRimasti, denominatore, label: '🟡 Riserve nella norma' };
  return { level: 'rosso', countRimasti, denominatore, label: '🔴 Riserve scarse' };
}

function computeSostenibilita(offertaConsigliata: number, myTeamBudget: MyTeamBudget, isAssigned: boolean): Sostenibilita {
  if (isAssigned || myTeamBudget.creditoMedioPerSlotRimanente === null) {
    return { level: null, label: '' };
  }
  const credito = myTeamBudget.creditoMedioPerSlotRimanente;
  if (offertaConsigliata <= credito * SOGLIA_SOSTENIBILITA_OK) return { level: 'ok', label: 'OK' };
  if (offertaConsigliata <= credito * SOGLIA_SOSTENIBILITA_ATTENZIONE) return { level: 'attenzione', label: 'Attenzione' };
  return { level: 'rischio', label: 'Rischio Alto' };
}

export function computePlayerPricing(
  player: EnginePlayer,
  classification: MarketClassification,
  poolStats: LeaguePoolStats,
  myTeamBudget: MyTeamBudget,
  league: EngineLeagueConfig,
  strategy: EngineStrategyConfig,
  isAssigned: boolean
): PlayerPricing {
  const rp = poolStats.byRole[player.role];
  const spread = SPREAD_PCT[player.role];

  const adjustedBase =
    prezzoBase(player, classification, rp, poolStats, strategy) *
    modificatoreRuolo(player, league) *
    modificatoreStorico(player, rp) *
    modificatoreScarsita(rp);

  const value = Math.round(Math.max(1, adjustedBase));
  const rangeMin = Math.round(Math.max(1, adjustedBase) * (1 - spread));
  const rangeMax = Math.round(adjustedBase * (1 + spread));

  const isWhichlist = strategy.wishlistIds.includes(player.id);
  const whichlistBoost = isWhichlist ? BOOST_WHICHLIST_MAX * strategy.aggressiveness : 0;
  const offertaConsigliata = Math.round((rangeMin + (rangeMax - rangeMin) * strategy.aggressiveness) * (1 + whichlistBoost));

  const offertaMax = Math.min(offertaConsigliata, myTeamBudget.budgetSpendibile);

  return {
    playerId: player.id,
    value,
    rangeMin,
    rangeMax,
    offertaConsigliata,
    offertaMax,
    fascia: classification.fascia,
    rankFvmRuolo: classification.rank,
    titolareORiserva: classification.titolareORiserva,
    isWhichlist,
    urgenza: computeUrgenza(classification, rp),
    sostenibilita: computeSostenibilita(offertaConsigliata, myTeamBudget, isAssigned),
  };
}

// --- Orchestratore: prezza l'intero listone in un colpo solo -------------

export function priceAllPlayers(
  players: EnginePlayer[],
  league: EngineLeagueConfig,
  strategy: EngineStrategyConfig,
  assignments: AuctionAssignment[]
): Map<string, PlayerPricing> {
  const classification = classifyMarket(players, league);
  const poolStats = computeLeaguePoolStats(players, league, assignments, classification);
  const myTeamBudget = computeMyTeamBudget(players, league, assignments);
  const assignedIds = new Set(assignments.map((a) => a.playerId));

  const result = new Map<string, PlayerPricing>();
  for (const player of players) {
    const cls = classification.get(player.id);
    if (!cls) continue;
    result.set(
      player.id,
      computePlayerPricing(player, cls, poolStats, myTeamBudget, league, strategy, assignedIds.has(player.id))
    );
  }
  return result;
}
