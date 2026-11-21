import {
  AppSettings,
  BudgetConfig,
  CurrencyCode,
  SavingsGoal,
  Transaction,
} from '../types/finance';

export const DEFAULT_EXPENSE_CATEGORIES: string[] = [
  'Food & Dining',
  'Shopping',
  'Transport',
  'Bills & Utilities',
  'Entertainment',
  'Health',
  'Education',
  'Travel',
  'Other',
];

export const DEFAULT_INCOME_CATEGORIES: string[] = [
  'Salary',
  'Freelance',
  'Business',
  'Investment',
  'Gift',
  'Other',
];

export const PAYMENT_METHODS: string[] = [
  'UPI',
  'Debit Card',
  'Credit Card',
  'Bank Transfer',
  'Net Banking',
  'Cash',
];

export const CURRENCY_CONFIG: Record<
  CurrencyCode,
  { symbol: string; locale: string; label: string }
> = {
  INR: { symbol: '₹', locale: 'en-IN', label: 'INR (₹) - Indian Rupee' },
  USD: { symbol: '$', locale: 'en-US', label: 'USD ($) - US Dollar' },
  EUR: { symbol: '€', locale: 'de-DE', label: 'EUR (€) - Euro' },
  GBP: { symbol: '£', locale: 'en-GB', label: 'GBP (£) - British Pound' },
};

export const CATEGORY_COLORS: string[] = [
  '#059669', // emerald-600
  '#0284C7', // sky-600
  '#D97706', // amber-600
  '#DC2626', // red-600
  '#0D9488', // teal-600
  '#EA580C', // orange-600
  '#4F46E5', // indigo-600
  '#DB2777', // pink-600
  '#64748B', // slate-500
];

export const DEFAULT_SETTINGS: AppSettings = {
  currency: 'INR',
  theme: 'light',
  displayName: 'Aarav',
  monthlyBudget: 25000,
};

export const DEFAULT_BUDGETS: BudgetConfig = {
  monthlyLimit: 25000,
  categoryBudgets: {
    'Food & Dining': 5000,
    Shopping: 3500,
    Transport: 2500,
    'Bills & Utilities': 3000,
    Entertainment: 2000,
  },
};

