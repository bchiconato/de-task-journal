/**
 * @fileoverview Tests for Confluence markdown to storage format converter
 */

import { describe, it, expect } from 'vitest';
import { markdownToConfluenceStorage } from '../src/services/confluence/markdown.js';

describe('markdownToConfluenceStorage', () => {
  describe('Headings', () => {
    it('converts H1 heading to Confluence format', () => {
      const markdown = '# Main Title';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toBe('<h1>Main Title</h1>');
    });

    it('converts H2 heading to Confluence format', () => {
      const markdown = '## Section Title';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toBe('<h2>Section Title</h2>');
    });

    it('converts H3 heading to Confluence format', () => {
      const markdown = '### Subsection Title';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toBe('<h3>Subsection Title</h3>');
    });

    it('converts multiple headings', () => {
      const markdown = '# Title\n## Section\n### Subsection';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toContain('<h1>Title</h1>');
      expect(result).toContain('<h2>Section</h2>');
      expect(result).toContain('<h3>Subsection</h3>');
    });
  });

  describe('Paragraphs', () => {
    it('converts simple paragraph', () => {
      const markdown = 'This is a simple paragraph.';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toBe('<p>This is a simple paragraph.</p>');
    });

    it('converts multiple paragraphs', () => {
      const markdown = 'First paragraph.\n\nSecond paragraph.';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toContain('<p>First paragraph.</p>');
      expect(result).toContain('<p>Second paragraph.</p>');
    });

    it('handles empty lines between content', () => {
      const markdown = 'Paragraph one.\n\n\nParagraph two.';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toContain('<p>Paragraph one.</p>');
      expect(result).toContain('<p>Paragraph two.</p>');
    });
  });

  describe('Code Blocks', () => {
    it('converts code block with language specified', () => {
      const markdown = '```javascript\nconsole.log("test");\n```';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toContain('<ac:structured-macro ac:name="code">');
      expect(result).toContain(
        '<ac:parameter ac:name="language">javascript</ac:parameter>',
      );
      expect(result).toContain(
        '<ac:plain-text-body><![CDATA[console.log("test");]]></ac:plain-text-body>',
      );
    });

    it('converts code block with python language', () => {
      const markdown = '```python\nprint("hello")\n```';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toContain(
        '<ac:parameter ac:name="language">python</ac:parameter>',
      );
      expect(result).toContain('print("hello")');
    });

    it('converts code block without language', () => {
      const markdown = '```\nsome code\n```';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toContain(
        '<ac:parameter ac:name="language">none</ac:parameter>',
      );
      expect(result).toContain('some code');
    });

    it('converts code block with multiple lines', () => {
      const markdown = '```sql\nSELECT * FROM users\nWHERE active = true;\n```';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toContain('SELECT * FROM users');
      expect(result).toContain('WHERE active = true;');
    });
  });

  describe('Lists', () => {
    it('converts unordered list with dashes', () => {
      const markdown = '- Item 1\n- Item 2\n- Item 3';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>Item 1</li>');
      expect(result).toContain('<li>Item 2</li>');
      expect(result).toContain('<li>Item 3</li>');
      expect(result).toContain('</ul>');
    });

    it('converts unordered list with asterisks', () => {
      const markdown = '* Item A\n* Item B';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>Item A</li>');
      expect(result).toContain('<li>Item B</li>');
      expect(result).toContain('</ul>');
    });

    it('converts ordered list', () => {
      const markdown = '1. First\n2. Second\n3. Third';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toContain('<ol>');
      expect(result).toContain('<li>First</li>');
      expect(result).toContain('<li>Second</li>');
      expect(result).toContain('<li>Third</li>');
      expect(result).toContain('</ol>');
    });

    it('terminates list when non-list content follows', () => {
      const markdown = '- Item 1\n- Item 2\n\nParagraph after list.';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toContain('</ul>');
      expect(result).toContain('<p>Paragraph after list.</p>');
    });
  });

  describe('Inline Formatting', () => {
    it('converts bold text with double asterisks', () => {
      const markdown = 'This is **bold** text.';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toBe('<p>This is <strong>bold</strong> text.</p>');
    });

    it('converts bold text with double underscores', () => {
      const markdown = 'This is __bold__ text.';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toBe('<p>This is <strong>bold</strong> text.</p>');
    });

    it('converts italic text with single asterisk', () => {
      const markdown = 'This is *italic* text.';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toBe('<p>This is <em>italic</em> text.</p>');
    });

    it('converts italic text with single underscore', () => {
      const markdown = 'This is _italic_ text.';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toBe('<p>This is <em>italic</em> text.</p>');
    });

    it('converts inline code', () => {
      const markdown = 'Use `console.log()` for debugging.';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toBe(
        '<p>Use <code>console.log()</code> for debugging.</p>',
      );
    });

    it('converts links', () => {
      const markdown = 'Visit [Google](https://google.com) for search.';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toBe(
        '<p>Visit <a href="https://google.com">Google</a> for search.</p>',
      );
    });

    it('converts multiple inline formats in same line', () => {
      const markdown = 'Text with **bold**, *italic*, and `code`.';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<em>italic</em>');
      expect(result).toContain('<code>code</code>');
    });
  });

  describe('Quotes', () => {
    it('converts blockquote', () => {
      const markdown = '> This is a quote.';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toBe('<blockquote>This is a quote.</blockquote>');
    });

    it('preserves inline formatting in quotes', () => {
      const markdown = '> This quote has **bold** text.';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toContain('<blockquote>');
      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('</blockquote>');
    });
  });

  describe('Dividers', () => {
    it('converts horizontal rule with dashes', () => {
      const markdown = '---';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toBe('<hr />');
    });

    it('converts horizontal rule with asterisks', () => {
      const markdown = '***';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toBe('<hr />');
    });
  });

  describe('XML Escaping', () => {
    it('escapes XML special characters in paragraphs', () => {
      const markdown = 'Text with <tags> and & symbols.';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toContain('&lt;tags&gt;');
      expect(result).toContain('&amp;');
    });

    it('escapes quotes and apostrophes', () => {
      const markdown = 'Text with "quotes" and \'apostrophes\'.';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toContain('&quot;');
      expect(result).toContain('&apos;');
    });
  });

  describe('Complex Documents', () => {
    it('converts complete documentation with mixed elements', () => {
      const markdown = `# Main Title

This is an introduction paragraph.

## Section 1

- Point 1
- Point 2

Some **bold** and *italic* text.

\`\`\`javascript
const x = 42;
\`\`\`

> Important note here.

---

End of document.`;

      const result = markdownToConfluenceStorage(markdown);

      expect(result).toContain('<h1>Main Title</h1>');
      expect(result).toContain('<h2>Section 1</h2>');
      expect(result).toContain('<ul>');
      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<em>italic</em>');
      expect(result).toContain('<ac:structured-macro ac:name="code">');
      expect(result).toContain('<blockquote>');
      expect(result).toContain('<hr />');
    });

    it('handles empty input', () => {
      const markdown = '';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toBe('');
    });

    it('handles whitespace-only input', () => {
      const markdown = '   \n\n   ';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toMatch(/^(<p><\/p>\n?)+$/);
    });
  });

  describe('Edge Cases', () => {
    it('handles code block with indentation', () => {
      const markdown = '  ```python\n  print("test")\n  ```';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toContain('python');
      expect(result).toContain('print("test")');
    });

    it('handles list items with inline formatting', () => {
      const markdown = '- **Bold** item\n- *Italic* item\n- `Code` item';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toContain('<strong>Bold</strong>');
      expect(result).toContain('<em>Italic</em>');
      expect(result).toContain('<code>Code</code>');
    });

    it('handles consecutive formatting marks', () => {
      const markdown = '**bold****more bold**';
      const result = markdownToConfluenceStorage(markdown);
      expect(result).toContain('<strong>bold</strong>');
    });
  });
});
