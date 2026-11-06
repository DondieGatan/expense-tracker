// "Bordeaux & evergreen": a deep forest-green surface family, bordeaux for the hero moments, and warm cream for text
// and primary actions (palette: bordeaux #6C151E, green #0F3D3A, cream #F5DABF). Every colour used by a screen comes
// from here, so the whole app re-skins from this one file.
export const darkColors = {
  bg: '#061b19',
  surface: '#0c2d2a',
  surface2: '#123f3b',
  border: 'rgba(245,218,191,0.10)',
  // Barely-there frosted fill for the glass-pill input fields: a solid `surface` reads as an opaque box; this stays
  // translucent so the auth background shows through faintly, matching the glass-card look.
  fieldFill: 'rgba(245,218,191,0.06)',
  text: '#f8e7d3',
  textMuted: '#b3ae9c',
  accent: '#f5dabf',
  accentStrong: '#e9bf94',
  accentContrast: '#3b0d13',
  accent2: '#76d6b4',
  danger: '#ff8f95',
  dangerSoft: 'rgba(255,143,149,0.16)',
  warn: '#f1bd6a',
  success: '#7fd8a9',
  // The AI surfaces (coach, magic add, ask) share one soft cream-to-bordeaux wash.
  aiFrom: 'rgba(245,218,191,0.13)',
  aiTo: 'rgba(140,28,42,0.32)',
  heroFrom: '#8e1f2d',
  heroTo: '#4d0d16',
  tabBar: 'rgba(8,36,33,0.95)',
};

export const lightColors = {
  bg: '#fbf1e4',
  surface: '#fffaf3',
  surface2: '#f4e1ca',
  border: 'rgba(108,21,30,0.11)',
  fieldFill: 'rgba(108,21,30,0.04)',
  text: '#2b0e12',
  textMuted: '#7b5f58',
  accent: '#6c151e',
  accentStrong: '#52101a',
  accentContrast: '#fff3e3',
  accent2: '#0f3d3a',
  danger: '#c0392b',
  dangerSoft: 'rgba(192,57,43,0.12)',
  warn: '#a45f00',
  success: '#0f6b55',
  aiFrom: 'rgba(108,21,30,0.11)',
  aiTo: 'rgba(245,218,191,0.60)',
  heroFrom: '#80202d',
  heroTo: '#4d0d16',
  tabBar: 'rgba(255,250,243,0.96)',
};

export type Colors = typeof darkColors;

// One fixed colour per category, so a category looks the same on the donut chart, the history list and the filters.
// Deliberately theme-invariant: warm, slightly muted jewel tones that sit well on both the green and cream backgrounds.
export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#eca35f',
  Transport: '#5fbfa9',
  Housing: '#c79ad6',
  Utilities: '#e6c66f',
  Entertainment: '#f09db4',
  Health: '#56c28f',
  Education: '#8fb0d9',
  Shopping: '#d9566a',
  General: '#aa9f8e',
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
