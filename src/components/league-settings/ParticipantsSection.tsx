import React, { useState } from 'react';
import { LeagueSettings, TeamParticipant } from '../../types';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  formData: LeagueSettings;
  setFormData: React.Dispatch<React.SetStateAction<LeagueSettings>>;
}

export const ParticipantsSection: React.FC<Props> = ({ formData, setFormData }) => {
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamBudget, setNewTeamBudget] = useState(formData.totalBudget);

  const handleAddParticipant = () => {
    if (!newTeamName.trim()) return;
    const isFirst = formData.participants.length === 0;
    const newPart: TeamParticipant = {
      name: newTeamName.trim(),
      isMyTeam: isFirst,
      initialBudget: formData.equalInitialCredits ? formData.totalBudget : newTeamBudget
    };

    setFormData((prev) => ({
      ...prev,
      numTeams: prev.participants.length + 1,
      participants: [...prev.participants, newPart]
    }));

    setNewTeamName('');
  };

  const handleRemoveParticipant = (index: number) => {
    setFormData((prev) => {
      const updated = prev.participants.filter((_, i) => i !== index);
      return { ...prev, numTeams: updated.length, participants: updated };
    });
  };

  const handleSetMyTeam = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.map((p, i) => ({ ...p, isMyTeam: i === index }))
    }));
  };

  const handleUpdateParticipantBudget = (index: number, budget: number) => {
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.map((p, i) => (i === index ? { ...p, initialBudget: budget } : p))
    }));
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <span className="w-6 h-6 rounded bg-emerald-950 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center">
            1.3
          </span>
          <span>Partecipanti della Lega ({formData.participants.length} Squadre)</span>
        </h2>
      </div>

      <div className="flex gap-2 text-xs">
        <input
          type="text"
          placeholder="Nome nuova squadra (es. AC Picchia)..."
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
        />

        {!formData.equalInitialCredits && (
          <input
            type="number"
            placeholder="Budget"
            value={newTeamBudget}
            onChange={(e) => setNewTeamBudget(Number(e.target.value))}
            className="w-24 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold"
          />
        )}

        <button
          type="button"
          onClick={handleAddParticipant}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>Aggiungi</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {formData.participants.map((team, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
              team.isMyTeam
                ? 'bg-emerald-950/40 border-emerald-500/60 text-white font-bold'
                : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleSetMyTeam(idx)}
                className={`px-2 py-1 rounded text-[10px] font-bold ${
                  team.isMyTeam ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
                title="Imposta come la tua squadra principale"
              >
                {team.isMyTeam ? '★ MIA SQUADRA' : 'Imposta Tu'}
              </button>
              <span className="font-semibold">{team.name}</span>
            </div>

            <div className="flex items-center space-x-2 font-mono">
              {!formData.equalInitialCredits ? (
                <div className="flex items-center space-x-1">
                  <span className="text-slate-400 text-[10px]">Crediti:</span>
                  <input
                    type="number"
                    value={team.initialBudget}
                    onChange={(e) => handleUpdateParticipantBudget(idx, Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-amber-400 font-bold"
                  />
                </div>
              ) : (
                <span className="text-amber-400 font-bold">{formData.totalBudget} FM</span>
              )}

              {formData.participants.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveParticipant(idx)}
                  className="text-slate-500 hover:text-red-400 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
