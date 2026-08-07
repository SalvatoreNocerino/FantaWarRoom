import React from 'react';
import { Settings, Sliders, Database, Users, ShieldAlert, Bot, RotateCcw, LogIn, LogOut, CloudCheck, Cloud } from 'lucide-react';
import { AppUser } from '../lib/supabase';

export type ActiveTab = 'league' | 'strategy' | 'database' | 'teams' | 'warroom' | 'copilot';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  myCredits: number;
  mySlotsNeeded: number;
  leagueName: string;
  onResetData: () => void;
  currentUser: AppUser | null;
  onLogin: () => void;
  onLogout: () => void;
  isCloudSyncing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  myCredits,
  mySlotsNeeded,
  leagueName,
  onResetData,
  currentUser,
  onLogin,
  onLogout,
  isCloudSyncing = false,
}) => {
  const tabs: { id: ActiveTab; label: string; icon: any; num: string }[] = [
    { id: 'league', label: '1. Lega & Regole', icon: Settings, num: '1' },
    { id: 'strategy', label: '2. Strategia Pre-Asta', icon: Sliders, num: '2' },
    { id: 'database', label: '3. Listone Serie A', icon: Database, num: '3' },
    { id: 'teams', label: '4. Squadre della Lega', icon: Users, num: '4' },
    { id: 'warroom', label: '5. Console Live', icon: ShieldAlert, num: '5' },
    { id: 'copilot', label: '6. AI Copilot', icon: Bot, num: '6' },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand Header & Quick Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center font-black text-slate-950 text-base shadow-lg shadow-emerald-600/30">
              WR
            </div>
            <div>
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center space-x-2">
                <span>FantaWarRoom 2026</span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded">
                  PRO
                </span>
              </h1>
              <span className="text-xs text-slate-400 block truncate max-w-[180px]">
                {leagueName}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:hidden">
            {currentUser ? (
              <div className="flex items-center space-x-1.5 bg-slate-950 border border-emerald-500/30 px-2 py-1 rounded-lg text-xs">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="Avatar" className="w-4 h-4 rounded-full" />
                ) : (
                  <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <button onClick={onLogout} className="text-slate-400 hover:text-red-400" title="Logout">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded-lg text-xs flex items-center space-x-1"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Accedi</span>
              </button>
            )}

            <button
              onClick={() => {
                if (confirm('Sei sicuro di voler azzerare tutti i dati salvati e l\'asta live?')) {
                  onResetData();
                }
              }}
              className="text-slate-400 hover:text-red-400 p-2 text-xs flex items-center space-x-1"
              title="Reset dati"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-105'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Auth & Live Roster Status Indicator */}
        <div className="hidden lg:flex items-center space-x-3 text-xs bg-slate-950 border border-slate-800 px-3.5 py-1.5 rounded-xl font-mono">
          {/* Cloud Firebase Auth Badge */}
          {currentUser ? (
            <div className="flex items-center space-x-2 border-r border-slate-800 pr-3">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="User" className="w-5 h-5 rounded-full border border-emerald-500" />
              ) : (
                <CloudCheck className="w-4 h-4 text-emerald-400" />
              )}
              <div className="text-left">
                <span className="text-[10px] text-emerald-400 font-sans block truncate max-w-[90px]">
                  {currentUser.displayName || 'Utente Cloud'}
                </span>
                <span className="text-[9px] text-slate-500 font-mono block">
                  {isCloudSyncing ? 'Syncing...' : 'Firestore OK'}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="text-slate-400 hover:text-red-400 p-1 transition-colors"
                title="Logout da Google / Cloud"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center space-x-1.5 bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600 text-emerald-300 hover:text-white px-2.5 py-1 rounded-lg text-xs font-sans transition-all"
              title="Accedi con Google per salvare il tuo fanta nel Cloud"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Salva su Cloud</span>
            </button>
          )}

          <div>
            <span className="text-slate-400 block text-[10px]">Crediti</span>
            <span className="text-amber-400 font-bold">{myCredits} FM</span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <span className="text-slate-400 block text-[10px]">Slot</span>
            <span className="text-cyan-400 font-bold">{mySlotsNeeded} liberi</span>
          </div>

          <button
            onClick={() => {
              if (confirm('Sei sicuro di voler azzerare tutti i dati dell\'asta e le impostazioni salvate?')) {
                onResetData();
              }
            }}
            className="ml-2 text-slate-500 hover:text-red-400 transition-colors p-1"
            title="Reset completo dell'asta"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

