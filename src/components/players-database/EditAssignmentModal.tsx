import React, { useState } from 'react';
import { Player, RosterPlayer, LeagueSettings } from '../../types';
import { Trash2, Save } from 'lucide-react';
import { Modal, Field, Select, NumberInput, Button, ConfirmDialog } from '../ui';

interface Props {
  player: Player;
  assignment: RosterPlayer;
  league: LeagueSettings;
  onSave: (assignmentId: string, boughtByTeam: string, cost: number) => void;
  onDelete: (assignmentId: string) => void;
  onClose: () => void;
}

// Corregge un'assegnazione già fatta (squadra o prezzo sbagliati durante la
// chiamata) senza dover passare da Console Live > Storico — accessibile
// direttamente dal Listone, dove si notano più spesso questi errori.
export const EditAssignmentModal: React.FC<Props> = ({ player, assignment, league, onSave, onDelete, onClose }) => {
  const [team, setTeam] = useState(assignment.boughtByTeam);
  const [cost, setCost] = useState(assignment.cost);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || cost < 1) return;
    onSave(assignment.id, team, cost);
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Modifica Assegnazione" maxWidth="max-w-sm">
      <form onSubmit={handleSave} className="space-y-4">
        <p className="text-sm text-ink-soft">
          <span className="font-bold">{player.name}</span> <span className="text-muted">({player.team})</span>
        </p>

        <Field label="Squadra Assegnataria">
          <Select value={team} onChange={(e) => setTeam(e.target.value)}>
            {league.participants.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name} {p.isMyTeam ? '(tua)' : ''}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Prezzo Pagato (FM)">
          <NumberInput variant="money" min={1} value={cost} onChange={setCost} required />
        </Field>

        <div className="flex justify-between items-center pt-2">
          <Button type="button" variant="destructive" onClick={() => setConfirmingDelete(true)}>
            <Trash2 className="w-4 h-4" />
            <span>Elimina</span>
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4" />
              <span>Salva</span>
            </Button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={confirmingDelete}
        title="Elimina Assegnazione"
        message={`Vuoi eliminare l'assegnazione di ${player.name} a ${assignment.boughtByTeam}? Il giocatore torna disponibile per l'asta.`}
        confirmLabel="Elimina"
        tone="destructive"
        onConfirm={() => {
          onDelete(assignment.id);
          setConfirmingDelete(false);
          onClose();
        }}
        onCancel={() => setConfirmingDelete(false)}
      />
    </Modal>
  );
};
