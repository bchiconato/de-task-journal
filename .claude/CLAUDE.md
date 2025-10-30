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

**Documentation Generation Flow:**

1. **User Input** → `InputForm.jsx` collects context/code/challenges (any language)
2. **Generate Request** → `client/src/utils/api.js` → `POST /api/generate`
3. **Request Validation** → `validate(GenerateSchema)` middleware validates request body
4. **Route Handler** → `server/routes/generate.js` processes validated request
5. **Gemini Service** → `server/services/geminiService.js` calls Google Gemini REST API
   * Uses `fetchWithRetry()` from `server/src/lib/http.js` for resilient calls
6. **Response** → Markdown docs in English (5 sections)
7. **Display** → `GeneratedContent.jsx` renders markdown with copy/send buttons

**Notion Export Flow:**

8. **Send to Notion** → User clicks "Send to Notion" → `POST /api/notion`
9. **Request Validation** → `validate(NotionExportSchema)` middleware validates content & pageId
10. **Route Handler** → `server/routes/notion.js` processes validated request
11. **Markdown Conversion** → `markdownToNotionBlocks()` from `server/src/services/notion/markdown.js`
    * Parses inline formatting via `parseInlineMarkdown()`
    * Converts markdown to Notion block JSON structures
12. **Block Append** → `appendBlocksChunked()` from `server/src/services/notion/client.js`
    * Automatically chunks documents into ≤100 blocks per request
    * Sends chunks sequentially with 350ms throttle between requests
    * Uses `notionCall()` retry wrapper for 429/5xx errors

### Key Service Responsibilities

**`geminiService.js`**

* Direct REST API calls to Google Gemini (no SDK)
* Uses system instructions to generate English output (accepts input in any language)
* Constructs prompts with 5‑section structure
* Model configurable via `GEMINI_MODEL` env var (default: `gemini-2.0-flash-exp`)

**Notion Service** (`server/src/services/notion/`)

The Notion integration is organized as a **modular service** with 7 specialized files:

* **`markdown.js`** — Core markdown‑to‑Notion conversion
  * `markdownToNotionBlocks(markdown)` converts markdown to Notion block JSON
  * `parseInlineMarkdown(text)` parses inline formatting (**bold**, *italic*, `code`, links)
  * Supports headings, code blocks, lists, paragraphs, quotes, dividers
  * Detects ``` with whitespace tolerance using `trim()` for robust parsing
  * Truncates text to 2000 chars per block (Notion limit)
  * Maps code languages (python, sql, js, etc.)

* **`client.js`** — Notion API operations
  * `createPage()` creates new Notion pages with initial blocks
  * `appendBlocksChunked()` appends blocks with automatic chunking (≤100 blocks/request)
  * `checkPageAccess()` validates page permissions before operations

* **`index.js`** — Core client and retry logic
  * Exports Notion client instance (module‑level initialization)
  * `notionCall(fn, attempts)` wraps API calls with retry logic for 429/5xx errors
  * `chunkBlocks(blocks, size)` utility for splitting block arrays

* **`config.js`** — Centralized constants
  * `MAX_BLOCKS_PER_REQUEST = 100`, `MAX_TEXT_LENGTH = 2000`, `RPS_THROTTLE_MS = 350`
  * `defaultHeaders(token)` function for API headers

* **`exportPage.js`** — Page export functionality
* **`paginate.js`** — Pagination utilities for list operations
* **`throttle.js`** — Rate limiting utilities (350ms throttle between requests)

### Server Application Structure

The backend follows a clean, layered architecture for maintainability and testability:

**`server/index.js`** — Application entry point
* Loads environment variables via `import 'dotenv/config'`
* Imports and starts the Express app from `server/src/app.js`
* Minimal code: just loads config and starts HTTP server

**`server/src/app.js`** — Express application configuration
* Exports configured Express app (enables testing without starting server)
* Applies security middleware (Helmet with CSP disabled for development)
* Configures rate limiting (100 requests per 15 minutes per IP)
* Sets up CORS, JSON parsing, and static file serving
* Mounts all API routes via `server/src/routes.js`
* Adds terminal error‑handling middleware (`notFound`, `errorHandler`)

**`server/src/routes.js`** — Centralized route aggregator
* Imports and mounts all API route modules under `/api`
* Routes: `/api/generate` (generateRouter), `/api/notion` (notionRouter)
* Clean separation: all route wiring in one place

### Middleware Layer

**`server/src/middleware/errors.js`** — Error handling middleware

* `notFound(req, res, next)` — Catches 404 errors for undefined routes
* `errorHandler(err, req, res, next)` — Terminal error handler with signature `(err, req, res, next)`
  * Logs errors to console in development
  * Returns JSON error responses with appropriate status codes
  * Sanitizes error messages in production
  * **Must be registered last** in the middleware chain (after all routes)

**`server/src/middleware/validate.js`** — Request validation middleware

* `validate(schema)` — Higher‑order function that returns validation middleware
* Accepts Zod schemas for request validation
* Validates `req.body` against provided schema
* Returns 400 Bad Request with detailed error messages on validation failure
* Used in route definitions: `router.post('/path', validate(MySchema), handler)`

### Request Schema Validation

The API uses **Zod** for type‑safe request validation. Schemas define expected request shapes and are enforced via the `validate()` middleware.

**`server/src/schemas/generate.js`** — Generate endpoint schema

* `GenerateSchema` — Validates `POST /api/generate` requests
* Required fields: `context` (string, 10-5000 chars)
* Optional fields: `code` (string, max 10000 chars), `challenges` (string, max 2000 chars)
* Returns detailed validation errors for invalid requests

**`server/src/schemas/notion.js`** — Notion endpoint schema

* `NotionExportSchema` — Validates `POST /api/notion` requests
* Required fields: `content` (string, 100-50000 chars), `pageId` (string, 32 chars, UUID format)
* Ensures content and page ID meet Notion API requirements

**Usage in routes**:
```javascript
import { validate } from '../src/middleware/validate.js';
import { GenerateSchema } from '../src/schemas/generate.js';

