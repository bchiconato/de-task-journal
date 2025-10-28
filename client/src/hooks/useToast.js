import { useState, useCallback } from 'react';

/**
 * @function useToast
 * @description Custom hook for managing toast notifications with show/hide/remove functions
 * @returns {{toasts: Array, showToast: Function, showSuccess: Function, showError: Function, showInfo: Function, removeToast: Function}} Toast state and control functions
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  /**
   * Show a new toast notification
   * @param {string} message - Toast message
   * @param {('success'|'error'|'info')} type - Toast type
   * @param {number} duration - Auto-dismiss duration (default: 3000ms)
   */
  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    setToasts((prev) => {
      const isDuplicate = prev.some(
        (toast) => toast.message === message && toast.type === type && toast.show
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
  }, []);

  /**
   * Remove a specific toast by ID
   * @param {number} id - Toast ID
   */
  const removeToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, show: false } : toast
      )
    );

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 300);
  }, []);

  /**
   * Clear all toasts
   */
  const clearAllToasts = useCallback(() => {
    setToasts((prev) => prev.map((toast) => ({ ...toast, show: false })));
    setTimeout(() => {
      setToasts([]);
    }, 300);
  }, []);

  /**
   * Convenience methods for different toast types
   */
  const showSuccess = useCallback(
    (message, duration) => showToast(message, 'success', duration),
    [showToast]
  );

  const showError = useCallback(
    (message, duration) => showToast(message, 'error', duration),
    [showToast]
  );

  const showInfo = useCallback(
    (message, duration) => showToast(message, 'info', duration),
    [showToast]
  );

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    showInfo,
    removeToast,
    clearAllToasts,
  };
}
