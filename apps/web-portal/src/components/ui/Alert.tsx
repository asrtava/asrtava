import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface AlertProps {
  title?: string;
  children: React.ReactNode;
  variant?: 'emergency' | 'urgent' | 'stable' | 'info';
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  title,
  children,
  variant = 'info',
  onClose,
  className = '',
}) => {
  const styles = {
    emergency: {
      container: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />,
      titleColor: 'text-rose-900',
    },
    urgent: {
      container: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
      titleColor: 'text-amber-900',
    },
    stable: {
      container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
      titleColor: 'text-emerald-900',
    },
    info: {
      container: 'bg-sky-50 border-sky-200 text-sky-900',
      icon: <Info className="w-4 h-4 text-sky-600 shrink-0" />,
      titleColor: 'text-sky-900',
    },
  };

  const current = styles[variant];

  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-lg border ${current.container} ${className}`} role="alert">
      <div className="mt-0.5">{current.icon}</div>
      <div className="flex-1 text-xs">
        {title && <h5 className={`font-semibold mb-0.5 ${current.titleColor}`}>{title}</h5>}
        <div className="text-slate-700 leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className="text-slate-400 hover:text-slate-600 transition -mr-1 -mt-1 p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

