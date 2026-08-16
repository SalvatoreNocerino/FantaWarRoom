import React, { useState } from 'react';
import { Player, PlayerRole } from '../../types';
import { Modal, Field, Input, Select, Textarea, Button } from '../ui';

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
      lastYearStats: { appearances: 25, starterAppearances: 20, goals: 3, assists: 2, yellowCards: 3, redCards: 0 },
    };

    onAddCustomPlayer(custom);
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Aggiungi Giocatore al Listone" maxWidth="max-w-md">
      <form onSubmit={handleCreatePlayer} className="space-y-3 text-xs">
        <Field label="Nome e Cognome">
          <Input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Ruolo">
            <Select value={newRole} onChange={(e) => setNewRole(e.target.value as PlayerRole)}>
              <option value="P">P (Portiere)</option>
              <option value="D">D (Difensore)</option>
              <option value="C">C (Centrocampista)</option>
              <option value="A">A (Attaccante)</option>
            </Select>
          </Field>

          <Field label="Squadra Serie A">
            <Input type="text" value={newTeam} onChange={(e) => setNewTeam(e.target.value)} required />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Quotazione Base (FM)">
            <Input type="number" variant="mono" value={newPrice} onChange={(e) => setNewPrice(Number(e.target.value))} />
          </Field>

          <Field label="FM Prevista">
            <Input type="number" step="0.1" variant="mono" value={newFantaAvg} onChange={(e) => setNewFantaAvg(Number(e.target.value))} />
          </Field>
        </div>

        <Field label="Fascia Fair Value (es. 20-35 FM)">
          <Input type="text" variant="mono" value={newFairValue} onChange={(e) => setNewFairValue(e.target.value)} />
        </Field>

        <Field label="Note Tattiche">
          <Textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} rows={2} />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annulla
          </Button>
          <Button type="submit">Salva Giocatore</Button>
        </div>
      </form>
    </Modal>
  );
};
