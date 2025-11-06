/**
 * @fileoverview Tests for Confluence API routes
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import request from 'supertest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import app from '../src/app.js';

const MOCK_CONFLUENCE_DOMAIN = 'test.atlassian.net';
const MOCK_CONFLUENCE_EMAIL = 'test@example.com';
const MOCK_CONFLUENCE_TOKEN = 'test-token';

const mockConfluenceServer = setupServer(
  http.get('https://test.atlassian.net/wiki/api/v2/pages', () => {
    return HttpResponse.json({
      results: [
        { id: 'page-1', title: 'Test Page 1', spaceId: 'SPACE1' },
        { id: 'page-2', title: 'Test Page 2', spaceId: 'SPACE2' },
      ],
      _links: {},
    });
  }),

  http.get(
    'https://test.atlassian.net/wiki/api/v2/pages/:pageId',
    ({ params }) => {
      return HttpResponse.json({
        id: params.pageId,
        title: 'Test Page',
        version: { number: 1 },
        body: {
          storage: {
            value: '<p>Existing content</p>',
          },
        },
      });
    },
  ),

  http.put(
    'https://test.atlassian.net/wiki/api/v2/pages/:pageId',
    async ({ request, params }) => {
      const body = await request.json();

      if (body.version.number !== 2) {
        return HttpResponse.json(
          { message: 'Version conflict' },
          { status: 409 },
        );
      }

      return HttpResponse.json({
        id: params.pageId,
        title: body.title,
        version: { number: 2 },
      });
    },
  ),
);

describe('Confluence API Routes', () => {
  beforeAll(() => {
    process.env.CONFLUENCE_DOMAIN = MOCK_CONFLUENCE_DOMAIN;
    process.env.CONFLUENCE_USER_EMAIL = MOCK_CONFLUENCE_EMAIL;
    process.env.CONFLUENCE_API_TOKEN = MOCK_CONFLUENCE_TOKEN;
    mockConfluenceServer.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    mockConfluenceServer.resetHandlers();
  });

  afterAll(() => {
    mockConfluenceServer.close();
    delete process.env.CONFLUENCE_DOMAIN;
    delete process.env.CONFLUENCE_USER_EMAIL;
    delete process.env.CONFLUENCE_API_TOKEN;
  });

  describe('GET /api/confluence/pages', () => {
    it('returns list of Confluence pages when authenticated', async () => {
      const response = await request(app)
        .get('/api/confluence/pages')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('pages');
      expect(response.body.pages).toBeInstanceOf(Array);
      expect(response.body.pages).toHaveLength(2);
      expect(response.body.pages[0]).toHaveProperty('id', 'page-1');
      expect(response.body.pages[0]).toHaveProperty('title', 'Test Page 1');
      expect(response.body.pages[0]).toHaveProperty('spaceKey', 'SPACE1');
    });

    it('returns 503 when Confluence is not configured', async () => {
      delete process.env.CONFLUENCE_API_TOKEN;

      const response = await request(app)
        .get('/api/confluence/pages')
        .expect(503);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'error',
        'confluence_not_configured',
      );

      process.env.CONFLUENCE_API_TOKEN = MOCK_CONFLUENCE_TOKEN;
    });

    it('returns error when Confluence API fails', async () => {
      mockConfluenceServer.use(
        http.get('https://test.atlassian.net/wiki/api/v2/pages', () => {
          return HttpResponse.json(
            { message: 'Internal Server Error' },
            { status: 500 },
          );
        }),
      );

      const response = await request(app)
        .get('/api/confluence/pages')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/confluence', () => {
    const validPayload = {
      content: '# Test Documentation\n\nThis is test content.',
      pageId: 'test-page-123',
      mode: 'task',
    };

    it('successfully sends documentation to Confluence page', async () => {
      const response = await request(app)
        .post('/api/confluence')
        .send(validPayload)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('platform', 'confluence');
      expect(response.body).toHaveProperty('docMode', 'task');
      expect(response.body).toHaveProperty('pageId', 'test-page-123');
      expect(response.body).toHaveProperty('version', 2);
    });

    it('adds architecture prefix for architecture mode', async () => {
      const response = await request(app)
        .post('/api/confluence')
        .send({
          ...validPayload,
          mode: 'architecture',
        })
        .expect(200);

      expect(response.body).toHaveProperty('docMode', 'architecture');
      expect(response.body).toHaveProperty('success', true);
    });

    it('adds meeting prefix for meeting mode', async () => {
      const response = await request(app)
        .post('/api/confluence')
        .send({
          ...validPayload,
          mode: 'meeting',
        })
        .expect(200);

      expect(response.body).toHaveProperty('docMode', 'meeting');
      expect(response.body).toHaveProperty('success', true);
    });

    it('returns 400 when content is missing', async () => {
      const response = await request(app)
        .post('/api/confluence')
        .send({
          pageId: 'test-page-123',
          mode: 'task',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('returns 400 when pageId is missing', async () => {
      const response = await request(app)
        .post('/api/confluence')
        .send({
          content: '# Test',
          mode: 'task',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('returns 400 when content is too short', async () => {
      const response = await request(app)
        .post('/api/confluence')
        .send({
          content: 'Short',
          pageId: 'test-page-123',
          mode: 'task',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('returns 503 when Confluence is not configured', async () => {
      delete process.env.CONFLUENCE_API_TOKEN;

      const response = await request(app)
        .post('/api/confluence')
        .send(validPayload)
        .expect(503);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'error',
        'confluence_not_configured',
      );

      process.env.CONFLUENCE_API_TOKEN = MOCK_CONFLUENCE_TOKEN;
    });

    it('handles Confluence API errors gracefully', async () => {
      mockConfluenceServer.use(
        http.get('https://test.atlassian.net/wiki/api/v2/pages/:pageId', () => {
          return HttpResponse.json(
            { message: 'Page not found' },
            { status: 404 },
          );
        }),
      );

      const response = await request(app)
        .post('/api/confluence')
        .send(validPayload)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });
});
