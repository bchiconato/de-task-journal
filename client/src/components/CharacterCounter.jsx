import { useMemo } from 'react';

/**
 * @component CharacterCounter
 * @description Character counter component with optional max length and color-coded warnings
 * @param {Object} props
 * @param {number} props.current - Current character count
 * @param {number} props.max - Optional maximum character count
 * @param {string} props.id - Unique ID for aria-describedby linking
 * @returns {JSX.Element} Character counter with accessibility support
 */
export function CharacterCounter({ current, max, id }) {
  const colorClass = useMemo(() => {
    if (!max) return 'text-gray-500';

    const percentage = (current / max) * 100;

    if (percentage >= 100) {
      return 'text-error-600 font-semibold';
    } else if (percentage >= 90) {
      return 'text-yellow-600 font-medium';
    } else if (percentage >= 75) {
      return 'text-yellow-500';
    } else {
      return 'text-gray-500';
    }
  }, [current, max]);

  const displayText = useMemo(() => {
    if (max) {
      return `${current.toLocaleString()} / ${max.toLocaleString()} characters`;
    }
    return `${current.toLocaleString()} characters`;
  }, [current, max]);

  const srText = useMemo(() => {
    if (!max) return displayText;

    const remaining = max - current;
    if (remaining < 0) {
      return `Exceeded maximum by ${Math.abs(remaining)} characters`;
    } else if (remaining === 0) {
      return 'Maximum character limit reached';
    } else if (remaining <= 10) {
      return `${remaining} characters remaining`;
    }
    return displayText;
  }, [current, max, displayText]);

  return (
    <div
      id={id}
      className={`text-xs ${colorClass} transition-colors duration-150`}
      aria-live="polite"
      aria-atomic="true"
    >
      <span aria-hidden="true">{displayText}</span>
      <span className="sr-only">{srText}</span>
    </div>
  );
}
