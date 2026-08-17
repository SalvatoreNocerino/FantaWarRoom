import React, { useState, useMemo } from 'react';
import { AppData, LeagueSettings, Player, RosterPlayer } from './types';
import { loadAppData, saveAppData, resetAppData } from './utils/storage';
import { FANTACALCIO_IT_LISTONE } from './data/presetListoni';
import { AppShell } from './components/shell/AppShell';
import { ActiveTab } from './components/shell/navItems';
import { SettingsView } from './components/SettingsView';
import { WarRoomMobileConsole } from './components/war-room-mobile/WarRoomMobileConsole';
import { PwaInstallBanner } from './components/PwaInstallBanner';

export default function App() {
  const [appData, setAppData] = useState<AppData>(() => loadAppData());
  // Apre su Console Live: l'app è pensata per essere usata solo durante
  // l'asta, quindi la schermata di uso quotidiano è il default.
  const [activeTab, setActiveTab] = useState<ActiveTab>('warroom');

  // Giocatore selezionato per la chiamata live in Console Live.
  const [selectedAuctionPlayerId, setSelectedAuctionPlayerId] = useState<string | null>(null);

  // Listone attivo (preset scelto o file caricato) + giocatori aggiunti a mano.
  // Se l'utente non ha ancora importato/selezionato nulla, il default è il
  // listone reale Fantacalcio.it (non più il piccolo dataset demo).
  const allPlayers = useMemo(() => {
    return [...(appData.importedListone ?? FANTACALCIO_IT_LISTONE), ...appData.customPlayers];
  }, [appData.importedListone, appData.customPlayers]);

  const myTeamName = useMemo(
    () => appData.league.participants.find((p) => p.isMyTeam)?.name || appData.league.participants[0]?.name || '',
    [appData.league.participants]
  );

  // Total my team spent
  const myBids = useMemo(
    () => appData.auctionHistory.filter((b) => b.boughtByTeam === myTeamName),
    [appData.auctionHistory, myTeamName]
  );

  const mySpent = useMemo(
    () => myBids.reduce((acc, b) => acc + b.cost, 0),
    [myBids]
  );

  const myRemainingCredits = Math.max(0, appData.league.totalBudget - mySpent);

  // My slots needed
  const countMyRole = useMemo(() => {
    const counts = { P: 0, D: 0, C: 0, A: 0 };
    myBids.forEach((bid) => {
      const p = allPlayers.find((player) => player.id === bid.playerId);
      if (p) counts[p.role]++;
    });
    return counts;
  }, [myBids, allPlayers]);

  const mySlotsNeeded =
    Math.max(0, appData.league.rosterSlots.P - countMyRole.P) +
    Math.max(0, appData.league.rosterSlots.D - countMyRole.D) +
    Math.max(0, appData.league.rosterSlots.C - countMyRole.C) +
    Math.max(0, appData.league.rosterSlots.A - countMyRole.A);

  // Persist to localStorage on every change.
  React.useEffect(() => {
    saveAppData(appData);
  }, [appData]);

  // Action Handlers
  const handleAssignPlayer = (playerId: string, boughtByTeam: string, cost: number, engineSnapshot?: any) => {
    const newBid: RosterPlayer = {
      id: `bid_${Date.now()}`,
      playerId,
      boughtByTeam,
      cost,
      timestamp: Date.now(),
      engineSnapshot,
    };

    setAppData((prev) => ({
      ...prev,
      auctionHistory: [...prev.auctionHistory, newBid],
    }));
  };

  const handleUndoLastAssignment = () => {
    setAppData((prev) => ({
      ...prev,
      auctionHistory: prev.auctionHistory.slice(0, -1),
    }));
  };

  const handleUpdateAssignment = (assignmentId: string, boughtByTeam: string, cost: number) => {
    setAppData((prev) => ({
      ...prev,
      auctionHistory: prev.auctionHistory.map((item) =>
        item.id === assignmentId ? { ...item, boughtByTeam, cost } : item
      ),
    }));
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    setAppData((prev) => ({
      ...prev,
      auctionHistory: prev.auctionHistory.filter((item) => item.id !== assignmentId),
    }));
  };

  const handleSaveLeague = (updatedLeague: LeagueSettings) => {
    setAppData((prev) => ({
      ...prev,
      league: updatedLeague,
    }));
  };

  // Sostituisce il listone attivo (preset scelto o file caricato) — non lo
  // somma a quello corrente.
  const handleImportPlayersList = (importedList: Player[]) => {
    setAppData((prev) => ({
      ...prev,
      importedListone: importedList,
      customPlayers: [],
    }));
  };

  const handleResetData = () => {
    const fresh = resetAppData();
    setAppData(fresh);
  };

  return (
    <div className="min-h-screen bg-page text-ink font-sans selection:bg-accent selection:text-accent-ink">
      <AppShell
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        myCredits={myRemainingCredits}
        mySlotsNeeded={mySlotsNeeded}
        countMyRole={countMyRole}
        rosterSlots={appData.league.rosterSlots}
        leagueName={appData.league.name}
        onResetData={handleResetData}
      >
      <main className="transition-all duration-200">
        {activeTab === 'settings' && (
          <SettingsView
            league={appData.league}
            onSaveLeague={handleSaveLeague}
            onImportPlayersList={handleImportPlayersList}
          />
        )}

        {activeTab === 'warroom' && (
          <WarRoomMobileConsole
            allPlayers={allPlayers}
            league={appData.league}
            strategy={appData.strategy}
            auctionHistory={appData.auctionHistory}
            selectedPlayerId={selectedAuctionPlayerId}
            onSelectPlayer={setSelectedAuctionPlayerId}
            onAssignPlayer={handleAssignPlayer}
            onUndoLastAssignment={handleUndoLastAssignment}
            onUpdateAssignment={handleUpdateAssignment}
            onDeleteAssignment={handleDeleteAssignment}
          />
        )}
      </main>
      </AppShell>

      <PwaInstallBanner />
    </div>
  );
}
