import React, { useState, useMemo, useEffect } from 'react';
import { Player, LeagueSettings, StrategySettings, RosterPlayer, PlayerRole } from '../types';
import { priceAllPlayers, computeMyTeamBudget } from '../engine/pricingEngine';
import { toEnginePlayer, toEngineLeagueConfig, toEngineStrategyConfig, toAuctionAssignments } from '../engine/adapter';
import { BudgetSidebar } from './war-room/BudgetSidebar';
import { PlayerPricingCard } from './war-room/PlayerPricingCard';
import { PlayersPanel, PanelMode, SortBy } from './war-room/PlayersPanel';
import { AssignmentHistoryPanel } from './war-room/AssignmentHistoryPanel';
import { Sparkles } from 'lucide-react';

interface WarRoomAuctionConsoleProps {
  allPlayers: Player[];
  league: LeagueSettings;
  strategy: StrategySettings;
  auctionHistory: RosterPlayer[];
  onAssignPlayer: (playerId: string, boughtByTeam: string, cost: number) => void;
  onUndoLastAssignment: () => void;
  onUpdateAssignment?: (assignmentId: string, boughtByTeam: string, cost: number) => void;
  onDeleteAssignment?: (assignmentId: string) => void;
}

// Container: possiede lo stato e la logica derivata. Il pricing (Valore,
// Range, Max Bid, Pressione, Sostenibilità) viene dal motore deterministico
// in src/engine/pricingEngine.ts — nessuna chiamata AI qui. I blocchi visivi
// (PlayerPricingCard, BudgetSidebar, PlayersPanel, AssignmentHistoryPanel)
// sono puramente presentazionali e vivono in ./war-room/.
export const WarRoomAuctionConsole: React.FC<WarRoomAuctionConsoleProps> = ({
  allPlayers,
  league,
  strategy,
  auctionHistory,
  onAssignPlayer,
  onUndoLastAssignment,
  onUpdateAssignment,
  onDeleteAssignment,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [roleFilter, setRoleFilter] = useState<PlayerRole | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<SortBy>('maxBid');

  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [editTeam, setEditTeam] = useState<string>('');
  const [editCost, setEditCost] = useState<number>(1);
  const [historySearch, setHistorySearch] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(40);
      } catch (e) {
        // ignore if not allowed by browser permissions
      }
    }
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStartEditHistory = (item: RosterPlayer) => {
    setEditingAssignmentId(item.id);
    setEditTeam(item.boughtByTeam);
    setEditCost(item.cost);
  };

  const handleSaveEditHistory = (assignmentId: string) => {
    if (!editTeam || editCost < 1) return;
    onUpdateAssignment?.(assignmentId, editTeam, editCost);
    showToast(`Assegnazione aggiornata: ${editTeam} (${editCost} cr)`);
    setEditingAssignmentId(null);
  };

  const handleDeleteHistoryItem = (assignmentId: string, playerName: string) => {
    onDeleteAssignment?.(assignmentId);
    showToast(`Assegnazione cancellata per ${playerName}`);
    if (editingAssignmentId === assignmentId) setEditingAssignmentId(null);
  };

  const myTeamName = useMemo(
    () => league.participants.find((p) => p.isMyTeam)?.name || league.participants[0]?.name || '',
    [league.participants]
  );

  const [buyerTeam, setBuyerTeam] = useState<string>(myTeamName);
  const [bidPrice, setBidPrice] = useState<number>(1);

  useEffect(() => setBuyerTeam(myTeamName), [myTeamName]);

  // --- Motore di pricing: un solo calcolo per l'intero listone ------------
  const enginePlayers = useMemo(() => allPlayers.map(toEnginePlayer), [allPlayers]);
  const engineLeague = useMemo(() => toEngineLeagueConfig(league), [league]);
  const engineStrategy = useMemo(() => toEngineStrategyConfig(strategy), [strategy]);
  const assignments = useMemo(() => toAuctionAssignments(auctionHistory), [auctionHistory]);

  const pricingMap = useMemo(
    () => priceAllPlayers(enginePlayers, engineLeague, engineStrategy, assignments),
    [enginePlayers, engineLeague, engineStrategy, assignments]
  );
  const myTeamBudget = useMemo(
    () => computeMyTeamBudget(enginePlayers, engineLeague, assignments),
    [enginePlayers, engineLeague, assignments]
  );

  const assignedPlayerIds = useMemo(() => new Set(auctionHistory.map((h) => h.playerId)), [auctionHistory]);
  const availablePlayers = useMemo(() => allPlayers.filter((p) => !assignedPlayerIds.has(p.id)), [allPlayers, assignedPlayerIds]);

  const activePlayer = useMemo(
    () => allPlayers.find((p) => p.id === selectedPlayerId) || null,
    [allPlayers, selectedPlayerId]
  );
  const activePricing = activePlayer ? pricingMap.get(activePlayer.id) ?? null : null;

  useEffect(() => {
    if (activePricing) setBidPrice(Math.max(1, activePricing.maxBidDinamico || activePricing.value));
  }, [activePlayer?.id]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return availablePlayers.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [availablePlayers, searchQuery]);

  const slotsOccupiedByRole = useMemo(() => {
    const occ: Record<PlayerRole, number> = { P: 0, D: 0, C: 0, A: 0 };
    for (const h of auctionHistory) {
      if (h.boughtByTeam !== myTeamName) continue;
      const p = allPlayers.find((pl) => pl.id === h.playerId);
      if (p) occ[p.role]++;
    }
    return occ;
  }, [auctionHistory, myTeamName, allPlayers]);

  const myRoster = useMemo(
    () =>
      auctionHistory
        .filter((h) => h.boughtByTeam === myTeamName)
        .map((h) => {
          const player = allPlayers.find((p) => p.id === h.playerId);
          return player ? { player, pricing: pricingMap.get(player.id), paid: h.cost } : null;
        })
        .filter((x): x is { player: Player; pricing: ReturnType<typeof pricingMap.get>; paid: number } => x !== null),
    [auctionHistory, myTeamName, allPlayers, pricingMap]
  );

  const buyerBudgetResiduo = useMemo(() => {
    if (buyerTeam === myTeamName) return myTeamBudget.budgetResiduo;
    const spent = auctionHistory.filter((h) => h.boughtByTeam === buyerTeam).reduce((sum, h) => sum + h.cost, 0);
    const participant = league.participants.find((p) => p.name === buyerTeam);
    const initBudget = league.equalInitialCredits ? league.totalBudget : participant?.initialBudget ?? league.totalBudget;
    return Math.max(0, initBudget - spent);
  }, [buyerTeam, myTeamName, myTeamBudget, auctionHistory, league]);

  const isOverBudget = bidPrice > buyerBudgetResiduo;

  const handleConfirmAssignment = () => {
    if (!activePlayer || bidPrice < 1 || isOverBudget) return;
    onAssignPlayer(activePlayer.id, buyerTeam, bidPrice);
    showToast(`${activePlayer.name} assegnato a ${buyerTeam} per ${bidPrice} cr`);
    setSelectedPlayerId(null);
    setSearchQuery('');
  };

  const handleUndo = () => {
    onUndoLastAssignment();
    showToast('Ultima assegnazione annullata');
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 space-y-4 text-slate-100">
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <BudgetSidebar myTeamName={myTeamName} league={league} myTeamBudget={myTeamBudget} slotsOccupiedByRole={slotsOccupiedByRole} />

      <PlayerPricingCard
        activePlayer={activePlayer}
        pricing={activePricing}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        onSelectPlayer={setSelectedPlayerId}
        buyerTeam={buyerTeam}
        setBuyerTeam={setBuyerTeam}
        bidPrice={bidPrice}
        setBidPrice={setBidPrice}
        league={league}
        isOverBudget={isOverBudget}
        onConfirmAssignment={handleConfirmAssignment}
      />

      <PlayersPanel
        mode={panelMode}
        setMode={setPanelMode}
        availablePlayers={availablePlayers}
        pricingMap={pricingMap}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onSelectPlayer={setSelectedPlayerId}
        myRoster={myRoster}
      />

      <AssignmentHistoryPanel
        auctionHistory={auctionHistory}
        allPlayers={allPlayers}
        league={league}
        historySearch={historySearch}
        setHistorySearch={setHistorySearch}
        editingAssignmentId={editingAssignmentId}
        setEditingAssignmentId={setEditingAssignmentId}
        editTeam={editTeam}
        setEditTeam={setEditTeam}
        editCost={editCost}
        setEditCost={setEditCost}
        handleStartEditHistory={handleStartEditHistory}
        handleSaveEditHistory={handleSaveEditHistory}
        handleDeleteHistoryItem={handleDeleteHistoryItem}
        handleUndo={handleUndo}
      />
    </div>
  );
};
