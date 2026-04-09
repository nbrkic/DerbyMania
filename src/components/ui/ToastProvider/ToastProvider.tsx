import React, {
  useCallback,
  createContext,
  useContext,
  useReducer } from
'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import { Toast } from './Toast';
import { ToastContainer } from './ToastContainer';
import { Info, AlertCircle, CheckCircle, AlertTriangle, X } from 'lucide-react';
export type ToastType = 'info' | 'success' | 'warning' | 'error';
export type ToastPosition =
'top-left' |
'top-right' |
'bottom-left' |
'bottom-right' |
'top-center' |
'bottom-center';
export interface ToastProps {
  id: string;
  type: ToastType;
  message: string | React.ReactNode;
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
}
interface ToastContextType {
  addToast: (toast: Omit<ToastProps, 'id'>) => void;
  removeToast: (id: string) => void;
  position: ToastPosition;
  setPosition: (position: ToastPosition) => void;
}
const ToastContext = createContext<ToastContextType | undefined>(undefined);
type ToastState = {
  toasts: ToastProps[];
  position: ToastPosition;
};
type ToastAction =
{
  type: 'ADD_TOAST';
  payload: ToastProps;
} |
{
  type: 'REMOVE_TOAST';
  payload: string;
} |
{
  type: 'SET_POSITION';
  payload: ToastPosition;
};
const toastReducer = (state: ToastState, action: ToastAction): ToastState => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, action.payload]
      };
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.payload)
      };
    case 'SET_POSITION':
      return {
        ...state,
        position: action.payload
      };
    default:
      return state;
  }
};
export const ToastProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [state, dispatch] = useReducer(toastReducer, {
    toasts: [],
    position: 'top-right'
  });
  const addToast = useCallback((toast: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    dispatch({
      type: 'ADD_TOAST',
      payload: {
        ...toast,
        id
      }
    });
  }, []);
  const removeToast = useCallback((id: string) => {
    dispatch({
      type: 'REMOVE_TOAST',
      payload: id
    });
  }, []);
  const setPosition = useCallback((position: ToastPosition) => {
    dispatch({
      type: 'SET_POSITION',
      payload: position
    });
  }, []);
  return (
    <ToastContext.Provider
      value={{
        addToast,
        removeToast,
        position: state.position,
        setPosition
      }}>
      
      {children}
      {createPortal(
        <ToastContainer position={state.position}>
          <AnimatePresence>
            {state.toasts.map((toast) =>
            <Toast
              key={toast.id}
              {...toast}
              onClose={() => removeToast(toast.id)} />

            )}
          </AnimatePresence>
        </ToastContainer>,
        document.body
      )}
    </ToastContext.Provider>);

};
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};