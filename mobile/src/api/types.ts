export interface User {
  id: number;
  fullName: string;
  email: string;
  currency: string;
}

export interface Currency {
  code: string;
  name: string;
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

// ---- AI features (backend: /api/ai/*) ----

export type AiSource = 'ai' | 'rules';

export interface SuggestedExpense {
  description: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: string;
}

export interface ParseResult {
  expenses: SuggestedExpense[];
  source: AiSource;
}

export interface CategorizeResult {
  category: string | null;
  confidence: number;
  source: AiSource;
}

export interface InsightsCategory {
  category: string;
  total: number;
  share: number;
  lastMonthSamePeriod: number;
  changePercent: number | null;
}

export interface UnusualExpense {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
  typical: number;
  timesTypical: number | null;
}

export interface RecurringCharge {
  description: string;
  amount: number;
  category: string;
  months: number;
}

export interface InsightsBudget {
  limit: number;
  usedPercent: number;
  remaining: number;
  projectedOverBy: number;
  onTrack: boolean;
  safeDailySpend: number;
  daysUntilLimit: number | null;
}

export interface Insights {
  currency: string;
  monthLabel: string;
  hasData: boolean;
  thisMonth: {
    spent: number;
    expenseCount: number;
    daysElapsed: number;
    daysLeft: number;
    daysInMonth: number;
    dailyAverage: number;
    projected: number;
    lastMonthTotal: number;
    lastMonthSamePeriod: number;
    changeVsLastMonthPercent: number | null;
  };
  budget: InsightsBudget | null;
  categories: InsightsCategory[];
  biggestExpense: { description: string; amount: number; category: string } | null;
  unusual: UnusualExpense[];
  recurring: RecurringCharge[];
  recurringMonthlyTotal: number;
  peakWeekday: string | null;
  suggestedBudget: number | null;
  headline: string;
  tips: string[];
  source: AiSource;
}

export interface AskResult {
  answer: string;
  source: 'calculated' | 'ai' | 'unavailable';
  suggestions?: string[];
}
