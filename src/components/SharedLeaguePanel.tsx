import React, { useState } from 'react';
import { Users, Copy, Check, LogOut, Search } from 'lucide-react';
import { Card, Button, Input, Alert, ConfirmDialog } from './ui';
import { LeagueSettings } from '../types';
import { previewLeagueByCode, LeaguePreview } from '../lib/supabase';

interface Props {
  isSharedMode: boolean;
  isLeagueAdmin: boolean;
  inviteCode: string | null;
  league: LeagueSettings;
  myTeamName: string;
  onCreate: () => Promise<boolean>;
  onJoin: (leagueId: string, participantIndex: number) => Promise<{ ok: boolean; message?: string }>;
  onLeave: () => Promise<void>;
}

// Pannello per passare dalla modalità solo (privata) a una lega condivisa
// multi-utente — vedi supabase/migrations/004_add_shared_leagues.sql. Vive
// in cima a Impostazioni, visibile indipendentemente dal tab Lega/Strategia.
export const SharedLeaguePanel: React.FC<Props> = ({
  isSharedMode,
  isLeagueAdmin,
  inviteCode,
  league,
  myTeamName,
  onCreate,
  onJoin,
  onLeave,
}) => {
  const [mode, setMode] = useState<'idle' | 'creating' | 'joining'>('idle');
  const [codeInput, setCodeInput] = useState('');
  const [preview, setPreview] = useState<LeaguePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmingLeave, setConfirmingLeave] = useState(false);

  const handleSearchCode = async () => {
    if (!codeInput.trim()) return;
    setBusy(true);
    setError(null);
    const result = await previewLeagueByCode(codeInput);
    setBusy(false);
    if (!result) {
      setError('Nessuna lega trovata con questo codice. Controlla e riprova.');
      return;
    }
    setPreview(result);
  };

  const handlePickSlot = async (index: number) => {
    if (!preview) return;
    setBusy(true);
    setError(null);
    const result = await onJoin(preview.id, index);
    setBusy(false);
    if (!result.ok) {
      setError(result.message || 'Impossibile iscriversi.');
      return;
    }
    setMode('idle');
    setPreview(null);
    setCodeInput('');
  };

  const handleCreate = async () => {
    setBusy(true);
    const ok = await onCreate();
    setBusy(false);
    if (ok) setMode('idle');
    else setError('Impossibile creare la lega condivisa. Riprova.');
  };

  const handleCopyCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isSharedMode) {
    return (
      <Card className="p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-ink truncate">
              Lega Condivisa {isLeagueAdmin ? '· sei admin' : `· ${myTeamName}`}
            </div>
            {isLeagueAdmin && inviteCode && (
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-[11px] text-muted hover:text-accent flex items-center gap-1 font-mono"
                title="Copia codice invito"
              >
                Codice: <span className="text-accent font-bold">{inviteCode}</span>
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setConfirmingLeave(true)} className="shrink-0">
          <LogOut className="w-3.5 h-3.5" />
          <span>Lascia la Lega</span>
        </Button>

        <ConfirmDialog
          open={confirmingLeave}
          title="Lasciare la lega condivisa?"
          message="Tornerai alla modalità solo con i tuoi dati privati. La lega resta attiva per gli altri membri."
          confirmLabel="Lascia"
          tone="destructive"
          onConfirm={() => {
            setConfirmingLeave(false);
            onLeave();
          }}
          onCancel={() => setConfirmingLeave(false)}
        />
      </Card>
    );
  }

  if (mode === 'idle') {
    return (
      <Card className="p-4 mb-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-surface-2 text-muted flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="text-xs text-muted">
            Modalità solo (privata). Crea una lega condivisa o iscriviti con un codice per giocare con i tuoi amici.
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={() => setMode('joining')}>
            Unisciti con Codice
          </Button>
          <Button size="sm" onClick={() => setMode('creating')}>
            Crea Lega Condivisa
          </Button>
        </div>
      </Card>
    );
  }

  if (mode === 'creating') {
    return (
      <Card className="p-4 mb-4 space-y-3">
        <p className="text-xs text-ink-soft">
          Trasformi "{league.name}" in una lega condivisa: le regole e il listone restano quelli attuali, i tuoi amici
          si iscrivono con un codice e reclamano il proprio slot squadra.
        </p>
        {error && <Alert tone="error">{error}</Alert>}
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setMode('idle')} disabled={busy}>
            Annulla
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={busy}>
            {busy ? 'Creazione...' : 'Conferma'}
          </Button>
        </div>
      </Card>
    );
  }

  // mode === 'joining'
  return (
    <Card className="p-4 mb-4 space-y-3">
      {!preview ? (
        <>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Codice invito (es. AB12CD)"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              className="uppercase tracking-wider"
            />
            <Button size="sm" onClick={handleSearchCode} disabled={busy}>
              <Search className="w-3.5 h-3.5" />
              <span>Cerca</span>
            </Button>
          </div>
          {error && <Alert tone="error">{error}</Alert>}
          <Button variant="ghost" size="sm" onClick={() => setMode('idle')}>
            Annulla
          </Button>
        </>
      ) : (
        <>
          <p className="text-xs text-ink-soft">
            <strong className="text-ink">{preview.name}</strong> — scegli quale squadra è la tua:
          </p>
          {error && <Alert tone="error">{error}</Alert>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {preview.league.participants.map((p, idx) => {
              const claimed = preview.claimedIndexes.includes(idx);
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={claimed || busy}
                  onClick={() => handlePickSlot(idx)}
                  className={`text-left px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                    claimed
                      ? 'bg-surface-2 border-border text-faint cursor-not-allowed'
                      : 'bg-surface-2 border-border-strong text-ink-soft hover:border-accent hover:text-accent'
                  }`}
                >
                  {p.name}
                  {claimed && <span className="block text-[10px] font-normal">già presa</span>}
                </button>
              );
            })}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPreview(null);
              setMode('idle');
            }}
          >
            Annulla
          </Button>
        </>
      )}
    </Card>
  );
};
