import {
  AnalyticsPeriod,
  BudgetConfig,
  BudgetHealth,
  BudgetStatus,
  CurrencyCode,
  SmartInsight,
  Transaction,
} from '../types/finance';
import { CATEGORY_COLORS } from './constants';
import {
  formatCurrency,
  getMonthKey,
  getMonthLabel,
  getPeriodRange,
  getRecentMonthKeys,
  toISODate,
} from './formatters';

export interface DashboardSummary {
  totalBalance: number;
  allTimeIncome: number;
  allTimeExpenses: number;
  currentMonthIncome: number;
  currentMonthExpenses: number;
  currentMonthSavings: number;
  previousMonthIncome: number;
  previousMonthExpenses: number;
  previousMonthSavings: number;
  incomeChangePct: number | null;
  expenseChangePct: number | null;
  savingsChangePct: number | null;
  balanceChangePct: number | null;
  currentMonthSavingsRate: number;
}

function calcDeltaPct(current: number, previous: number): number | null {
  if (previous === 0) {
    if (current === 0) return 0;
    return null;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function computeDashboardSummary(
  transactions: Transaction[],
  now: Date = new Date()
): DashboardSummary {
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

  let allTimeIncome = 0;
  let allTimeExpenses = 0;
  let currentMonthIncome = 0;
  let currentMonthExpenses = 0;
  let previousMonthIncome = 0;
  let previousMonthExpenses = 0;

  for (const tx of transactions) {
    const mKey = getMonthKey(tx.date);
    if (tx.type === 'income') {
      allTimeIncome += tx.amount;
      if (mKey === currentMonthKey) currentMonthIncome += tx.amount;
      if (mKey === prevMonthKey) previousMonthIncome += tx.amount;
    } else {
      allTimeExpenses += tx.amount;
      if (mKey === currentMonthKey) currentMonthExpenses += tx.amount;
      if (mKey === prevMonthKey) previousMonthExpenses += tx.amount;
    }
  }

  const totalBalance = allTimeIncome - allTimeExpenses;
  const currentMonthSavings = currentMonthIncome - currentMonthExpenses;
  const previousMonthSavings = previousMonthIncome - previousMonthExpenses;
  const previousCumulativeBalance = totalBalance - currentMonthSavings;

  const currentMonthSavingsRate =
    currentMonthIncome > 0
      ? ((currentMonthIncome - currentMonthExpenses) / currentMonthIncome) * 100
      : 0;

  return {
    totalBalance,
    allTimeIncome,
    allTimeExpenses,
    currentMonthIncome,
    currentMonthExpenses,
    currentMonthSavings,
    previousMonthIncome,
    previousMonthExpenses,
    previousMonthSavings,
    incomeChangePct: calcDeltaPct(currentMonthIncome, previousMonthIncome),
    expenseChangePct: calcDeltaPct(currentMonthExpenses, previousMonthExpenses),
    savingsChangePct: calcDeltaPct(currentMonthSavings, previousMonthSavings),
    balanceChangePct:
      previousCumulativeBalance !== 0
        ? (currentMonthSavings / Math.abs(previousCumulativeBalance)) * 100
        : null,
    currentMonthSavingsRate,
  };
}

export interface MonthlyChartDatum {
  monthKey: string;
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export function getMonthlySeries(
  transactions: Transaction[],
  monthsCount = 6,
  now: Date = new Date()
): MonthlyChartDatum[] {
  const keys = getRecentMonthKeys(monthsCount, now);
  const map = new Map<string, { income: number; expenses: number }>();
  for (const k of keys) {
    map.set(k, { income: 0, expenses: 0 });
  }

  for (const tx of transactions) {
    const k = getMonthKey(tx.date);
    const entry = map.get(k);
    if (!entry) continue;
    if (tx.type === 'income') entry.income += tx.amount;
    else entry.expenses += tx.amount;
  }

  return keys.map((k) => {
    const entry = map.get(k)!;
    return {
      monthKey: k,
      month: getMonthLabel(k),
      income: entry.income,
      expenses: entry.expenses,
      savings: entry.income - entry.expenses,
    };
  });
}

export interface WeeklyExpenseDatum {
  date: string;
  day: string;
  expenses: number;
}

export function getWeeklyExpenseSeries(
  transactions: Transaction[],
  now: Date = new Date()
): WeeklyExpenseDatum[] {
  const days: WeeklyExpenseDatum[] = [];
  const totals = new Map<string, number>();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const iso = toISODate(d);
    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
    totals.set(iso, 0);
    days.push({ date: iso, day: label, expenses: 0 });
  }

  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    if (totals.has(tx.date)) {
      totals.set(tx.date, (totals.get(tx.date) || 0) + tx.amount);
    }
  }

  return days.map((d) => ({
    ...d,
    expenses: totals.get(d.date) || 0,
  }));
}

export interface CategoryBreakdownDatum {
  category: string;
  amount: number;
  percentage: number;
  count: number;
  color: string;
}

export function getCategoryBreakdown(
  transactions: Transaction[],
  type: 'expense' | 'income' = 'expense'
): CategoryBreakdownDatum[] {
  const filtered = transactions.filter((t) => t.type === type);
  const map = new Map<string, { amount: number; count: number }>();

  let total = 0;
  for (const tx of filtered) {
    total += tx.amount;
    const prev = map.get(tx.category) || { amount: 0, count: 0 };
    map.set(tx.category, {
      amount: prev.amount + tx.amount,
      count: prev.count + 1,
    });
  }

  return Array.from(map.entries())
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([category, data], idx) => ({
      category,
      amount: data.amount,
      percentage: total > 0 ? (data.amount / total) * 100 : 0,
      count: data.count,
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    }));
}

