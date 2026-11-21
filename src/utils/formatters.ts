import { AnalyticsPeriod, CurrencyCode } from '../types/finance';
import { CURRENCY_CONFIG } from './constants';

export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'INR',
  compact = false
): string {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.INR;
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  if (compact && Math.abs(safeAmount) >= 1000) {
    try {
      return new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency,
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(safeAmount);
    } catch {
      // Fallback below
    }
  }

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: safeAmount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const date = parseISODate(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = parseISODate(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function getMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return monthKey;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function getRecentMonthKeys(count = 6, now: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

export function getPeriodRange(
  period: AnalyticsPeriod,
  now: Date = new Date()
): { start: string; end: string; label: string; daysCount: number } {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === 'this_week') {
    const dayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const start = new Date(today);
    start.setDate(today.getDate() - diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const elapsedDays = Math.max(1, diffToMonday + 1);
    return {
      start: toISODate(start),
      end: toISODate(end),
      label: 'This Week',
      daysCount: elapsedDays,
    };
  }

  if (period === 'this_month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      start: toISODate(start),
      end: toISODate(end),
      label: 'This Month',
      daysCount: Math.max(1, today.getDate()),
    };
  }

  if (period === 'last_month') {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0);
    return {
      start: toISODate(start),
      end: toISODate(end),
      label: 'Last Month',
      daysCount: Math.max(1, end.getDate()),
    };
  }

  // this_year
  const start = new Date(today.getFullYear(), 0, 1);
  const end = new Date(today.getFullYear(), 11, 31);
  const msPerDay = 1000 * 60 * 60 * 24;
  const elapsedDays = Math.max(
    1,
    Math.floor((today.getTime() - start.getTime()) / msPerDay) + 1
  );
  return {
    start: toISODate(start),
    end: toISODate(end),
    label: 'This Year',
    daysCount: elapsedDays,
  };
}
