import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Info,
  PiggyBank,
  Plus,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BudgetConfig,
  CurrencyCode,
  NavSection,
  ThemeMode,
  Transaction,
} from '../types/finance';
import {
  computeBudgetStatuses,
  computeDashboardSummary,
  generateSmartInsights,
  getCategoryBreakdown,
  getMonthlySeries,
  getWeeklyExpenseSeries,
} from '../utils/analytics';
import { getCategoryIcon } from '../utils/categoryIcons';
import { formatCurrency, formatShortDate, getMonthKey } from '../utils/formatters';

interface DashboardPageProps {
  transactions: Transaction[];
  budgets: BudgetConfig;
  currency: CurrencyCode;
  theme: ThemeMode;
  hasDemoData: boolean;
  onAddTransaction: () => void;
  onNavigate: (section: NavSection) => void;
  onRequestRemoveDemo: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  transactions,
  budgets,
  currency,
  theme,
  hasDemoData,
  onAddTransaction,
  onNavigate,
  onRequestRemoveDemo,
}) => {
  const isDark = theme === 'dark';
  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';
  const tickColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipStyle = {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderColor: isDark ? '#334155' : '#e2e8f0',
    borderRadius: '0.5rem',
    color: isDark ? '#f8fafc' : '#0f172a',
    fontSize: '12px',
  };

  const summary = useMemo(() => computeDashboardSummary(transactions), [transactions]);
  const monthlySeries = useMemo(() => getMonthlySeries(transactions, 6), [transactions]);
  const weeklySeries = useMemo(() => getWeeklyExpenseSeries(transactions), [transactions]);

  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonth = transactions.filter(
      (t) => t.type === 'expense' && getMonthKey(t.date) === currentKey
    );
    // If current month has expenses, show this month breakdown; otherwise show all expenses
    return thisMonth.length > 0 ? thisMonth : transactions.filter((t) => t.type === 'expense');
  }, [transactions]);

  const categoryBreakdown = useMemo(
    () => getCategoryBreakdown(currentMonthExpenses, 'expense'),
    [currentMonthExpenses]
  );

  const budgetStatuses = useMemo(
    () => computeBudgetStatuses(transactions, budgets),
    [transactions, budgets]
  );

  const insights = useMemo(
    () => generateSmartInsights(transactions, budgets, currency),
    [transactions, budgets, currency]
  );

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)))
      .slice(0, 6);
  }, [transactions]);

  const renderTrendBadge = (
    pct: number | null,
    invertGood = false,
    fallbackText = 'No prior month data'
  ) => {
    if (pct === null) {
      return (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {fallbackText}
        </span>
      );
    }
    const isPositive = pct >= 0;
    const isGood = invertGood ? !isPositive : isPositive;
    const colorClass =
      Math.abs(pct) < 0.1
        ? 'text-slate-500 dark:text-slate-400'
        : isGood
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-red-600 dark:text-red-400';

    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium tabular-nums ${colorClass}`}>
        {isPositive ? (
          <TrendingUp className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <TrendingDown className="w-3.5 h-3.5 shrink-0" />
        )}
        {isPositive ? '+' : ''}
        {pct.toFixed(1)}% vs last month
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Demo Data Notice */}
      {hasDemoData && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-start sm:items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
            <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              Sample demo data is loaded so you can explore charts, budgets, and goals immediately.
            </span>
          </div>
          <button
            type="button"
            onClick={onRequestRemoveDemo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove Demo Data
          </button>
        </div>
      )}

      {/* Budget Alert Strip */}
      {budgetStatuses.alerts.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
          <div className="flex items-start sm:items-center gap-2.5 text-sm text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              {budgetStatuses.alerts[0].health === 'over'
                ? `${budgetStatuses.alerts[0].category} budget exceeded (${budgetStatuses.alerts[0].percentage.toFixed(0)}% used).`
                : `${budgetStatuses.alerts[0].category} has reached ${budgetStatuses.alerts[0].percentage.toFixed(0)}% of its monthly limit.`}
              {budgetStatuses.alerts.length > 1 &&
                ` +${budgetStatuses.alerts.length - 1} more budget alert${budgetStatuses.alerts.length > 2 ? 's' : ''}.`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('budgets')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:underline whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            Review Budgets
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Balance */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Balance
            </span>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`mt-3 text-2xl font-bold font-mono tabular-nums tracking-tight ${
              summary.totalBalance >= 0
                ? 'text-slate-900 dark:text-slate-100'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatCurrency(summary.totalBalance, currency)}
          </p>
          <div className="mt-2 flex items-center justify-between gap-2">
            {renderTrendBadge(summary.balanceChangePct, false, 'Net all-time balance')}
          </div>
        </div>

        {/* Total Income */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Monthly Income
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold font-mono tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatCurrency(summary.currentMonthIncome, currency)}
          </p>
          <div className="mt-2">
            {renderTrendBadge(
              summary.incomeChangePct,
              false,
              `Last month: ${formatCurrency(summary.previousMonthIncome, currency)}`
            )}
          </div>
        </div>

        {/* Total Expenses */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Monthly Expenses
            </span>
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold font-mono tabular-nums tracking-tight text-red-600 dark:text-red-400">
            {formatCurrency(summary.currentMonthExpenses, currency)}
          </p>
          <div className="mt-2">
            {renderTrendBadge(
              summary.expenseChangePct,
              true,
              `Last month: ${formatCurrency(summary.previousMonthExpenses, currency)}`
            )}
          </div>
        </div>

        {/* Monthly Savings */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Monthly Savings
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`mt-3 text-2xl font-bold font-mono tabular-nums tracking-tight ${
              summary.currentMonthSavings >= 0
                ? 'text-slate-900 dark:text-slate-100'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatCurrency(summary.currentMonthSavings, currency)}
          </p>
          <div className="mt-2 flex items-center justify-between gap-2">
            {summary.currentMonthIncome > 0 ? (
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {summary.currentMonthSavingsRate.toFixed(1)}% savings rate
              </span>
            ) : (
              renderTrendBadge(summary.savingsChangePct, false, 'Add income to track rate')
            )}
          </div>
        </div>
      </div>

      {/* Empty State if zero transactions */}
      {transactions.length === 0 ? (
        <div className="p-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
            <Wallet className="w-6 h-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
            No transactions recorded yet
          </h3>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Start by adding your first income or expense. Your charts, budgets, and smart financial insights will populate automatically.
          </p>
          <button
            type="button"
            onClick={onAddTransaction}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Transaction
          </button>
        </div>
      ) : (
        <>
          {/* 4 Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 1. Income vs Expenses Chart */}
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Income vs Expenses
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    6-month cashflow comparison
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                    Income
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-red-500" />
                    Expenses
                  </span>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlySeries} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: tickColor, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: tickColor, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatCurrency(v, currency, true)}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: unknown, name: unknown) => [
                        formatCurrency(Number(value) || 0, currency),
                        String(name) === 'income' ? 'Income' : 'Expenses',
                      ]}
                    />
                    <Bar dataKey="income" name="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="expenses" name="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Monthly Spending Trend */}
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Monthly Spending Trend
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Total expenses across recent 6 months
                  </p>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlySeries} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="expenseTrendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: tickColor, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: tickColor, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatCurrency(v, currency, true)}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: unknown) => [
                        formatCurrency(Number(value) || 0, currency),
                        'Expenses',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#expenseTrendGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Expense Category Breakdown Pie/Donut */}
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Expense Category Breakdown
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Distribution across categories
                  </p>
                </div>
              </div>

              {categoryBreakdown.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                  No expenses recorded yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryBreakdown}
                          dataKey="amount"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={82}
                          paddingAngle={2}
                        >
                          {categoryBreakdown.map((entry) => (
                            <Cell key={entry.category} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(value: unknown) => [
                            formatCurrency(Number(value) || 0, currency),
                            'Spent',
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {categoryBreakdown.map((item) => (
                      <div
                        key={item.category}
                        className="flex items-center justify-between text-xs gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-xs shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                            {item.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 tabular-nums font-mono">
                          <span className="text-slate-500 dark:text-slate-400">
                            {item.percentage.toFixed(0)}%
                          </span>
                          <span className="text-slate-900 dark:text-slate-100 font-medium">
                            {formatCurrency(item.amount, currency)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Weekly Expense Chart */}
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Weekly Expense Activity
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Daily spending over the last 7 days
                  </p>
                </div>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklySeries} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: tickColor, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: tickColor, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatCurrency(v, currency, true)}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: unknown) => [
                        formatCurrency(Number(value) || 0, currency),
                        'Spent',
                      ]}
                    />
                    <Bar dataKey="expenses" fill="#0284c7" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Grid: Recent Transactions & Smart Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Recent Transactions */}
            <div className="lg:col-span-7 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Recent Transactions
                </h3>
                <button
                  type="button"
                  onClick={() => onNavigate('transactions')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0"
                >
                  View all
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          tx.type === 'income'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {getCategoryIcon(tx.category, 'w-4 h-4')}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {tx.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {tx.category} · {tx.paymentMethod} · {formatShortDate(tx.date)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold font-mono tabular-nums shrink-0 ${
                        tx.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Insights */}
            <div className="lg:col-span-5 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Smart Insights
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('analytics')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0"
                >
                  Full Analytics
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {insights.slice(0, 4).map((insight) => {
                  const toneClasses = {
                    positive:
                      'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-900/60',
                    warning:
                      'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/60',
                    negative:
                      'bg-red-50/70 dark:bg-red-950/30 border-red-200/80 dark:border-red-900/60',
                    neutral:
                      'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800',
                  };

                  return (
                    <div
                      key={insight.id}
                      className={`p-3.5 rounded-lg border ${toneClasses[insight.tone]}`}
                    >
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {insight.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {insight.message}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
