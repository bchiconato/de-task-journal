/**
 * @fileoverview Hook to manage AbortController lifecycle for fetch requests
 * @function useAbortableRequest
 * @description Provides methods to start abortable requests and clean up on unmount.
 * Prevents race conditions and memory leaks by automatically canceling in-flight
 * requests when the component unmounts or a new request begins.
 * @returns {{start: () => AbortSignal, abort: () => void}}
 * @example
 *   const controller = useAbortableRequest();
 *   async function fetchData() {
 *     const signal = controller.start();
 *     const res = await fetch('/api/data', { signal });
 *     return res.json();
 *   }
 */
import { useEffect, useRef } from 'react';

export function useAbortableRequest() {
  const controllerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  function start() {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    controllerRef.current = new AbortController();
    return controllerRef.current.signal;
  }

  function abort() {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }

  return { start, abort };
}