router.post('/generate', validate(GenerateSchema), generateHandler);
```

### HTTP Utilities

**`server/src/lib/http.js`** — Resilient HTTP client utilities

* `fetchWithRetry(url, options, config)` — Enhanced fetch with retry logic and timeout
  * **Timeout**: Default 30s (configurable via `config.timeout`)
  * **Retries**: Default 3 attempts (configurable via `config.retries`)
  * **Exponential backoff**: Delay doubles after each retry (1s, 2s, 4s...)
  * **Status code handling**: Retries on 429 (rate limit) and 5xx (server errors)
  * **AbortController**: Implements request timeout cancellation
  * Used by both Gemini and Notion services for reliable external API calls

**Usage**:
```javascript
import { fetchWithRetry } from '../lib/http.js';

const response = await fetchWithRetry(url, {
  method: 'POST',
  body: JSON.stringify(data),
}, {
  timeout: 60000,  // 60s
  retries: 5
});
```

### Client Application Structure

The frontend follows React best practices with reusable components, custom hooks, and centralized state management.

**React Components** (`client/src/components/`)

Core UI components:
* **`InputForm.jsx`** — Main form for collecting task documentation inputs
  * Three text areas: context (required), code (optional), challenges (optional)
  * Character counters for each field
  * Collapsible on mobile for better UX after generation

* **`GeneratedContent.jsx`** — Displays generated markdown documentation
  * Renders markdown with syntax highlighting (react-markdown + Prism.js)
  * Copy to clipboard button
  * Send to Notion button
  * Accessible with ARIA labels

* **`CodeImplementationEditor.jsx`** — Code input with syntax highlighting
  * Uses `@uiw/react-textarea-code-editor`
  * Supports multiple languages (jsx, python, sql, etc.)
  * Dark theme matching application style

Support components:
* **`AppErrorBoundary.jsx`** — React error boundary for graceful error handling
* **`ErrorMessage.jsx`** — Consistent error message display
* **`LoadingSpinner.jsx`** — Accessible loading indicator with ARIA live region
* **`CharacterCounter.jsx`** — Character count display with max limits
* **`FormField.jsx`** — Reusable form input wrapper with labels
* **`Toast.jsx`** — Toast notification component (success, error, info)
* **`LiveAnnouncer.jsx`** — Accessibility live region for screen reader announcements

**State Management** (`client/src/App.jsx`)

Uses React `useState` hooks for application state:
* `documentation` — Generated markdown string
* `isGenerating` — Loading state for Gemini API
* `isSending` — Loading state for Notion API
* `error` — Error message string
* Toast notifications managed via `useToast()` hook

No global state management (Redux, Context) — component‑level state is sufficient for this application's scope.

**Custom Hooks** (`client/src/hooks/`)

* **`useToast.js`** — Toast notification management
  * Returns: `{ toasts, showToast, removeToast }`
  * `showToast(message, type)` — Shows toast (types: 'success', 'error', 'info')
  * Auto‑dismisses after 3 seconds
  * Stacks multiple toasts vertically
  * Accessible with ARIA live regions

* **`useAbortableRequest.js`** — Request cancellation with AbortController
  * Returns: `{ abortController, createAbortController, abortRequest }`
  * Creates new AbortController for each request
  * Cancels in‑flight requests when component unmounts or user cancels
  * Used in generate and send operations to prevent memory leaks
  * Integrates with fetch API's `signal` parameter

**Client Utilities** (`client/src/utils/`)

* **`api.js`** — API client functions
  * `generateDocumentation(data)` — Calls `POST /api/generate`
  * `sendToNotion(content, pageId)` — Calls `POST /api/notion`
  * Configurable API base via `VITE_API_BASE` env var
  * Returns JSON responses or throws on error

* **`validation.js`** — Client‑side form validation
  * Validates input lengths before API submission
  * Provides user‑friendly error messages
  * Prevents unnecessary API calls with invalid data

### Environment Configuration

#### Server Environment Variables

**Required Environment Variables** (`.env` in server folder):

```
GEMINI_API_KEY=        # From https://aistudio.google.com/app/apikey
GEMINI_MODEL=gemini-2.0-flash-exp
NOTION_API_KEY=        # From https://notion.so/my-integrations
NOTION_PAGE_ID=        # Target Notion page UUID
NOTION_PARENT_PAGE_ID= # Parent page UUID for creating new pages (optional)
PORT=3001
NODE_ENV=development
```

**Important**:

* `.env` is loaded by `server/src/config/index.js` using `dotenv/config`
* Configuration module uses **Zod schema validation** to validate all required variables
* Invalid or missing env vars trigger warnings (not hard exits) for flexibility
* All services use the centralized config module (`import { env } from './src/config/index.js'`)

#### Client Environment Variables

**Required Environment Variables** (`.env` in client folder):

```
VITE_API_BASE=/api                    # API base path (defaults to '/api' if not set)
VITE_NOTION_PAGE_ID=                   # Notion page UUID for direct linking (optional)
```

**Important**:

* Client variables MUST be prefixed with `VITE_` to be exposed by Vite
* These variables are loaded at build time and exposed to the browser
* Never put secrets in client environment variables - they are publicly visible
* `VITE_API_BASE` defaults to `/api` (relative path) if not set
* In development, proxy or CORS handles routing to backend on port 3001

---

## Key Dependencies

### Server Dependencies

**Production**:
* **express** (v5.1.0) — Web framework (note: Express 5, not 4)
* **@notionhq/client** (latest) — Official Notion SDK
* **dotenv** (latest) — Environment variable management
* **zod** (v4.1.12) — Schema validation and type safety
* **helmet** (v8.1.0) — Security middleware (CSP, XSS protection)
* **express-rate-limit** (v8.1.0) — Rate limiting middleware
* **cors** (latest) — Cross‑origin resource sharing

**Development**:
* **vitest** (v2.1.8) — Test runner with Vite integration
* **msw** (v2.11.6) — Mock Service Worker for API mocking in tests
* **supertest** (v7.1.4) — HTTP assertion library
* **@types/supertest** — TypeScript types for Supertest

### Client Dependencies

**Production**:
* **react** (latest) — UI library
* **react-dom** (latest) — React DOM renderer
* **@uiw/react-textarea-code-editor** (v2.1.0) — Code editor component
* **react-markdown** (v9.0.0) — Markdown renderer
* **react-syntax-highlighter** (v15.5.0) — Syntax highlighting
* **remark-gfm** (v4.0.0) — GitHub Flavored Markdown support

**Development**:
* **vite** (latest) — Build tool and dev server
* **@vitejs/plugin-react** (latest) — React plugin for Vite
* **tailwindcss** (latest) — Utility‑first CSS framework
* **@tailwindcss/typography** (v0.5.19) — Typography plugin
* **prettier** (latest) — Code formatter
* **prettier-plugin-tailwindcss** (latest) — Auto‑sorts Tailwind classes
* **eslint** (latest) — Linter with React and a11y plugins

**Important**: The project uses **Express 5** (v5.1.0), which has breaking changes from Express 4. Ensure middleware and patterns are compatible with Express 5.

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

The `parseInlineMarkdown()` function in `server/src/services/notion/markdown.js` converts markdown inline formatting to Notion rich text annotations:

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
* Quotes: `>` prefix for block quotes
* Dividers: `---` or `***` for horizontal rules

**Critical**: All block types use `parseInlineMarkdown()` for rich text, ensuring consistent formatting across headings, paragraphs, lists, and quotes.

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

**How**: Modular Notion service implements:

* `chunkBlocks(blocks, maxSize)` in `server/src/services/notion/index.js` — splits array into chunks of ≤100
* `appendBlocksChunked()` in `server/src/services/notion/client.js` — sends chunks sequentially
* 350ms throttle between requests (configured in `config.js`)
* Returns `{ blocksAdded, chunks }` in response

**When to modify**: If adding new Markdown patterns (e.g., tables, callouts), update `markdownToNotionBlocks()` in `server/src/services/notion/markdown.js` and ensure chunking still works.

---

## API Integration Points

### Gemini API

* Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
* Auth: API key in query param (`?key=...`)
* Free tier: 15 RPM, 1500 RPD, 1M TPM
* System instructions force English output (accepts input in any language)

### Notion API

* Uses `@notionhq/client` SDK
* Endpoint: `notion.blocks.children.append()`
* Auth: Bearer token in client initialization
* Must share page with integration before first use

---

## Common Pitfalls

1. **Notion "unauthorized" errors**:

   * Page not shared with integration. User must invite integration in Notion UI.
   * **OR** Environment variables not loaded before client initialization. Ensure `import 'dotenv/config'` is the **FIRST import** in `server/index.js`.
   * **OR** `NOTION_API_KEY` is invalid or expired. Generate new key at https://notion.so/my-integrations

2. **100‑block limit**: If adding new block types, always test with >100 block documents to verify chunking works.
   * Chunking logic is in `server/src/services/notion/client.js` (`appendBlocksChunked()`)
   * Verify `MAX_BLOCKS_PER_REQUEST = 100` constant in `config.js`

3. **English output**: If Gemini returns output in the wrong language, check:

   * `systemInstruction` is being sent in API call (see `server/services/geminiService.js`)
   * Model supports system instructions (`gemini-2.0-flash-exp` does)
   * Prompt explicitly states "Output MUST be 100% in ENGLISH"

4. **CORS errors**:
   * Backend must run on port 3001
   * Frontend uses `VITE_API_BASE` env var (defaults to `/api`)
   * In development, ensure Vite proxy is configured or CORS is enabled in `server/src/app.js`

5. **Environment variables loading order**:

   * Backend loads `.env` from server folder (`server/.env`)
   * `import 'dotenv/config'` MUST be the first import in `server/index.js`
   * `server/src/config/index.js` validates env vars using Zod schemas
   * Notion client is initialized at module‑level in `server/src/services/notion/index.js` (not lazy)

6. **Markdown formatting not appearing in Notion**:

   * Inline markdown is parsed by `parseInlineMarkdown()` in `server/src/services/notion/markdown.js`
   * Code blocks use whitespace‑tolerant detection with `trim()`
   * If formatting breaks, ensure all block types call `parseInlineMarkdown()`
   * Check Notion API limits: 2000 chars per rich_text object

7. **Request validation errors**:

   * All requests are validated via Zod schemas before processing
   * Check `server/src/schemas/generate.js` and `server/src/schemas/notion.js` for constraints
   * Client‑side validation in `client/src/utils/validation.js` should match server schemas

8. **Rate limiting**:

   * Gemini API: 15 RPM, 1500 RPD, 1M TPM (tokens per minute)
   * Notion API: 350ms throttle between requests (configured in `config.js`)
   * Both use `fetchWithRetry()` with exponential backoff for 429 errors

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

The project uses **Vitest** as the test runner with a monorepo configuration. Tests are organized by layer (unit, integration, snapshot).

**Test Configuration**:
* **Root** (`vitest.config.js`) — Monorepo configuration defining server and client projects
* **Server** (`server/vitest.config.js`) — Server‑specific test setup
* **Client** (`client/vitest.config.js`) — Client‑specific test setup (if applicable)

**Run tests**:
```bash
# From root (runs all tests in monorepo)
npm test
npm run test:watch
npm run test:coverage

