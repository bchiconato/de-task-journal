/**
 * @fileoverview Tests for GeneratedContent component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { GeneratedContent } from '../src/components/GeneratedContent.jsx';

describe('GeneratedContent', () => {
  const mockContent =
    '# Test Title\n\nThis is a test paragraph with enough content to pass the minimum character validation requirement. It needs to be at least 100 characters long to ensure the Send button is enabled without showing validation warnings.';
  let mockWriteText;

  beforeEach(() => {
    vi.useFakeTimers();
    mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
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
        onSend={vi.fn()}
        isSending={false}
        isEditing={false}
        onToggleEditing={vi.fn()}
        onDocumentationChange={vi.fn()}
        platform="notion"
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders markdown content with proper heading', () => {
    render(
      <GeneratedContent
        content={mockContent}
        onSend={vi.fn()}
        isSending={false}
        isEditing={false}
        onToggleEditing={vi.fn()}
        onDocumentationChange={vi.fn()}
        platform="notion"
      />,
    );

    expect(screen.getByText('Generated documentation')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(
      screen.getByText(/This is a test paragraph with enough content/),
    ).toBeInTheDocument();
  });

  it('renders Copy all button', () => {
    render(
      <GeneratedContent
        content={mockContent}
        onSend={vi.fn()}
        isSending={false}
        isEditing={false}
        onToggleEditing={vi.fn()}
        onDocumentationChange={vi.fn()}
        platform="notion"
      />,
    );

    const copyButton = screen.getByLabelText(
      'Copy all documentation to clipboard',
    );
    expect(copyButton).toBeInTheDocument();
    expect(copyButton).toHaveTextContent('Copy all');
  });

  it('copies content to clipboard when Copy all is clicked', async () => {
    vi.useFakeTimers();

    const { getByLabelText } = render(
      <GeneratedContent
        content={mockContent}
        onSend={vi.fn()}
        isSending={false}
        isEditing={false}
        onToggleEditing={vi.fn()}
        onDocumentationChange={vi.fn()}
        platform="notion"
      />,
    );

    const copyButton = getByLabelText('Copy all documentation to clipboard');

    await act(async () => {
      await fireEvent.click(copyButton);
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
        onSend={vi.fn()}
        isSending={false}
        isEditing={false}
        onToggleEditing={vi.fn()}
        onDocumentationChange={vi.fn()}
        platform="notion"
      />,
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
        onSend={vi.fn()}
        isSending={false}
        isEditing={false}
        onToggleEditing={vi.fn()}
        onDocumentationChange={vi.fn()}
        platform="notion"
      />,
    );

    const sendButton = screen.getByLabelText('Send documentation to Notion');
    expect(sendButton).toBeInTheDocument();
    expect(sendButton).toHaveTextContent('Send to Notion');
    expect(sendButton).not.toBeDisabled();
  });

  it('renders Send to Confluence button when platform is confluence', () => {
    render(
      <GeneratedContent
        content={mockContent}
        onSend={vi.fn()}
        isSending={false}
        isEditing={false}
        onToggleEditing={vi.fn()}
        onDocumentationChange={vi.fn()}
        platform="confluence"
      />,
    );

    const sendButton = screen.getByLabelText(
      'Send documentation to Confluence',
    );
    expect(sendButton).toBeInTheDocument();
    expect(sendButton).toHaveTextContent('Send to Confluence');
    expect(sendButton).not.toBeDisabled();
  });

  it('calls onSend when Send button is clicked', async () => {
    const onSend = vi.fn().mockImplementation(() => Promise.resolve());
    const { getByLabelText } = render(
      <GeneratedContent
        content={mockContent}
        onSend={onSend}
        isSending={false}
        isEditing={false}
        onToggleEditing={vi.fn()}
        onDocumentationChange={vi.fn()}
        platform="notion"
      />,
    );

    const sendButton = getByLabelText('Send documentation to Notion');
    await act(async () => {
      await fireEvent.click(sendButton);
    });

    expect(onSend).toHaveBeenCalledWith(mockContent);
  });

  it('disables Send button when isSending is true', () => {
    render(
      <GeneratedContent
        content={mockContent}
        onSend={vi.fn()}
        isSending={true}
        isEditing={false}
        onToggleEditing={vi.fn()}
        onDocumentationChange={vi.fn()}
        platform="notion"
      />,
    );

    const sendButton = screen.getByLabelText('Send documentation to Notion');
    expect(sendButton).toBeDisabled();
    expect(sendButton).toHaveTextContent('Sending...');
    expect(sendButton).toHaveAttribute('aria-busy', 'true');
  });

  it('shows status message when sending to Notion', () => {
    render(
      <GeneratedContent
        content={mockContent}
        onSend={vi.fn()}
        isSending={true}
        isEditing={false}
        onToggleEditing={vi.fn()}
        onDocumentationChange={vi.fn()}
        platform="notion"
      />,
    );

    const statusMessage = screen.getByText(
      'Sending documentation to Notion, please wait...',
    );
    expect(statusMessage).toBeInTheDocument();
    expect(statusMessage).toHaveClass('sr-only');
  });

  it('shows status message when sending to Confluence', () => {
    render(
      <GeneratedContent
        content={mockContent}
        onSend={vi.fn()}
        isSending={true}
        isEditing={false}
        onToggleEditing={vi.fn()}
        onDocumentationChange={vi.fn()}
        platform="confluence"
      />,
    );

    const statusMessage = screen.getByText(
      'Sending documentation to Confluence, please wait...',
    );
    expect(statusMessage).toBeInTheDocument();
    expect(statusMessage).toHaveClass('sr-only');
  });

  it('renders markdown with code blocks', () => {
    const contentWithCode =
      '```javascript\nconsole.log("test");\n```\n\nThis is additional content to meet the minimum character requirement for validation. It needs to be at least 100 characters long.';

    const { container } = render(
      <GeneratedContent
        content={contentWithCode}
        onSend={vi.fn()}
        isSending={false}
        isEditing={false}
        onToggleEditing={vi.fn()}
        onDocumentationChange={vi.fn()}
        platform="notion"
      />,
    );

    const codeBlock = container.querySelector('code');
    expect(codeBlock).toBeInTheDocument();
    expect(codeBlock.textContent).toContain('console.log("test");');
  });

  it('has proper accessibility attributes', () => {
    render(
      <GeneratedContent
        content={mockContent}
        onSend={vi.fn()}
        isSending={false}
        isEditing={false}
        onToggleEditing={vi.fn()}
        onDocumentationChange={vi.fn()}
        platform="notion"
      />,
    );

    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('aria-live', 'polite');

    const preview = screen.getByRole('complementary');
    expect(preview).toHaveAttribute('aria-labelledby', 'preview-heading');
  });
});
