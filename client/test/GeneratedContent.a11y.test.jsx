/**
 * @fileoverview Accessibility tests for GeneratedContent component using jest-axe
 * @module test/GeneratedContent.a11y
 */

import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { GeneratedContent } from '../src/components/GeneratedContent';

expect.extend(toHaveNoViolations);

/**
 * @function testAccessibility
 * @description Verifies GeneratedContent has no WCAG violations with basic markdown content
 */
test('GeneratedContent has no accessibility violations', async () => {
  const mockContent = `# Test Title

This is a paragraph with **bold text** and *italic text*.

## Code Example

\`\`\`javascript
function hello() {
  console.log('Hello, world!');
}
\`\`\`

## List Items

- First item
- Second item
- Third item
`;

  const mockSendToNotion = vi.fn();

  const { container } = render(
    <GeneratedContent
      content={mockContent}
      onSendToNotion={mockSendToNotion}
      isSending={false}
    />
  );

  const results = await axe(container);

  expect(results).toHaveNoViolations();
});

/**
 * @function testAccessibilityDuringSend
 * @description Verifies accessibility during Notion send operation
 */
test('GeneratedContent maintains accessibility during send operation', async () => {
  const mockContent = '# Simple Test\n\nTest content';
  const mockSendToNotion = vi.fn();

  const { container } = render(
    <GeneratedContent
      content={mockContent}
      onSendToNotion={mockSendToNotion}
      isSending={true}
    />
  );

  const results = await axe(container);

  expect(results).toHaveNoViolations();
});
