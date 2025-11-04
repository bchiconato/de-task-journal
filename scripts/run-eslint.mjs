#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import fs from 'node:fs';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');

const candidates = [
  resolve(projectRoot, 'client/node_modules/eslint/bin/eslint.js'),
  resolve(projectRoot, 'node_modules/eslint/bin/eslint.js'),
  resolve(projectRoot, 'server/node_modules/eslint/bin/eslint.js'),
];

const eslintBin = candidates.find((p) => fs.existsSync(p));

if (!eslintBin) {
  console.error('❌ Unable to find an ESLint binary. Please install dependencies.');
  process.exit(1);
}

const result = spawnSync(process.execPath, [eslintBin, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: process.cwd(),
});

process.exit(result.status ?? 0);
