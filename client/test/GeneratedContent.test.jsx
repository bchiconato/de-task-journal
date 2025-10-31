/**
 * @fileoverview Tests for GeneratedContent component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GeneratedContent } from '../src/components/GeneratedContent.jsx';

describe('GeneratedContent', () => {
  const mockContent = '# Test Title\n\nThis is a test paragraph.';
  let mockWriteText;

  beforeEach(() => {
    vi.useFakeTimers();
    mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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
    vi.useFakeTimers();
    
    const { getByLabelText } = render(
      <GeneratedContent
        content={mockContent}
        onSendToNotion={vi.fn()}
        isSending={false}
      />
    );

    const copyButton = getByLabelText('Copy all documentation to clipboard');
    
    await act(async () => {
      await fireEvent.click(copyButton);
      // Advance any pending timers
      vi.runAllTimers();
    });
    
    expect(mockWriteText).toHaveBeenCalledWith(mockContent);
    expect(copyButton).toHaveTextContent('✓ Copied!');
    
    vi.useRealTimers();
  });

  it('resets copy button text after 2 seconds', async () => {
    const { getByLabelText } = render(
      <GeneratedContent
        content={mockContent}
        onSendToNotion={vi.fn()}
        isSending={false}
      />
    );

    const copyButton = getByLabelText('Copy all documentation to clipboard');
    
    await act(async () => {
      await fireEvent.click(copyButton);
    });
    
    expect(copyButton).toHaveTextContent('✓ Copied!');
    
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    
    expect(copyButton).toHaveTextContent('Copy all');
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
    const onSendToNotion = vi.fn().mockImplementation(() => Promise.resolve());
    const { getByLabelText } = render(
      <GeneratedContent
        content={mockContent}
        onSendToNotion={onSendToNotion}
        isSending={false}
      />
    );

    const sendButton = getByLabelText('Send documentation to Notion');
    await act(async () => {
      await fireEvent.click(sendButton);
    });

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

    const { container } = render(
      <GeneratedContent
        content={contentWithCode}
        onSendToNotion={vi.fn()}
        isSending={false}
      />
    );

    const codeBlock = container.querySelector('code');
    expect(codeBlock).toBeInTheDocument();
    expect(codeBlock.textContent).toContain('console.log("test");');
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

    const preview = screen.getByRole('complementary');
    expect(preview).toHaveAttribute('aria-labelledby', 'preview-heading');
  });
});
