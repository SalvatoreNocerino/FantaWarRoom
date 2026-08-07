import React, { useState, useEffect, useMemo } from 'react';
import { AppData, Player, LeagueSettings, StrategySettings, RosterPlayer } from './types';
import { loadAppData, saveAppData, resetAppData } from './utils/storage';
import { INITIAL_SERIE_A_PLAYERS } from './data/initialPlayers';
import { Navbar, ActiveTab } from './components/Navbar';
import { LeagueSettingsView } from './components/LeagueSettingsView';
import { StrategySettingsView } from './components/StrategySettingsView';
import { PlayersDatabaseView } from './components/PlayersDatabaseView';
import { AllTeamsView } from './components/AllTeamsView';
import { WarRoomAuctionConsole } from './components/WarRoomAuctionConsole';
import { AiCopilotView } from './components/AiCopilotView';
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
  // Start UX at 'league' settings as requested by user
  const [activeTab, setActiveTab] = useState<ActiveTab>('league');
  const [copilotPlayerContext, setCopilotPlayerContext] = useState<Player | null>(null);

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

  // Combine initial Serie A players with user custom added players
  const allPlayers = useMemo(() => {
    return [...INITIAL_SERIE_A_PLAYERS, ...appData.customPlayers];
  }, [appData.customPlayers]);

  // Total my team spent
  const myBids = useMemo(
    () => appData.auctionHistory.filter((b) => b.boughtByTeam === appData.league.participants.find(p => p.isMyTeam)?.name || appData.league.name),
    [appData.auctionHistory, appData.league]
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

  const handleImportPlayersList = (importedList: Player[]) => {
    setAppData((prev) => ({
      ...prev,
      customPlayers: [...prev.customPlayers, ...importedList],
    }));
  };

  const handleResetData = () => {
    const fresh = resetAppData();
    setAppData(fresh);
  };

  const handleOpenCopilotWithPlayer = (player: Player) => {
    setCopilotPlayerContext(player);
    setActiveTab('copilot');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 pb-12">
      <Navbar
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
      />

      <main className="transition-all duration-200">
        {activeTab === 'league' && (
          <LeagueSettingsView
            league={appData.league}
            onSaveLeague={handleSaveLeague}
            onImportPlayersList={handleImportPlayersList}
          />
        )}

        {activeTab === 'strategy' && (
          <StrategySettingsView
            strategy={appData.strategy}
            allPlayers={allPlayers}
            totalBudget={appData.league.totalBudget}
            selectableFormations={appData.league.selectableFormations}
            onSaveStrategy={handleSaveStrategy}
          />
        )}

        {activeTab === 'database' && (
          <PlayersDatabaseView
            allPlayers={allPlayers}
            wishlistIds={appData.strategy.wishlistIds}
            blacklistIds={appData.strategy.blacklistIds}
            totalBudget={appData.league.totalBudget}
            onToggleWishlist={handleToggleWishlist}
            onToggleBlacklist={handleToggleBlacklist}
            onAddCustomPlayer={handleAddCustomPlayer}
          />
        )}

        {activeTab === 'teams' && (
          <AllTeamsView
            allPlayers={allPlayers}
            league={appData.league}
            strategy={appData.strategy}
            auctionHistory={appData.auctionHistory}
          />
        )}

        {activeTab === 'warroom' && (
          <WarRoomAuctionConsole
            allPlayers={allPlayers}
            league={appData.league}
            strategy={appData.strategy}
            auctionHistory={appData.auctionHistory}
            onAssignPlayer={handleAssignPlayer}
            onUndoLastAssignment={handleUndoLastAssignment}
            onUpdateAssignment={handleUpdateAssignment}
            onDeleteAssignment={handleDeleteAssignment}
            onOpenCopilotWithPlayer={handleOpenCopilotWithPlayer}
          />
        )}

        {activeTab === 'copilot' && (
          <AiCopilotView
            allPlayers={allPlayers}
            league={appData.league}
            strategy={appData.strategy}
            auctionHistory={appData.auctionHistory}
            initialPlayerContext={copilotPlayerContext}
          />
        )}
      </main>

      <PwaInstallBanner />
    </div>
  );
}
