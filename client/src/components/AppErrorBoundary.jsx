/**
 * @fileoverview Error boundary component for graceful error handling
 * @component AppErrorBoundary
 * @description Catches React render errors and displays a fallback UI instead of
 * white-screening the application. Logs errors to console for debugging.
 * @example
 *   <AppErrorBoundary>
 *     <App />
 *   </AppErrorBoundary>
 */
import React from 'react';

export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React render error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex min-h-screen items-center justify-center bg-gray-50 px-4"
        >
          <div className="max-w-md rounded-lg border border-red-200 bg-white p-6 shadow-lg">
            <h1 className="mb-2 text-xl font-semibold text-red-600">
              Something went wrong
            </h1>
            <p className="mb-4 text-gray-700">
              An unexpected error occurred. Please refresh the page to try
              again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
