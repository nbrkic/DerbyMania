import React from 'react';
import { ChevronDown } from 'lucide-react';

interface Option { value: string | number; label: string; }

interface SelectProps {
  options: Option[];
  value?: string | number;
  onChange?: (value: string | number) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  options, value, onChange, label, placeholder, disabled, className,
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block mb-1.5 text-xs font-semibold text-silver-400 uppercase tracking-wider">{label}</label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange?.(e.target.value)}
          disabled={disabled}
          className={`input-field w-full h-10 px-3 pr-9 rounded-xl appearance-none text-sm cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className ?? ''}`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(o => (
            <option key={o.value} value={o.value} style={{background:'#050D1C'}}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-silver-600 pointer-events-none" />
      </div>
    </div>
  );
};
