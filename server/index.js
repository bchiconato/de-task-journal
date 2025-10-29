/**
 * @fileoverview Express server entry point - configures middleware and routes for documentation generation API
 * @module server
 */

import { env } from './src/config/index.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { generateRouter } from './routes/generate.js';
import { notionRouter } from './routes/notion.js';
import { errorHandler } from './src/middleware/error.js';

const app = express();
const PORT = env.PORT;

app.use(helmet());
app.use(cors());
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(express.json({ limit: '300kb' }));

app.use('/api/generate', generateRouter);
app.use('/api/notion', notionRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
