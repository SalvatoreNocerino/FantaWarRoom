// Invio diretto via REST API di Supabase (PostgREST), senza aggiungere la
// dipendenza @supabase/supabase-js: il progetto non la usa altrove e per un
// singolo insert pubblico non serve il client completo. Vedi
// supabase/migrations/005_add_feedback.sql per tabella e policy RLS.

export class FeedbackSubmitError extends Error {}

export async function submitFeedback(message: string, contact?: string): Promise<void> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new FeedbackSubmitError('Supabase non configurato: mancano VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');
  }

  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    throw new FeedbackSubmitError('Il commento non può essere vuoto.');
  }

  const res = await fetch(`${url}/rest/v1/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      message: trimmedMessage,
      contact: contact?.trim() || null,
    }),
  });

  if (!res.ok) {
    throw new FeedbackSubmitError(`Invio fallito (HTTP ${res.status}).`);
  }
}
