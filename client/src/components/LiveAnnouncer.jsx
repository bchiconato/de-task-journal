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
import { createContext, useContext, useRef } from 'react';

const LiveContext = createContext(null);

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

/**
 * @function useAnnouncer
 * @description Hook to access live region announcer methods
 * @returns {{announcePolite: (message: string) => void, announceAssertive: (message: string) => void}}
 * @throws {Error} When used outside LiveAnnouncer provider
 * @example
 *   const announcer = useAnnouncer();
 *   announcer.announcePolite('Documentation generated successfully');
 */
export function useAnnouncer() {
  const context = useContext(LiveContext);
  if (!context) {
    throw new Error('useAnnouncer must be used within <LiveAnnouncer>');
  }
  return context;
}
