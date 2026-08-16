import React, { useEffect, useState } from 'react';
import { LeagueSettings } from '../../types';
import { Card, SectionHeader, Field, Input, Checkbox } from '../ui';

interface Props {
  formData: LeagueSettings;
  setFormData: React.Dispatch<React.SetStateAction<LeagueSettings>>;
}

const MIN_TEAMS = 2;
const MAX_TEAMS = 20;

export const GeneralInfoSection: React.FC<Props> = ({ formData, setFormData }) => {
  // Stato locale "in bozza" per il numero di squadre: non applichiamo il
  // resize di participants ad ogni tasto premuto (altrimenti il valore
  // controllato si riscrive sotto le dita mentre l'utente digita, come nel
  // bug corretto in precedenza), solo al blur / Invio.
  const [numTeamsDraft, setNumTeamsDraft] = useState(String(formData.participants.length));

  useEffect(() => {
    setNumTeamsDraft(String(formData.participants.length));
  }, [formData.participants.length]);

  const commitNumTeams = () => {
    const parsed = Math.round(Number(numTeamsDraft));
    const n = Number.isFinite(parsed) ? Math.max(MIN_TEAMS, Math.min(MAX_TEAMS, parsed)) : formData.participants.length;

    if (n === formData.participants.length) {
      setNumTeamsDraft(String(formData.participants.length));
      return;
    }

    setFormData((prev) => {
      const current = prev.participants;
      if (n > current.length) {
        const added = Array.from({ length: n - current.length }, (_, i) => ({
          name: `Squadra ${current.length + i + 1}`,
          isMyTeam: false,
          initialBudget: prev.totalBudget,
        }));
        return { ...prev, numTeams: n, participants: [...current, ...added] };
      }
      const truncated = current.slice(0, n);
      if (!truncated.some((p) => p.isMyTeam) && truncated.length > 0) {
        truncated[0] = { ...truncated[0], isMyTeam: true };
      }
      return { ...prev, numTeams: n, participants: truncated };
    });
  };

  return (
    <Card className="p-6 space-y-5">
      <SectionHeader number="1.1" title="Informazioni Generali Lega" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <Field number="1.1.1" label="Nome della Lega">
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </Field>

        <Field number="1.1.2" label="Numero Partecipanti" hint="Aggiunge/rimuove squadre generiche; puoi anche gestirle a mano qui sotto in 1.3.">
          <Input
            type="number"
            variant="mono"
            min={MIN_TEAMS}
            max={MAX_TEAMS}
            value={numTeamsDraft}
            onChange={(e) => setNumTeamsDraft(e.target.value)}
            onBlur={commitNumTeams}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
          />
        </Field>

        <Field number="1.1.3" label="Budget Iniziale di Base (FM)">
          <Input
            type="number"
            variant="money"
            value={formData.totalBudget}
            onChange={(e) => setFormData({ ...formData, totalBudget: Number(e.target.value) })}
            required
          />
        </Field>
      </div>

      <Checkbox
        id="equalCreditsFlag"
        title={
          <span className="inline-flex items-center gap-1.5">
            <span className="rounded bg-accent/15 text-accent font-mono text-[10px] font-bold px-1 shrink-0">1.1.4</span>
            Tutte le squadre partono con gli stessi crediti
          </span>
        }
        description="Disattiva per personalizzare il budget iniziale per ogni fantallenatore (es. penalizzazioni o riconferme)."
        checked={formData.equalInitialCredits}
        onChange={(e) => setFormData({ ...formData, equalInitialCredits: e.target.checked })}
      />
    </Card>
  );
};
