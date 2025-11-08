/**
 * @fileoverview Searchable page selector with debounce and lazy loading
 * @component PageSearchSelector
 */

import { Search, X, AlertCircle, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { usePageSearch } from '../hooks/usePageSearch.js';
import { LoadingSpinner } from './LoadingSpinner.jsx';

/**
 * @function PageSearchSelector
 * @description Searchable dropdown for selecting Confluence/Notion pages with debounce
 * @param {Object} props
 * @param {Function} props.fetchPages - Function to fetch pages (query, limit, signal) => Promise<Array>
 * @param {string} props.selectedPageId - Currently selected page ID
 * @param {Function} props.onPageSelect - Callback when page is selected (pageId, pageTitle)
 * @param {string} props.platform - Platform name (for display)
 * @param {string} [props.placeholder='Search pages...'] - Search input placeholder
 * @param {number} [props.limit=50] - Maximum results to show
 * @returns {JSX.Element}
 * @example
 *   <PageSearchSelector
 *     fetchPages={getConfluencePages}
 *     selectedPageId={selectedId}
 *     onPageSelect={(id, title) => handleSelect(id, title)}
 *     platform="Confluence"
 *   />
 */
export function PageSearchSelector({
  fetchPages,
  selectedPageId,
  onPageSelect,
  platform,
  placeholder = 'Search pages...',
  limit = 50,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const {
    pages,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    triggerSearch,
    clearSearch,
  } = usePageSearch(fetchPages, 500, limit, platform);

  const selectedPage = pages.find((p) => p.id === selectedPageId);

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleInputClick = () => {
    setIsOpen(true);
    if (!pages.length && !isLoading) {
      triggerSearch();
    }
  };

  const handleClearSearch = (e) => {
    e.stopPropagation();
    clearSearch();
    setIsOpen(false);
    setIsSelecting(false);
  };

  const handlePageClick = (page) => {
    onPageSelect(page.id, page.title);
    setSearchQuery('');
    setIsOpen(false);
    setIsSelecting(false);
  };

  const handleChangeClick = () => {
    setIsSelecting(true);
    setIsOpen(true);
    setSearchQuery('');
    if (!pages.length && !isLoading) {
      triggerSearch();
    }
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        if (!selectedPageId) {
          setSearchQuery('');
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, selectedPageId, setSearchQuery]);

  if (selectedPage && !isSelecting) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {selectedPage.title}
            </p>
            {selectedPage.spaceKey && (
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedPage.spaceKey}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleChangeClick}
            className="ml-3 px-3 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003B44] focus-visible:ring-offset-1"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-2">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
          <Search className="h-3.5 w-3.5 text-slate-400" />
        </div>

        <input
          ref={inputRef}
          id="page-search"
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onClick={handleInputClick}
          placeholder={placeholder}
          className="block w-full pl-7 pr-20 py-2.5 border border-slate-200 rounded-lg bg-white text-sm text-slate-900 placeholder-slate-400 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#003B44] focus-visible:ring-offset-1 focus-visible:outline-none transition-colors"
          aria-label={`Search ${platform} pages`}
          aria-describedby={error ? 'search-error' : undefined}
          aria-expanded={isOpen}
          aria-controls="page-dropdown-list"
          role="combobox"
          aria-autocomplete="list"
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-2">
          {isLoading && <LoadingSpinner size="small" />}

          {searchQuery && !isLoading && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </div>
      </div>

      {error && (
        <div
          id="search-error"
          className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isOpen && pages.length > 0 && (
        <div
          ref={dropdownRef}
          id="page-dropdown-list"
          role="listbox"
          className="absolute z-10 w-full mt-1 max-h-64 overflow-y-auto border border-slate-200 rounded-lg bg-white shadow-lg"
        >
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              role="option"
              aria-selected={page.id === selectedPageId}
              onClick={() => handlePageClick(page)}
              className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${
                page.id === selectedPageId ? 'bg-slate-50' : ''
              }`}
            >
              <div className="text-sm font-medium text-slate-900 truncate">
                {page.title}
              </div>
              {page.spaceKey && (
                <div className="text-xs text-slate-500 mt-0.5">
                  {page.spaceKey}
                </div>
              )}
            </button>
          ))}

          {pages.length >= limit && (
            <div className="px-4 py-2.5 text-xs text-slate-500 bg-slate-50 border-t border-slate-200">
              Showing first {limit} results. Refine your search for more.
            </div>
          )}
        </div>
      )}

      {isOpen && !isLoading && !error && searchQuery && pages.length === 0 && (
        <div className="absolute z-10 w-full mt-1 text-sm text-slate-500 text-center py-8 border border-slate-200 rounded-lg bg-white shadow-lg">
          No pages found matching &quot;{searchQuery}&quot;
        </div>
      )}

      {isOpen &&
        !searchQuery &&
        !isLoading &&
        pages.length === 0 &&
        !selectedPageId && (
          <div className="absolute z-10 w-full mt-1 text-sm text-slate-500 text-center py-8 border border-slate-200 rounded-lg bg-white shadow-lg">
            Type to search {platform} pages
          </div>
        )}
    </div>
  );
}
