import { useState } from 'react';
import InputForm from './components/InputForm';
import GeneratedContent from './components/GeneratedContent';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import { generateDocumentation, sendToNotion } from './utils/api';

function App() {
  const [documentation, setDocumentation] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (formData) => {
    setIsGenerating(true);
    setError('');
    setDocumentation('');

    try {
      const result = await generateDocumentation(formData);
      setDocumentation(result);
    } catch (err) {
      console.error('Error generating documentation:', err);
      setError(err.message || 'Failed to generate documentation. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendToNotion = async (content) => {
    setIsSending(true);
    setError('');

    try {
      await sendToNotion(content);
      return true;
    } catch (err) {
      console.error('Error sending to Notion:', err);
      setError(err.message || 'Failed to send to Notion. Please check your API key.');
      return false;
    } finally {
      setIsSending(false);
    }
  };

  const handleDismissError = () => {
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <InputForm onGenerate={handleGenerate} isLoading={isGenerating} />

      {error && <ErrorMessage message={error} onDismiss={handleDismissError} />}

      {isGenerating && (
        <div className="w-full max-w-4xl mx-auto">
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
  );
}

export default App;
