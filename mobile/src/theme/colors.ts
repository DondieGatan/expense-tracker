// "Lime and deep teal": a dark teal-black surface family with one acid-lime accent (#D6FB00) and a pale lime (#ECFFB6)
// for soft highlights; palette teal #00545F. The lime is only ever a fill or a glow on dark, and text that sits on it
// is deep teal. On light surfaces the roles swap: teal is the accent, lime-tinted chalk is the background, and buttons
// are teal with lime text. Every colour used by a screen comes from here, so the whole app re-skins from this one file.
export const darkColors = {
  bg: '#00242a',
  surface: '#04363d',
  surface2: '#08474f',
  border: 'rgba(236,255,182,0.12)',
  // Barely-there frosted fill for the glass-pill input fields: a solid `surface` reads as an opaque box; this stays
  // translucent so the auth background shows through faintly, matching the glass-card look.
  fieldFill: 'rgba(236,255,182,0.06)',
  text: '#f4fbe1',
  textMuted: '#95b8ae',
  accent: '#d6fb00',
  accentStrong: '#b9d800',
  accentContrast: '#00343a',
  accent2: '#ecffb6',
  danger: '#ff8f82',
  dangerSoft: 'rgba(255,143,130,0.16)',
  warn: '#ffc25c',
  success: '#5fe3a1',
  // The AI surfaces (coach, magic add, ask) share one soft lime-to-teal wash.
  aiFrom: 'rgba(214,251,0,0.16)',
  aiTo: 'rgba(0,120,132,0.30)',
  heroFrom: '#0a7783',
  heroTo: '#00424a',
  tabBar: 'rgba(0,38,44,0.96)',
};

export const lightColors = {
  bg: '#f5fbe3',
  surface: '#fdfff2',
  surface2: '#e7f4bd',
  border: 'rgba(0,84,95,0.12)',
  fieldFill: 'rgba(0,84,95,0.045)',
  text: '#00292e',
  textMuted: '#4b6a65',
  accent: '#00545f',
  accentStrong: '#003a42',
  accentContrast: '#d6fb00',
  accent2: '#3f6a00',
  danger: '#c62828',
  dangerSoft: 'rgba(198,40,40,0.11)',
  warn: '#a85d00',
  success: '#0b7a4b',
  aiFrom: 'rgba(214,251,0,0.38)',
  aiTo: 'rgba(0,84,95,0.08)',
  heroFrom: '#0a7783',
  heroTo: '#00424a',
  tabBar: 'rgba(253,255,242,0.97)',
};

export type Colors = typeof darkColors;

// One fixed colour per category, so a category looks the same on the donut chart, the history list and the filters.
// Deliberately theme-invariant: clear mid-tones that sit well on both the teal and the pale-lime backgrounds.
export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#ff9a4d',
  Transport: '#4dc3ff',
  Housing: '#9bd12b',
  Utilities: '#ffd24c',
  Entertainment: '#ff6fae',
  Health: '#2fd6b4',
  Education: '#8a9bff',
  Shopping: '#ff6b5c',
  General: '#8aa5a0',
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
