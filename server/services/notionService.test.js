/**
 * @fileoverview Unit tests for Notion service Markdown to Notion API translation
 */

import { describe, it, expect } from 'vitest';
import {
  parseInlineMarkdown,
  markdownToNotionBlocks,
  splitLongText,
} from '../src/services/notion/markdown.js';

describe('parseInlineMarkdown', () => {
  it('should return plain text for strings without formatting', () => {
    const result = parseInlineMarkdown('Plain text');
    expect(result).toHaveLength(1);
    expect(result[0].text.content).toBe('Plain text');
    expect(result[0].annotations.bold).toBe(false);
    expect(result[0].annotations.italic).toBe(false);
    expect(result[0].annotations.code).toBe(false);
  });

  it('should parse bold text with **', () => {
    const result = parseInlineMarkdown('This is **bold** text');
    expect(result).toHaveLength(3);
    expect(result[0].text.content).toBe('This is ');
    expect(result[1].text.content).toBe('bold');
    expect(result[1].annotations.bold).toBe(true);
    expect(result[2].text.content).toBe(' text');
  });

  it('should parse bold text with __', () => {
    const result = parseInlineMarkdown('This is __bold__ text');
    expect(result).toHaveLength(3);
    expect(result[1].text.content).toBe('bold');
    expect(result[1].annotations.bold).toBe(true);
  });

  it('should parse italic text with *', () => {
    const result = parseInlineMarkdown('This is *italic* text');
    expect(result).toHaveLength(3);
    expect(result[0].text.content).toBe('This is ');
    expect(result[1].text.content).toBe('italic');
    expect(result[1].annotations.italic).toBe(true);
    expect(result[2].text.content).toBe(' text');
  });

  it('should parse italic text with _', () => {
    const result = parseInlineMarkdown('This is _italic_ text');
    expect(result).toHaveLength(3);
    expect(result[1].text.content).toBe('italic');
    expect(result[1].annotations.italic).toBe(true);
  });

  it('should parse inline code', () => {
    const result = parseInlineMarkdown('This is `code` text');
    expect(result).toHaveLength(3);
    expect(result[0].text.content).toBe('This is ');
    expect(result[1].text.content).toBe('code');
    expect(result[1].annotations.code).toBe(true);
    expect(result[2].text.content).toBe(' text');
  });

  it('should parse links', () => {
    const result = parseInlineMarkdown('Visit [Google](https://google.com) for search');
    expect(result).toHaveLength(3);
    expect(result[0].text.content).toBe('Visit ');
    expect(result[1].text.content).toBe('Google');
    expect(result[1].text.link.url).toBe('https://google.com');
    expect(result[2].text.content).toBe(' for search');
  });

  it('should parse multiple formatting types in one string', () => {
    const result = parseInlineMarkdown('Text with **bold** and *italic* and `code`');
    expect(result.length).toBeGreaterThanOrEqual(6);
    expect(result[0].text.content).toBe('Text with ');
    expect(result[1].text.content).toBe('bold');
    expect(result[1].annotations.bold).toBe(true);

    const italicSegment = result.find(r => r.annotations.italic);
    expect(italicSegment).toBeDefined();
    expect(italicSegment.text.content).toBe('italic');

    const codeSegment = result.find(r => r.annotations.code);
    expect(codeSegment).toBeDefined();
    expect(codeSegment.text.content).toBe('code');
  });

  it('should handle empty string', () => {
    const result = parseInlineMarkdown('');
    expect(result).toHaveLength(1);
    expect(result[0].text.content).toBe('');
  });

  it('should handle null input', () => {
    const result = parseInlineMarkdown(null);
    expect(result).toHaveLength(1);
    expect(result[0].text.content).toBe('');
  });

  it('should handle undefined input', () => {
    const result = parseInlineMarkdown(undefined);
    expect(result).toHaveLength(1);
    expect(result[0].text.content).toBe('');
  });

  it('should split text longer than 2000 characters into multiple rich_text objects', () => {
    const longText = 'a'.repeat(2500);
    const result = parseInlineMarkdown(longText);
    expect(result.length).toBeGreaterThan(1);
    expect(result[0].text.content.length).toBeLessThanOrEqual(2000);
    expect(result[1].text.content.length).toBeGreaterThan(0);
    const totalLength = result.reduce((sum, rt) => sum + rt.text.content.length, 0);
    expect(totalLength).toBe(2500);
  });

  it('should handle nested bold within a link', () => {
    const result = parseInlineMarkdown('[**bold link**](https://example.com)');
    expect(result).toHaveLength(1);
    expect(result[0].text.content).toBe('**bold link**');
    expect(result[0].text.link.url).toBe('https://example.com');
  });

  it('should handle consecutive formatting', () => {
    const result = parseInlineMarkdown('**bold***italic*');
    expect(result).toHaveLength(2);
    expect(result[0].text.content).toBe('bold');
    expect(result[0].annotations.bold).toBe(true);
    expect(result[1].text.content).toBe('italic');
    expect(result[1].annotations.italic).toBe(true);
  });

  it('should handle special characters in formatted text', () => {
    const result = parseInlineMarkdown('Code with `special@chars!#$` here');
    expect(result).toHaveLength(3);
    expect(result[1].text.content).toBe('special@chars!#$');
    expect(result[1].annotations.code).toBe(true);
  });

  it('should handle links with special characters in URL', () => {
    const result = parseInlineMarkdown('[API Docs](https://api.example.com/v1/users?id=123&type=admin)');
    expect(result).toHaveLength(1);
    expect(result[0].text.content).toBe('API Docs');
    expect(result[0].text.link.url).toBe('https://api.example.com/v1/users?id=123&type=admin');
  });
});

