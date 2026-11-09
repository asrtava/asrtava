import React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className = '',
}) => {
  const isSmall = size === 'sm';

  return (
    <label
      className={`inline-flex items-center gap-2.5 cursor-pointer select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex shrink-0 transition-colors duration-200 ease-in-out rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-600 ${
          isSmall ? 'h-4 w-7' : 'h-5 w-9'
        } ${checked ? 'bg-brand-600' : 'bg-slate-300'}`}
      >
        <span
          className={`inline-block rounded-full bg-white shadow-sm transform transition duration-200 ease-in-out ${
            isSmall ? 'h-3 w-3 translate-y-0.5' : 'h-4 w-4 translate-y-0.5'
          } ${
            checked
              ? isSmall
                ? 'translate-x-3.5'
                : 'translate-x-4.5'
              : 'translate-x-0.5'
          }`}
        />
      </button>

      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-xs font-semibold text-slate-800">{label}</span>}
          {description && <span className="text-[11px] text-slate-500">{description}</span>}
        </div>
      )}
    </label>
  );
};

