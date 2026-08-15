import React from 'react';
import { Player } from '../../types';
import { calculateDynamicFairValueBracket } from '../../utils/fantaEngine';
import { Star, Tag, BarChart3, TrendingUp, Heart, Ban } from 'lucide-react';
import { Modal, RoleBadge, Badge, PlayerAvatar } from '../ui';

// Placeholder scritto da utils/playersImport.ts per ogni giocatore di un
// listone importato (preset Fantacalcio.it incluso): non è una nota reale,
// quindi non va mostrata come se lo fosse — vedi audit UI/UX Fase 1.
const GENERIC_IMPORT_NOTE = 'Caricato da listone importato';

interface PlayerDetailModalProps {
  player: Player;
  wishlistIds: string[];
  blacklistIds: string[];
  totalBudget: number;
  onClose: () => void;
  onToggleWishlist: (id: string) => void;
  onToggleBlacklist: (id: string) => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({
  player,
  wishlistIds,
  blacklistIds,
  totalBudget,
  onClose,
  onToggleWishlist,
  onToggleBlacklist,
}) => {
  return (
    <Modal open onClose={onClose} maxWidth="max-w-lg">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <PlayerAvatar name={player.name} role={player.role} size="lg" />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-ink">{player.name}</h2>
            <RoleBadge role={player.role} size="sm" />
            <span className="bg-surface-2 px-2.5 py-0.5 rounded text-xs font-bold text-ink-soft">{player.team}</span>
          </div>
          {player.tier === 1 && (
            <span className="text-warning text-xs font-bold flex items-center mt-0.5">
              <Star className="w-3.5 h-3.5 fill-warning mr-1" /> TOP GIOCATORE
            </span>
          )}
        </div>
      </div>

      <div className="bg-surface-2 p-4 rounded-xl border border-border space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">Quotazione Base Listone:</span>
          <span className="font-mono font-bold text-warning text-sm">{player.basePrice} FM</span>
        </div>
        <div className="flex items-center justify-between text-xs pt-1 border-t border-border-soft">
          <span className="text-muted flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-info" />
            <span>Fair Value Consigliato:</span>
          </span>
          <Badge tone="info" variant="outline" className="px-2.5 py-1">
            {calculateDynamicFairValueBracket(player, totalBudget)}
          </Badge>
        </div>
      </div>

      <div className="bg-surface-2/80 p-3 rounded-xl border border-border space-y-2 text-xs">
        <span className="text-ink-soft font-bold flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-warning" />
          <span>Statistiche Anno Scorso (2024/25)</span>
        </span>

        {player.lastYearStats ? (
          <div className="grid grid-cols-4 gap-2 text-center font-mono pt-1 text-ink-soft">
            <div className="bg-surface p-2 rounded-lg border border-border">
              <span className="text-faint block text-[10px]">Presenze</span>
              <strong className="text-ink text-sm">{player.lastYearStats.appearances}</strong>
            </div>
            <div className="bg-surface p-2 rounded-lg border border-border">
              <span className="text-faint block text-[10px]">Gol</span>
              <strong className="text-accent text-sm">{player.lastYearStats.goals}</strong>
            </div>
            <div className="bg-surface p-2 rounded-lg border border-border">
              <span className="text-faint block text-[10px]">Assist</span>
              <strong className="text-info text-sm">{player.lastYearStats.assists}</strong>
            </div>
            <div className="bg-surface p-2 rounded-lg border border-border">
              <span className="text-faint block text-[10px]">FantaMedia</span>
              <strong className="text-warning text-sm">{player.lastYearStats.fantaAvg}</strong>
            </div>
          </div>
        ) : (
          <span className="text-faint italic block p-2">Nessun dato storico precedente disponibile</span>
        )}
      </div>

      <div className="bg-surface-2/80 p-3 rounded-xl border border-border space-y-2 text-xs">
        <span className="text-ink-soft font-bold flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-accent" />
          <span>Previsioni Stagione (2025/26)</span>
        </span>

        {player.expectedGoalsAssists === 'N/A' ? (
          <span className="text-faint italic block p-2">Previsione non disponibile per questo listone</span>
        ) : (
          <div className="grid grid-cols-2 gap-2 font-mono pt-1">
            <div className="bg-surface p-2.5 rounded-lg border border-border">
              <span className="text-faint text-[10px] block">FantaMedia Prevista</span>
              <strong className="text-accent text-sm">{player.expectedFantaAvg}</strong>
            </div>
            <div className="bg-surface p-2.5 rounded-lg border border-border">
              <span className="text-faint text-[10px] block">Bonus Attesi (G+A)</span>
              <strong className="text-info text-sm">{player.expectedGoalsAssists}</strong>
            </div>
          </div>
        )}
      </div>

      {player.notes && player.notes !== GENERIC_IMPORT_NOTE && (
        <div className="bg-surface-2 p-3 rounded-xl border border-border text-xs space-y-1">
          <span className="text-muted font-bold block">Note Tattiche & Consiglio:</span>
          <p className="text-ink-soft italic">"{player.notes}"</p>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => onToggleWishlist(player.id)}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
            wishlistIds.includes(player.id) ? 'bg-negative text-ink' : 'bg-field text-ink-soft hover:bg-surface-2 border border-border'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>{wishlistIds.includes(player.id) ? 'In Wishlist' : 'Aggiungi a Wishlist'}</span>
        </button>

        <button
          type="button"
          onClick={() => onToggleBlacklist(player.id)}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
            blacklistIds.includes(player.id)
              ? 'bg-surface-2 text-negative border border-negative'
              : 'bg-field text-ink-soft hover:bg-surface-2 border border-border'
          }`}
        >
          <Ban className="w-4 h-4" />
          <span>{blacklistIds.includes(player.id) ? 'In Blacklist' : 'Aggiungi a Blacklist'}</span>
        </button>
      </div>
    </Modal>
  );
};