describe('markdownToNotionBlocks', () => {
  it('should convert heading level 1', () => {
    const markdown = '# Main Title';
    const blocks = markdownToNotionBlocks(markdown);
    expect(blocks[0].type).toBe('heading_1');
    expect(blocks[0].heading_1.rich_text[0].text.content).toBe('Main Title');
  });

  it('should convert heading level 2', () => {
    const markdown = '## Subtitle';
    const blocks = markdownToNotionBlocks(markdown);
    expect(blocks[0].type).toBe('heading_2');
    expect(blocks[0].heading_2.rich_text[0].text.content).toBe('Subtitle');
  });

  it('should convert heading level 3', () => {
    const markdown = '### Section';
    const blocks = markdownToNotionBlocks(markdown);
    expect(blocks[0].type).toBe('heading_3');
    expect(blocks[0].heading_3.rich_text[0].text.content).toBe('Section');
  });

  it('should convert headings with inline formatting', () => {
    const markdown = '## **Bold** Heading with *italic*';
    const blocks = markdownToNotionBlocks(markdown);
    expect(blocks[0].type).toBe('heading_2');
    expect(blocks[0].heading_2.rich_text.length).toBeGreaterThan(1);
    expect(blocks[0].heading_2.rich_text[0].annotations.bold).toBe(true);
  });

  it('should convert code blocks with language', () => {
    const markdown = '```javascript\nconsole.log("Hello");\n```';
    const blocks = markdownToNotionBlocks(markdown);
    expect(blocks[0].type).toBe('code');
    expect(blocks[0].code.language).toBe('javascript');
    expect(blocks[0].code.rich_text[0].text.content).toBe('console.log("Hello");');
  });

  it('should convert code blocks without language', () => {
    const markdown = '```\nplain code\n```';
    const blocks = markdownToNotionBlocks(markdown);
    expect(blocks[0].type).toBe('code');
    expect(blocks[0].code.language).toBe('plain text');
  });

  it('should convert bulleted list items', () => {
    const markdown = '- Item 1\n- Item 2';
    const blocks = markdownToNotionBlocks(markdown);
    expect(blocks[0].type).toBe('bulleted_list_item');
    expect(blocks[0].bulleted_list_item.rich_text[0].text.content).toBe('Item 1');
    expect(blocks[1].type).toBe('bulleted_list_item');
    expect(blocks[1].bulleted_list_item.rich_text[0].text.content).toBe('Item 2');
  });

  it('should convert bulleted list items with * marker', () => {
    const markdown = '* Item 1\n* Item 2';
    const blocks = markdownToNotionBlocks(markdown);
    expect(blocks[0].type).toBe('bulleted_list_item');
    expect(blocks[1].type).toBe('bulleted_list_item');
  });

  it('should convert bulleted list items with inline formatting', () => {
    const markdown = '- **Bold** item with `code`';
    const blocks = markdownToNotionBlocks(markdown);
    expect(blocks[0].type).toBe('bulleted_list_item');
    expect(blocks[0].bulleted_list_item.rich_text.length).toBeGreaterThan(1);
  });

  it('should convert numbered list items', () => {
    const markdown = '1. First\n2. Second\n3. Third';
    const blocks = markdownToNotionBlocks(markdown);
    expect(blocks[0].type).toBe('numbered_list_item');
    expect(blocks[0].numbered_list_item.rich_text[0].text.content).toBe('First');
    expect(blocks[1].type).toBe('numbered_list_item');
    expect(blocks[1].numbered_list_item.rich_text[0].text.content).toBe('Second');
    expect(blocks[2].type).toBe('numbered_list_item');
    expect(blocks[2].numbered_list_item.rich_text[0].text.content).toBe('Third');
  });

  it('should convert paragraphs', () => {
    const markdown = 'This is a paragraph with some text.';
    const blocks = markdownToNotionBlocks(markdown);
    expect(blocks[0].type).toBe('paragraph');
    expect(blocks[0].paragraph.rich_text[0].text.content).toBe('This is a paragraph with some text.');
  });

  it('should convert paragraphs with inline formatting', () => {
    const markdown = 'Text with **bold** and [link](https://example.com)';
    const blocks = markdownToNotionBlocks(markdown);
    expect(blocks[0].type).toBe('paragraph');
    expect(blocks[0].paragraph.rich_text.length).toBeGreaterThan(1);
  });

  it('should skip empty lines', () => {
    const markdown = 'Line 1\n\n\nLine 2';
    const blocks = markdownToNotionBlocks(markdown);
    expect(blocks.filter(b => b.type === 'paragraph')).toHaveLength(2);
  });

  it('should detect dividers from markdown', () => {
    const markdown = '# Title\n\n---\n\nContent after divider';
    const blocks = markdownToNotionBlocks(markdown);
    const dividers = blocks.filter(b => b.type === 'divider');
    expect(dividers).toHaveLength(1);
  });

  it('should handle complete documentation structure', () => {
    const markdown = `# Main Title

## Summary

This is a summary paragraph with **bold** text.

## Problem Solved

- Point 1
- Point 2 with *italic*

## Code Example

\`\`\`python
def hello():
    print("world")
\`\`\`

Visit [documentation](https://docs.example.com) for more.`;

    const blocks = markdownToNotionBlocks(markdown);

    expect(blocks.filter(b => b.type === 'heading_1')).toHaveLength(1);
    expect(blocks.filter(b => b.type === 'heading_2')).toHaveLength(3);
    expect(blocks.filter(b => b.type === 'paragraph').length).toBeGreaterThan(0);
    expect(blocks.filter(b => b.type === 'bulleted_list_item')).toHaveLength(2);
    expect(blocks.filter(b => b.type === 'code')).toHaveLength(1);
  });

  it('should handle mixed list types', () => {
    const markdown = `- Bullet 1
- Bullet 2
1. Number 1
2. Number 2`;
    const blocks = markdownToNotionBlocks(markdown);
    expect(blocks.filter(b => b.type === 'bulleted_list_item')).toHaveLength(2);
    expect(blocks.filter(b => b.type === 'numbered_list_item')).toHaveLength(2);
  });

  it('should preserve inline code in headings', () => {
    const markdown = '## Using `parseInlineMarkdown()` Function';
    const blocks = markdownToNotionBlocks(markdown);
    expect(blocks[0].type).toBe('heading_2');
    const codeSegment = blocks[0].heading_2.rich_text.find(rt => rt.annotations.code);
    expect(codeSegment).toBeDefined();
    expect(codeSegment.text.content).toBe('parseInlineMarkdown()');
  });

  it('should convert block quotes', () => {
    const markdown = '> This is a quote\n> Multi-line quote';
    const blocks = markdownToNotionBlocks(markdown);
    expect(blocks.filter(b => b.type === 'quote')).toHaveLength(2);
    expect(blocks[0].quote.rich_text[0].text.content).toBe('This is a quote');
  });

  it('should handle block quotes with inline formatting', () => {
    const markdown = '> This is **bold** in a *quote*';
    const blocks = markdownToNotionBlocks(markdown);
    expect(blocks[0].type).toBe('quote');
    const boldSegment = blocks[0].quote.rich_text.find(rt => rt.annotations.bold);
    const italicSegment = blocks[0].quote.rich_text.find(rt => rt.annotations.italic);
    expect(boldSegment).toBeDefined();
    expect(italicSegment).toBeDefined();
  });

  it('should detect dividers with different markdown syntaxes', () => {
    const markdown = '---\n***\n___';
    const blocks = markdownToNotionBlocks(markdown);
    expect(blocks.filter(b => b.type === 'divider')).toHaveLength(3);
  });
});

describe('splitLongText', () => {
  it('should not split text under 2000 chars', () => {
    const text = 'a'.repeat(1500);
    const chunks = splitLongText(text, 2000);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(text);
  });

  it('should split text exactly at 2000 chars', () => {
    const text = 'a'.repeat(2000);
    const chunks = splitLongText(text, 2000);
    expect(chunks).toHaveLength(1);
  });

  it('should split text over 2000 chars into multiple chunks', () => {
    const text = 'a'.repeat(5000);
    const chunks = splitLongText(text, 2000);
    expect(chunks.length).toBeGreaterThan(2);
    chunks.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(2000);
    });
  });

  it('should preserve all content when splitting', () => {
    const text = 'a'.repeat(7500);
    const chunks = splitLongText(text, 2000);
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    expect(totalLength).toBe(7500);
  });

  it('should split at word boundaries when possible', () => {
    const text = 'word '.repeat(500);
    const chunks = splitLongText(text, 2000);
    chunks.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(2000);
    });
  });
});
