import React, { useState } from 'react';
import { LeagueSettings, StrategySettings, Player } from '../types';
import { Settings, Sliders } from 'lucide-react';
import { LeagueSettingsView } from './LeagueSettingsView';
import { StrategySettingsView } from './StrategySettingsView';
import { SharedLeaguePanel } from './SharedLeaguePanel';

interface Props {
  league: LeagueSettings;
  strategy: StrategySettings;
  allPlayers: Player[];
  onSaveLeague: (updatedLeague: LeagueSettings) => void;
  onSaveStrategy: (updatedStrategy: StrategySettings) => void;
  onImportPlayersList?: (customList: Player[]) => void;
  isSharedMode: boolean;
  isLeagueAdmin: boolean;
  inviteCode: string | null;
  myTeamName: string;
  onCreateSharedLeague: () => Promise<boolean>;
  onJoinSharedLeague: (leagueId: string, participantIndex: number) => Promise<{ ok: boolean; message?: string }>;
  onLeaveSharedLeague: () => Promise<void>;
}

type SettingsTab = 'league' | 'strategy';

const TABS: { id: SettingsTab; label: string; icon: typeof Settings }[] = [
  { id: 'league', label: 'Lega & Regole', icon: Settings },
  { id: 'strategy', label: 'Strategia Pre-Asta', icon: Sliders },
];

// Lega&Regole e Strategia sono configurazioni "one-shot", riviste raramente
// una volta impostata l'asta: raggrupparle qui libera i due posti più in
// alto nel menu principale per Dashboard e Console Live (uso quotidiano).
export const SettingsView: React.FC<Props> = ({
  league,
  strategy,
  allPlayers,
  onSaveLeague,
  onSaveStrategy,
  onImportPlayersList,
  isSharedMode,
  isLeagueAdmin,
  inviteCode,
  myTeamName,
  onCreateSharedLeague,
  onJoinSharedLeague,
  onLeaveSharedLeague,
}) => {
  const [tab, setTab] = useState<SettingsTab>('league');

  return (
    <div className="text-ink">
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <SharedLeaguePanel
          isSharedMode={isSharedMode}
          isLeagueAdmin={isLeagueAdmin}
          inviteCode={inviteCode}
          league={league}
          myTeamName={myTeamName}
          onCreate={onCreateSharedLeague}
          onJoin={onJoinSharedLeague}
          onLeave={onLeaveSharedLeague}
        />
      </div>
      <div className="max-w-5xl mx-auto px-4 flex gap-1.5 border-b border-border-soft">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${
                active ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink-soft'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {tab === 'league' && (
        <div className="relative">
          {isSharedMode && !isLeagueAdmin && (
            <div className="max-w-5xl mx-auto px-4 pt-6">
              <div className="bg-warning/10 border border-warning/30 text-warning text-xs font-semibold rounded-xl p-3.5">
                Solo l'admin della lega può modificare queste impostazioni. Le vedi in sola lettura.
              </div>
            </div>
          )}
          <div className={isSharedMode && !isLeagueAdmin ? 'pointer-events-none opacity-60' : undefined}>
            <LeagueSettingsView
              league={league}
              onSaveLeague={onSaveLeague}
              onImportPlayersList={isSharedMode && !isLeagueAdmin ? undefined : onImportPlayersList}
            />
          </div>
        </div>
      )}

      {tab === 'strategy' && (
        <StrategySettingsView
          strategy={strategy}
          allPlayers={allPlayers}
          totalBudget={league.totalBudget}
          onSaveStrategy={onSaveStrategy}
        />
      )}
    </div>
  );
};
