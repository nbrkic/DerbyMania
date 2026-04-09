import React, { forwardRef } from 'react';
import { cn } from '../utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'outlined' | 'filled';
  isClickable?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
  rounded?: 'none' | 'small' | 'medium' | 'large';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, isClickable = false, padding = 'none', rounded = 'large', ...props }, ref) => {
    const paddings = { none: '', small: 'p-3', medium: 'p-5', large: 'p-7' };
    const roundeds = { none: 'rounded-none', small: 'rounded-lg', medium: 'rounded-xl', large: 'rounded-2xl' };
    const clickable = isClickable ? 'cursor-pointer hover:border-blue-500/20 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200' : '';

    return (
      <div
        ref={ref}
        className={cn('glass-card', paddings[padding], roundeds[rounded], clickable, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';
