import React from 'react';
import type { ToastPosition } from './ToastProvider';
const positionClasses: Record<ToastPosition, string> = {
  'top-left': 'top-0 left-0',
  'top-right': 'top-0 right-0',
  'bottom-left': 'bottom-0 left-0',
  'bottom-right': 'bottom-0 right-0',
  'top-center': 'top-0 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2'
};
export const ToastContainer: React.FC<{
  children: React.ReactNode;
  position: ToastPosition;
}> = ({ children, position }) => {
  return (
    <div
      className={`fixed z-50 m-4 flex flex-col gap-2 ${positionClasses[position]}`}
      role="region"
      aria-label="Notifications">
      
      {children}
    </div>);

};