/**
 * @fileoverview Animated toast notification component with accessible semantics
 */
import { useEffect, useState, useCallback } from 'react';

/**
 * @component Toast
 * @description Accessible toast notification component with auto-dismiss and animations
 * @param {Object} props
 * @param {string} props.message - Toast message content
 * @param {('success'|'error'|'info')} props.type - Toast variant
 * @param {number} props.duration - Auto-dismiss duration in ms (default: 3000)
 * @param {Function} props.onClose - Callback when toast is closed
 * @param {boolean} props.show - Controls visibility
 * @returns {JSX.Element|null} Toast notification or null if not visible
 */
export function Toast({
  message,
  type = 'info',
  duration = 3000,
  onClose,
  show = true,
}) {
  const [isVisible, setIsVisible] = useState(show);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setIsExiting(false);
    } else if (isVisible) {
      setIsExiting(true);
    }
  }, [show, isVisible]);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) {
        onClose();
      }
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, handleClose]);

  if (!isVisible && !isExiting) return null;

  const variants = {
    success: {
      bg: 'bg-emerald-50 border-emerald-600',
      text: 'text-emerald-900',
      icon: '✓',
      iconBg: 'bg-emerald-600',
    },
    error: {
      bg: 'bg-red-50 border-red-600',
      text: 'text-red-900',
      icon: '✕',
      iconBg: 'bg-red-600',
    },
    info: {
      bg: 'bg-indigo-50 border-indigo-600',
      text: 'text-indigo-900',
      icon: 'ℹ',
      iconBg: 'bg-indigo-600',
    },
  };

  const variant = variants[type] || variants.info;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`fixed top-4 right-4 z-50 ${isExiting ? 'toast-exit' : 'toast-enter'}`}
    >
      <div
        className={`
          flex items-center gap-3
          ${variant.bg} border rounded-xl shadow-lg
          px-4 py-3 min-w-[300px] max-w-md
        `}
      >
        <div
          className={`
            flex-shrink-0 w-6 h-6 rounded-full ${variant.iconBg}
            flex items-center justify-center text-white text-xs font-bold
          `}
          aria-hidden="true"
        >
          {variant.icon}
        </div>

        <p
          className={`flex-1 text-sm font-medium ${variant.text} leading-relaxed`}
        >
          {message}
        </p>

        <button
          onClick={handleClose}
          className={`
            flex-shrink-0 w-6 h-6 rounded
            ${variant.text} opacity-70 hover:opacity-100
            focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
            transition-opacity
          `}
          aria-label="Close notification"
        >
          <span aria-hidden="true" className="text-lg">
            ×
          </span>
        </button>
      </div>
    </div>
  );
}
