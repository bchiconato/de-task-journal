/**
 * @fileoverview Express server entry point - imports app and starts listening
 * @module server
 */

import 'dotenv/config';
import app from './src/app.js';

const port = Number(process.env.PORT || 3001);

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
