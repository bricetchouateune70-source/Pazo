'use client';

import { create } from 'zustand';
import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    // Auto-remove nach 5 Sekunden
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 5000);
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

// Convenience Funktionen
export const toast = {
  success: (message: string) => useToastStore.getState().addToast(message, 'success'),
  error: (message: string) => useToastStore.getState().addToast(message, 'error'),
  info: (message: string) => useToastStore.getState().addToast(message, 'info'),
};

export function Toaster() {
  const { toasts, removeToast } = useToastStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg min-w-[300px] ${
            t.type === 'success'
              ? 'bg-green-500 text-white'
              : t.type === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-gray-800 text-white'
          }`}
        >
          {t.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {t.type === 'error' && <AlertCircle className="w-5 h-5" />}
          {t.type === 'info' && <Info className="w-5 h-5" />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
