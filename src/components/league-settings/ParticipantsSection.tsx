import React, { useState } from 'react';
import { LeagueSettings, TeamParticipant } from '../../types';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { Card, SectionHeader, Input, Button } from '../ui';

interface Props {
  formData: LeagueSettings;
  setFormData: React.Dispatch<React.SetStateAction<LeagueSettings>>;
}

export const ParticipantsSection: React.FC<Props> = ({ formData, setFormData }) => {
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamBudget, setNewTeamBudget] = useState(formData.totalBudget);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const startEditName = (idx: number, currentName: string) => {
    setEditingIdx(idx);
    setEditingName(currentName);
  };

  const commitEditName = () => {
    if (editingIdx === null) return;
    const trimmed = editingName.trim();
    if (trimmed) {
      setFormData((prev) => ({
        ...prev,
        participants: prev.participants.map((p, i) => (i === editingIdx ? { ...p, name: trimmed } : p)),
      }));
    }
    setEditingIdx(null);
  };

  const handleAddParticipant = () => {
    if (!newTeamName.trim()) return;
    const isFirst = formData.participants.length === 0;
    const newPart: TeamParticipant = {
      name: newTeamName.trim(),
      isMyTeam: isFirst,
      initialBudget: formData.equalInitialCredits ? formData.totalBudget : newTeamBudget,
    };

    setFormData((prev) => ({
      ...prev,
      numTeams: prev.participants.length + 1,
      participants: [...prev.participants, newPart],
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
      participants: prev.participants.map((p, i) => ({ ...p, isMyTeam: i === index })),
    }));
  };

  const handleUpdateParticipantBudget = (index: number, budget: number) => {
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.map((p, i) => (i === index ? { ...p, initialBudget: budget } : p)),
    }));
  };

  return (
    <Card className="p-6 space-y-4">
      <SectionHeader title={`Partecipanti della Lega (${formData.participants.length} Squadre)`} />

      <div className="flex gap-2 text-xs">
        <div className="flex-1 min-w-0">
          <Input
            type="text"
            placeholder="Nome nuova squadra (es. AC Picchia)..."
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            className="rounded-xl"
          />
        </div>

        {!formData.equalInitialCredits && (
          <div className="w-24 shrink-0">
            <Input
              type="number"
              placeholder="Budget"
              value={newTeamBudget}
              onChange={(e) => setNewTeamBudget(Number(e.target.value))}
              variant="money"
              className="rounded-xl"
            />
          </div>
        )}

        <Button onClick={handleAddParticipant} className="shrink-0">
          <Plus className="w-4 h-4" />
          <span>Aggiungi</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {formData.participants.map((team, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
              team.isMyTeam ? 'bg-accent/10 border-accent/60 text-ink font-bold' : 'bg-surface-2 border-border text-ink-soft'
            }`}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSetMyTeam(idx)}
                className={`px-2 py-1 rounded text-[10px] font-bold ${
                  team.isMyTeam ? 'bg-accent text-accent-ink' : 'bg-surface text-muted hover:text-ink-soft'
                }`}
                title="Imposta come la tua squadra principale"
              >
                {team.isMyTeam ? '★ MIA SQUADRA' : 'Imposta Tu'}
              </button>
              {editingIdx === idx ? (
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={commitEditName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    if (e.key === 'Escape') setEditingIdx(null);
                  }}
                  className="bg-surface border border-accent/60 rounded px-1.5 py-0.5 font-semibold text-ink min-w-0 w-32"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => startEditName(idx, team.name)}
                  className="font-semibold flex items-center gap-1 hover:text-accent transition-colors group/name"
                  title="Clicca per rinominare"
                >
                  <span>{team.name}</span>
                  <Pencil className="w-3 h-3 opacity-0 group-hover/name:opacity-60" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 font-mono">
              {!formData.equalInitialCredits ? (
                <div className="flex items-center gap-1">
                  <span className="text-muted text-[10px]">Crediti:</span>
                  <div className="w-16 shrink-0">
                    <Input
                      type="number"
                      value={team.initialBudget}
                      onChange={(e) => handleUpdateParticipantBudget(idx, Number(e.target.value))}
                      variant="money"
                      className="rounded px-1.5 py-0.5"
                    />
                  </div>
                </div>
              ) : (
                <span className="text-warning font-bold">{formData.totalBudget} FM</span>
              )}

              {formData.participants.length > 2 && (
                <button type="button" onClick={() => handleRemoveParticipant(idx)} className="text-faint hover:text-negative p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
