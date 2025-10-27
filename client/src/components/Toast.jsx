import { useEffect, useState } from 'react';

/**
 * Accessible toast notification component
 * @param {Object} props
 * @param {string} props.message - Toast message content
 * @param {('success'|'error'|'info')} props.type - Toast variant
 * @param {number} props.duration - Auto-dismiss duration in ms (default: 3000)
 * @param {Function} props.onClose - Callback when toast is closed
 * @param {boolean} props.show - Controls visibility
 */
export default function Toast({ message, type = 'info', duration = 3000, onClose, show = true }) {
  const [isVisible, setIsVisible] = useState(show);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setIsVisible(show);
    if (!show) {
      setIsExiting(true);
    }
  }, [show]);

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) {
        onClose();
      }
    }, 300);
  };

  if (!isVisible && !isExiting) return null;

  const variants = {
    success: {
      bg: 'bg-success-50 border-success-700',
      text: 'text-success-900',
      icon: '✓',
      iconBg: 'bg-success-700',
    },
    error: {
      bg: 'bg-error-50 border-error-600',
      text: 'text-error-900',
      icon: '✕',
      iconBg: 'bg-error-600',
    },
    info: {
      bg: 'bg-primary-50 border-primary-600',
      text: 'text-primary-900',
      icon: 'ℹ',
      iconBg: 'bg-primary-600',
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
          ${variant.bg} border-2 rounded-lg shadow-lg
          px-4 py-3 min-w-[300px] max-w-md
        `}
      >
        <div
          className={`
            flex-shrink-0 w-6 h-6 rounded-full ${variant.iconBg}
            flex items-center justify-center text-white text-sm font-bold
          `}
          aria-hidden="true"
        >
          {variant.icon}
        </div>

        <p className={`flex-1 text-sm font-medium ${variant.text}`}>
          {message}
        </p>

        <button
          onClick={handleClose}
          className={`
            flex-shrink-0 w-6 h-6 rounded
            ${variant.text} opacity-70 hover:opacity-100
            focus:opacity-100 focus:outline-none
            transition-opacity
          `}
          aria-label="Close notification"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  );
}
