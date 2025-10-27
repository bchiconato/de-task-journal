import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

/**
 * @component GeneratedContent
 * @description Generated documentation preview with markdown rendering and action buttons
 * @param {Object} props
 * @param {string} props.content - Markdown content to render
 * @param {Function} props.onSendToNotion - Send to Notion handler
 * @param {boolean} props.isSending - Whether send is in progress
 * @param {Function} props.onCopySuccess - Toast callback for copy success
 * @param {Function} props.onCopyError - Toast callback for copy error
 * @param {Function} props.onSendSuccess - Toast callback for send success
 * @param {Function} props.onSendError - Toast callback for send error
 * @returns {JSX.Element|null} Rendered markdown preview or null if no content
 */
export function GeneratedContent({
  content,
  onSendToNotion,
  isSending,
  onCopySuccess,
  onCopyError,
  onSendSuccess,
  onSendError,
}) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      if (onCopySuccess) {
        onCopySuccess();
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      if (onCopyError) {
        onCopyError();
      }
    }
  };

  const handleSendToNotion = async () => {
    try {
      const success = await onSendToNotion(content);
      if (success && onSendSuccess) {
        onSendSuccess();
      } else if (!success && onSendError) {
        onSendError();
      }
    } catch (err) {
      console.error('Failed to send to Notion:', err);
      if (onSendError) {
        onSendError();
      }
    }
  };

  if (!content) return null;

  return (
    <aside
      className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto custom-scrollbar"
      aria-labelledby="preview-heading"
    >
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 pb-4 border-b border-gray-200">
          <h2
            id="preview-heading"
            className="text-2xl font-bold text-gray-900"
          >
            Generated documentation
          </h2>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:bg-gray-200 transition-colors"
              aria-label="Copy all documentation to clipboard"
            >
              Copy all
            </button>
            <button
              onClick={handleSendToNotion}
              disabled={isSending}
              className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                isSending
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 focus:bg-purple-700'
              }`}
              aria-label="Send documentation to Notion"
              aria-busy={isSending}
            >
              {isSending ? 'Sending...' : 'Send to Notion'}
            </button>
          </div>
        </div>

        <div
          className="prose prose-sm sm:prose lg:prose-lg max-w-none"
          role="article"
          aria-live="polite"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';

                return !inline && language ? (
                  <SyntaxHighlighter
                    style={tomorrow}
                    language={language}
                    PreTag="div"
                    customStyle={{
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      fontSize: '0.875rem',
                    }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              h1: ({ children }) => (
                <h2 className="text-3xl font-bold mt-6 mb-3 text-gray-900">
                  {children}
                </h2>
              ),
              h2: ({ children }) => (
                <h3 className="text-2xl font-semibold mt-5 mb-2 text-gray-900">
                  {children}
                </h3>
              ),
              h3: ({ children }) => (
                <h4 className="text-xl font-semibold mt-4 mb-2 text-gray-900">
                  {children}
                </h4>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-primary-600 underline hover:text-primary-700"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-6 space-y-1 my-3">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-6 space-y-1 my-3">{children}</ol>
              ),
              p: ({ children }) => (
                <p className="my-3 text-gray-800 leading-relaxed">{children}</p>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </aside>
  );
}
