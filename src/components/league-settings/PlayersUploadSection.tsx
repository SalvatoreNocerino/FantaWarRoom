import React, { useState } from 'react';
import { Player } from '../../types';
import { Upload, Download } from 'lucide-react';
import { parsePlayersFileContent, parsePlayersXlsxBuffer, PlayersImportError } from '../../utils/playersImport';
import { FANTACALCIO_IT_LISTONE } from '../../data/presetListoni/fantacalcioIt';
import { Card, SectionHeader, Alert, Select, Button, ConfirmDialog } from '../ui';

interface Props {
  onImportPlayersList?: (customList: Player[]) => void;
}

type Source = 'fantacalcio' | 'fantateam' | 'fantalab' | 'custom';

const CONFIRM_MESSAGE =
  'Questo sostituirà il listone attualmente in uso (e i giocatori aggiunti a mano) con quello selezionato. Continuare?';

export const PlayersUploadSection: React.FC<Props> = ({ onImportPlayersList }) => {
  const [source, setSource] = useState<Source>('fantacalcio');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; message: string } | null>(null);
  // Azione rimandata in attesa di conferma nel ConfirmDialog — sostituisce
  // window.confirm(), che qui bloccherebbe la lettura del file.
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const applyImport = (imported: Player[]) => {
    if (imported.length > 0 && onImportPlayersList) {
      onImportPlayersList(imported);
      setFeedback({ type: 'ok', message: `Listone caricato con successo! Importati ${imported.length} giocatori.` });
    } else {
      setFeedback({
        type: 'error',
        message: 'Nessun giocatore valido trovato nel file. Verifica che ci siano colonne per Ruolo, Nome, Squadra e Quotazione.',
      });
    }
  };

  const runFileImport = (file: File) => {
    setFeedback(null);

    const isXlsx = /\.xlsx$/i.test(file.name);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const imported = isXlsx
          ? await parsePlayersXlsxBuffer(event.target?.result as ArrayBuffer)
          : parsePlayersFileContent(event.target?.result as string, file.name);
        applyImport(imported);
      } catch (err) {
        const message =
          err instanceof PlayersImportError
            ? err.message
            : 'Errore nella lettura del file. Assicurati che sia un formato JSON, CSV o Excel (.xlsx) valido.';
        setFeedback({ type: 'error', message });
      }
    };

    reader.onerror = () => {
      setFeedback({ type: 'error', message: 'Impossibile leggere il file selezionato.' });
    };

    if (isXlsx) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleLoadPreset = () => {
    setPendingAction(() => () => applyImport(FANTACALCIO_IT_LISTONE));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Permette di ricaricare lo stesso file una seconda volta (altrimenti
    // l'evento onChange non si ripete se il path del file non cambia).
    e.target.value = '';
    if (!file) return;
    setPendingAction(() => () => runFileImport(file));
  };

  return (
    <Card className="p-6 space-y-4">
      <SectionHeader number="1.5" title="Listone Serie A" />

      <p className="text-muted text-xs leading-relaxed">
        Scegli il listone da usare come riferimento live durante l'asta: un provider precaricato, oppure carica un
        tuo file (Excel / CSV / JSON) — le colonne vengono riconosciute automaticamente dai nomi delle intestazioni.
      </p>

      <Select value={source} onChange={(e) => { setSource(e.target.value as Source); setFeedback(null); }} className="text-xs max-w-xs">
        <option value="fantacalcio">Fantacalcio.it</option>
        <option value="fantateam" disabled>
          FantaTeam (presto disponibile)
        </option>
        <option value="fantalab" disabled>
          FantaLab (presto disponibile)
        </option>
        <option value="custom">Lista propria</option>
      </Select>

      {source === 'fantacalcio' && (
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
          <Button onClick={handleLoadPreset} className="w-full sm:w-auto">
            <Download className="w-4 h-4" />
            <span>Carica Listone Fantacalcio.it</span>
          </Button>
          <span className="text-faint text-xs">{FANTACALCIO_IT_LISTONE.length} giocatori — quotazioni ufficiali</span>
        </div>
      )}

      {source === 'custom' && (
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
          <label className="bg-surface-2 border border-accent/40 hover:border-accent text-accent font-bold px-4 py-3 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-colors w-full sm:w-auto justify-center">
            <Upload className="w-4 h-4" />
            <span>Seleziona File Listone</span>
            <input type="file" accept=".json,.csv,.xlsx" onChange={handleFileUpload} className="hidden" />
          </label>

          <span className="text-faint text-xs">Formati supportati: .xlsx, .csv, .json</span>
        </div>
      )}

      {feedback && <Alert tone={feedback.type === 'ok' ? 'success' : 'error'}>{feedback.message}</Alert>}

      <ConfirmDialog
        open={pendingAction !== null}
        title="Sostituire il listone attivo?"
        message={CONFIRM_MESSAGE}
        confirmLabel="Sostituisci"
        tone="destructive"
        onConfirm={() => {
          pendingAction?.();
          setPendingAction(null);
        }}
        onCancel={() => setPendingAction(null)}
      />
    </Card>
  );
};
