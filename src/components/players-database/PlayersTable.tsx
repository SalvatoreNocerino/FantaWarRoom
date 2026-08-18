import React, { useMemo } from 'react';
import { Player, RosterPlayer } from '../../types';
import { PlayerPricing } from '../../engine/types';
import { formatFairValueRange } from '../../utils/fantaEngine';
import { Heart, Ban, Star, Info, Megaphone, ChevronUp, ChevronDown } from 'lucide-react';
import { TableWrap, Thead, Tbody, Tr, RoleBadge, Badge, EmptyState, PlayerAvatar } from '../ui';
import { SortKey } from '../PlayersDatabaseView';

interface PlayersTableProps {
  players: Player[];
  auctionHistory: RosterPlayer[];
  pricingMap: Map<string, PlayerPricing>;
  wishlistIds: string[];
  blacklistIds: string[];
  onToggleWishlist: (id: string) => void;
  onToggleBlacklist: (id: string) => void;
  onSelectPlayer: (p: Player) => void;
  selectedAuctionPlayerId: string | null;
  onSelectForAuction: (id: string) => void;
  sortKey: SortKey;
  sortDir: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
}

const SortableHeader: React.FC<{
  label: string;
  sortKeyValue: NonNullable<SortKey>;
  activeKey: SortKey;
  dir: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
  align?: 'left' | 'center';
}> = ({ label, sortKeyValue, activeKey, dir, onSort, align = 'left' }) => {
  const isActive = activeKey === sortKeyValue;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKeyValue)}
      className={`flex items-center gap-0.5 font-inherit hover:text-ink transition-colors ${
        align === 'center' ? 'mx-auto' : ''
      } ${isActive ? 'text-ink' : ''}`}
    >
      <span>{label}</span>
      {isActive ? (
        dir === 'asc' ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )
      ) : (
        <ChevronUp className="w-3 h-3 opacity-20" />
      )}
    </button>
  );
};

