import React from 'react';
import { LeagueSettings, BonusRule } from '../../types';
import { Plus } from 'lucide-react';

interface Props {
  formData: LeagueSettings;
  setFormData: React.Dispatch<React.SetStateAction<LeagueSettings>>;
}

export const ScoringRulesSection: React.FC<Props> = ({ formData, setFormData }) => {
  const handleToggleBonus = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      bonusRules: prev.bonusRules.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b))
    }));
  };

  const handleUpdateBonusValue = (id: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      bonusRules: prev.bonusRules.map((b) => (b.id === id ? { ...b, value } : b))
    }));
  };

  const handleAddCustomBonus = () => {
    const newRule: BonusRule = {
      id: `rule_${Date.now()}`,
      name: 'Nuovo Bonus Personalizzato',
      value: 1,
      enabled: true,
      category: 'bonus'
    };
    setFormData((prev) => ({ ...prev, bonusRules: [...prev.bonusRules, newRule] }));
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <span className="w-6 h-6 rounded bg-emerald-950 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center">
            1.4
          </span>
          <span>Regole Calcolo Punteggio, Bonus e Modificatori</span>
        </h2>

        <button
          type="button"
          onClick={handleAddCustomBonus}
          className="text-emerald-400 hover:text-emerald-300 text-xs font-bold flex items-center space-x-1 bg-slate-950 px-3 py-1.5 rounded-lg border border-emerald-500/30"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nuovo Bonus</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        {formData.bonusRules.map((rule) => (
          <div
            key={rule.id}
            className={`p-3 rounded-xl border flex items-center justify-between ${
              rule.enabled
                ? 'bg-slate-950 border-slate-700 text-white'
                : 'bg-slate-950/40 border-slate-800/60 opacity-60 text-slate-400'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={() => handleToggleBonus(rule.id)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
              <span className="font-medium truncate max-w-[140px]">{rule.name}</span>
            </div>

            <div className="flex items-center space-x-1 font-mono">
              <input
                type="number"
                step="0.5"
                value={rule.value}
                onChange={(e) => handleUpdateBonusValue(rule.id, Number(e.target.value))}
                className={`w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-bold ${
                  rule.value >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              />
              <span className="text-slate-500 text-[10px]">pt</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="defModFlag"
            checked={formData.defensiveModifier.enabled}
            onChange={(e) =>
              setFormData({
                ...formData,
                defensiveModifier: { enabled: e.target.checked }
              })
            }
            className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
          />
          <label htmlFor="defModFlag" className="font-bold text-white cursor-pointer">
            1.4.2 Modificatore di Difesa ATTIVO
          </label>
        </div>
      </div>

      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="midModFlag"
            checked={formData.midfieldModifier.enabled}
            onChange={(e) =>
              setFormData({
                ...formData,
                midfieldModifier: { enabled: e.target.checked }
              })
            }
            className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
          />
          <label htmlFor="midModFlag" className="font-bold text-white cursor-pointer">
            1.4.3 Modificatore di Centrocampo ATTIVO
          </label>
        </div>
      </div>
    </section>
  );
};
