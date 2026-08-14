import React, { useState } from 'react';
import { LeagueSettings, Player } from '../types';
import { Settings, Save } from 'lucide-react';
import { GeneralInfoSection } from './league-settings/GeneralInfoSection';
import { RosterSlotsSection } from './league-settings/RosterSlotsSection';
import { ParticipantsSection } from './league-settings/ParticipantsSection';
import { ScoringRulesSection } from './league-settings/ScoringRulesSection';
import { PlayersUploadSection } from './league-settings/PlayersUploadSection';
import { PageHeader, Button, Alert } from './ui';

interface LeagueSettingsViewProps {
  league: LeagueSettings;
  onSaveLeague: (updatedLeague: LeagueSettings) => void;
  onImportPlayersList?: (customList: Player[]) => void;
}

// Orchestratore: possiede solo lo stato condiviso (formData) e il submit.
// Ogni sezione numerata (1.1-1.5) vive nel proprio file sotto
// ./league-settings/ e riceve formData + setFormData.
export const LeagueSettingsView: React.FC<LeagueSettingsViewProps> = ({
  league,
  onSaveLeague,
  onImportPlayersList
}) => {
  const [formData, setFormData] = useState<LeagueSettings>({ ...league });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveLeague(formData);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  return (
    <form onSubmit={handleSave} className="max-w-5xl mx-auto px-4 py-6 space-y-8 text-ink">
      <PageHeader
        icon={Settings}
        title="1. Lega e Regole Fantacalcio"
        subtitle="Configura la lega, le squadre partecipanti, gli slot per ruolo, i modificatori e il listone di riferimento."
        action={
          <Button type="submit">
            <Save className="w-4 h-4" />
            <span>Salva Impostazioni</span>
          </Button>
        }
      />

      {saveSuccessMsg && <Alert tone="success">Impostazioni della lega salvate correttamente! La War Room è aggiornata.</Alert>}

      <GeneralInfoSection formData={formData} setFormData={setFormData} />
      <RosterSlotsSection formData={formData} setFormData={setFormData} />
      <ParticipantsSection formData={formData} setFormData={setFormData} />
      <ScoringRulesSection formData={formData} setFormData={setFormData} />
      <PlayersUploadSection onImportPlayersList={onImportPlayersList} />

      <div className="pt-4 flex justify-end">
        <Button type="submit" size="lg">
          <Save className="w-5 h-5" />
          <span>Salva Tutte le Impostazioni</span>
        </Button>
      </div>
    </form>
  );
};
