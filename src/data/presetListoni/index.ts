import { Player, PlayerLastYearStats } from '../../types';
import { FANTACALCIO_IT_LISTONE as FANTACALCIO_IT_LISTONE_BASE } from './fantacalcioIt';
import arricchimentoRaw from './arricchimento.json';

// Dati aggiuntivi per giocatore (statistiche stagione 2025/26 + previsione
// 2026/27) generati da Agente_Ansa (vedi Agente_Ansa/README.md) tramite
// ricerca web. Tenuti separati dal listone base (generato una tantum
// dall'export Fantacalcio.it) così quest'ultimo può essere rigenerato senza
// perdere l'arricchimento, e viceversa l'arricchimento può essere aggiornato
// senza toccare prezzi/quotazioni.
interface EnrichmentEntry {
  lastYearStats?: PlayerLastYearStats;
  aiForecast?: string;
}

const arricchimento = arricchimentoRaw as Record<string, EnrichmentEntry>;

export const FANTACALCIO_IT_LISTONE: Player[] = FANTACALCIO_IT_LISTONE_BASE.map((player) => {
  const enrichment = arricchimento[player.id];
  return enrichment ? { ...player, ...enrichment } : player;
});
