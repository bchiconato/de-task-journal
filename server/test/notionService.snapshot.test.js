/**
 * @fileoverview Snapshot tests for markdownToNotionBlocks and Notion block structure
 */

import { expect, test } from 'vitest';
import { markdownToNotionBlocks } from '../src/services/notion/markdown.js';

test('maps markdown headings to Notion heading blocks', () => {
  const md = `# H1 Title
## H2 Subtitle
### H3 Section`;

  const blocks = markdownToNotionBlocks(md);
  expect(blocks).toMatchSnapshot();
});

test('maps markdown lists to Notion bulleted_list_item blocks', () => {
  const md = `- First item
- Second item
- Third item`;

  const blocks = markdownToNotionBlocks(md);
  expect(blocks).toMatchSnapshot();
});

test('maps markdown numbered lists to Notion numbered_list_item blocks', () => {
  const md = `1. First step
2. Second step
3. Third step`;

  const blocks = markdownToNotionBlocks(md);
  expect(blocks).toMatchSnapshot();
});

test('maps markdown code blocks to Notion code blocks with language', () => {
  const md = `\`\`\`javascript
console.log('hello');
\`\`\``;

  const blocks = markdownToNotionBlocks(md);
  expect(blocks).toMatchSnapshot();
});

test('maps complete document with mixed block types', () => {
  const md = `# Project Summary

This is a paragraph with **bold** and *italic* text.

## Implementation

- Used Express for the API
- Connected to Notion API
- Added error handling

\`\`\`python
def hello_world():
    print("Hello")
\`\`\`

### Next Steps

1. Add tests
2. Deploy to production
3. Monitor performance`;

  const blocks = markdownToNotionBlocks(md);
  expect(blocks).toMatchSnapshot();
});

test('preserves inline formatting in rich_text segments', () => {
  const md = 'This has **bold**, *italic*, and `code` formatting.';

  const blocks = markdownToNotionBlocks(md);
  expect(blocks).toMatchSnapshot();
});

test('handles empty input gracefully', () => {
  const md = '';

  const blocks = markdownToNotionBlocks(md);
  expect(blocks).toMatchSnapshot();
});

test('handles markdown with only whitespace', () => {
  const md = '   \n\n   \n';

  const blocks = markdownToNotionBlocks(md);
  expect(blocks).toMatchSnapshot();
});
