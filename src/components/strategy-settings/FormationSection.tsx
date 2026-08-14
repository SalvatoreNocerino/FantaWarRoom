import React from 'react';
import { Card, SectionHeader, Field, Select } from '../ui';

interface FormationSectionProps {
  preferredFormation: string;
  selectableFormations: string[];
  onChange: (formation: string) => void;
}

export const FormationSection: React.FC<FormationSectionProps> = ({
  preferredFormation,
  selectableFormations,
  onChange,
}) => {
  return (
    <Card className="p-6 space-y-4">
      <SectionHeader number="2.1" title="Modulo di Riferimento Tattico" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <Field label="Seleziona Modulo Principale">
          <Select value={preferredFormation} onChange={(e) => onChange(e.target.value)} className="font-mono font-bold text-sm py-3">
            {selectableFormations.map((fmt) => (
              <option key={fmt} value={fmt}>
                {fmt}
              </option>
            ))}
          </Select>
        </Field>

        <div className="bg-surface-2 p-4 rounded-xl border border-border text-ink-soft text-xs flex items-center">
          <p>
            È il modulo con cui pensi di schierare la tua rosa: utile per pianificare la tua asta, ma non influenza il
            prezzo dei giocatori — il motore di pricing non sa quale modulo giocheranno le squadre avversarie, quindi
            usa un numero fisso di titolari per ruolo in lega, uguale per tutti.
          </p>
        </div>
      </div>
    </Card>
  );
};
