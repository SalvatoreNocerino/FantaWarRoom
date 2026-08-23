import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, ArrowDownAZ, ArrowDown01 } from 'lucide-react';
import { Player, LeagueSettings, PlayerRole } from '../../types';
import { PlayerPricing, MyTeamBudget } from '../../engine/types';
import { TeamSummary } from '../../utils/fantaEngine';
import { COLORS, FONT_MONO, FONT_UI, ROLE_COLORS, ROLE_ARTICLE, ROLE_PLURAL, formatDelta } from './tokens';
import { RoleChips } from './RoleChips';
import { PlayerAvatar } from '../ui';
import { useNumberDraft } from '../../utils/useNumberDraft';

// 6 (pad top) + 50 (bottone) + 14 (pad bottom) — vedi TabBar.tsx. Solo su
// mobile: su desktop non c'è tab bar sotto, quindi l'offset è 0 (vedi
// WarRoomMobileConsole.tsx).
const MOBILE_TAB_BAR_HEIGHT = 70;

interface Props {
  allPlayers: Player[];
  availablePlayers: Player[];
  pricingMap: Map<string, PlayerPricing>;
  league: LeagueSettings;
  myTeamName: string;
  myTeamBudget: MyTeamBudget;
  teamSummaries: TeamSummary[];
  selectedPlayerId: string | null;
  onSelectPlayer: (id: string | null) => void;
  onAssignPlayer: (playerId: string, boughtByTeam: string, cost: number) => void;
  onSeeAllRole: (role: PlayerRole) => void;
  /** true su desktop: niente tab bar sotto, la barra offerta sticky a bottom:0. */
  noBottomTabBar?: boolean;
  /** Lega condivisa: i membri seguono l'asta in sola lettura, solo l'admin assegna. */
  readOnly?: boolean;
}

