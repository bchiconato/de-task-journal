import { useState, useCallback } from 'react';

/**
 * @function useToast
 * @description Custom hook for managing toast notifications with show/hide/remove functions
 * @returns {{toasts: Array, showSuccess: Function, showError: Function, removeToast: Function}} Toast state and control functions
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, show: false } : toast,
      ),
    );

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 300);
  }, []);

  const showToast = useCallback(
    (message, type = 'info', duration = 3000) => {
      setToasts((prev) => {
        const isDuplicate = prev.some(
          (toast) =>
            toast.message === message && toast.type === type && toast.show,
        );

        if (isDuplicate) {
          return prev;
        }

        const id = Date.now() + Math.random();
        const newToast = {
          id,
          message,
          type,
          duration,
          show: true,
        };

        if (duration > 0) {
          setTimeout(() => {
            removeToast(id);
          }, duration + 300);
        }

        return [...prev, newToast];
      });

      return null;
    },
    [removeToast],
  );

  const showSuccess = useCallback(
    (message, duration) => showToast(message, 'success', duration),
    [showToast],
  );

  const showError = useCallback(
    (message, duration) => showToast(message, 'error', duration),
    [showToast],
  );

  return {
    toasts,
    showSuccess,
    showError,
    removeToast,
  };
}
