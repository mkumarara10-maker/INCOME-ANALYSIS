import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  LayoutDashboard,
  Menu,
  Moon,
  Plus,
  Settings as SettingsIcon,
  Sun,
  Target,
  Wallet,
  X,
} from 'lucide-react';
import { ConfirmModal } from './components/ConfirmModal';
import { ToastContainer } from './components/ToastContainer';
import { TransactionModal } from './components/TransactionModal';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { DashboardPage } from './pages/DashboardPage';
import { GoalsPage } from './pages/GoalsPage';
import { SettingsPage } from './pages/SettingsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import {
  AppSettings,
  BudgetConfig,
  CustomCategories,
  NavSection,
  SavingsGoal,
  ToastMessage,
  Transaction,
  TransactionType,
} from './types/finance';
import {
  createDemoGoals,
  createDemoTransactions,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_SETTINGS,
} from './utils/constants';
import { downloadCSVFile, exportTransactionsToCSV, parseTransactionsFromCSV } from './utils/csv';
import { formatCurrency } from './utils/formatters';
import {
  loadAppState,
  saveBudgets,
  saveCustomCategories,
  saveGoals,
  saveSettings,
  saveTransactions,
} from './utils/storage';

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'budgets', label: 'Budgets', icon: Wallet },
  { id: 'goals', label: 'Savings Goals', icon: Target },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

