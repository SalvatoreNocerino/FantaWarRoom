/**
 * Costanti calibrate del motore di pricing, portate 1:1 dal foglio
 * "Parametri Modello" di Strategia_Asta_FINAL_GPT.xlsx (la versione validata
 * su aste reali 2023+2025, vedi foglio "Guida" > Log delle modifiche).
 *
 * Questi valori NON sono pensati per essere esposti come opzioni utente:
 * sono stati calibrati contro dati d'asta reali e un parametro in più
 * rischia di scalibrare il modello. L'unica eccezione concordata è lo
 * split di budget per ruolo (vedi DEFAULT_ROLE_BUDGET_PCT sotto), che nel
 * file Excel è fisso ma nell'app resta un campo utente esistente
 * (StrategySettings.budgetAllocationPct) — qui forniamo solo il default
 * calibrato con cui seedarlo.
 *
 * Se un domani si ricalibra il modello su nuovi dati reali, questo è
 * l'unico file da toccare.
 */

import { PlayerRole } from '../types';

type RoleMap<T> = Record<PlayerRole, T>;

/** Parametri Modello!B5 — boost prezzo del ruolo se il Modificatore Difesa/Centrocampo di lega è attivo. */
export const BOOST_MODIFICATORE_RUOLO = 0.15;

/** Parametri Modello!B7 — boost MASSIMO sull'Offerta Max se il giocatore è in whichlist (scala con l'Aggressività). */
export const BOOST_WHICHLIST_MAX = 0.15;

/** Parametri Modello!B9 — peso della Fantamedia storica (vs media di ruolo) sul prezzo. */
export const PESO_PERFORMANCE_STORICA = 0.2;

/** Il fattore di performance storica è sempre limitato a ±25% (hardcoded nella formula Excel, non un parametro separato). */
export const PERFORMANCE_STORICA_CAP = 0.25;

/** Parametri Modello!B12:B15 — ampiezza del range Min/Max attorno al prezzo base, per ruolo. */
export const SPREAD_PCT: RoleMap<number> = { P: 0.15, D: 0.2, C: 0.25, A: 0.3 };

/** Parametri Modello!B23 — sotto questa soglia di presenze un giocatore non entra nella Fantamedia media di ruolo né riceve bonus/malus storico. */
export const PRESENZE_MINIME_STORICO = 10;

/** Parametri Modello!B24 — sotto Offerta Max <= credito_medio_slot * questa soglia: Sostenibilità "OK". */
export const SOGLIA_SOSTENIBILITA_OK = 1.5;

/** Parametri Modello!B25 — sotto questa soglia: "Attenzione"; sopra: "Rischio Alto". */
export const SOGLIA_SOSTENIBILITA_ATTENZIONE = 3;

/** Parametri Modello!B28 — peso massimo del fattore di scarsità di ruolo sul prezzo base (premio fino a +B28*1.5, sconto fino a -B28). */
export const PESO_MAX_SCARSITA = 0.3;

/** Parametri Modello!B29 — i giocatori con Qt.A=1 (ancora liberi) non contano come "disponibili" nel calcolo della scarsità. */
export const ESCLUDI_QTA1_DA_SCARSITA = true;

/** Parametri Modello!B30 — crediti minimi riservati per ogni slot ancora vuoto, nel calcolo del Budget Spendibile. */
export const RISERVA_MINIMA_PER_SLOT = 1;

/** Parametri Modello!B46 — Top+Buoni rimasti / Titolari Residui >= questa soglia => Pressione verde ("Puoi aspettare" / "Riserve abbondanti"). */
export const SOGLIA_PRESSIONE_VERDE = 2;

/** Parametri Modello!B47 — sotto la soglia verde ma >= questa: Pressione gialla; sotto: rossa. */
export const SOGLIA_PRESSIONE_GIALLA = 1;

/**
 * Parametri Modello!B50:B53 — split storico del budget totale per ruolo,
 * calibrato su Rose_fantalba 2023+2025 (10 squadre-stagione reali).
 * Nell'Excel è fisso; nell'app resta il DEFAULT con cui seedare
 * StrategySettings.budgetAllocationPct, che l'utente può poi modificare.
 */
export const DEFAULT_ROLE_BUDGET_PCT: RoleMap<number> = { P: 0.093, D: 0.116, C: 0.278, A: 0.515 };

/** Parametri Modello!D57:D60 — quota della "torta" di ruolo che va ai titolari (il resto va alle riserve). */
export const PCT_BUDGET_RUOLO_AI_TITOLARI: RoleMap<number> = { P: 0.88, D: 0.85, C: 0.95, A: 0.93 };

/** Parametri Modello!B73 — i portieri titolari per squadra sono sempre 1, indipendentemente dal modulo. */
export const TITOLARI_PORTIERE_PER_SQUADRA = 1;

/** Parametri Modello!B63:B65 — soglie di percentile del FVM nel ruolo per la Fascia Aspettativa. */
export const SOGLIE_FASCIA = { top: 0.9, buono: 0.7, media: 0.4 };

export const FASCIA_LABELS = {
  top: 'Top',
  buono: 'Buono',
  media: 'Nella Media',
  scommessa: 'Scommessa/Riserva',
} as const;