export const ChiamataScreen: React.FC<Props> = ({
  allPlayers,
  availablePlayers,
  pricingMap,
  league,
  myTeamName,
  myTeamBudget,
  teamSummaries,
  selectedPlayerId,
  onSelectPlayer,
  onAssignPlayer,
  onSeeAllRole,
  noBottomTabBar = false,
  readOnly = false,
}) => {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<PlayerRole | 'ALL'>('ALL');
  const [pickerOpen, setPickerOpen] = useState(false);
  // Ordinamento del dropdown di selezione giocatore (separato da restSort,
  // che riordina solo il pannello "rimanenti nel ruolo" più sotto).
  const [pickerSort, setPickerSort] = useState<'valore' | 'alfabetico'>('valore');
  const [bid, setBid] = useState(1);
  const bidDraft = useNumberDraft(bid, (n) => setBid(Math.min(400, Math.max(1, Math.round(n)))));
  const [buyerTeam, setBuyerTeam] = useState(myTeamName);
  // Ordinamento della lista "rimanenti nel ruolo" — solo desktop (vedi
  // noBottomTabBar più sotto), su mobile resta il default per valore.
  const [restSort, setRestSort] = useState<'valore' | 'alfabetico'>('valore');

  useEffect(() => setBuyerTeam((t) => (league.participants.some((p) => p.name === t) ? t : myTeamName)), [myTeamName, league.participants]);

  const sortedAvailable = useMemo(
    () => [...availablePlayers].sort((a, b) => (pricingMap.get(b.id)?.offertaMax ?? 0) - (pricingMap.get(a.id)?.offertaMax ?? 0)),
    [availablePlayers, pricingMap]
  );

  // Quando non c'è una selezione esplicita, il fallback deve rispettare il
  // filtro di ruolo attivo — altrimenti dopo ogni assegnazione (che azzera
  // selectedPlayerId) si torna sempre al giocatore col valore più alto in
  // assoluto su tutti i ruoli, invece di restare nel ruolo che si stava
  // chiamando (es. sui portieri, saltava sempre al miglior attaccante).
  const fallbackPool = useMemo(
    () => (roleFilter === 'ALL' ? sortedAvailable : sortedAvailable.filter((p) => p.role === roleFilter)),
    [sortedAvailable, roleFilter]
  );
  const fallbackPlayerId = fallbackPool[0]?.id ?? sortedAvailable[0]?.id ?? null;
  const effectiveId = selectedPlayerId ?? fallbackPlayerId;
  const activePlayer = useMemo(() => allPlayers.find((p) => p.id === effectiveId) || null, [allPlayers, effectiveId]);
  const activePricing = activePlayer ? pricingMap.get(activePlayer.id) ?? null : null;

  useEffect(() => {
    if (activePricing) setBid(Math.max(1, activePricing.offertaMax || activePricing.value));
  }, [activePlayer?.id]);

  const dropdownOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = availablePlayers.filter((p) => {
      if (roleFilter !== 'ALL' && p.role !== roleFilter) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q);
    });
    if (pickerSort === 'alfabetico') {
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }
    return [...filtered].sort((a, b) => (pricingMap.get(b.id)?.offertaMax ?? 0) - (pricingMap.get(a.id)?.offertaMax ?? 0));
  }, [availablePlayers, roleFilter, query, pickerSort, pricingMap]);

  // Già ordinati per valore (offertaMax desc, via sortedAvailable).
  const restAll = useMemo(() => {
    if (!activePlayer) return [];
    return sortedAvailable.filter((p) => p.role === activePlayer.role && p.id !== activePlayer.id);
  }, [sortedAvailable, activePlayer]);

  // Desktop mostra 5 TOP + 5 Buoni (10 totali) con toggle di ordinamento;
  // mobile resta il pannello compatto originale (3 TOP + 2 Buoni, fisso per valore).
  const restListSize = noBottomTabBar ? 10 : 5;
  const tierBoundary = noBottomTabBar ? 5 : 3;
  const restTiered = useMemo(
    () => restAll.slice(0, restListSize).map((p, i) => ({ player: p, tier: (i < tierBoundary ? 'TOP' : 'BUO') as 'TOP' | 'BUO' })),
    [restAll, restListSize, tierBoundary]
  );
  // Il tier riflette sempre il ranking per valore; l'ordinamento alfabetico
  // (solo desktop) riordina la visualizzazione senza toccarlo.
  const restList = useMemo(() => {
    if (noBottomTabBar && restSort === 'alfabetico') {
      return [...restTiered].sort((a, b) => a.player.name.localeCompare(b.player.name));
    }
    return restTiered;
  }, [restTiered, restSort, noBottomTabBar]);

  const buyerSummary = teamSummaries.find((t) => t.teamName === buyerTeam);
  const isMyBuyer = buyerTeam === myTeamName;
  const buyerResiduo = isMyBuyer ? myTeamBudget.budgetResiduo : buyerSummary?.remainingCredits ?? 0;
  const cap = isMyBuyer ? myTeamBudget.budgetSpendibile : buyerSummary?.maxPossibleBid ?? 0;
  const residuiDopo = buyerResiduo - bid;
  const isOverBudget = bid > buyerResiduo;

  const handleAssign = () => {
    if (!activePlayer || bid < 1 || isOverBudget) return;
    onAssignPlayer(activePlayer.id, buyerTeam, bid);
    onSelectPlayer(null);
    setQuery('');
  };

  if (!activePlayer || !activePricing) {
    return (
      <div style={{ padding: '14px 16px 18px', color: COLORS.textWeak, fontSize: 12.5, textAlign: 'center' }}>
        Nessun giocatore libero da chiamare.
      </div>
    );
  }

  const roleColor = ROLE_COLORS[activePlayer.role];

  return (
    <>
      <div style={{ padding: '14px 16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Hero card */}
        <div
          style={{
            background: `linear-gradient(180deg,rgba(61,220,151,.10),rgba(61,220,151,0) 62%),${COLORS.bgCard}`,
            border: '1px solid rgba(61,220,151,.28)',
            borderRadius: 18,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: `${roleColor}22`,
                color: roleColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                font: `700 16px ${FONT_MONO}`,
                flex: 'none',
              }}
            >
              {activePlayer.role}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: COLORS.accent, fontWeight: 800 }}>
                In asta ora
              </div>
              <input
                value={pickerOpen ? query : ''}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setPickerOpen(true)}
                placeholder={activePlayer.name}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  color: COLORS.textPrimary,
                  font: `800 20px ${FONT_UI}`,
                  letterSpacing: '-.02em',
                  outline: 'none',
                }}
              />
              <div style={{ fontSize: 11.5, color: COLORS.textMuted }}>
                {activePlayer.team} · rank #{activePricing.rankFvmRuolo} · {activePricing.titolareORiserva.toLowerCase()}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPickerOpen((o) => !o)}
              style={{
                flex: 'none',
                width: 34,
                height: 34,
                borderRadius: 10,
                background: COLORS.bgNested,
                border: `1px solid ${COLORS.borderInput}`,
                color: COLORS.textMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ChevronDown size={16} />
            </button>
          </div>

          {pickerOpen && (
            <div style={{ background: COLORS.bgNested, border: `1px solid ${COLORS.borderInput}`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 10px 8px', alignItems: 'center' }}>
                <RoleChips value={roleFilter} onChange={setRoleFilter} />
                <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                  <button
                    type="button"
                    onClick={() => setPickerSort('valore')}
                    title="Ordina per valore"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      padding: '3px 7px',
                      borderRadius: 7,
                      border: `1px solid ${pickerSort === 'valore' ? COLORS.accent : COLORS.borderInput}`,
                      background: pickerSort === 'valore' ? 'rgba(61,220,151,.10)' : 'transparent',
                      color: pickerSort === 'valore' ? COLORS.accent : COLORS.textMuted,
                      font: `700 10px ${FONT_UI}`,
                      cursor: 'pointer',
                    }}
                  >
                    <ArrowDown01 size={11} />
                    Valore
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickerSort('alfabetico')}
                    title="Ordina alfabeticamente"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      padding: '3px 7px',
                      borderRadius: 7,
                      border: `1px solid ${pickerSort === 'alfabetico' ? COLORS.accent : COLORS.borderInput}`,
                      background: pickerSort === 'alfabetico' ? 'rgba(61,220,151,.10)' : 'transparent',
                      color: pickerSort === 'alfabetico' ? COLORS.accent : COLORS.textMuted,
                      font: `700 10px ${FONT_UI}`,
                      cursor: 'pointer',
                    }}
                  >
                    <ArrowDownAZ size={11} />
                    A-Z
                  </button>
                </div>
              </div>
              <div style={{ maxHeight: 216, overflowY: 'auto' }}>
                {dropdownOptions.map((p) => {
                  const pricing = pricingMap.get(p.id);
                  const selected = p.id === activePlayer.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        onSelectPlayer(p.id);
                        setPickerOpen(false);
                        setQuery('');
                      }}
                      style={{
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer',
                        background: selected ? 'rgba(61,220,151,.07)' : 'transparent',
                        borderBottom: `1px solid ${COLORS.borderDivider}`,
                      }}
                    >
                      <PlayerAvatar name={p.name} role={p.role} size="sm" />
                      <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                      <span style={{ font: `600 10.5px ${FONT_MONO}`, color: COLORS.textWeak }}>{p.team}</span>
                      <span style={{ font: `700 13px ${FONT_MONO}`, color: COLORS.accent }}>{pricing?.offertaMax ?? '—'}</span>
                    </div>
                  );
                })}
                {dropdownOptions.length === 0 && (
                  <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: COLORS.textWeak }}>
                    Nessun giocatore libero con questo filtro
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setPickerOpen(false);
                  setQuery('');
                }}
                style={{
                  width: '100%',
                  height: 40,
                  background: 'transparent',
                  border: 0,
                  borderTop: `1px solid ${COLORS.borderDivider}`,
                  color: COLORS.textMuted,
                  font: `700 11.5px ${FONT_UI}`,
                  cursor: 'pointer',
                }}
              >
                Chiudi
              </button>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, paddingBottom: 2 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: COLORS.textMuted, fontWeight: 700 }}>
                Max bid
              </div>
              <div style={{ font: `700 64px/0.88 ${FONT_MONO}`, color: COLORS.accent, letterSpacing: '-.035em' }}>
                {activePricing.offertaMax}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: COLORS.textMuted, fontWeight: 700 }}>
                Offerta max
              </div>
              <div style={{ font: `700 26px ${FONT_MONO}`, color: COLORS.warning, lineHeight: 1.1 }}>{cap}</div>
              <div style={{ fontSize: 10.5, color: COLORS.textMuted }}>{formatDelta(bid, activePricing.value)}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            <div style={{ background: COLORS.bgNested, border: `1px solid ${COLORS.borderDivider}`, borderRadius: 11, padding: 10 }}>
              <div style={{ fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: COLORS.textMuted, fontWeight: 700 }}>
                Valore
              </div>
              <div style={{ font: `700 19px ${FONT_MONO}`, marginTop: 3 }}>{activePricing.value}</div>
            </div>
            <div style={{ background: COLORS.bgNested, border: `1px solid ${COLORS.borderDivider}`, borderRadius: 11, padding: 10 }}>
              <div style={{ fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: COLORS.textMuted, fontWeight: 700 }}>
                Range
              </div>
              <div style={{ font: `700 15px ${FONT_MONO}`, marginTop: 6 }}>
                {activePricing.rangeMin}–{activePricing.rangeMax}
              </div>
            </div>
            <div style={{ background: COLORS.bgNested, border: `1px solid ${COLORS.borderDivider}`, borderRadius: 11, padding: 10 }}>
              <div style={{ fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: COLORS.textMuted, fontWeight: 700 }}>
                Residui dopo
              </div>
              <div style={{ font: `700 19px ${FONT_MONO}`, marginTop: 3, color: residuiDopo < 0 ? COLORS.negative : COLORS.textPrimary }}>
                {residuiDopo}
              </div>
            </div>
          </div>
        </div>

        {/* Rimanenti nel ruolo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '0 2px' }}>
            <span style={{ fontSize: 12.5, fontWeight: 800 }}>
              Se lo perdi, restano {ROLE_ARTICLE[activePlayer.role]} {ROLE_PLURAL[activePlayer.role]}
            </span>
            <span
              style={{
                font: `700 9px ${FONT_MONO}`,
                color: roleColor,
                border: `1px solid ${roleColor}`,
                borderRadius: 4,
                padding: '1px 5px',
              }}
            >
              {activePlayer.role}
            </span>
            {noBottomTabBar && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: COLORS.textWeak }}>{restAll.length} liberi</span>
                <div style={{ display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  onClick={() => setRestSort('valore')}
                  title="Ordina per valore"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    padding: '3px 7px',
                    borderRadius: 7,
                    border: `1px solid ${restSort === 'valore' ? COLORS.accent : COLORS.borderInput}`,
                    background: restSort === 'valore' ? 'rgba(61,220,151,.10)' : 'transparent',
                    color: restSort === 'valore' ? COLORS.accent : COLORS.textMuted,
                    font: `700 10px ${FONT_UI}`,
                    cursor: 'pointer',
                  }}
                >
                  <ArrowDown01 size={11} />
                  Valore
                </button>
                <button
                  type="button"
                  onClick={() => setRestSort('alfabetico')}
                  title="Ordina alfabeticamente"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    padding: '3px 7px',
                    borderRadius: 7,
                    border: `1px solid ${restSort === 'alfabetico' ? COLORS.accent : COLORS.borderInput}`,
                    background: restSort === 'alfabetico' ? 'rgba(61,220,151,.10)' : 'transparent',
                    color: restSort === 'alfabetico' ? COLORS.accent : COLORS.textMuted,
                    font: `700 10px ${FONT_UI}`,
                    cursor: 'pointer',
                  }}
                >
                  <ArrowDownAZ size={11} />
                  A-Z
                </button>
                </div>
              </div>
            )}
            {!noBottomTabBar && (
              <span style={{ marginLeft: 'auto', fontSize: 11, color: COLORS.textWeak }}>{restAll.length} liberi · max bid</span>
            )}
          </div>
          <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.borderCard}`, borderRadius: 16, overflow: 'hidden' }}>
            {restList.map(({ player: p, tier }) => {
              const pricing = pricingMap.get(p.id);
              const tierColor = tier === 'TOP' ? COLORS.accent : COLORS.warning;
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectPlayer(p.id)}
                  style={{
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    borderBottom: `1px solid ${COLORS.borderDivider}`,
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      font: `700 9px ${FONT_MONO}`,
                      color: tierColor,
                      border: `1px solid ${tierColor}`,
                      borderRadius: 4,
                      padding: '1px 5px',
                      flex: 'none',
                    }}
                  >
                    {tier}
                  </span>
                  <PlayerAvatar name={p.name} role={p.role} size="sm" />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                  <span style={{ font: `400 12px ${FONT_UI}`, color: COLORS.textWeak }}>{p.team}</span>
                  <span style={{ font: `600 11px ${FONT_MONO}`, color: COLORS.textWeak }}>val {pricing?.value ?? '—'}</span>
                  <span style={{ font: `700 15px ${FONT_MONO}`, color: tierColor }}>{pricing?.offertaMax ?? '—'}</span>
                </div>
              );
            })}
            {restList.length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: COLORS.textWeak }}>
                Nessun altro {ROLE_PLURAL[activePlayer.role]} libero.
              </div>
            )}
            {restAll.length > 0 && (
              <button
                type="button"
                onClick={() => onSeeAllRole(activePlayer.role)}
                style={{
                  width: '100%',
                  padding: '13px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  background: 'transparent',
                  border: 0,
                  borderTop: restList.length > 0 ? `1px solid ${COLORS.borderDivider}` : 'none',
                  color: COLORS.textSecondary,
                  font: `700 12px ${FONT_UI}`,
                  cursor: 'pointer',
                }}
              >
                Vedi tutti {ROLE_ARTICLE[activePlayer.role]} {ROLE_PLURAL[activePlayer.role]}
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Barra offerta — sticky sopra la tab bar (che è sticky bottom:0 nel genitore).
          Lega condivisa: i membri seguono in sola lettura, solo l'admin assegna. */}
      {readOnly ? (
        <div
          style={{
            position: 'sticky',
            bottom: noBottomTabBar ? 0 : MOBILE_TAB_BAR_HEIGHT,
            padding: '14px 16px',
            // Solo quando questa barra è l'elemento più in basso sullo schermo
            // (noBottomTabBar) serve il margine per notch/home-indicator —
            // altrimenti sta sopra la TabBar, che gestisce già la safe-area.
            paddingBottom: noBottomTabBar ? 'max(14px, env(safe-area-inset-bottom))' : 14,
            background: COLORS.bgNested,
            borderTop: `1px solid ${COLORS.borderInput}`,
            textAlign: 'center',
            fontSize: 11.5,
            color: COLORS.textMuted,
            fontWeight: 700,
            zIndex: 5,
          }}
        >
          Segui l'asta in diretta — solo l'admin della lega può assegnare
        </div>
      ) : (
      <div
        style={{
          position: 'sticky',
          bottom: noBottomTabBar ? 0 : MOBILE_TAB_BAR_HEIGHT,
          padding: '10px 16px 12px',
          paddingBottom: noBottomTabBar ? 'max(12px, env(safe-area-inset-bottom))' : 12,
          background: COLORS.bgNested,
          borderTop: `1px solid ${COLORS.borderInput}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 5,
        }}
      >
        {league.participants.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10.5, color: COLORS.textMuted, fontWeight: 700, flex: 'none' }}>ASSEGNA A</span>
            <select
              value={buyerTeam}
              onChange={(e) => setBuyerTeam(e.target.value)}
              style={{
                flex: 1,
                minWidth: 0,
                background: COLORS.bgInputDark,
                border: `1px solid ${COLORS.borderInput}`,
                borderRadius: 10,
                color: COLORS.textPrimary,
                font: `600 12px ${FONT_UI}`,
                padding: '6px 8px',
              }}
            >
              {league.participants.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                  {p.isMyTeam ? ' (tua)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              background: COLORS.bgInputDark,
              border: `1px solid ${COLORS.borderInput}`,
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => setBid((b) => Math.max(1, b - 1))}
              style={{ width: 46, height: 46, background: 'transparent', border: 0, color: COLORS.textSecondary, fontSize: 22, cursor: 'pointer' }}
            >
              −
            </button>
            <input
              value={bidDraft.value}
              onChange={(e) => {
                // Strip tutto ciò che non è cifra: la tastiera fisica può
                // comunque digitare lettere/simboli nonostante inputMode.
                const digits = e.target.value.replace(/\D/g, '');
                bidDraft.onChange({ target: { value: digits } } as React.ChangeEvent<HTMLInputElement>);
              }}
              onBlur={bidDraft.onBlur}
              inputMode="numeric"
              style={{
                flex: 1,
                minWidth: 0,
                background: 'transparent',
                border: 0,
                textAlign: 'center',
                color: COLORS.textPrimary,
                font: `700 20px ${FONT_MONO}`,
              }}
            />
            <button
              type="button"
              onClick={() => setBid((b) => Math.min(400, b + 1))}
              style={{ width: 46, height: 46, background: 'transparent', border: 0, color: COLORS.textSecondary, fontSize: 22, cursor: 'pointer' }}
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={() => setBid(Math.max(1, cap))}
            style={{
              height: 46,
              padding: '0 12px',
              background: 'transparent',
              border: `1px solid ${COLORS.borderInput}`,
              borderRadius: 12,
              color: COLORS.textSecondary,
              font: `700 11px ${FONT_UI}`,
              lineHeight: 1.15,
              cursor: 'pointer',
            }}
          >
            Offerta
            <br />
            max
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={isOverBudget || bid < 1}
            style={{
              height: 46,
              padding: '0 22px',
              background: isOverBudget ? COLORS.borderInput : COLORS.textPrimary,
              color: isOverBudget ? COLORS.textWeak : COLORS.bgPage,
              font: `800 15px ${FONT_UI}`,
              border: 0,
              borderRadius: 12,
              cursor: isOverBudget ? 'not-allowed' : 'pointer',
            }}
          >
            Assegna
          </button>
        </div>
      </div>
      )}
    </>
  );
};
