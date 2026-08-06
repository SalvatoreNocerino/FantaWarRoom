import React, { useState } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';

interface PreAuctionAiChatProps {
  preferredFormation: string;
  aggressionScore: number;
  totalBudget: number;
  wishlistNames: string;
}

export const PreAuctionAiChat: React.FC<PreAuctionAiChatProps> = ({
  preferredFormation,
  aggressionScore,
  totalBudget,
  wishlistNames,
}) => {
  const [aiChatMessages, setAiChatMessages] = useState<
    { sender: 'user' | 'ai'; text: string; timestamp: number }[]
  >([
    {
      sender: 'ai',
      text: `Benvenuto nella pianificazione Pre-Asta! Sono il tuo consulente strategico AI.
Posso suggerirti obiettivi per la wishlist in base al tuo modulo di riferimento (${preferredFormation}) e ai budget per ruolo. Chiedimi un consiglio sugli scommesse a 1 FM o sui top di reparto!`,
      timestamp: Date.now(),
    },
  ]);
  const [aiInputPrompt, setAiInputPrompt] = useState('');
  const [aiIsLoading, setAiIsLoading] = useState(false);

  const handleSendAiChatMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || aiInputPrompt;
    if (!promptToSend.trim() || aiIsLoading) return;

    const userMsg = { sender: 'user' as const, text: promptToSend, timestamp: Date.now() };
    setAiChatMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setAiInputPrompt('');
    setAiIsLoading(true);

    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `[PIANIFICAZIONE PRE-ASTA STRATEGIA] ${promptToSend}`,
          context: {
            preferredFormation,
            aggressionScore,
            totalBudget,
            wishlist: wishlistNames || 'Nessun giocatore in wishlist',
          },
        }),
      });

      const data = await response.json();
      setAiChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: data.reply || 'Consiglio strategico generato.', timestamp: Date.now() },
      ]);
    } catch (err: any) {
      setAiChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: `Errore di connessione con l'AI: ${err.message || 'Riprova'}.`, timestamp: Date.now() },
      ]);
    } finally {
      setAiIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-bold text-purple-300 flex items-center space-x-2 border-b border-slate-800 pb-2">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <span>2.4.2 Consulente AI Pre-Asta & Strategia Obiettivi</span>
      </h3>

      <div className="h-48 overflow-y-auto space-y-3 p-2 bg-slate-900/60 rounded-lg border border-slate-800 text-xs">
        {aiChatMessages.map((msg, i) => (
          <div
            key={i}
            className={`p-2.5 rounded-xl leading-relaxed whitespace-pre-wrap ${
              msg.sender === 'user'
                ? 'bg-cyan-600 text-white ml-auto max-w-[80%]'
                : 'bg-slate-950 border border-slate-800 text-slate-200 max-w-[90%]'
            }`}
          >
            {msg.text}
          </div>
        ))}

        {aiIsLoading && (
          <div className="text-purple-400 text-xs italic flex items-center space-x-2">
            <Bot className="w-3.5 h-3.5 animate-spin" />
            <span>L'AI sta analizzando i target per la tua asta...</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Chiedi all'AI (es. Consigliami 3 centrocampisti low-cost con il 3-4-3)..."
          value={aiInputPrompt}
          onChange={(e) => setAiInputPrompt(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
          disabled={aiIsLoading}
        />
        <button
          type="button"
          onClick={() => handleSendAiChatMessage()}
          disabled={aiIsLoading || !aiInputPrompt.trim()}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center space-x-1"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Chiedi</span>
        </button>
      </div>
    </div>
  );
};
