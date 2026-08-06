import React from 'react';
import { Player } from '../../types';
import { Bot, Power, Sparkles, Zap, TrendingUp, ShieldAlert } from 'lucide-react';

interface Recommendation {
  maxBid: number;
  reasoning: string;
}

interface Props {
  aiEnabled: boolean;
  setAiEnabled: (enabled: boolean) => void;
  recommendation: Recommendation | null;
  activePlayer: Player | null;
  bidPrice: number;
  setBidPrice: (price: number) => void;
  handleAddBid: (amount: number) => void;
  showToast: (msg: string) => void;
  onOpenCopilotWithPlayer: (player: Player) => void;
}

export const AiRecommendationPanel: React.FC<Props> = ({
  aiEnabled,
  setAiEnabled,
  recommendation,
  activePlayer,
  bidPrice,
  setBidPrice,
  handleAddBid,
  showToast,
  onOpenCopilotWithPlayer
}) => {
  return (
    <div className="bg-slate-900 border-2 border-purple-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-bold text-purple-200">Copilota AI Studio Live (Suggerimenti Tattici)</h3>
        </div>

        <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-slate-400 text-xs font-semibold">Stato AI:</span>
          <button
            type="button"
            onClick={() => setAiEnabled(!aiEnabled)}
            className={`px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center space-x-1 ${
              aiEnabled ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Power className="w-3 h-3" />
            <span>{aiEnabled ? 'ATTIVO' : 'DISATTIVATO'}</span>
          </button>
        </div>
      </div>

      {aiEnabled ? (
        recommendation ? (
          <div className="space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950 p-3 rounded-xl border border-purple-500/30">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-slate-200 font-semibold">
                  Analisi AI per <strong className="text-white">{activePlayer?.name}</strong>:
                </span>
              </div>

              <div className="font-mono text-amber-400 font-black text-sm">Max Suggerito: {recommendation.maxBid} FM</div>
            </div>

            <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              {recommendation.reasoning}
            </p>

            <div className="pt-1">
              <span className="text-slate-400 text-[10px] block uppercase font-mono mb-1.5 font-bold">
                ⚡ Azioni Rapide One-Tap Copilota AI
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBidPrice(recommendation.maxBid);
                    showToast(`⚡ Offerta impostata al Max Consigliato AI: ${recommendation.maxBid} FM!`);
                  }}
                  className="bg-purple-950/80 hover:bg-purple-900 border border-purple-500/60 text-purple-200 font-bold py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 active:scale-95 transition-all text-xs"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Imposta Max ({recommendation.maxBid} FM)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleAddBid(1);
                    showToast(`📈 Rilancio +1 FM applicato! (${bidPrice + 1} FM)`);
                  }}
                  className="bg-slate-950 hover:bg-slate-800 border border-slate-700 text-emerald-300 font-bold py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 active:scale-95 transition-all text-xs"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Rilancia +1 FM</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBidPrice(Math.max(1, activePlayer?.basePrice || 1));
                    showToast(`🛑 Asta abbandonata / Reset a quota base.`);
                  }}
                  className="bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 active:scale-95 transition-all text-xs"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                  <span>Passa / Reset Base</span>
                </button>

                {activePlayer && (
                  <button
                    type="button"
                    onClick={() => onOpenCopilotWithPlayer(activePlayer)}
                    className="bg-slate-950 hover:bg-purple-950/60 border border-purple-500/40 text-purple-300 font-bold py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 active:scale-95 transition-all text-xs"
                  >
                    <Bot className="w-3.5 h-3.5 text-purple-400" />
                    <span>Approfondisci in Chat</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-slate-400 text-xs py-2">
            Seleziona un calciatore dal listone per ricevere i consigli in tempo reale dal Copilota AI.
          </div>
        )
      ) : (
        <div className="text-slate-500 text-xs py-2 italic">
          Copilota AI disattivato. Clicca su "ATTIVO" per riattivare i suggerimenti automatici durante l'asta.
        </div>
      )}
    </div>
  );
};
