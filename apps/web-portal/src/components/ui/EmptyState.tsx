import React from 'react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => (
  <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50">
    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
      {icon || <Inbox className="w-6 h-6 text-slate-400" />}
    </div>
    <h3 className="text-sm font-bold text-slate-900">{title}</h3>
    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">{description}</p>
    {action && <div>{action}</div>}
  </div>
);

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="w-full space-y-3 animate-pulse p-4">
    <div className="h-4 bg-slate-200 rounded-md w-1/4 mb-4"></div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex space-x-4 items-center">
        <div className="h-9 w-9 bg-slate-200 rounded-lg"></div>
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-slate-200 rounded w-3/4"></div>
          <div className="h-2 bg-slate-100 rounded w-1/2"></div>
        </div>
        <div className="h-6 w-16 bg-slate-200 rounded"></div>
      </div>
    ))}
  </div>
);

