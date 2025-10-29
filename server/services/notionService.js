/**
 * @fileoverview Notion API service for sending markdown documentation to Notion with automatic block chunking
 * @module services/notionService
 */

import { fetchWithRetry } from '../src/lib/http.js';
import { env } from '../src/config/index.js';

const MAX_BLOCKS_PER_REQUEST = 100;
const NOTION_BASE = 'https://api.notion.com/v1';
const RPS_THROTTLE_MS = 350;

/**
 * @async
 * @function sendToNotion
 * @description Sends documentation to Notion page with automatic chunking for documents with >100 blocks
 * @param {string} content - Markdown content to send
 * @param {string} pageId - Notion page ID (defaults to env var)
 * @returns {Promise<Object>} Response object with success status, block count, and chunk info
 * @throws {Error} When API key/page ID missing, page not found, unauthorized, or validation fails
 */
export async function sendToNotion(content, pageId = env.NOTION_PAGE_ID) {
  if (!pageId) {
    throw new Error('NOTION_PAGE_ID not provided');
  }

  const blocks = markdownToNotionBlocks(content);
  console.log(`Generated ${blocks.length} Notion blocks`);

  const chunks = chunkBlocks(blocks, MAX_BLOCKS_PER_REQUEST);
  console.log(`Sending ${chunks.length} chunks to Notion`);

  const responses = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(
      `Sending chunk ${i + 1}/${chunks.length} (${chunks[i].length} blocks)`
    );

    const res = await fetchWithRetry(
      `${NOTION_BASE}/blocks/${pageId}/children`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${env.NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ children: chunks[i] }),
        timeoutMs: 10000,
        attempts: 3,
      }
    );

    if (res.status === 403) {
      const err = new Error(
        'Notion integration lacks insert content capability'
      );
      err.code = 'notion_forbidden';
      err.status = 403;
      throw err;
    }

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      const err = new Error(`Notion error ${res.status}: ${txt}`);
      err.code = 'notion_error';
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    responses.push(data);

    if (i < chunks.length - 1) {
      await delay(RPS_THROTTLE_MS);
    }
  }

  return {
    success: true,
    blocksAdded: blocks.length,
    chunks: chunks.length,
    responses,
  };
}

/**
 * @function chunkBlocks
 * @description Splits blocks array into chunks of specified size
 * @param {Array} blocks - Array of Notion block objects
 * @param {number} maxSize - Maximum blocks per chunk
 * @returns {Array<Array>} Array of block chunks
 */
function chunkBlocks(blocks, maxSize) {
  const chunks = [];
  for (let i = 0; i < blocks.length; i += maxSize) {
    chunks.push(blocks.slice(i, i + maxSize));
  }
  return chunks;
}

/**
 * @function delay
 * @description Simple delay helper using Promise-based setTimeout
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @function parseInlineMarkdown
 * @description Parses inline Markdown formatting (bold, italic, code, links) into Notion rich_text objects with proper annotations
 * @param {string} text - Plain text with inline Markdown syntax
 * @returns {Array<Object>} Array of Notion rich_text objects with annotations
 * @example
 *   parseInlineMarkdown("This is **bold** and *italic*")
 *   // Returns: [
 *   //   {type: 'text', text: {content: 'This is '}, annotations: {...}},
 *   //   {type: 'text', text: {content: 'bold'}, annotations: {bold: true, ...}},
 *   //   {type: 'text', text: {content: ' and '}, annotations: {...}},
 *   //   {type: 'text', text: {content: 'italic'}, annotations: {italic: true, ...}}
 *   // ]
 */
function parseInlineMarkdown(text) {
  if (!text || typeof text !== 'string') {
    return [{
      type: 'text',
      text: { content: '' },
      annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' }
    }];
  }

  const richTextArray = [];
  let remainingText = truncateText(text, 2000);

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
          annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' }
        });
      }
      break;
    }

    if (earliestIndex > 0) {
      richTextArray.push({
        type: 'text',
        text: { content: remainingText.substring(0, earliestIndex) },
        annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' }
      });
    }

    const annotations = { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' };
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
      annotations
    };

    if (linkUrl) {
      richTextObject.text.link = { url: linkUrl };
    }

    richTextArray.push(richTextObject);

    remainingText = remainingText.substring(earliestIndex + earliestMatch[0].length);
  }

  return richTextArray.length > 0 ? richTextArray : [{
    type: 'text',
    text: { content: '' },
    annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' }
  }];
}

/**
 * @function markdownToNotionBlocks
 * @description Converts markdown content to Notion blocks (headings, code, lists, paragraphs)
 * @param {string} markdown - Markdown content
 * @returns {Array} Array of Notion block objects
 */
function markdownToNotionBlocks(markdown) {
  const blocks = [];
  const lines = markdown.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    if (line.startsWith('# ')) {
      blocks.push({
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: parseInlineMarkdown(line.substring(2)),
        },
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

      blocks.push({
        object: 'block',
        type: 'code',
        code: {
          rich_text: [
            {
              type: 'text',
              text: { content: truncateText(codeContent, 2000) },
            },
          ],
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

    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: parseInlineMarkdown(line),
      },
    });
    i++;
  }

  blocks.push({
    object: 'block',
    type: 'divider',
    divider: {},
  });

  return blocks;
}

/**
 * @function truncateText
 * @description Truncates text to fit Notion's character limits (adds ellipsis if truncated)
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength) {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * @function mapLanguage
 * @description Maps markdown language identifiers to Notion code block languages
 * @param {string} lang - Language identifier from markdown
 * @returns {string} Notion-compatible language name
 */
function mapLanguage(lang) {
  const languageMap = {
    'javascript': 'javascript',
    'js': 'javascript',
    'typescript': 'typescript',
    'ts': 'typescript',
    'python': 'python',
    'py': 'python',
    'sql': 'sql',
    'bash': 'bash',
    'shell': 'shell',
    'json': 'json',
    'yaml': 'yaml',
    'yml': 'yaml',
    'java': 'java',
    'cpp': 'c++',
    'c': 'c',
    'go': 'go',
    'rust': 'rust',
    'ruby': 'ruby',
    'php': 'php',
  };

  return languageMap[lang.toLowerCase()] || 'plain text';
}

export { parseInlineMarkdown, markdownToNotionBlocks };
