# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. Claude automatically loads `CLAUDE.md` into context at the start of a coding session. Treat every rule here as **non‑negotiable**.

---

## Project Overview

Data Engineering Task Documenter — A full‑stack app that generates English technical documentation for data engineering tasks using Google Gemini AI and sends it to Notion with automatic block chunking.

---

## Development Commands

### Running the Application

Both services must run concurrently in separate terminals:

```bash
# Terminal 1 - Backend (port 3001)
cd server
npm run dev

# Terminal 2 - Frontend (port 5173)
cd client
npm run dev
```

### Building for Production

```bash
cd client
npm run build  # Output: client/dist/
```

### Installing Dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd client
npm install
```

---

## Architecture

### Two‑Tier Architecture

**Backend (Express)** → **Frontend (React)**

* Backend runs on port 3001, exposes `/api/generate` and `/api/notion`
* Frontend runs on port 5173, makes fetch calls to backend
* All API keys stay server‑side only

### Critical Data Flow

1. **User Input** → `InputForm.jsx` collects context/code/challenges (any language)
2. **Generate Request** → `client/utils/api.js` → `POST /api/generate`
3. **Gemini Service** → `server/services/geminiService.js` calls Google Gemini REST API
4. **Response** → Markdown docs in English (5 sections)
5. **Display** → `GeneratedContent.jsx` shows docs with copy/send buttons
6. **Send to Notion** → `POST /api/notion` → `notionService.js` with chunking

### Key Service Responsibilities

**`geminiService.js`**

* Direct REST API calls to Google Gemini (no SDK)
* Uses system instructions to generate English output (accepts input in any language)
* Constructs prompts with 5‑section structure
* Model configurable via `GEMINI_MODEL` env var (default: `gemini-2.0-flash-exp`)

**`notionService.js`**

* Converts Markdown → Notion block JSON (NOT raw markdown)
* **Critical**: Automatically chunks documents into ≤100 blocks per request
* Sends chunks sequentially with 100ms delays to avoid rate limits
* Truncates text to 2000 chars per block (Notion limit)
* Maps code languages (python, sql, js, etc.)
* **Inline Formatting**: Parses `**bold**`, `*italic*`, `` `code` ``, `~~strikethrough~~` into Notion rich text annotations
* **Lazy Client**: Creates Notion Client instance at runtime (not module‑level) to ensure env vars are loaded
* **Code Block Handling**: Detects ``` with whitespace tolerance using `trim()` for robust parsing

### Environment Configuration

#### Server Environment Variables

**Required Environment Variables** (`.env` in server folder):

```
GEMINI_API_KEY=        # From https://aistudio.google.com/app/apikey
GEMINI_MODEL=gemini-2.0-flash-exp
NOTION_API_KEY=        # From https://notion.so/my-integrations
NOTION_PAGE_ID=        # Target Notion page UUID
PORT=3001
NODE_ENV=development
```

**Important**:

* `.env` is loaded by `server/src/config/index.js` which is imported first in the application
* Configuration module validates all required variables and exits with clear error messages if validation fails
* All services use the centralized config module (`import { env } from './src/config/index.js'`)

#### Client Environment Variables

**Required Environment Variables** (`.env` in client folder):

```
VITE_API_BASE_URL=http://localhost:3001/api
```

**Important**:

* Client variables MUST be prefixed with `VITE_` to be exposed by Vite
* These variables are loaded at build time and exposed to the browser
* Never put secrets in client environment variables - they are publicly visible
* Client defaults to `http://localhost:3001/api` if `VITE_API_BASE_URL` is not set

---

## Generated Documentation Structure

All Gemini responses MUST include these 5 sections in English:

1. **Summary** — 1-2 sentences summarizing the task and its purpose
2. **Problem Solved** — Description of the business or technical problem
3. **Solution Implemented** — Technical approach and key implementation decisions
4. **Code Highlights** — Brief explanation of code snippet with inferred language
5. **Challenges & Learnings** — Main obstacles or insights as bullet points

This structure is enforced via the `buildPrompt()` function in `geminiService.js`. The system accepts input in any language but always outputs in English.

---

## Markdown to Notion Conversion

### Inline Formatting Support

The `parseInlineMarkdown()` function in `server/services/notionService.js` converts markdown inline formatting to Notion rich text annotations:

| Markdown             | Notion Annotation | Example           | Status |
| -------------------- | ----------------- | ----------------- | ------ |
| `**text**`           | Bold              | **bold text**     | ✅ Implemented |
| `__text__`           | Bold              | **bold text**     | ✅ Implemented |
| `*text*`             | Italic            | *italic text*     | ✅ Implemented |
| `_text_`             | Italic            | *italic text*     | ✅ Implemented |
| `` `text` ``         | Code              | `inline code`     | ✅ Implemented |
| `[text](url)`        | Link              | [link text](url)  | ✅ Implemented |

