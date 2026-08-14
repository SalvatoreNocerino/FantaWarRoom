import { Settings, Sliders, Database, ShieldAlert, LucideIcon } from 'lucide-react';

export type ActiveTab = 'league' | 'strategy' | 'database' | 'warroom';

export interface NavItem {
  id: ActiveTab;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'league', label: 'Lega & Regole', icon: Settings },
  { id: 'strategy', label: 'Strategia Pre-Asta', icon: Sliders },
  { id: 'database', label: 'Listone Serie A', icon: Database },
  { id: 'warroom', label: 'Console Live', icon: ShieldAlert },
];
