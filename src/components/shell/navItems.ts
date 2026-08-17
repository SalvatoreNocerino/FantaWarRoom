import { ShieldAlert, Settings2, LucideIcon } from 'lucide-react';

export type ActiveTab = 'warroom' | 'settings';

export interface NavItem {
  id: ActiveTab;
  label: string;
  icon: LucideIcon;
}

// MVP: solo le due schermate usate durante l'asta. Console Live è l'uso
// principale (vedi App.tsx, apre lì di default); Impostazioni è la
// configurazione one-shot di lega.
export const NAV_ITEMS: NavItem[] = [
  { id: 'warroom', label: 'Console Live', icon: ShieldAlert },
  { id: 'settings', label: 'Impostazioni', icon: Settings2 },
];
