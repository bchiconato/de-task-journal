/**
 * @fileoverview Express application configuration - exports app for testing and production
 * @module server/app
 */

import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import routes from './routes.js';
import { errorHandler, notFound } from './middleware/errors.js';

const app = express();

app.use(express.json());
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  })
);

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
