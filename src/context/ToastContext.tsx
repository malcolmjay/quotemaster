import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { X, AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />,
  error: <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />,
  info: <Info className="h-5 w-5 text-sky-500 flex-shrink-0" />,
};

const TOAST_STYLES: Record<ToastType, string> = {
  success: 'border-l-4 border-l-emerald-500 bg-white',
  error: 'border-l-4 border-l-red-500 bg-white',
  warning: 'border-l-4 border-l-amber-500 bg-white',
  info: 'border-l-4 border-l-sky-500 bg-white',
};

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  error: 8000,
  warning: 6000,
  info: 5000,
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message?: string, duration?: number) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const ttl = duration ?? DEFAULT_DURATIONS[type];

    setToasts(prev => {
      const next = [...prev, { id, type, title, message, duration: ttl }];
      if (next.length > 5) return next.slice(-5);
      return next;
    });

    const timer = setTimeout(() => removeToast(id), ttl);
    timersRef.current.set(id, timer);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${TOAST_STYLES[toast.type]} rounded shadow-lg border border-gray-200 p-4 pointer-events-auto animate-slide-in-right`}
          >
            <div className="flex items-start gap-3">
              {TOAST_ICONS[toast.type]}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#333]">{toast.title}</p>
                {toast.message && (
                  <p className="text-xs text-[#666] mt-0.5 break-words">{toast.message}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 p-0.5 text-[#999] hover:text-[#333] transition-colors rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
