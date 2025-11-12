/**
 * @fileoverview API integration tests for POST /api/generate endpoint
 */

import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { validate } from '../src/middleware/validate.js';
import { GenerateSchema } from '../src/schemas/generate.js';
import { errorHandler } from '../src/middleware/errors.js';
import { generateDocsHandler } from '../routes/generate.js';
import * as geminiService from '../src/services/geminiService.js';
import { env } from '../src/config/index.js';

const validator = validate(GenerateSchema);

const originalEnv = { ...env };

const createMockRes = () => {
  return {
    statusCode: 200,
    body: undefined,
    finished: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      this.finished = true;
      return this;
    },
  };
};

const executeGenerateRequest = async (body) => {
  const req = { body, valid: undefined };
  const res = createMockRes();
  const nextCalls = [];
  const next = (err) => {
    if (err) {
      nextCalls.push(err);
    }
  };

  await validator(req, res, next);

  if (!res.finished && res.statusCode === 200) {
    await generateDocsHandler(req, res, next);
  }

  if (!res.finished && nextCalls.length) {
    errorHandler(nextCalls[0], req, res, () => {});
  }

  return { res, error: nextCalls[0] };
};

beforeEach(() => {
  Object.assign(env, originalEnv);
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /api/generate', () => {
  it('returns 400 on empty payload', async () => {
    const { res } = await executeGenerateRequest({});

    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when context is too short', async () => {
    const { res } = await executeGenerateRequest({ context: 'short' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when context is missing', async () => {
    const { res } = await executeGenerateRequest({
      code: 'console.log("test")',
    });

    expect(res.statusCode).toBe(400);
  });

  it('returns 200 on valid payload with mocked Gemini response', async () => {
    env.GEMINI_API_KEY = 'test-key';
    const docSpy = vi
      .spyOn(geminiService, 'generateDocumentation')
      .mockResolvedValue('# Summary\n\nGenerated documentation.');

    const { res } = await executeGenerateRequest({
      context: 'This is a valid context with enough characters.',
    });

    expect(docSpy).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('documentation');
    expect(res.body.documentation).toContain('Summary');
  });

  it('handles Gemini API errors gracefully', async () => {
    env.GEMINI_API_KEY = 'test-key';
    vi.spyOn(geminiService, 'generateDocumentation').mockRejectedValue(
      new Error('Gemini failure'),
    );

    const { res } = await executeGenerateRequest({
      context: 'Valid context for testing error handling.',
    });

    expect(res.statusCode).toBe(500);
    expect(res.body).toMatchObject({
      error: 'gemini_error',
    });
  });
});
