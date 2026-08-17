const currencyFormatter = new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' });

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatDate(iso: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', options);
}
