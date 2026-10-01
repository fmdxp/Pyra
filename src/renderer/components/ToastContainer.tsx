import React from 'react';
import { Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useLauncher } from '../context/LauncherContext';

export const ToastContainer: React.FC = () => {
  const { toasts } = useLauncher();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          {toast.type === 'success' && <CheckCircle2 size={18} color="#10b981" />}
          {toast.type === 'error' && <AlertTriangle size={18} color="#f43f5e" />}
          {toast.type === 'info' && <Info size={18} color="#8b5cf6" />}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
};
