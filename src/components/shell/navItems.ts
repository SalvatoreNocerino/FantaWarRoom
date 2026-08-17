import { LayoutDashboard, Database, ShieldAlert, Settings2, MessageSquareHeart, LucideIcon } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'warroom' | 'database' | 'settings' | 'feedback';

export interface NavItem {
  id: ActiveTab;
  label: string;
  icon: LucideIcon;
}

// Ordine per frequenza d'uso reale, non per sequenza di setup: Dashboard e
// Console Live sono l'uso quotidiano durante l'asta, Lega/Strategia sono
// configurazione one-shot raggruppata sotto "Impostazioni" (vedi SettingsView).
// Feedback raccoglie commenti per migliorare il tool.
export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'warroom', label: 'Console Live', icon: ShieldAlert },
  { id: 'database', label: 'Listone Serie A', icon: Database },
  { id: 'settings', label: 'Impostazioni', icon: Settings2 },
  { id: 'feedback', label: 'Feedback', icon: MessageSquareHeart },
];
