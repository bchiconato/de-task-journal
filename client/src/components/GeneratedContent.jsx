import { useState } from 'react';
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
 * @returns {JSX.Element|null} Rendered markdown preview or null if no content
 */
export function GeneratedContent({
  content,
  onSendToNotion,
  isSending,
}) {
  const [justCopied, setJustCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSendToNotion = async () => {
    await onSendToNotion(content);
  };

  if (!content) return null;

  return (
    <aside
      className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto custom-scrollbar"
      aria-labelledby="preview-heading"
    >
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 pb-4 border-b border-gray-200">
          <h2
            id="preview-heading"
            className="text-2xl font-bold text-gray-900"
          >
            Generated documentation
          </h2>
          <div className="flex gap-2 flex-nowrap">
            <button
              onClick={handleCopy}
              className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium transition-colors ${
                justCopied
                  ? 'text-success-700 bg-success-100'
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200 focus:bg-gray-200'
              }`}
              aria-label="Copy all documentation to clipboard"
              aria-live="polite"
            >
              {justCopied ? '✓ Copied!' : 'Copy all'}
            </button>
            <button
              onClick={handleSendToNotion}
              disabled={isSending}
              className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium text-white transition-colors ${
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
          className="prose prose-sm sm:prose lg:prose-lg max-w-[65ch] mx-auto space-y-6"
          role="article"
          aria-live="polite"
          style={{ lineHeight: '1.6' }}
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
                <h2 className="text-3xl font-bold mt-10 mb-4 text-gray-900 leading-tight">
                  {children}
                </h2>
              ),
              h2: ({ children }) => (
                <h3 className="text-2xl font-semibold mt-8 mb-3 text-gray-900 leading-snug">
                  {children}
                </h3>
              ),
              h3: ({ children }) => (
                <h4 className="text-xl font-semibold mt-6 mb-2 text-gray-900 leading-snug">
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
                <ul className="list-disc pl-6 space-y-2 my-4">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-6 space-y-2 my-4">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="text-gray-800" style={{ lineHeight: '1.6' }}>{children}</li>
              ),
              p: ({ children }) => (
                <p className="my-4 text-gray-800" style={{ lineHeight: '1.6' }}>{children}</p>
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
