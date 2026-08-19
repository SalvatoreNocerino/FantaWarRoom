import React, { useMemo, useState } from 'react';
import { Player, PlayerRole, RosterPlayer } from '../types';
import { LayoutDashboard, ShieldAlert, Database, Megaphone, Heart, ArrowUpDown } from 'lucide-react';
import { Card, PageHeader, Button, StatTile, RoleBadge, EmptyState, PlayerAvatar, Alert, SectionHeader, Chip } from './ui';
import { ROLE_PLURAL } from './war-room-mobile/tokens';

type WishlistSortKey = 'basePrice' | 'team';

interface Props {
  myTeamName: string;
  totalBudget: number;
  myRemainingCredits: number;
  rosterSlots: Record<PlayerRole, number>;
  countMyRole: Record<PlayerRole, number>;
  mySlotsNeeded: number;
  participantsCount: number;
  wishlistIds: string[];
  allPlayers: Player[];
  auctionHistory: RosterPlayer[];
  onGoToWarRoom: () => void;
  onGoToDatabase: () => void;
  onSelectForAuction: (id: string) => void;
  isPremium: boolean;
  freeAssignmentLimit: number;
}

const ROLES: PlayerRole[] = ['P', 'D', 'C', 'A'];

// Bordo sinistro colorato per ruolo sulle card statistiche — pattern del
// redesign Stitch. Bordi per lato espliciti (non lo shorthand `border`, che
// confliggerebbe con `border-l-4` sullo stesso lato) — Tailwind richiede
// classi letterali, non interpolate.
const ROLE_LEFT_BORDER: Record<PlayerRole, string> = {
  P: 'border-t border-r border-b border-t-border-soft border-r-border-soft border-b-border-soft border-l-4 border-l-role-p',
  D: 'border-t border-r border-b border-t-border-soft border-r-border-soft border-b-border-soft border-l-4 border-l-role-d',
  C: 'border-t border-r border-b border-t-border-soft border-r-border-soft border-b-border-soft border-l-4 border-l-role-c',
  A: 'border-t border-r border-b border-t-border-soft border-r-border-soft border-b-border-soft border-l-4 border-l-role-a',
};

