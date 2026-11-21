import {
  AppSettings,
  BudgetConfig,
  CustomCategories,
  SavingsGoal,
  Transaction,
} from '../types/finance';
import {
  createDemoGoals,
  createDemoTransactions,
  DEFAULT_BUDGETS,
  DEFAULT_SETTINGS,
} from './constants';

const STORAGE_KEYS = {
  TRANSACTIONS: 'smart_expense_tracker_transactions_v1',
  BUDGETS: 'smart_expense_tracker_budgets_v1',
  GOALS: 'smart_expense_tracker_goals_v1',
  SETTINGS: 'smart_expense_tracker_settings_v1',
  CATEGORIES: 'smart_expense_tracker_categories_v1',
  INITIALIZED: 'smart_expense_tracker_initialized_v1',
} as const;

export interface StorageResult<T> {
  data: T;
  error?: string;
}

function safeReadJSON<T>(key: string, fallback: T): { value: T; error?: string } {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { value: fallback };
    }
    const raw = window.localStorage.getItem(key);
    if (!raw) return { value: fallback };
    const parsed = JSON.parse(raw) as T;
    return { value: parsed };
  } catch (err) {
    return {
      value: fallback,
      error: err instanceof Error ? err.message : 'Unable to read from LocalStorage',
    };
  }
}

export function safeWriteJSON<T>(key: string, value: T): { ok: boolean; error?: string } {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { ok: false, error: 'LocalStorage is not available' };
    }
    window.localStorage.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unable to save to LocalStorage',
    };
  }
}

export interface PersistedAppState {
  transactions: Transaction[];
  budgets: BudgetConfig;
  goals: SavingsGoal[];
  settings: AppSettings;
  customCategories: CustomCategories;
  storageError?: string;
}

export function loadAppState(): PersistedAppState {
  let initialized = false;
  try {
    initialized = Boolean(window.localStorage.getItem(STORAGE_KEYS.INITIALIZED));
  } catch {
    initialized = false;
  }

  if (!initialized) {
    const demoTx = createDemoTransactions();
    const demoGoals = createDemoGoals();
    safeWriteJSON(STORAGE_KEYS.TRANSACTIONS, demoTx);
    safeWriteJSON(STORAGE_KEYS.BUDGETS, DEFAULT_BUDGETS);
    safeWriteJSON(STORAGE_KEYS.GOALS, demoGoals);
    safeWriteJSON(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    safeWriteJSON(STORAGE_KEYS.CATEGORIES, { income: [], expense: [] });
    safeWriteJSON(STORAGE_KEYS.INITIALIZED, true);

    return {
      transactions: demoTx,
      budgets: DEFAULT_BUDGETS,
      goals: demoGoals,
      settings: DEFAULT_SETTINGS,
      customCategories: { income: [], expense: [] },
    };
  }

  const txRes = safeReadJSON<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
  const budgetsRes = safeReadJSON<BudgetConfig>(STORAGE_KEYS.BUDGETS, DEFAULT_BUDGETS);
  const goalsRes = safeReadJSON<SavingsGoal[]>(STORAGE_KEYS.GOALS, []);
  const settingsRes = safeReadJSON<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  const categoriesRes = safeReadJSON<CustomCategories>(STORAGE_KEYS.CATEGORIES, {
    income: [],
    expense: [],
  });

  const error =
    txRes.error ||
    budgetsRes.error ||
    goalsRes.error ||
    settingsRes.error ||
    categoriesRes.error;

  return {
    transactions: Array.isArray(txRes.value) ? txRes.value : [],
    budgets: {
      monthlyLimit: budgetsRes.value?.monthlyLimit ?? DEFAULT_BUDGETS.monthlyLimit,
      categoryBudgets: budgetsRes.value?.categoryBudgets ?? DEFAULT_BUDGETS.categoryBudgets,
    },
    goals: Array.isArray(goalsRes.value) ? goalsRes.value : [],
    settings: { ...DEFAULT_SETTINGS, ...(settingsRes.value || {}) },
    customCategories: {
      income: Array.isArray(categoriesRes.value?.income) ? categoriesRes.value.income : [],
      expense: Array.isArray(categoriesRes.value?.expense) ? categoriesRes.value.expense : [],
    },
    storageError: error,
  };
}

export function saveTransactions(transactions: Transaction[]) {
  return safeWriteJSON(STORAGE_KEYS.TRANSACTIONS, transactions);
}

export function saveBudgets(budgets: BudgetConfig) {
  return safeWriteJSON(STORAGE_KEYS.BUDGETS, budgets);
}

export function saveGoals(goals: SavingsGoal[]) {
  return safeWriteJSON(STORAGE_KEYS.GOALS, goals);
}

export function saveSettings(settings: AppSettings) {
  return safeWriteJSON(STORAGE_KEYS.SETTINGS, settings);
}

export function saveCustomCategories(categories: CustomCategories) {
  return safeWriteJSON(STORAGE_KEYS.CATEGORIES, categories);
}
