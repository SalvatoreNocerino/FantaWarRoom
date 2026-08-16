import React from 'react';
import { Mail, LogIn } from 'lucide-react';
import { track } from '@vercel/analytics';
import { Modal } from './ui';
import { AppUser } from '../lib/supabase';

interface Props {
  open: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  onLogin: () => void;
  freeLimit: number;
}

const SUPPORT_EMAIL = 'salvatorenocerino91@gmail.com';

// Bootstrap freemium senza processore di pagamento: l'attivazione è manuale
// via email finché non c'è un account Stripe (vedi
// supabase/migrations/003_add_premium_gate.sql).
export const UpgradeModal: React.FC<Props> = ({ open, onClose, currentUser, onLogin, freeLimit }) => {
  const mailtoHref = currentUser
    ? `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Attivazione Premium FantaWarRoom')}&body=${encodeURIComponent(
        `Ciao,\n\nvorrei attivare il piano Premium per il mio account.\n\nEmail: ${currentUser.email ?? ''}\nID account: ${currentUser.uid}\n\nGrazie!`
      )}`
    : undefined;

  return (
    <Modal open={open} onClose={onClose} title="Piano gratuito esaurito" maxWidth="max-w-sm">
      <div className="space-y-4">
        <p className="text-sm text-ink-soft leading-relaxed">
          Il piano gratuito include fino a {freeLimit} aggiudicazioni in Console Live. Passa a Premium per continuare
          l'asta senza limiti per tutta la stagione.
        </p>

        {currentUser ? (
          <a
            href={mailtoHref}
            onClick={() => track('upgrade_email_clicked')}
            className="w-full inline-flex items-center justify-center gap-2 bg-accent text-accent-ink font-bold px-4 py-2.5 rounded-xl hover:brightness-110 transition-all"
          >
            <Mail className="w-4 h-4" />
            <span>Passa a Premium</span>
          </a>
        ) : (
          <button
            type="button"
            onClick={onLogin}
            className="w-full inline-flex items-center justify-center gap-2 bg-accent text-accent-ink font-bold px-4 py-2.5 rounded-xl hover:brightness-110 transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>Accedi per continuare</span>
          </button>
        )}

        <p className="text-[11px] text-faint text-center">
          {currentUser
            ? "Ti risponderemo via email con le istruzioni per completare l'attivazione."
            : 'Serve un account per attivare Premium in modo permanente sul tuo profilo.'}
        </p>
      </div>
    </Modal>
  );
};