export function getBudgetHealth(percentage: number): BudgetHealth {
  if (percentage >= 100) return 'over';
  if (percentage >= 80) return 'near';
  return 'within';
}

export function computeBudgetStatuses(
  transactions: Transaction[],
  budgets: BudgetConfig,
  now: Date = new Date()
): {
  overall: BudgetStatus;
  categories: BudgetStatus[];
  alerts: BudgetStatus[];
} {
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthExpenses = transactions.filter(
    (t) => t.type === 'expense' && getMonthKey(t.date) === currentMonthKey
  );

  const totalSpent = currentMonthExpenses.reduce((acc, t) => acc + t.amount, 0);
  const overallPct =
    budgets.monthlyLimit > 0 ? (totalSpent / budgets.monthlyLimit) * 100 : 0;

  const overall: BudgetStatus = {
    category: 'Monthly Total',
    limit: budgets.monthlyLimit,
    spent: totalSpent,
    remaining: budgets.monthlyLimit - totalSpent,
    percentage: overallPct,
    health: getBudgetHealth(overallPct),
  };

  const spentByCategory = new Map<string, number>();
  for (const tx of currentMonthExpenses) {
    spentByCategory.set(
      tx.category,
      (spentByCategory.get(tx.category) || 0) + tx.amount
    );
  }

  const categories: BudgetStatus[] = Object.entries(budgets.categoryBudgets)
    .filter(([, limit]) => limit > 0)
    .map(([category, limit]) => {
      const spent = spentByCategory.get(category) || 0;
      const pct = limit > 0 ? (spent / limit) * 100 : 0;
      return {
        category,
        limit,
        spent,
        remaining: limit - spent,
        percentage: pct,
        health: getBudgetHealth(pct),
      };
    })
    .sort((a, b) => b.percentage - a.percentage);

  const alerts: BudgetStatus[] = [];
  if (overall.limit > 0 && overall.health !== 'within') {
    alerts.push(overall);
  }
  for (const cat of categories) {
    if (cat.health !== 'within') {
      alerts.push(cat);
    }
  }

  return { overall, categories, alerts };
}

