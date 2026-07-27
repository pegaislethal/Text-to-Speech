'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, RefreshCw, X } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'error' | 'loading';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, action?: ToastAction) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', action?: ToastAction) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    const newToast: ToastMessage = { id, message, type, action };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, action ? 6000 : 3000);
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, clearToasts }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-in fade-in slide-in-from-bottom-4 ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 dark:bg-emerald-950/90 border-emerald-500/40 text-emerald-100'
                : toast.type === 'error'
                ? 'bg-rose-950/90 dark:bg-rose-950/90 border-rose-500/40 text-rose-100'
                : toast.type === 'loading'
                ? 'bg-indigo-950/90 dark:bg-indigo-950/90 border-indigo-500/40 text-indigo-100'
                : 'bg-indigo-950/90 dark:bg-indigo-950/90 border-indigo-500/40 text-indigo-100'
            }`}
          >
            <div className="flex items-center gap-3">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-indigo-400 shrink-0" />}
              {toast.type === 'loading' && <RefreshCw className="w-5 h-5 text-indigo-400 shrink-0 animate-spin" />}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold leading-snug">{toast.message}</span>
                {toast.action && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.action?.onClick();
                      removeToast(toast.id);
                    }}
                    className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold text-white transition self-start cursor-pointer pointer-events-auto active:scale-95 shadow-sm shadow-indigo-500/20"
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg hover:bg-white/10 transition text-neutral-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
