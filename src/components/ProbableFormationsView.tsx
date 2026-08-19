import React, { useMemo, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { PageHeader, Card, SectionHeader, Badge, RoleBadge } from './ui';
import { PROBABLE_FORMATIONS } from '../data/probableFormations';

/** Sezione editoriale statica (non collegata all'asta): probabile formazione
 * di ogni squadra di Serie A per la stagione 2026/27, con allenatore, modulo,
 * titolari/panchina, ballottaggi e previsioni sui nuovi acquisti. I dati
 * sono un contenuto redazionale aggiornato a inizio stagione — vedi
 * src/data/probableFormations.ts — non derivano dal listone o dall'asta. */
export const ProbableFormationsView: React.FC = () => {
  const teams = PROBABLE_FORMATIONS;
  const [selectedTeam, setSelectedTeam] = useState(teams[0]?.team ?? '');
  const team = useMemo(
    () => teams.find((t) => t.team === selectedTeam) ?? teams[0],
    [teams, selectedTeam]
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 text-ink">
      <PageHeader
        icon={ClipboardList}
        title="Probabili Formazioni 2026/27"
        subtitle="Allenatore, modulo, titolari, ballottaggi e nuovi acquisti per le 20 squadre di Serie A. Contenuto editoriale aggiornato a inizio stagione: le gerarchie possono cambiare con il campionato in corso."
      />

      <div className="flex flex-wrap gap-2">
        {teams.map((t) => (
          <button
            key={t.team}
            type="button"
            onClick={() => setSelectedTeam(t.team)}
            className={`h-8 px-3 rounded-lg border text-xs font-bold transition-colors ${
              t.team === team?.team
                ? 'bg-accent/15 border-accent text-accent'
                : 'bg-transparent border-border-strong text-muted hover:text-ink-soft'
            }`}
          >
            {t.team}
          </button>
        ))}
      </div>

      {team && (
        <div className="space-y-6">
          <Card className="p-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-ink">{team.team}</h2>
                <p className="text-sm text-muted mt-0.5">
                  Allenatore: <span className="text-ink-soft font-semibold">{team.allenatore}</span>
                </p>
              </div>
              <Badge tone="accent" variant="outline">
                {team.modulo}
              </Badge>
            </div>
            <p className="text-sm text-ink-soft leading-relaxed">{team.commentoGenerale}</p>
          </Card>

          <Card className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <SectionHeader title="Titolari" />
                <div className="space-y-1.5">
                  {team.titolari.map((p, i) => (
                    <div key={i} className="flex items-center gap-2.5 bg-surface-2 rounded-lg px-3 py-2">
                      <RoleBadge role={p.ruolo} size="sm" />
                      <span className="text-sm font-semibold text-ink truncate">{p.nome}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <SectionHeader title="Panchina" />
                <div className="space-y-1.5">
                  {team.panchina.map((p, i) => (
                    <div key={i} className="flex items-center gap-2.5 bg-surface-2/60 rounded-lg px-3 py-2">
                      <RoleBadge role={p.ruolo} size="sm" dimmed />
                      <span className="text-sm text-ink-soft truncate">{p.nome}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <SectionHeader title="Ballottaggi" />
            {team.ballottaggi.length === 0 && (
              <p className="text-xs text-muted">Nessun ballottaggio rilevante: gerarchie abbastanza definite.</p>
            )}
            {team.ballottaggi.map((b, i) => (
              <div key={i} className="space-y-1 border-b border-border-soft last:border-0 pb-3 last:pb-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge tone="warning" size="sm">
                    {b.ruolo}
                  </Badge>
                  <span className="text-sm font-semibold text-ink">{b.candidati.join(' vs ')}</span>
                </div>
                <p className="text-xs text-muted">{b.nota}</p>
              </div>
            ))}
          </Card>

          <Card className="p-6 space-y-4">
            <SectionHeader title="Nuovi acquisti e previsioni" />
            {team.nuoviAcquisti.length === 0 && (
              <p className="text-xs text-muted">Nessun colpo di mercato di rilievo fantacalcistico.</p>
            )}
            {team.nuoviAcquisti.map((n, i) => (
              <div key={i} className="space-y-1 border-b border-border-soft last:border-0 pb-3 last:pb-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-ink">{n.nome}</span>
                  <span className="text-[11px] text-muted">da {n.provenienza}</span>
                </div>
                <p className="text-xs text-ink-soft leading-relaxed">{n.commento}</p>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
};
