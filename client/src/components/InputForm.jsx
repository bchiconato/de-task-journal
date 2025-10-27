import { useState, useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-javascript';

function InputForm({ onGenerate, isLoading }) {
  const [formData, setFormData] = useState({
    context: '',
    code: '',
    challenges: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (formData.code) {
      Prism.highlightAll();
    }
  }, [formData.code]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.context.trim()) {
      setErrors({ context: 'Context is required' });
      return;
    }

    onGenerate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Data Engineering Task Documenter
        </h1>
        <p className="text-gray-600 mb-6">
          Generate professional technical documentation for your data engineering tasks
        </p>

        {/* Context Field */}
        <div className="mb-6">
          <label
            htmlFor="context"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Task Context <span className="text-red-500">*</span>
          </label>
          <textarea
            id="context"
            name="context"
            value={formData.context}
            onChange={handleChange}
            placeholder="Describe the context of your data engineering task..."
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-y ${
              errors.context ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {errors.context && (
            <p className="mt-1 text-sm text-red-500">{errors.context}</p>
          )}
        </div>

        {/* Code Field */}
        <div className="mb-6">
          <label
            htmlFor="code"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Code Implementation <span className="text-gray-400">(Optional)</span>
          </label>
          <div className="relative">
            <textarea
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Paste your code here..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px] resize-y font-mono text-sm"
              disabled={isLoading}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Add your code implementation for better documentation
          </p>
        </div>

        {/* Challenges Field */}
        <div className="mb-6">
          <label
            htmlFor="challenges"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Challenges/Difficulties <span className="text-gray-400">(Optional)</span>
          </label>
          <textarea
            id="challenges"
            name="challenges"
            value={formData.challenges}
            onChange={handleChange}
            placeholder="Describe any challenges or difficulties you faced..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-y"
            disabled={isLoading}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          }`}
        >
          {isLoading ? 'Generating Documentation...' : 'Generate Documentation'}
        </button>
      </div>
    </form>
  );
}

export default InputForm;
