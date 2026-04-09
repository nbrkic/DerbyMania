import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  maxLength?: number;
  showCharacterCount?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, startAdornment, endAdornment, size = 'medium', maxLength, showCharacterCount, disabled, readOnly, type = 'text', className, value, defaultValue, onChange, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [inputValue, setInputValue] = useState(value || defaultValue || '');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      onChange?.(e);
    };

    const heights = { small: 'h-8 text-sm', medium: 'h-10 text-sm', large: 'h-12 text-base' };
    const isPassword = type === 'password';
    const currentType = isPassword && showPassword ? 'text' : type;

    return (
      <div className="w-full">
        {label && (
          <label className="block mb-1.5 text-xs font-semibold text-silver-400 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative">
          {startAdornment && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-silver-600">
              {startAdornment}
            </div>
          )}
          <input
            {...props}
            ref={ref}
            type={currentType}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            readOnly={readOnly}
            maxLength={maxLength}
            className={`
              input-field w-full ${heights[size]} px-3 rounded-xl
              ${startAdornment ? 'pl-10' : ''}
              ${endAdornment || isPassword ? 'pr-10' : ''}
              ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${className ?? ''}
            `}
          />
          {(endAdornment || isPassword) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-silver-600">
              {isPassword ? (
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-silver-300 transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              ) : endAdornment}
            </div>
          )}
        </div>
        <div className="mt-1.5 flex justify-between">
          {(error || helperText) && (
            <span className={`text-xs ${error ? 'text-red-400' : 'text-silver-600'}`}>
              {error ?? helperText}
            </span>
          )}
          {showCharacterCount && maxLength && (
            <span className="text-xs text-silver-600 ml-auto">{String(inputValue).length}/{maxLength}</span>
          )}
        </div>
      </div>
    );
  }
);
Input.displayName = 'Input';
