import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { ToastProps } from './ToastProvider';
export const Toast: React.FC<
  ToastProps & {
    onClose: () => void;
  }> =
({ type, message, duration = 5000, onClose, action, icon }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!duration) return;
    const startTime = Date.now();
    const endTime = startTime + duration;
    const updateProgress = () => {
      if (isPaused) return;
      const now = Date.now();
      const remaining = endTime - now;
      const newProgress = remaining / duration * 100;
      if (newProgress <= 0) {
        onClose();
      } else {
        setProgress(newProgress);
        requestAnimationFrame(updateProgress);
      }
    };
    const animationFrame = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animationFrame);
  }, [duration, isPaused, onClose]);
  const handleMouseEnter = useCallback(() => setIsPaused(true), []);
  const handleMouseLeave = useCallback(() => setIsPaused(false), []);
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -20
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      exit={{
        opacity: 0,
        y: -20
      }}
      className="relative w-full max-w-sm overflow-hidden rounded border border-gray-200 bg-white p-4 shadow-sm"
      role="alert"
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}>
      
      <div className="flex items-start gap-3">
        {icon && <span className="text-gray-600">{icon}</span>}
        <div className="flex-1">
          <p className="text-sm text-gray-600">{message}</p>
          {action &&
          <button
            onClick={action.onClick}
            className="mt-2 text-sm font-medium text-gray-900 hover:text-gray-700">
            
              {action.label}
            </button>
          }
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close notification">
          
          <X size={16} />
        </button>
      </div>
      {duration &&
      <div className="absolute bottom-0 left-0 h-1 w-full bg-gray-100">
          <div
          className="h-full bg-gray-700 transition-all duration-300"
          style={{
            width: `${progress}%`
          }} />
        
        </div>
      }
    </motion.div>);

};