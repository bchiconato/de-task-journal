#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import fs from 'node:fs';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');

const args = process.argv.slice(2);
const cwdFlagIndex = args.indexOf('--cwd');
let cwd = process.cwd();
if (cwdFlagIndex !== -1) {
  const provided = args[cwdFlagIndex + 1];
  cwd = provided ? resolve(projectRoot, provided) : cwd;
  args.splice(cwdFlagIndex, 2);
}

const prettierCandidates = [
  resolve(projectRoot, 'client/node_modules/prettier/bin/prettier.cjs'),
  resolve(projectRoot, 'node_modules/prettier/bin/prettier.cjs'),
  resolve(projectRoot, 'server/node_modules/prettier/bin/prettier.cjs'),
];

const prettierBin = prettierCandidates.find((p) => fs.existsSync(p));

if (prettierBin) {
  const result = spawnSync(process.execPath, [prettierBin, ...args], {
    stdio: 'inherit',
    cwd,
  });
  process.exit(result.status ?? 0);
}

console.warn('⚠️ Prettier binary not found. Falling back to ESLint for formatting.');

const eslintCandidates = [
  resolve(projectRoot, 'client/node_modules/eslint/bin/eslint.js'),
  resolve(projectRoot, 'node_modules/eslint/bin/eslint.js'),
  resolve(projectRoot, 'server/node_modules/eslint/bin/eslint.js'),
];

const eslintBin = eslintCandidates.find((p) => fs.existsSync(p));

if (!eslintBin) {
  console.error('❌ Neither Prettier nor ESLint could be located.');
  process.exit(1);
}

const checkMode = args.includes('--check');
const eslintArgs = ['.', '--ext', '.js,.jsx,.ts,.tsx'];
if (checkMode) {
  const result = spawnSync(process.execPath, [eslintBin, ...eslintArgs, '--max-warnings=0'], {
    stdio: 'inherit',
    cwd,
  });
  process.exit(result.status ?? 0);
}

const result = spawnSync(process.execPath, [eslintBin, ...eslintArgs, '--fix'], {
  stdio: 'inherit',
  cwd,
});

process.exit(result.status ?? 0);
