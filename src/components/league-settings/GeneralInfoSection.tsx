import React from 'react';
import { LeagueSettings } from '../../types';
import { Card, SectionHeader, Field, Input, Checkbox } from '../ui';

interface Props {
  formData: LeagueSettings;
  setFormData: React.Dispatch<React.SetStateAction<LeagueSettings>>;
}

export const GeneralInfoSection: React.FC<Props> = ({ formData, setFormData }) => {
  return (
    <Card className="p-6 space-y-5">
      <SectionHeader number="1.1" title="Informazioni Generali Lega" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <Field label="1.1.1 Nome della Lega">
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </Field>

        <Field label="1.1.2 Numero Partecipanti" hint="Si aggiorna da solo: aggiungi o rimuovi squadre qui sotto in 1.3.">
          <Input type="number" variant="mono" value={formData.participants.length} disabled readOnly className="opacity-70 cursor-not-allowed" />
        </Field>

        <Field label="1.1.3 Budget Iniziale di Base (FM)">
          <Input
            type="number"
            variant="money"
            value={formData.totalBudget}
            onChange={(e) => setFormData({ ...formData, totalBudget: Number(e.target.value) })}
            required
          />
        </Field>
      </div>

      <Checkbox
        id="equalCreditsFlag"
        title="1.1.4 Tutte le squadre partono con gli stessi crediti"
        description="Disattiva per personalizzare il budget iniziale per ogni fantallenatore (es. penalizzazioni o riconferme)."
        checked={formData.equalInitialCredits}
        onChange={(e) => setFormData({ ...formData, equalInitialCredits: e.target.checked })}
      />
    </Card>
  );
};
