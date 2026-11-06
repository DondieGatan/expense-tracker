// The user's currency preference (see AuthContext, which calls setCurrency
// whenever the current user loads or changes) — kept as module state rather
// than threading a currency arg through every formatCurrency() call site.
const DEFAULT_CURRENCY = 'AED';
let currentCurrency = DEFAULT_CURRENCY;
const formatterCache = new Map<string, Intl.NumberFormat>();

export function setCurrency(code: string) {
  currentCurrency = code || DEFAULT_CURRENCY;
}

// Intl.NumberFormat throws on an unrecognized/missing currency code — a
// backend on an older schema (no `currency` column yet, or a not-yet-run
// migration) can hand us undefined here, and that must not crash the app.
function formatterFor(code: string): Intl.NumberFormat {
  let formatter = formatterCache.get(code);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency: code });
    } catch {
      formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency: DEFAULT_CURRENCY });
    }
    formatterCache.set(code, formatter);
  }
  return formatter;
}

export function formatCurrency(value: number): string {
  return formatterFor(currentCurrency).format(value);
}

// "AED 48.6K": a whole currency amount in a small space (stat cards, the middle of the donut).
const compactCache = new Map<string, Intl.NumberFormat>();
export function formatCurrencyCompact(value: number): string {
  let formatter = compactCache.get(currentCurrency);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat(undefined, {
        style: 'currency', currency: currentCurrency, notation: 'compact', maximumFractionDigits: 1,
      });
    } catch {
      formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency: DEFAULT_CURRENCY, notation: 'compact', maximumFractionDigits: 1 });
    }
    compactCache.set(currentCurrency, formatter);
  }
  return formatter.format(value);
}

// 12400 -> "12.4k": short enough for the labels above chart bars.
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(Math.round(value));
}

export function greeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function todayIso(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function formatDate(iso: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', options);
}
