/**
 * @fileoverview Markdown to Notion block conversion utilities
 * @module services/notion/markdown
 */

/**
 * @function parseInlineMarkdown
 * @description Parses inline Markdown formatting (bold, italic, code, links) into Notion rich_text objects with proper annotations
 * @param {string} text - Plain text with inline Markdown syntax
 * @returns {Array<Object>} Array of Notion rich_text objects with annotations
 * @example
 *   parseInlineMarkdown("This is **bold** and *italic*")
 */
/**
 * @fileoverview Markdown to Notion block conversion utilities
 * @module services/notion/markdown
 */

/**
 * @function parseInlineMarkdown
 * @description Parses inline Markdown formatting (bold, italic, code, links) into Notion rich_text objects with proper annotations
 * @param {string} text - Plain text with inline Markdown syntax
 * @returns {Array<Object>} Array of Notion rich_text objects with annotations
 * @example
 *   parseInlineMarkdown("This is **bold** and *italic*")
 */
export function parseInlineMarkdown(text) {
  if (!text || typeof text !== 'string') {
    return [
      {
        type: 'text',
        text: { content: '' },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default',
        },
      },
    ];
  }

  const textChunks = splitLongText(text, 2000);
  const allRichText = [];

  for (const chunk of textChunks) {
    const richTextArray = [];
    let remainingText = chunk;

    const patterns = [
      { regex: /\[([^\]]+)\]\(([^)]+)\)/g, type: 'link' },
      { regex: /`([^`]+)`/g, type: 'code' },
      { regex: /\*\*([^*]+)\*\*/g, type: 'bold' },
      { regex: /__([^_]+)__/g, type: 'bold' },
      { regex: /\*([^*]+)\*/g, type: 'italic' },
      { regex: /_([^_]+)_/g, type: 'italic' },
    ];

    while (remainingText.length > 0) {
      let earliestMatch = null;
      let earliestIndex = remainingText.length;
      let matchedPattern = null;

      for (const pattern of patterns) {
        pattern.regex.lastIndex = 0;
        const match = pattern.regex.exec(remainingText);

        if (match && match.index < earliestIndex) {
          earliestMatch = match;
          earliestIndex = match.index;
          matchedPattern = pattern;
        }
      }

      if (!earliestMatch) {
        if (remainingText.length > 0) {
          richTextArray.push({
            type: 'text',
            text: { content: remainingText },
            annotations: {
              bold: false,
              italic: false,
              strikethrough: false,
              underline: false,
              code: false,
              color: 'default',
            },
          });
        }
        break;
      }

      if (earliestIndex > 0) {
        richTextArray.push({
          type: 'text',
          text: { content: remainingText.substring(0, earliestIndex) },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: 'default',
          },
        });
      }

      const annotations = {
        bold: false,
        italic: false,
        strikethrough: false,
        underline: false,
        code: false,
        color: 'default',
      };
      let textContent = '';
      let linkUrl = null;

      if (matchedPattern.type === 'link') {
        textContent = earliestMatch[1];
        linkUrl = earliestMatch[2];
      } else if (matchedPattern.type === 'bold') {
        annotations.bold = true;
        textContent = earliestMatch[1];
      } else if (matchedPattern.type === 'italic') {
        annotations.italic = true;
        textContent = earliestMatch[1];
      } else if (matchedPattern.type === 'code') {
        annotations.code = true;
        textContent = earliestMatch[1];
      }

      const richTextObject = {
        type: 'text',
        text: { content: textContent },
        annotations,
      };

      if (linkUrl) {
        richTextObject.text.link = { url: linkUrl };
      }

      richTextArray.push(richTextObject);

      remainingText = remainingText.substring(
        earliestIndex + earliestMatch[0].length,
      );
    }

    allRichText.push(...richTextArray);
  }

  return allRichText.length > 0
    ? allRichText
    : [
        {
          type: 'text',
          text: { content: '' },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: 'default',
          },
        },
      ];
}

/**
 * @function markdownToNotionBlocks
 * @description Converts markdown content to Notion blocks (headings, code, lists, paragraphs)
 * @param {string} markdown - Markdown content
 * @returns {Array} Array of Notion block objects
 */
export function markdownToNotionBlocks(markdown) {
  const blocks = [];
  const lines = markdown.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    if (isTableStart(lines, i)) {
      const { block: tableBlock, nextIndex } = parseTable(lines, i);
      blocks.push(tableBlock);
      i = nextIndex;
      continue;
    }

    if (line.startsWith('# ')) {
      blocks.push({
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: parseInlineMarkdown(line.substring(2)),
          is_toggleable: true,
        },
        children: [],
      });
      i++;
      continue;
    }

    if (line.startsWith('## ')) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: parseInlineMarkdown(line.substring(3)),
        },
      });
      i++;
      continue;
    }

    if (line.startsWith('### ')) {
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: parseInlineMarkdown(line.substring(4)),
        },
      });
      i++;
      continue;
    }

    if (line.trim().startsWith('```')) {
      const codeLines = [];
      const language = line.trim().substring(3).trim() || 'plain text';
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;

      const codeContent = codeLines.join('\n');
      const contentChunks = splitLongText(codeContent, 2000);

      blocks.push({
        object: 'block',
        type: 'code',
        code: {
          rich_text: contentChunks.map((chunk) => ({
            type: 'text',
            text: { content: chunk },
          })),
          language: mapLanguage(language),
        },
      });
      continue;
    }

    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: parseInlineMarkdown(line.trim().substring(2)),
        },
      });
      i++;
      continue;
    }

    if (/^\d+\.\s/.test(line.trim())) {
      blocks.push({
        object: 'block',
        type: 'numbered_list_item',
        numbered_list_item: {
          rich_text: parseInlineMarkdown(line.trim().replace(/^\d+\.\s/, '')),
        },
      });
      i++;
      continue;
    }

    if (line.trim().startsWith('> ')) {
      blocks.push({
        object: 'block',
        type: 'quote',
        quote: {
          rich_text: parseInlineMarkdown(line.trim().substring(2)),
        },
      });
      i++;
      continue;
    }

    if (
      line.trim() === '---' ||
      line.trim() === '***' ||
      line.trim() === '___'
    ) {
      blocks.push({
        object: 'block',
        type: 'divider',
        divider: {},
      });
      i++;
      continue;
    }

    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: parseInlineMarkdown(line),
      },
    });
    i++;
  }

  if (blocks.length > 1 && blocks[0].type === 'heading_1') {
    const headingBlock = blocks[0];
    headingBlock.children = [
      ...(headingBlock.children || []),
      ...blocks.slice(1),
    ];
    return [headingBlock];
  }

  return blocks;
}

