/**
 * Error message component with accessibility support
 * @param {Object} props
 * @param {string} props.message - Error message to display
 * @param {Function} props.onDismiss - Optional dismiss handler
 */
export function ErrorMessage({ message, onDismiss }) {
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div
        className="bg-error-50 border-2 border-error-600 rounded-lg p-4 flex items-start justify-between"
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-start gap-3">
          <svg
            className="w-6 h-6 text-error-600 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="text-error-900 font-semibold mb-1">Error</h3>
            <p className="text-error-800">{message}</p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-error-600 hover:text-error-700 focus:text-error-700 transition-colors flex-shrink-0"
            aria-label="Dismiss error message"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
