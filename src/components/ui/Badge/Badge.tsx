import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error';
type BadgeSize = 'small' | 'medium' | 'large';
type BadgeShape = 'circle' | 'rounded' | 'square';
type BadgePosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  shape?: BadgeShape;
  position?: BadgePosition;
  visible?: boolean;
  dismissible?: boolean;
  className?: string;
  onDismiss?: () => void;
}

const variantClass: Record<BadgeVariant, string> = {
  primary:   'badge-blue',
  secondary: 'badge-gray',
  success:   'badge-green',
  warning:   'badge-amber',
  error:     'badge-red',
};

const positionStyles: Record<BadgePosition, string> = {
  'top-right':    'absolute top-0 right-0 -translate-y-1/2 translate-x-1/2',
  'top-left':     'absolute top-0 left-0 -translate-y-1/2 -translate-x-1/2',
  'bottom-right': 'absolute bottom-0 right-0 translate-y-1/2 translate-x-1/2',
  'bottom-left':  'absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2',
  center:         'inline-flex',
};

export const Badge = ({
  children, variant = 'primary', position = 'center',
  visible = true, dismissible = false, className = '', onDismiss,
}: BadgeProps) => {
  const [isVisible, setIsVisible] = useState(visible);
  useEffect(() => setIsVisible(visible), [visible]);
  if (!isVisible) return null;

  return (
    <span className={`${variantClass[variant]} ${positionStyles[position]} items-center gap-1 ${className}`}>
      {children}
      {dismissible && (
        <button onClick={() => { setIsVisible(false); onDismiss?.(); }} className="hover:opacity-70 transition-opacity ml-0.5">
          <X size={9} />
        </button>
      )}
    </span>
  );
};
