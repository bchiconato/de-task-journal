/**
 * @fileoverview Centralized route aggregator for API endpoints
 * @module src/routes
 */

import express from 'express';
import { generateRouter } from '../routes/generate.js';
import { notionRouter } from '../routes/notion.js';

const router = express.Router();

router.use('/generate', generateRouter);
router.use('/notion', notionRouter);

export default router;
