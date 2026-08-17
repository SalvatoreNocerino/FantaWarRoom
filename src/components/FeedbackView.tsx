import React, { useState } from 'react';
import { MessageSquareHeart, Send } from 'lucide-react';
import { PageHeader, Card, SectionHeader, Field, Textarea, Input, Button, Alert } from './ui';
import { submitFeedback, FeedbackSubmitError } from '../utils/feedback';

type Status = 'idle' | 'sending' | 'sent' | 'error';

/** Sezione per lasciare un commento libero su come migliorare il tool: i
 * commenti vengono salvati in Supabase (tabella public.feedback), non
 * inviati via email. Vedi supabase/migrations/005_add_feedback.sql. */
export const FeedbackView: React.FC = () => {
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || status === 'sending') return;

    setStatus('sending');
    setErrorMsg('');
    try {
      await submitFeedback(message, contact);
      setStatus('sent');
      setMessage('');
      setContact('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof FeedbackSubmitError ? err.message : 'Qualcosa è andato storto. Riprova.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 text-ink">
      <PageHeader
        icon={MessageSquareHeart}
        title="Feedback"
        subtitle="Un'idea, un bug, qualcosa che ti ha fatto imprecare durante l'asta? Scrivilo qui: ci aiuta a migliorare il tool."
      />

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <SectionHeader title="Lascia un commento" />

          <Field label="Il tuo commento" hint="Descrivi il problema o l'idea nel modo più concreto possibile: cosa stavi facendo, cosa ti aspettavi.">
            <Textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Es: durante l'asta il conteggio dei crediti rimasti non si aggiornava dopo un'assegnazione..."
              required
            />
          </Field>

          <Field label="Email o contatto (opzionale)" hint="Solo se vuoi essere ricontattato per un chiarimento.">
            <Input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="nome@esempio.it"
            />
          </Field>

          {status === 'sent' && <Alert tone="success">Grazie! Il tuo commento è stato inviato.</Alert>}
          {status === 'error' && <Alert tone="error">{errorMsg}</Alert>}

          <div className="flex justify-end">
            <Button type="submit" disabled={!message.trim() || status === 'sending'}>
              <Send className="w-4 h-4" />
              <span>{status === 'sending' ? 'Invio...' : 'Invia commento'}</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