# From server directory
cd server
npm test              # Run all tests once
npm run test:watch    # Run tests in watch mode
```

**Server Test Files** (`server/test/`):

* **`api.generate.test.js`** — Tests for `POST /api/generate` endpoint
  * Request validation (missing fields, invalid data)
  * Successful generation response
  * Error handling and status codes

* **`api.notion.test.js`** — Tests for `POST /api/notion` endpoint
  * Request validation (content, pageId formats)
  * Successful export to Notion
  * Error handling for API failures

* **`http.fetchWithRetry.test.js`** — Tests for HTTP retry utility
  * Timeout behavior
  * Retry logic on 429 and 5xx errors
  * Exponential backoff verification
  * AbortController integration

* **`notionService.snapshot.test.js`** — Snapshot tests for markdown conversion
  * `parseInlineMarkdown()`: 23+ tests covering bold, italic, code, links, edge cases
  * `markdownToNotionBlocks()`: 10+ integration tests for complete document structures
  * Ensures consistent Notion block output across changes

* **`setup.js`** — Test setup file
  * Configures MSW (Mock Service Worker) for API mocking
  * Sets up test environment variables
  * Global test utilities and helpers

**Testing Libraries**:
* **Vitest** (v2.1.8) — Fast test runner with Vite integration
* **MSW** (v2.11.6) — Mock Service Worker for API request mocking
* **Supertest** (v7.1.4) — HTTP assertion library for Express routes

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

### Backend Modifications

**Add new AI providers**:
* Create new service in `server/services/` (e.g., `claudeService.js`)
* Update `server/routes/generate.js` to import and use new service
* Add API key to `.env` and `server/src/config/index.js`

**Change documentation structure**:
* Modify `buildPrompt()` in `server/services/geminiService.js`
* Update system instructions for new output format

**Add Notion block types**:
* Update `markdownToNotionBlocks()` in `server/src/services/notion/markdown.js`
* Add new block type handlers (e.g., tables, callouts, toggles)

**Add inline markdown patterns**:
* Update `parseInlineMarkdown()` in `server/src/services/notion/markdown.js`
* Add new regex patterns to the `patterns` array
* Handle new annotations (e.g., underline, strikethrough)

**Add API endpoints**:
* Create new route file in `server/routes/` (e.g., `export.js`)
* Mount route in `server/src/routes.js`
* Create Zod schema in `server/src/schemas/` for validation

**Add middleware**:
* Create new middleware in `server/src/middleware/` (e.g., `auth.js`)
* Apply in `server/src/app.js` or specific routes

### Frontend Modifications

**Add new React components**:
* Create component in `client/src/components/` (one per file)
* Follow naming convention: `ComponentName.jsx`
* Add docstring with `@component` tag

**Add custom hooks**:
* Create hook in `client/src/hooks/` (e.g., `useFeature.js`)
* Name with `use` prefix following React conventions
* Export as named export

**Change UI styling**:
* Global styles: `client/src/index.css`
* Component styles: Use Tailwind classes (auto‑sorted by Prettier plugin)
* Prism theme: `client/src/styles/vscode-dark-modern-prism.css`

**Update API base URL**:
* Environment variable: `VITE_API_BASE` in `client/.env`
* Used in `client/src/utils/api.js`

---

## Important Implementation Notes

### Environment Variable Loading

`server/index.js` structure:

```javascript
import 'dotenv/config';  // Modern shorthand - loads .env automatically
import app from './src/app.js';

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

