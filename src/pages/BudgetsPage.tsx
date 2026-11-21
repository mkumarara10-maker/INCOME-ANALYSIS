import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  BudgetConfig,
  BudgetHealth,
  CurrencyCode,
  Transaction,
} from '../types/finance';
import { computeBudgetStatuses } from '../utils/analytics';
import { getCategoryIcon } from '../utils/categoryIcons';
import { CURRENCY_CONFIG } from '../utils/constants';
import { formatCurrency } from '../utils/formatters';

interface BudgetsPageProps {
  transactions: Transaction[];
  budgets: BudgetConfig;
  currency: CurrencyCode;
  expenseCategories: string[];
  onUpdateMonthlyLimit: (limit: number) => void;
  onSetCategoryBudget: (category: string, limit: number) => void;
  onRemoveCategoryBudget: (category: string) => void;
}

export const BudgetsPage: React.FC<BudgetsPageProps> = ({
  transactions,
  budgets,
  currency,
  expenseCategories,
  onUpdateMonthlyLimit,
  onSetCategoryBudget,
  onRemoveCategoryBudget,
}) => {
  const [editingMonthly, setEditingMonthly] = useState(false);
  const [monthlyInput, setMonthlyInput] = useState(String(budgets.monthlyLimit));
  const [monthlyError, setMonthlyError] = useState('');

  const [selectedCat, setSelectedCat] = useState('');
  const [catLimitInput, setCatLimitInput] = useState('');
  const [catError, setCatError] = useState('');

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCatLimit, setEditCatLimit] = useState('');

  const { overall, categories, alerts } = useMemo(
    () => computeBudgetStatuses(transactions, budgets),
    [transactions, budgets]
  );

  const unbudgetedCategories = useMemo(
    () =>
      expenseCategories.filter(
        (cat) => !budgets.categoryBudgets[cat] || budgets.categoryBudgets[cat] <= 0
      ),
    [expenseCategories, budgets.categoryBudgets]
  );

  const currencySymbol = CURRENCY_CONFIG[currency]?.symbol || '₹';

  const handleSaveMonthly = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number.parseFloat(monthlyInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setMonthlyError('Enter a monthly limit greater than 0.');
      return;
    }
    setMonthlyError('');
    onUpdateMonthlyLimit(Math.round(parsed * 100) / 100);
    setEditingMonthly(false);
  };

  const handleAddCategoryBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const targetCategory = selectedCat || unbudgetedCategories[0];
    if (!targetCategory) {
      setCatError('All categories already have budgets.');
      return;
    }
    const parsed = Number.parseFloat(catLimitInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setCatError('Enter a valid budget limit greater than 0.');
      return;
    }
    setCatError('');
    onSetCategoryBudget(targetCategory, Math.round(parsed * 100) / 100);
    setSelectedCat('');
    setCatLimitInput('');
  };

  const handleSaveCategoryEdit = (category: string) => {
    const parsed = Number.parseFloat(editCatLimit);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    onSetCategoryBudget(category, Math.round(parsed * 100) / 100);
    setEditingCategory(null);
    setEditCatLimit('');
  };

  const renderStatusLabel = (health: BudgetHealth) => {
    if (health === 'over') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Over budget
        </span>
      );
    }
    if (health === 'near') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Near budget
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        Within budget
      </span>
    );
  };

  const getBarColor = (health: BudgetHealth) => {
    if (health === 'over') return 'bg-red-500';
    if (health === 'near') return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-6">
      {/* Active Budget Alerts */}
      {alerts.length > 0 && (
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Active Budget Alerts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((alert) => (
              <div
                key={alert.category}
                className={`flex items-start gap-3 p-3 rounded-lg border text-xs ${
                  alert.health === 'over'
                    ? 'bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200'
                    : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
                }`}
              >
                {alert.health === 'over' ? (
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{alert.category}</p>
                  <p className="mt-0.5">
                    {alert.health === 'over'
                      ? `Exceeded limit by ${formatCurrency(Math.abs(alert.remaining), currency)} (${alert.percentage.toFixed(0)}% used).`
                      : `Reached ${alert.percentage.toFixed(0)}% of limit (${formatCurrency(alert.remaining, currency)} remaining).`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall Monthly Spending Limit */}
      <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Monthly Spending Limit
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tracks all expenses recorded in the current calendar month
            </p>
          </div>

          {!editingMonthly ? (
            <button
              type="button"
              onClick={() => {
                setMonthlyInput(String(budgets.monthlyLimit));
                setEditingMonthly(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors self-start sm:self-auto"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Limit
            </button>
          ) : (
            <form onSubmit={handleSaveMonthly} className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={monthlyInput}
                  onChange={(e) => setMonthlyInput(e.target.value)}
                  className="w-36 pl-7 pr-2.5 py-1.5 text-sm font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingMonthly(false);
                  setMonthlyError('');
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </form>
          )}
        </div>
        {monthlyError && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">{monthlyError}</p>
        )}

        <div className="mt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {formatCurrency(overall.spent, currency)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                of {formatCurrency(overall.limit, currency)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {renderStatusLabel(overall.health)}
              <span className="text-xs font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                {overall.percentage.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getBarColor(overall.health)}`}
              style={{ width: `${Math.min(100, Math.max(0, overall.percentage))}%` }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            <span>
              {overall.remaining >= 0
                ? `${formatCurrency(overall.remaining, currency)} remaining this month`
                : `Exceeded by ${formatCurrency(Math.abs(overall.remaining), currency)}`}
            </span>
            <span>80% warning threshold</span>
          </div>
        </div>
      </div>

      {/* Add Category Budget Form */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
          Set Category Budget
        </h3>
        {unbudgetedCategories.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            All expense categories currently have monthly budgets assigned. You can edit any category below.
          </p>
        ) : (
          <form
            onSubmit={handleAddCategoryBudget}
            className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
          >
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Expense Category
              </label>
              <select
                value={selectedCat || unbudgetedCategories[0]}
                onChange={(e) => setSelectedCat(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                {unbudgetedCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:w-48">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Monthly Limit ({currencySymbol})
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={catLimitInput}
                onChange={(e) => {
                  setCatLimitInput(e.target.value);
                  if (catError) setCatError('');
                }}
                placeholder="e.g. 5000"
                className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              Set Budget
            </button>
          </form>
        )}
        {catError && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">{catError}</p>
        )}
      </div>

      {/* Category Budgets Grid */}
      {categories.length === 0 ? (
        <div className="p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            No category budgets configured
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Use the form above to assign spending limits for categories like Food & Dining or Shopping.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((item) => {
            const isEditing = editingCategory === item.category;
            return (
              <div
                key={item.category}
                className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                      {getCategoryIcon(item.category, 'w-4 h-4')}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {item.category}
                      </h4>
                      <div className="mt-0.5">{renderStatusLabel(item.health)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(item.category);
                        setEditCatLimit(String(item.limit));
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      aria-label={`Edit ${item.category} budget`}
                      title="Edit limit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveCategoryBudget(item.category)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      aria-label={`Remove ${item.category} budget`}
                      title="Remove budget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={editCatLimit}
                      onChange={(e) => setEditCatLimit(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-sm font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveCategoryEdit(item.category)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCategory(null)}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline justify-between text-xs font-mono tabular-nums">
                      <span className="text-slate-900 dark:text-slate-100 font-semibold">
                        {formatCurrency(item.spent, currency)} spent
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        Limit: {formatCurrency(item.limit, currency)}
                      </span>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${getBarColor(item.health)}`}
                        style={{
                          width: `${Math.min(100, Math.max(0, item.percentage))}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs tabular-nums">
                      <span
                        className={
                          item.remaining >= 0
                            ? 'text-slate-500 dark:text-slate-400'
                            : 'text-red-600 dark:text-red-400 font-medium'
                        }
                      >
                        {item.remaining >= 0
                          ? `${formatCurrency(item.remaining, currency)} remaining`
                          : `Over by ${formatCurrency(Math.abs(item.remaining), currency)}`}
                      </span>
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                        {item.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
