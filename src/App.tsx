import React, { useState, useEffect, useMemo, useRef } from 'react';
import { track } from '@vercel/analytics';
import { AppData, Player, LeagueSettings, StrategySettings, RosterPlayer, PlayerRole } from './types';
import { loadAppData, saveAppData, resetAppData } from './utils/storage';
import { FANTACALCIO_IT_LISTONE } from './data/presetListoni';
import { AppShell } from './components/shell/AppShell';
import { ActiveTab } from './components/shell/navItems';
import { DashboardView } from './components/DashboardView';
import { SettingsView } from './components/SettingsView';
import { FeedbackView } from './components/FeedbackView';
import { PlayersDatabaseView } from './components/PlayersDatabaseView';
import { WarRoomMobileConsole } from './components/war-room-mobile/WarRoomMobileConsole';
import { PwaInstallBanner } from './components/PwaInstallBanner';
import { UpgradeModal } from './components/UpgradeModal';
import {
  AppUser,
  subscribeToAuth,
  signInWithGoogle,
  logoutUser,
  saveUserDataToSupabase,
  loadUserDataFromSupabase,
  createSharedLeague,
  joinLeagueByCode,
  findMyMembership,
  loadSharedLeague,
  saveSharedLeagueAsOwner,
  saveMyMembershipStrategy,
  leaveSharedLeague,
  subscribeToSharedLeague,
} from './lib/supabase';

// Modalità lega condivisa (multi-utente, opt-in) — vedi
// supabase/migrations/004_add_shared_leagues.sql. null = modalità solo
// (comportamento invariato, dati in app_data).
interface SharedLeagueMeta {
  id: string;
  ownerId: string;
  inviteCode: string;
  myParticipantIndex: number;
}

