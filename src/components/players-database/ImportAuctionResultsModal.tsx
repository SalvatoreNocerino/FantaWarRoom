import React, { useMemo, useState } from 'react';
import { Upload } from 'lucide-react';
import { Player, LeagueSettings } from '../../types';
import {
  parseRosterResultsXlsxBuffer,
  matchRosterResults,
  RosterResultsImportError,
  RosterResultRow,
} from '../../utils/rosterResultsImport';
import { Modal, Field, Select, Button, Alert, ConfirmDialog } from '../ui';

interface Props {
  allPlayers: Player[];
  league: LeagueSettings;
  onClose: () => void;
  onConfirm: (assignments: { playerId: string; boughtByTeam: string; cost: number }[]) => void;
}

// Carica un export delle rose reali (es. "Scarica rose" di FantaLab: blocchi
// di 3 colonne Nome/Costo/vuota per squadra) e lo trasforma in assegnazioni
// da usare come storico asta — pensato per correggere il listone quando
// l'asta è già stata condotta (es. fuori dall'app, o per riconciliare dopo
// un problema tecnico) invece di dover ri-assegnare ogni giocatore a mano.
export const ImportAuctionResultsModal: React.FC<Props> = ({ allPlayers, league, onClose, onConfirm }) => {
  const [rows, setRows] = useState<RosterResultRow[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [teamOverrides, setTeamOverrides] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const matchResult = useMemo(
    () => (rows ? matchRosterResults(rows, league.participants, allPlayers, teamOverrides) : null),
    [rows, league.participants, allPlayers, teamOverrides]
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permette di ricaricare lo stesso file una seconda volta
    if (!file) return;

    setParseError(null);
    setRows(null);
    setTeamOverrides({});

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = await parseRosterResultsXlsxBuffer(event.target?.result as ArrayBuffer);
        if (parsed.length === 0) {
          setParseError('Nessuna riga giocatore/costo trovata nel file.');
          return;
        }
        setRows(parsed);
      } catch (err) {
        setParseError(
          err instanceof RosterResultsImportError
            ? err.message
            : 'Errore nella lettura del file. Assicurati che sia un export Excel (.xlsx) valido.'
        );
      }
    };
    reader.onerror = () => setParseError('Impossibile leggere il file selezionato.');
    reader.readAsArrayBuffer(file);
  };

  const handleConfirm = () => {
    if (!matchResult) return;
    onConfirm(matchResult.matched.map((m) => ({ playerId: m.playerId, boughtByTeam: m.boughtByTeam, cost: m.row.cost })));
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Importa Risultati Asta" maxWidth="max-w-2xl">
      <div className="space-y-4 text-xs">
        <p className="text-muted leading-relaxed">
          Carica un file con le rose finali e i prezzi pagati (es. l'export "Scarica rose" di FantaLab): il listone
          verrà aggiornato con squadra e prezzo di ogni giocatore assegnato.
        </p>

        {!rows && (
          <label className="bg-surface-2 border border-accent/40 hover:border-accent text-accent font-bold px-4 py-3 rounded-xl flex items-center gap-2 cursor-pointer transition-colors w-fit">
            <Upload className="w-4 h-4" />
            <span>Seleziona File Rose (.xlsx)</span>
            <input type="file" accept=".xlsx" onChange={handleFileUpload} className="hidden" />
          </label>
        )}

        {parseError && <Alert tone="error">{parseError}</Alert>}

        {matchResult && (
          <div className="space-y-4">
            {matchResult.unmatchedTeams.length > 0 && (
              <div className="space-y-2">
                <div className="font-bold text-ink">Squadre non riconosciute — a chi assegnarle?</div>
                {matchResult.unmatchedTeams.map((teamName) => (
                  <Field key={teamName} label={teamName}>
                    <Select
                      value={teamOverrides[teamName] ?? ''}
                      onChange={(e) =>
                        setTeamOverrides((prev) => ({ ...prev, [teamName]: e.target.value }))
                      }
                    >
                      <option value="">Ignora questa squadra</option>
                      {league.participants.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ))}
              </div>
            )}

            <Alert tone={matchResult.matched.length > 0 ? 'success' : 'error'}>
              {matchResult.matched.length} assegnazioni pronte da importare.
            </Alert>

            {matchResult.ambiguous.length > 0 && (
              <details className="text-muted">
                <summary className="cursor-pointer font-bold text-ink">
                  {matchResult.ambiguous.length} nomi ambigui risolti automaticamente — verifica
                </summary>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  {matchResult.ambiguous.map((a, i) => (
                    <li key={i}>
                      "{a.row.playerName}" ({a.row.team}, {a.row.cost} crediti) → assegnato al giocatore più vicino per
                      quotazione tra {a.candidateCount} omonimi nel listone.
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {matchResult.unresolvedPlayers.length > 0 && (
              <details className="text-muted">
                <summary className="cursor-pointer font-bold text-ink">
                  {matchResult.unresolvedPlayers.length} giocatori non trovati nel listone — non importati
                </summary>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  {matchResult.unresolvedPlayers.map((u, i) => (
                    <li key={i}>
                      "{u.row.playerName}" ({u.boughtByTeam}, {u.row.cost} crediti)
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annulla
          </Button>
          {matchResult && (
            <Button type="button" onClick={() => setConfirmOpen(true)} disabled={matchResult.matched.length === 0}>
              Importa {matchResult.matched.length} Assegnazioni
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Sostituire lo storico asta?"
        message="Questo sostituirà TUTTE le assegnazioni attuali (chi ha comprato chi, a che prezzo) con quelle importate dal file. L'operazione non è reversibile. Continuare?"
        confirmLabel="Sostituisci"
        tone="destructive"
        onConfirm={() => {
          setConfirmOpen(false);
          handleConfirm();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </Modal>
  );
};
