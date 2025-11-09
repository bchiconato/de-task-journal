/**
 * @fileoverview Tests for WriteModeSelector component
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WriteModeSelector } from '../src/components/WriteModeSelector';

describe('WriteModeSelector', () => {
  const defaultProps = {
    selected: 'append',
    onChange: vi.fn(),
  };

  it('renders both mode options', () => {
    render(<WriteModeSelector {...defaultProps} />);

    expect(screen.getByText(/Append \(Add to end\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Overwrite \(Replace all\)/i)).toBeInTheDocument();
  });

  it('shows append as selected by default', () => {
    render(<WriteModeSelector {...defaultProps} />);

    const appendInput = screen.getByLabelText(/Append \(Add to end\)/i);
    expect(appendInput).toBeChecked();
  });

  it('shows overwrite as selected when specified', () => {
    render(<WriteModeSelector {...defaultProps} selected="overwrite" />);

    const overwriteInput = screen.getByLabelText(/Overwrite \(Replace all\)/i);
    expect(overwriteInput).toBeChecked();
  });

  it('calls onChange when append is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<WriteModeSelector {...defaultProps} selected="overwrite" onChange={onChange} />);

    const appendInput = screen.getByLabelText(/Append \(Add to end\)/i);
    await user.click(appendInput);

    expect(onChange).toHaveBeenCalledWith('append');
  });

  it('calls onChange when overwrite is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<WriteModeSelector {...defaultProps} onChange={onChange} />);

    const overwriteInput = screen.getByLabelText(/Overwrite \(Replace all\)/i);
    await user.click(overwriteInput);

    expect(onChange).toHaveBeenCalledWith('overwrite');
  });

  it('displays warning message when overwrite is selected', () => {
    render(<WriteModeSelector {...defaultProps} selected="overwrite" />);

    expect(
      screen.getByText(/You will be asked to confirm before replacing content/i),
    ).toBeInTheDocument();
  });

  it('does not display warning message when append is selected', () => {
    render(<WriteModeSelector {...defaultProps} selected="append" />);

    expect(
      screen.queryByText(/You will be asked to confirm before replacing content/i),
    ).not.toBeInTheDocument();
  });

  it('renders Plus icon for append mode', () => {
    const { container } = render(<WriteModeSelector {...defaultProps} />);

    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('has correct input IDs and labels', () => {
    render(<WriteModeSelector {...defaultProps} />);

    const appendInput = screen.getByLabelText(/Append \(Add to end\)/i);
    const overwriteInput = screen.getByLabelText(/Overwrite \(Replace all\)/i);

    expect(appendInput).toHaveAttribute('id', 'writeMode-append');
    expect(overwriteInput).toHaveAttribute('id', 'writeMode-overwrite');
  });

  it('applies correct border color for selected append', () => {
    const { container } = render(<WriteModeSelector {...defaultProps} selected="append" />);

    const appendDiv = container.querySelector('#writeMode-append')?.closest('div');
    expect(appendDiv).toHaveClass('border-[#003B44]');
  });

  it('applies correct border color for selected overwrite', () => {
    const { container } = render(
      <WriteModeSelector {...defaultProps} selected="overwrite" />,
    );

    const overwriteDiv = container.querySelector('#writeMode-overwrite')?.closest('div');
    expect(overwriteDiv).toHaveClass('border-amber-600');
  });

  it('has correct name attribute for radio inputs', () => {
    render(<WriteModeSelector {...defaultProps} />);

    const appendInput = screen.getByLabelText(/Append \(Add to end\)/i);
    const overwriteInput = screen.getByLabelText(/Overwrite \(Replace all\)/i);

    expect(appendInput).toHaveAttribute('name', 'writeMode');
    expect(overwriteInput).toHaveAttribute('name', 'writeMode');
  });
});