export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Housing',
  'Utilities',
  'Entertainment',
  'Health',
  'Education',
  'Shopping',
  'General',
];

export const PAYMENT_METHODS = ['Cash', 'Card', 'Bank Transfer'];

export interface QuickAddTemplate {
  label: string;
  description: string;
  amount: string;
  category: string;
  paymentMethod: string;
}

// Common one-tap presets shown on the Add Expense form — a lighter-weight
// stand-in for full recurring expenses (no backend schema/scheduler needed).
export const QUICK_ADD_TEMPLATES: QuickAddTemplate[] = [
  { label: 'Coffee', description: 'Coffee', amount: '15', category: 'Food', paymentMethod: 'Cash' },
  { label: 'Lunch', description: 'Lunch', amount: '40', category: 'Food', paymentMethod: 'Card' },
  { label: 'Groceries', description: 'Groceries', amount: '150', category: 'Food', paymentMethod: 'Card' },
  { label: 'Fuel', description: 'Fuel', amount: '100', category: 'Transport', paymentMethod: 'Card' },
  { label: 'Taxi', description: 'Taxi', amount: '30', category: 'Transport', paymentMethod: 'Cash' },
];
