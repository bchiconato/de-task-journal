import { useState } from 'react';

function GeneratedContent({ content, onSendToNotion, isSending }) {
  const [copied, setCopied] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSendToNotion = async () => {
    const success = await onSendToNotion(content);
    if (success) {
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
    }
  };

  if (!content) return null;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 mt-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Generated Documentation
          </h2>
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {copied ? '✓ Copied!' : 'Copy to Clipboard'}
            </button>
            <button
              onClick={handleSendToNotion}
              disabled={isSending}
              className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                sendSuccess
                  ? 'bg-green-500'
                  : isSending
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {sendSuccess
                ? '✓ Sent to Notion!'
                : isSending
                ? 'Sending...'
                : 'Send to Notion'}
            </button>
          </div>
        </div>

        {/* Display content */}
        <div className="prose max-w-none">
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">
              {content}
            </pre>
          </div>
        </div>

        {/* Success message */}
        {sendSuccess && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">
              Documentation successfully sent to your Notion page!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default GeneratedContent;
