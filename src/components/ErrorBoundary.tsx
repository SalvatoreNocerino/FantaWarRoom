import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

// Senza questo, un errore React qualsiasi mostra una pagina bianca senza
// via d'uscita — inaccettabile per un prodotto a pagamento: l'utente perde
// il contesto di dove si trovava e non sa se i suoi dati sono al sicuro.
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Punto di innesto per un servizio di error tracking (es. Sentry) quando
    // configurato — oggi logga solo in console.
    console.error('[FantaWarRoom] Errore non gestito:', error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-page text-ink font-sans flex items-center justify-center p-6">
          <div className="max-w-sm w-full bg-surface border border-border rounded-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-negative/15 text-negative flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-ink">Qualcosa è andato storto</h1>
              <p className="text-sm text-muted mt-1">
                Si è verificato un errore imprevisto. I tuoi dati salvati non sono a rischio — prova a ricaricare la
                pagina.
              </p>
            </div>
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full inline-flex items-center justify-center gap-2 bg-accent text-accent-ink font-bold px-4 py-2.5 rounded-xl hover:brightness-110 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ricarica la pagina</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
