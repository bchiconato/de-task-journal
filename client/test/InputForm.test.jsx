/**
 * @fileoverview Tests for InputForm component
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InputForm } from '../src/components/InputForm.jsx';

describe('InputForm', () => {
  it('renders form with all required fields', () => {
    render(<InputForm onGenerate={vi.fn()} isLoading={false} />);

    expect(
      screen.getByText('Data Engineering Task Documenter')
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/task context/i, { exact: false })
    ).toBeInTheDocument();
  });

  it('shows validation error when context is too short', async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn();

    render(<InputForm onGenerate={onGenerate} isLoading={false} />);

    const contextField = screen.getByLabelText(/task context/i, {
      exact: false,
    });
    await user.type(contextField, 'short');
    await user.tab();

    expect(
      await screen.findByText(/context.*10.*characters/i)
    ).toBeInTheDocument();
  });

  it('calls onGenerate with form data when valid', async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn();

    render(<InputForm onGenerate={onGenerate} isLoading={false} />);

    const contextField = screen.getByLabelText(/task context/i, {
      exact: false,
    });
    await user.type(
      contextField,
      'This is a valid context with more than 10 characters'
    );

    const generateButton = screen.getByRole('button', { name: /generate/i });
    await user.click(generateButton);

    expect(onGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'This is a valid context with more than 10 characters',
      })
    );
  });

  it('does not submit form when context is empty', async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn();

    render(<InputForm onGenerate={onGenerate} isLoading={false} />);

    const generateButton = screen.getByRole('button', { name: /generate/i });
    await user.click(generateButton);

    expect(onGenerate).not.toHaveBeenCalled();
    expect(await screen.findByText(/context.*required/i)).toBeInTheDocument();
  });

  it('disables submit button when isLoading is true', () => {
    render(<InputForm onGenerate={vi.fn()} isLoading={true} />);

    const generateButton = screen.getByRole('button', { name: /generating/i });
    expect(generateButton).toBeDisabled();
  });

  it('shows character counter for context field', async () => {
    const user = userEvent.setup();

    render(<InputForm onGenerate={vi.fn()} isLoading={false} />);

    const contextField = screen.getByLabelText(/task context/i, {
      exact: false,
    });
    await user.type(contextField, 'Test');

    const counters = screen.getAllByText(/4.*characters/);
    expect(counters.length).toBeGreaterThan(0);
    expect(counters[0]).toBeInTheDocument();
  });

  it('has proper form accessibility attributes', () => {
    render(<InputForm onGenerate={vi.fn()} isLoading={false} />);

    const form = screen.getByRole('form', {
      name: /documentation generation/i,
    });
    expect(form).toHaveAttribute('noValidate');

    expect(screen.getByLabelText(/form/i)).toBeInTheDocument();
  });

  it('clears error when user starts typing after validation error', async () => {
    const user = userEvent.setup();

    render(<InputForm onGenerate={vi.fn()} isLoading={false} />);

    const generateButton = screen.getByRole('button', { name: /generate/i });
    await user.click(generateButton);

    expect(await screen.findByText(/context.*required/i)).toBeInTheDocument();

    const contextField = screen.getByLabelText(/task context/i, {
      exact: false,
    });
    await user.type(contextField, 'Valid context');

    expect(screen.queryByText(/context.*required/i)).not.toBeInTheDocument();
  });
});
