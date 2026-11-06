// "Black, vibe purple, white": true-black surfaces, one electric purple (#AC58E9) for everything interactive, and
// white text. The purple is used as-is on dark; on white it is deepened a step (#8F3FD1) so text and icons keep
// contrast. Every colour used by a screen comes from here, so the whole app re-skins from this one file.
export const darkColors = {
  bg: '#000000',
  surface: '#0e0b13',
  surface2: '#1a1424',
  border: 'rgba(255,255,255,0.10)',
  // Barely-there frosted fill for the glass-pill input fields: a solid `surface` reads as an opaque box; this stays
  // translucent so the auth background shows through faintly, matching the glass-card look.
  fieldFill: 'rgba(255,255,255,0.05)',
  text: '#ffffff',
  textMuted: '#a9a1b8',
  accent: '#ac58e9',
  accentStrong: '#8f3fd1',
  accentContrast: '#0a0210',
  accent2: '#d6b0f7',
  danger: '#ff6b86',
  dangerSoft: 'rgba(255,107,134,0.16)',
  warn: '#ffb84d',
  success: '#45dc9c',
  // The AI surfaces (coach, magic add, ask) share one soft purple wash.
  aiFrom: 'rgba(172,88,233,0.24)',
  aiTo: 'rgba(172,88,233,0.06)',
  heroFrom: '#9a40dc',
  heroTo: '#5a14a0',
  tabBar: 'rgba(14,11,19,0.96)',
};

export const lightColors = {
  bg: '#f6f3fa',
  surface: '#ffffff',
  surface2: '#eee6f7',
  border: 'rgba(10,2,16,0.09)',
  fieldFill: 'rgba(10,2,16,0.035)',
  text: '#0b0610',
  textMuted: '#675e76',
  accent: '#8f3fd1',
  accentStrong: '#7326b5',
  accentContrast: '#ffffff',
  accent2: '#ac58e9',
  danger: '#d6264a',
  dangerSoft: 'rgba(214,38,74,0.11)',
  warn: '#a85d00',
  success: '#0b7f58',
  aiFrom: 'rgba(143,63,209,0.13)',
  aiTo: 'rgba(172,88,233,0.04)',
  heroFrom: '#9a40dc',
  heroTo: '#5a14a0',
  tabBar: 'rgba(255,255,255,0.97)',
};

export type Colors = typeof darkColors;

// One fixed colour per category, so a category looks the same on the donut chart, the history list and the filters.
// Deliberately theme-invariant: clear mid-tones that sit well on both the black and the white backgrounds.
export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#ff8a4c',
  Transport: '#4cb8ff',
  Housing: '#b673f0',
  Utilities: '#ffd24c',
  Entertainment: '#ff5fa2',
  Health: '#3ddc97',
  Education: '#7c8cff',
  Shopping: '#ff5c5c',
  General: '#9a93a8',
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
