function ErrorMessage({ message, onDismiss }) {
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start justify-between">
        <div className="flex items-start">
          <svg
            className="w-6 h-6 text-red-500 mt-0.5 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="text-red-800 font-semibold mb-1">Error</h3>
            <p className="text-red-700">{message}</p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-500 hover:text-red-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
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

export default ErrorMessage;
