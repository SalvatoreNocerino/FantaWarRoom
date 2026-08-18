import React, { useMemo, useState } from 'react';
import { Player, PlayerRole } from '../../types';
import { PlayerPricing } from '../../engine/types';
import { formatFairValueRange } from '../../utils/fantaEngine';
import { Heart, Trash2, Search, ChevronDown } from 'lucide-react';
import { RoleBadge, EmptyState, RoleFilterChips, Input } from '../ui';

const roleLabelPlural: Record<string, string> = {
  P: 'Portieri',
  D: 'Difensori',
  C: 'Centrocampisti',
  A: 'Attaccanti',
};

export const WISHLIST_MAX = 30;

interface WishlistSectionProps {
  allPlayers: Player[];
  wishlistPlayers: Player[];
  pricingMap: Map<string, PlayerPricing>;
  onAddPlayer: (playerId: string) => void;
  onRemovePlayer: (playerId: string) => void;
}

export const WishlistSection: React.FC<WishlistSectionProps> = ({
  allPlayers,
  wishlistPlayers,
  pricingMap,
  onAddPlayer,
  onRemovePlayer,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<PlayerRole | 'ALL'>('ALL');

  const wishlistIds = useMemo(() => new Set(wishlistPlayers.map((p) => p.id)), [wishlistPlayers]);
  const atMax = wishlistPlayers.length >= WISHLIST_MAX;

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allPlayers
      .filter((p) => !wishlistIds.has(p.id))
      .filter((p) => roleFilter === 'ALL' || p.role === roleFilter)
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q))
      .sort((a, b) => (b.fvm ?? 0) - (a.fvm ?? 0))
      .slice(0, 30);
  }, [allPlayers, wishlistIds, roleFilter, search]);

  const handlePick = (playerId: string) => {
    onAddPlayer(playerId);
    setSearch('');
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-ink-soft flex items-center gap-2">
          <Heart className="w-4 h-4 text-negative" />
          <span>Seleziona Giocatori per la Wishlist</span>
        </h3>
        <span className="text-[11px] font-mono text-faint shrink-0">
          {wishlistPlayers.length}/{WISHLIST_MAX}
        </span>
      </div>

      {atMax ? (
        <div className="bg-warning/10 border border-warning/40 text-warning text-xs font-semibold p-3 rounded-xl">
          Hai raggiunto il massimo di {WISHLIST_MAX} giocatori in wishlist. Rimuovine uno per aggiungerne un altro.
        </div>
      ) : (
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="w-full flex items-center gap-2 bg-field border border-border-strong rounded-lg px-3 py-2 text-xs text-muted hover:text-ink-soft transition-colors"
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="flex-1 text-left">Cerca giocatore da aggiungere alla wishlist...</span>
            <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute z-10 mt-1 w-full bg-surface-2 border border-border-strong rounded-xl overflow-hidden shadow-xl">
              <div className="p-2 space-y-2 border-b border-border-soft">
                <Input
                  autoFocus
                  type="text"
                  placeholder="Nome o squadra..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="text-xs py-1.5"
                />
                <RoleFilterChips value={roleFilter} onChange={setRoleFilter} />
              </div>
              <div className="max-h-56 overflow-y-auto">
                {candidates.length === 0 ? (
                  <div className="p-4 text-center text-xs text-faint">Nessun giocatore trovato.</div>
                ) : (
                  candidates.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePick(p.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-field transition-colors border-b border-border-soft last:border-b-0"
                    >
                      <RoleBadge role={p.role} size="sm" />
                      <span className="flex-1 min-w-0 text-xs font-semibold text-ink truncate">{p.name}</span>
                      <span className="text-[10.5px] font-mono text-faint shrink-0">{p.team}</span>
                      <span className="text-xs font-mono font-bold text-accent shrink-0">{p.fvm ?? '—'}</span>
                    </button>
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full py-2 text-[11px] font-bold text-muted hover:text-ink-soft transition-colors"
              >
                Chiudi
              </button>
            </div>
          )}
        </div>
      )}

      <div className="border border-border rounded-xl overflow-hidden bg-surface-2">
        {wishlistPlayers.length === 0 ? (
          <EmptyState>La tua wishlist è vuota. Cerca i giocatori qui sopra o chiedi un consiglio all'AI sotto!</EmptyState>
        ) : (
          <div className="divide-y divide-border-soft text-xs">
            {(['P', 'D', 'C', 'A'] as PlayerRole[]).map((role) => {
              const rolePlayers = wishlistPlayers.filter((p) => p.role === role);
              if (rolePlayers.length === 0) return null;

              return (
                <div key={role} className="p-3">
                  <div className="font-bold text-muted mb-2 flex items-center gap-2">
                    <RoleBadge role={role} size="sm" />
                    <span>
                      {roleLabelPlural[role]} ({rolePlayers.length})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {rolePlayers.map((p) => (
                      <div key={p.id} className="bg-surface border border-border p-2.5 rounded-lg flex items-center justify-between">
                        <div>
                          <strong className="text-ink block truncate">{p.name}</strong>
                          <span className="text-[11px] text-muted">
                            {p.team} • FM: {p.expectedFantaAvg} • Fair Value: {formatFairValueRange(p, pricingMap.get(p.id))}
                          </span>
                        </div>

                        <button type="button" onClick={() => onRemovePlayer(p.id)} className="text-faint hover:text-negative p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