**Implementation**:
- Regex‑based parser that finds earliest match among all patterns
- Splits text into rich_text segments with appropriate annotations
- Automatically respects 2000-char limit per rich_text object
- Handles consecutive and multiple formatting types
- Exported for testing: `export { parseInlineMarkdown }`

**Note**: Strikethrough (`~~text~~`) is supported in preview via ReactMarkdown but not yet implemented in Notion API translation.

### Block Types Supported

* Headings: `#`, `##`, `###` (H1, H2, H3)
* Code blocks: ``` with language detection (python, sql, js, etc.)
* Lists: `- ` or `* ` (bulleted), `1. ` (numbered)
* Paragraphs: All other text

**Critical**: All block types use `parseInlineMarkdown()` for rich text, ensuring consistent formatting across headings, paragraphs, and lists.

### Code Block Detection

Code blocks use whitespace‑tolerant detection:

````javascript
line.trim().startsWith('```')  // Opening
lines[i].trim().startsWith('```')  // Closing
````

This handles indented code blocks in nested contexts (e.g., within lists or quotes) without breaking parsing.

---

## Notion Block Chunking

**Why**: Notion API has a hard limit of 100 blocks per `blocks.children.append` request.

**How**: `notionService.js` implements:

* `chunkBlocks(blocks, maxSize)` — splits array into chunks of ≤100
* Sequential sending with `delay(100)` between chunks
* Returns `{ blocksAdded, chunks }` in response

**When to modify**: If adding new Markdown patterns (e.g., tables, callouts), update `markdownToNotionBlocks()` and ensure chunking still works.

---

## API Integration Points

### Gemini API

* Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
* Auth: API key in query param (`?key=...`)
* Free tier: 15 RPM, 1500 RPD, 1M TPM
* System instructions force Portuguese output

### Notion API

* Uses `@notionhq/client` SDK
* Endpoint: `notion.blocks.children.append()`
* Auth: Bearer token in client initialization
* Must share page with integration before first use

---

## Common Pitfalls

1. **Notion "unauthorized" errors**:

   * Page not shared with integration. User must invite integration in Notion UI.
   * **OR** Environment variables not loaded before client initialization. Ensure `dotenv.config()` is the FIRST import in `server/index.js`.
2. **100‑block limit**: If adding new block types, always test with >100 block documents to verify chunking works.
3. **English output**: If Gemini returns output in the wrong language, check:

   * `systemInstruction` is being sent in API call
   * Model supports system instructions (`gemini-2.0-flash-exp` does)
   * Prompt explicitly states "Output MUST be 100% in ENGLISH"
4. **CORS errors**: Backend must run on port 3001. Frontend hardcodes `http://localhost:3001/api` in `client/utils/api.js`.
5. **Environment variables loading order**:

   * Backend loads `.env` from server folder (`server/.env`)
   * `dotenv.config()` MUST be called before any other imports, otherwise services will initialize with undefined env vars
   * Notion Client is created lazily inside `sendToNotion()` to ensure env vars are loaded
6. **Markdown formatting not appearing in Notion**:

   * Inline markdown is parsed by `parseInlineMarkdown()`
   * Code blocks use whitespace‑tolerant detection with `trim()`
   * If formatting breaks, ensure all block types call `parseInlineMarkdown()`

---

## State Management

Frontend uses React `useState` hooks in `App.jsx`:

* `documentation` — generated markdown string
* `isGenerating` — loading state for Gemini API
* `isSending` — loading state for Notion API
* `error` — error message string

No global state management (Redux, Context) — single‑component state is sufficient.

---

## Testing Approach

### Automated Tests

**Unit tests** are implemented using Vitest in `server/services/notionService.test.js`:

Run tests:
```bash
cd server
npm test              # Run all tests once
npm run test:watch    # Run tests in watch mode
```

**Test Coverage**:
- `parseInlineMarkdown()`: 23 tests covering bold, italic, code, links, edge cases
- `markdownToNotionBlocks()`: 10 integration tests covering complete document structures
- All 33 tests passing

### Manual Integration Testing

Required for end-to-end validation:

1. **Basic generation**: Context only → verify 5 sections in English
2. **With code**: Add code snippet → verify formatted in docs with language inference
3. **Inline formatting**: Use **bold**, *italic*, `code`, [links](url) in input → verify they appear formatted in Notion
4. **Notion send**: Click "Send to Notion" → check server logs for chunking
5. **Large docs**: Long context + code → verify >100 blocks get chunked
6. **Multi-language input**: Test with input in different languages → verify English output