export function generateSmartInsights(
  transactions: Transaction[],
  budgets: BudgetConfig,
  currency: CurrencyCode,
  now: Date = new Date()
): SmartInsight[] {
  if (transactions.length === 0) {
    return [
      {
        id: 'empty-insight',
        tone: 'neutral',
        title: 'Start Tracking Your Finances',
        message:
          'Add your first income or expense transaction to unlock personalized spending comparisons, category breakdowns, and budget alerts.',
      },
    ];
  }

  const insights: SmartInsight[] = [];
  const summary = computeDashboardSummary(transactions, now);
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthTx = transactions.filter(
    (t) => getMonthKey(t.date) === currentMonthKey
  );
  const currentMonthExpenses = currentMonthTx.filter((t) => t.type === 'expense');

  // 1. Month-over-month expense comparison
  if (summary.previousMonthExpenses > 0 && summary.currentMonthExpenses > 0) {
    const diffPct =
      ((summary.currentMonthExpenses - summary.previousMonthExpenses) /
        summary.previousMonthExpenses) *
      100;
    if (diffPct < -1) {
      insights.push({
        id: 'mom-spend-down',
        tone: 'positive',
        title: 'Lower Monthly Spending',
        message: `You spent ${Math.abs(diffPct).toFixed(1)}% less this month (${formatCurrency(summary.currentMonthExpenses, currency)}) compared to last month (${formatCurrency(summary.previousMonthExpenses, currency)}).`,
      });
    } else if (diffPct > 1) {
      insights.push({
        id: 'mom-spend-up',
        tone: 'warning',
        title: 'Spending Increase Detected',
        message: `Your spending increased by ${diffPct.toFixed(1)}% compared to last month (${formatCurrency(summary.currentMonthExpenses, currency)} vs ${formatCurrency(summary.previousMonthExpenses, currency)}).`,
      });
    } else {
      insights.push({
        id: 'mom-spend-steady',
        tone: 'neutral',
        title: 'Steady Spending Pace',
        message: `Your monthly spending (${formatCurrency(summary.currentMonthExpenses, currency)}) is almost identical to last month.`,
      });
    }
  }

  // 2. Biggest spending category this month
  const catBreakdown = getCategoryBreakdown(currentMonthExpenses, 'expense');
  if (catBreakdown.length > 0) {
    const top = catBreakdown[0];
    insights.push({
      id: 'top-category',
      tone: 'neutral',
      title: 'Top Expense Category',
      message: `${top.category} is your biggest spending category this month at ${formatCurrency(top.amount, currency)} (${top.percentage.toFixed(0)}% of monthly expenses).`,
    });
  }

  // 3. Budget proximity or overage alerts
  const { overall, categories } = computeBudgetStatuses(transactions, budgets, now);
  const overBudgetCats = categories.filter((c) => c.health === 'over');
  const nearBudgetCats = categories.filter((c) => c.health === 'near');

  if (overBudgetCats.length > 0) {
    const worst = overBudgetCats[0];
    insights.push({
      id: 'budget-over',
      tone: 'negative',
      title: `${worst.category} Budget Exceeded`,
      message: `You exceeded your ${worst.category} budget by ${formatCurrency(Math.abs(worst.remaining), currency)} (${worst.percentage.toFixed(0)}% used).`,
    });
  } else if (nearBudgetCats.length > 0) {
    const closest = nearBudgetCats[0];
    insights.push({
      id: 'budget-near',
      tone: 'warning',
      title: `Approaching ${closest.category} Limit`,
      message: `You have used ${closest.percentage.toFixed(0)}% of your ${closest.category} budget, with ${formatCurrency(closest.remaining, currency)} remaining.`,
    });
  } else if (overall.limit > 0 && overall.spent > 0) {
    if (overall.health === 'over') {
      insights.push({
        id: 'overall-over',
        tone: 'negative',
        title: 'Monthly Budget Exceeded',
        message: `Your total monthly spending is ${formatCurrency(Math.abs(overall.remaining), currency)} over your ${formatCurrency(overall.limit, currency)} limit.`,
      });
    } else if (overall.health === 'near') {
      insights.push({
        id: 'overall-near',
        tone: 'warning',
        title: 'Monthly Limit Nearly Reached',
        message: `You have used ${overall.percentage.toFixed(0)}% of your overall monthly budget.`,
      });
    } else {
      insights.push({
        id: 'overall-healthy',
        tone: 'positive',
        title: 'Healthy Budget Control',
        message: `You are well within your monthly budget, with ${formatCurrency(overall.remaining, currency)} (${(100 - overall.percentage).toFixed(0)}%) remaining.`,
      });
    }
  }

  // 4. Savings rate insight
  if (summary.currentMonthIncome > 0) {
    if (summary.currentMonthSavings >= 0) {
      insights.push({
        id: 'savings-rate',
        tone: summary.currentMonthSavingsRate >= 20 ? 'positive' : 'neutral',
        title: 'Monthly Savings Rate',
        message: `You saved ${summary.currentMonthSavingsRate.toFixed(1)}% of your income this month (${formatCurrency(summary.currentMonthSavings, currency)} net saved).`,
      });
    } else {
      insights.push({
        id: 'savings-deficit',
        tone: 'negative',
        title: 'Monthly Deficit Warning',
        message: `Your expenses exceed this month's income by ${formatCurrency(Math.abs(summary.currentMonthSavings), currency)}.`,
      });
    }
  }

  return insights;
}

