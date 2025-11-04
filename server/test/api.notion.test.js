/**
 * @fileoverview API integration tests for POST /api/notion endpoint
 */

import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { validate } from '../src/middleware/validate.js';
import { NotionExportSchema } from '../src/schemas/notion.js';
import { errorHandler } from '../src/middleware/errors.js';
import { notionHandler } from '../routes/notion.js';
import * as notionClient from '../src/services/notion/client.js';
import * as notionMarkdown from '../src/services/notion/markdown.js';
import { env } from '../src/config/index.js';

const validator = validate(NotionExportSchema);

const originalEnv = { ...env };

const createMockRes = () => ({
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
});

const executeNotionRequest = async (body) => {
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
    await notionHandler(req, res, next);
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

describe('POST /api/notion', () => {
  it('returns 400 on empty payload', async () => {
    const { res } = await executeNotionRequest({});

    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when content is missing', async () => {
    const { res } = await executeNotionRequest({ pageId: 'test-page-id' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when neither pageId nor title is provided', async () => {
    const { res } = await executeNotionRequest({ content: '# Test content' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('accepts valid payload with pageId', async () => {
    env.NOTION_API_KEY = 'test';
    const appendSpy = vi
      .spyOn(notionClient, 'appendBlocksChunked')
      .mockResolvedValue({ blocksAdded: 5, chunks: 1 });
    vi.spyOn(notionMarkdown, 'markdownToNotionBlocks').mockReturnValue([
      { type: 'paragraph' },
    ]);

    const { res } = await executeNotionRequest({
      content: '# Test\n\nSome content',
      pageId: 'test-page-id',
    });

    expect(appendSpy).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true });
  });

  it('accepts valid payload with title', async () => {
    env.NOTION_API_KEY = 'test';
    env.NOTION_PAGE_ID = 'default-page';
    const appendSpy = vi
      .spyOn(notionClient, 'appendBlocksChunked')
      .mockResolvedValue({ blocksAdded: 3, chunks: 1 });
    vi.spyOn(notionMarkdown, 'markdownToNotionBlocks').mockReturnValue([
      { type: 'paragraph' },
    ]);

    const { res } = await executeNotionRequest({
      content: '# New Page\n\nContent for new page',
      title: 'Test Page',
    });

    expect(appendSpy).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true });
  });
});