Check server console for:

```
Generated X Notion blocks
Sending Y chunks to Notion
Sending chunk 1/Y (100 blocks)
```

**Critical validation**: Open the Notion page and verify:
- Bold text appears **bold**
- Italic text appears *italic*
- Inline code has `code styling`
- Links are clickable and lead to correct URLs
- Headings, lists, and code blocks preserve their structure

---

## Key Files to Modify

**Add new AI providers**: Create new service in `server/services/`, update `server/routes/generate.js` import

**Change documentation structure**: Modify `buildPrompt()` in `geminiService.js`

**Add Notion block types**: Update `markdownToNotionBlocks()` in `notionService.js`

**Add inline markdown patterns**: Update `parseInlineMarkdown()` function in `notionService.js` — add new regex patterns to the `patterns` array

**Change UI**: React components in `client/src/components/`

**Update API base URL**: `client/src/utils/api.js` line 1

---

## Important Implementation Notes

### Environment Variable Loading

`server/index.js` structure:

```javascript
import dotenv from 'dotenv';

// Load BEFORE other imports
dotenv.config({ path: '../.env' });

import express from 'express';
// ... other imports
```

### Notion Client Initialization

`notionService.js` creates client lazily:

```javascript
export async function sendToNotion(content, pageId = process.env.NOTION_PAGE_ID) {
  // Create client at runtime, not module‑level
  const notion = new Client({
    auth: process.env.NOTION_API_KEY,
  });
  // ... rest of function
}
```

This ensures environment variables are loaded before the Notion SDK accesses them.

---

## Development Shortcuts (Makefile)

> **Claude Code**: always prefer using the `Makefile` targets to install, run, and clean the project.

```bash
# Install everything (backend + frontend)
make install

# Runs backend and frontend together (hot reload)
make dev

# Run isolated services
make backend
make frontend

# Frontend production build
make build

# Clean up dependencies and artifacts
make clean
```

(The targets above are defined in the `Makefile` with `dev`, `backend`, `frontend`, `install(-backend/-frontend)`, `build`, and `clean`.)

---

## Additional HTTP Endpoints

Besides `/api/generate` and `/api/notion`, the backend exposes a **health check**:

  * `GET /health` → returns `{ status: "ok" }` for readiness check.

Routes mounted in `server/index.js`:

  * `app.use('/api/generate', generateRouter)`
  * `app.use('/api/notion', notionRouter)`

---

## ESLint (client)

This codebase applies an important rule on the client:

  * `'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }]` → allows **UPPER_SNAKE_CASE** constants without flagging an unused variable. Adjust constant names to this pattern when necessary.

---

## Client Base URL

Frontend calls use a local constant:

```js
// client/src/utils/api.js
const API_BASE_URL = 'http://localhost:3001/api';
```

If the backend endpoint changes, update this value on the client.

---

## Python (optional)

The repository contains an independent Python module (`main.py` and `pyproject.toml`). If used, ensure **Python >= 3.12** and install the dependencies (e.g., `pathspec`). There is no direct integration with the Node server at the moment.

---

# Repository‑Wide Guardrails & Code Style (English)

> **Audience:** Claude Code (claude.ai/code). **Obey all rules below when reading, editing, or generating code in this repo.**

## 1. Comment & Documentation Policy

* **Never** introduce or modify inline code comments such as `// ...` or `/* ... */`. **Zero** explanatory comments in code.
* The **only** allowed in‑code documentation is a structured **docstring block** placed immediately above a declaration using **JSDoc/TSDoc** syntax (`/** ... */`).
* Docstrings must document public surfaces (modules, React components, hooks, functions, classes, Express routes, middlewares). Avoid narrative or speculative prose.
* Keep docstrings concise and precise. Prefer examples over paragraphs.

### Required docstring tags (use as appropriate)

* `@fileoverview` — file‑level overview and ownership/contact.
* `@module` or `@packageDocumentation` (TS) — module purpose.
* `@component` — React components.
* `@param`, `@returns`, `@throws`, `@example`, `@async`.
* `@typedef` / `@template` (for shapes and generics) or TypeScript types.

> Use **JSDoc** for JavaScript files and **TSDoc** for TypeScript. Prefer TypeScript types when available; otherwise annotate with JSDoc types.

## 2. Clean Code & Design Principles

* Favor **small, single‑purpose** functions and components.
* Apply **SOLID** principles pragmatically; prefer composition over inheritance.
* Eliminate dead code; avoid global mutable state; keep functions **pure** where possible.
* Naming: *PascalCase* for components/classes, *camelCase* for variables/functions, *UPPER_SNAKE_CASE* for constants and env var keys.

## 3. React (Vite) Standards

