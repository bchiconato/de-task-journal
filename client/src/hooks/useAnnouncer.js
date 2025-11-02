import { createContext, useContext } from 'react';

export const LiveContext = createContext(null);

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
