import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  Moon,
  Plus,
  RotateCcw,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  AppSettings,
  CurrencyCode,
  CustomCategories,
  Transaction,
  TransactionType,
} from '../types/finance';
import {
  CURRENCY_CONFIG,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from '../utils/constants';

interface SettingsPageProps {
  settings: AppSettings;
  transactions: Transaction[];
  customCategories: CustomCategories;
  hasDemoData: boolean;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  onAddCustomCategory: (type: TransactionType, category: string) => boolean;
  onRemoveCustomCategory: (type: TransactionType, category: string) => void;
  onExportCSV: () => void;
  onImportCSVFile: (file: File) => void;
  onRequestRemoveDemo: () => void;
  onRestoreDemoData: () => void;
  onRequestResetSettings: () => void;
  onRequestClearAllData: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  transactions,
  customCategories,
  hasDemoData,
  onUpdateSettings,
  onAddCustomCategory,
  onRemoveCustomCategory,
  onExportCSV,
  onImportCSVFile,
  onRequestRemoveDemo,
  onRestoreDemoData,
  onRequestResetSettings,
  onRequestClearAllData,
}) => {
  const [displayName, setDisplayName] = useState(settings.displayName);
  const [monthlyBudget, setMonthlyBudget] = useState(String(settings.monthlyBudget));
  const [profileSavedMsg, setProfileSavedMsg] = useState('');

  useEffect(() => {
    setDisplayName(settings.displayName);
    setMonthlyBudget(String(settings.monthlyBudget));
  }, [settings.displayName, settings.monthlyBudget]);

  const [newCatType, setNewCatType] = useState<TransactionType>('expense');
  const [newCatName, setNewCatName] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = displayName.trim() || 'User';
    const parsedBudget = Number.parseFloat(monthlyBudget);
    const validBudget =
      Number.isFinite(parsedBudget) && parsedBudget > 0
        ? Math.round(parsedBudget * 100) / 100
        : settings.monthlyBudget;

    onUpdateSettings({
      displayName: trimmed,
      monthlyBudget: validBudget,
    });
    setDisplayName(trimmed);
    setMonthlyBudget(String(validBudget));
    setProfileSavedMsg('Preferences saved.');
    setTimeout(() => setProfileSavedMsg(''), 2500);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    const added = onAddCustomCategory(newCatType, trimmed);
    if (added) {
      setNewCatName('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportCSVFile(file);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* General Preferences */}
      <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Profile & Preferences
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Customize your display name, default currency, theme, and monthly budget target.
        </p>

        <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="settings-name"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
              >
                Display Name
              </label>
              <input
                id="settings-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="settings-currency"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
              >
                Currency
              </label>
              <select
                id="settings-currency"
                value={settings.currency}
                onChange={(e) =>
                  onUpdateSettings({ currency: e.target.value as CurrencyCode })
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                {(Object.keys(CURRENCY_CONFIG) as CurrencyCode[]).map((code) => (
                  <option key={code} value={code}>
                    {CURRENCY_CONFIG[code].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="settings-budget"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
              >
                Default Monthly Spending Limit ({CURRENCY_CONFIG[settings.currency].symbol})
              </label>
              <input
                id="settings-budget"
                type="number"
                min="1"
                step="1"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Appearance Theme
              </span>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ theme: 'light' })}
                  className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
                    settings.theme === 'light'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ theme: 'dark' })}
                  className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
                    settings.theme === 'dark'
                      ? 'bg-slate-900 text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  Dark
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              Save Preferences
            </button>
            {profileSavedMsg && (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {profileSavedMsg}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Categories Management */}
      <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Categories
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Add custom categories to tailor transaction tracking and budgets.
          </p>
        </div>

        <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-3">
          <select
            value={newCatType}
            onChange={(e) => setNewCatType(e.target.value as TransactionType)}
            className="sm:w-40 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Custom category name (e.g. Subscriptions)"
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Expense Categories
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_EXPENSE_CATEGORIES.map((cat) => (
                <span
                  key={cat}
                  className="px-2.5 py-1 text-xs rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  {cat}
                </span>
              ))}
              {customCategories.expense.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                >
                  {cat}
                  <button
                    type="button"
                    onClick={() => onRemoveCustomCategory('expense', cat)}
                    className="hover:text-red-600 dark:hover:text-red-400"
                    aria-label={`Remove ${cat}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Income Categories
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_INCOME_CATEGORIES.map((cat) => (
                <span
                  key={cat}
                  className="px-2.5 py-1 text-xs rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  {cat}
                </span>
              ))}
              {customCategories.income.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                >
                  {cat}
                  <button
                    type="button"
                    onClick={() => onRemoveCustomCategory('income', cat)}
                    className="hover:text-red-600 dark:hover:text-red-400"
                    aria-label={`Remove ${cat}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Data Import & Export */}
      <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            CSV Import & Export
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Export your ledger for backup or import transactions from a CSV file (columns: Name, Amount, Type, Category, Date, Payment Method, Description).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={transactions.length === 0}
            onClick={onExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Transactions CSV ({transactions.length})
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
          >
            <Upload className="w-4 h-4" />
            Import Transactions CSV
          </button>
        </div>
      </div>

      {/* Data & Reset Controls */}
      <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Data Management & Reset
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            All records are stored locally in your browser&apos;s LocalStorage. Manage demo data or reset your workspace below.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {hasDemoData ? (
            <button
              type="button"
              onClick={onRequestRemoveDemo}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Remove Demo Data
            </button>
          ) : (
            <button
              type="button"
              onClick={onRestoreDemoData}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Load Sample Demo Data
            </button>
          )}

          <button
            type="button"
            onClick={onRequestResetSettings}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Settings
          </button>

          <button
            type="button"
            onClick={onRequestClearAllData}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
};
