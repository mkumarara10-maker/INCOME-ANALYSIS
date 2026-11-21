import React, { useEffect, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { CurrencyCode, Transaction, TransactionType } from '../types/finance';
import { CURRENCY_CONFIG, PAYMENT_METHODS } from '../utils/constants';
import { toISODate } from '../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  editingTransaction: Transaction | null;
  currency: CurrencyCode;
  incomeCategories: string[];
  expenseCategories: string[];
  onAddCustomCategory: (type: TransactionType, category: string) => boolean;
  onSave: (data: Omit<Transaction, 'id' | 'createdAt'>, existingId?: string) => void;
  onClose: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  editingTransaction,
  currency,
  incomeCategories,
  expenseCategories,
  onAddCustomCategory,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(toISODate(new Date()));
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const submittingRef = useRef(false);

  const availableCategories = type === 'income' ? incomeCategories : expenseCategories;

  useEffect(() => {
    if (!isOpen) return;
    submittingRef.current = false;
    setErrors({});
    setShowNewCat(false);
    setNewCatName('');

    if (editingTransaction) {
      setName(editingTransaction.name);
      setAmount(String(editingTransaction.amount));
      setType(editingTransaction.type);
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date);
      setPaymentMethod(editingTransaction.paymentMethod);
      setDescription(editingTransaction.description || '');
    } else {
      setName('');
      setAmount('');
      setType('expense');
      setCategory(expenseCategories[0] || 'Other');
      setDate(toISODate(new Date()));
      setPaymentMethod(PAYMENT_METHODS[0]);
      setDescription('');
    }
  }, [isOpen, editingTransaction, expenseCategories]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    const nextCats = nextType === 'income' ? incomeCategories : expenseCategories;
    if (!nextCats.includes(category)) {
      setCategory(nextCats[0] || 'Other');
    }
  };

  const handleCreateCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    const added = onAddCustomCategory(type, trimmed);
    if (added) {
      setCategory(trimmed);
      setNewCatName('');
      setShowNewCat(false);
    } else {
      setCategory(trimmed);
      setNewCatName('');
      setShowNewCat(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;

    const nextErrors: Record<string, string> = {};
    const trimmedName = name.trim();
    const parsedAmount = Number.parseFloat(amount);

    if (!trimmedName) {
      nextErrors.name = 'Please enter a transaction name.';
    } else if (trimmedName.length > 80) {
      nextErrors.name = 'Name must be 80 characters or fewer.';
    }

    if (!amount || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      nextErrors.amount = 'Enter a valid amount greater than 0.';
    }

    if (!category) {
      nextErrors.category = 'Select a category.';
    }

    if (!date) {
      nextErrors.date = 'Select a valid date.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    submittingRef.current = true;
    onSave(
      {
        name: trimmedName,
        amount: Math.round(parsedAmount * 100) / 100,
        type,
        category,
        date,
        paymentMethod,
        description: description.trim() || undefined,
        isDemo: false,
      },
      editingTransaction?.id
    );
    onClose();
  };

  const currencySymbol = CURRENCY_CONFIG[currency]?.symbol || '₹';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-6 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <h2
            id="tx-modal-title"
            className="text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          {/* Type Segmented Switch */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                  type === 'expense'
                    ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                  type === 'income'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Name & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="tx-name"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
              >
                Transaction Name *
              </label>
              <input
                id="tx-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder={type === 'income' ? 'e.g. Monthly Salary' : 'e.g. Groceries'}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="tx-amount"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
              >
                Amount ({currencySymbol}) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-mono">
                  {currencySymbol}
                </span>
                <input
                  id="tx-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
                  }}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.amount}</p>
              )}
            </div>
          </div>

          {/* Category + Custom Category */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="tx-category"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                Category *
              </label>
              <button
                type="button"
                onClick={() => setShowNewCat((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <Plus className="w-3 h-3" />
                {showNewCat ? 'Cancel new' : 'Add custom category'}
              </button>
            </div>

            {showNewCat ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder={`New ${type} category name`}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="px-3.5 py-2 text-sm font-medium rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
                >
                  Add
                </button>
              </div>
            ) : (
              <select
                id="tx-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
            {errors.category && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.category}</p>
            )}
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="tx-date"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
              >
                Date *
              </label>
              <input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              />
              {errors.date && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.date}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="tx-payment"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
              >
                Payment Method
              </label>
              <select
                id="tx-payment"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="tx-desc"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Description (Optional)
            </label>
            <textarea
              id="tx-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes, merchant details, or reference..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors whitespace-nowrap shrink-0 ${
                type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700'
              }`}
            >
              {editingTransaction ? 'Save Changes' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
