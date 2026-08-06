import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Player,
  LeagueSettings,
  StrategySettings,
  RosterPlayer,
  CopilotMessage,
} from '../types';
import { Bot, Send, Sparkles, User, RefreshCw, Zap, Users, HelpCircle, Globe, Gauge } from 'lucide-react';

interface AiCopilotViewProps {
  allPlayers: Player[];
  league: LeagueSettings;
  strategy: StrategySettings;
  auctionHistory: RosterPlayer[];
  initialPlayerContext?: Player | null;
}

export type CopilotMode = 'fast' | 'standard' | 'search';

export const AiCopilotView: React.FC<AiCopilotViewProps> = ({
  allPlayers,
  league,
  strategy,
  auctionHistory,
  initialPlayerContext,
}) => {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `👋 Ciao! Sono il tuo Copilota AI per l'asta Fantacalcio 2026.

**Stato Attuale Lega**:
- **Lega**: ${league.name} (${league.numTeams} squadre, budget ${league.totalBudget} FM)
- **Modulo Preferito**: ${strategy.preferredFormation}
- **Giocatori Acquistati finora in Asta**: ${auctionHistory.length}

Scegli la modalità dal menu in alto:
• ⚡ **Bassa Latenza (Flash Lite)**: Risposte sub-secondo durante i rilanci in asta.
• 🌐 **Google Search Live**: Notizie di calciomercato, infortuni e probabili formazioni in tempo reale.
• 🧠 **Analisi Standard**: Valutazioni tattiche dettagliate.`,
      timestamp: Date.now(),
    },
  ]);

  const [copilotMode, setCopilotMode] = useState<CopilotMode>('fast');
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Remaining uncalled top players
  const uncalledPlayers = useMemo(() => {
    const calledIds = new Set(auctionHistory.map((b) => b.playerId));
    return allPlayers.filter((p) => !calledIds.has(p.id));
  }, [allPlayers, auctionHistory]);

  const uncalledTopPlayersStr = useMemo(() => {
    return uncalledPlayers
      .filter((p) => p.tier === 1 || p.basePrice >= 25)
      .slice(0, 10)
      .map((p) => `${p.name} (${p.role} - ${p.team})`)
      .join(', ');
  }, [uncalledPlayers]);

  const myBids = auctionHistory.filter((b) => b.boughtByTeam === league.myTeamName);
  const mySpent = myBids.reduce((acc, b) => acc + b.cost, 0);
  const myRemaining = Math.max(0, league.totalBudget - mySpent);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (initialPlayerContext) {
      const defaultQuery = `Siamo all'asta per ${initialPlayerContext.name} (${initialPlayerContext.role} - ${initialPlayerContext.team}, quotazione base ${initialPlayerContext.basePrice} FM). Dammi consigli sintetici ed aggiornati su come comportarmi.`;
      handleSendMessage(defaultQuery);
    }
  }, [initialPlayerContext?.id]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputPrompt;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: CopilotMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `${textToSend}\n\n[ISTRUZIONE DI STILE: Fornisci una risposta MOLTO BREVE, ORDINATA e SINTETICA in punti elenco puntati con sole informazioni salienti, senza preamboli lunghi.]`,
          mode: copilotMode,
          useSearch: copilotMode === 'search',
          context: {
            leagueName: league.name,
            numTeams: league.numTeams,
            totalBudget: league.totalBudget,
            myRemainingCredits: myRemaining,
            preferredFormation: strategy.preferredFormation,
            aggressionScore: strategy.aggressionScore,
            defensiveModifier: league.defensiveModifier.enabled,
            totalCalledCount: auctionHistory.length,
            uncalledTopPlayers: uncalledTopPlayersStr || 'Nessuno, principali top già chiamati',
          },
        }),
      });

      const data = await response.json();

      let replyContent = data.reply || 'Nessuna risposta disponibile dall\'AI.';
      
      if (data.modeUsed) {
        if (data.modeUsed === 'gemini-3.1-flash-lite') {
          replyContent += `\n\n⚡ *Risposta generata con modello a bassa latenza Gemini 3.1 Flash Lite*`;
        } else if (data.modeUsed === 'gemini-3.5-flash' && data.groundingMetadata) {
          replyContent += `\n\n🌐 *Dati verificati in tempo reale tramite Google Search*`;
        }
      }

      const aiMsg: CopilotMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: replyContent,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('Copilot request failed:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'ai',
          text: `❌ Si è verificato un errore temporaneo: ${err.message || 'Errore di rete'}. Riprova tra un attimo.`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4 text-slate-100 flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-900/80 border border-purple-500/50 flex items-center justify-center text-purple-300 shadow-lg shadow-purple-900/40">
            <Bot className="w-6 h-6 animate-pulse" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-purple-300 flex items-center space-x-2">
              <span>6. AI Copilot Fantacalcio</span>
              <span className="bg-purple-950 text-purple-300 border border-purple-500/30 text-[10px] px-2 py-0.5 rounded font-mono">
                {copilotMode === 'fast'
                  ? '3.1 FLASH LITE'
                  : copilotMode === 'search'
                  ? '3.5 SEARCH'
                  : '3.6 FLASH'}
              </span>
            </h1>
            <p className="text-slate-400 text-xs">
              Scegli la modalità di risposta più adatta alla tua asta.
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setCopilotMode('fast')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
              copilotMode === 'fast'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Latenza ultrabassa con Gemini 3.1 Flash Lite"
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>⚡ Veloce</span>
          </button>

          <button
            onClick={() => setCopilotMode('search')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
              copilotMode === 'search'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Dati notizie Serie A e calciomercato in tempo reale via Google Search"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>🌐 Google Search</span>
          </button>

          <button
            onClick={() => setCopilotMode('standard')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
              copilotMode === 'standard'
                ? 'bg-purple-600 text-white shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Analisi tattica standard con Gemini 3.6 Flash"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>🧠 Standard</span>
          </button>

          <button
            onClick={() =>
              setMessages([
                {
                  id: 'welcome_reset',
                  sender: 'ai',
                  text: 'Chat azzerata. Come posso aiutarti ora?',
                  timestamp: Date.now(),
                },
              ])
            }
            className="p-1.5 text-slate-400 hover:text-white rounded-lg text-xs ml-1"
            title="Reset conversazione"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5.1 Pre-set Preset Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
        <button
          onClick={() =>
            handleSendMessage(
              "Chi dovrei chiamare prossimo in asta in base ai ruoli ancora liberi nella mia rosa e al budget residuo?"
            )
          }
          className="p-2.5 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-200 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md"
        >
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="truncate">Chi chiamare prossimo?</span>
        </button>

        <button
          onClick={() =>
            handleSendMessage(
              "Quali sono le ultime notizie su infortuni, trasferimenti o titolari in bilico per le prossime giornate di Serie A?"
            )
          }
          className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-200 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md"
        >
          <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="truncate">Ultime news Serie A (Google)</span>
        </button>

        <button
          onClick={() =>
            handleSendMessage(
              "Quali sono i migliori affari a 1 credito ancora disponibili nel listone per completare la mia rosa?"
            )
          }
          className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-200 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md"
        >
          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="truncate">Affari a 1 credito</span>
        </button>

        <button
          onClick={() =>
            handleSendMessage(
              "Chi è ancora fuori? Fammi l'elenco dei principali giocatori e top player ancora non chiamati nell'asta."
            )
          }
          className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-200 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md"
        >
          <Users className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">Chi è ancora fuori?</span>
        </button>
      </div>

      {/* Chat Log Window */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-lg bg-purple-900 border border-purple-500/50 flex items-center justify-center text-purple-300 shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[80%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none'
                  : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
              }`}
            >
              {msg.sender === 'ai' ? (
                <div>
                  {/* Highlight Verdicts if present in text */}
                  {msg.text.split('\n').map((line, idx) => {
                    if (line.includes('VERDETTO') || line.includes('COMPRA') || line.includes('RILANCIA') || line.includes('PASSA')) {
                      return (
                        <div key={idx} className="my-1 font-semibold">
                          {line.includes('COMPRA') ? (
                            <span className="inline-block bg-emerald-950 text-emerald-300 border border-emerald-500/50 px-2 py-0.5 rounded font-mono text-xs mr-2 font-bold">
                              🟢 VERDETTO: COMPRA
                            </span>
                          ) : line.includes('RILANCIA') ? (
                            <span className="inline-block bg-amber-950 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded font-mono text-xs mr-2 font-bold">
                              🟡 VERDETTO: RILANCIA
                            </span>
                          ) : line.includes('PASSA') ? (
                            <span className="inline-block bg-red-950 text-red-300 border border-red-500/50 px-2 py-0.5 rounded font-mono text-xs mr-2 font-bold">
                              🔴 VERDETTO: PASSA
                            </span>
                          ) : null}
                          <span className="text-slate-200">{line.replace(/.*VERDETTO:?/, '').trim()}</span>
                        </div>
                      );
                    }
                    return <div key={idx}>{line}</div>;
                  })}
                </div>
              ) : (
                msg.text
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white shrink-0 mt-0.5 font-bold text-xs">
                TU
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-3 text-purple-400 text-xs italic">
            <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-500/50 flex items-center justify-center">
              <Bot className="w-4 h-4 animate-spin text-purple-400" />
            </div>
            <span>
              {copilotMode === 'fast'
                ? '⚡ Elaborazione ultra-veloce (Gemini Flash Lite)...'
                : copilotMode === 'search'
                ? '🌐 Ricerca notizie live su Google Search...'
                : '🧠 Analisi tattica in corso...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex gap-2 shrink-0 pt-1"
      >
        <input
          type="text"
          placeholder={
            copilotMode === 'search'
              ? 'Cerca notizie live o calciomercato su un giocatore...'
              : copilotMode === 'fast'
              ? 'Consiglio lampo per rilanci in asta...'
              : 'Fai una domanda sintetica all\'AI Copilot...'
          }
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
          disabled={isLoading}
        />

        <button
          type="submit"
          disabled={isLoading || !inputPrompt.trim()}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-lg shadow-purple-600/30"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Invia</span>
        </button>
      </form>
    </div>
  );
};

