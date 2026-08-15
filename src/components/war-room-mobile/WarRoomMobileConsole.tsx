import React, { useMemo, useState } from 'react';
import { Player, LeagueSettings, StrategySettings, RosterPlayer, PlayerRole } from '../../types';
import { useWarRoomEngine } from '../../engine/useWarRoomEngine';
import { calculateTeamsSummary } from '../../utils/fantaEngine';
import { COLORS, FONT_UI, FONT_MONO } from './tokens';
import { Header } from './Header';
import { TabBar, MobileScreen } from './TabBar';
import { ChiamataScreen } from './ChiamataScreen';
import { RoseScreen } from './RoseScreen';
import { HistoryScreen } from './HistoryScreen';

interface Props {
  allPlayers: Player[];
  league: LeagueSettings;
  strategy: StrategySettings;
  auctionHistory: RosterPlayer[];
  selectedPlayerId: string | null;
  onSelectPlayer: (id: string | null) => void;
  onAssignPlayer: (playerId: string, boughtByTeam: string, cost: number) => void;
  onUndoLastAssignment: () => void;
  onUpdateAssignment?: (assignmentId: string, boughtByTeam: string, cost: number) => void;
  onDeleteAssignment?: (assignmentId: string) => void;
  onSeeAllRole: (role: PlayerRole) => void;
  /** Lega condivisa: solo l'admin conduce l'asta, i membri seguono in sola
   * lettura (vedi App.tsx isLeagueAdmin). Assente/false in modalità solo. */
  readOnly?: boolean;
}

const HEADERS: Record<MobileScreen, { title: string; subtitle: (ctx: { count: number; teams: number; totalSpent: number }) => string }> = {
  chiamata: { title: 'Console Live', subtitle: ({ count }) => `chiamata #${count + 1} · ${count} aggiudicati` },
  rose: { title: 'Rose della lega', subtitle: ({ teams }) => `${teams} squadre · crediti residui` },
  history: { title: 'History', subtitle: ({ count, totalSpent }) => `${count} aggiudicati · ${totalSpent} crediti spesi in lega` },
};

const DesktopSectionHeading: React.FC<{ children: React.ReactNode; first?: boolean }> = ({ children, first = false }) => (
  <div
    style={{
      padding: first ? '4px 16px 0' : '18px 16px 0',
      fontSize: 13,
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: '.06em',
      color: COLORS.textMuted,
      fontFamily: FONT_UI,
    }}
  >
    {children}
  </div>
);

export const WarRoomMobileConsole: React.FC<Props> = ({
  allPlayers,
  league,
  strategy,
  auctionHistory,
  selectedPlayerId,
  onSelectPlayer,
  onAssignPlayer,
  onUndoLastAssignment,
  onUpdateAssignment,
  onDeleteAssignment,
  onSeeAllRole,
  readOnly = false,
}) => {
  const { myTeamName, pricingMap, myTeamBudget, availablePlayers } = useWarRoomEngine(allPlayers, league, strategy, auctionHistory);
  const teamSummaries = useMemo(() => calculateTeamsSummary(league, auctionHistory, allPlayers), [league, auctionHistory, allPlayers]);

  const [activeScreen, setActiveScreen] = useState<MobileScreen>('chiamata');

  const totalSpent = useMemo(() => auctionHistory.reduce((sum, h) => sum + h.cost, 0), [auctionHistory]);
  const headerCtx = { count: auctionHistory.length, teams: league.participants.length, totalSpent };
  const headerInfo = HEADERS[activeScreen];

  const chiamataProps = {
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
    readOnly,
  };
  const roseProps = { league, strategy, allPlayers, auctionHistory, teamSummaries, myTeamName };
  const historyProps = {
    auctionHistory,
    allPlayers,
    pricingMap,
    league,
    onUndoLastAssignment,
    onUpdateAssignment,
    onDeleteAssignment,
    readOnly,
  };

  return (
    <div
      className="md:max-w-none"
      style={{
        background: COLORS.bgPage,
        color: COLORS.textPrimary,
        fontFamily: FONT_UI,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '80vh',
      }}
    >
      {/* Mobile: header segue la tab attiva */}
      <div className="md:hidden">
        <Header title={headerInfo.title} subtitle={headerInfo.subtitle(headerCtx)} />
      </div>
      {/* Desktop: header statico, tutto è visibile in una pagina sola */}
      <div className="hidden md:block md:max-w-6xl md:mx-auto md:w-full" style={{ padding: '18px 20px 0' }}>
        <div style={{ fontSize: 15, fontWeight: 800 }}>Console Live</div>
        <div style={{ fontSize: 11.5, color: COLORS.textMuted, font: `600 11.5px ${FONT_MONO}` }}>
          {headerCtx.count} aggiudicati · {headerCtx.totalSpent} crediti spesi in lega
        </div>
      </div>

      {/* Mobile: una schermata alla volta */}
      <div className="md:hidden" style={{ flex: 1 }}>
        <div style={{ display: activeScreen === 'chiamata' ? undefined : 'none' }}>
          <ChiamataScreen {...chiamataProps} />
        </div>
        <div style={{ display: activeScreen === 'rose' ? undefined : 'none' }}>
          <RoseScreen {...roseProps} />
        </div>
        <div style={{ display: activeScreen === 'history' ? undefined : 'none' }}>
          <HistoryScreen {...historyProps} />
        </div>
      </div>
      <div className="md:hidden">
        <TabBar active={activeScreen} onChange={setActiveScreen} />
      </div>

      {/* Desktop: sfrutta la larghezza — Chiamata a sinistra (colonna
          principale), Rose in una colonna fissa a destra (sticky, scroll
          indipendente) così restano entrambe a vista senza scorrere avanti e
          indietro. History, a priorità più bassa, va a piena larghezza in
          fondo. Niente tab bar: tutto è raggiungibile senza cliccare. */}
      <div className="hidden md:block md:max-w-6xl md:mx-auto md:w-full" style={{ flex: 1, padding: '0 20px 28px' }}>
        <div className="md:grid md:grid-cols-[1fr_400px] md:gap-6 md:items-start">
          <div>
            <ChiamataScreen {...chiamataProps} noBottomTabBar />
          </div>
          <div style={{ position: 'sticky', top: 20, maxHeight: 'calc(100vh - 40px)', overflowY: 'auto' }}>
            <DesktopSectionHeading first>Rose della lega</DesktopSectionHeading>
            <RoseScreen {...roseProps} />
          </div>
        </div>
        <DesktopSectionHeading>History</DesktopSectionHeading>
        <HistoryScreen {...historyProps} />
      </div>
    </div>
  );
};
