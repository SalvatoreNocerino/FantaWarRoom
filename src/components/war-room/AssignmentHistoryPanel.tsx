import React from 'react';
import { Player, LeagueSettings, RosterPlayer } from '../../types';
import { History, Search, Undo2, Save, X, Edit3, Trash2 } from 'lucide-react';

interface Props {
  auctionHistory: RosterPlayer[];
  allPlayers: Player[];
  league: LeagueSettings;
  historySearch: string;
  setHistorySearch: (q: string) => void;
  editingAssignmentId: string | null;
  setEditingAssignmentId: (id: string | null) => void;
  editTeam: string;
  setEditTeam: (team: string) => void;
  editCost: number;
  setEditCost: (cost: number) => void;
  handleStartEditHistory: (item: RosterPlayer) => void;
  handleSaveEditHistory: (assignmentId: string) => void;
  handleDeleteHistoryItem: (assignmentId: string, playerName: string) => void;
  handleUndo: () => void;
}

export const AssignmentHistoryPanel: React.FC<Props> = ({
  auctionHistory,
  allPlayers,
  league,
  historySearch,
  setHistorySearch,
  editingAssignmentId,
  setEditingAssignmentId,
  editTeam,
  setEditTeam,
  editCost,
  setEditCost,
  handleStartEditHistory,
  handleSaveEditHistory,
  handleDeleteHistoryItem,
  handleUndo
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">History Assegnazioni Asta & Registro Modifiche</h3>
          <span className="bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full">
            {auctionHistory.length} Aggiudicati
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filtra history..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500 w-36 sm:w-48"
            />
          </div>

          {auctionHistory.length > 0 && (
            <button
              type="button"
              onClick={handleUndo}
              className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-red-400 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 transition-colors"
              title="Annulla l'ultima aggiudicazione effettuata"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Annulla Ultimo</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {auctionHistory.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs italic">
            Nessun calciatore è stato ancora aggiudicato durante questa sessione d'asta.
          </div>
        ) : (
          [...auctionHistory]
            .reverse()
            .filter((item) => {
              if (!historySearch.trim()) return true;
              const player = allPlayers.find((p) => p.id === item.playerId);
              const q = historySearch.toLowerCase();
              return (player && player.name.toLowerCase().includes(q)) || item.boughtByTeam.toLowerCase().includes(q);
            })
            .map((item) => {
              const player = allPlayers.find((p) => p.id === item.playerId);
              const isEditing = editingAssignmentId === item.id;

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    isEditing ? 'bg-cyan-950/40 border-cyan-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="w-6 h-6 rounded inline-flex items-center justify-center font-mono font-bold text-xs text-white shrink-0 bg-slate-700">
                      {player?.role || '?'}
                    </span>
                    <div className="min-w-0">
                      <strong className="text-white block truncate text-xs sm:text-sm">{player?.name || 'Giocatore Sconosciuto'}</strong>
                      <span className="text-[11px] text-slate-400">{player?.team || 'Serie A'}</span>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="flex flex-wrap items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-700">
                      <div className="flex items-center space-x-1">
                        <span className="text-slate-400 text-[11px]">Squadra:</span>
                        <select
                          value={editTeam}
                          onChange={(e) => setEditTeam(e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                        >
                          {league.participants.map((team) => (
                            <option key={team.name} value={team.name}>
                              {team.name} {team.isMyTeam ? '(La Tua Squadra)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center space-x-1">
                        <span className="text-slate-400 text-[11px]">Prezzo:</span>
                        <input
                          type="number"
                          min={1}
                          value={editCost}
                          onChange={(e) => setEditCost(Math.max(1, Number(e.target.value)))}
                          className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-center font-mono font-bold text-amber-400 focus:outline-none focus:border-cyan-500"
                        />
                        <span className="text-amber-400 font-mono">FM</span>
                      </div>

                      <div className="flex items-center space-x-1 ml-auto">
                        <button
                          type="button"
                          onClick={() => handleSaveEditHistory(item.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded text-xs flex items-center space-x-1"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Salva</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingAssignmentId(null)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-2 py-1 rounded text-xs"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between sm:justify-end gap-4 min-w-0">
                      <div className="text-right">
                        <span className="text-slate-400 text-[11px] block">Aggiudicato a</span>
                        <strong className="text-cyan-300 font-semibold">{item.boughtByTeam}</strong>
                      </div>

                      <div className="text-right">
                        <span className="text-slate-400 text-[11px] block">Costo Asta</span>
                        <span className="font-mono font-bold text-amber-400 text-xs sm:text-sm">{item.cost} FM</span>
                      </div>

                      <div className="flex items-center space-x-1 border-l border-slate-800 pl-3">
                        <button
                          type="button"
                          onClick={() => handleStartEditHistory(item)}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800 rounded-lg text-xs transition-colors"
                          title="Modifica squadra o prezzo pagato"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteHistoryItem(item.id, player?.name || 'Giocatore')}
                          className="p-1.5 bg-slate-900 hover:bg-red-950/60 text-slate-300 hover:text-red-400 border border-slate-800 rounded-lg text-xs transition-colors"
                          title="Cancella questa assegnazione"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};
