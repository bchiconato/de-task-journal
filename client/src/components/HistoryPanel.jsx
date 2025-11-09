/**
 * @fileoverview Enhanced history panel with search and filters
 */
import { useState, useRef, useEffect } from 'react';
import { Clock, X, Search, Filter } from 'lucide-react';

/**
 * @component HistoryPanel
 * @description History panel with search functionality and filters by mode and platform
 * @param {Object} props
 * @param {Array} props.history - Array of history items
 * @param {Function} props.onLoadItem - Handler for loading a history item
 * @param {Function} props.onRemoveItem - Handler for removing a history item
 * @param {Function} props.onClear - Handler for clearing all history
 * @returns {JSX.Element} History panel with search and filters
 */
export function HistoryPanel({ history, onLoadItem, onRemoveItem, onClear }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      const buttonEl = buttonRef.current;
      const panelEl = panelRef.current;
      if (!buttonEl || !panelEl) {
        return;
      }

      const target = event.target;
      if (panelEl.contains(target) || buttonEl.contains(target)) {
        return;
      }

      setIsOpen(false);
      setShowFilters(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.documentation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMode = modeFilter === 'all' || item.mode === modeFilter;

    const matchesPlatform =
      platformFilter === 'all' || item.platform === platformFilter;

    return matchesSearch && matchesMode && matchesPlatform;
  });

  const handleLoadItem = (item) => {
    onLoadItem(item);
    setIsOpen(false);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setModeFilter('all');
    setPlatformFilter('all');
  };

  const hasActiveFilters =
    searchQuery !== '' || modeFilter !== 'all' || platformFilter !== 'all';

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="History"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="h-9 w-9 grid place-items-center rounded-md hover:bg-[#004850] text-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60E7A9]/50 transition-colors"
      >
        <Clock className="w-4 h-4" strokeWidth={1.5} />
      </button>

      {isOpen && (
        <div
          role="menu"
          ref={panelRef}
          className="absolute right-0 mt-2 w-96 max-h-[32rem] rounded-lg border border-[#004850] bg-[#003740] shadow-lg flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/60">
              History ({filteredHistory.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`p-1 rounded hover:bg-[#004850] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60E7A9]/50 ${
                  hasActiveFilters || showFilters
                    ? 'text-[#60E7A9]'
                    : 'text-white/60 hover:text-white'
                }`}
                aria-label="Toggle filters"
              >
                <Filter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onClear}
                disabled={history.length === 0}
                className="text-xs font-medium text-white/60 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60E7A9]/50 rounded px-2 py-1 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="px-3 py-2 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-[#004850] text-white placeholder-white/40 rounded border border-white/10 focus:border-[#60E7A9]/50 focus:outline-none focus:ring-2 focus:ring-[#60E7A9]/50"
              />
            </div>
          </div>

          {showFilters && (
            <div className="px-3 py-2 border-b border-white/10 space-y-2">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="mode-filter"
                  className="text-xs text-white/60 min-w-16"
                >
                  Mode:
                </label>
                <select
                  id="mode-filter"
                  value={modeFilter}
                  onChange={(e) => setModeFilter(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs bg-[#004850] text-white rounded border border-white/10 focus:border-[#60E7A9]/50 focus:outline-none focus:ring-2 focus:ring-[#60E7A9]/50"
                >
                  <option value="all">All modes</option>
                  <option value="task">Task</option>
                  <option value="architecture">Architecture</option>
                  <option value="meeting">Meeting</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label
                  htmlFor="platform-filter"
                  className="text-xs text-white/60 min-w-16"
                >
                  Platform:
                </label>
                <select
                  id="platform-filter"
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs bg-[#004850] text-white rounded border border-white/10 focus:border-[#60E7A9]/50 focus:outline-none focus:ring-2 focus:ring-[#60E7A9]/50"
                >
                  <option value="all">All platforms</option>
                  <option value="notion">Notion</option>
                  <option value="confluence">Confluence</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="w-full text-xs text-white/60 hover:text-white py-1 rounded hover:bg-[#004850] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60E7A9]/50"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {filteredHistory.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-white/70">
                {history.length === 0 ? 'No history yet' : 'No results found'}
              </p>
            ) : (
              <ul className="py-1 space-y-1">
                {filteredHistory.map((item) => (
                  <li key={item.id} className="group relative px-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleLoadItem(item)}
                      className="w-full text-left px-3 pr-20 py-2 rounded-md flex flex-col gap-1 transition-colors hover:bg-[#004850] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60E7A9]/50"
                    >
                      <p
                        className="font-medium text-sm text-white/90 truncate"
                        title={item.title}
                      >
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <span>{item.timestamp}</span>
                        <span>•</span>
                        <span className="capitalize">{item.mode}</span>
                        {item.platform && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{item.platform}</span>
                          </>
                        )}
                      </div>
                    </button>
                    <button
                      type="button"
                      aria-label="Remove from history"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRemoveItem(item.id);
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
        </div>
      )}
    </div>
  );
}
