import { PlayerRole } from '../../types';

/**
 * Design tokens del redesign mobile "Console Live" — vedi
 * Admin dashboard redesign/design_handoff_console_live/README.md.
 * Colori/spaziature/tipografia sono definitivi per queste 4 schermate: si
 * usano valori esatti (non la palette Tailwind stock) per restare fedeli
 * all'handoff hi-fi.
 */
export const COLORS = {
  bgPage: '#0a0b0f',
  bgCard: '#11141a',
  bgNested: '#0d1014',
  bgInputDark: '#08090c',
  bgInputLight: '#12141a',
  borderDivider: 'rgba(255,255,255,.07)',
  borderCard: 'rgba(255,255,255,.08)',
  borderInput: 'rgba(255,255,255,.1)',
  textPrimary: '#edeef2',
  textSecondary: '#c9ccd4',
  textMuted: '#8a8f9c',
  textWeak: '#5d6270',
  // "Electric Mint" — palette del redesign Stitch, vedi lo stesso commento
  // su --color-accent in src/index.css.
  accent: '#00ff9d',
  accentOn: '#051f13',
  warning: '#f5c451',
  negative: '#ff6b6b',
  info: '#5bc8ff',
} as const;

// Deliberatamente distinti (non alias) da COLORS.info/accent/warning/negative
// — vedi lo stesso commento su --color-role-* in src/index.css.
export const ROLE_COLORS: Record<PlayerRole, string> = {
  P: '#6f93b0',
  D: '#6fa883',
  C: '#c9a054',
  A: '#c07a63',
};

export const ROLE_PLURAL: Record<PlayerRole, string> = {
  P: 'portieri',
  D: 'difensori',
  C: 'centrocampisti',
  A: 'attaccanti',
};

export const ROLE_ARTICLE: Record<PlayerRole, string> = {
  P: 'i',
  D: 'i',
  C: 'i',
  A: 'gli',
};

export const FONT_UI = "'Plus Jakarta Sans', system-ui, sans-serif";
export const FONT_MONO = "'JetBrains Mono', monospace";

export const ROLES_WITH_ALL: (PlayerRole | 'ALL')[] = ['ALL', 'P', 'D', 'C', 'A'];

/** "+19 sopra il valore" / "−4 sotto il valore" / "in linea col valore". */
export function formatDelta(current: number, value: number): string {
  const diff = current - value;
  if (diff === 0) return 'in linea col valore';
  return diff > 0 ? `+${diff} sopra il valore` : `−${Math.abs(diff)} sotto il valore`;
}

/** Scostamento assoluto per le righe di History: colore in base al segno. */
export function deltaColor(cost: number, value: number): string {
  return cost > value ? COLORS.negative : COLORS.accent;
}

export function formatSignedInt(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}
