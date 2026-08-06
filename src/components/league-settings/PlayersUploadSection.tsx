import React from 'react';
import { Player } from '../../types';
import { Upload } from 'lucide-react';
import { parsePlayersFileContent } from '../../utils/playersImport';

interface Props {
  onImportPlayersList?: (customList: Player[]) => void;
}

export const PlayersUploadSection: React.FC<Props> = ({ onImportPlayersList }) => {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = parsePlayersFileContent(text, file.name);

        if (imported.length > 0 && onImportPlayersList) {
          onImportPlayersList(imported);
          alert(`Listone caricato con successo! Importati ${imported.length} giocatori.`);
        } else {
          alert('Nessun giocatore valido trovato nel file. Verifica le colonne (Nome, Ruolo, Squadra, Quotazione).');
        }
      } catch (err) {
        alert('Errore nella lettura del file. Assicurati che sia un formato JSON o CSV valido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
      <h2 className="text-lg font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
        <span className="w-6 h-6 rounded bg-emerald-950 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center">
          1.7
        </span>
        <span>Carica Listone Serie A Personalizzato (CSV / JSON)</span>
      </h2>

      <p className="text-slate-400 text-xs leading-relaxed">
        Puoi caricare il tuo listone ufficiale in formato JSON o CSV (es. esportato da Fantacalcio o Excel) contenente
        i calciatori della Serie A. Verrà usato come riferimento live durante l'asta e per i consigli dell'AI.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
        <label className="bg-slate-950 border border-emerald-500/40 hover:border-emerald-500 text-emerald-300 font-bold px-4 py-3 rounded-xl text-xs flex items-center space-x-2 cursor-pointer transition-colors w-full sm:w-auto justify-center">
          <Upload className="w-4 h-4" />
          <span>Seleziona File Listone (.json o .csv)</span>
          <input type="file" accept=".json,.csv" onChange={handleFileUpload} className="hidden" />
        </label>

        <span className="text-slate-500 text-xs">
          Format supportati: JSON array di calciatori oppure CSV con colonne (Nome, Ruolo, Squadra, Quotazione).
        </span>
      </div>
    </section>
  );
};
