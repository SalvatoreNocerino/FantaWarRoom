import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini API client lazily / safely
  let ai: GoogleGenAI | null = null;
  const getGeminiClient = (): GoogleGenAI | null => {
    if (!ai && process.env.GEMINI_API_KEY) {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return ai;
  };

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Football domain classifier helper
  const isFootballQuestion = (text: string): boolean => {
    const normalized = text.toLowerCase().trim();
    if (normalized.length < 3) return true; // short greetings or queries pass through
    const footballKeywords = [
      'calcio', 'fantacalcio', 'fanta', 'asta', 'giocatore', 'giocatori', 'squadra', 'squadre',
      'serie a', 'gol', 'assist', 'modulo', 'difensore', 'centrocampista', 'attaccante', 'portiere',
      'budget', 'rosa', 'formazione', 'infortunio', 'infortuni', 'trasferimento', 'voto', 'fantamedia',
      'quotazione', 'credito', 'crediti', 'chiamare', 'comprare', 'rilanciare', 'passare', 'listone',
      'titolare', 'panchina', 'rigorista', 'scudetto', 'lega', 'modificatore', 'fair value', 'slot',
      'inter', 'milan', 'juve', 'napoli', 'roma', 'lazio', 'atalanta', 'fiorentina', 'bologna', 'torino',
      'udinese', 'empoli', 'verona', 'cagliari', 'parma', 'como', 'venezia', 'monza', 'genoa', 'lecce'
    ];
    // Check if any football keyword is present or if prompt asks about specific player name
    const matchesKeyword = footballKeywords.some((k) => normalized.includes(k));
    if (matchesKeyword) return true;

    // Reject obvious off-topic prompts (e.g., recipes, generic coding, weather)
    const offTopicKeywords = [
      'ricetta', 'cucina', 'pasta', 'meteo', 'python', 'javascript', 'storia', 'capitale', 'matematica'
    ];
    if (offTopicKeywords.some((k) => normalized.includes(k))) {
      return false;
    }
    
    return true;
  };

  // AI Copilot Endpoint
  app.post('/api/copilot', async (req, res) => {
    try {
      const { prompt, context, mode = 'standard', useSearch = false } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt field is required' });
      }

      // Domain Guard Filter: check if query is about football/Fantacalcio
      if (!isFootballQuestion(prompt)) {
        return res.json({
          reply: 'Posso aiutarti solo con calcio, Fantacalcio, aste, giocatori, statistiche e strategie di squadra.',
          domainGuardBlocked: true,
          modeUsed: mode,
        });
      }

      const client = getGeminiClient();

      if (!client) {
        // Fallback response if API key is not set yet
        return res.json({
          reply: `[Modalità Strategia Offline] Suggerimento per ${context?.leagueName || 'Lega'}: Budget residuo ${context?.myRemainingCredits || 500} FM, Modulo ${context?.preferredFormation || '3-4-3'}. Mantieni almeno il 45-50% dei crediti per l'attacco top e usa difensori a 1 FM se non hai il modificatore.`,
          fallback: true,
          modeUsed: mode,
        });
      }

      const systemInstruction = `
Sei FantaCopilot, un assistente virtuale esperto e specializzato esclusivamente in:
- Calcio italiano e internazionale (particolarmente Serie A);
- Fantacalcio, aste dal vivo, gestione rose e strategie di bilancio;
- Giocatori, ruoli, statistiche, formazioni, infortuni e calciomercato;
- Regolamenti di lega e calcolo punteggi.

REGOLE TASSATIVE DI RISPOSTA:
1. Rispondi SEMPRE in italiano in modo SINTETICO, DIRETTO ed ORDINATO.
2. NESSUN PREAMBOLO prolisso o saluto cerimonioso.
3. Quando valuti un giocatore o un'asta, specifica chiaramente:
   - 🎯 **VERDETTO**: COMPRA / RILANCIA / PASSA
   - 💰 **PREZZO MAX CONSIGLIATO**: (es. X FM)
   - 📊 **MOTIVAZIONE E RISCHIO**: Spiegazione in 1-2 frasi.
4. Distingui sempre i dati ufficiali della lega dell'utente da valutazioni strategiche o notizie web.
5. Se la richiesta riguarda notizie in tempo reale, usa Google Search per verificare infortuni, trasferimenti e probabili formazioni recenti.
${useSearch || mode === 'search' ? '- Cita brevemente le notizie/fonti trovate via Google Search.' : ''}
`;

      const contents = `
CONTESTO UTENTE:
- Nome Lega: ${context?.leagueName || 'Lega Fantacalcio'}
- Partecipanti: ${context?.numTeams || 10}
- Budget Iniziale: ${context?.totalBudget || 500}
- Miei Crediti Rimanenti: ${context?.myRemainingCredits ?? 500}
- Ruoli ancora da coprire (P/D/C/A): Portieri: ${context?.neededSlots?.P ?? 3}, Difensori: ${context?.neededSlots?.D ?? 8}, Centrocampisti: ${context?.neededSlots?.C ?? 8}, Attaccanti: ${context?.neededSlots?.A ?? 6}
- Modulo Preferito: ${context?.preferredFormation || '3-4-3'}
- Livello Aggressività: ${context?.aggressionLevel || 'bilanciato'}
- Modificatore Difesa: ${context?.defensiveModifier ? 'ATTIVO (+1 a +6 per fantamedia difensori)' : 'DISATTIVATO'}

DOMANDA UTENTE:
${prompt}
`;

      let modelName = 'gemini-3.6-flash';
      let config: any = {
        systemInstruction,
        temperature: 0.7,
      };

      if (mode === 'fast') {
        modelName = 'gemini-3.1-flash-lite';
      } else if (mode === 'search' || useSearch) {
        modelName = 'gemini-3.5-flash';
        config.tools = [{ googleSearch: {} }];
      }

      let replyText = '';
      let groundingMetadata: any = null;
      let apiSuccess = false;
      let usedModelName = modelName;

      // Fallback model list if primary model fails
      const modelsToTry = [
        { name: modelName, useSearch: mode === 'search' || useSearch },
        { name: 'gemini-3.1-flash-lite', useSearch: false },
        { name: 'gemini-3.6-flash', useSearch: false },
      ];

      for (const item of modelsToTry) {
        if (apiSuccess) break;
        try {
          const modelConfig: any = {
            systemInstruction,
            temperature: 0.7,
          };

          if (item.useSearch && item.name === 'gemini-3.5-flash') {
            modelConfig.tools = [{ googleSearch: {} }];
          }

          const response = await client.models.generateContent({
            model: item.name,
            contents,
            config: modelConfig,
          });

          if (response.text) {
            replyText = response.text;
            apiSuccess = true;
            usedModelName = item.name;
            
            // Extract search grounding metadata if available
            const candidate = response.candidates?.[0];
            if (candidate && (candidate as any).groundingMetadata) {
              groundingMetadata = (candidate as any).groundingMetadata;
            }
            break;
          }
        } catch (err: any) {
          console.warn(`[Gemini API] Error with model ${item.name}: ${err.message || String(err)}`);
        }
      }

      if (!apiSuccess) {
        const remainingCreds = context?.myRemainingCredits ?? 500;
        const totalB = context?.totalBudget ?? 500;
        const budgetPercent = Math.round((remainingCreds / totalB) * 100);

        replyText = `⚡ [Assistente War Room Fantacalcio - Modalità Strategica Offline]

**Analisi per la tua rosa (${context?.leagueName || 'Lega'}, Budget Rimanente: ${remainingCreds} FM / ${budgetPercent}%):**
- 🎯 **Consiglio Asta**: Hai il ${budgetPercent}% del budget disponibile. ${budgetPercent > 40 ? 'Puoi ancora puntare decisi su un top slot in Attacco/Centrocampo.' : 'Fai attenzione! Risparmia sui comprimari e completa la rosa a 1 FM.'}
- 🛡️ **Modulo ${context?.preferredFormation || '3-4-3'}**: ${context?.defensiveModifier ? 'Con modificatore attivo, prioritizza difensori con fantamedia > 6.2.' : 'Senza modificatore, compra difensori titolari al prezzo minimo.'}
- 💡 **Consiglio Tattico**: Monitora le quotazioni in War Room e rispetta il Fair Value consigliato dall'algoritmo.`;
      }

      return res.json({
        reply: replyText,
        fallback: !apiSuccess,
        modeUsed: usedModelName,
        groundingMetadata,
      });
    } catch (error: any) {
      console.error('Error in /api/copilot:', error);
      return res.json({
        reply: `⚠️ Si è verificato un problema temporaneo di connessione. Puoi continuare ad usare tutte le funzionalità della War Room e riprovare la chat AI tra un istante.`,
        fallback: true,
      });
    }
  });

  // Serve static app or Vite dev middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FantaWarRoom AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
