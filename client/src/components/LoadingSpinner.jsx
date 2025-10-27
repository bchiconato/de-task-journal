/**
 * Loading spinner component with accessibility support
 * @param {Object} props
 * @param {string} props.message - Loading message to display
 */
export function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600"
        aria-hidden="true"
      ></div>
      <p className="mt-4 text-gray-600 font-medium" aria-label={message}>
        {message}
      </p>
    </div>
  );
}
