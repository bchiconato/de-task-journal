/**
 * @component LoadingSpinner
 * @description Loading spinner component with accessibility support and customizable message and size
 * @param {Object} props
 * @param {string} [props.message='Loading...'] - Loading message to display
 * @param {'small'|'medium'|'large'} [props.size='large'] - Spinner size
 * @returns {JSX.Element} Animated loading spinner with message
 */
export function LoadingSpinner({ message = 'Loading...', size = 'large' }) {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-16 w-16',
  };

  const spinnerSize = sizeClasses[size] || sizeClasses.large;
  const showMessage = size === 'large';

  return (
    <div
      className={`flex ${showMessage ? 'flex-col' : 'flex-row'} items-center justify-center ${showMessage ? 'py-12' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className={`animate-spin rounded-full ${spinnerSize} border-b-4 border-primary-600`}
        aria-hidden="true"
      ></div>
      {showMessage && (
        <p className="mt-4 text-gray-600 font-medium" aria-label={message}>
          {message}
        </p>
      )}
      {!showMessage && <span className="sr-only">{message}</span>}
    </div>
  );
}
