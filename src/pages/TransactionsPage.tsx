import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Wallet,
} from 'lucide-react';
import { CurrencyCode, Transaction } from '../types/finance';
import { PAYMENT_METHODS } from '../utils/constants';
import { getCategoryIcon } from '../utils/categoryIcons';
import { formatCurrency, formatDate, getPeriodRange } from '../utils/formatters';

interface TransactionsPageProps {
  transactions: Transaction[];
  currency: CurrencyCode;
  allCategories: string[];
  onAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
}

type SortOption =
  | 'date_desc'
  | 'date_asc'
  | 'amount_desc'
  | 'amount_asc'
  | 'name_asc';

type DateFilterOption =
  | 'all'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'custom';

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  currency,
  allCategories,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const paymentOptions = useMemo(() => {
    const set = new Set(PAYMENT_METHODS);
    for (const tx of transactions) {
      if (tx.paymentMethod) set.add(tx.paymentMethod);
    }
    return Array.from(set);
  }, [transactions]);

  const categoryOptions = useMemo(() => {
    const set = new Set(allCategories);
    for (const tx of transactions) {
      if (tx.category) set.add(tx.category);
    }
    return Array.from(set);
  }, [allCategories, transactions]);

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    let dateStart = '';
    let dateEnd = '';
    if (dateFilter === 'this_week' || dateFilter === 'this_month' || dateFilter === 'last_month') {
      const range = getPeriodRange(dateFilter);
      dateStart = range.start;
      dateEnd = range.end;
    } else if (dateFilter === 'custom') {
      dateStart = customStart;
      dateEnd = customEnd;
    }

    const list = transactions.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;
      if (paymentFilter !== 'all' && tx.paymentMethod !== paymentFilter) return false;
      if (dateStart && tx.date < dateStart) return false;
      if (dateEnd && tx.date > dateEnd) return false;

      if (query) {
        const haystack = `${tx.name} ${tx.category} ${tx.paymentMethod} ${tx.description || ''}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });

    return list.sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt);
        case 'amount_desc':
          return b.amount - a.amount;
        case 'amount_asc':
          return a.amount - b.amount;
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'date_desc':
        default:
          return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
      }
    });
  }, [
    transactions,
    searchQuery,
    typeFilter,
    categoryFilter,
    paymentFilter,
    dateFilter,
    customStart,
    customEnd,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedTransactions = useMemo(() => {
    const startIdx = (safePage - 1) * pageSize;
    return filteredTransactions.slice(startIdx, startIdx + pageSize);
  }, [filteredTransactions, safePage]);

  const filteredTotals = useMemo(() => {
    let income = 0;
    let expenses = 0;
    for (const tx of filteredTransactions) {
      if (tx.type === 'income') income += tx.amount;
      else expenses += tx.amount;
    }
    return { income, expenses, net: income - expenses };
  }, [filteredTransactions]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    paymentFilter !== 'all' ||
    dateFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setPaymentFilter('all');
    setDateFilter('all');
    setCustomStart('');
    setCustomEnd('');
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, category, payment method, or notes..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
          </div>

          {/* Type Filter Segmented Control */}
          <div className="flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
            {(['all', 'income', 'expense'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTypeFilter(t);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap shrink-0 ${
                  typeFilter === t
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="all">All Categories</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by payment method"
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="all">All Payment Methods</option>
            {paymentOptions.map((pm) => (
              <option key={pm} value={pm}>
                {pm}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by date range"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value as DateFilterOption);
              setPage(1);
            }}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="all">All Dates</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="custom">Custom Date Range</option>
          </select>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                aria-label="Sort transactions"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="amount_desc">Highest Amount</option>
                <option value="amount_asc">Lowest Amount</option>
                <option value="name_asc">Name (A–Z)</option>
              </select>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                title="Reset filters"
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Range Inputs */}
        {dateFilter === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => {
                  setCustomStart(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => {
                  setCustomEnd(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* Filtered Summary Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
        <span className="text-slate-600 dark:text-slate-400 font-medium tabular-nums">
          Showing {filteredTransactions.length} transaction{filteredTransactions.length === 1 ? '' : 's'}
        </span>
        <div className="flex flex-wrap items-center gap-5 tabular-nums font-mono">
          <span className="text-emerald-600 dark:text-emerald-400">
            Income: +{formatCurrency(filteredTotals.income, currency)}
          </span>
          <span className="text-red-600 dark:text-red-400">
            Expenses: -{formatCurrency(filteredTotals.expenses, currency)}
          </span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            Net: {formatCurrency(filteredTotals.net, currency)}
          </span>
        </div>
      </div>

      {/* Transactions Table / Empty State */}
      {filteredTransactions.length === 0 ? (
        <div className="p-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
            <Wallet className="w-6 h-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
            {transactions.length === 0 ? 'No transactions yet' : 'No matching transactions'}
          </h3>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {transactions.length === 0
              ? 'Add your first income or expense entry to start building your financial ledger.'
              : 'Try clearing or adjusting your active search query and filters.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Clear Filters
              </button>
            )}
            <button
              type="button"
              onClick={onAddTransaction}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Transaction
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Transaction</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {paginatedTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 min-w-[180px]">
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
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                              {tx.name}
                            </p>
                            {tx.isDemo && (
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal shrink-0">
                                Demo
                              </span>
                            )}
                          </div>
                          {tx.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                              {tx.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {tx.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded-md ${
                          tx.type === 'income'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                            : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400'
                        }`}
                      >
                        {tx.type === 'income' ? 'Income' : 'Expense'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {tx.paymentMethod}
                    </td>

                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap tabular-nums">
                      {formatDate(tx.date)}
                    </td>

                    <td
                      className={`py-3 px-4 text-right font-mono font-semibold tabular-nums whitespace-nowrap ${
                        tx.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount, currency)}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditTransaction(tx)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          aria-label={`Edit ${tx.name}`}
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(tx)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          aria-label={`Delete ${tx.name}`}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              <span className="tabular-nums">
                Page {safePage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
