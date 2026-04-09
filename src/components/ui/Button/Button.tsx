import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  iconOnly?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  leftIcon,
  rightIcon,
  iconOnly,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) => {
  const base = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl';

  const variants = {
    primary:     'btn-primary',
    secondary:   'btn-ghost',
    tertiary:    'btn-ghost border-0 bg-transparent',
    destructive: 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20',
    ghost:       'btn-ghost',
  };

  const sizes = {
    small:  'text-xs px-3 py-1.5 gap-1.5 h-8',
    medium: 'text-sm px-4 py-2 gap-2 h-10',
    large:  'text-base px-6 py-3 gap-2.5 h-12',
  };

  const iconSizes = {
    small:  'p-1.5 w-8 h-8',
    medium: 'p-2 w-10 h-10',
    large:  'p-3 w-12 h-12',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${iconOnly ? iconSizes[size] : sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <LoadingSpinner className="mr-2" />
      ) : (
        <>
          {leftIcon}
          {iconOnly ?? children}
          {rightIcon}
        </>
      )}
    </button>
  );
};
