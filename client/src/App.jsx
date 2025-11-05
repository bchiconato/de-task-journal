import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { InputForm } from './components/InputForm';
import { Toast } from './components/Toast';
import { ModeToggle } from './components/ModeToggle';
import { useToast } from './hooks/useToast';
import { useAbortableRequest } from './hooks/useAbortableRequest';
import { useAnnouncer } from './hooks/useAnnouncer';
import {
  generateDocumentation,
  sendToNotion,
  getNotionPages,
} from './utils/api';
import { FileText, Clock, HelpCircle, X } from 'lucide-react';
import { Guide } from './components/Guide';

const GeneratedContent = lazy(() =>
  import('./components/GeneratedContent').then((module) => ({
    default: module.GeneratedContent,
  })),
);

/**
 * @function extractTitle
 * @description Extracts the first H1 heading from markdown
 * @param {string} markdown - Markdown content
 * @returns {string} Extracted title or default text
 */
function extractTitle(markdown) {
  if (!markdown) return 'Untitled';
  const match = markdown.match(/^#\s(.*?)$/m);
  return match ? match[1] : 'Task Documentation';
}

/**
 * @component App
 * @description Main application component with two-column layout and toast notifications
 * @returns {JSX.Element} Main app component with form, preview, and toast system
 */
function App() {
  const [view, setView] = useState('main');
  const [mode, setMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get('mode');
    const validModes = ['task', 'architecture', 'meeting'];
    return validModes.includes(urlMode) ? urlMode : 'task';
  });
  const [documentation, setDocumentation] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [notionPages, setNotionPages] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [pagesError, setPagesError] = useState(null);
  const [isLoadingPages, setIsLoadingPages] = useState(false);

  const [history, setHistory] = useState(() => {
    try {
      const savedHistory = localStorage.getItem('de-task-journal:docHistory');
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (e) {
      console.error('Failed to load history:', e);
      return [];
    }
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const historyButtonRef = useRef(null);
  const historyMenuRef = useRef(null);

  const persistHistory = (nextHistory) => {
    try {
      if (!nextHistory.length) {
        localStorage.removeItem('de-task-journal:docHistory');
      } else {
        localStorage.setItem(
          'de-task-journal:docHistory',
          JSON.stringify(nextHistory),
        );
      }
    } catch (err) {
      console.error('Failed to persist history:', err);
    }
  };

  const { toasts, showSuccess, showError, removeToast } = useToast();
  const abortController = useAbortableRequest();
  const announcer = useAnnouncer();
  const activeTabId =
    mode === 'architecture'
      ? 'mode-toggle-tab-architecture'
      : mode === 'meeting'
        ? 'mode-toggle-tab-meeting'
        : 'mode-toggle-tab-task';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (mode === 'architecture') {
      params.set('mode', 'architecture');
    } else if (mode === 'meeting') {
      params.set('mode', 'meeting');
    } else {
      params.delete('mode');
    }
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, [mode]);

  useEffect(() => {
    const fetchPages = async () => {
      setIsLoadingPages(true);
      setPagesError(null);

      try {
        const pages = await getNotionPages();
        setNotionPages(pages);

        const savedPageId = localStorage.getItem(
          'de-task-journal:selected-notion-page',
        );
        if (savedPageId && pages.some((p) => p.id === savedPageId)) {
          setSelectedPageId(savedPageId);
        } else if (pages.length > 0) {
          setSelectedPageId(pages[0].id);
        }
      } catch (err) {
        console.error('Error fetching Notion pages:', err);
        setPagesError(err.message || 'Failed to load Notion pages');
      } finally {
        setIsLoadingPages(false);
      }
    };

    fetchPages();
  }, []);

  const handleGenerate = async (formData) => {
    const signal = abortController.start();
    setIsGenerating(true);
    setDocumentation('');

    try {
      const result = await generateDocumentation(formData, signal);
      setDocumentation(result);

      const newHistoryItem = {
        id: new Date().toISOString(),
        timestamp: new Date().toLocaleString(),
        mode: formData.mode || mode,
        title:
          extractTitle(result) || `Task - ${new Date().toLocaleDateString()}`,
        inputs: formData,
        documentation: result,
      };
      setHistory((prevHistory) => {
        const updatedHistory = [newHistoryItem, ...prevHistory.slice(0, 49)];
        persistHistory(updatedHistory);
        return updatedHistory;
      });

      setIsEditing(false);
      showSuccess('Documentation generated successfully!');
      announcer.announcePolite('Documentation generated successfully.');
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      console.error('Error generating documentation:', err);
      showError(
        err.message || 'Failed to generate documentation. Please try again.',
      );
      announcer.announceAssertive(
        err.message || 'Failed to generate documentation. Please try again.',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendToNotion = async (content) => {
    if (isSending) {
      return false;
    }

    if (!selectedPageId) {
      showError('Please select a Notion page before sending');
      announcer.announceAssertive('Please select a Notion page before sending');
      return false;
    }

    const signal = abortController.start();
    setIsSending(true);

    try {
      await sendToNotion(content, mode, selectedPageId, signal);
      showSuccess('Documentation sent to Notion successfully!');
      announcer.announcePolite('Documentation sent to Notion successfully.');
      return true;
    } catch (err) {
      if (err.name === 'AbortError') {
        return false;
      }
      console.error('Error sending to Notion:', err);
      showError(
        err.message ||
          'Failed to send to Notion. Please check your configuration.',
      );
      announcer.announceAssertive(
        err.message ||
          'Failed to send to Notion. Please check your configuration.',
      );
      return false;
    } finally {
      setIsSending(false);
    }
  };

  const handleNavigateToMain = () => {
    setView('main');
    setIsHistoryOpen(false);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setDocumentation('');
  };

  const handlePageChange = (pageId) => {
    setSelectedPageId(pageId);
    localStorage.setItem('de-task-journal:selected-notion-page', pageId);
  };

  /**
   * @function toggleEditing
   * @description Toggles the edit mode for the generated documentation
   * @returns {void}
   */
  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  /**
   * @function handleDocumentationChange
   * @description Updates the documentation state with user-edited content
   * @param {string} newMarkdown - The edited markdown content
   * @returns {void}
   */
  const handleDocumentationChange = (newMarkdown) => {
    setDocumentation(newMarkdown);
  };

  const handleClearHistory = () => {
    if (!history.length) {
      return;
    }
    persistHistory([]);
    setHistory([]);
    showSuccess('History cleared');
    announcer.announcePolite('History cleared.');
  };

  const handleRemoveHistoryItem = (id) => {
    if (!history.some((item) => item.id === id)) {
      return;
    }
    const updatedHistory = history.filter((item) => item.id !== id);
    persistHistory(updatedHistory);
    setHistory(updatedHistory);
    showSuccess('Removed entry from history');
    announcer.announcePolite('History entry removed.');
  };

  useEffect(() => {
    if (!isHistoryOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      const buttonEl = historyButtonRef.current;
      const menuEl = historyMenuRef.current;
      if (!buttonEl || !menuEl) {
        return;
      }

      const target = event.target;
      if (menuEl.contains(target) || buttonEl.contains(target)) {
        return;
      }

      setIsHistoryOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsHistoryOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isHistoryOpen]);

  /**
   * @function handleLoadFromHistory
   * @description Loads a documentation item from history
   * @param {Object} historyItem - History item to load
   * @returns {void}
   */
  const handleLoadFromHistory = (historyItem) => {
    if (!historyItem) return;
    setMode(historyItem.mode);
    setDocumentation(historyItem.documentation);
    setView('main');
    setIsHistoryOpen(false);
    showSuccess(`Loaded "${historyItem.title}" from history!`);
    announcer.announcePolite(`Loaded "${historyItem.title}" from history.`);
  };

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="min-h-screen bg-slate-50 overflow-x-hidden">
        <header className="sticky top-0 z-40 bg-[#003740] border-b border-[#004850]">
          <div className="mx-auto max-w-screen-2xl h-14 px-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={handleNavigateToMain}
                className="flex items-center gap-2 rounded-md px-1.5 py-1 text-left text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60E7A9]/50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 192 192"
                  fill="none"
                  className="text-white/90"
                  aria-hidden="true"
                >
                  <g clipPath="url(#A)" fill="currentColor">
                    <path d="M155.42 95.347c-.216-20.629-4.169-45.572-23.573-56.784-17.789-10.287-51.307-10.048-69.545-.684-17.72 8.963-24.054 30.038-24.934 48.738-.903 20.641.016 45.976 15.32 61.359 10.515 10.448 26.232 13.347 40.522 13.833 10.837.22 22.263-.627 32.53-4.639 24.572-9.541 30.067-38.068 29.681-61.716v-.106h-.001zm-48.816-68.816c19.447 1.865 38.672 12.774 47.287 30.615 8.036 16.871 9.645 37.969 6.813 56.384-4.037 25.967-18.666 44.99-44.882 51.235-16.031 3.632-35.089 3.105-50.189-3.556-23.032-10.168-33.776-32.812-34.434-57.213-.914-19.429.929-40.801 13.565-56.347C59.832 29.056 83.705 24.254 106.5 26.52l.104.011z" />
                    <path d="M115.436 135.857h.463l22.773-56.784c2.222-5.465 4.259-8.153 6.298-9.353v-.558h-13.704v.558c2.871 1.571 3.518 5.835 1.574 10.741l-13.98 35.016-18.983-46.502h-.457l-20 46.411-14.352-36.5c-1.664-4.351-1.201-7.594 1.481-9.166v-.558H46.557v.558c2.13 1.11 3.701 3.422 5.647 8.149l23.517 57.988h.459L95.992 88.89l19.444 46.967z" />
                  </g>
                  <defs>
                    <clipPath id="A">
                      <path
                        fill="#fff"
                        transform="translate(31 26)"
                        d="M0 0h131v141H0z"
                      />
                    </clipPath>
                  </defs>
                </svg>
                <span
                  role="heading"
                  aria-level={1}
                  className="text-sm font-medium"
                >
                  Task Journal
                </span>
              </button>

              <ModeToggle
                mode={mode}
                onChange={handleModeChange}
                onSelect={handleNavigateToMain}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setView('guide')}
                aria-label="Guide"
                className="h-9 w-9 grid place-items-center rounded-md hover:bg-[#004850] text-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60E7A9]/50 transition-colors"
              >
                <HelpCircle className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <div className="relative">
                <button
                  ref={historyButtonRef}
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  aria-label="History"
                  aria-haspopup="menu"
                  aria-expanded={isHistoryOpen}
                  className="h-9 w-9 grid place-items-center rounded-md hover:bg-[#004850] text-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60E7A9]/50 transition-colors"
                >
                  <Clock className="w-4 h-4" strokeWidth={1.5} />
                </button>

                {isHistoryOpen && (
                  <div
                    role="menu"
                    ref={historyMenuRef}
                    className="absolute right-0 mt-2 min-w-64 max-h-80 rounded-lg border border-[#004850] bg-[#003740] shadow-lg overflow-auto"
                  >
                    <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                      <span className="text-xs font-semibold uppercase tracking-wide text-white/60">
                        History
                      </span>
                      <button
                        type="button"
                        onClick={handleClearHistory}
                        disabled={history.length === 0}
                        className="text-xs font-medium text-white/60 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60E7A9]/50 rounded px-2 py-1 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                    {history.length === 0 ? (
                      <p className="px-4 py-8 text-center text-sm text-white/70">
                        No history yet
                      </p>
                    ) : (
                      <ul className="py-1 space-y-1">
                        {history.slice(0, 10).map((item) => (
                          <li key={item.id} className="group relative px-1">
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                handleLoadFromHistory(item);
                                setIsHistoryOpen(false);
                              }}
                              className="w-full text-left px-3 pr-20 py-2 rounded-md flex flex-col gap-0.5 transition-colors hover:bg-[#004850] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60E7A9]/50"
                            >
                              <p
                                className="font-medium text-sm text-white/90 truncate"
                                title={item.title}
                              >
                                {item.title}
                              </p>
                              <p className="text-xs text-white/60">
                                {item.timestamp}
                              </p>
                            </button>
                            <button
                              type="button"
                              aria-label="Remove from history"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRemoveHistoryItem(item.id);
                              }}
                              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[#60E7A9]/10 text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60E7A9]/50 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-[opacity,color]"
                            >
                              <X className="w-3 h-3" aria-hidden="true" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main
          id="main-content"
          className="container max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        >
          {view === 'guide' ? (
            <Guide onBack={() => setView('main')} />
          ) : (
            <section
              id="mode-toggle-panel"
              role="tabpanel"
              aria-labelledby={activeTabId}
              tabIndex={-1}
              className="focus:outline-none"
            >
              <div className="space-y-3 mb-12 text-center">
                <h2 className="text-3xl font-semibold text-slate-900 leading-tight">
                  Documentation Generator
                </h2>
                <p className="text-base text-slate-600 leading-relaxed">
                  Generate technical documentation for your data engineering{' '}
                  {mode === 'architecture'
                    ? 'architecture and design decisions'
                    : mode === 'meeting'
                      ? 'technical meetings and discussions'
                      : 'tasks and implementations'}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                  <InputForm
                    mode={mode}
                    onGenerate={handleGenerate}
                    isLoading={isGenerating}
                    notionPages={notionPages}
                    selectedPageId={selectedPageId}
                    onPageChange={handlePageChange}
                    isLoadingPages={isLoadingPages}
                    pagesError={pagesError}
                  />
                </div>

                <div className="space-y-8">
                  {documentation && !isGenerating && (
                    <Suspense
                      fallback={
                        <div
                          aria-busy="true"
                          role="status"
                          className="rounded-2xl border border-slate-200 bg-white p-12"
                        >
                          <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                          </div>
                        </div>
                      }
                    >
                      <GeneratedContent
                        content={documentation}
                        onSendToNotion={handleSendToNotion}
                        isSending={isSending}
                        isEditing={isEditing}
                        onToggleEditing={toggleEditing}
                        onDocumentationChange={handleDocumentationChange}
                      />
                    </Suspense>
                  )}

                  {!documentation && !isGenerating && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                      <FileText className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                      <p className="text-base font-medium text-slate-900">
                        Ready to generate documentation
                      </p>
                      <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                        Fill out the form and click Generate Documentation to
                        create your documentation
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          show={toast.show}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
}

export { App };
