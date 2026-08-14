import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X } from 'lucide-react';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm bg-surface border border-accent/50 p-4 rounded-2xl shadow-2xl z-50 flex items-center justify-between gap-3 text-ink text-xs">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/40 flex items-center justify-center text-accent shrink-0">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-ink text-sm">Installa FantaWarRoom PWA</h4>
          <p className="text-muted">Usa l'app a schermo intero durante l'asta!</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleInstallClick}
          className="bg-accent text-accent-ink font-bold px-3 py-2 rounded-xl flex items-center gap-1"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Installa</span>
        </button>

        <button type="button" onClick={() => setIsVisible(false)} className="text-muted hover:text-ink p-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
