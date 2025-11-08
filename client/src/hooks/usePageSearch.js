/**
 * @fileoverview Custom hook for searching pages with debounce and lazy loading
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * @function usePageSearch
 * @description Hook for searching pages with debounce, lazy loading, and caching
 * @param {Function} fetchFunction - Async function that fetches pages (accepts search query and signal)
 * @param {number} [debounceMs=500] - Debounce delay in milliseconds
 * @param {number} [limit=50] - Maximum number of results to fetch
 * @param {string} [cacheKey=''] - Unique key for cache isolation (e.g., platform name)
 * @returns {{
 *   pages: Array,
 *   isLoading: boolean,
 *   error: string|null,
 *   searchQuery: string,
 *   setSearchQuery: Function,
 *   triggerSearch: Function,
 *   clearSearch: Function
 * }}
 */
export function usePageSearch(
  fetchFunction,
  debounceMs = 500,
  limit = 50,
  cacheKey = '',
) {
  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const cacheRef = useRef(new Map());

  const performSearch = useCallback(
    async (query) => {
      const fullCacheKey = `${cacheKey}_${query}_${limit}`;

      if (cacheRef.current.has(fullCacheKey)) {
        setPages(cacheRef.current.get(fullCacheKey));
        setIsLoading(false);
        setError(null);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const results = await fetchFunction(
          query,
          limit,
          abortControllerRef.current.signal,
        );

        cacheRef.current.set(fullCacheKey, results);
        setPages(results);
        setHasSearched(true);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to search pages');
          setPages([]);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [fetchFunction, limit, cacheKey],
  );

  const triggerSearch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    performSearch(searchQuery);
  }, [searchQuery, performSearch]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setPages([]);
    setError(null);
    setHasSearched(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  useEffect(() => {
    setPages([]);
    setError(null);
    setHasSearched(false);
    setSearchQuery('');
  }, [cacheKey]);

  useEffect(() => {
    if (!hasSearched && searchQuery === '') {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, debounceMs, performSearch, hasSearched]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    pages,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    triggerSearch,
    clearSearch,
  };
}