**Critical**: `dotenv/config` must be the **first import** in `server/index.js` to ensure all environment variables are loaded before any other modules initialize.

### Notion Client Initialization

The Notion client is created at **module‑level** in `server/src/services/notion/index.js`:

```javascript
import { Client } from '@notionhq/client';

// Module-level initialization (not lazy)
export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});
```

This works because `server/src/config/index.js` loads `dotenv/config` before the Notion service is imported.

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

## API Routes

All API routes are mounted under the `/api` prefix via `server/src/routes.js`:

**Current endpoints**:
* `POST /api/generate` — Generate documentation from task context
* `POST /api/notion` — Export documentation to Notion page

**Route mounting**:
Routes are centralized in `server/src/routes.js` and imported into `server/src/app.js`:
```javascript
import routes from './routes.js';
app.use('/api', routes);
```

Individual route handlers are in `server/routes/`:
* `server/routes/generate.js` — Generate endpoint logic
* `server/routes/notion.js` — Notion export endpoint logic

**Note**: Health check endpoint (`GET /health`) is not currently implemented but can be added if needed for container orchestration or monitoring.

---

## ESLint (client)

This codebase applies an important rule on the client:

  * `'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }]` → allows **UPPER_SNAKE_CASE** constants without flagging an unused variable. Adjust constant names to this pattern when necessary.

---

## Client Base URL

Frontend API calls use an environment variable for flexibility:

```js
// client/src/utils/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE ?? '/api';
```

**Configuration**:
* Set `VITE_API_BASE` in `client/.env` to override default
* Defaults to `/api` (relative path) for production builds
* In development, Vite proxy or CORS handles routing to backend on port 3001
* Example: `VITE_API_BASE=http://localhost:3001/api` for direct backend calls

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
