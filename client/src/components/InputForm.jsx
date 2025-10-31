import { useState, useRef, useEffect } from 'react';
import { FormField } from './FormField';
import { ArchitectureFields } from './ArchitectureFields';
import { validateForm, hasErrors, getErrorCount } from '../utils/validation';
import { CodeImplementationEditor } from './CodeImplementationEditor';

/**
 * @component InputForm
 * @description Documentation input form with accessibility and inline validation
 * @param {Object} props
 * @param {('task'|'architecture')} props.mode - Documentation mode
 * @param {Function} props.onGenerate - Form submission handler
 * @param {boolean} props.isLoading - Whether generation is in progress
 * @returns {JSX.Element} Form with mode-specific fields
 */
export function InputForm({ mode, onGenerate, isLoading }) {
  const getInitialFormData = () => {
    if (mode === 'architecture') {
      return {
        overview: '',
        dataflow: '',
        decisions: '',
      };
    }
    return {
      context: '',
      code: '',
      challenges: '',
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const contextRef = useRef(null);
  const codeRef = useRef(null);
  const challengesRef = useRef(null);
  const overviewRef = useRef(null);
  const dataflowRef = useRef(null);
  const decisionsRef = useRef(null);

  useEffect(() => {
    const initialData = mode === 'architecture'
      ? { overview: '', dataflow: '', decisions: '' }
      : { context: '', code: '', challenges: '' };

    setFormData(initialData);
    setErrors({});
    setTouched({});
  }, [mode]);

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

    const fieldErrors = validateForm({ ...formData, [name]: formData[name] }, mode);
    if (fieldErrors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: fieldErrors[name],
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (mode === 'architecture') {
      setTouched({
        overview: true,
        dataflow: true,
        decisions: true,
      });
    } else {
      setTouched({
        context: true,
        code: true,
        challenges: true,
      });
    }

    const formErrors = validateForm(formData, mode);

    if (hasErrors(formErrors)) {
      setErrors(formErrors);

      if (mode === 'architecture') {
        if (formErrors.overview && overviewRef.current) {
          overviewRef.current.focus();
        } else if (formErrors.dataflow && dataflowRef.current) {
          dataflowRef.current.focus();
        } else if (formErrors.decisions && decisionsRef.current) {
          decisionsRef.current.focus();
        }
      } else {
        if (formErrors.context && contextRef.current) {
          contextRef.current.focus();
        } else if (formErrors.code && codeRef.current) {
          codeRef.current.focus();
        } else if (formErrors.challenges && challengesRef.current) {
          challengesRef.current.focus();
        }
      }

      const errorCount = getErrorCount(formErrors);
      console.log(`Form has ${errorCount} error${errorCount !== 1 ? 's' : ''}`);

      return;
    }

    onGenerate({ ...formData, mode });
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
            {mode === 'architecture'
              ? 'Architecture Documenter'
              : 'Data Engineering Task Documenter'}
          </h1>
          <p className="text-gray-600">
            {mode === 'architecture'
              ? 'Generate comprehensive architecture documentation for your systems'
              : 'Generate professional technical documentation for your data engineering tasks'}
          </p>
        </header>

        {mode === 'architecture' ? (
          <ArchitectureFields
            formData={formData}
            errors={errors}
            touched={touched}
            onFieldChange={handleChange}
            onFieldBlur={handleBlur}
            isLoading={isLoading}
            refs={{ overviewRef, dataflowRef, decisionsRef }}
          />
        ) : (
          <>
            <FormField
          label="Task context"
          required={true}
          helperText="Describe what you built, the problem it solves, and any key technical decisions"
          error={touched.context && errors.context}
          id="context"
          characterCount={formData.context?.length || 0}
        >
          <textarea
            ref={contextRef}
            name="context"
            value={formData.context || ''}
            onChange={(e) => handleChange('context', e.target.value)}
            onBlur={() => handleBlur('context')}
            placeholder="Example: Building an ETL pipeline to migrate customer data from MySQL to Snowflake..."
            className={`
              w-full px-4 py-3 border rounded-lg
              focus:outline-none focus:ring-3 focus:ring-primary-500 focus:border-primary-500
              min-h-[160px] lg:min-h-[200px] xl:min-h-[240px]
              max-h-[400px] lg:max-h-[480px] xl:max-h-[560px]
              resize-y overflow-y-auto
              disabled:bg-gray-50 disabled:cursor-not-allowed
              ${touched.context && errors.context ? 'border-error-600' : 'border-gray-300'}
            `}
            disabled={isLoading}
          />
        </FormField>

        <FormField
          label="Code implementation"
          required={false}
          helperText="Include relevant code snippets that demonstrate your implementation"
          error={touched.code && errors.code}
          id="code"
          characterCount={formData.code.length}
        >
          <div className="code-editor-wrapper min-h-[160px] lg:min-h-[200px] xl:min-h-[240px] max-h-[400px] lg:max-h-[480px] xl:max-h-[560px] overflow-y-auto rounded-xl">
            <CodeImplementationEditor
              ref={codeRef}
              value={formData.code}
              onChange={(v) => handleChange('code', v)}
              language="python"
              placeholder="# Paste your code here...
# Supports Python, SQL, JavaScript, and more"
              onBlur={() => handleBlur('code')}
              padding={16}
              disabled={isLoading}
              className="h-full"
              style={{
                fontSize: '0.9375rem',
                fontFamily: 'source-code-pro, Menlo, Monaco, Consolas, \"Courier New\", monospace',
                backgroundColor: '#f9fafb',
                color: '#1f2937',
                border: `2px solid ${touched.code && errors.code ? '#dc2626' : '#d1d5db'}`,
                borderRadius: '0.5rem',
                lineHeight: '1.6',
              }}
            />
          </div>
        </FormField>

        <FormField
          label="Challenges and difficulties"
          required={false}
          helperText="Share obstacles you faced, how you overcame them, and lessons learned"
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
              min-h-[140px] lg:min-h-[180px] xl:min-h-[220px]
              max-h-[360px] lg:max-h-[440px] xl:max-h-[520px]
              resize-y overflow-y-auto
              disabled:bg-gray-50 disabled:cursor-not-allowed
              ${touched.challenges && errors.challenges ? 'border-error-600' : 'border-gray-300'}
            `}
            disabled={isLoading}
          />
        </FormField>
          </>
        )}

        <div aria-busy={isLoading} aria-live="polite">
          <button
            type="submit"
            disabled={isLoading}
            aria-disabled={isLoading ? 'true' : undefined}
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
                Generating documentation...
                <svg
                  className="animate-spin h-5 w-5 text-white"
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </span>
            ) : (
              'Generate documentation'
            )}
          </button>
          {isLoading && (
            <span role="status" className="sr-only">
              Generating documentation, please wait...
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