export interface AnalyticsPeriodReport {
  periodLabel: string;
  transactions: Transaction[];
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  averageDailySpending: number;
  highestCategory: CategoryBreakdownDatum | null;
  categoryBreakdown: CategoryBreakdownDatum[];
  paymentBreakdown: { method: string; amount: number; count: number; percentage: number }[];
  comparisonSeries: { label: string; income: number; expenses: number }[];
}

export function computeAnalyticsReport(
  allTransactions: Transaction[],
  period: AnalyticsPeriod,
  now: Date = new Date()
): AnalyticsPeriodReport {
  const { start, end, label, daysCount } = getPeriodRange(period, now);
  const periodTx = allTransactions.filter((t) => t.date >= start && t.date <= end);

  let income = 0;
  let expenses = 0;
  const paymentMap = new Map<string, { amount: number; count: number }>();

  for (const tx of periodTx) {
    if (tx.type === 'income') {
      income += tx.amount;
    } else {
      expenses += tx.amount;
      const prev = paymentMap.get(tx.paymentMethod) || { amount: 0, count: 0 };
      paymentMap.set(tx.paymentMethod, {
        amount: prev.amount + tx.amount,
        count: prev.count + 1,
      });
    }
  }

  const savings = income - expenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  const averageDailySpending = daysCount > 0 ? expenses / daysCount : 0;

  const categoryBreakdown = getCategoryBreakdown(periodTx, 'expense');
  const highestCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

  const paymentBreakdown = Array.from(paymentMap.entries())
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([method, data]) => ({
      method,
      amount: data.amount,
      count: data.count,
      percentage: expenses > 0 ? (data.amount / expenses) * 100 : 0,
    }));

  // Sub-period comparison series
  const comparisonSeries: { label: string; income: number; expenses: number }[] = [];

  if (period === 'this_year') {
    const year = now.getFullYear();
    for (let m = 0; m < 12; m++) {
      const mKey = `${year}-${String(m + 1).padStart(2, '0')}`;
      const mLabel = new Date(year, m, 1).toLocaleDateString('en-US', { month: 'short' });
      let mInc = 0;
      let mExp = 0;
      for (const tx of periodTx) {
        if (getMonthKey(tx.date) === mKey) {
          if (tx.type === 'income') mInc += tx.amount;
          else mExp += tx.amount;
        }
      }
      comparisonSeries.push({ label: mLabel, income: mInc, expenses: mExp });
    }
  } else if (period === 'this_week') {
    const startDate = new Date(
      Number(start.slice(0, 4)),
      Number(start.slice(5, 7)) - 1,
      Number(start.slice(8, 10))
    );
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const iso = toISODate(d);
      const dLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      let dInc = 0;
      let dExp = 0;
      for (const tx of periodTx) {
        if (tx.date === iso) {
          if (tx.type === 'income') dInc += tx.amount;
          else dExp += tx.amount;
        }
      }
      comparisonSeries.push({ label: dLabel, income: dInc, expenses: dExp });
    }
  } else {
    // Group month into 4-5 weekly buckets (Days 1-7, 8-14, 15-21, 22-31)
    const buckets = [
      { label: 'Days 1–7', min: 1, max: 7, income: 0, expenses: 0 },
      { label: 'Days 8–14', min: 8, max: 14, income: 0, expenses: 0 },
      { label: 'Days 15–21', min: 15, max: 21, income: 0, expenses: 0 },
      { label: 'Days 22–31', min: 22, max: 31, income: 0, expenses: 0 },
    ];
    for (const tx of periodTx) {
      const day = Number(tx.date.slice(8, 10));
      const bucket = buckets.find((b) => day >= b.min && day <= b.max) || buckets[3];
      if (tx.type === 'income') bucket.income += tx.amount;
      else bucket.expenses += tx.amount;
    }
    for (const b of buckets) {
      comparisonSeries.push({ label: b.label, income: b.income, expenses: b.expenses });
    }
  }

  return {
    periodLabel: label,
    transactions: periodTx,
    income,
    expenses,
    savings,
    savingsRate,
    averageDailySpending,
    highestCategory,
    categoryBreakdown,
    paymentBreakdown,
    comparisonSeries,
  };
}
