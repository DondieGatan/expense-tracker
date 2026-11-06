// "Midnight indigo": deep blue-black surfaces with a violet accent, a teal highlight for good news / AI, and warm
// category colours. Every colour used by a screen comes from here, so the whole app re-skins from this one file.
export const darkColors = {
  bg: '#0a0b1e',
  surface: '#141632',
  surface2: '#1e2147',
  border: 'rgba(255,255,255,0.08)',
  // Barely-there frosted fill for the glass-pill input fields — a solid
  // `surface` reads as an opaque box; this stays translucent so the auth
  // background shows through faintly, matching the glass-card look.
  fieldFill: 'rgba(255,255,255,0.05)',
  text: '#f1f2ff',
  textMuted: '#9c9fc9',
  accent: '#9d8fff',
  accentStrong: '#7d6cf2',
  accentContrast: '#0c0a2a',
  accent2: '#35d8c3',
  danger: '#ff7189',
  dangerSoft: 'rgba(255,113,137,0.16)',
  warn: '#ffb85c',
  success: '#43d9a3',
  // The AI surfaces (coach, magic add, ask) share one soft violet-to-teal wash.
  aiFrom: 'rgba(157,143,255,0.22)',
  aiTo: 'rgba(53,216,195,0.10)',
  heroFrom: '#7d6cf2',
  heroTo: '#4b3fc4',
  tabBar: 'rgba(20,22,50,0.94)',
};

export const lightColors = {
  bg: '#f4f3ff',
  surface: '#ffffff',
  surface2: '#ebe9ff',
  border: 'rgba(20,21,58,0.09)',
  fieldFill: 'rgba(20,21,58,0.035)',
  text: '#15163a',
  textMuted: '#62658f',
  accent: '#5b4bdb',
  accentStrong: '#4637c4',
  accentContrast: '#ffffff',
  accent2: '#0f9f8e',
  danger: '#d9435f',
  dangerSoft: 'rgba(217,67,95,0.12)',
  warn: '#b76e00',
  success: '#12915f',
  aiFrom: 'rgba(91,75,219,0.12)',
  aiTo: 'rgba(15,159,142,0.08)',
  heroFrom: '#6a59ee',
  heroTo: '#4535c9',
  tabBar: 'rgba(255,255,255,0.95)',
};

export type Colors = typeof darkColors;

// One fixed colour per category, so a category looks the same on the donut chart, the history list and the filters.
// Deliberately theme-invariant: mid-saturation hues read fine on both the dark and the light background.
export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#ff9a5c',
  Transport: '#4fb0ff',
  Housing: '#a78bfa',
  Utilities: '#f5c542',
  Entertainment: '#f472b6',
  Health: '#2fd1b0',
  Education: '#7c8cff',
  Shopping: '#ff6b7f',
  General: '#9aa3c7',
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
