/**
 * @fileoverview Tests for GeneratedContent component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GeneratedContent } from '../src/components/GeneratedContent.jsx';

describe('GeneratedContent', () => {
  const mockContent = '# Test Title\n\nThis is a test paragraph.';

  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve()),
      },
    });
  });

  it('returns null when no content is provided', () => {
    const { container } = render(
      <GeneratedContent
        content=""
        onSendToNotion={vi.fn()}
        isSending={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders markdown content with proper heading', () => {
    render(
      <GeneratedContent
        content={mockContent}
        onSendToNotion={vi.fn()}
        isSending={false}
      />
    );

    expect(screen.getByText('Generated documentation')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('This is a test paragraph.')).toBeInTheDocument();
  });

  it('renders Copy all button', () => {
    render(
      <GeneratedContent
        content={mockContent}
        onSendToNotion={vi.fn()}
        isSending={false}
      />
    );

    const copyButton = screen.getByLabelText(
      'Copy all documentation to clipboard'
    );
    expect(copyButton).toBeInTheDocument();
    expect(copyButton).toHaveTextContent('Copy all');
  });

  it('copies content to clipboard when Copy all is clicked', async () => {
    const user = userEvent.setup();

    render(
      <GeneratedContent
        content={mockContent}
        onSendToNotion={vi.fn()}
        isSending={false}
      />
    );

    const copyButton = screen.getByLabelText(
      'Copy all documentation to clipboard'
    );
    await user.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockContent);
    await waitFor(() => {
      expect(copyButton).toHaveTextContent('✓ Copied!');
    });
  });

  it('resets copy button text after 2 seconds', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ delay: null });

    render(
      <GeneratedContent
        content={mockContent}
        onSendToNotion={vi.fn()}
        isSending={false}
      />
    );

    const copyButton = screen.getByLabelText(
      'Copy all documentation to clipboard'
    );
    await user.click(copyButton);

    expect(copyButton).toHaveTextContent('✓ Copied!');

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(copyButton).toHaveTextContent('Copy all');
    });

    vi.useRealTimers();
  });

  it('renders Send to Notion button', () => {
    render(
      <GeneratedContent
        content={mockContent}
        onSendToNotion={vi.fn()}
        isSending={false}
      />
    );

    const sendButton = screen.getByLabelText('Send documentation to Notion');
    expect(sendButton).toBeInTheDocument();
    expect(sendButton).toHaveTextContent('Send to Notion');
    expect(sendButton).not.toBeDisabled();
  });

  it('calls onSendToNotion when Send to Notion is clicked', async () => {
    const user = userEvent.setup();
    const onSendToNotion = vi.fn(() => Promise.resolve());

    render(
      <GeneratedContent
        content={mockContent}
        onSendToNotion={onSendToNotion}
        isSending={false}
      />
    );

    const sendButton = screen.getByLabelText('Send documentation to Notion');
    await user.click(sendButton);

    expect(onSendToNotion).toHaveBeenCalledWith(mockContent);
  });

  it('disables Send to Notion button when isSending is true', () => {
    render(
      <GeneratedContent
        content={mockContent}
        onSendToNotion={vi.fn()}
        isSending={true}
      />
    );

    const sendButton = screen.getByLabelText('Send documentation to Notion');
    expect(sendButton).toBeDisabled();
    expect(sendButton).toHaveTextContent('Sending...');
    expect(sendButton).toHaveAttribute('aria-busy', 'true');
  });

  it('shows status message when sending', () => {
    render(
      <GeneratedContent
        content={mockContent}
        onSendToNotion={vi.fn()}
        isSending={true}
      />
    );

    const statusMessage = screen.getByText(
      'Sending documentation to Notion, please wait...'
    );
    expect(statusMessage).toBeInTheDocument();
    expect(statusMessage).toHaveClass('sr-only');
  });

  it('renders markdown with code blocks', () => {
    const contentWithCode = '```javascript\nconsole.log("test");\n```';

    render(
      <GeneratedContent
        content={contentWithCode}
        onSendToNotion={vi.fn()}
        isSending={false}
      />
    );

    expect(screen.getByText('console.log("test");')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <GeneratedContent
        content={mockContent}
        onSendToNotion={vi.fn()}
        isSending={false}
      />
    );

    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('aria-live', 'polite');

    expect(screen.getByLabelText(/preview/i)).toBeInTheDocument();
  });
});
