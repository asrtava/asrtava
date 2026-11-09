import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number | string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'pills';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className = '',
}) => {
  if (variant === 'pills') {
    return (
      <div className={`flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl overflow-x-auto ${className}`}>
        {tabs.map((t) => {
          const isActive = t.id === activeTab;
          return (
            <button
              key={t.id}
              type="button"
              disabled={t.disabled}
              onClick={() => onChange(t.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition duration-150 whitespace-nowrap ${
                isActive
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              } ${t.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {t.icon && <span className="shrink-0">{t.icon}</span>}
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`border-b border-slate-200 flex items-center gap-6 overflow-x-auto ${className}`}>
      {tabs.map((t) => {
        const isActive = t.id === activeTab;
        return (
          <button
            key={t.id}
            type="button"
            disabled={t.disabled}
            onClick={() => onChange(t.id)}
            className={`relative flex items-center gap-2 py-3 text-xs font-semibold whitespace-nowrap transition duration-150 ${
              isActive ? 'text-brand-700' : 'text-slate-500 hover:text-slate-800'
            } ${t.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {t.icon && <span className="shrink-0">{t.icon}</span>}
            <span>{t.label}</span>
            {t.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {t.count}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-600 rounded-t-full" />
            )}
          </button>
        );
      })}
    </div>
  );
};

