/**
 * @fileoverview Interactive form for collecting task or architecture documentation inputs with validation and persistence
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { ArchitectureFields } from './ArchitectureFields';
import { validateForm, hasErrors, getErrorCount } from '../utils/validation';
import { CodeImplementationEditor } from './CodeImplementationEditor';
import { CharacterCounter } from './CharacterCounter';

/**
 * @component InputForm
 * @description Documentation input form with accessibility and inline validation
 * @param {Object} props
 * @param {('task'|'architecture')} props.mode - Documentation mode
 * @param {Function} props.onGenerate - Form submission handler
 * @param {boolean} props.isLoading - Whether generation is in progress
 * @param {Array<{id: string, title: string}>} props.notionPages - Available Notion pages
 * @param {string} props.selectedPageId - Currently selected page ID
 * @param {Function} props.onPageChange - Page selection change handler
 * @param {boolean} props.isLoadingPages - Whether pages are being loaded
 * @param {string|null} props.pagesError - Error message from page loading
 * @returns {JSX.Element} Form with mode-specific fields
 */
export function InputForm({
  mode = 'task',
  onGenerate,
  isLoading = false,
  notionPages = [],
  selectedPageId = '',
  onPageChange = () => {},
  isLoadingPages = false,
  pagesError = null,
}) {
  const getInitialFormData = useCallback(() => {
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
  }, [mode]);

  const [formData, setFormData] = useState(() => {
    try {
      const savedDraft = localStorage.getItem('de-task-journal:formDraft');
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        if (draftData.mode === mode) {
          return draftData;
        }
      }
    } catch (e) {
      console.error('Failed to load draft:', e);
      localStorage.removeItem('de-task-journal:formDraft');
    }
    return getInitialFormData();
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const contextRef = useRef(null);
  const codeRef = useRef(null);
  const challengesRef = useRef(null);
  const overviewRef = useRef(null);
  const dataflowRef = useRef(null);
  const decisionsRef = useRef(null);

  useEffect(() => {
    const initialData = getInitialFormData();
    setFormData(initialData);
    setErrors({});
    setTouched({});
  }, [mode, getInitialFormData]);

  /**
   * @description Auto-saves form data to localStorage with debounce
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      const hasData = formData.context || formData.overview;
      if (hasData) {
        localStorage.setItem(
          'de-task-journal:formDraft',
          JSON.stringify({ ...formData, mode }),
        );
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData, mode]);

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

    const fieldErrors = validateForm(
      { ...formData, [name]: formData[name] },
      mode,
    );
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

    localStorage.removeItem('de-task-journal:formDraft');
    onGenerate({ ...formData, mode });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
      noValidate
      aria-label="Documentation generation form"
    >
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">
          Data Engineering Task Documenter
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Capture task context, implementation details, and send polished docs
          to Notion in one pass.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Notion Target
            </h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              Select the Notion page where documentation will be sent
            </p>
          </div>

          <div>
            <label htmlFor="notion-page" className="sr-only">
              Notion page
            </label>
            <select
              id="notion-page"
              name="notionPage"
              value={selectedPageId}
              onChange={(e) => onPageChange(e.target.value)}
              disabled={isLoadingPages || isLoading}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#003B44] focus-visible:ring-offset-1 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoadingPages ? (
                <option value="">Loading pages...</option>
              ) : pagesError ? (
                <option value="">Failed to load pages</option>
              ) : notionPages.length === 0 ? (
                <option value="">No pages available</option>
              ) : (
                <>
                  {!selectedPageId && (
                    <option value="">Select a page...</option>
                  )}
                  {notionPages.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.title}
                    </option>
                  ))}
                </>
              )}
            </select>
            {pagesError && (
              <p className="text-sm text-red-600 mt-1.5 leading-relaxed">
                {pagesError}
              </p>
            )}
          </div>
        </div>
      </section>

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
          <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Task Context
                </h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Describe what you built, the problem it solves, and any key
                  technical decisions
                </p>
              </div>

              <div>
                <label htmlFor="context" className="sr-only">
                  Task context
                </label>
                <textarea
                  ref={contextRef}
                  id="context"
                  name="context"
                  value={formData.context || ''}
                  onChange={(e) => handleChange('context', e.target.value)}
                  onBlur={() => handleBlur('context')}
                  placeholder="Example: Building an ETL pipeline to migrate customer data from MySQL to Snowflake..."
                  rows={8}
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 leading-relaxed placeholder:text-slate-400 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#003B44] focus-visible:ring-offset-1 focus-visible:outline-none disabled:opacity-50 resize-none transition-colors"
                />
                <div className="flex items-center justify-between mt-2">
                  {touched.context && errors.context ? (
                    <p className="text-sm text-red-600 leading-relaxed">
                      {errors.context}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Required field
                    </p>
                  )}
                  <CharacterCounter
                    current={formData.context?.length || 0}
                    max={10000}
                    id="context-counter"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Code Implementation
                </h3>
                <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">
                  Optional
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleChange('code', '')}
                  className="text-xs text-slate-600 hover:text-slate-900 transition-colors"
                  disabled={isLoading || !formData.code}
                >
                  Clear
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  className="text-xs text-[#003B44] hover:text-[#004850] transition-colors"
                  disabled={isLoading}
                  onClick={() =>
                    handleChange(
                      'code',
                      '# Sample Python code\ndef hello_world():\n    print("Hello, World!")\n\nhello_world()',
                    )
                  }
                >
                  Paste sample
                </button>
              </div>
            </div>

            <div className="h-72">
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
                  fontSize: '0.875rem',
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  backgroundColor: '#ffffff',
                  color: '#1e293b',
                  border: 'none',
                  lineHeight: '1.6',
                }}
              />
            </div>

            <div className="px-4 md:px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              {touched.code && errors.code ? (
                <p className="text-sm text-red-600 leading-relaxed">
                  {errors.code}
                </p>
              ) : (
                <p className="text-sm text-slate-500 leading-relaxed">
                  Include relevant code snippets
                </p>
              )}
              <CharacterCounter
                current={formData.code?.length || 0}
                max={10000}
                id="code-counter"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Challenges & Learnings
                </h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Share obstacles you faced, how you overcame them, and lessons
                  learned
                </p>
              </div>

              <div>
                <label htmlFor="challenges" className="sr-only">
                  Challenges and difficulties
                </label>
                <textarea
                  ref={challengesRef}
                  id="challenges"
                  name="challenges"
                  value={formData.challenges || ''}
                  onChange={(e) => handleChange('challenges', e.target.value)}
                  onBlur={() => handleBlur('challenges')}
                  placeholder="Example: Encountered performance issues with large datasets, had to implement batch processing..."
                  rows={6}
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 leading-relaxed placeholder:text-slate-400 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#003B44] focus-visible:ring-offset-1 focus-visible:outline-none disabled:opacity-50 resize-none transition-colors"
                />
                <div className="flex items-center justify-between mt-2">
                  {touched.challenges && errors.challenges ? (
                    <p className="text-sm text-red-600 leading-relaxed">
                      {errors.challenges}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Optional field
                    </p>
                  )}
                  <CharacterCounter
                    current={formData.challenges?.length || 0}
                    max={10000}
                    id="challenges-counter"
                  />
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-6 py-2.5 rounded-lg bg-[#003B44] text-white text-sm font-medium hover:bg-[#004850] focus-visible:ring-2 focus-visible:ring-[#003B44]/50 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
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
              Generating...
            </span>
          ) : (
            'Generate Documentation'
          )}
        </button>
      </div>
      {isLoading && (
        <span role="status" className="sr-only">
          Generating documentation, please wait...
        </span>
      )}
    </form>
  );
}
