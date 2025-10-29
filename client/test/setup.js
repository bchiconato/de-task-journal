/**
 * @fileoverview Vitest setup file for client tests - configures jest-dom and MSW
 */

import '@testing-library/jest-dom';
import { server } from './msw.js';
import { beforeAll, afterEach, afterAll } from 'vitest';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => server.resetHandlers());

afterAll(() => server.close());
