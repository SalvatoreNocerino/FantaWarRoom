import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Player, LeagueSettings, StrategySettings, RosterPlayer, PlayerRole } from '../../types';
import { TeamSummary } from '../../utils/fantaEngine';
import { COLORS, FONT_MONO, FONT_UI, ROLE_COLORS } from './tokens';

const ROLES: PlayerRole[] = ['P', 'D', 'C', 'A'];

interface Props {
  league: LeagueSettings;
  strategy: StrategySettings;
  allPlayers: Player[];
  auctionHistory: RosterPlayer[];
  teamSummaries: TeamSummary[];
  myTeamName: string;
}

function creditColor(team: TeamSummary): string {
  if (team.isMyTeam) return COLORS.warning;
  const spentPct = team.initialBudget > 0 ? (team.initialBudget - team.remainingCredits) / team.initialBudget : 0;
  if (spentPct <= 0.04) return COLORS.accent;
  if (spentPct <= 0.14) return COLORS.warning;
  return COLORS.negative;
}

export const RoseScreen: React.FC<Props> = ({ league, strategy, allPlayers, auctionHistory, teamSummaries, myTeamName }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ [myTeamName]: true });

  const orderedTeams = useMemo(() => {
    const mine = teamSummaries.filter((t) => t.isMyTeam);
    const others = teamSummaries.filter((t) => !t.isMyTeam).sort((a, b) => a.remainingCredits - b.remainingCredits);
    return [...mine, ...others];
  }, [teamSummaries]);

  const totalSlots = league.rosterSlots.P + league.rosterSlots.D + league.rosterSlots.C + league.rosterSlots.A;
  const totalAssigned = auctionHistory.length;

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 2px' }}>
        <span style={{ fontSize: 12, fontWeight: 800 }}>
          {league.participants.length} squadre · {totalAssigned} aggiudicati
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: COLORS.textWeak }}>tocca per espandere</span>
      </div>

      <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.borderCard}`, borderRadius: 16, overflow: 'hidden' }}>
        {orderedTeams.map((team) => {
          const isOpen = !!expanded[team.teamName];
          const teamBids = auctionHistory.filter((h) => h.boughtByTeam === team.teamName);

          return (
            <div key={team.teamName}>
              <div
                onClick={() => setExpanded((e) => ({ ...e, [team.teamName]: !e[team.teamName] }))}
                style={{
                  padding: '13px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  borderBottom: `1px solid ${COLORS.borderDivider}`,
                  background: team.isMyTeam ? 'rgba(61,220,151,.06)' : 'transparent',
                }}
              >
                {isOpen ? (
                  <ChevronUp size={14} color={COLORS.textWeak} style={{ flex: 'none' }} />
                ) : (
                  <ChevronDown size={14} color={COLORS.textWeak} style={{ flex: 'none' }} />
                )}
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    font: `${team.isMyTeam ? 800 : 700} 13px ${FONT_UI}`,
                    color: team.isMyTeam ? COLORS.accent : COLORS.textPrimary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {team.teamName}
                </span>
                <span style={{ font: `600 10px ${FONT_MONO}`, color: COLORS.textWeak }}>
                  {team.playersBoughtCount}/{totalSlots}
                </span>
                <span style={{ font: `700 15px ${FONT_MONO}`, color: creditColor(team) }}>{team.remainingCredits}</span>
              </div>

              {isOpen && (
                <div
                  style={{
                    padding: '10px 14px 12px',
                    background: COLORS.bgNested,
                    borderBottom: `1px solid ${COLORS.borderDivider}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  {team.playersBoughtCount === 0 ? (
                    <div style={{ fontSize: 11.5, color: COLORS.textWeak }}>Nessun giocatore ancora acquistato</div>
                  ) : (
                    ROLES.map((role) => {
                      const roleItems = teamBids
                        .map((b) => ({ bid: b, player: allPlayers.find((p) => p.id === b.playerId) }))
                        .filter((x): x is { bid: RosterPlayer; player: Player } => !!x.player && x.player.role === role);
                      const spent = roleItems.reduce((sum, x) => sum + x.bid.cost, 0);
                      const planned = team.isMyTeam
                        ? Math.round(((strategy.budgetAllocationPct[role] ?? 0) / 100) * team.initialBudget)
                        : null;
                      const barPct = planned ? Math.min(100, (spent / Math.max(1, planned)) * 100) : 0;
                      const overBudget = planned !== null && spent > planned;

                      return (
                        <div key={role} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ font: `700 10px ${FONT_MONO}`, color: ROLE_COLORS[role] }}>{role}</span>
                            <span style={{ font: `600 11px ${FONT_MONO}`, color: COLORS.textMuted }}>
                              {roleItems.length}/{league.rosterSlots[role]}
                            </span>
                            <span style={{ marginLeft: 'auto', font: `600 11px ${FONT_MONO}`, color: COLORS.textWeak }}>
                              {planned !== null ? `${spent}/${planned}` : `${spent} cr`}
                            </span>
                          </div>
                          {planned !== null && (
                            <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,.08)' }}>
                              <div
                                style={{
                                  height: 3,
                                  borderRadius: 99,
                                  width: `${barPct}%`,
                                  background: overBudget ? COLORS.negative : 'rgba(255,255,255,.35)',
                                }}
                              />
                            </div>
                          )}
                          {roleItems.length > 0 && (
                            <div style={{ fontSize: 11.5, lineHeight: 1.5, color: COLORS.textSecondary }}>
                              {roleItems.map((x) => `${x.player.name} ${x.bid.cost}`).join(' · ')}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
