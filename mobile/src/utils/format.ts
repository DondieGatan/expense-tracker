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

export function formatDate(iso: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', options);
}
