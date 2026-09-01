export const darkColors = {
  bg: '#0a1712',
  surface: '#12261d',
  surface2: '#1a3324',
  border: 'rgba(255,255,255,0.08)',
  // Barely-there frosted fill for the glass-pill input fields — a solid
  // `surface` reads as an opaque box; this stays translucent so the auth
  // background shows through faintly, matching the glass-card look.
  fieldFill: 'rgba(255,255,255,0.045)',
  text: '#eef8f1',
  textMuted: '#87a396',
  accent: '#74f2a0',
  accentStrong: '#55e488',
  accentContrast: '#06210f',
  danger: '#f37272',
  dangerSoft: 'rgba(243,114,114,0.16)',
  warn: '#f0b94d',
};

export const lightColors = {
  bg: '#f5f9f7',
  surface: '#ffffff',
  surface2: '#eef5f1',
  border: 'rgba(10,23,18,0.10)',
  fieldFill: 'rgba(10,23,18,0.03)',
  text: '#0e1f17',
  textMuted: '#5f7a6c',
  accent: '#1fae67',
  accentStrong: '#158a51',
  accentContrast: '#ffffff',
  danger: '#e05252',
  dangerSoft: 'rgba(224,82,82,0.12)',
  warn: '#c9880f',
};

export type Colors = typeof darkColors;

// Deliberately theme-invariant — the pie chart uses these as fixed hues per
// category slice, and mixed saturated colors read fine on both backgrounds.
export const categoryChartColors = [
  '#74f2a0', '#4dd4e0', '#f0b94d', '#f37272', '#9b8cf2',
  '#5bc9c9', '#e88fc0', '#c9c15b', '#6ba3f2',
];