type ConfirmActionState =
  | { type: 'delete_tx'; tx: Transaction }
  | { type: 'delete_goal'; goal: SavingsGoal }
  | { type: 'remove_demo' }
  | { type: 'reset_settings' }
  | { type: 'clear_all' }
  | null;

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const initialState = useMemo(() => loadAppState(), []);

  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>(initialState.transactions);
  const [budgets, setBudgets] = useState<BudgetConfig>(initialState.budgets);
  const [goals, setGoals] = useState<SavingsGoal[]>(initialState.goals);
  const [settings, setSettings] = useState<AppSettings>(initialState.settings);
  const [customCategories, setCustomCategories] = useState<CustomCategories>(
    initialState.customCategories
  );

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmActionState>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback(
    (type: ToastMessage['type'], title: string, description?: string) => {
      const id = generateId('toast');
      setToasts((prev) => [...prev.slice(-3), { id, type, title, description }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Warn once if initial storage load hit an error
  useEffect(() => {
    if (initialState.storageError) {
      pushToast('warning', 'Storage Notice', initialState.storageError);
    }
  }, [initialState.storageError, pushToast]);

  // Apply light/dark theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', settings.theme === 'dark');
  }, [settings.theme]);

  const incomeCategories = useMemo(
    () => Array.from(new Set([...DEFAULT_INCOME_CATEGORIES, ...customCategories.income])),
    [customCategories.income]
  );

  const expenseCategories = useMemo(
    () => Array.from(new Set([...DEFAULT_EXPENSE_CATEGORIES, ...customCategories.expense])),
    [customCategories.expense]
  );

  const allCategories = useMemo(
    () => Array.from(new Set([...expenseCategories, ...incomeCategories])),
    [expenseCategories, incomeCategories]
  );

  const hasDemoData = useMemo(
    () => transactions.some((t) => t.isDemo) || goals.some((g) => g.isDemo),
    [transactions, goals]
  );

  // Persistence helpers
  const commitTransactions = useCallback(
    (next: Transaction[]) => {
      setTransactions(next);
      const res = saveTransactions(next);
      if (!res.ok) pushToast('error', 'Save failed', res.error);
    },
    [pushToast]
  );

  const commitBudgets = useCallback(
    (next: BudgetConfig) => {
      setBudgets(next);
      const res = saveBudgets(next);
      if (!res.ok) pushToast('error', 'Save failed', res.error);
    },
    [pushToast]
  );

  const commitGoals = useCallback(
    (next: SavingsGoal[]) => {
      setGoals(next);
      const res = saveGoals(next);
      if (!res.ok) pushToast('error', 'Save failed', res.error);
    },
    [pushToast]
  );

  const commitSettings = useCallback(
    (next: AppSettings) => {
      setSettings(next);
      const res = saveSettings(next);
      if (!res.ok) pushToast('error', 'Save failed', res.error);
    },
    [pushToast]
  );

  const commitCustomCategories = useCallback(
    (next: CustomCategories) => {
      setCustomCategories(next);
      const res = saveCustomCategories(next);
      if (!res.ok) pushToast('error', 'Save failed', res.error);
    },
    [pushToast]
  );

  // Transaction Handlers
  const handleSaveTransaction = (
    data: Omit<Transaction, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      const updated = transactions.map((tx) =>
        tx.id === existingId ? { ...tx, ...data } : tx
      );
      commitTransactions(updated);
      pushToast(
        'success',
        'Transaction updated',
        `${data.name} (${formatCurrency(data.amount, settings.currency)})`
      );
    } else {
      const newTx: Transaction = {
        ...data,
        id: generateId('tx'),
        createdAt: new Date().toISOString(),
      };
      commitTransactions([newTx, ...transactions]);
      pushToast(
        'success',
        'Transaction added',
        `${data.name} (${formatCurrency(data.amount, settings.currency)})`
      );
    }
  };

  // Custom Category Handlers
  const handleAddCustomCategory = (type: TransactionType, rawName: string): boolean => {
    const trimmed = rawName.trim();
    if (!trimmed) return false;
    const existingList = type === 'income' ? incomeCategories : expenseCategories;
    if (existingList.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      pushToast('info', 'Category exists', `"${trimmed}" is already available.`);
      return false;
    }
    const next: CustomCategories = {
      ...customCategories,
      [type]: [...customCategories[type], trimmed],
    };
    commitCustomCategories(next);
    pushToast('success', 'Category added', `"${trimmed}" added to ${type} categories.`);
    return true;
  };

  const handleRemoveCustomCategory = (type: TransactionType, category: string) => {
    const next: CustomCategories = {
      ...customCategories,
      [type]: customCategories[type].filter((c) => c !== category),
    };
    commitCustomCategories(next);
    pushToast('success', 'Category removed', `"${category}" removed.`);
  };

  // Budget Handlers
  const handleUpdateMonthlyLimit = (limit: number) => {
    commitBudgets({ ...budgets, monthlyLimit: limit });
    commitSettings({ ...settings, monthlyBudget: limit });
    pushToast(
      'success',
      'Monthly budget updated',
      `Set to ${formatCurrency(limit, settings.currency)}`
    );
  };

  const handleSetCategoryBudget = (category: string, limit: number) => {
    commitBudgets({
      ...budgets,
      categoryBudgets: {
        ...budgets.categoryBudgets,
        [category]: limit,
      },
    });
    pushToast(
      'success',
      'Category budget saved',
      `${category}: ${formatCurrency(limit, settings.currency)}`
    );
  };

  const handleRemoveCategoryBudget = (category: string) => {
    const nextMap = { ...budgets.categoryBudgets };
    delete nextMap[category];
    commitBudgets({ ...budgets, categoryBudgets: nextMap });
    pushToast('success', 'Category budget removed', category);
  };

  // Goal Handlers
  const handleCreateGoal = (data: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
    const created: SavingsGoal = {
      ...data,
      id: generateId('goal'),
      createdAt: new Date().toISOString(),
    };
    commitGoals([created, ...goals]);
    pushToast('success', 'Savings goal created', data.name);
  };

  const handleUpdateGoal = (id: string, data: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
    commitGoals(goals.map((g) => (g.id === id ? { ...g, ...data } : g)));
    pushToast('success', 'Savings goal updated', data.name);
  };

  const handleAdjustGoalAmount = (id: string, delta: number) => {
    const target = goals.find((g) => g.id === id);
    if (!target) return;
    const nextAmount = Math.max(0, Math.round((target.currentAmount + delta) * 100) / 100);
    commitGoals(goals.map((g) => (g.id === id ? { ...g, currentAmount: nextAmount } : g)));
    pushToast(
      'success',
      delta >= 0 ? 'Funds added to goal' : 'Funds withdrawn from goal',
      `${target.name}: ${formatCurrency(Math.abs(delta), settings.currency)}`
    );
  };

  // Settings & CSV Handlers
  const handleUpdateSettings = (partial: Partial<AppSettings>) => {
    const next = { ...settings, ...partial };
    commitSettings(next);
    if (typeof partial.monthlyBudget === 'number' && partial.monthlyBudget > 0) {
      commitBudgets({ ...budgets, monthlyLimit: partial.monthlyBudget });
    }
    if (partial.currency) {
      pushToast('success', 'Currency updated', `Switched to ${partial.currency}`);
    } else if (partial.theme) {
      pushToast(
        'success',
        'Theme updated',
        `Switched to ${partial.theme === 'dark' ? 'Dark' : 'Light'} mode`
      );
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      pushToast('warning', 'Nothing to export', 'Add transactions before exporting CSV.');
      return;
    }
    const csv = exportTransactionsToCSV(transactions);
    downloadCSVFile(csv, 'smart-expense-tracker-transactions.csv');
    pushToast('success', 'CSV exported', `${transactions.length} transactions downloaded.`);
  };

  const handleImportCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      const result = parseTransactionsFromCSV(content);
      if (result.transactions.length === 0) {
        pushToast(
          'error',
          'Import failed',
          result.errors[0] || 'No valid transactions found in CSV.'
        );
        return;
      }

      const nowIso = new Date().toISOString();
      const newRecords: Transaction[] = result.transactions.map((item) => ({
        ...item,
        id: generateId('tx'),
        createdAt: nowIso,
      }));

      // Register any unrecognized categories automatically
      const nextCustom = {
        income: [...customCategories.income],
        expense: [...customCategories.expense],
      };
      for (const rec of newRecords) {
        const baseList =
          rec.type === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
        if (
          !baseList.includes(rec.category) &&
          !nextCustom[rec.type].includes(rec.category)
        ) {
          nextCustom[rec.type].push(rec.category);
        }
      }
      commitCustomCategories(nextCustom);
      commitTransactions([...newRecords, ...transactions]);

      if (result.errors.length > 0) {
        pushToast(
          'warning',
          `Imported ${newRecords.length} transactions`,
          `${result.errors.length} row(s) skipped due to validation errors.`
        );
      } else {
        pushToast(
          'success',
          'CSV imported',
          `Successfully added ${newRecords.length} transaction(s).`
        );
      }
    };
    reader.onerror = () => {
      pushToast('error', 'File read error', 'Unable to read the selected CSV file.');
    };
    reader.readAsText(file);
  };

  const handleRestoreDemoData = () => {
    const demoTx = createDemoTransactions();
    const demoGoals = createDemoGoals();
    const nonDemoTx = transactions.filter((t) => !t.isDemo);
    const nonDemoGoals = goals.filter((g) => !g.isDemo);
    commitTransactions([...demoTx, ...nonDemoTx]);
    commitGoals([...demoGoals, ...nonDemoGoals]);
    pushToast('success', 'Demo data loaded', 'Sample transactions and goals have been added.');
  };

  // Confirmation execution
  const handleConfirmAction = () => {
    if (!confirmAction) return;
    switch (confirmAction.type) {
      case 'delete_tx': {
        commitTransactions(transactions.filter((t) => t.id !== confirmAction.tx.id));
        pushToast('success', 'Transaction deleted', confirmAction.tx.name);
        break;
      }
      case 'delete_goal': {
        commitGoals(goals.filter((g) => g.id !== confirmAction.goal.id));
        pushToast('success', 'Savings goal deleted', confirmAction.goal.name);
        break;
      }
      case 'remove_demo': {
        commitTransactions(transactions.filter((t) => !t.isDemo));
        commitGoals(goals.filter((g) => !g.isDemo));
        pushToast('success', 'Demo data removed', 'Sample records have been cleared.');
        break;
      }
      case 'reset_settings': {
        commitSettings(DEFAULT_SETTINGS);
        commitBudgets({
          ...budgets,
          monthlyLimit: DEFAULT_SETTINGS.monthlyBudget,
        });
        pushToast('success', 'Settings reset', 'Application preferences restored to defaults.');
        break;
      }
      case 'clear_all': {
        commitTransactions([]);
        commitGoals([]);
        commitBudgets({
          monthlyLimit: settings.monthlyBudget,
          categoryBudgets: {},
        });
        commitCustomCategories({ income: [], expense: [] });
        pushToast('success', 'All data cleared', 'Your ledger has been wiped clean.');
        break;
      }
    }
    setConfirmAction(null);
  };

  const getConfirmModalProps = () => {
    if (!confirmAction) return null;
    switch (confirmAction.type) {
      case 'delete_tx':
        return {
          title: 'Delete Transaction',
          message: `Are you sure you want to delete "${confirmAction.tx.name}" (${formatCurrency(
            confirmAction.tx.amount,
            settings.currency
          )})? This action cannot be undone.`,
          confirmLabel: 'Delete',
          variant: 'danger' as const,
        };
      case 'delete_goal':
        return {
          title: 'Delete Savings Goal',
          message: `Are you sure you want to delete the goal "${confirmAction.goal.name}"?`,
          confirmLabel: 'Delete Goal',
          variant: 'danger' as const,
        };
      case 'remove_demo':
        return {
          title: 'Remove Demo Data',
          message:
            'This will permanently remove all sample demo transactions and demo goals while keeping any records you created.',
          confirmLabel: 'Remove Demo Data',
          variant: 'warning' as const,
        };
      case 'reset_settings':
        return {
          title: 'Reset Application Settings',
          message:
            'Restore display name, currency (INR ₹), theme (Light), and default monthly budget back to initial defaults? Your transactions will remain intact.',
          confirmLabel: 'Reset Settings',
          variant: 'warning' as const,
        };
      case 'clear_all':
        return {
          title: 'Clear All Financial Data',
          message:
            'This will permanently delete all transactions, category budgets, savings goals, and custom categories from LocalStorage.',
          confirmLabel: 'Clear Everything',
          variant: 'danger' as const,
        };
    }
  };

  const confirmProps = getConfirmModalProps();
  const activeNavItem = NAV_ITEMS.find((n) => n.id === activeSection) || NAV_ITEMS[0];

  const handleNavigate = (section: NavSection) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-30">
        <div className="h-16 px-6 flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
          <span className="font-display font-bold text-base tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
            Smart Expense
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Primary Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="truncate font-medium text-slate-700 dark:text-slate-300">
              {settings.displayName}
            </span>
            <span className="font-mono">{settings.currency}</span>
          </div>
        </div>
      </aside>

      {/* Mobile Slide-Over Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-10">
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
                  Smart Expense
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                {activeNavItem.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() =>
                handleUpdateSettings({
                  theme: settings.theme === 'dark' ? 'light' : 'dark',
                })
              }
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={`Switch to ${settings.theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${settings.theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingTx(null);
                setTxModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Transaction</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {activeSection === 'dashboard' && (
            <DashboardPage
              transactions={transactions}
              budgets={budgets}
              currency={settings.currency}
              theme={settings.theme}
              hasDemoData={hasDemoData}
              onAddTransaction={() => {
                setEditingTx(null);
                setTxModalOpen(true);
              }}
              onNavigate={handleNavigate}
              onRequestRemoveDemo={() => setConfirmAction({ type: 'remove_demo' })}
            />
          )}

          {activeSection === 'transactions' && (
            <TransactionsPage
              transactions={transactions}
              currency={settings.currency}
              allCategories={allCategories}
              onAddTransaction={() => {
                setEditingTx(null);
                setTxModalOpen(true);
              }}
              onEditTransaction={(tx) => {
                setEditingTx(tx);
                setTxModalOpen(true);
              }}
              onDeleteTransaction={(tx) => setConfirmAction({ type: 'delete_tx', tx })}
            />
          )}

          {activeSection === 'budgets' && (
            <BudgetsPage
              transactions={transactions}
              budgets={budgets}
              currency={settings.currency}
              expenseCategories={expenseCategories}
              onUpdateMonthlyLimit={handleUpdateMonthlyLimit}
              onSetCategoryBudget={handleSetCategoryBudget}
              onRemoveCategoryBudget={handleRemoveCategoryBudget}
            />
          )}

          {activeSection === 'goals' && (
            <GoalsPage
              goals={goals}
              currency={settings.currency}
              onCreateGoal={handleCreateGoal}
              onUpdateGoal={handleUpdateGoal}
              onDeleteGoal={(goal) => setConfirmAction({ type: 'delete_goal', goal })}
              onAdjustGoalAmount={handleAdjustGoalAmount}
            />
          )}

          {activeSection === 'analytics' && (
            <AnalyticsPage
              transactions={transactions}
              budgets={budgets}
              currency={settings.currency}
              theme={settings.theme}
            />
          )}

          {activeSection === 'settings' && (
            <SettingsPage
              settings={settings}
              transactions={transactions}
              customCategories={customCategories}
              hasDemoData={hasDemoData}
              onUpdateSettings={handleUpdateSettings}
              onAddCustomCategory={handleAddCustomCategory}
              onRemoveCustomCategory={handleRemoveCustomCategory}
              onExportCSV={handleExportCSV}
              onImportCSVFile={handleImportCSVFile}
              onRequestRemoveDemo={() => setConfirmAction({ type: 'remove_demo' })}
              onRestoreDemoData={handleRestoreDemoData}
              onRequestResetSettings={() => setConfirmAction({ type: 'reset_settings' })}
              onRequestClearAllData={() => setConfirmAction({ type: 'clear_all' })}
            />
          )}
        </main>
      </div>

      {/* Add / Edit Transaction Modal */}
      <TransactionModal
        isOpen={txModalOpen}
        editingTransaction={editingTx}
        currency={settings.currency}
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
        onAddCustomCategory={handleAddCustomCategory}
        onSave={handleSaveTransaction}
        onClose={() => {
          setTxModalOpen(false);
          setEditingTx(null);
        }}
      />

      {/* Confirmation Modal */}
      {confirmProps && (
        <ConfirmModal
          isOpen={Boolean(confirmAction)}
          title={confirmProps.title}
          message={confirmProps.message}
          confirmLabel={confirmProps.confirmLabel}
          variant={confirmProps.variant}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
