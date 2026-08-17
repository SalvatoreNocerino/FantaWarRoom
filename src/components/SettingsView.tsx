import React from 'react';
import { LeagueSettings, Player } from '../types';
import { LeagueSettingsView } from './LeagueSettingsView';

interface Props {
  league: LeagueSettings;
  onSaveLeague: (updatedLeague: LeagueSettings) => void;
  onImportPlayersList?: (customList: Player[]) => void;
}

export const SettingsView: React.FC<Props> = ({ league, onSaveLeague, onImportPlayersList }) => {
  return (
    <div className="text-ink">
      <LeagueSettingsView league={league} onSaveLeague={onSaveLeague} onImportPlayersList={onImportPlayersList} />
    </div>
  );
};
