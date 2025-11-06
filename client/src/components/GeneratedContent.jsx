/**
 * @fileoverview Markdown preview and editing surface for generated documentation
 */
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { CodeImplementationEditor } from './CodeImplementationEditor';

/**
 * @component GeneratedContent
 * @description Generated documentation preview with markdown rendering, editing capabilities, and action buttons
 * @param {Object} props
 * @param {string} props.content - Markdown content to render
 * @param {Function} props.onSend - Send to platform handler
 * @param {boolean} props.isSending - Whether send is in progress
 * @param {boolean} props.isEditing - Whether edit mode is active
 * @param {Function} props.onToggleEditing - Toggle edit mode handler
 * @param {Function} props.onDocumentationChange - Update documentation handler
 * @param {'notion'|'confluence'} props.platform - Currently selected platform
 * @returns {JSX.Element|null} Rendered markdown preview or editor, or null if no content
 */
export function GeneratedContent({
  content,
  onSend,
  isSending,
  isEditing,
  onToggleEditing,
  onDocumentationChange,
  platform = 'notion',
}) {
  const [justCopied, setJustCopied] = useState(false);
  const headingRef = useRef(null);

  useEffect(() => {
    if (content && headingRef.current && !isEditing) {
      headingRef.current.focus();
    }
  }, [content, isEditing]);

  const handleCopy = async () => {
    try {
      if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      ) {
        await navigator.clipboard.writeText(content);
        setJustCopied(true);
      } else {
        throw new Error('Clipboard API not available');
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  useEffect(() => {
    let timer;
    if (justCopied) {
      timer = setTimeout(() => setJustCopied(false), 2000);
    }
    return () => timer && clearTimeout(timer);
  }, [justCopied]);

  const handleSend = async () => {
    await onSend(content);
  };

  const platformLabel = platform === 'notion' ? 'Notion' : 'Confluence';

  if (!content) return null;

  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white ${
        isEditing ? '' : 'p-6 md:p-8'
      }`}
      aria-labelledby="preview-heading"
      role="complementary"
    >
      <div
        className={
          isEditing
            ? 'p-6 md:p-8 border-b border-slate-200'
            : 'pb-6 border-b border-slate-200'
        }
      >
        <h2
          id="preview-heading"
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-semibold text-slate-900 mb-4"
        >
          Generated documentation
        </h2>
        <div
          className="flex gap-2 flex-wrap"
          aria-busy={isSending}
          aria-live="polite"
        >
          <button
            onClick={handleCopy}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[#003B44] focus-visible:ring-offset-2 focus-visible:outline-none ${
              justCopied
                ? 'text-indigo-700 bg-indigo-50'
                : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
            }`}
            aria-label="Copy all documentation to clipboard"
            aria-live="polite"
          >
            {justCopied ? '✓ Copied!' : 'Copy all'}
          </button>
          <button
            onClick={onToggleEditing}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[#003B44] focus-visible:ring-offset-2 focus-visible:outline-none ${
              isEditing
                ? 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
            }`}
            aria-label={
              isEditing
                ? 'Save edits and return to preview'
                : 'Edit documentation'
            }
            aria-live="polite"
          >
            {isEditing ? '✓ Save' : 'Edit'}
          </button>
          <button
            onClick={handleSend}
            disabled={isSending}
            aria-disabled={isSending ? 'true' : undefined}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[#003B44]/50 focus-visible:ring-offset-2 focus-visible:outline-none ${
              isSending
                ? 'bg-slate-400 cursor-not-allowed text-white'
                : 'bg-[#003B44] hover:bg-[#004850] text-white'
            }`}
            aria-label={`Send documentation to ${platformLabel}`}
            aria-busy={isSending}
          >
            {isSending ? 'Sending...' : `Send to ${platformLabel}`}
          </button>
          {isSending && (
            <span role="status" className="sr-only">
              Sending documentation to {platformLabel}, please wait...
            </span>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="overflow-hidden rounded-b-2xl">
          <CodeImplementationEditor
            value={content}
            onChange={(v) => onDocumentationChange(v)}
            language="markdown"
            padding={32}
            minHeight={500}
          />
        </div>
      ) : (
        <div
          className="prose prose-sm sm:prose lg:prose-lg max-w-[65ch] mx-auto space-y-6 pt-6 overflow-x-auto"
          role="article"
          aria-live="polite"
          style={{ lineHeight: '1.6' }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ inline, className, children, ...props }) {
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
                <h2 className="text-3xl font-bold mt-10 mb-4 text-slate-900 leading-tight">
                  {children}
                </h2>
              ),
              h2: ({ children }) => (
                <h3 className="text-2xl font-semibold mt-8 mb-3 text-slate-900 leading-snug">
                  {children}
                </h3>
              ),
              h3: ({ children }) => (
                <h4 className="text-xl font-semibold mt-6 mb-2 text-slate-900 leading-snug">
                  {children}
                </h4>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-indigo-600 underline hover:text-indigo-700"
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
                <li className="text-slate-800" style={{ lineHeight: '1.6' }}>
                  {children}
                </li>
              ),
              p: ({ children }) => (
                <p
                  className="my-4 text-slate-800"
                  style={{ lineHeight: '1.6' }}
                >
                  {children}
                </p>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
    </section>
  );
}
