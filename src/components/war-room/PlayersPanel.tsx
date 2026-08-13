import React from 'react';
import { Player, PlayerRole } from '../../types';
import { PlayerPricing, PressioneLevel } from '../../engine/types';
import { Users, ListFilter } from 'lucide-react';

export type PanelMode = 'liberi' | 'rosa' | null;
export type SortBy = 'maxBid' | 'pressione';

interface Props {
  mode: PanelMode;
  setMode: (mode: PanelMode) => void;
  availablePlayers: Player[];
  pricingMap: Map<string, PlayerPricing>;
  roleFilter: PlayerRole | 'ALL';
  setRoleFilter: (role: PlayerRole | 'ALL') => void;
  sortBy: SortBy;
  setSortBy: (sort: SortBy) => void;
  onSelectPlayer: (id: string) => void;
  myRoster: { player: Player; pricing: PlayerPricing | undefined; paid: number }[];
}

const ROLES: (PlayerRole | 'ALL')[] = ['ALL', 'P', 'D', 'C', 'A'];

const pressureRank: Record<PressioneLevel, number> = { rosso: 0, giallo: 1, esaurito: 2, verde: 3 };
const pressureTone: Record<PressioneLevel, string> = {
  verde: 'text-emerald-400',
  giallo: 'text-amber-400',
  rosso: 'text-red-400',
  esaurito: 'text-slate-400',
};

export const PlayersPanel: React.FC<Props> = ({
  mode,
  setMode,
  availablePlayers,
  pricingMap,
  roleFilter,
  setRoleFilter,
  sortBy,
  setSortBy,
  onSelectPlayer,
  myRoster,
}) => {
  const liberiList = React.useMemo(() => {
    const filtered = availablePlayers.filter((p) => roleFilter === 'ALL' || p.role === roleFilter);
    return filtered
      .map((p) => ({ player: p, pricing: pricingMap.get(p.id) }))
      .filter((x): x is { player: Player; pricing: PlayerPricing } => !!x.pricing)
      .sort((a, b) =>
        sortBy === 'maxBid'
          ? b.pricing.maxBidDinamico - a.pricing.maxBidDinamico
          : pressureRank[a.pricing.pressioneRuolo.level] - pressureRank[b.pricing.pressioneRuolo.level]
      )
      .slice(0, 50);
  }, [availablePlayers, pricingMap, roleFilter, sortBy]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="flex border-b border-slate-800">
        <button
          type="button"
          onClick={() => setMode(mode === 'liberi' ? null : 'liberi')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
            mode === 'liberi' ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ListFilter className="w-4 h-4" />
          Giocatori Liberi
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === 'rosa' ? null : 'rosa')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors border-l border-slate-800 ${
            mode === 'rosa' ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          La Mia Rosa ({myRoster.length})
        </button>
      </div>

      {mode === 'liberi' && (
        <div className="p-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                  roleFilter === r ? 'bg-slate-700 border-slate-600 text-white' : 'border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {r === 'ALL' ? 'Tutti' : r}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-1 text-xs">
              <span className="text-slate-500">Ordina:</span>
              <button
                type="button"
                onClick={() => setSortBy('maxBid')}
                className={`px-2 py-1 rounded-lg font-semibold ${sortBy === 'maxBid' ? 'text-white bg-slate-800' : 'text-slate-400'}`}
              >
                Max Bid
              </button>
              <button
                type="button"
                onClick={() => setSortBy('pressione')}
                className={`px-2 py-1 rounded-lg font-semibold ${sortBy === 'pressione' ? 'text-white bg-slate-800' : 'text-slate-400'}`}
              >
                Pressione
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {liberiList.length === 0 && <div className="text-center text-slate-500 text-xs py-6">Nessun giocatore libero.</div>}
            {liberiList.map(({ player, pricing }) => (
              <button
                key={player.id}
                type="button"
                onClick={() => {
                  onSelectPlayer(player.id);
                  setMode(null);
                }}
                className="w-full flex items-center justify-between gap-3 py-2 text-left hover:bg-slate-800/50 px-1 rounded-lg"
              >
                <div className="min-w-0">
                  <span className="text-sm text-slate-100 font-medium truncate block">{player.name}</span>
                  <span className="text-[11px] text-slate-500">
                    {player.role} · {player.team}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-cyan-400 tabular-nums block">{pricing.maxBidDinamico}</span>
                  <span className={`text-[11px] font-semibold ${pressureTone[pricing.pressioneRuolo.level]}`}>
                    {pricing.pressioneRuolo.countRimasti}/{pricing.pressioneRuolo.denominatore}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'rosa' && (
        <div className="p-3">
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {myRoster.length === 0 && <div className="text-center text-slate-500 text-xs py-6">Nessun giocatore ancora acquistato.</div>}
            {myRoster.map(({ player, paid }) => (
              <div key={player.id} className="flex items-center justify-between gap-3 py-2 px-1">
                <div className="min-w-0">
                  <span className="text-sm text-slate-100 font-medium truncate block">{player.name}</span>
                  <span className="text-[11px] text-slate-500">
                    {player.role} · {player.team}
                  </span>
                </div>
                <span className="text-sm font-bold text-white tabular-nums shrink-0">{paid}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
