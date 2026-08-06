import React, { useState, useMemo, useEffect } from 'react';
import { Player, LeagueSettings, StrategySettings, RosterPlayer, PlayerRole } from '../types';
import { calculateTeamsSummary, getLivePlayerRecommendation } from '../utils/fantaEngine';
import { StatusBudgetBar, BudgetStatus } from './war-room/StatusBudgetBar';
import { ActivePlayerBiddingPanel } from './war-room/ActivePlayerBiddingPanel';
import { PlayerCallList } from './war-room/PlayerCallList';
import { AssignmentHistoryPanel } from './war-room/AssignmentHistoryPanel';
import { AiRecommendationPanel } from './war-room/AiRecommendationPanel';
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
  onOpenCopilotWithPlayer: (player: Player) => void;
}

// Container: possiede TUTTO lo stato e la logica derivata (nessuna logica
// è stata spostata o duplicata durante lo split). I 5 blocchi visivi
// (StatusBudgetBar, ActivePlayerBiddingPanel, PlayerCallList,
// AssignmentHistoryPanel, AiRecommendationPanel) sono puramente
// presentazionali e vivono in ./war-room/.
export const WarRoomAuctionConsole: React.FC<WarRoomAuctionConsoleProps> = ({
  allPlayers,
  league,
  strategy,
  auctionHistory,
  onAssignPlayer,
  onUndoLastAssignment,
  onUpdateAssignment,
  onDeleteAssignment,
  onOpenCopilotWithPlayer
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(allPlayers[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<PlayerRole | 'ALL'>('ALL');
  const [aiEnabled, setAiEnabled] = useState<boolean>(true);

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
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleStartEditHistory = (item: RosterPlayer) => {
    setEditingAssignmentId(item.id);
    setEditTeam(item.boughtByTeam);
    setEditCost(item.cost);
  };

  const handleSaveEditHistory = (assignmentId: string) => {
    if (!editTeam) return;
    if (editCost < 1) return;
    if (onUpdateAssignment) {
      onUpdateAssignment(assignmentId, editTeam, editCost);
      showToast(`✏️ Assegnazione aggiornata per ${editTeam} (${editCost} FM)`);
    }
    setEditingAssignmentId(null);
  };

  const handleDeleteHistoryItem = (assignmentId: string, playerName: string) => {
    if (onDeleteAssignment) {
      onDeleteAssignment(assignmentId);
      showToast(`🗑️ Assegnazione cancellata per ${playerName}`);
    }
    if (editingAssignmentId === assignmentId) {
      setEditingAssignmentId(null);
    }
  };

  const myTeamName = useMemo(() => {
    return league.participants.find((p) => p.isMyTeam)?.name || league.participants[0]?.name || 'FC Real Fantasia';
  }, [league.participants]);

  const [buyerTeam, setBuyerTeam] = useState<string>(myTeamName);
  const [bidPrice, setBidPrice] = useState<number>(1);

  const teamsSummary = useMemo(() => calculateTeamsSummary(league, auctionHistory, allPlayers), [league, auctionHistory, allPlayers]);

  const assignedPlayerIds = useMemo(() => new Set(auctionHistory.map((h) => h.playerId)), [auctionHistory]);

  const availablePlayers = useMemo(() => allPlayers.filter((p) => !assignedPlayerIds.has(p.id)), [allPlayers, assignedPlayerIds]);

  const activePlayer = useMemo(
    () => availablePlayers.find((p) => p.id === selectedPlayerId) || availablePlayers[0] || null,
    [availablePlayers, selectedPlayerId]
  );

  const recommendation = useMemo(() => {
    if (!activePlayer) return null;
    return getLivePlayerRecommendation(activePlayer, league, strategy, teamsSummary);
  }, [activePlayer, league, strategy, teamsSummary]);

  useEffect(() => {
    if (activePlayer) {
      setBidPrice(Math.max(1, activePlayer.basePrice));
    }
  }, [activePlayer?.id]);

  const filteredSearchList = useMemo(() => {
    return availablePlayers
      .filter((p) => {
        const matchesRole = roleFilter === 'ALL' || p.role === roleFilter;
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.team.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesRole && matchesSearch;
      })
      .slice(0, 15);
  }, [availablePlayers, searchQuery, roleFilter]);

  const myTeamSummary = useMemo(
    () => teamsSummary.find((t) => t.isMyTeam || t.teamName === myTeamName) || teamsSummary[0],
    [teamsSummary, myTeamName]
  );

  const budgetStatus: BudgetStatus = useMemo(() => {
    if (!myTeamSummary) {
      return {
        color: 'green',
        text: 'Competitivo (Semaforo Verde)',
        badgeBg: 'bg-emerald-500 text-slate-950',
        cardBorder: 'border-emerald-500/50',
        textColor: 'text-emerald-400'
      };
    }
    const remainingCredits = myTeamSummary.remainingCredits ?? 0;
    const remainingPct = league.totalBudget > 0 ? (remainingCredits / league.totalBudget) * 100 : 0;
    const slotsLeft = myTeamSummary.totalSlotsNeeded ?? 0;
    const avgBudgetPerSlot = slotsLeft > 0 ? remainingCredits / slotsLeft : 0;

    if (remainingPct >= 50 && avgBudgetPerSlot >= 10) {
      return {
        color: 'green',
        text: 'Competitivo (Semaforo Verde)',
        badgeBg: 'bg-emerald-500 text-slate-950',
        cardBorder: 'border-emerald-500/50',
        textColor: 'text-emerald-400'
      };
    } else if (remainingPct >= 25 && avgBudgetPerSlot >= 4) {
      return {
        color: 'orange',
        text: 'Moderato (Semaforo Arancione)',
        badgeBg: 'bg-amber-500 text-slate-950',
        cardBorder: 'border-amber-500/50',
        textColor: 'text-amber-400'
      };
    } else {
      return {
        color: 'red',
        text: 'Riservato / Critico (Semaforo Rosso)',
        badgeBg: 'bg-red-500 text-white',
        cardBorder: 'border-red-500/50',
        textColor: 'text-red-400'
      };
    }
  }, [myTeamSummary, league.totalBudget]);

  const buyerTeamSummary = useMemo(() => teamsSummary.find((t) => t.teamName === buyerTeam), [teamsSummary, buyerTeam]);

  const isOverBudget = useMemo(() => {
    if (!buyerTeamSummary) return false;
    return bidPrice > buyerTeamSummary.remainingCredits;
  }, [buyerTeamSummary, bidPrice]);

  const handleConfirmAssignment = () => {
    if (!activePlayer) return;
    if (bidPrice < 1) return;

    if (buyerTeamSummary && bidPrice > buyerTeamSummary.remainingCredits) {
      showToast(`⛔ ERRORE: ${buyerTeam} non ha budget sufficiente! (Disponibili: ${buyerTeamSummary.remainingCredits} FM, Offerta: ${bidPrice} FM)`);
      return;
    }

    onAssignPlayer(activePlayer.id, buyerTeam, bidPrice);
    showToast(`✅ ${activePlayer.name} assegnato a ${buyerTeam} per ${bidPrice} FM!`);

    const remainingWishlist = strategy.wishlistIds.map((id) => availablePlayers.find((p) => p.id === id)).filter(Boolean) as Player[];

    const nextPlayer = remainingWishlist.find((p) => p.id !== activePlayer.id) || availablePlayers.find((p) => p.id !== activePlayer.id);

    if (nextPlayer) {
      setSelectedPlayerId(nextPlayer.id);
    }
    setSearchQuery('');
  };

  const handleUndo = () => {
    onUndoLastAssignment();
    showToast('↩️ Ultima assegnazione annullata!');
  };

  const handleAddBid = (amount: number) => {
    setBidPrice((prev) => Math.max(1, prev + amount));
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(20);
      } catch (e) {
        // ignore
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-5 space-y-4 text-slate-100 relative">
      {toastMessage && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 border-2 border-emerald-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs sm:text-sm font-bold animate-bounce">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <StatusBudgetBar myTeamName={myTeamName} league={league} myTeamSummary={myTeamSummary} budgetStatus={budgetStatus} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 space-y-4">
          <ActivePlayerBiddingPanel
            activePlayer={activePlayer}
            league={league}
            strategy={strategy}
            buyerTeam={buyerTeam}
            setBuyerTeam={setBuyerTeam}
            bidPrice={bidPrice}
            setBidPrice={setBidPrice}
            handleAddBid={handleAddBid}
            isOverBudget={isOverBudget}
            buyerTeamSummary={buyerTeamSummary}
            auctionHistoryLength={auctionHistory.length}
            handleUndo={handleUndo}
            handleConfirmAssignment={handleConfirmAssignment}
          />
        </div>

        <div className="lg:col-span-5 space-y-3">
          <PlayerCallList
            filteredSearchList={filteredSearchList}
            activePlayer={activePlayer}
            strategy={strategy}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            setSelectedPlayerId={setSelectedPlayerId}
          />
        </div>
      </div>

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

      <AiRecommendationPanel
        aiEnabled={aiEnabled}
        setAiEnabled={setAiEnabled}
        recommendation={recommendation}
        activePlayer={activePlayer}
        bidPrice={bidPrice}
        setBidPrice={setBidPrice}
        handleAddBid={handleAddBid}
        showToast={showToast}
        onOpenCopilotWithPlayer={onOpenCopilotWithPlayer}
      />
    </div>
  );
};
