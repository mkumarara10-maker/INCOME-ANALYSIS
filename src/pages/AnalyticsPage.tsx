import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  CreditCard,
  Percent,
  Sparkles,
  Tag,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AnalyticsPeriod,
  BudgetConfig,
  CurrencyCode,
  ThemeMode,
  Transaction,
} from '../types/finance';
import { computeAnalyticsReport, generateSmartInsights } from '../utils/analytics';
import { getCategoryIcon } from '../utils/categoryIcons';
import { formatCurrency } from '../utils/formatters';

interface AnalyticsPageProps {
  transactions: Transaction[];
  budgets: BudgetConfig;
  currency: CurrencyCode;
  theme: ThemeMode;
}

const PERIOD_OPTIONS: { id: AnalyticsPeriod; label: string }[] = [
  { id: 'this_week', label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'this_year', label: 'This Year' },
];

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  transactions,
  budgets,
  currency,
  theme,
}) => {
  const [period, setPeriod] = useState<AnalyticsPeriod>('this_month');

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

  const report = useMemo(
    () => computeAnalyticsReport(transactions, period),
    [transactions, period]
  );

  const smartInsights = useMemo(
    () => generateSmartInsights(transactions, budgets, currency),
    [transactions, budgets, currency]
  );

  return (
    <div className="space-y-6">
      {/* Period Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Financial Performance · {report.periodLabel}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Calculated from {report.transactions.length} transaction
            {report.transactions.length === 1 ? '' : 's'} in this period
          </p>
        </div>

        <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 self-start sm:self-auto overflow-x-auto max-w-full">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPeriod(opt.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                period === opt.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Income</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2 text-lg font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(report.income, currency)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Expenses</span>
            <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <p className="mt-2 text-lg font-bold font-mono tabular-nums text-red-600 dark:text-red-400">
            {formatCurrency(report.expenses, currency)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Savings Rate</span>
            <Percent className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </div>
          <p
            className={`mt-2 text-lg font-bold font-mono tabular-nums ${
              report.savingsRate >= 0
                ? 'text-slate-900 dark:text-slate-100'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {report.income > 0 ? `${report.savingsRate.toFixed(1)}%` : '—'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Avg Daily Spend</span>
            <BarChart3 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </div>
          <p className="mt-2 text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {formatCurrency(report.averageDailySpending, currency)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Highest Category</span>
            <Tag className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </div>
          <p className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
            {report.highestCategory ? report.highestCategory.category : '—'}
          </p>
          {report.highestCategory && (
            <p className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {formatCurrency(report.highestCategory.amount, currency)} (
              {report.highestCategory.percentage.toFixed(0)}%)
            </p>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Income vs Expense Comparison */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Income vs Expense Comparison
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Breakdown within {report.periodLabel.toLowerCase()}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
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
              <BarChart
                data={report.comparisonSeries}
                margin={{ top: 4, right: 8, left: -12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: tickColor, fontSize: 11 }}
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
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category-wise Spending BarChart */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Category-Wise Spending
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Expense distribution for {report.periodLabel.toLowerCase()}
            </p>
          </div>

          {report.categoryBreakdown.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
              No expense transactions in {report.periodLabel.toLowerCase()}.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={report.categoryBreakdown}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: tickColor, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatCurrency(v, currency, true)}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    width={105}
                    tick={{ fill: tickColor, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: unknown) => [
                      formatCurrency(Number(value) || 0, currency),
                      'Spent',
                    ]}
                  />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={22}>
                    {report.categoryBreakdown.map((entry) => (
                      <Cell key={entry.category} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown Table & Payment Methods + Smart Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Category Details */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Category Spending Breakdown
          </h4>
          {report.categoryBreakdown.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
              No expense data available for this timeframe.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {report.categoryBreakdown.map((cat) => (
                <div key={cat.category} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {getCategoryIcon(cat.category, 'w-3.5 h-3.5')}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {cat.category}
                      </span>
                      <span className="text-xs text-slate-400 tabular-nums">
                        {cat.count} tx
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono tabular-nums text-xs">
                      <span className="text-slate-500 dark:text-slate-400">
                        {cat.percentage.toFixed(1)}%
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(cat.amount, currency)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, cat.percentage)}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Payment Method Split */}
          {report.paymentBreakdown.length > 0 && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-slate-500" />
                <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Spending by Payment Method
                </h5>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {report.paymentBreakdown.map((pm) => (
                  <div
                    key={pm.method}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {pm.method} ({pm.count})
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(pm.amount, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rule-Based Financial Insights */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Financial Insights
            </h4>
          </div>

          <div className="space-y-3">
            {smartInsights.map((insight) => {
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
    </div>
  );
};
