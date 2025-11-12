import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useToast } from '../src/hooks/useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('adds a toast and returns its identifier', () => {
    const { result } = renderHook(() => useToast());

    let toastId;
    act(() => {
      toastId = result.current.showToast('Hello world', 'info', 0);
    });

    expect(typeof toastId).toBe('number');
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'Hello world',
      type: 'info',
      show: true,
    });
  });

  it('prevents duplicate active toasts with same message and type', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Duplicate', 'info', 0);
      result.current.showToast('Duplicate', 'info', 0);
    });

    expect(result.current.toasts).toHaveLength(1);
  });

  it('clears all toasts when clearAllToasts is invoked', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSuccess('Saved', 0);
      result.current.showError('Failed', 0);
      result.current.clearAllToasts();
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('auto-dismisses info toasts after the configured duration', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showInfo('Auto dismiss', 1000);
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(1300);
    });

    expect(result.current.toasts[0].show).toBe(false);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.toasts).toHaveLength(0);
  });
});
