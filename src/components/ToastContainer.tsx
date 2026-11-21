import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { ToastMessage } from '../types/finance';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none px-4 sm:px-0"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const iconMap = {
          success: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />,
          error: <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />,
          warning: <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />,
          info: <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />,
        };

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg transition-all duration-150"
          >
            <div className="mt-0.5">{iconMap[toast.type]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {toast.title}
              </p>
              {toast.description && (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
