/**
 * @fileoverview Input optimization service to prevent rate limiting by intelligently truncating or summarizing large inputs
 * @module services/inputOptimizer
 */

const MAX_CHARS_SAFE = 25000;
const MAX_CHARS_WARNING = 20000;
const MAX_CHARS_ABSOLUTE = 30000;

/**
 * @function estimateTokenCount
 * @description Estimates token count from character count (rough approximation: 1 token ≈ 0.8 chars for English)
 * @param {string} text - Input text
 * @returns {number} Estimated token count
 */
function estimateTokenCount(text) {
  return Math.ceil(text.length * 1.25);
}

/**
 * @function analyzeInput
 * @description Analyzes input size and provides recommendations
 * @param {string} context - User input context
 * @returns {{charCount: number, tokenEstimate: number, needsOptimization: boolean, level: string}}
 */
export function analyzeInput(context) {
  const charCount = context.length;
  const tokenEstimate = estimateTokenCount(context);

  let level = 'safe';
  let needsOptimization = false;

  if (charCount > MAX_CHARS_ABSOLUTE) {
    level = 'critical';
    needsOptimization = true;
  } else if (charCount > MAX_CHARS_SAFE) {
    level = 'warning';
    needsOptimization = true;
  } else if (charCount > MAX_CHARS_WARNING) {
    level = 'caution';
  }

  return {
    charCount,
    tokenEstimate,
    needsOptimization,
    level,
  };
}

/**
 * @function extractCodeBlocks
 * @description Extracts code blocks from markdown text
 * @param {string} text - Input text with potential code blocks
 * @returns {{blocks: Array<{language: string, code: string, start: number, end: number}>, textWithoutCode: string}}
 */
function extractCodeBlocks(text) {
  const blocks = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  let textWithoutCode = text;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2].trim(),
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  textWithoutCode = text.replace(codeBlockRegex, '[CODE_BLOCK_PLACEHOLDER]');

  return { blocks, textWithoutCode };
}

/**
 * @function summarizeCodeBlock
 * @description Intelligently summarizes a code block by keeping important parts
 * @param {string} code - Code to summarize
 * @param {number} maxLines - Maximum lines to keep
 * @returns {string} Summarized code
 */
function summarizeCodeBlock(code, maxLines = 20) {
  const lines = code.split('\n');

  if (lines.length <= maxLines) {
    return code;
  }

  const importantPatterns = [
    /^import\s/,
    /^from\s/,
    /^def\s/,
    /^class\s/,
    /^function\s/,
    /^const\s.*=.*=>/,
    /^export\s/,
    /SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER/i,
    /WHERE|JOIN|GROUP BY|ORDER BY/i,
  ];

  const scoredLines = lines.map((line, index) => {
    let score = 0;

    for (const pattern of importantPatterns) {
      if (pattern.test(line)) {
        score += 10;
      }
    }

    if (index < 5 || index >= lines.length - 5) {
      score += 5;
    }

    if (line.trim().length > 10 && line.trim().length < 100) {
      score += 2;
    }

    return { line, index, score };
  });

  scoredLines.sort((a, b) => b.score - a.score);

  const selectedLines = scoredLines
    .slice(0, maxLines)
    .sort((a, b) => a.index - b.index);

  const summarized = [];
  let lastIndex = -1;

  for (const { line, index } of selectedLines) {
    if (lastIndex !== -1 && index > lastIndex + 1) {
      summarized.push('// ... (lines omitted for brevity) ...');
    }
    summarized.push(line);
    lastIndex = index;
  }

  return summarized.join('\n');
}

/**
 * @function extractKeyInformation
 * @description Extracts key information patterns from text (task IDs, dates, metrics, etc.)
 * @param {string} text - Input text
 * @returns {string} Extracted key information
 */
function extractKeyInformation(text) {
  const keyPatterns = [
    /[A-Z]+-\d+/g,
    /TICKET-\d+/gi,
    /JIRA-\d+/gi,
    /\d{4}-\d{2}-\d{2}/g,
    /\d+(\.\d+)?\s*(ms|seconds|minutes|hours|MB|GB|TB|%)/gi,
    /(error|warning|critical|important|note|todo):\s*[^\n]+/gi,
    /^#+\s+.+$/gm,
  ];

  const extracted = [];

  for (const pattern of keyPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      extracted.push(...matches);
    }
  }

  return [...new Set(extracted)].join('\n');
}

