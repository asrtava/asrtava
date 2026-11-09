import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (val: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  containerClassName?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search records, UHID, or name...',
  className = '',
  containerClassName = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onChange('');
    if (onClear) onClear();
  };

  return (
    <div
      className={`relative flex items-center rounded-lg border bg-white transition duration-150 ${
        isFocused ? 'border-brand-600 ring-2 ring-brand-100' : 'border-slate-300 hover:border-slate-400'
      } ${containerClassName}`}
    >
      <div className="pl-3 pr-2 text-slate-400 pointer-events-none flex items-center">
        <Search className="w-4 h-4" />
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={`w-full py-2 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none ${className}`}
        {...props}
      />

      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search input"
          className="pr-3 pl-1 text-slate-400 hover:text-slate-600 transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

