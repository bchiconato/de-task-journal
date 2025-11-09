/**
 * @fileoverview Interactive form for collecting documentation inputs with validation and persistence
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { validateForm, hasErrors, getErrorCount } from '../utils/validation';
import { CharacterCounter } from './CharacterCounter';
import { PlatformSelector } from './PlatformSelector';
import { PageSearchSelector } from './PageSearchSelector';
import { WriteModeSelector } from './WriteModeSelector';
import { getConfluencePages, getNotionPages } from '../utils/api';

const CONTEXT_COPY = {
  task: {
    title: 'Task Context',
    description:
      'Paste every note you have: goals, problem statement, solution details, snippets, metrics, lessons learned, next steps. The AI will separate the pieces automatically.',
    placeholder:
      'Example dump:\n\n# Task\nWhy we needed this work\n\n# Solution\nImplementation notes, commands, queries, file paths\n\n# Code\n```python\n# key snippet\n```\n\n# Challenges\nWhat failed, mitigations, follow-ups\n\nInclude anything that helps future you understand the task.',
  },
  architecture: {
    title: 'Architecture Context',
    description:
      'Paste a complete dump covering overview, components, data flows, decisions, risks, diagrams (text), commands, repos, and anything else. The AI will structure the final document.',
    placeholder:
      'Example dump:\n\n## Overview\nSystem name, business context, primary users\n\n## Components\n- API Gateway ...\n- Stream Processor ...\n\n## Data Flow\nStep-by-step runtime flow or ASCII diagram\n\n## Decisions & Risks\nKey trade-offs, open issues, mitigations\n\nDrop the entire context in one block.',
  },
  meeting: {
    title: 'Meeting Transcript',
    description:
      'Paste meeting transcript or detailed notes (Portuguese/English mix accepted). Include speakers, topics discussed, decisions made, and action items. The AI will extract key information and translate to English.',
    placeholder:
      'Example dump:\n\n# Meeting: Gold Layer Migration Planning\nDate: 2025-11-05\nAttendees: João (Tech Lead), Maria (Data Engineer), Bob (PM)\n\n[João]: Vamos migrar a Gold Layer diretamente para GCP.\n[Maria]: Okay, and what about the validation?\n[João]: We need to implement field-level checks.\n[Bob]: When can we start?\n\n## Topics Discussed\n- Migration strategy\n- Data validation approach\n- Timeline and resources\n\nInclude full transcript or detailed notes with speaker names.',
  },
};

function mapLegacyDraftToContext(draftData, mode) {
  if (!draftData || draftData.mode !== mode) {
    return null;
  }

  if (typeof draftData.context === 'string' && draftData.context.trim()) {
    if (mode === 'task') {
      const segments = [draftData.context.trim()];

      if (draftData.code && draftData.code.trim()) {
        segments.push(
          '## Code Implementation\n```\n' + draftData.code.trim() + '\n```',
        );
      }

      if (draftData.challenges && draftData.challenges.trim()) {
        segments.push(
          '## Challenges & Learnings\n' + draftData.challenges.trim(),
        );
      }

      return segments.join('\n\n');
    }

    return draftData.context;
  }

  if (mode === 'task') {
    const segments = [];

    if (draftData.context && draftData.context.trim()) {
      segments.push(draftData.context.trim());
    }

    if (draftData.code && draftData.code.trim()) {
      segments.push(
        '## Code Implementation\n```\n' + draftData.code.trim() + '\n```',
      );
    }

    if (draftData.challenges && draftData.challenges.trim()) {
      segments.push(
        '## Challenges & Learnings\n' + draftData.challenges.trim(),
      );
    }

    if (segments.length) {
      return segments.join('\n\n');
    }
  }

  if (mode === 'architecture') {
    const segments = [];

    if (draftData.overview && draftData.overview.trim()) {
      segments.push('## Overview & Components\n' + draftData.overview.trim());
    }

    if (draftData.dataflow && draftData.dataflow.trim()) {
      segments.push('## Data Flow & Tech Stack\n' + draftData.dataflow.trim());
    }

    if (draftData.decisions && draftData.decisions.trim()) {
      segments.push(
        '## Design Decisions & Trade-offs\n' + draftData.decisions.trim(),
      );
    }

    if (segments.length) {
      return segments.join('\n\n');
    }
  }

  return null;
}

/**
 * @component InputForm
 * @description Documentation input form with accessibility and inline validation
 * @param {Object} props
 * @param {('task'|'architecture'|'meeting')} props.mode - Documentation mode
 * @param {Function} props.onGenerate - Form submission handler
 * @param {boolean} props.isLoading - Whether generation is in progress
 * @param {string} props.selectedPageId - Currently selected page ID
 * @param {Function} props.onPageChange - Page selection change handler
 * @param {{notion: boolean, confluence: boolean}} props.availablePlatforms - Which platforms are configured
 * @param {'notion'|'confluence'} props.selectedPlatform - Currently selected platform
 * @param {Function} props.onPlatformChange - Platform selection change handler
 * @param {('append'|'overwrite')} props.writeMode - Write mode for Confluence
 * @param {Function} props.onWriteModeChange - Write mode change handler
 * @returns {JSX.Element} Form with mode-specific fields
 */
