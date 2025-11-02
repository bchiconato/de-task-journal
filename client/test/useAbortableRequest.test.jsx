/**
 * @fileoverview Tests for useAbortableRequest hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAbortableRequest } from '../src/hooks/useAbortableRequest.js';

describe('useAbortableRequest', () => {
  it('returns start and abort functions', () => {
    const { result } = renderHook(() => useAbortableRequest());

    expect(result.current).toHaveProperty('start');
    expect(result.current).toHaveProperty('abort');
    expect(typeof result.current.start).toBe('function');
    expect(typeof result.current.abort).toBe('function');
  });

  it('creates new AbortController when start is called', () => {
    const { result } = renderHook(() => useAbortableRequest());

    const signal1 = result.current.start();
    expect(signal1).toBeInstanceOf(AbortSignal);
    expect(signal1.aborted).toBe(false);
  });

  it('aborts previous request when starting new one', () => {
    const { result } = renderHook(() => useAbortableRequest());

    const signal1 = result.current.start();
    expect(signal1.aborted).toBe(false);

    const signal2 = result.current.start();
    expect(signal1.aborted).toBe(true);
    expect(signal2.aborted).toBe(false);
    expect(signal1).not.toBe(signal2);
  });

  it('aborts request when abort is called', () => {
    const { result } = renderHook(() => useAbortableRequest());

    const signal = result.current.start();
    expect(signal.aborted).toBe(false);

    result.current.abort();
    expect(signal.aborted).toBe(true);
  });

  it('does not throw when abort is called without active request', () => {
    const { result } = renderHook(() => useAbortableRequest());

    expect(() => result.current.abort()).not.toThrow();
  });

  it('aborts request on unmount', () => {
    const { result, unmount } = renderHook(() => useAbortableRequest());

    const signal = result.current.start();
    expect(signal.aborted).toBe(false);

    unmount();
    expect(signal.aborted).toBe(true);
  });

  it('handles multiple start/abort cycles', () => {
    const { result } = renderHook(() => useAbortableRequest());

    const signal1 = result.current.start();
    result.current.abort();
    expect(signal1.aborted).toBe(true);

    const signal2 = result.current.start();
    expect(signal2.aborted).toBe(false);
    expect(signal1).not.toBe(signal2);

    result.current.abort();
    expect(signal2.aborted).toBe(true);
  });

  it('can be used with fetch to cancel requests', async () => {
    const { result } = renderHook(() => useAbortableRequest());

    const signal = result.current.start();

    const fetchPromise = fetch('https://example.com/api', { signal });

    result.current.abort();

    await expect(fetchPromise).rejects.toThrow();
  });

  it('clears controller reference after abort', () => {
    const { result } = renderHook(() => useAbortableRequest());

    result.current.start();
    result.current.abort();

    expect(() => result.current.abort()).not.toThrow();
  });
});
