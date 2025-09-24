import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastIcons = {
  success: <CheckCircle2 className="w-6 h-6 text-green-500" />,
  error: <XCircle className="w-6 h-6 text-red-500" />,
  info: <Info className="w-6 h-6 text-blue-500" />,
};

const toastStyles = {
    success: 'bg-green-100 dark:bg-green-800/50 border-green-500 dark:border-green-600',
    error: 'bg-red-100 dark:bg-red-800/50 border-red-500 dark:border-red-600',
    info: 'bg-blue-100 dark:bg-blue-800/50 border-blue-500 dark:border-blue-600',
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000); // 5 seconds
  }, []);

  const removeToast = (id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-5 right-5 z-[100] w-full max-w-xs space-y-3">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-start p-4 rounded-lg shadow-lg border-s-4 w-full animate-fade-in-right ${toastStyles[toast.type]}`}
          >
            <div className="flex-shrink-0">{toastIcons[toast.type]}</div>
            <div className="ms-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ms-auto -mx-1.5 -my-1.5 bg-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg p-1.5 inline-flex h-8 w-8"
            >
              <span className="sr-only">Close</span>
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes fade-in-right {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        html[dir="rtl"] @keyframes fade-in-right {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fade-in-right {
          animation: fade-in-right 0.3s ease-out forwards;
        }
      `}</style>
    </ToastContext.Provider>
  );
};
