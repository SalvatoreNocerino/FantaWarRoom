import React, { useState, useMemo } from 'react';
import { StrategySettings, Player, PlayerRole } from '../types';
import { Sliders, Save, CheckCircle2 } from 'lucide-react';
import { FormationSection } from './strategy-settings/FormationSection';
import { AggressivenessSection } from './strategy-settings/AggressivenessSection';
import { BudgetAllocationSection } from './strategy-settings/BudgetAllocationSection';
import { WishlistSection } from './strategy-settings/WishlistSection';
import { PreAuctionAiChat } from './strategy-settings/PreAuctionAiChat';

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
  const [playerSearchSelect, setPlayerSearchSelect] = useState('');

  const totalAllocationPct =
    formData.budgetAllocationPct.P +
    formData.budgetAllocationPct.D +
    formData.budgetAllocationPct.C +
    formData.budgetAllocationPct.A;
  const isAllocationValid = Math.abs(totalAllocationPct - 100) < 0.1;

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
      budgetAllocationPct: { P: 8, D: 15, C: 27, A: 50 },
    }));
  };

  const wishlistPlayers = useMemo(() => {
    return formData.wishlistIds
      .map((id) => allPlayers.find((p) => p.id === id))
      .filter((p): p is Player => p !== undefined);
  }, [formData.wishlistIds, allPlayers]);

  const wishlistNames = useMemo(
    () => wishlistPlayers.map((p) => `${p.name} (${p.role})`).join(', '),
    [wishlistPlayers]
  );

  const handleAddPlayerToWishlist = (playerId: string) => {
    if (!playerId) return;
    if (!formData.wishlistIds.includes(playerId)) {
      setFormData((prev) => ({ ...prev, wishlistIds: [...prev.wishlistIds, playerId] }));
    }
    setPlayerSearchSelect('');
  };

  const handleRemoveFromWishlist = (playerId: string) => {
    setFormData((prev) => ({
      ...prev,
      wishlistIds: prev.wishlistIds.filter((id) => id !== playerId),
    }));
  };

  return (
    <form onSubmit={handleSave} className="max-w-5xl mx-auto px-4 py-6 space-y-8 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2 text-cyan-400">
            <Sliders className="w-6 h-6" />
            <span>2. Strategia Pre-Asta & Target Budget</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Imposta il modulo base, lo stile di aggressività, la distribuzione del budget e seleziona i tuoi
            obiettivi wishlist.
          </p>
        </div>

        <button
          type="submit"
          disabled={!isAllocationValid}
          className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center space-x-2 transition-all shadow-lg shadow-cyan-600/30 shrink-0 self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Salva Strategia</span>
        </button>
      </div>

      {saveSuccessMsg && (
        <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-xl text-xs flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-bold">Strategia Pre-Asta salvata con successo!</span>
        </div>
      )}

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

      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <span className="w-6 h-6 rounded bg-cyan-950 text-cyan-400 font-mono text-xs font-bold flex items-center justify-center">
              2.4
            </span>
            <span>Wishlist Obiettivi Asta & Assistente AI Pre-Asta</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            2.4.1 Seleziona i giocatori obiettivo dal menu e ordinali per ruolo. 2.4.2 Chatta con l'AI per preparare
            la tua strategia pre-asta.
          </p>
        </div>

        <WishlistSection
          allPlayers={allPlayers}
          wishlistPlayers={wishlistPlayers}
          totalBudget={totalBudget}
          playerSearchSelect={playerSearchSelect}
          onAddPlayer={handleAddPlayerToWishlist}
          onRemovePlayer={handleRemoveFromWishlist}
        />

        <PreAuctionAiChat
          preferredFormation={formData.preferredFormation}
          aggressionScore={formData.aggressionScore}
          totalBudget={totalBudget}
          wishlistNames={wishlistNames}
        />
      </section>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={!isAllocationValid}
          className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl text-sm flex items-center space-x-2 transition-all shadow-xl shadow-cyan-600/30"
        >
          <Save className="w-5 h-5" />
          <span>Salva Strategia Pre-Asta</span>
        </button>
      </div>
    </form>
  );
};
