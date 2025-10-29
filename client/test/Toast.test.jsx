/**
 * @fileoverview Tests for Toast notification component
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast } from '../src/components/Toast.jsx';

describe('Toast', () => {
  it('renders toast with message and type', () => {
    render(<Toast message="Test notification" type="success" show={true} />);

    expect(screen.getByText('Test notification')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders different toast types with correct styling', () => {
    const { rerender } = render(
      <Toast message="Success message" type="success" show={true} />
    );
    expect(screen.getByText('✓')).toBeInTheDocument();

    rerender(<Toast message="Error message" type="error" show={true} />);
    expect(screen.getByText('✕')).toBeInTheDocument();

    rerender(<Toast message="Info message" type="info" show={true} />);
    expect(screen.getByText('ℹ')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Toast
        message="Test message"
        type="info"
        show={true}
        onClose={onClose}
        duration={0}
      />
    );

    const closeButton = screen.getByLabelText('Close notification');
    await user.click(closeButton);

    await vi.waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('auto-dismisses after duration', async () => {
    vi.useFakeTimers();
    const onClose = vi.fn();

    render(
      <Toast
        message="Auto-dismiss test"
        type="info"
        show={true}
        onClose={onClose}
        duration={1000}
      />
    );

    expect(screen.getByText('Auto-dismiss test')).toBeInTheDocument();

    vi.advanceTimersByTime(1300);

    await vi.waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    vi.useRealTimers();
  });

  it('does not render when show is false', () => {
    render(<Toast message="Hidden toast" type="info" show={false} />);

    expect(screen.queryByText('Hidden toast')).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<Toast message="Accessible toast" type="success" show={true} />);

    const toast = screen.getByRole('status');
    expect(toast).toHaveAttribute('aria-live', 'polite');
    expect(toast).toHaveAttribute('aria-atomic', 'true');
  });

  it('renders with default type when invalid type is provided', () => {
    render(
      <Toast message="Default type test" type="invalid" show={true} />
    );

    expect(screen.getByText('ℹ')).toBeInTheDocument();
  });

  it('does not auto-dismiss when duration is 0', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();

    render(
      <Toast
        message="No auto-dismiss"
        type="info"
        show={true}
        onClose={onClose}
        duration={0}
      />
    );

    vi.advanceTimersByTime(5000);

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('No auto-dismiss')).toBeInTheDocument();

    vi.useRealTimers();
  });
});