export const PlayersTable: React.FC<PlayersTableProps> = ({
  players,
  auctionHistory,
  pricingMap,
  wishlistIds,
  blacklistIds,
  onToggleWishlist,
  onToggleBlacklist,
  onSelectPlayer,
  selectedAuctionPlayerId,
  onSelectForAuction,
  sortKey,
  sortDir,
  onSort,
}) => {
  const assignmentByPlayerId = useMemo(() => {
    const m = new Map<string, RosterPlayer>();
    for (const h of auctionHistory) m.set(h.playerId, h);
    return m;
  }, [auctionHistory]);

  return (
    <TableWrap>
      <table className="w-full text-left border-collapse text-xs">
        <Thead>
          <th className="p-3 w-12 text-center">R</th>
          <th className="p-3">
            <div className="flex items-center gap-2">
              <SortableHeader label="Calciatore" sortKeyValue="name" activeKey={sortKey} dir={sortDir} onSort={onSort} />
              <span className="text-faint">&middot;</span>
              <SortableHeader label="Squadra" sortKeyValue="team" activeKey={sortKey} dir={sortDir} onSort={onSort} />
            </div>
          </th>
          <th className="p-3 text-center">
            <SortableHeader label="Quot. Base" sortKeyValue="basePrice" activeKey={sortKey} dir={sortDir} onSort={onSort} align="center" />
          </th>
          <th className="p-3">Fair Value Stimato</th>
          <th className="p-3 text-center">
            <SortableHeader label="Max Bid / Pagato" sortKeyValue="maxBid" activeKey={sortKey} dir={sortDir} onSort={onSort} align="center" />
          </th>
          <th className="p-3 text-center hidden md:table-cell">Stats 25/26</th>
          <th className="p-3 text-right">Azioni</th>
        </Thead>
        <Tbody>
          {players.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <EmptyState message="Nessun calciatore trovato con i filtri selezionati." />
              </td>
            </tr>
          ) : (
            players.map((p) => {
              const isWish = wishlistIds.includes(p.id);
              const isBlack = blacklistIds.includes(p.id);
              const assignment = assignmentByPlayerId.get(p.id);
              const isSold = !!assignment;
              const pricing = pricingMap.get(p.id);
              const fairValStr = formatFairValueRange(p, pricing);
              const isSelected = selectedAuctionPlayerId === p.id;

              return (
                <Tr
                  key={p.id}
                  clickable
                  onClick={() => onSelectPlayer(p)}
                  className={`${isSold ? 'opacity-60' : ''} ${isSelected ? '!bg-accent/10' : ''}`}
                >
                  <td className="p-3 text-center">
                    <RoleBadge role={p.role} size="sm" dimmed={isSold} />
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <PlayerAvatar name={p.name} role={p.role} size="sm" className={isSold ? 'opacity-50' : ''} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <strong className="text-ink text-sm group-hover:text-accent transition-colors">{p.name}</strong>
                          {p.tier === 1 && !isSold && (
                            <span className="text-warning text-[10px] font-bold flex items-center">
                              <Star className="w-3 h-3 fill-warning mr-0.5" /> TOP
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted mt-1">
                          <span className="bg-surface-2 px-1.5 py-0.5 rounded font-bold text-ink-soft">{p.team}</span>
                          {isSold && <span className="ml-1.5">a {assignment.boughtByTeam}</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="p-3 text-center font-mono font-bold text-warning">{p.basePrice} FM</td>

                  <td className="p-3">
                    <Badge tone="info" variant="outline">
                      {fairValStr}
                    </Badge>
                  </td>

                  <td className="p-3 text-center font-mono font-bold">
                    {isSold ? (
                      <span className="text-muted">{assignment.cost} FM</span>
                    ) : (
                      <span className="text-accent">{pricing?.offertaMax ?? '—'}</span>
                    )}
                  </td>

                  <td className="p-3 text-center hidden md:table-cell text-muted font-mono text-[11px]">
                    {p.lastYearStats ? (
                      <div className="space-y-0.5">
                        <div>
                          {p.lastYearStats.appearances}p ({p.lastYearStats.starterAppearances}t) •{' '}
                          {p.role === 'P' ? (
                            <strong className="text-negative">{p.lastYearStats.goalsConceded ?? '—'}gs</strong>
                          ) : (
                            <strong className="text-accent">{p.lastYearStats.goals}g</strong>
                          )}{' '}
                          • <strong className="text-info">{p.lastYearStats.assists}a</strong>
                        </div>
                        {(p.lastYearStats.mv !== undefined || p.lastYearStats.fm !== undefined) && (
                          <div className="text-faint text-[10px]">
                            {p.lastYearStats.mv !== undefined && <span>mv {p.lastYearStats.mv.toFixed(2)}</span>}
                            {p.lastYearStats.mv !== undefined && p.lastYearStats.fm !== undefined && ' · '}
                            {p.lastYearStats.fm !== undefined && <span>fm {p.lastYearStats.fm.toFixed(2)}</span>}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-faint italic">N/D</span>
                    )}
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      {!isSold && (
                        <button
                          type="button"
                          onClick={() => onSelectForAuction(p.id)}
                          title="Chiama per l'asta"
                          aria-label="Chiama per l'asta"
                          className={`p-1.5 rounded-lg text-xs transition-colors ${
                            isSelected ? 'bg-accent text-accent-ink' : 'bg-field text-muted hover:text-accent border border-border'
                          }`}
                        >
                          <Megaphone className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onToggleWishlist(p.id)}
                        title={isWish ? 'Rimuovi da Wishlist' : 'Aggiungi a Wishlist'}
                        aria-label={isWish ? 'Rimuovi da Wishlist' : 'Aggiungi a Wishlist'}
                        className={`p-1.5 rounded-lg text-xs transition-colors ${
                          // Oro (warning), non rosso: coerente col badge TOP qui sopra
                          // ("mi interessa"), e distinto dal rosso della blacklist
                          // ("lo escludo") — due azioni opposte non devono condividere colore.
                          isWish ? 'bg-warning/15 text-warning border border-warning/40' : 'bg-field text-muted hover:text-warning border border-border'
                        }`}
                      >
                        <Heart className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleBlacklist(p.id)}
                        title={isBlack ? 'Rimuovi da Blacklist' : 'Aggiungi a Blacklist'}
                        aria-label={isBlack ? 'Rimuovi da Blacklist' : 'Aggiungi a Blacklist'}
                        className={`p-1.5 rounded-lg text-xs transition-colors ${
                          isBlack ? 'bg-surface-2 text-negative border border-negative' : 'bg-field text-muted hover:text-negative border border-border'
                        }`}
                      >
                        <Ban className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectPlayer(p)}
                        title="Vedi Scheda Dettaglio"
                        aria-label="Vedi Scheda Dettaglio"
                        className="p-1.5 bg-field hover:bg-accent/10 text-ink-soft hover:text-accent border border-border rounded-lg text-xs transition-colors"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </Tr>
              );
            })
          )}
        </Tbody>
      </table>
    </TableWrap>
  );
};
