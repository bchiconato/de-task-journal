/**
 * @fileoverview Markdown to Confluence Storage Format converter
 * @module services/confluence/markdown
 */

/**
 * @function markdownToConfluenceStorage
 * @description Converts markdown to Confluence Storage Format (XHTML)
 * @param {string} markdown - Input markdown string
 * @returns {string} Confluence Storage Format XHTML
 * @example
 *   const xhtml = markdownToConfluenceStorage('# Title\n\nParagraph');
 */
export function markdownToConfluenceStorage(markdown) {
  const lines = markdown.split('\n');
  const result = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines = [];
  let inList = false;
  let listItems = [];
  let listType = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = trimmedLine.slice(3).trim() || 'none';
        codeBlockLines = [];
      } else {
        inCodeBlock = false;
        result.push(buildCodeBlock(codeBlockLines.join('\n'), codeBlockLang));
        codeBlockLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(escapeXml(line));
      continue;
    }

    if (
      inList &&
      !trimmedLine.match(/^[-*]\s/) &&
      !trimmedLine.match(/^\d+\.\s/)
    ) {
      result.push(buildList(listItems, listType));
      listItems = [];
      inList = false;
      listType = '';
    }

    if (trimmedLine.match(/^[-*]\s/)) {
      inList = true;
      listType = 'ul';
      const content = trimmedLine.replace(/^[-*]\s/, '');
      listItems.push(parseInlineFormatting(content));
      continue;
    }

    if (trimmedLine.match(/^\d+\.\s/)) {
      inList = true;
      listType = 'ol';
      const content = trimmedLine.replace(/^\d+\.\s/, '');
      listItems.push(parseInlineFormatting(content));
      continue;
    }

    if (trimmedLine.startsWith('# ')) {
      result.push(buildHeading(trimmedLine.slice(2), 1));
    } else if (trimmedLine.startsWith('## ')) {
      result.push(buildHeading(trimmedLine.slice(3), 2));
    } else if (trimmedLine.startsWith('### ')) {
      result.push(buildHeading(trimmedLine.slice(4), 3));
    } else if (trimmedLine.startsWith('> ')) {
      result.push(buildQuote(trimmedLine.slice(2)));
    } else if (trimmedLine === '---' || trimmedLine === '***') {
      result.push('<hr />');
    } else if (trimmedLine === '') {
      result.push('<p></p>');
    } else {
      result.push(buildParagraph(trimmedLine));
    }
  }

  if (inList) {
    result.push(buildList(listItems, listType));
  }

  return result.join('\n');
}

/**
 * @function parseInlineFormatting
 * @description Parses inline markdown formatting (bold, italic, code, links)
 * @param {string} text - Text with markdown formatting
 * @returns {string} XHTML with inline formatting
 */
function parseInlineFormatting(text) {
  let result = escapeXml(text);

  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/__(.+?)__/g, '<strong>$1</strong>');
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
  result = result.replace(/_(.+?)_/g, '<em>$1</em>');
  result = result.replace(/`(.+?)`/g, '<code>$1</code>');
  result = result.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

  return result;
}

/**
 * @function buildHeading
 * @description Builds heading XHTML
 * @param {string} text - Heading text
 * @param {number} level - Heading level (1-6)
 * @returns {string} Heading XHTML
 */
function buildHeading(text, level) {
  const content = parseInlineFormatting(text);
  return `<h${level}>${content}</h${level}>`;
}

/**
 * @function buildParagraph
 * @description Builds paragraph XHTML
 * @param {string} text - Paragraph text
 * @returns {string} Paragraph XHTML
 */
function buildParagraph(text) {
  const content = parseInlineFormatting(text);
  return `<p>${content}</p>`;
}

/**
 * @function buildCodeBlock
 * @description Builds code block XHTML
 * @param {string} code - Code content
 * @param {string} language - Programming language
 * @returns {string} Code block XHTML
 */
function buildCodeBlock(code, language) {
  return `<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">${language}</ac:parameter><ac:plain-text-body><![CDATA[${code}]]></ac:plain-text-body></ac:structured-macro>`;
}

/**
 * @function buildList
 * @description Builds list XHTML (ul or ol)
 * @param {Array<string>} items - List items
 * @param {string} type - List type ('ul' or 'ol')
 * @returns {string} List XHTML
 */
function buildList(items, type) {
  const listItems = items.map((item) => `<li>${item}</li>`).join('\n');
  return `<${type}>\n${listItems}\n</${type}>`;
}

/**
 * @function buildQuote
 * @description Builds blockquote XHTML
 * @param {string} text - Quote text
 * @returns {string} Blockquote XHTML
 */
function buildQuote(text) {
  const content = parseInlineFormatting(text);
  return `<blockquote>${content}</blockquote>`;
}

/**
 * @function escapeXml
 * @description Escapes XML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