export default function App() {
  const [appData, setAppData] = useState<AppData>(() => loadAppData());
  // Specchio sempre aggiornato di appData da leggere dentro closure async
  // "vecchie" (es. il listener subscribeToAuth qui sotto, registrato una
  // sola volta con deps [] all'avvio): appData lì dentro resterebbe
  // congelato al valore del mount, facendo perdere i dati locali fatti
  // prima del primo login cloud.
  const appDataRef = useRef(appData);
  useEffect(() => {
    appDataRef.current = appData;
  }, [appData]);
  // Apertura su Dashboard: risponde subito a "a che punto sono?" invece di
  // aprire su un form di configurazione (vedi Fase 1/2 redesign UI/UX).
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Unica via di navigazione fra tab: la SPA non usa un router (nessun
  // cambio URL), quindi il pageview automatico di Vercel Analytics vede solo
  // il caricamento iniziale. Questo evento è l'unico modo di sapere quali
  // sezioni vengono davvero visitate.
  const goToTab = (tab: ActiveTab) => {
    track('tab_view', { tab });
    setActiveTab(tab);
  };

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

  // Lega condivisa attiva (v1: al massimo una per utente) — null = modalità solo.
  const [sharedLeagueMeta, setSharedLeagueMeta] = useState<SharedLeagueMeta | null>(null);
  const isSharedMode = sharedLeagueMeta !== null;
  const isLeagueAdmin = !isSharedMode || sharedLeagueMeta!.ownerId === currentUser?.uid;

  // Freemium bootstrap (senza processore di pagamento, vedi UpgradeModal):
  // oltre FREE_ASSIGNMENT_LIMIT aggiudicazioni totali in Console Live, il
  // piano gratuito si ferma. isPremium arriva sola lettura da Supabase,
  // l'app non lo scrive mai (vedi supabase/migrations/003_add_premium_gate.sql).
  // FREEMIUM_DISABLED tiene tutta questa infrastruttura intatta ma disattiva
  // il gate: per ora l'app è gratuita per tutti. Per riattivare il limite,
  // basta rimettere questo flag a false.
  const FREEMIUM_DISABLED = true;
  const [isPremium, setIsPremium] = useState(false);
  const effectivePremium = FREEMIUM_DISABLED || isPremium;
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const FREE_ASSIGNMENT_LIMIT = 5;

  // Subscribe to Supabase Auth changes
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsCloudSyncing(true);
        try {
          // Prima controlla se l'utente è già membro di una lega condivisa
          // (da questo o un altro dispositivo) — in quel caso i suoi dati di
          // lega vengono da lì, non da app_data.
          const membership = await findMyMembership(user.uid);
          if (membership) {
            const shared = await loadSharedLeague(membership.leagueId);
            if (shared) {
              setSharedLeagueMeta({
                id: shared.id,
                ownerId: shared.ownerId,
                inviteCode: shared.inviteCode,
                myParticipantIndex: membership.participantIndex,
              });
              setAppData({
                league: shared.league,
                strategy: membership.strategy,
                importedListone: shared.importedListone,
                customPlayers: shared.customPlayers,
                auctionHistory: shared.auctionHistory,
              });
              return;
            }
          }

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
            setIsPremium(cloudData.isPremium ?? false);
          } else {
            // First time cloud user: seed Supabase with current appData.
            // Legge da appDataRef (non dalla appData chiusa nella closure di
            // questo effect, congelata al mount) così porta con sé i dati
            // fatti in locale prima del primo login.
            await saveUserDataToSupabase(user.uid, appDataRef.current);
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

  // Save on state changes — modalità solo (localStorage + app_data) invariata;
  // in modalità condivisa non tocchiamo mai localStorage/app_data: l'admin
  // salva le regole/listone/storico asta di lega, i membri solo la propria
  // strategia privata (le RLS bloccherebbero comunque il resto).
  useEffect(() => {
    if (sharedLeagueMeta) {
      if (!currentUser) return;
      setIsCloudSyncing(true);
      const save = isLeagueAdmin
        ? saveSharedLeagueAsOwner(
            sharedLeagueMeta.id,
            appData.league,
            appData.importedListone,
            appData.customPlayers,
            appData.auctionHistory
          )
        : saveMyMembershipStrategy(sharedLeagueMeta.id, currentUser.uid, appData.strategy);
      save.finally(() => setIsCloudSyncing(false));
      return;
    }

    saveAppData(appData);
    if (currentUser) {
      setIsCloudSyncing(true);
      saveUserDataToSupabase(currentUser.uid, appData).finally(() => {
        setIsCloudSyncing(false);
      });
    }
  }, [appData, currentUser, sharedLeagueMeta, isLeagueAdmin]);

  // Realtime: solo i membri (non l'admin) si iscrivono agli aggiornamenti —
  // l'admin è la fonte di verità che scrive, iscriverlo alle proprie stesse
  // scritture creerebbe un ping-pong salva→riceve→salva senza fine (ogni
  // salvataggio aggiorna updated_at, quindi sembra sempre "diverso").
  useEffect(() => {
    if (!sharedLeagueMeta || isLeagueAdmin) return;
    const unsubscribe = subscribeToSharedLeague(sharedLeagueMeta.id, (shared) => {
      setAppData((prev) => ({
        ...prev,
        league: shared.league,
        importedListone: shared.importedListone,
        customPlayers: shared.customPlayers,
        auctionHistory: shared.auctionHistory,
      }));
    });
    return unsubscribe;
  }, [sharedLeagueMeta?.id, isLeagueAdmin]);

  const handleLogin = async () => {
    track('login_started');
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

  // In modalità condivisa "la mia squadra" è lo slot reclamato all'iscrizione
  // (myParticipantIndex), non isMyTeam — quel flag riflette solo la scelta
  // fatta da chi ha creato la lega per sé stesso.
  const myTeamName = useMemo(() => {
    if (sharedLeagueMeta) {
      return appData.league.participants[sharedLeagueMeta.myParticipantIndex]?.name || '';
    }
    return appData.league.participants.find((p) => p.isMyTeam)?.name || appData.league.participants[0]?.name || '';
  }, [appData.league.participants, sharedLeagueMeta]);

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
    if (!isLeagueAdmin) return; // in lega condivisa solo l'admin conduce l'asta
    if (!effectivePremium && appData.auctionHistory.length >= FREE_ASSIGNMENT_LIMIT) {
      track('premium_upsell_shown');
      setShowUpgradeModal(true);
      return;
    }

    const newBid: RosterPlayer = {
      id: `bid_${Date.now()}`,
      playerId,
      boughtByTeam,
      cost,
      timestamp: Date.now(),
    };

    // Segnale d'uso principale: qui capiamo se l'app viene davvero usata
    // durante un'asta reale, non solo aperta. Il ruolo basta a leggere il
    // funnel in aggregato, niente nome giocatore/squadra (nessun dato di
    // lega nell'evento).
    track('player_assigned', { role: allPlayers.find((p) => p.id === playerId)?.role ?? 'unknown' });

    setAppData((prev) => ({
      ...prev,
      auctionHistory: [...prev.auctionHistory, newBid],
    }));
  };

  const handleUndoLastAssignment = () => {
    if (!isLeagueAdmin) return;
    setAppData((prev) => ({
      ...prev,
      auctionHistory: prev.auctionHistory.slice(0, -1),
    }));
  };

  const handleUpdateAssignment = (assignmentId: string, boughtByTeam: string, cost: number) => {
    if (!isLeagueAdmin) return;
    setAppData((prev) => ({
      ...prev,
      auctionHistory: prev.auctionHistory.map((item) =>
        item.id === assignmentId ? { ...item, boughtByTeam, cost } : item
      ),
    }));
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    if (!isLeagueAdmin) return;
    setAppData((prev) => ({
      ...prev,
      auctionHistory: prev.auctionHistory.filter((item) => item.id !== assignmentId),
    }));
  };

  const handleSaveLeague = (updatedLeague: LeagueSettings) => {
    if (!isLeagueAdmin) return;
    track('league_settings_saved');
    setAppData((prev) => ({
      ...prev,
      league: updatedLeague,
    }));
  };

  const handleSaveStrategy = (updatedStrategy: StrategySettings) => {
    track('strategy_saved');
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
    if (!isLeagueAdmin) return;
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
    goToTab('database');
  };

  // --- Lega condivisa: creazione, adesione, uscita ---

  const handleCreateSharedLeague = async (): Promise<boolean> => {
    if (!currentUser) return false;
    const shared = await createSharedLeague(
      currentUser.uid,
      appData.league,
      appData.importedListone,
      appData.customPlayers,
      appData.strategy
    );
    if (!shared) return false;
    track('shared_league_created');
    const myIndex = Math.max(
      0,
      appData.league.participants.findIndex((p) => p.isMyTeam)
    );
    setSharedLeagueMeta({ id: shared.id, ownerId: shared.ownerId, inviteCode: shared.inviteCode, myParticipantIndex: myIndex });
    return true;
  };

  const handleJoinSharedLeague = async (
    leagueId: string,
    participantIndex: number
  ): Promise<{ ok: boolean; message?: string }> => {
    if (!currentUser) return { ok: false, message: 'Devi accedere prima con Google.' };
    const result = await joinLeagueByCode(leagueId, currentUser.uid, participantIndex, appData.strategy);
    if (!result.ok) return result;

    const shared = await loadSharedLeague(leagueId);
    if (!shared) return { ok: false, message: 'Lega creata ma non riesco a caricarla. Ricarica la pagina.' };

    track('shared_league_joined');
    setSharedLeagueMeta({ id: shared.id, ownerId: shared.ownerId, inviteCode: shared.inviteCode, myParticipantIndex: participantIndex });
    setAppData((prev) => ({
      league: shared.league,
      strategy: prev.strategy,
      importedListone: shared.importedListone,
      customPlayers: shared.customPlayers,
      auctionHistory: shared.auctionHistory,
    }));
    return { ok: true };
  };

  const handleLeaveSharedLeague = async () => {
    if (!currentUser || !sharedLeagueMeta) return;
    await leaveSharedLeague(sharedLeagueMeta.id, currentUser.uid);
    setSharedLeagueMeta(null);

    // Torna alla modalità solo: ricarica i dati locali, poi quelli cloud
    // personali se presenti (stesso percorso del login iniziale).
    setAppData(loadAppData());
    const cloudData = await loadUserDataFromSupabase(currentUser.uid);
    if (cloudData && cloudData.league) {
      setAppData((prev) => ({
        league: { ...prev.league, ...(cloudData.league || {}) },
        strategy: { ...prev.strategy, ...(cloudData.strategy || {}) },
        importedListone: prev.importedListone,
        customPlayers: cloudData.customPlayers || [],
        auctionHistory: cloudData.auctionHistory || [],
      }));
      setIsPremium(cloudData.isPremium ?? false);
    }
  };

  return (
    <div className="min-h-screen bg-page text-ink font-sans selection:bg-accent selection:text-accent-ink">
      <AppShell
        activeTab={activeTab}
        setActiveTab={goToTab}
        myCredits={myRemainingCredits}
        mySlotsNeeded={mySlotsNeeded}
        countMyRole={countMyRole}
        rosterSlots={appData.league.rosterSlots}
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
            onGoToWarRoom={() => goToTab('warroom')}
            onGoToDatabase={() => goToTab('database')}
            onSelectForAuction={setSelectedAuctionPlayerId}
            isPremium={effectivePremium}
            freeAssignmentLimit={FREE_ASSIGNMENT_LIMIT}
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
            isSharedMode={isSharedMode}
            isLeagueAdmin={isLeagueAdmin}
            inviteCode={sharedLeagueMeta?.inviteCode ?? null}
            myTeamName={myTeamName}
            onCreateSharedLeague={handleCreateSharedLeague}
            onJoinSharedLeague={handleJoinSharedLeague}
            onLeaveSharedLeague={handleLeaveSharedLeague}
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
            readOnly={!isLeagueAdmin}
          />
        )}

        {activeTab === 'feedback' && <FeedbackView />}
      </main>
      </AppShell>

      <PwaInstallBanner />

      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        freeLimit={FREE_ASSIGNMENT_LIMIT}
      />
    </div>
  );
}
