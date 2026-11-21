export type TransactionType = 'income' | 'expense';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export type ThemeMode = 'light' | 'dark';

export type NavSection =
  | 'dashboard'
  | 'transactions'
  | 'budgets'
  | 'goals'
  | 'analytics'
  | 'settings';

export type AnalyticsPeriod =
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'this_year';

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // YYYY-MM-DD
  paymentMethod: string;
  description?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface BudgetConfig {
  monthlyLimit: number;
  categoryBudgets: Record<string, number>;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  isDemo?: boolean;
  createdAt: string;
}

export interface CustomCategories {
  income: string[];
  expense: string[];
}

export interface AppSettings {
  currency: CurrencyCode;
  theme: ThemeMode;
  displayName: string;
  monthlyBudget: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
}

export interface SmartInsight {
  id: string;
  tone: 'positive' | 'warning' | 'negative' | 'neutral';
  title: string;
  message: string;
}

export type BudgetHealth = 'within' | 'near' | 'over';

export interface BudgetStatus {
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  health: BudgetHealth;
}
