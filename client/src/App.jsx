import { useState } from 'react';
import { InputForm } from './components/InputForm';
import { GeneratedContent } from './components/GeneratedContent';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Toast } from './components/Toast';
import { useToast } from './hooks/useToast';
import { generateDocumentation, sendToNotion } from './utils/api';

/**
 * @component App
 * @description Main application component with two-column layout and toast notifications
 * @returns {JSX.Element} Main app component with form, preview, and toast system
 */
function App() {
  const [documentation, setDocumentation] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [formCollapsed, setFormCollapsed] = useState(false);

  const { toasts, showSuccess, showError, removeToast } = useToast();

  const handleGenerate = async (formData) => {
    setIsGenerating(true);
    setDocumentation('');

    try {
      const result = await generateDocumentation(formData);
      setDocumentation(result);
      setFormCollapsed(true);
      showSuccess('Documentation generated successfully!');
    } catch (err) {
      console.error('Error generating documentation:', err);
      showError(err.message || 'Failed to generate documentation. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendToNotion = async (content) => {
    if (isSending) {
      return false;
    }

    setIsSending(true);

    try {
      await sendToNotion(content);
      showSuccess('Documentation sent to Notion successfully!');
      return true;
    } catch (err) {
      console.error('Error sending to Notion:', err);
      showError(err.message || 'Failed to send to Notion. Please check your configuration.');
      return false;
    } finally {
      setIsSending(false);
    }
  };

  const toggleFormCollapsed = () => {
    setFormCollapsed(!formCollapsed);
  };

  return (
    <>
      <a
        href="#main-content"
        className="skip-link"
      >
        Skip to main content
      </a>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100">
        <main
          id="main-content"
          className="container mx-auto py-8 max-w-content-wide 2xl:max-w-content-ultra px-4 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12"
        >
          <div
            className={`
              grid gap-8 lg:gap-10
              ${documentation ? 'lg:grid-cols-[minmax(520px,1.2fr),1fr]' : 'lg:grid-cols-1'}
              transition-all duration-300
            `}
          >
            <div
              className={`
                ${formCollapsed && documentation ? 'hidden lg:block' : ''}
                transition-all duration-300
              `}
            >
              <InputForm
                onGenerate={handleGenerate}
                isLoading={isGenerating}
              />

              {formCollapsed && documentation && (
                <button
                  onClick={toggleFormCollapsed}
                  className="lg:hidden mt-4 w-full py-3 px-6 rounded-lg font-semibold text-primary-600 bg-white shadow-md hover:bg-gray-50 transition-colors"
                  aria-label="Show form to edit inputs"
                >
                  Edit inputs
                </button>
              )}
            </div>

            {isGenerating && (
              <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner message="Generating your documentation..." />
              </div>
            )}

            {documentation && !isGenerating && (
              <GeneratedContent
                content={documentation}
                onSendToNotion={handleSendToNotion}
                isSending={isSending}
              />
            )}
          </div>

          {!documentation && !isGenerating && (
            <div className="text-center mt-12 text-gray-600">
              <svg
                className="mx-auto h-24 w-24 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="mt-4 text-lg font-medium">
                Fill out the form to generate your documentation
              </p>
              <p className="mt-2 text-sm">
                Provide context about your data engineering task to get started
              </p>
            </div>
          )}
        </main>
      </div>

      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          show={toast.show}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
}

export { App };
