/**
 * @fileoverview LLM Router - Intelligently routes requests to best available provider
 * @module services/llmRouter
 */

import * as groqService from './groqService.js';
import * as geminiService from '../../services/geminiService.js';
import { optimizeInput, analyzeInput } from './inputOptimizer.js';
import { env } from '../config/index.js';

/**
 * @async
 * @function selectProvider
 * @description Selects the best LLM provider based on configuration and availability
 * @param {string} context - Input context
 * @returns {Promise<{provider: string, reason: string}>}
 */
async function selectProvider(context) {
  const analysis = analyzeInput(context);
  const hasGroq = !!env.GROQ_API_KEY;
  const hasGemini = !!env.GEMINI_API_KEY;

  if (!hasGroq && !hasGemini) {
    throw new Error('No LLM providers configured. Set GROQ_API_KEY or GEMINI_API_KEY in .env');
  }

  if (!hasGemini && hasGroq) {
    return { provider: 'groq', reason: 'Only Groq configured' };
  }

  if (!hasGroq && hasGemini) {
    return { provider: 'gemini', reason: 'Only Gemini configured' };
  }

  return {
    provider: 'groq',
    reason: `Groq selected as primary provider (input: ${analysis.charCount} chars)`,
  };
}

/**
 * @async
 * @function generateDocumentation
 * @description Main entry point - routes to appropriate LLM provider with fallback
 * @param {Object} input - The input data
 * @param {string} input.context - Context dump provided by the user
 * @param {('task'|'architecture'|'meeting')} [input.mode='task'] - Documentation mode
 * @returns {Promise<{documentation: string, provider: string, wasOptimized: boolean, metadata: Object}>}
 */
export async function generateDocumentation({ context, mode = 'task' }) {
  console.log(`[LLMRouter] Request received for ${mode} documentation`);
  console.log(`[LLMRouter] Input size: ${context.length} chars`);

  let optimization = { wasOptimized: false };
  let processedContext = context;

  const analysis = analyzeInput(context);
  
  if (analysis.needsOptimization) {
    optimization = optimizeInput(context, mode);
    processedContext = optimization.optimizedContext;

    if (optimization.wasOptimized) {
      console.log(`[LLMRouter] Input optimized: ${optimization.originalSize} → ${optimization.optimizedSize} chars (${optimization.reductionPercent}% reduction)`);
    }
  }

  const selection = await selectProvider(processedContext);
  console.log(`[LLMRouter] Selected provider: ${selection.provider}`);
  console.log(`[LLMRouter] Reason: ${selection.reason}`);

  try {
    let documentation;

    if (selection.provider === 'groq') {
      documentation = await groqService.generateDocumentation({
        context: processedContext,
        mode,
      });
    } else {
      documentation = await geminiService.generateDocumentation({
        context: processedContext,
        mode,
      });
    }

    return {
      documentation,
      provider: selection.provider,
      wasOptimized: optimization.wasOptimized,
      metadata: {
        originalSize: optimization.originalSize || context.length,
        processedSize: processedContext.length,
        reductionPercent: optimization.reductionPercent || 0,
        selectionReason: selection.reason,
      },
    };
  } catch (error) {
    console.error(`[LLMRouter] ${selection.provider} failed:`, error.message);

    const fallbackProvider = selection.provider === 'groq' ? 'gemini' : 'groq';
    const canFallback =
      fallbackProvider === 'gemini' ? !!env.GEMINI_API_KEY : !!env.GROQ_API_KEY;

    if (!canFallback) {
      throw error;
    }

    console.log(`[LLMRouter] Attempting fallback to ${fallbackProvider}...`);

    try {
      let documentation;

      if (fallbackProvider === 'groq') {
        documentation = await groqService.generateDocumentation({
          context: processedContext,
          mode,
        });
      } else {
        documentation = await geminiService.generateDocumentation({
          context: processedContext,
          mode,
        });
      }

      return {
        documentation,
        provider: fallbackProvider,
        wasOptimized: optimization.wasOptimized,
        metadata: {
          originalSize: optimization.originalSize || context.length,
          processedSize: processedContext.length,
          reductionPercent: optimization.reductionPercent || 0,
          selectionReason: `Fallback to ${fallbackProvider} after ${selection.provider} failure`,
          primaryError: error.message,
        },
      };
    } catch (fallbackError) {
      console.error(`[LLMRouter] Fallback to ${fallbackProvider} also failed:`, fallbackError.message);
      throw new Error(
        `All LLM providers failed. Primary (${selection.provider}): ${error.message}. Fallback (${fallbackProvider}): ${fallbackError.message}`,
      );
    }
  }
}