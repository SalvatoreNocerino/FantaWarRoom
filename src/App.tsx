import React, { useState, useEffect, useMemo } from 'react';
import { AppData, Player, LeagueSettings, StrategySettings, RosterPlayer, PlayerRole } from './types';
import { loadAppData, saveAppData, resetAppData } from './utils/storage';
import { FANTACALCIO_IT_LISTONE } from './data/presetListoni/fantacalcioIt';
import { AppShell } from './components/shell/AppShell';
import { ActiveTab } from './components/shell/navItems';
import { DashboardView } from './components/DashboardView';
import { SettingsView } from './components/SettingsView';
import { PlayersDatabaseView } from './components/PlayersDatabaseView';
import { WarRoomMobileConsole } from './components/war-room-mobile/WarRoomMobileConsole';
import { PwaInstallBanner } from './components/PwaInstallBanner';
import {
  AppUser,
  subscribeToAuth,
  signInWithGoogle,
  logoutUser,
  saveUserDataToSupabase,
  loadUserDataFromSupabase,
} from './lib/supabase';

export default function App() {
  const [appData, setAppData] = useState<AppData>(() => loadAppData());
  // Apertura su Dashboard: risponde subito a "a che punto sono?" invece di
  // aprire su un form di configurazione (vedi Fase 1/2 redesign UI/UX).
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Giocatore selezionato per la chiamata live — condiviso tra il Listone
  // (sezione 3) e Console Live (sezione 5), così selezionarlo in un punto lo
  // mostra "in asta" nell'altro.
  const [selectedAuctionPlayerId, setSelectedAuctionPlayerId] = useState<string | null>(null);
  // Filtro ruolo del Listone — condiviso così "vedi tutti gli attaccanti" da
  // Console Live naviga al Listone già filtrato per ruolo.
  const [databaseRoleFilter, setDatabaseRoleFilter] = useState<PlayerRole | 'ALL'>('ALL');

  // Supabase Auth state
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  // Subscribe to Supabase Auth changes
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsCloudSyncing(true);
        try {
          const cloudData = await loadUserDataFromSupabase(user.uid);
          if (cloudData && cloudData.league) {
            setAppData((prev) => ({
              league: { ...prev.league, ...(cloudData.league || {}) },
              strategy: { ...prev.strategy, ...(cloudData.strategy || {}) },
              // importedListone non è (ancora) sincronizzato su Supabase — vedi
              // supabase/migrations/002_add_imported_listone.sql — resta locale
              // per ora, non sovrascriverlo con i dati cloud.
              importedListone: prev.importedListone,
              customPlayers: cloudData.customPlayers || [],
              auctionHistory: cloudData.auctionHistory || [],
            }));
          } else {
            // First time cloud user: seed Supabase with current appData
            await saveUserDataToSupabase(user.uid, appData);
          }
        } catch (e) {
          console.error('Error loading Supabase user data:', e);
        } finally {
          setIsCloudSyncing(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Save to localStorage AND Supabase on state changes
  useEffect(() => {
    saveAppData(appData);
    if (currentUser) {
      setIsCloudSyncing(true);
      saveUserDataToSupabase(currentUser.uid, appData).finally(() => {
        setIsCloudSyncing(false);
      });
    }
  }, [appData, currentUser]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google login failed:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

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

  // Action Handlers
  const handleAssignPlayer = (playerId: string, boughtByTeam: string, cost: number) => {
    const newBid: RosterPlayer = {
      id: `bid_${Date.now()}`,
      playerId,
      boughtByTeam,
      cost,
      timestamp: Date.now(),
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

  const handleSaveStrategy = (updatedStrategy: StrategySettings) => {
    setAppData((prev) => ({
      ...prev,
      strategy: updatedStrategy,
    }));
  };

  const handleToggleWishlist = (playerId: string) => {
    setAppData((prev) => {
      const exists = prev.strategy.wishlistIds.includes(playerId);
      const updated = exists
        ? prev.strategy.wishlistIds.filter((id) => id !== playerId)
        : [...prev.strategy.wishlistIds, playerId];
      return {
        ...prev,
        strategy: { ...prev.strategy, wishlistIds: updated },
      };
    });
  };

  const handleToggleBlacklist = (playerId: string) => {
    setAppData((prev) => {
      const exists = prev.strategy.blacklistIds.includes(playerId);
      const updated = exists
        ? prev.strategy.blacklistIds.filter((id) => id !== playerId)
        : [...prev.strategy.blacklistIds, playerId];
      return {
        ...prev,
        strategy: { ...prev.strategy, blacklistIds: updated },
      };
    });
  };

  const handleAddCustomPlayer = (newPlayer: Player) => {
    setAppData((prev) => ({
      ...prev,
      customPlayers: [...prev.customPlayers, newPlayer],
    }));
  };

  // Sostituisce il listone attivo (preset scelto o file caricato) — non lo
  // somma a quello corrente, a differenza di handleAddCustomPlayer.
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

  // "Vedi tutti gli attaccanti" da Console Live → Chiamata: naviga al
  // Listone (sezione 3) già filtrato per quel ruolo.
  const handleSeeAllRoleInDatabase = (role: PlayerRole) => {
    setDatabaseRoleFilter(role);
    setActiveTab('database');
  };

  return (
    <div className="min-h-screen bg-page text-ink font-sans selection:bg-accent selection:text-accent-ink">
      <AppShell
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        myCredits={myRemainingCredits}
        mySlotsNeeded={mySlotsNeeded}
        leagueName={appData.league.name}
        onResetData={handleResetData}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isCloudSyncing={isCloudSyncing}
      >
      <main className="transition-all duration-200">
        {activeTab === 'dashboard' && (
          <DashboardView
            myTeamName={myTeamName}
            totalBudget={appData.league.totalBudget}
            myRemainingCredits={myRemainingCredits}
            rosterSlots={appData.league.rosterSlots}
            countMyRole={countMyRole}
            mySlotsNeeded={mySlotsNeeded}
            participantsCount={appData.league.participants.length}
            wishlistIds={appData.strategy.wishlistIds}
            allPlayers={allPlayers}
            auctionHistory={appData.auctionHistory}
            onGoToWarRoom={() => setActiveTab('warroom')}
            onGoToDatabase={() => setActiveTab('database')}
            onSelectForAuction={setSelectedAuctionPlayerId}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            league={appData.league}
            strategy={appData.strategy}
            allPlayers={allPlayers}
            onSaveLeague={handleSaveLeague}
            onSaveStrategy={handleSaveStrategy}
            onImportPlayersList={handleImportPlayersList}
          />
        )}

        {activeTab === 'database' && (
          <PlayersDatabaseView
            allPlayers={allPlayers}
            league={appData.league}
            strategy={appData.strategy}
            auctionHistory={appData.auctionHistory}
            wishlistIds={appData.strategy.wishlistIds}
            blacklistIds={appData.strategy.blacklistIds}
            totalBudget={appData.league.totalBudget}
            onToggleWishlist={handleToggleWishlist}
            onToggleBlacklist={handleToggleBlacklist}
            onAddCustomPlayer={handleAddCustomPlayer}
            selectedAuctionPlayerId={selectedAuctionPlayerId}
            onSelectForAuction={setSelectedAuctionPlayerId}
            roleFilter={databaseRoleFilter}
            setRoleFilter={setDatabaseRoleFilter}
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
            onSeeAllRole={handleSeeAllRoleInDatabase}
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
