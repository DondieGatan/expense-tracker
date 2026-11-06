// "Chalk, slate, midnight, royal, flare": a Swiss-style navy palette. Midnight and royal blue carry the surfaces and the
// hero card, chalk and slate carry text, and flare red is kept for one loud accent (the add button). Palette: chalk
// #FFFFFF / #E6EBF1, slate #A2B5CB / #6C829D, midnight #000B58 / #1A2258, royal #00139E / #1D2FB5, flare #FF1414 /
// #FF6262. Every colour used by a screen comes from here, so the whole app re-skins from this one file.
export const darkColors = {
  bg: '#00082e',
  surface: '#0a1250',
  surface2: '#141e6c',
  border: 'rgba(230,235,241,0.11)',
  // Barely-there frosted fill for the glass-pill input fields: a solid `surface` reads as an opaque box; this stays
  // translucent so the auth background shows through faintly, matching the glass-card look.
  fieldFill: 'rgba(230,235,241,0.06)',
  text: '#f3f6fa',
  textMuted: '#9fb0cc',
  accent: '#ffffff',
  accentStrong: '#dfe6f1',
  accentContrast: '#000b58',
  accent2: '#8aa2ff',
  // The one loud colour: the add button and its glow.
  flare: '#ff1414',
  flareStrong: '#d90f0f',
  danger: '#ff6b6b',
  dangerSoft: 'rgba(255,107,107,0.16)',
  warn: '#ffc15c',
  success: '#52deb0',
  // The AI surfaces (coach, magic add, ask) share one soft periwinkle-to-royal wash.
  aiFrom: 'rgba(138,162,255,0.18)',
  aiTo: 'rgba(29,47,181,0.34)',
  heroFrom: '#2539cc',
  heroTo: '#00139e',
  tabBar: 'rgba(7,15,72,0.95)',
};

export const lightColors = {
  bg: '#eef2f7',
  surface: '#ffffff',
  surface2: '#e6ebf1',
  border: 'rgba(0,11,88,0.10)',
  fieldFill: 'rgba(0,11,88,0.04)',
  text: '#000b58',
  textMuted: '#52678b',
  accent: '#00139e',
  accentStrong: '#000b58',
  accentContrast: '#ffffff',
  accent2: '#1d2fb5',
  flare: '#ff1414',
  flareStrong: '#d90f0f',
  danger: '#e01212',
  dangerSoft: 'rgba(224,18,18,0.11)',
  warn: '#a85d00',
  success: '#0b7f58',
  aiFrom: 'rgba(0,19,158,0.10)',
  aiTo: 'rgba(162,181,203,0.38)',
  heroFrom: '#1428b8',
  heroTo: '#000b58',
  tabBar: 'rgba(255,255,255,0.96)',
};

export type Colors = typeof darkColors;

// One fixed colour per category, so a category looks the same on the donut chart, the history list and the filters.
// Deliberately theme-invariant: clear mid-tones that sit well on both the navy and the chalk backgrounds.
export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#ff7a59',
  Transport: '#6f8bff',
  Housing: '#a2b5cb',
  Utilities: '#ffc857',
  Entertainment: '#c58bff',
  Health: '#4fdcae',
  Education: '#4cc3ff',
  Shopping: '#ff5c8a',
  General: '#8394b3',
};

export function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.General;
}

// Kept for any chart that still colours by position.
export const categoryChartColors = Object.values(CATEGORY_COLORS);

// A translucent version of a #rrggbb colour, for icon tiles and tinted chips.
export function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
