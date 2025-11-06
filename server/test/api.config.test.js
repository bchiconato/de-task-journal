/**
 * @fileoverview Tests for config API route
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('GET /api/config', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns both platforms available when all credentials configured', async () => {
    process.env.NOTION_API_KEY = 'test-notion-key';
    process.env.CONFLUENCE_API_TOKEN = 'test-confluence-token';
    process.env.CONFLUENCE_DOMAIN = 'test.atlassian.net';
    process.env.CONFLUENCE_USER_EMAIL = 'test@example.com';

    const response = await request(app).get('/api/config').expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('platforms');
    expect(response.body.platforms).toEqual({
      notion: true,
      confluence: true,
    });
  });

  it('returns only notion available when only Notion configured', async () => {
    process.env.NOTION_API_KEY = 'test-notion-key';
    delete process.env.CONFLUENCE_API_TOKEN;
    delete process.env.CONFLUENCE_DOMAIN;
    delete process.env.CONFLUENCE_USER_EMAIL;

    const response = await request(app).get('/api/config').expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.platforms).toEqual({
      notion: true,
      confluence: false,
    });
  });

  it('returns only confluence available when only Confluence configured', async () => {
    delete process.env.NOTION_API_KEY;
    process.env.CONFLUENCE_API_TOKEN = 'test-confluence-token';
    process.env.CONFLUENCE_DOMAIN = 'test.atlassian.net';
    process.env.CONFLUENCE_USER_EMAIL = 'test@example.com';

    const response = await request(app).get('/api/config').expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.platforms).toEqual({
      notion: false,
      confluence: true,
    });
  });

  it('returns both platforms unavailable when no credentials configured', async () => {
    delete process.env.NOTION_API_KEY;
    delete process.env.CONFLUENCE_API_TOKEN;
    delete process.env.CONFLUENCE_DOMAIN;
    delete process.env.CONFLUENCE_USER_EMAIL;

    const response = await request(app).get('/api/config').expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.platforms).toEqual({
      notion: false,
      confluence: false,
    });
  });

  it('returns confluence false when domain is missing', async () => {
    process.env.CONFLUENCE_API_TOKEN = 'test-confluence-token';
    process.env.CONFLUENCE_USER_EMAIL = 'test@example.com';
    delete process.env.CONFLUENCE_DOMAIN;

    const response = await request(app).get('/api/config').expect(200);

    expect(response.body.platforms.confluence).toBe(false);
  });

  it('returns confluence false when email is missing', async () => {
    process.env.CONFLUENCE_API_TOKEN = 'test-confluence-token';
    process.env.CONFLUENCE_DOMAIN = 'test.atlassian.net';
    delete process.env.CONFLUENCE_USER_EMAIL;

    const response = await request(app).get('/api/config').expect(200);

    expect(response.body.platforms.confluence).toBe(false);
  });

  it('returns confluence false when token is missing', async () => {
    process.env.CONFLUENCE_DOMAIN = 'test.atlassian.net';
    process.env.CONFLUENCE_USER_EMAIL = 'test@example.com';
    delete process.env.CONFLUENCE_API_TOKEN;

    const response = await request(app).get('/api/config').expect(200);

    expect(response.body.platforms.confluence).toBe(false);
  });
});
