module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    'vitest/globals': true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    'react',
    'react-hooks',
    'jsx-a11y',
    'vitest',
    '@typescript-eslint',
    'prettier',
    'jsdoc',
  ],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:vitest/recommended',
    'prettier',
    'plugin:prettier/recommended',
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
    'jsdoc/require-param': 'warn',
    'jsdoc/require-param-type': 'warn',
    'jsdoc/require-returns': 'warn',
    'jsdoc/require-returns-type': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['*.cjs'],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
};
