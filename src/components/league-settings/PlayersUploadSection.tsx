import React, { useState } from 'react';
import { Player } from '../../types';
import { Upload, CheckCircle2, AlertTriangle } from 'lucide-react';
import { parsePlayersFileContent, parsePlayersXlsxBuffer, PlayersImportError } from '../../utils/playersImport';

interface Props {
  onImportPlayersList?: (customList: Player[]) => void;
}

export const PlayersUploadSection: React.FC<Props> = ({ onImportPlayersList }) => {
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; message: string } | null>(null);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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

    // Permette di ricaricare lo stesso file una seconda volta (altrimenti
    // l'evento onChange non si ripete se il path del file non cambia).
    e.target.value = '';
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
      <h2 className="text-lg font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
        <span className="w-6 h-6 rounded bg-emerald-950 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center">
          1.7
        </span>
        <span>Carica Listone Serie A (Excel / CSV / JSON)</span>
      </h2>

      <p className="text-slate-400 text-xs leading-relaxed">
        Carica il listone così come lo scarichi da Fantacalcio.it (.xlsx) o Fantapazz (.csv), senza doverlo
        modificare: le colonne vengono riconosciute automaticamente dai nomi delle intestazioni. Verrà usato come
        riferimento live durante l'asta e per i consigli dell'AI.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
        <label className="bg-slate-950 border border-emerald-500/40 hover:border-emerald-500 text-emerald-300 font-bold px-4 py-3 rounded-xl text-xs flex items-center space-x-2 cursor-pointer transition-colors w-full sm:w-auto justify-center">
          <Upload className="w-4 h-4" />
          <span>Seleziona File Listone</span>
          <input type="file" accept=".json,.csv,.xlsx" onChange={handleFileUpload} className="hidden" />
        </label>

        <span className="text-slate-500 text-xs">Formati supportati: .xlsx, .csv, .json</span>
      </div>

      {feedback && (
        <div
          className={`flex items-center space-x-2 text-xs p-3 rounded-xl border ${
            feedback.type === 'ok'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/60 border-red-500/40 text-red-200'
          }`}
        >
          {feedback.type === 'ok' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}
    </section>
  );
};
