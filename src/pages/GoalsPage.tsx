import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Minus,
  Pencil,
  PiggyBank,
  Plus,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { CurrencyCode, SavingsGoal } from '../types/finance';
import { CURRENCY_CONFIG } from '../utils/constants';
import { formatCurrency, formatDate, parseISODate, toISODate } from '../utils/formatters';

interface GoalsPageProps {
  goals: SavingsGoal[];
  currency: CurrencyCode;
  onCreateGoal: (data: Omit<SavingsGoal, 'id' | 'createdAt'>) => void;
  onUpdateGoal: (id: string, data: Omit<SavingsGoal, 'id' | 'createdAt'>) => void;
  onDeleteGoal: (goal: SavingsGoal) => void;
  onAdjustGoalAmount: (id: string, delta: number) => void;
}

export const GoalsPage: React.FC<GoalsPageProps> = ({
  goals,
  currency,
  onCreateGoal,
  onUpdateGoal,
  onDeleteGoal,
  onAdjustGoalAmount,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [formError, setFormError] = useState('');

  // Add / Withdraw modal state
  const [adjustState, setAdjustState] = useState<{
    goal: SavingsGoal;
    mode: 'add' | 'withdraw';
  } | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustError, setAdjustError] = useState('');

  const currencySymbol = CURRENCY_CONFIG[currency]?.symbol || '₹';

  const summary = useMemo(() => {
    const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
    const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
    const overallPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
    return { totalSaved, totalTarget, overallPct };
  }, [goals]);

  const openCreateModal = () => {
    const defaultDate = new Date();
    defaultDate.setMonth(defaultDate.getMonth() + 6);
    setEditingGoal(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setTargetDate(toISODate(defaultDate));
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(String(goal.targetAmount));
    setCurrentAmount(String(goal.currentAmount));
    setTargetDate(goal.targetDate);
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const parsedTarget = Number.parseFloat(targetAmount);
    const parsedCurrent = Number.parseFloat(currentAmount || '0');

    if (!trimmedName) {
      setFormError('Please enter a goal name.');
      return;
    }
    if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      setFormError('Target amount must be greater than 0.');
      return;
    }
    if (!Number.isFinite(parsedCurrent) || parsedCurrent < 0) {
      setFormError('Saved amount cannot be negative.');
      return;
    }
    if (!targetDate) {
      setFormError('Please select a target date.');
      return;
    }

    const payload = {
      name: trimmedName,
      targetAmount: Math.round(parsedTarget * 100) / 100,
      currentAmount: Math.round(parsedCurrent * 100) / 100,
      targetDate,
      isDemo: false,
    };

    if (editingGoal) {
      onUpdateGoal(editingGoal.id, payload);
    } else {
      onCreateGoal(payload);
    }
    setModalOpen(false);
  };

  const handleConfirmAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustState) return;
    const val = Number.parseFloat(adjustAmount);
    if (!Number.isFinite(val) || val <= 0) {
      setAdjustError('Enter a valid amount greater than 0.');
      return;
    }
    if (adjustState.mode === 'withdraw' && val > adjustState.goal.currentAmount) {
      setAdjustError(
        `Cannot withdraw more than current saved amount (${formatCurrency(adjustState.goal.currentAmount, currency)}).`
      );
      return;
    }

    const delta = adjustState.mode === 'add' ? val : -val;
    onAdjustGoalAmount(adjustState.goal.id, Math.round(delta * 100) / 100);
    setAdjustState(null);
    setAdjustAmount('');
    setAdjustError('');
  };

  const getDaysRemainingLabel = (dateStr: string) => {
    const target = parseISODate(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    return `${diffDays} days left`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Saved in Goals
          </span>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(summary.totalSaved, currency)}
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Combined Goal Target
          </span>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {formatCurrency(summary.totalTarget, currency)}
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Overall Progress
            </span>
            <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {summary.overallPct.toFixed(1)}%
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Goal
          </button>
        </div>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="p-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
            No savings goals yet
          </h3>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Create goals for an emergency fund, new laptop, vacation, or any milestone you want to save toward.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Savings Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const pct =
              goal.targetAmount > 0
                ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
                : 0;
            const isCompleted = goal.currentAmount >= goal.targetAmount;
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

            return (
              <div
                key={goal.id}
                className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2.5 rounded-lg shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <PiggyBank className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {goal.name}
                        </h4>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>{formatDate(goal.targetDate)}</span>
                          <span aria-hidden="true">·</span>
                          <span>{getDaysRemainingLabel(goal.targetDate)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(goal)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label={`Edit ${goal.name}`}
                        title="Edit goal"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteGoal(goal)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        aria-label={`Delete ${goal.name}`}
                        title="Delete goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-baseline justify-between text-xs font-mono tabular-nums mb-2">
                      <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(goal.currentAmount, currency)}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        of {formatCurrency(goal.targetAmount, currency)}
                      </span>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs tabular-nums">
                      <span className="text-slate-500 dark:text-slate-400">
                        {isCompleted
                          ? 'Goal achieved!'
                          : `${formatCurrency(remaining, currency)} to go`}
                      </span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustState({ goal, mode: 'add' });
                      setAdjustAmount('');
                      setAdjustError('');
                    }}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Money
                  </button>
                  <button
                    type="button"
                    disabled={goal.currentAmount <= 0}
                    onClick={() => {
                      setAdjustState({ goal, mode: 'withdraw' });
                      setAdjustAmount('');
                      setAdjustError('');
                    }}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                    Withdraw
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Goal Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {editingGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Goal Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Emergency Fund, New Phone"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Target Amount ({currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="50000"
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Current Saved ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Target Date *
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              {formError && (
                <p className="text-xs text-red-600 dark:text-red-400">{formError}</p>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {editingGoal ? 'Save Changes' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Withdraw Money Modal */}
      {adjustState && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          onClick={() => setAdjustState(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {adjustState.mode === 'add' ? 'Add Money' : 'Withdraw Money'}
              </h3>
              <button
                type="button"
                onClick={() => setAdjustState(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Goal: <span className="font-semibold text-slate-900 dark:text-slate-100">{adjustState.goal.name}</span> · Current balance:{' '}
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(adjustState.goal.currentAmount, currency)}
              </span>
            </p>

            <form onSubmit={handleConfirmAdjust} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Amount ({currencySymbol}) *
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  autoFocus
                  value={adjustAmount}
                  onChange={(e) => {
                    setAdjustAmount(e.target.value);
                    if (adjustError) setAdjustError('');
                  }}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
                {adjustError && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{adjustError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustState(null)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-sm font-medium rounded-lg text-white ${
                    adjustState.mode === 'add'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                  }`}
                >
                  {adjustState.mode === 'add' ? 'Deposit' : 'Withdraw'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