function isTableStart(lines, index) {
  if (index + 1 >= lines.length) return false;
  const header = lines[index].trim();
  const separator = lines[index + 1].trim();
  if (!header.startsWith('|') || !separator.startsWith('|')) return false;
  const headerCells = splitTableRow(header);
  const separatorCells = splitTableRow(separator);
  if (headerCells.length < 2 || headerCells.length !== separatorCells.length) {
    return false;
  }
  return separatorCells.every((cell) =>
    /^:?-{3,}:?$/.test(cell.replace(/\s+/g, '')),
  );
}

function splitTableRow(row) {
  return row
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function parseTable(lines, startIndex) {
  const headerLine = lines[startIndex];
  const headerCells = splitTableRow(headerLine);
  const rows = [];

  let currentIndex = startIndex + 2;
  while (
    currentIndex < lines.length &&
    lines[currentIndex].trim().startsWith('|')
  ) {
    rows.push(splitTableRow(lines[currentIndex]));
    currentIndex++;
  }

  const columnCount = headerCells.length;

  const headerRow = createTableRow(headerCells);
  const dataRows = rows.map((cells) => {
    const filled = [...cells];
    while (filled.length < columnCount) {
      filled.push('');
    }
    if (filled.length > columnCount) {
      filled.length = columnCount;
    }
    return createTableRow(filled);
  });

  const tableBlock = {
    object: 'block',
    type: 'table',
    table: {
      table_width: columnCount,
      has_column_header: true,
      has_row_header: false,
      children: [headerRow, ...dataRows],
    },
  };

  return { block: tableBlock, nextIndex: currentIndex };
}

function createTableRow(cells) {
  return {
    object: 'block',
    type: 'table_row',
    table_row: {
      cells: cells.map((cell) => parseInlineMarkdown(cell)),
    },
  };
}

/**
 * @function splitLongText
 * @description Splits text into chunks of max length to fit Notion's 2000 char limit per rich_text object
 * @param {string} text - Text to split
 * @param {number} maxLength - Maximum length per chunk (default 2000)
 * @returns {Array<string>} Array of text chunks, each ≤ maxLength
 * @example
 *   splitLongText("a".repeat(5000), 2000)
 */
export function splitLongText(text, maxLength = 2000) {
  if (!text || text.length <= maxLength) {
    return [text || ''];
  }

  const chunks = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    let splitAt = maxLength;
    const spaceIndex = remaining.lastIndexOf(' ', maxLength);
    const newlineIndex = remaining.lastIndexOf('\n', maxLength);

    if (newlineIndex > maxLength * 0.8) {
      splitAt = newlineIndex;
    } else if (spaceIndex > maxLength * 0.8) {
      splitAt = spaceIndex;
    }

    chunks.push(remaining.substring(0, splitAt));
    remaining = remaining.substring(splitAt).trimStart();
  }

  return chunks;
}

/**
 * @function mapLanguage
 * @description Maps markdown language identifiers to Notion code block languages
 * @param {string} lang - Language identifier from markdown
 * @returns {string} Notion-compatible language name
 */
function mapLanguage(lang) {
  const languageMap = {
    javascript: 'javascript',
    js: 'javascript',
    typescript: 'typescript',
    ts: 'typescript',
    python: 'python',
    py: 'python',
    sql: 'sql',
    bash: 'bash',
    shell: 'shell',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    java: 'java',
    cpp: 'c++',
    c: 'c',
    go: 'go',
    rust: 'rust',
    ruby: 'ruby',
    php: 'php',
  };

  return languageMap[lang.toLowerCase()] || 'plain text';
}
