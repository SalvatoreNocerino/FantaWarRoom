import React from 'react';
import { LeagueSettings, PlayerRole } from '../../types';
import { Card, SectionHeader, NumberInput } from '../ui';

interface Props {
  formData: LeagueSettings;
  setFormData: React.Dispatch<React.SetStateAction<LeagueSettings>>;
}

// Tailwind needs literal class strings — a role-keyed map, not interpolation.
const ROLE_FIELDS: { key: PlayerRole; label: string; borderClass: string; textClass: string }[] = [
  { key: 'P', label: 'Portieri (P)', borderClass: 'border-role-p/30', textClass: 'text-role-p' },
  { key: 'D', label: 'Difensori (D)', borderClass: 'border-role-d/30', textClass: 'text-role-d' },
  { key: 'C', label: 'Centrocampisti (C)', borderClass: 'border-role-c/30', textClass: 'text-role-c' },
  { key: 'A', label: 'Attaccanti (A)', borderClass: 'border-role-a/30', textClass: 'text-role-a' },
];

export const RosterSlotsSection: React.FC<Props> = ({ formData, setFormData }) => {
  return (
    <Card className="p-6 space-y-4">
      <SectionHeader title="Giocatori Per Squadra (Slot per Ruolo)" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        {ROLE_FIELDS.map(({ key, label, borderClass, textClass }) => (
          <Card key={key} variant="nested" className={`p-3 border ${borderClass}`}>
            <span className={`${textClass} font-bold block mb-1`}>{label}</span>
            <NumberInput
              min={1}
              variant="mono"
              value={formData.rosterSlots[key]}
              onChange={(n) =>
                setFormData({
                  ...formData,
                  rosterSlots: { ...formData.rosterSlots, [key]: n },
                })
              }
              className="font-bold py-1.5"
            />
          </Card>
        ))}
      </div>
    </Card>
  );
};
