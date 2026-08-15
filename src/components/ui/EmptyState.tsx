import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface Props {
  /** Testo libero — retrocompatibile con l'uso precedente come solo messaggio. */
  children?: React.ReactNode;
  /** Alternativa a children quando serve anche icon/action. */
  message?: React.ReactNode;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<Props> = ({ children, message, icon: Icon = Inbox, action, className = '' }) => (
  <div className={`py-8 flex flex-col items-center text-center gap-3 ${className}`}>
    <Icon className="w-7 h-7 text-faint" />
    <p className="text-xs text-faint max-w-xs">{message ?? children}</p>
    {action}
  </div>
);