function formatLocalISO(year: number, monthIndex: number, day: number): string {
  const safeDate = new Date(year, monthIndex, day);
  const y = safeDate.getFullYear();
  const m = String(safeDate.getMonth() + 1).padStart(2, '0');
  const d = String(safeDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function createDemoTransactions(now: Date = new Date()): Transaction[] {
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayDay = now.getDate();

  const clampDay = (targetDay: number) => Math.min(targetDay, todayDay);
  const recentDay = (daysAgo: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return formatLocalISO(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const createdAt = now.toISOString();

  // Current month transactions (includes all exact sample items from Section 15)
  const currentMonthItems: Transaction[] = [
    {
      id: 'demo-tx-1',
      name: 'Monthly Salary',
      amount: 35000,
      type: 'income',
      category: 'Salary',
      date: formatLocalISO(year, month, 1),
      paymentMethod: 'Bank Transfer',
      description: 'Monthly net salary credit',
      isDemo: true,
      createdAt,
    },
    {
      id: 'demo-tx-2',
      name: 'Freelance Work',
      amount: 5000,
      type: 'income',
      category: 'Freelance',
      date: formatLocalISO(year, month, clampDay(8)),
      paymentMethod: 'UPI',
      description: 'UI design consultation project',
      isDemo: true,
      createdAt,
    },
    {
      id: 'demo-tx-3',
      name: 'Groceries',
      amount: 2500,
      type: 'expense',
      category: 'Food & Dining',
      date: recentDay(1),
      paymentMethod: 'UPI',
      description: 'Weekly supermarket groceries and produce',
      isDemo: true,
      createdAt,
    },
    {
      id: 'demo-tx-4',
      name: 'Transport',
      amount: 1200,
      type: 'expense',
      category: 'Transport',
      date: recentDay(2),
      paymentMethod: 'UPI',
      description: 'Metro pass and cab rides',
      isDemo: true,
      createdAt,
    },
    {
      id: 'demo-tx-5',
      name: 'Shopping',
      amount: 3000,
      type: 'expense',
      category: 'Shopping',
      date: recentDay(3),
      paymentMethod: 'Credit Card',
      description: 'Apparel and home accessories',
      isDemo: true,
      createdAt,
    },
    {
      id: 'demo-tx-6',
      name: 'Electricity',
      amount: 1500,
      type: 'expense',
      category: 'Bills & Utilities',
      date: formatLocalISO(year, month, clampDay(5)),
      paymentMethod: 'Net Banking',
      description: 'Monthly home electricity bill',
      isDemo: true,
      createdAt,
    },
    {
      id: 'demo-tx-7',
      name: 'Entertainment',
      amount: 800,
      type: 'expense',
      category: 'Entertainment',
      date: recentDay(4),
      paymentMethod: 'Debit Card',
      description: 'Movie tickets and streaming subscriptions',
      isDemo: true,
      createdAt,
    },
    {
      id: 'demo-tx-8',
      name: 'Food',
      amount: 1000,
      type: 'expense',
      category: 'Food & Dining',
      date: recentDay(0),
      paymentMethod: 'UPI',
      description: 'Lunch and coffee with friends',
      isDemo: true,
      createdAt,
    },
  ];

  // Prior months demo history so trend charts and month-over-month comparisons work immediately
  const historicalItems: Transaction[] = [
    // 1 month ago
    {
      id: 'demo-tx-prev-1',
      name: 'Monthly Salary',
      amount: 35000,
      type: 'income',
      category: 'Salary',
      date: formatLocalISO(year, month - 1, 1),
      paymentMethod: 'Bank Transfer',
      description: 'Monthly net salary credit',
      isDemo: true,
      createdAt,
    },
    {
      id: 'demo-tx-prev-2',
      name: 'Groceries & Kitchen',
      amount: 3400,
      type: 'expense',
      category: 'Food & Dining',
      date: formatLocalISO(year, month - 1, 9),
      paymentMethod: 'UPI',
      description: 'Monthly household staples',
      isDemo: true,
      createdAt,
    },
    {
      id: 'demo-tx-prev-3',
      name: 'Electricity & Internet',
      amount: 2400,
      type: 'expense',
      category: 'Bills & Utilities',
      date: formatLocalISO(year, month - 1, 6),
      paymentMethod: 'Net Banking',
      description: 'Utility and fiber broadband bills',
      isDemo: true,
      createdAt,
    },
    {
      id: 'demo-tx-prev-4',
      name: 'Festival Shopping',
      amount: 4200,
      type: 'expense',
      category: 'Shopping',
      date: formatLocalISO(year, month - 1, 14),
      paymentMethod: 'Credit Card',
      description: 'Gifts and clothing',
      isDemo: true,
      createdAt,
    },
    {
      id: 'demo-tx-prev-5',
      name: 'Commute & Fuel',
      amount: 1800,
      type: 'expense',
      category: 'Transport',
      date: formatLocalISO(year, month - 1, 18),
      paymentMethod: 'UPI',
      description: 'Fuel and metro top-up',
      isDemo: true,
      createdAt,
    },
    // 2 months ago
    {
      id: 'demo-tx-m2-1',
      name: 'Monthly Salary',
      amount: 35000,
      type: 'income',
      category: 'Salary',
      date: formatLocalISO(year, month - 2, 1),
      paymentMethod: 'Bank Transfer',
      description: 'Monthly net salary credit',
      isDemo: true,
      createdAt,
    },
    {
      id: 'demo-tx-m2-2',
      name: 'Dividend Payout',
      amount: 2200,
      type: 'income',
      category: 'Investment',
      date: formatLocalISO(year, month - 2, 15),
      paymentMethod: 'Bank Transfer',
      description: 'Quarterly mutual fund dividend',
      isDemo: true,
      createdAt,
    },
    {
      id: 'demo-tx-m2-3',
      name: 'Dining & Groceries',
      amount: 4100,
      type: 'expense',
      category: 'Food & Dining',
      date: formatLocalISO(year, month - 2, 12),
      paymentMethod: 'UPI',
      description: 'Groceries and weekend dining',
      isDemo: true,
      createdAt,
    },
    {
      id: 'demo-tx-m2-4',
      name: 'Health Checkup',
      amount: 2600,
      type: 'expense',
      category: 'Health',
      date: formatLocalISO(year, month - 2, 20),
      paymentMethod: 'Debit Card',
      description: 'Annual dental & lab screening',
      isDemo: true,
      createdAt,
    },
    {
      id: 'demo-tx-m2-5',
      name: 'Utility Bills',
      amount: 2200,
      type: 'expense',
      category: 'Bills & Utilities',
      date: formatLocalISO(year, month - 2, 7),
      paymentMethod: 'Net Banking',
      description: 'Power and mobile postpaid',
      isDemo: true,
      createdAt,
    },
    // 3 months ago
    {
      id: 'demo-tx-m3-1',
      name: 'Monthly Salary',
      amount: 34000,
      type: 'income',
      category: 'Salary',
      date: formatLocalISO(year, month - 3, 1),
      paymentMethod: 'Bank Transfer',
      description: 'Monthly net salary credit',
      isDemo: true,
      createdAt,
    },
    {
      id: 'demo-tx-m3-2',
      name: 'Online Course',
      amount: 3200,
      type: 'expense',
      category: 'Education',
      date: formatLocalISO(year, month - 3, 11),
      paymentMethod: 'Credit Card',
      description: 'TypeScript & system design course',
      isDemo: true,
      createdAt,
    },
    {
      id: 'demo-tx-m3-3',
      name: 'Groceries & Food',
      amount: 3800,
      type: 'expense',
      category: 'Food & Dining',
      date: formatLocalISO(year, month - 3, 17),
      paymentMethod: 'UPI',
      description: 'Supermarket & takeout',
      isDemo: true,
      createdAt,
    },
    {
      id: 'demo-tx-m3-4',
      name: 'Weekend Trip',
      amount: 4500,
      type: 'expense',
      category: 'Travel',
      date: formatLocalISO(year, month - 3, 24),
      paymentMethod: 'Credit Card',
      description: 'Train tickets and hotel stay',
      isDemo: true,
      createdAt,
    },
  ];

  return [...currentMonthItems, ...historicalItems];
}

export function createDemoGoals(now: Date = new Date()): SavingsGoal[] {
  const createdAt = now.toISOString();
  const futureDate = (monthsAhead: number) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() + monthsAhead);
    return formatLocalISO(d.getFullYear(), d.getMonth(), d.getDate());
  };

  return [
    {
      id: 'demo-goal-1',
      name: 'Emergency Fund',
      targetAmount: 100000,
      currentAmount: 45000,
      targetDate: futureDate(8),
      isDemo: true,
      createdAt,
    },
    {
      id: 'demo-goal-2',
      name: 'Buy a Laptop',
      targetAmount: 85000,
      currentAmount: 52000,
      targetDate: futureDate(4),
      isDemo: true,
      createdAt,
    },
    {
      id: 'demo-goal-3',
      name: 'Vacation',
      targetAmount: 40000,
      currentAmount: 18500,
      targetDate: futureDate(5),
      isDemo: true,
      createdAt,
    },
  ];
}
