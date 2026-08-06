import React, { useState } from 'react';
import { LeagueSettings, Player } from '../types';
import { Settings, CheckCircle2, Save } from 'lucide-react';
import { GeneralInfoSection } from './league-settings/GeneralInfoSection';
import { RosterSlotsSection } from './league-settings/RosterSlotsSection';
import { ParticipantsSection } from './league-settings/ParticipantsSection';
import { ScoringRulesSection } from './league-settings/ScoringRulesSection';
import { AuctionRulesSection } from './league-settings/AuctionRulesSection';
import { FormationsSection } from './league-settings/FormationsSection';
import { PlayersUploadSection } from './league-settings/PlayersUploadSection';

interface LeagueSettingsViewProps {
  league: LeagueSettings;
  onSaveLeague: (updatedLeague: LeagueSettings) => void;
  onImportPlayersList?: (customList: Player[]) => void;
}

// Orchestratore: possiede solo lo stato condiviso (formData) e il submit.
// Ogni sezione numerata (1.1-1.7) vive nel proprio file sotto
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
    <form onSubmit={handleSave} className="max-w-5xl mx-auto px-4 py-6 space-y-8 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2 text-emerald-400">
            <Settings className="w-6 h-6" />
            <span>1. Lega e Regole Fantacalcio</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Configura la lega, le squadre partecipante, le regole di calcolo punteggio, i modificatori e la modalità
            d'asta.
          </p>
        </div>

        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center space-x-2 transition-all shadow-lg shadow-emerald-600/30 shrink-0 self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Salva Impostazioni</span>
        </button>
      </div>

      {saveSuccessMsg && (
        <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-xl text-xs flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-bold">Impostazioni della lega salvate correttamente! La War Room è aggiornata.</span>
        </div>
      )}

      <GeneralInfoSection formData={formData} setFormData={setFormData} />
      <RosterSlotsSection formData={formData} setFormData={setFormData} />
      <ParticipantsSection formData={formData} setFormData={setFormData} />
      <ScoringRulesSection formData={formData} setFormData={setFormData} />
      <AuctionRulesSection formData={formData} setFormData={setFormData} />
      <FormationsSection formData={formData} setFormData={setFormData} />
      <PlayersUploadSection onImportPlayersList={onImportPlayersList} />

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-xl text-sm flex items-center space-x-2 transition-all shadow-xl shadow-emerald-600/30"
        >
          <Save className="w-5 h-5" />
          <span>Salva Tutte le Impostazioni</span>
        </button>
      </div>
    </form>
  );
};
