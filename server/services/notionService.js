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

  allRichText.push(...richTextArray);
  }

  return allRichText.length > 0 ? allRichText : [{
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

    if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
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

  return blocks;
}

/**
 * @function splitLongText
 * @description Splits text into chunks of max length to fit Notion's 2000 char limit per rich_text object
 * @param {string} text - Text to split
 * @param {number} maxLength - Maximum length per chunk (default 2000)
 * @returns {Array<string>} Array of text chunks, each ≤ maxLength
 * @example
 *   splitLongText("a".repeat(5000), 2000) // Returns 3 chunks
 */
function splitLongText(text, maxLength = 2000) {
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
 * @function validateBlockLimits
 * @description Validates that blocks array meets Notion API size limits
 * @param {Array<Object>} blocks - Array of Notion block objects
 * @returns {{valid: boolean, errors: Array<string>, warnings: Array<string>}}
 * @example
 *   const result = validateBlockLimits(blocks);
 *   if (!result.valid) console.error(result.errors);
 */
function validateBlockLimits(blocks) {
  const errors = [];
  const warnings = [];

  if (blocks.length > 100) {
    warnings.push(
      `Block array has ${blocks.length} items. Maximum per request is 100. Use chunking.`
    );
  }

  if (blocks.length > 1000) {
    errors.push(
      `Total block elements (${blocks.length}) exceed maximum of 1000 per request.`
    );
  }

  let totalElements = 0;
  blocks.forEach((block, index) => {
    totalElements++;

    const blockType = block.type;
    const blockData = block[blockType];

    if (blockData && blockData.rich_text) {
      totalElements += blockData.rich_text.length;

      if (blockData.rich_text.length > 100) {
        errors.push(
          `Block ${index} (${blockType}) has ${blockData.rich_text.length} rich_text items. Maximum is 100.`
        );
      }

      blockData.rich_text.forEach((richText, rtIndex) => {
        if (richText.text && richText.text.content) {
          const contentLength = richText.text.content.length;
          if (contentLength > 2000) {
            errors.push(
              `Block ${index} (${blockType}) rich_text[${rtIndex}] has ${contentLength} chars. Maximum is 2000.`
            );
          }
        }
      });
    }

    if (block.children) {
      totalElements += block.children.length;
    }
  });

  if (totalElements > 1000) {
    errors.push(
      `Total block elements (${totalElements}) exceed maximum of 1000 per request.`
    );
  }

  const jsonSize = JSON.stringify(blocks).length;
  const maxPayloadSize = 500 * 1024;
  if (jsonSize > maxPayloadSize) {
    errors.push(
      `Payload size (${(jsonSize / 1024).toFixed(2)}KB) exceeds maximum of 500KB.`
    );
  }

  if (jsonSize > maxPayloadSize * 0.9) {
    warnings.push(
      `Payload size (${(jsonSize / 1024).toFixed(2)}KB) is close to 500KB limit.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
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

export {
  parseInlineMarkdown,
  markdownToNotionBlocks,
  splitLongText,
  validateBlockLimits,
};
