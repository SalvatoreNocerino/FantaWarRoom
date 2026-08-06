import React, { useState } from 'react';
import { Player, PlayerRole } from '../../types';
import { Plus } from 'lucide-react';

interface AddPlayerModalProps {
  onClose: () => void;
  onAddCustomPlayer: (player: Player) => void;
}

export const AddPlayerModal: React.FC<AddPlayerModalProps> = ({ onClose, onAddCustomPlayer }) => {
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<PlayerRole>('A');
  const [newTeam, setNewTeam] = useState('Inter');
  const [newPrice, setNewPrice] = useState(10);
  const [newFantaAvg, setNewFantaAvg] = useState(6.5);
  const [newFairValue, setNewFairValue] = useState('15-30 FM');
  const [newNotes, setNewNotes] = useState('');

  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const custom: Player = {
      id: `custom_${Date.now()}`,
      name: newName.trim(),
      role: newRole,
      team: newTeam.trim(),
      basePrice: newPrice,
      expectedFantaAvg: newFantaAvg,
      expectedGoalsAssists: 'N/A',
      tier: 3,
      notes: newNotes.trim() || 'Giocatore aggiunto manualmente',
      isCustom: true,
      fairValueBracket: newFairValue,
      lastYearStats: { appearances: 25, goals: 3, assists: 2, fantaAvg: 6.3 },
    };

    onAddCustomPlayer(custom);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <Plus className="w-5 h-5 text-emerald-400" />
          <span>Aggiungi Giocatore al Listone</span>
        </h2>

        <form onSubmit={handleCreatePlayer} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Nome e Cognome</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Ruolo</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as PlayerRole)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
              >
                <option value="P">P (Portiere)</option>
                <option value="D">D (Difensore)</option>
                <option value="C">C (Centrocampista)</option>
                <option value="A">A (Attaccante)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Squadra Serie A</label>
              <input
                type="text"
                value={newTeam}
                onChange={(e) => setNewTeam(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Quotazione Base (FM)</label>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">FM Prevista</label>
              <input
                type="number"
                step="0.1"
                value={newFantaAvg}
                onChange={(e) => setNewFantaAvg(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Fascia Fair Value (es. 20-35 FM)</label>
            <input
              type="text"
              value={newFairValue}
              onChange={(e) => setNewFairValue(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Note Tattiche</label>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
              rows={2}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">
              Annulla
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg"
            >
              Salva Giocatore
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
