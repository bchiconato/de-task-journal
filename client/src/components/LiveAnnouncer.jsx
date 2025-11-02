/**
 * @fileoverview Centralized live region provider for screen reader announcements
 * @component LiveAnnouncer
 * @description Context provider that manages polite and assertive ARIA live regions
 * for programmatic screen reader announcements. Use for success/error messages and
 * async state changes that aren't visually obvious.
 * @example
 *   <LiveAnnouncer>
 *     <App />
 *   </LiveAnnouncer>
 */
import { useRef } from 'react';
import { LiveContext } from '../hooks/useAnnouncer';

/**
 * @function LiveAnnouncer
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element}
 */
export function LiveAnnouncer({ children }) {
  const politeRef = useRef(null);
  const assertiveRef = useRef(null);

  const api = {
    announcePolite(message) {
      if (politeRef.current) {
        politeRef.current.textContent = message;
      }
    },
    announceAssertive(message) {
      if (assertiveRef.current) {
        assertiveRef.current.textContent = message;
      }
    },
  };

  return (
    <LiveContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        ref={politeRef}
      />
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        ref={assertiveRef}
      />
    </LiveContext.Provider>
  );
}
