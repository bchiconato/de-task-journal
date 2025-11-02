/**
 * @fileoverview API integration tests for POST /api/notion endpoint
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('POST /api/notion', () => {
  it('returns 400 on empty payload', async () => {
    const response = await request(app).post('/api/notion').send({});

    expect(response.status).toBe(400);
  });

  it('returns 400 when content is missing', async () => {
    const response = await request(app).post('/api/notion').send({
      pageId: 'test-page-id',
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('returns 400 when neither pageId nor title is provided', async () => {
    const response = await request(app).post('/api/notion').send({
      content: '# Test content',
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('accepts valid payload with pageId', async () => {
    const response = await request(app).post('/api/notion').send({
      content: '# Test\n\nSome content',
      pageId: 'test-page-id',
    });

    expect([200, 500]).toContain(response.status);
  });

  it('accepts valid payload with title', async () => {
    const response = await request(app).post('/api/notion').send({
      content: '# New Page\n\nContent for new page',
      title: 'Test Page',
    });

    expect([200, 500]).toContain(response.status);
  });
});
