import React from 'react';
import { LogIn, LogOut, CloudCheck, RotateCcw } from 'lucide-react';
import { AppUser } from '../../lib/supabase';

interface Props {
  currentUser: AppUser | null;
  onLogin: () => void;
  onLogout: () => void;
  isCloudSyncing: boolean;
  onResetData: () => void;
  /** compact = inline cluster for the mobile top bar; full = stacked block for sidebar/drawer. */
  compact?: boolean;
}

export const AuthBlock: React.FC<Props> = ({ currentUser, onLogin, onLogout, isCloudSyncing, onResetData, compact = false }) => {
  const handleReset = () => {
    if (confirm("Sei sicuro di voler azzerare tutti i dati dell'asta e le impostazioni salvate?")) {
      onResetData();
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {currentUser ? (
          <div className="flex items-center gap-1.5 bg-field border border-accent/30 px-2 py-1 rounded-lg text-xs">
            {currentUser.photoURL ? (
              <img src={currentUser.photoURL} alt="Avatar" className="w-4 h-4 rounded-full" />
            ) : (
              <CloudCheck className="w-3.5 h-3.5 text-accent" />
            )}
            <button type="button" onClick={onLogout} className="text-muted hover:text-negative" title="Logout">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onLogin}
            className="bg-accent text-accent-ink font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Accedi</span>
          </button>
        )}
        <button type="button" onClick={handleReset} className="text-muted hover:text-negative p-1.5" title="Reset dati">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 text-xs">
      {currentUser ? (
        <div className="flex items-center gap-2 bg-field border border-border-strong rounded-xl px-3 py-2">
          {currentUser.photoURL ? (
            <img src={currentUser.photoURL} alt="User" className="w-6 h-6 rounded-full border border-accent shrink-0" />
          ) : (
            <CloudCheck className="w-4 h-4 text-accent shrink-0" />
          )}
          <div className="flex-1 min-w-0 text-left">
            <span className="text-ink-soft font-semibold block truncate">{currentUser.displayName || 'Utente Cloud'}</span>
            <span className="text-faint block">{isCloudSyncing ? 'Syncing...' : 'Cloud Sync OK'}</span>
          </div>
          <button type="button" onClick={onLogout} className="text-muted hover:text-negative p-1 shrink-0" title="Logout">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onLogin}
          className="bg-accent/10 border border-accent/40 hover:bg-accent text-accent hover:text-accent-ink px-3 py-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Salva su Cloud</span>
        </button>
      )}
      <button type="button" onClick={handleReset} className="text-faint hover:text-negative flex items-center justify-center gap-1.5 py-1">
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Reset dati</span>
      </button>
    </div>
  );
};