// Prima schermata che l'utente vede: risponde a "a che punto sono?" prima di
// spingerlo verso Console Live, invece di aprire direttamente su un form di
// configurazione (vedi Fase 1/2 dell'audit UI/UX).
export const DashboardView: React.FC<Props> = ({
  myTeamName,
  totalBudget,
  myRemainingCredits,
  rosterSlots,
  countMyRole,
  mySlotsNeeded,
  participantsCount,
  wishlistIds,
  allPlayers,
  auctionHistory,
  onGoToWarRoom,
  onGoToDatabase,
  onSelectForAuction,
  isPremium,
  freeAssignmentLimit,
}) => {
  const takenPlayerIds = useMemo(() => new Set(auctionHistory.map((b) => b.playerId)), [auctionHistory]);

  const [wishlistSortKey, setWishlistSortKey] = useState<WishlistSortKey>('basePrice');
  const [wishlistSortDir, setWishlistSortDir] = useState<'asc' | 'desc'>('desc');

  const handleWishlistSort = (key: WishlistSortKey) => {
    if (wishlistSortKey === key) {
      setWishlistSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setWishlistSortKey(key);
      setWishlistSortDir(key === 'team' ? 'asc' : 'desc');
    }
  };

  const costByPlayerId = useMemo(() => {
    const m = new Map<string, number>();
    for (const h of auctionHistory) m.set(h.playerId, h.cost);
    return m;
  }, [auctionHistory]);

  // Giocatori in wishlist raggruppati per ruolo, ognuno ordinabile per
  // prezzo (quotazione base) o squadra — vista d'insieme richiesta in
  // Dashboard, separata dal "prossimo obiettivo" già presente sotto.
  const wishlistByRole = useMemo(() => {
    const wishlistPlayers = wishlistIds
      .map((id) => allPlayers.find((p) => p.id === id))
      .filter((p): p is Player => !!p);

    const sorted = [...wishlistPlayers].sort((a, b) => {
      const cmp = wishlistSortKey === 'team' ? a.team.localeCompare(b.team) : a.basePrice - b.basePrice;
      return wishlistSortDir === 'asc' ? cmp : -cmp;
    });

    const groups: Record<PlayerRole, Player[]> = { P: [], D: [], C: [], A: [] };
    for (const p of sorted) groups[p.role].push(p);
    return groups;
  }, [wishlistIds, allPlayers, wishlistSortKey, wishlistSortDir]);

  const nextWishlistTarget = useMemo(() => {
    for (const id of wishlistIds) {
      if (takenPlayerIds.has(id)) continue;
      const p = allPlayers.find((pl) => pl.id === id);
      if (p) return p;
    }
    return null;
  }, [wishlistIds, takenPlayerIds, allPlayers]);

  const auctionStarted = auctionHistory.length > 0;

  const handleCallTarget = () => {
    if (!nextWishlistTarget) return;
    onSelectForAuction(nextWishlistTarget.id);
    onGoToWarRoom();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 text-ink">
      <PageHeader
        icon={LayoutDashboard}
        title={`Dashboard — ${myTeamName || 'La tua squadra'}`}
        subtitle="Colpo d'occhio sullo stato dell'asta: budget, slot mancanti e prossimo obiettivo."
        action={
          <Button onClick={onGoToWarRoom} size="lg">
            <ShieldAlert className="w-5 h-5" />
            <span>{auctionStarted ? "Riprendi l'Asta" : "Inizia l'Asta"}</span>
          </Button>
        }
      />

      {!isPremium && (
        <Alert tone={auctionHistory.length >= freeAssignmentLimit ? 'error' : 'warning'}>
          Piano gratuito: {Math.min(auctionHistory.length, freeAssignmentLimit)}/{freeAssignmentLimit} aggiudicazioni
          usate in Console Live.{' '}
          {auctionHistory.length >= freeAssignmentLimit
            ? 'Passa a Premium per continuare.'
            : 'Passa a Premium per un uso illimitato per tutta la stagione.'}
        </Alert>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatTile label="Budget Residuo" value={`${myRemainingCredits} FM`} tone={myRemainingCredits > 0 ? 'accent' : 'negative'} />
        <StatTile label="Slot Mancanti" value={mySlotsNeeded} tone={mySlotsNeeded > 0 ? 'warning' : 'accent'} />
        <StatTile label="Squadre in Lega" value={participantsCount} />
      </div>

      <Card className="p-5 space-y-3">
        <h2 className="text-sm font-bold text-ink-soft">Rosa per Ruolo</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ROLES.map((role) => {
            const have = countMyRole[role];
            const need = rosterSlots[role];
            const complete = have >= need;
            return (
              <div key={role} className={`bg-surface-2 rounded-xl p-3 flex items-center gap-3 ${ROLE_LEFT_BORDER[role]}`}>
                <RoleBadge role={role} />
                <div className="min-w-0">
                  <div className="text-xs text-muted capitalize truncate">{ROLE_PLURAL[role]}</div>
                  <div className={`font-mono font-bold text-sm ${complete ? 'text-accent' : 'text-ink'}`}>
                    {have}/{need}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <h2 className="text-sm font-bold text-ink-soft">Prossimo Obiettivo Wishlist</h2>
        {nextWishlistTarget ? (
          <div className="flex items-center justify-between gap-3 bg-surface-2 border border-border-soft rounded-xl p-3">
            <div className="flex items-center gap-3 min-w-0">
              <PlayerAvatar name={nextWishlistTarget.name} role={nextWishlistTarget.role} size="lg" />
              <div className="min-w-0">
                <div className="font-bold text-ink truncate">{nextWishlistTarget.name}</div>
                <div className="text-xs text-muted">
                  {nextWishlistTarget.team} &middot; Quot. Base <span className="font-mono">{nextWishlistTarget.basePrice} FM</span>
                </div>
              </div>
            </div>
            <Button onClick={handleCallTarget} size="sm" className="shrink-0">
              <Megaphone className="w-3.5 h-3.5" />
              <span>Chiama</span>
            </Button>
          </div>
        ) : (
          <EmptyState
            message={
              wishlistIds.length === 0
                ? 'Nessun giocatore in wishlist. Aggiungine dal Listone Serie A per vederli qui.'
                : 'Tutti i giocatori in wishlist sono già stati assegnati.'
            }
            action={
              <Button variant="secondary" size="sm" onClick={onGoToDatabase}>
                <Database className="w-3.5 h-3.5" />
                <span>Vai al Listone</span>
              </Button>
            }
          />
        )}
      </Card>

      <Card className="p-5 space-y-4">
        <SectionHeader
          title="La mia Wishlist"
          action={
            wishlistIds.length > 0 && (
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-faint" />
                <Chip active={wishlistSortKey === 'basePrice'} onClick={() => handleWishlistSort('basePrice')}>
                  Prezzo {wishlistSortKey === 'basePrice' ? (wishlistSortDir === 'asc' ? '↑' : '↓') : ''}
                </Chip>
                <Chip active={wishlistSortKey === 'team'} onClick={() => handleWishlistSort('team')}>
                  Squadra {wishlistSortKey === 'team' ? (wishlistSortDir === 'asc' ? '↑' : '↓') : ''}
                </Chip>
              </div>
            )
          }
        />

        {wishlistIds.length === 0 ? (
          <EmptyState
            icon={Heart}
            message="Nessun giocatore in wishlist. Aggiungine dal Listone Serie A per vederli qui, divisi per ruolo."
            action={
              <Button variant="secondary" size="sm" onClick={onGoToDatabase}>
                <Database className="w-3.5 h-3.5" />
                <span>Vai al Listone</span>
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {ROLES.map((role) => {
              const players = wishlistByRole[role];
              if (players.length === 0) return null;
              return (
                <div key={role} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <RoleBadge role={role} size="sm" />
                    <span className="text-xs font-bold text-muted uppercase tracking-wide">
                      {ROLE_PLURAL[role]} · {players.length}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {players.map((p) => {
                      const isTaken = takenPlayerIds.has(p.id);
                      const cost = costByPlayerId.get(p.id);
                      return (
                        <div
                          key={p.id}
                          className={`flex items-center gap-3 bg-surface-2 border border-border-soft rounded-xl p-2.5 ${
                            isTaken ? 'opacity-50' : ''
                          }`}
                        >
                          <PlayerAvatar name={p.name} role={p.role} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-ink text-sm truncate">{p.name}</div>
                            <div className="text-xs text-muted truncate">{p.team}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-mono font-bold text-sm text-ink">
                              {isTaken ? cost : p.basePrice} FM
                            </div>
                            <div className="text-[10px] text-faint">{isTaken ? 'assegnato' : 'quot. base'}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="text-xs text-faint">
        Budget totale di lega: <span className="font-mono text-muted">{totalBudget} FM</span>
      </div>
    </div>
  );
};
