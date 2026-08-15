import React, { useMemo, useState } from 'react';
import { Undo2, Search, Edit3, Trash2, Save, X } from 'lucide-react';
import { Player, RosterPlayer, LeagueSettings } from '../../types';
import { PlayerPricing } from '../../engine/types';
import { COLORS, FONT_MONO, FONT_UI, ROLE_COLORS, deltaColor, formatSignedInt } from './tokens';
import { ConfirmDialog } from '../ui';

interface Props {
  auctionHistory: RosterPlayer[];
  allPlayers: Player[];
  pricingMap: Map<string, PlayerPricing>;
  league: LeagueSettings;
  onUndoLastAssignment: () => void;
  onUpdateAssignment?: (assignmentId: string, boughtByTeam: string, cost: number) => void;
  onDeleteAssignment?: (assignmentId: string) => void;
}

export const HistoryScreen: React.FC<Props> = ({
  auctionHistory,
  allPlayers,
  pricingMap,
  league,
  onUndoLastAssignment,
  onUpdateAssignment,
  onDeleteAssignment,
}) => {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTeam, setEditTeam] = useState('');
  const [editCost, setEditCost] = useState(1);
  const [deletingItem, setDeletingItem] = useState<{ id: string; playerName: string } | null>(null);

  const rows = useMemo(
    () =>
      [...auctionHistory]
        .sort((a, b) => b.timestamp - a.timestamp)
        .map((h) => ({ h, player: allPlayers.find((p) => p.id === h.playerId) }))
        .filter((x): x is { h: RosterPlayer; player: Player } => !!x.player)
        .filter(({ h, player }) => {
          const q = search.trim().toLowerCase();
          if (!q) return true;
          return player.name.toLowerCase().includes(q) || h.boughtByTeam.toLowerCase().includes(q);
        }),
    [auctionHistory, allPlayers, search]
  );

  const count = auctionHistory.length;
  const totalSpent = auctionHistory.reduce((sum, h) => sum + h.cost, 0);
  const avgPrice = count > 0 ? Math.round(totalSpent / count) : 0;
  const totalValue = auctionHistory.reduce((sum, h) => sum + (pricingMap.get(h.playerId)?.value ?? 0), 0);
  const vsValuePct = totalValue > 0 ? Math.round(((totalSpent - totalValue) / totalValue) * 100) : 0;

  const startEdit = (item: RosterPlayer) => {
    setEditingId(item.id);
    setEditTeam(item.boughtByTeam);
    setEditCost(item.cost);
  };

  const saveEdit = (id: string) => {
    if (!editTeam || editCost < 1) return;
    onUpdateAssignment?.(id, editTeam, editCost);
    setEditingId(null);
  };

  return (
    <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.borderCard}`, borderRadius: 12, padding: 11 }}>
          <div style={{ fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: COLORS.textMuted, fontWeight: 700 }}>
            Aggiudicati
          </div>
          <div style={{ font: `700 20px ${FONT_MONO}`, marginTop: 3 }}>{count}</div>
        </div>
        <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.borderCard}`, borderRadius: 12, padding: 11 }}>
          <div style={{ fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: COLORS.textMuted, fontWeight: 700 }}>
            Prezzo medio
          </div>
          <div style={{ font: `700 20px ${FONT_MONO}`, marginTop: 3 }}>{avgPrice}</div>
        </div>
        <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.borderCard}`, borderRadius: 12, padding: 11 }}>
          <div style={{ fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: COLORS.textMuted, fontWeight: 700 }}>
            vs valore
          </div>
          <div style={{ font: `700 20px ${FONT_MONO}`, marginTop: 3, color: COLORS.warning }}>{formatSignedInt(vsValuePct)}%</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 10, top: 9, color: COLORS.textWeak, display: 'flex' }}>
            <Search size={14} />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtra history..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: COLORS.bgInputLight,
              border: `1px solid ${COLORS.borderInput}`,
              borderRadius: 10,
              padding: '8px 10px 8px 30px',
              color: COLORS.textPrimary,
              fontFamily: FONT_UI,
              fontSize: 12,
            }}
          />
        </div>
        {auctionHistory.length > 0 && (
          <button
            type="button"
            onClick={onUndoLastAssignment}
            style={{
              flex: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              height: 34,
              padding: '0 10px',
              background: COLORS.bgNested,
              border: `1px solid ${COLORS.borderInput}`,
              borderRadius: 10,
              color: COLORS.textSecondary,
              font: `700 11px ${FONT_UI}`,
              cursor: 'pointer',
            }}
          >
            <Undo2 size={14} />
            Annulla Ultimo
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '0 2px' }}>
        <span style={{ fontSize: 12.5, fontWeight: 800 }}>Ultime chiamate</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: COLORS.textWeak }}>prezzo · scostamento</span>
      </div>

      <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.borderCard}`, borderRadius: 16, overflow: 'hidden' }}>
        {rows.map(({ h, player }) => {
          const value = pricingMap.get(h.playerId)?.value ?? h.cost;
          const delta = h.cost - value;
          const isEditing = editingId === h.id;

          if (isEditing) {
            return (
              <div
                key={h.id}
                style={{
                  padding: '10px 14px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 8,
                  borderBottom: `1px solid ${COLORS.borderDivider}`,
                  background: 'rgba(61,220,151,.06)',
                }}
              >
                <select
                  value={editTeam}
                  onChange={(e) => setEditTeam(e.target.value)}
                  style={{
                    background: COLORS.bgInputDark,
                    border: `1px solid ${COLORS.borderInput}`,
                    borderRadius: 8,
                    color: COLORS.textPrimary,
                    font: `600 11px ${FONT_UI}`,
                    padding: '5px 6px',
                  }}
                >
                  {league.participants.map((team) => (
                    <option key={team.name} value={team.name}>
                      {team.name} {team.isMyTeam ? '(tua)' : ''}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={editCost}
                  onChange={(e) => setEditCost(Math.max(1, Number(e.target.value)))}
                  style={{
                    width: 60,
                    background: COLORS.bgInputDark,
                    border: `1px solid ${COLORS.borderInput}`,
                    borderRadius: 8,
                    color: COLORS.warning,
                    font: `700 12px ${FONT_MONO}`,
                    textAlign: 'center',
                    padding: '5px 4px',
                  }}
                />
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => saveEdit(h.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: COLORS.accent,
                      color: COLORS.accentOn,
                      border: 0,
                      borderRadius: 8,
                      padding: '6px 8px',
                      font: `700 11px ${FONT_UI}`,
                      cursor: 'pointer',
                    }}
                  >
                    <Save size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: COLORS.bgNested,
                      color: COLORS.textSecondary,
                      border: `1px solid ${COLORS.borderInput}`,
                      borderRadius: 8,
                      padding: '6px 8px',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={h.id}
              style={{
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                borderBottom: `1px solid ${COLORS.borderDivider}`,
              }}
            >
              <span style={{ width: 18, flex: 'none', font: `700 10px ${FONT_MONO}`, color: ROLE_COLORS[player.role] }}>{player.role}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600, display: 'block' }}>{player.name}</span>
                <span style={{ fontSize: 11, color: COLORS.textWeak, display: 'block' }}>assegnato a {h.boughtByTeam}</span>
              </span>
              <span style={{ textAlign: 'right', flex: 'none' }}>
                <span style={{ display: 'block', font: `700 15px ${FONT_MONO}` }}>{h.cost}</span>
                <span style={{ display: 'block', font: `600 10.5px ${FONT_MONO}`, color: deltaColor(h.cost, value) }}>
                  {formatSignedInt(delta)}
                </span>
              </span>
              <div style={{ display: 'flex', gap: 4, flex: 'none', borderLeft: `1px solid ${COLORS.borderDivider}`, paddingLeft: 8, marginLeft: 2 }}>
                <button
                  type="button"
                  onClick={() => startEdit(h)}
                  style={{
                    display: 'flex',
                    padding: 6,
                    background: COLORS.bgNested,
                    border: `1px solid ${COLORS.borderInput}`,
                    borderRadius: 8,
                    color: COLORS.textSecondary,
                    cursor: 'pointer',
                  }}
                >
                  <Edit3 size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingItem({ id: h.id, playerName: player.name })}
                  style={{
                    display: 'flex',
                    padding: 6,
                    background: COLORS.bgNested,
                    border: `1px solid ${COLORS.borderInput}`,
                    borderRadius: 8,
                    color: COLORS.textSecondary,
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div style={{ padding: 18, textAlign: 'center', fontSize: 12, color: COLORS.textWeak }}>
            {auctionHistory.length === 0 ? 'Nessuna aggiudicazione ancora.' : 'Nessun risultato per questo filtro.'}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deletingItem !== null}
        title="Eliminare l'aggiudicazione?"
        message={`Rimuovi "${deletingItem?.playerName}" dalla history. L'operazione non è reversibile (a differenza di "Annulla Ultimo").`}
        confirmLabel="Elimina"
        tone="destructive"
        onConfirm={() => {
          if (deletingItem) onDeleteAssignment?.(deletingItem.id);
          setDeletingItem(null);
        }}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  );
};
