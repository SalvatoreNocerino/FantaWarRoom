import React, { useState, useMemo } from 'react';
import { StrategySettings, Player, PlayerRole } from '../types';
import { Sliders, Save } from 'lucide-react';
import { FormationSection } from './strategy-settings/FormationSection';
import { AggressivenessSection } from './strategy-settings/AggressivenessSection';
import { BudgetAllocationSection } from './strategy-settings/BudgetAllocationSection';
import { WishlistSection, WISHLIST_MAX } from './strategy-settings/WishlistSection';
import { PageHeader, Button, Alert, Card, SectionHeader } from './ui';

interface StrategySettingsViewProps {
  strategy: StrategySettings;
  allPlayers: Player[];
  totalBudget: number;
  selectableFormations?: string[];
  onSaveStrategy: (updatedStrategy: StrategySettings) => void;
}

// Orchestratore: possiede solo formData e il submit. Ogni sezione numerata
// (2.1-2.4) vive nel proprio file sotto ./strategy-settings/.
export const StrategySettingsView: React.FC<StrategySettingsViewProps> = ({
  strategy,
  allPlayers,
  totalBudget,
  selectableFormations = ['3-4-3', '3-5-2', '4-3-3', '4-4-2', '4-5-1', '5-3-2', '5-4-1', '3-6-1', '6-3-1'],
  onSaveStrategy,
}) => {
  const [formData, setFormData] = useState<StrategySettings>({ ...strategy });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const totalAllocationPct =
    formData.budgetAllocationPct.P +
    formData.budgetAllocationPct.D +
    formData.budgetAllocationPct.C +
    formData.budgetAllocationPct.A;
  const isAllocationValid = Math.abs(totalAllocationPct - 100) < 0.25;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllocationValid) {
      alert('La somma delle percentuali di budget per ruolo deve essere esattamente pari al 100%.');
      return;
    }
    onSaveStrategy(formData);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  const autoBalanceAllocation = () => {
    setFormData((prev) => ({
      ...prev,
      budgetAllocationPct: { P: 8, D: 17, C: 25, A: 50 },
    }));
  };

  const wishlistPlayers = useMemo(() => {
    return formData.wishlistIds
      .map((id) => allPlayers.find((p) => p.id === id))
      .filter((p): p is Player => p !== undefined);
  }, [formData.wishlistIds, allPlayers]);

  const handleAddPlayerToWishlist = (playerId: string) => {
    if (!playerId) return;
    if (!formData.wishlistIds.includes(playerId) && formData.wishlistIds.length < WISHLIST_MAX) {
      setFormData((prev) => ({ ...prev, wishlistIds: [...prev.wishlistIds, playerId] }));
    }
  };

  const handleRemoveFromWishlist = (playerId: string) => {
    setFormData((prev) => ({
      ...prev,
      wishlistIds: prev.wishlistIds.filter((id) => id !== playerId),
    }));
  };

  return (
    <form onSubmit={handleSave} className="max-w-5xl mx-auto px-4 py-6 space-y-8 text-ink">
      <PageHeader
        icon={Sliders}
        title="2. Strategia Pre-Asta & Target Budget"
        subtitle="Imposta il modulo base, lo stile di aggressività, la distribuzione del budget e seleziona i tuoi obiettivi wishlist."
        action={
          <Button type="submit" disabled={!isAllocationValid}>
            <Save className="w-4 h-4" />
            <span>Salva Strategia</span>
          </Button>
        }
      />

      {saveSuccessMsg && <Alert tone="success">Strategia Pre-Asta salvata con successo!</Alert>}

      <FormationSection
        preferredFormation={formData.preferredFormation}
        selectableFormations={selectableFormations}
        onChange={(preferredFormation) => setFormData({ ...formData, preferredFormation })}
      />

      <AggressivenessSection
        aggressionScore={formData.aggressionScore}
        onChange={(aggressionScore) => setFormData({ ...formData, aggressionScore })}
      />

      <BudgetAllocationSection
        budgetAllocationPct={formData.budgetAllocationPct}
        totalBudget={totalBudget}
        onChangeRole={(role: PlayerRole, pct) =>
          setFormData({
            ...formData,
            budgetAllocationPct: { ...formData.budgetAllocationPct, [role]: pct },
          })
        }
        onAutoBalance={autoBalanceAllocation}
      />

      <Card className="p-6 space-y-6">
        <div>
          <SectionHeader number="2.4" title="Wishlist Obiettivi Asta" className="border-b-0 pb-0" />
          <p className="text-muted text-xs mt-1">Seleziona i giocatori obiettivo dal menu e ordinali per ruolo.</p>
        </div>

        <WishlistSection
          allPlayers={allPlayers}
          wishlistPlayers={wishlistPlayers}
          totalBudget={totalBudget}
          onAddPlayer={handleAddPlayerToWishlist}
          onRemovePlayer={handleRemoveFromWishlist}
        />
      </Card>

      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={!isAllocationValid} size="lg">
          <Save className="w-5 h-5" />
          <span>Salva Strategia Pre-Asta</span>
        </Button>
      </div>
    </form>
  );
};