* **Function components only.** No class components.
* Obey the **Rules of Hooks** (call hooks at the top level; don’t call inside loops/conditions; only call from React components or custom hooks). Name custom hooks `useX`.
* **File layout:** one component per file in `client/src/components/`; colocate tests as `ComponentName.test.jsx`.
* **Props & state:** prefer controlled components; derive state when possible; compute expensive values with `useMemo` and stable callbacks via `useCallback` where beneficial.
* **Effects:** include complete dependency arrays; avoid side effects in render; use cleanup functions.
* **Exports:** prefer **named exports** to enable tree‑shaking and consistent imports.
* **Vite specifics:**

  * Use Node.js **20.19+** or **22.12+** (per Vite requirements).
  * Respect required Node version and Vite’s build commands.
  * Use `import.meta.env` for client‑side env values (never expose secrets).
  * Keep `index.html` as the entry; assets served from `client/public/`.

## 4. Tailwind CSS

* Use the **official Prettier plugin for Tailwind CSS** to auto‑sort classes. Do not hand‑sort.
* Prefer **theme tokens** (colors, spacing, breakpoints) over arbitrary values. Only use `[]` arbitrary values when no token exists and add a TODO to promote to a token later.
* Extract repeated utility patterns with componentization or `@apply` (for small, stable patterns) instead of duplicating class lists.
* Keep class strings readable and minimal; avoid conflicting utilities.

## 5. Prism.js (Syntax Highlighting)

* Render code blocks with a `language-<lang>` class.
* After content updates that inject code snippets, re‑highlight using Prism’s API (e.g., `Prism.highlightAll()` or `highlightAllUnder(container)` in a React effect).
* For dynamic languages, use the **Autoloader** plugin to lazy‑load grammars. Avoid bundling all languages.

## 6. Node.js & Express (Backend)

* **Routing:** use `express.Router()` to keep routes modular; group by feature; no logic in route files beyond wiring.
* **Middleware:** compose small middlewares. Provide a terminal **error‑handling middleware** with signature `(err, req, res, next)` after all routes.
* **Security:** enable TLS at the edge; use **Helmet**; validate inputs; set secure cookie flags; never trust user input.
* **Performance:** enable gzip/deflate; avoid synchronous calls in the hot path; centralize structured logging; set `NODE_ENV=production` in prod.
* **Config:** read configuration via environment variables; never commit secrets; load `.env` early at process start.

## 7. Formatting & Linting

* **Prettier** formats codebase. **Do not** manually reflow code or classes.
* ESLint with recommended rules plus React and JSX a11y plugins. Fix all lint errors; no `eslint-disable` unless justified at file top with a docstring rationale.
* Tailwind Prettier plugin enforces canonical class order.

## 8. Required Docstring Templates (copy‑paste)

> Replace placeholder text — **do not** add extra inline comments.

**React component**

```js
/**
 * @fileoverview <One sentence purpose of this file>
 * @component <ComponentName>
 * @example
 *   <ComponentName propA="value" />
 * @param {string} props.propA - <what it does>
 * @returns {JSX.Element}
 */
export function ComponentName(props) { /* implementation */ }
```

**Custom hook**

```js
/**
 * @function useFeature
 * @description <Short description>
 * @param {number} intervalMs - Polling interval in milliseconds.
 * @returns {{data: any, isLoading: boolean, error: Error|null}}
 */
export function useFeature(intervalMs) { /* implementation */ }
```

**Express route handler**

```js
/**
 * @async
 * @function generateDocsHandler
 * @description Handles POST /api/generate.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
async function generateDocsHandler(req, res, next) { /* implementation */ }
```

**Service function**

```js
/**
 * @async
 * @function callGemini
 * @description Calls Google Gemini REST API.
 * @param {string} model
 * @param {object} payload
 * @returns {Promise<object>} JSON response
 * @throws {Error} When the upstream API responds with a non‑2xx status.
 */
export async function callGemini(model, payload) { /* implementation */ }
```

## 9. Prohibited Actions (Claude Code)

* Do **not** insert `//` or `/* */` comments anywhere.
* Do **not** remove or rewrite existing docstrings unless they are incorrect.
* Do **not** expose secrets or move server‑only values to the client.
* Do **not** change public APIs without updating corresponding docstrings and usage sites in the same change.

## 10. Quick Checks Before Submitting Changes

* ✅ All new/changed declarations have proper docstrings.
* ✅ No inline comments were added.
* ✅ Lint and Prettier pass locally.
* ✅ React hooks follow the rules; effects have correct deps.
* ✅ Tailwind classes are auto‑sorted and extracted when repetitive.
* ✅ Prism highlighting still works after UI changes.
* ✅ Express error handler remains last in the middleware chain.