/**
 * @function intelligentSummarize
 * @description Intelligently summarizes text by preserving structure and key information
 * @param {string} text - Text to summarize
 * @param {number} maxChars - Maximum characters in output
 * @returns {string} Summarized text
 */
function intelligentSummarize(text, maxChars) {
  const paragraphs = text.split(/\n\n+/);
  const sections = [];
  let currentSection = [];

  for (const para of paragraphs) {
    if (para.match(/^#+\s/) || para.match(/^[A-Z\s]{3,}:?\s*$/)) {
      if (currentSection.length > 0) {
        sections.push(currentSection.join('\n\n'));
        currentSection = [];
      }
      currentSection.push(para);
    } else {
      currentSection.push(para);
    }
  }

  if (currentSection.length > 0) {
    sections.push(currentSection.join('\n\n'));
  }

  const summarized = [];
  const charsPerSection = Math.floor(maxChars / Math.max(sections.length, 1));

  for (const section of sections) {
    if (section.length <= charsPerSection) {
      summarized.push(section);
    } else {
      const lines = section.split('\n');
      const header = lines.find(
        (l) => l.match(/^#+\s/) || l.match(/^[A-Z\s]{3,}:?\s*$/),
      );

      if (header) {
        summarized.push(header);
        const remaining = lines.filter((l) => l !== header).join('\n');
        summarized.push(
          remaining.substring(0, charsPerSection - header.length - 50) +
            '\n...(truncated)',
        );
      } else {
        summarized.push(
          section.substring(0, charsPerSection) + '\n...(truncated)',
        );
      }
    }
  }

  return summarized.join('\n\n');
}

/**
 * @function optimizeInput
 * @description Main optimization function that intelligently reduces input size while preserving key information
 * @param {string} context - Original context input
 * @param {('task'|'architecture'|'meeting')} mode - Documentation mode
 * @returns {{optimizedContext: string, wasOptimized: boolean, originalSize: number, optimizedSize: number, reductionPercent: number}}
 */
export function optimizeInput(context, mode = 'task') {
  const analysis = analyzeInput(context);

  if (!analysis.needsOptimization) {
    return {
      optimizedContext: context,
      wasOptimized: false,
      originalSize: analysis.charCount,
      optimizedSize: analysis.charCount,
      reductionPercent: 0,
    };
  }

  console.log(
    `[InputOptimizer] Input size: ${analysis.charCount} chars (~${analysis.tokenEstimate} tokens). Level: ${analysis.level}`,
  );
  console.log(`[InputOptimizer] Applying intelligent optimization...`);

  const targetSize = analysis.level === 'critical' ? 20000 : 25000;

  const { blocks: codeBlocks, textWithoutCode } = extractCodeBlocks(context);

  const keyInfo = extractKeyInformation(textWithoutCode);

  let summarizedText = intelligentSummarize(textWithoutCode, targetSize * 0.8);

  const summarizedCodeBlocks = codeBlocks.map((block) => {
    const maxLines = Math.ceil(50 * (targetSize / 25000));
    return {
      language: block.language,
      code: summarizeCodeBlock(block.code, maxLines),
    };
  });

  let optimized = `[AUTO-OPTIMIZED INPUT - Original: ${analysis.charCount} chars]\n\n`;
  optimized += `KEY INFORMATION EXTRACTED:\n${keyInfo}\n\n`;
  optimized += `CONTEXT:\n${summarizedText}\n\n`;

  if (summarizedCodeBlocks.length > 0) {
    optimized += `CODE ARTIFACTS:\n`;
    for (const block of summarizedCodeBlocks.slice(0, 3)) {
      optimized += `\`\`\`${block.language}\n${block.code}\n\`\`\`\n\n`;
    }

    if (summarizedCodeBlocks.length > 3) {
      optimized += `(${summarizedCodeBlocks.length - 3} additional code blocks omitted)\n`;
    }
  }

  const finalSize = optimized.length;
  const reduction = Math.round(
    ((analysis.charCount - finalSize) / analysis.charCount) * 100,
  );

  console.log(
    `[InputOptimizer] Optimization complete: ${finalSize} chars (${reduction}% reduction)`,
  );

  return {
    optimizedContext: optimized,
    wasOptimized: true,
    originalSize: analysis.charCount,
    optimizedSize: finalSize,
    reductionPercent: reduction,
  };
}
