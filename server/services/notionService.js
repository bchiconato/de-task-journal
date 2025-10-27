import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const MAX_BLOCKS_PER_REQUEST = 100;

/**
 * Sends documentation to Notion page
 * Handles chunking for documents with >100 blocks
 * @param {string} content - Markdown content to send
 * @param {string} pageId - Notion page ID (defaults to env var)
 * @returns {Promise<Object>} Response from Notion API
 */
export async function sendToNotion(content, pageId = process.env.NOTION_PAGE_ID) {
  try {
    if (!process.env.NOTION_API_KEY) {
      throw new Error('NOTION_API_KEY not configured in environment variables');
    }

    if (!pageId) {
      throw new Error('NOTION_PAGE_ID not provided');
    }

    const blocks = markdownToNotionBlocks(content);
    console.log(`Generated ${blocks.length} Notion blocks`);

    if (blocks.length <= MAX_BLOCKS_PER_REQUEST) {
      const response = await notion.blocks.children.append({
        block_id: pageId,
        children: blocks,
      });
      return {
        success: true,
        blocksAdded: blocks.length,
        chunks: 1,
      };
    }

    const chunks = chunkBlocks(blocks, MAX_BLOCKS_PER_REQUEST);
    console.log(`Sending ${chunks.length} chunks to Notion`);

    const responses = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Sending chunk ${i + 1}/${chunks.length} (${chunks[i].length} blocks)`);

      const response = await notion.blocks.children.append({
        block_id: pageId,
        children: chunks[i],
      });

      responses.push(response);

      if (i < chunks.length - 1) {
        await delay(100);
      }
    }

    return {
      success: true,
      blocksAdded: blocks.length,
      chunks: chunks.length,
      responses,
    };
  } catch (error) {
    console.error('Error sending to Notion:', error);

    if (error.code === 'object_not_found') {
      throw new Error(
        'Notion page not found. Make sure the page ID is correct and the integration has access to it.'
      );
    }

    if (error.code === 'unauthorized') {
      throw new Error(
        'Notion API unauthorized. Check your NOTION_API_KEY and ensure the integration is connected to the page.'
      );
    }

    if (error.code === 'validation_error') {
      throw new Error(
        `Notion validation error: ${error.message}. Check that block content is properly formatted.`
      );
    }

    throw new Error(`Failed to send content to Notion: ${error.message}`);
  }
}

/**
 * Splits blocks array into chunks of specified size
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
 * Simple delay helper
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Converts markdown content to Notion blocks
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
          rich_text: [{ type: 'text', text: { content: truncateText(line.substring(2), 2000) } }],
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
          rich_text: [{ type: 'text', text: { content: truncateText(line.substring(3), 2000) } }],
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
          rich_text: [{ type: 'text', text: { content: truncateText(line.substring(4), 2000) } }],
        },
      });
      i++;
      continue;
    }

    if (line.startsWith('```')) {
      const codeLines = [];
      const language = line.substring(3).trim() || 'plain text';
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
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
          rich_text: [
            {
              type: 'text',
              text: { content: truncateText(line.trim().substring(2), 2000) },
            },
          ],
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
          rich_text: [
            {
              type: 'text',
              text: { content: truncateText(line.trim().replace(/^\d+\.\s/, ''), 2000) },
            },
          ],
        },
      });
      i++;
      continue;
    }

    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          {
            type: 'text',
            text: { content: truncateText(line, 2000) },
          },
        ],
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
 * Truncates text to fit Notion's character limits
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
 * Maps markdown language identifiers to Notion code block languages
 * @param {string} lang - Language identifier from markdown
 * @returns {string} Notion-compatible language name
 */
function mapLanguage(lang) {
  const languageMap = {
    'js': 'javascript',
    'ts': 'typescript',
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
