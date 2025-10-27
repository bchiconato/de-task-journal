import { useState, useRef } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import { FormField } from './FormField';
import { validateForm, hasErrors, getErrorCount } from '../utils/validation';

/**
 * @component InputForm
 * @description Documentation input form with accessibility and inline validation
 * @param {Object} props
 * @param {Function} props.onGenerate - Form submission handler
 * @param {boolean} props.isLoading - Whether generation is in progress
 * @returns {JSX.Element} Form with context, code, and challenges fields
 */
export function InputForm({ onGenerate, isLoading}) {
  const [formData, setFormData] = useState({
    context: '',
    code: '',
    challenges: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const contextRef = useRef(null);
  const codeRef = useRef(null);
  const challengesRef = useRef(null);

  const handleChange = (name, value) => {
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

  const handleBlur = (name) => {
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    const fieldErrors = validateForm({ ...formData, [name]: formData[name] });
    if (fieldErrors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: fieldErrors[name],
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setTouched({
      context: true,
      code: true,
      challenges: true,
    });

    const formErrors = validateForm(formData);

    if (hasErrors(formErrors)) {
      setErrors(formErrors);

      if (formErrors.context && contextRef.current) {
        contextRef.current.focus();
      } else if (formErrors.code && codeRef.current) {
        codeRef.current.focus();
      } else if (formErrors.challenges && challengesRef.current) {
        challengesRef.current.focus();
      }

      const errorCount = getErrorCount(formErrors);
      console.log(`Form has ${errorCount} error${errorCount !== 1 ? 's' : ''}`);

      return;
    }

    onGenerate(formData);
  };

  return (
    <section aria-labelledby="form-heading">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-md p-6 space-y-6"
        noValidate
        aria-label="Documentation generation form"
      >
        <header className="mb-6">
          <h1 id="form-heading" className="text-3xl font-bold text-gray-900 mb-2">
            Data Engineering Task Documenter
          </h1>
          <p className="text-gray-600">
            Generate professional technical documentation for your data engineering tasks
          </p>
        </header>

        <FormField
          label="Task context"
          required={true}
          helperText="Describe the data engineering task you're documenting"
          error={touched.context && errors.context}
          id="context"
          characterCount={formData.context.length}
        >
          <textarea
            ref={contextRef}
            name="context"
            value={formData.context}
            onChange={(e) => handleChange('context', e.target.value)}
            onBlur={() => handleBlur('context')}
            placeholder="Example: Building an ETL pipeline to migrate customer data from MySQL to Snowflake..."
            className={`
              w-full px-4 py-3 border rounded-lg
              focus:outline-none focus:ring-3 focus:ring-primary-500 focus:border-primary-500
              min-h-[120px] resize-y
              disabled:bg-gray-50 disabled:cursor-not-allowed
              ${touched.context && errors.context ? 'border-error-600' : 'border-gray-300'}
            `}
            disabled={isLoading}
          />
        </FormField>

        <FormField
          label="Code implementation"
          required={false}
          helperText="Paste your code for syntax highlighting and better documentation"
          error={touched.code && errors.code}
          id="code"
          characterCount={formData.code.length}
        >
          <div className="code-editor-wrapper custom-scrollbar">
            <CodeEditor
              ref={codeRef}
              value={formData.code}
              language="python"
              placeholder="# Paste your code here...
# Supports Python, SQL, JavaScript, and more"
              onChange={(e) => handleChange('code', e.target.value)}
              onBlur={() => handleBlur('code')}
              padding={16}
              disabled={isLoading}
              style={{
                fontSize: '0.875rem',
                fontFamily: 'source-code-pro, Menlo, Monaco, Consolas, "Courier New", monospace',
                backgroundColor: '#f9fafb',
                border: `2px solid ${touched.code && errors.code ? '#dc2626' : '#d1d5db'}`,
                borderRadius: '0.5rem',
                minHeight: '200px',
              }}
            />
          </div>
        </FormField>

        <FormField
          label="Challenges and difficulties"
          required={false}
          helperText="Describe any obstacles, issues, or learning points you encountered"
          error={touched.challenges && errors.challenges}
          id="challenges"
          characterCount={formData.challenges.length}
        >
          <textarea
            ref={challengesRef}
            name="challenges"
            value={formData.challenges}
            onChange={(e) => handleChange('challenges', e.target.value)}
            onBlur={() => handleBlur('challenges')}
            placeholder="Example: Encountered performance issues with large datasets, had to implement batch processing..."
            className={`
              w-full px-4 py-3 border rounded-lg
              focus:outline-none focus:ring-3 focus:ring-primary-500 focus:border-primary-500
              min-h-[100px] resize-y
              disabled:bg-gray-50 disabled:cursor-not-allowed
              ${touched.challenges && errors.challenges ? 'border-error-600' : 'border-gray-300'}
            `}
            disabled={isLoading}
          />
        </FormField>

        <button
          type="submit"
          disabled={isLoading}
          className={`
            w-full py-3 px-6 rounded-lg font-semibold text-white
            transition-all duration-150
            focus:outline-none focus:ring-3 focus:ring-offset-2 focus:ring-primary-500
            ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800'
            }
          `}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generating documentation...
            </span>
          ) : (
            'Generate documentation'
          )}
        </button>
      </form>
    </section>
  );
}
