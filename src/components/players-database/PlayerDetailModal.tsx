import React, { useState } from 'react';
import { Player } from '../../types';
import { PlayerPricing } from '../../engine/types';
import { formatFairValueRange } from '../../utils/fantaEngine';
import { Star, Tag, BarChart3, TrendingUp, Heart, Ban, StickyNote } from 'lucide-react';
import { Modal, RoleBadge, Badge, PlayerAvatar, Textarea } from '../ui';

interface PlayerDetailModalProps {
  player: Player;
  wishlistIds: string[];
  blacklistIds: string[];
  pricing: PlayerPricing | undefined;
  note: string;
  onSetNote: (note: string) => void;
  onClose: () => void;
  onToggleWishlist: (id: string) => void;
  onToggleBlacklist: (id: string) => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({
  player,
  wishlistIds,
  blacklistIds,
  pricing,
  note,
  onSetNote,
  onClose,
  onToggleWishlist,
  onToggleBlacklist,
}) => {
  // Draft locale: salva solo su blur, non ad ogni tasto premuto (altrimenti
  // ogni carattere digitato farebbe un giro di sync col cloud).
  const [noteDraft, setNoteDraft] = useState(note);
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
            {formatFairValueRange(player, pricing)}
          </Badge>
        </div>
      </div>

      <div className="bg-surface-2/80 p-3 rounded-xl border border-border space-y-2 text-xs">
        <span className="text-ink-soft font-bold flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-warning" />
          <span>Statistiche Anno Scorso (2025/26)</span>
        </span>

        {player.lastYearStats ? (
          <div className="grid grid-cols-3 gap-2 text-center font-mono pt-1 text-ink-soft">
            <div className="bg-surface p-2 rounded-lg border border-border">
              <span className="text-faint block text-[10px]">Presenze</span>
              <strong className="text-ink text-sm">{player.lastYearStats.appearances}</strong>
              <span className="text-faint block text-[9px]">({player.lastYearStats.starterAppearances} tit.)</span>
            </div>
            {player.role === 'P' ? (
              <div className="bg-surface p-2 rounded-lg border border-border">
                <span className="text-faint block text-[10px]">Gol Subiti</span>
                <strong className="text-negative text-sm">{player.lastYearStats.goalsConceded ?? '—'}</strong>
              </div>
            ) : (
              <div className="bg-surface p-2 rounded-lg border border-border">
                <span className="text-faint block text-[10px]">Gol</span>
                <strong className="text-accent text-sm">{player.lastYearStats.goals}</strong>
              </div>
            )}
            <div className="bg-surface p-2 rounded-lg border border-border">
              <span className="text-faint block text-[10px]">Assist</span>
              <strong className="text-info text-sm">{player.lastYearStats.assists}</strong>
            </div>
            <div className="bg-surface p-2 rounded-lg border border-border">
              <span className="text-faint block text-[10px]">Cartellini</span>
              <strong className="text-warning text-sm">
                {player.lastYearStats.yellowCards}🟨 {player.lastYearStats.redCards}🟥
              </strong>
            </div>
            <div className="bg-surface p-2 rounded-lg border border-border">
              <span className="text-faint block text-[10px]">Media Voto</span>
              <strong className="text-ink text-sm">{player.lastYearStats.mv?.toFixed(2) ?? '—'}</strong>
            </div>
            <div className="bg-surface p-2 rounded-lg border border-border">
              <span className="text-faint block text-[10px]">Fantamedia</span>
              <strong className="text-ink text-sm">{player.lastYearStats.fm?.toFixed(2) ?? '—'}</strong>
            </div>
          </div>
        ) : (
          <span className="text-faint italic block p-2">Nessuna Informazione Disponibile</span>
        )}
      </div>

      <div className="bg-surface-2/80 p-3 rounded-xl border border-border space-y-2 text-xs">
        <span className="text-ink-soft font-bold flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-accent" />
          <span>Previsioni Stagione (2026/27)</span>
        </span>

        {player.aiForecast ? (
          <p className="text-ink-soft italic p-2">{player.aiForecast}</p>
        ) : (
          <span className="text-faint italic block p-2">Nessuna Informazione Disponibile</span>
        )}
      </div>

      <div className="bg-surface-2/80 p-3 rounded-xl border border-border space-y-2 text-xs">
        <span className="text-ink-soft font-bold flex items-center gap-1.5">
          <StickyNote className="w-4 h-4 text-muted" />
          <span>Note Personali</span>
        </span>
        <Textarea
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          onBlur={() => {
            if (noteDraft !== note) onSetNote(noteDraft);
          }}
          rows={2}
          placeholder="Scrivi qui le tue note su questo giocatore..."
        />
      </div>

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
