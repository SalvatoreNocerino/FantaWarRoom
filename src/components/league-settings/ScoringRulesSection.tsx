import React from 'react';
import { LeagueSettings } from '../../types';
import { Card, SectionHeader, Checkbox } from '../ui';

interface Props {
  formData: LeagueSettings;
  setFormData: React.Dispatch<React.SetStateAction<LeagueSettings>>;
}

export const ScoringRulesSection: React.FC<Props> = ({ formData, setFormData }) => {
  return (
    <Card className="p-6 space-y-4">
      <SectionHeader number="1.4" title="Modificatori di Ruolo" />

      <Checkbox
        id="defModFlag"
        title="Modificatore di Difesa ATTIVO"
        checked={formData.defensiveModifier.enabled}
        onChange={(e) => setFormData({ ...formData, defensiveModifier: { enabled: e.target.checked } })}
      />

      <Checkbox
        id="midModFlag"
        title="Modificatore di Centrocampo ATTIVO"
        checked={formData.midfieldModifier.enabled}
        onChange={(e) => setFormData({ ...formData, midfieldModifier: { enabled: e.target.checked } })}
      />
    </Card>
  );
};
