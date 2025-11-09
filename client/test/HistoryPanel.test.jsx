/**
 * @fileoverview Tests for HistoryPanel component
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistoryPanel } from '../src/components/HistoryPanel';

describe('HistoryPanel', () => {
  const mockHistory = [
    {
      id: '2024-01-01T10:00:00.000Z',
      timestamp: '1/1/2024, 10:00:00 AM',
      mode: 'task',
      platform: 'notion',
      title: 'Test Task Documentation',
      documentation: 'This is a test task documentation',
    },
    {
      id: '2024-01-02T10:00:00.000Z',
      timestamp: '1/2/2024, 10:00:00 AM',
      mode: 'architecture',
      platform: 'confluence',
      title: 'System Architecture',
      documentation: 'This is system architecture documentation',
    },
    {
      id: '2024-01-03T10:00:00.000Z',
      timestamp: '1/3/2024, 10:00:00 AM',
      mode: 'meeting',
      platform: 'notion',
      title: 'Sprint Planning Meeting',
      documentation: 'Meeting notes from sprint planning',
    },
  ];

  const defaultProps = {
    history: mockHistory,
    onLoadItem: vi.fn(),
    onRemoveItem: vi.fn(),
    onClear: vi.fn(),
  };

  it('renders history button', () => {
    render(<HistoryPanel {...defaultProps} />);
    const button = screen.getByLabelText('History');
    expect(button).toBeInTheDocument();
  });

  it('opens history panel when button is clicked', async () => {
    const user = userEvent.setup();
    render(<HistoryPanel {...defaultProps} />);

    const button = screen.getByLabelText('History');
    await user.click(button);

    expect(screen.getByText(/History \(3\)/i)).toBeInTheDocument();
  });

  it('displays all history items', async () => {
    const user = userEvent.setup();
    render(<HistoryPanel {...defaultProps} />);

    const button = screen.getByLabelText('History');
    await user.click(button);

    expect(screen.getByText('Test Task Documentation')).toBeInTheDocument();
    expect(screen.getByText('System Architecture')).toBeInTheDocument();
    expect(screen.getByText('Sprint Planning Meeting')).toBeInTheDocument();
  });

  it('filters history by search query', async () => {
    const user = userEvent.setup();
    render(<HistoryPanel {...defaultProps} />);

    const button = screen.getByLabelText('History');
    await user.click(button);

    const searchInput = screen.getByPlaceholderText('Search history...');
    await user.type(searchInput, 'architecture');

    await waitFor(() => {
      expect(screen.getByText('System Architecture')).toBeInTheDocument();
      expect(screen.queryByText('Test Task Documentation')).not.toBeInTheDocument();
      expect(screen.queryByText('Sprint Planning Meeting')).not.toBeInTheDocument();
    });
  });

  it('filters history by mode', async () => {
    const user = userEvent.setup();
    render(<HistoryPanel {...defaultProps} />);

    const button = screen.getByLabelText('History');
    await user.click(button);

    const filterButton = screen.getByLabelText('Toggle filters');
    await user.click(filterButton);

    const modeSelect = screen.getByLabelText('Mode:');
    await user.selectOptions(modeSelect, 'task');

    await waitFor(() => {
      expect(screen.getByText('Test Task Documentation')).toBeInTheDocument();
      expect(screen.queryByText('System Architecture')).not.toBeInTheDocument();
      expect(screen.queryByText('Sprint Planning Meeting')).not.toBeInTheDocument();
    });
  });

  it('filters history by platform', async () => {
    const user = userEvent.setup();
    render(<HistoryPanel {...defaultProps} />);

    const button = screen.getByLabelText('History');
    await user.click(button);

    const filterButton = screen.getByLabelText('Toggle filters');
    await user.click(filterButton);

    const platformSelect = screen.getByLabelText('Platform:');
    await user.selectOptions(platformSelect, 'confluence');

    await waitFor(() => {
      expect(screen.getByText('System Architecture')).toBeInTheDocument();
      expect(screen.queryByText('Test Task Documentation')).not.toBeInTheDocument();
      expect(screen.queryByText('Sprint Planning Meeting')).not.toBeInTheDocument();
    });
  });

  it('combines search and filters', async () => {
    const user = userEvent.setup();
    render(<HistoryPanel {...defaultProps} />);

    const button = screen.getByLabelText('History');
    await user.click(button);

    const searchInput = screen.getByPlaceholderText('Search history...');
    await user.type(searchInput, 'meeting');

    const filterButton = screen.getByLabelText('Toggle filters');
    await user.click(filterButton);

    const platformSelect = screen.getByLabelText('Platform:');
    await user.selectOptions(platformSelect, 'notion');

    await waitFor(() => {
      expect(screen.getByText('Sprint Planning Meeting')).toBeInTheDocument();
      expect(screen.queryByText('Test Task Documentation')).not.toBeInTheDocument();
      expect(screen.queryByText('System Architecture')).not.toBeInTheDocument();
    });
  });

  it('calls onLoadItem when history item is clicked', async () => {
    const user = userEvent.setup();
    const onLoadItem = vi.fn();
    render(<HistoryPanel {...defaultProps} onLoadItem={onLoadItem} />);

    const button = screen.getByLabelText('History');
    await user.click(button);

    const historyItem = screen.getByText('Test Task Documentation');
    await user.click(historyItem);

    expect(onLoadItem).toHaveBeenCalledWith(mockHistory[0]);
  });

  it('calls onRemoveItem when delete button is clicked', async () => {
    const user = userEvent.setup();
    const onRemoveItem = vi.fn();
    render(<HistoryPanel {...defaultProps} onRemoveItem={onRemoveItem} />);

    const button = screen.getByLabelText('History');
    await user.click(button);

    const deleteButtons = screen.getAllByLabelText('Remove from history');
    await user.click(deleteButtons[0]);

    expect(onRemoveItem).toHaveBeenCalledWith('2024-01-01T10:00:00.000Z');
  });

  it('calls onClear when clear button is clicked', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<HistoryPanel {...defaultProps} onClear={onClear} />);

    const button = screen.getByLabelText('History');
    await user.click(button);

    const clearButton = screen.getByText('Clear');
    await user.click(clearButton);

    expect(onClear).toHaveBeenCalled();
  });

  it('shows "No history yet" when history is empty', async () => {
    const user = userEvent.setup();
    render(<HistoryPanel {...defaultProps} history={[]} />);

    const button = screen.getByLabelText('History');
    await user.click(button);

    expect(screen.getByText('No history yet')).toBeInTheDocument();
  });

  it('shows "No results found" when filters return empty', async () => {
    const user = userEvent.setup();
    render(<HistoryPanel {...defaultProps} />);

    const button = screen.getByLabelText('History');
    await user.click(button);

    const searchInput = screen.getByPlaceholderText('Search history...');
    await user.type(searchInput, 'nonexistent');

    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });
  });

  it('clears filters when clear filters button is clicked', async () => {
    const user = userEvent.setup();
    render(<HistoryPanel {...defaultProps} />);

    const button = screen.getByLabelText('History');
    await user.click(button);

    const searchInput = screen.getByPlaceholderText('Search history...');
    await user.type(searchInput, 'test');

    const filterButton = screen.getByLabelText('Toggle filters');
    await user.click(filterButton);

    const clearFiltersButton = screen.getByText('Clear filters');
    await user.click(clearFiltersButton);

    await waitFor(() => {
      expect(searchInput).toHaveValue('');
    });
  });

  it('closes panel when clicking outside', async () => {
    const user = userEvent.setup();
    const { container } = render(<HistoryPanel {...defaultProps} />);

    const button = screen.getByLabelText('History');
    await user.click(button);

    expect(screen.getByText(/History \(3\)/i)).toBeInTheDocument();

    await user.click(container);

    await waitFor(() => {
      expect(screen.queryByText(/History \(3\)/i)).not.toBeInTheDocument();
    });
  });

  it('closes panel when pressing Escape', async () => {
    const user = userEvent.setup();
    render(<HistoryPanel {...defaultProps} />);

    const button = screen.getByLabelText('History');
    await user.click(button);

    expect(screen.getByText(/History \(3\)/i)).toBeInTheDocument();

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByText(/History \(3\)/i)).not.toBeInTheDocument();
    });
  });

  it('filter icon changes color when filters are active', async () => {
    const user = userEvent.setup();
    render(<HistoryPanel {...defaultProps} />);

    const button = screen.getByLabelText('History');
    await user.click(button);

    const filterButton = screen.getByLabelText('Toggle filters');
    expect(filterButton).toHaveClass('text-white/60');

    const searchInput = screen.getByPlaceholderText('Search history...');
    await user.type(searchInput, 'test');

    await waitFor(() => {
      expect(filterButton).toHaveClass('text-[#60E7A9]');
    });
  });

  it('updates result count when filtering', async () => {
    const user = userEvent.setup();
    render(<HistoryPanel {...defaultProps} />);

    const button = screen.getByLabelText('History');
    await user.click(button);

    expect(screen.getByText(/History \(3\)/i)).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Search history...');
    await user.type(searchInput, 'task');

    await waitFor(() => {
      expect(screen.getByText(/History \(1\)/i)).toBeInTheDocument();
    });
  });
});