export function InputForm({
  mode = 'task',
  onGenerate,
  isLoading = false,
  selectedPageId = '',
  onPageChange = () => {},
  availablePlatforms = { notion: false, confluence: false },
  selectedPlatform = 'notion',
  onPlatformChange = () => {},
  writeMode = 'append',
  onWriteModeChange = () => {},
}) {
  const getInitialFormData = useCallback(
    () => ({
      context: '',
    }),
    [],
  );

  const [formData, setFormData] = useState(() => {
    try {
      const savedDraft = localStorage.getItem('de-task-journal:formDraft');
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        const legacyContext = mapLegacyDraftToContext(draftData, mode);
        if (typeof legacyContext === 'string') {
          return { context: legacyContext };
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

  useEffect(() => {
    const initialData = getInitialFormData();
    setFormData(initialData);
    setErrors({});
    setTouched({});
  }, [mode, getInitialFormData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = formData.context?.trim();
      if (trimmed) {
        localStorage.setItem(
          'de-task-journal:formDraft',
          JSON.stringify({ ...formData, mode }),
        );
      } else {
        localStorage.removeItem('de-task-journal:formDraft');
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

    setTouched({
      context: true,
    });

    const formErrors = validateForm(formData, mode);

    if (hasErrors(formErrors)) {
      setErrors(formErrors);

      if (formErrors.context && contextRef.current) {
        contextRef.current.focus();
      }

      const errorCount = getErrorCount(formErrors);
      console.log(`Form has ${errorCount} error${errorCount !== 1 ? 's' : ''}`);
      return;
    }

    localStorage.removeItem('de-task-journal:formDraft');
    onGenerate({ ...formData, mode });
  };

  const handlePageSelect = (pageId) => {
    onPageChange(pageId);
  };

  const copy = CONTEXT_COPY[mode] ?? CONTEXT_COPY.task;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
      noValidate
      aria-label="Documentation generation form"
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Target Page
            </h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              Select the platform and page where documentation will be sent
            </p>
          </div>

          <PlatformSelector
            selected={selectedPlatform}
            onChange={onPlatformChange}
            availablePlatforms={availablePlatforms}
          />

          {selectedPlatform === 'confluence' ? (
            <>
              <PageSearchSelector
                fetchPages={getConfluencePages}
                selectedPageId={selectedPageId}
                onPageSelect={handlePageSelect}
                platform="Confluence"
                placeholder="Search Confluence pages..."
                limit={50}
              />
              <WriteModeSelector
                selected={writeMode}
                onChange={onWriteModeChange}
              />
            </>
          ) : (
            <PageSearchSelector
              fetchPages={getNotionPages}
              selectedPageId={selectedPageId}
              onPageSelect={handlePageSelect}
              platform="Notion"
              placeholder="Search Notion pages..."
              limit={50}
            />
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {copy.title}
            </h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              {copy.description}
            </p>
          </div>

          <div>
            <label htmlFor="context" className="sr-only">
              Documentation context
            </label>
            <textarea
              ref={contextRef}
              id="context"
              name="context"
              value={formData.context || ''}
              onChange={(e) => handleChange('context', e.target.value)}
              onBlur={() => handleBlur('context')}
              placeholder={copy.placeholder}
              rows={18}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 leading-relaxed placeholder:text-slate-400 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#003B44] focus-visible:ring-offset-1 focus-visible:outline-none disabled:opacity-50 resize-none transition-colors"
              style={{ minHeight: '28rem' }}
            />
            <div className="flex items-center justify-between mt-2">
              {touched.context && errors.context ? (
                <p className="text-sm text-red-600 leading-relaxed">
                  {errors.context}
                </p>
              ) : (
                <p className="text-sm text-slate-500 leading-relaxed">
                  * Required field
                </p>
              )}
              <CharacterCounter
                current={formData.context?.length || 0}
                max={30000}
                id="context-counter"
              />
            </div>
          </div>
        </div>
      </section>

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
