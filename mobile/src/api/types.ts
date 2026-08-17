export interface User {
  id: number;
  fullName: string;
  email: string;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: string;
  notes: string | null;
}

export interface Budget {
  id: number;
  monthlyLimit: number;
}

export interface CategoryTotal {
  category: string;
  total: number;
}

export interface MonthTotal {
  label: string;
  total: number;
}

export interface DashboardData {
  totalSpent: number;
  thisMonthTotal: number;
  expenseCount: number;
  byCategory: CategoryTotal[];
  recentExpenses: Expense[];
  monthlyTrend: MonthTotal[];
  budgetLimit: number | null;
}
