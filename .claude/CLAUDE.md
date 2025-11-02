# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. Claude automatically loads `CLAUDE.md` into context at the start of a coding session. Treat every rule here as **non‑negotiable**.

---

## Project Overview

Data Engineering Documentation Generator — A full‑stack app with **dual documentation modes** that generates English technical documentation using Google Gemini AI and sends it to Notion with automatic block chunking.

**Two Documentation Modes:**

1. **Task Documentation Mode** — Documents completed data engineering tasks with 5-section structure (Summary, Problem Solved, Solution Implemented, Code Highlights, Challenges & Learnings)
2. **Architecture Documentation Mode** — Documents system architecture and design decisions with 6-section structure (Overview, Data Flow, Key Decisions, Implementation Details, Trade-offs, Future Considerations)

Users can switch between modes via tab-based UI and dynamically select target Notion pages from a dropdown of all shared pages.

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

* Backend runs on port 3001, exposes three API endpoints:
  * `POST /api/generate` — Generate documentation (task or architecture mode)
  * `POST /api/notion` — Export documentation to Notion page
  * `GET /api/notion/pages` — List all Notion pages shared with integration
* Frontend runs on port 5173, makes fetch calls to backend
* All API keys stay server‑side only

### Critical Data Flow

**Documentation Generation Flow:**

1. **Mode Selection** → User selects mode via `ModeToggle.jsx` (task or architecture)
   * Mode synced to URL query parameter (`?mode=architecture`)
2. **User Input** → `InputForm.jsx` collects inputs based on mode:
   * **Task Mode:** context (required), code (optional), challenges (optional)
   * **Architecture Mode:** overview (required), dataflow (required), decisions (required)
3. **Generate Request** → `client/src/utils/api.js` → `POST /api/generate` with `mode` field
4. **Request Validation** → `validate(GenerateSchema)` middleware validates using discriminated union:
   * TaskSchema validates task mode fields
   * ArchitectureSchema validates architecture mode fields
5. **Route Handler** → `server/routes/generate.js` processes validated request
   * Calls `generateDocumentation()` for task mode
   * Calls `generateArchitectureDocumentation()` for architecture mode
6. **Gemini Service** → `server/services/geminiService.js` calls Google Gemini REST API
   * Uses `fetchWithRetry()` from `server/src/lib/http.js` for resilient calls (12s timeout, 3 retries)
   * Generation config: temperature 0.3, maxTokens 4096, topP 0.8, topK 40
7. **Response** → Markdown docs in English:
   * **Task Mode:** 5 sections (Summary, Problem Solved, Solution Implemented, Code Highlights, Challenges & Learnings)
   * **Architecture Mode:** 6 sections (Overview, Data Flow, Key Decisions, Implementation Details, Trade-offs, Future Considerations)
8. **Display** → `GeneratedContent.jsx` lazy-loaded with React.lazy(), renders markdown with copy/send buttons

**Notion Page Selection Flow:**

9. **Page List Request** → On mount, `App.jsx` calls `GET /api/notion/pages`
10. **Page Search** → `server/src/services/notion/search.js` calls `listSharedPages()`
    * Paginates through all shared pages (100 results per page)
    * Extracts page titles and IDs
11. **Dropdown Rendering** → `InputForm.jsx` displays page selector with all available pages
12. **Persistence** → Selected page ID saved to localStorage (`de-task-journal:selected-notion-page`)

**Notion Export Flow:**

13. **Send to Notion** → User clicks "Send to Notion" → `POST /api/notion` with `mode` parameter
14. **Request Validation** → `validate(NotionExportSchema)` middleware validates content & pageId
15. **Route Handler** → `server/routes/notion.js` processes validated request
    * Extracts first H1 heading with `extractTitleFromMarkdown()`
    * For architecture mode: prepends `🏗️ # [ARCHITECTURE] - {title} ({date})`
16. **Markdown Conversion** → `markdownToNotionBlocks()` from `server/src/services/notion/markdown.js`
    * Parses inline formatting via `parseInlineMarkdown()`
    * Converts markdown to Notion block JSON structures
17. **Block Append** → `appendBlocksChunked()` from `server/src/services/notion/client.js`
    * Automatically chunks documents into ≤100 blocks per request
    * Sends chunks sequentially with **100ms delay** between requests (note: config.js has 350ms constant but implementation uses 100ms)
    * Uses `notionCall()` retry wrapper for 429/5xx errors
    * Returns `{ blocksAdded, chunks, responses }` with full API responses

### Key Service Responsibilities

**`geminiService.js`**

* Direct REST API calls to Google Gemini (no SDK)
* **Dual-mode generation functions:**
  * `generateDocumentation(context, code, challenges)` — Task mode with 5-section structure
  * `generateArchitectureDocumentation(overview, dataflow, decisions)` — Architecture mode with 6-section structure
* Uses separate system instructions per mode:
  * `getSystemInstruction()` — Task documentation instructions
  * `getArchitectureSystemInstruction()` — Architecture documentation instructions
* Both modes generate English output (accepts input in any language)
* Model configurable via `GEMINI_MODEL` env var (default: `gemini-2.0-flash-exp`)
* Generation config: temperature 0.3, maxOutputTokens 4096, topP 0.8, topK 40
* **Mock mode:** Returns placeholder documentation when `GEMINI_API_KEY` is missing (supports both modes)

**Notion Service** (`server/src/services/notion/`)

The Notion integration is organized as a **modular service** with 8 specialized files:

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
  * Request limits: `MAX_BLOCKS_PER_REQUEST = 100`, `MAX_TEXT_LENGTH = 2000`, `RPS_THROTTLE_MS = 350`
  * Safety limits: `MAX_ARRAY_ITEMS = 100`, `MAX_BLOCK_ELEMENTS = 1000`, `MAX_PAYLOAD_BYTES = 500 * 1024`, `MAX_NESTING_LEVELS = 2`
  * API version: `NOTION.version = '2022-06-28'` (pinned)
  * `defaultHeaders(token)` function for API headers

* **`search.js`** — Page search functionality (NEW)
  * `listSharedPages()` retrieves all pages shared with integration
  * `extractPageTitle()` extracts title from page objects
  * Pagination support for 100+ pages
  * Used by `GET /api/notion/pages` endpoint

* **`exportPage.js`** — Page export functionality
* **`paginate.js`** — Pagination utilities for list operations
* **`throttle.js`** — Rate limiting utilities (100ms actual delay; note config constant is 350ms)

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

* `GenerateSchema` — Validates `POST /api/generate` requests using **discriminated union** pattern
* Discriminator: `mode` field ('task' | 'architecture')
* **TaskSchema** (mode: 'task' or undefined):
  * `context` (string, min 10 chars, required)
  * `code` (string, max 10000 chars, optional)
  * `challenges` (string, max 2000 chars, optional)
* **ArchitectureSchema** (mode: 'architecture'):
  * `overview` (string, 150-10000 chars, required)
  * `dataflow` (string, 150-10000 chars, required)
  * `decisions` (string, 150-10000 chars, required)
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
  * **Timeout**: Default **12s** (12000ms), configurable via `config.timeoutMs`
  * **Retries**: Default 3 attempts, configurable via `config.attempts`
  * **Exponential backoff with jitter**: Base delay configurable via `config.baseDelayMs`, max delay via `config.maxDelayMs`
  * **Status code handling**: Retries on 429 (rate limit) and 5xx (server errors), configurable via `config.retryOn(response)` function
  * **AbortSignal.timeout()**: Uses modern API for request timeout cancellation
  * **Error structure**: Returns `{ code: 'upstream_unavailable', status: 502, ... }` on failure
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
* **`ModeToggle.jsx`** — Tab-based mode switcher (NEW)
  * Toggles between 'task' and 'architecture' documentation modes
  * ARIA-compliant tab navigation
  * Updates URL query parameter on mode change

* **`InputForm.jsx`** — Main form for collecting documentation inputs
  * **Dual-mode rendering**: Shows different fields based on selected mode
  * **Task Mode:** context (required), code (optional), challenges (optional)
  * **Architecture Mode:** Renders `ArchitectureFields.jsx` component
  * **Notion page selector:** Dropdown with all shared Notion pages (loaded from `GET /api/notion/pages`)
  * **Persistence:** Selected page ID saved to localStorage
  * Character counters for all text fields
  * Auto-focus on first invalid field on validation error
  * Collapsible on mobile with "Edit inputs" button for better UX after generation

* **`ArchitectureFields.jsx`** — Architecture mode input fields (NEW)
  * Three specialized text areas: overview, dataflow, decisions (all required)
  * Character counters with 150-10000 char limits
  * Integrated with main form validation

* **`GeneratedContent.jsx`** — Displays generated markdown documentation
  * **Lazy-loaded** with React.lazy() for performance
  * Renders markdown with syntax highlighting (react-markdown + Prism.js)
  * Copy to clipboard button
  * Send to Notion button
  * Accessible with ARIA labels
  * Suspense fallback with loading spinner

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
  * Provides `useAnnouncer()` custom hook via Context API
  * Methods: `announcePolite(message)` and `announceAssertive(message)`
  * Used throughout app for accessible status updates

**State Management** (`client/src/App.jsx`)

Uses React `useState` hooks for application state:
* `mode` — Current documentation mode ('task' | 'architecture')
  * **Synced to URL** query parameter (`?mode=architecture`) via useEffect
  * Read from URL on mount for shareable links
* `documentation` — Generated markdown string
* `isGenerating` — Loading state for Gemini API
* `isSending` — Loading state for Notion API
* `error` — Error message string
* `formCollapsed` — Form collapse state (auto-collapses after successful generation)
* `notionPages` — List of available Notion pages (loaded from API)
* `isLoadingPages` — Loading state for Notion pages fetch
* Toast notifications managed via `useToast()` hook
* Screen reader announcements via `useAnnouncer()` hook

**Persistence:**
* Selected Notion page ID saved to localStorage (`de-task-journal:selected-notion-page`)

**Accessibility:**
* Skip link to main content for keyboard navigation
* Live announcer context for screen reader updates
* Form validation with auto-focus on first invalid field

No global state management (Redux, Context) — component‑level state with Context API for cross-cutting concerns (toast, announcer) is sufficient for this application's scope.

**Custom Hooks** (`client/src/hooks/`)

* **`useToast.js`** — Toast notification management
  * Returns: `{ toasts, showToast, showSuccess, showError, showInfo, removeToast, clearAllToasts }`
  * `showToast(message, type, duration)` — Shows toast (types: 'success', 'error', 'info')
  * **Convenience methods:**
    * `showSuccess(message, duration)` — Shows success toast
    * `showError(message, duration)` — Shows error toast
    * `showInfo(message, duration)` — Shows info toast
  * `clearAllToasts()` — Removes all toasts at once
  * Auto‑dismisses after configurable duration (default 3 seconds)
  * Prevents duplicate toasts (same message and type)
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
  * `generateDocumentation(data)` — Calls `POST /api/generate` with mode and fields
  * `sendToNotion(content, pageId, mode)` — Calls `POST /api/notion` with mode parameter
  * `getNotionPages()` — Calls `GET /api/notion/pages` to retrieve all shared pages
  * Configurable API base via `VITE_API_BASE` env var (defaults to `/api`)
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
NOTION_PAGE_ID=        # Target Notion page UUID (optional if using page selector)
NOTION_PARENT_PAGE_ID= # Parent page UUID for creating new pages (optional, unused in current implementation)
ALLOWED_ORIGINS=       # Comma-separated list of allowed CORS origins (optional, for production)
PORT=3001
NODE_ENV=development
```

**Important**:

* `.env` is loaded by `server/src/config/index.js` using `dotenv/config`
* Configuration module uses **Zod schema validation** to validate all required variables
* Invalid or missing env vars trigger warnings (not hard exits) for flexibility
* All services use the centralized config module (`import { env } from './src/config/index.js'`)
* **CORS configuration**: `ALLOWED_ORIGINS` accepts comma-separated list (e.g., `http://localhost:5173,https://app.example.com`)
  * Dynamic origin validation with fallback for development
  * `credentials: true` enabled for cookie support
* **Rate limiting**: 200 requests per 15 minutes per IP (configured in `server/src/app.js`)

#### Client Environment Variables

**Optional Environment Variables** (`.env` in client folder):

```
VITE_API_BASE=/api                    # API base path (defaults to '/api' if not set)
VITE_NOTION_PAGE_ID=                   # Notion page UUID for direct linking (optional, unused - app uses dynamic page selector)
```

**Important**:

* Client variables MUST be prefixed with `VITE_` to be exposed by Vite
* These variables are loaded at build time and exposed to the browser
* **Never put secrets in client environment variables** - they are publicly visible
* `VITE_API_BASE` defaults to `/api` (relative path) if not set
* In development, CORS handles routing to backend on port 3001
* **Note:** `client/.env.example` file does not exist. Create `.env` manually if needed.

---

## Key Dependencies

### Server Dependencies

**Production**:
* **express** (v5.1.0) — Web framework (note: Express 5, not 4)
* **@notionhq/client** (v5.3.0) — Official Notion SDK
* **dotenv** (v17.2.3) — Environment variable management
* **zod** (v4.1.12) — Schema validation and type safety
* **helmet** (v8.1.0) — Security middleware (CSP, XSS protection)
* **express-rate-limit** (v8.1.0) — Rate limiting middleware
* **cors** (v2.8.5) — Cross‑origin resource sharing

**Development**:
* **vitest** (v2.1.8) — Test runner with Vite integration
* **msw** (v2.11.6) — Mock Service Worker for API mocking in tests
* **supertest** (v7.1.4) — HTTP assertion library
* **@types/supertest** — TypeScript types for Supertest

### Client Dependencies

**Production**:
* **react** (v19.1.1) — UI library (React 19 with new features like useTransition)
* **react-dom** (v19.1.1) — React DOM renderer
* **@uiw/react-textarea-code-editor** (v2.1.0) — Code editor component
* **react-markdown** (v9.0.0) — Markdown renderer
* **react-syntax-highlighter** (v15.5.0) — Syntax highlighting
* **remark-gfm** (v4.0.0) — GitHub Flavored Markdown support
* **prismjs** (v1.30.0) — Syntax highlighting library

**Development**:
* **vite** (v6.3.1) — Build tool and dev server
* **@vitejs/plugin-react** (v5.0.1) — React plugin for Vite
* **tailwindcss** (v3.4.18) — Utility‑first CSS framework
* **@tailwindcss/typography** (v0.5.19) — Typography plugin for prose styling
* **prettier** (v3.5.1) — Code formatter
* **prettier-plugin-tailwindcss** (v0.7.0) — Auto‑sorts Tailwind classes
* **eslint** (v9.36.0) — Linter with React and a11y plugins
* **vitest** (v2.1.9) — Test runner for client-side tests
* **@testing-library/react** (v16.3.0) — React testing utilities
* **@testing-library/dom** (v10.4.1) — DOM testing utilities
* **@testing-library/jest-dom** (v6.9.1) — Custom Jest matchers for DOM
* **@testing-library/user-event** (v14.6.1) — User interaction simulation
* **jest-axe** (v10.0.0) — Accessibility testing
* **jsdom** (v23.2.0) — DOM implementation for testing
* **@types/react** and **@types/react-dom** — TypeScript definitions for IDE support (not using TypeScript, but helps with editor IntelliSense)

**Important**: The project uses **Express 5** (v5.1.0), which has breaking changes from Express 4. Ensure middleware and patterns are compatible with Express 5.

---

## Generated Documentation Structure

The system generates documentation in **two different structures** based on the selected mode. Both modes accept input in any language but always output in English.

### Task Documentation Mode (5 sections)

Enforced via `buildPrompt()` in `geminiService.js`:

1. **Summary** — 1-2 sentences summarizing the task and its purpose
2. **Problem Solved** — Description of the business or technical problem
3. **Solution Implemented** — Technical approach and key implementation decisions
4. **Code Highlights** — Brief explanation of code snippet with inferred language
5. **Challenges & Learnings** — Main obstacles or insights as bullet points

### Architecture Documentation Mode (6 sections)

Enforced via `buildArchitecturePrompt()` in `geminiService.js`:

1. **Overview** — High-level description of the system architecture
2. **Data Flow** — How data moves through the system (sources → transformations → destinations)
3. **Key Decisions** — Critical architectural and technical decisions with rationale
4. **Implementation Details** — Technical implementation specifics (technologies, patterns, integrations)
5. **Trade-offs** — Design trade-offs and their implications
6. **Future Considerations** — Scalability, maintenance, and evolution considerations

**Notion Export:** Architecture mode documentation is prefixed with `🏗️ # [ARCHITECTURE] - {title} ({date})` when sent to Notion.

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
* **Throttle:** 100ms delay between requests in actual implementation (note: `config.js` has `RPS_THROTTLE_MS = 350` constant but code uses 100ms)
* Returns `{ blocksAdded, chunks, responses }` with full API responses from each chunk

**When to modify**: If adding new Markdown patterns (e.g., tables, callouts), update `markdownToNotionBlocks()` in `server/src/services/notion/markdown.js` and ensure chunking still works.

**Important Discrepancy:** There is an inconsistency between the `RPS_THROTTLE_MS` constant (350ms) in `config.js` and the actual delay (100ms) used in `client.js`. The implementation uses 100ms via `await delay(100)` at line 178 of `server/src/services/notion/client.js`.

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
   * Notion API: **Actual implementation uses 100ms delay** (not 350ms from config)
   * Express rate limit: **200 requests per 15 minutes per IP** (not 100 as previously documented)
   * Both use `fetchWithRetry()` with exponential backoff for 429 errors

9. **Throttle delay inconsistency**:

   * `server/src/services/notion/config.js` defines `RPS_THROTTLE_MS = 350`
   * `server/src/services/notion/client.js` line 178 uses `await delay(100)` (100ms)
   * **Action required**: Decide which value is correct and update either config or implementation

10. **Mode parameter required**:

    * `POST /api/generate` requires `mode` field in request body ('task' | 'architecture')
    * If mode is undefined or 'task', uses TaskSchema validation and 5-section output
    * If mode is 'architecture', uses ArchitectureSchema validation and 6-section output
    * Missing or invalid mode will fail discriminated union validation

11. **HTTP timeout**:

    * `fetchWithRetry()` has **12-second timeout** (not 30s)
    * Configurable via `config.timeoutMs` parameter
    * Uses `AbortSignal.timeout()` for cancellation

---

## State Management

See the **State Management** subsection in "Client Application Structure" above for complete details.

**Summary:**
* Component-level state with `useState` hooks in `App.jsx`
* Mode synced to URL query parameter
* Notion page selection persisted to localStorage
* Context API for cross-cutting concerns (toast, announcer)
* No Redux/global state management

---

## Testing Approach

### Automated Tests

The project uses **Vitest** as the test runner with a monorepo configuration. Tests are organized by layer (unit, integration, snapshot).

**Test Configuration**:
* **Root** (`vitest.config.js`) — Monorepo configuration defining server and client projects
* **Server** (`server/vitest.config.js`) — Server‑specific test setup with MSW for API mocking
* **Client** (`client/vitest.config.js`) — Client‑specific test setup with React Testing Library and jsdom

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

**Testing Libraries (Server)**:
* **Vitest** (v2.1.8) — Fast test runner with Vite integration
* **MSW** (v2.11.6) — Mock Service Worker for API request mocking
* **Supertest** (v7.1.4) — HTTP assertion library for Express routes

**Client Testing Infrastructure**:

While server tests are comprehensive, client testing setup includes:
* **@testing-library/react** (v16.3.0) — React component testing utilities
* **@testing-library/dom** (v10.4.1) — DOM testing utilities
* **@testing-library/jest-dom** (v6.9.1) — Custom Jest/Vitest matchers for DOM assertions
* **@testing-library/user-event** (v14.6.1) — User interaction simulation
* **jest-axe** (v10.0.0) — Accessibility testing with axe-core
* **jsdom** (v23.2.0) — DOM implementation for Node.js testing
* **vitest** (v2.1.9) — Test runner configured for React components

**Note:** Client test files may not be fully implemented yet. The testing infrastructure is in place for future component and integration tests.

### Manual Integration Testing

Required for end-to-end validation:

**Task Mode Testing:**
1. **Basic generation**: Context only → verify 5 sections in English
2. **With code**: Add code snippet → verify formatted in docs with language inference
3. **Inline formatting**: Use **bold**, *italic*, `code`, [links](url) in input → verify they appear formatted in Notion
4. **Notion send**: Click "Send to Notion" → check server logs for chunking
5. **Large docs**: Long context + code → verify >100 blocks get chunked
6. **Multi-language input**: Test with input in different languages → verify English output

**Architecture Mode Testing:**
7. **Architecture generation**: Switch to Architecture tab → fill overview, dataflow, decisions → verify 6 sections in English
8. **Notion prefix**: Send architecture docs → verify `🏗️ # [ARCHITECTURE] - {title} ({date})` prefix in Notion
9. **Mode persistence**: Reload page with `?mode=architecture` query param → verify mode persists

**Page Selection Testing:**
10. **Page dropdown**: Verify all shared Notion pages appear in dropdown
11. **Page persistence**: Select page → reload → verify selection persists from localStorage
12. **Dynamic selection**: Change page selection → send to different page → verify correct page receives content

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
* `POST /api/generate` — Generate documentation (task or architecture mode)
  * Requires: `mode` ('task' | 'architecture') + mode-specific fields
  * Returns: Markdown documentation (5 or 6 sections based on mode)
* `GET /api/notion/pages` — List all Notion pages shared with integration
  * Returns: `{ pages: [{ id, title }] }`
  * Used by: Page selector dropdown in UI
* `POST /api/notion` — Export documentation to Notion page
  * Requires: `content` (markdown), `pageId` (UUID), optional `mode`
  * Behavior: Architecture mode prepends `🏗️ # [ARCHITECTURE]` header
  * Returns: `{ success, blocksAdded, chunks }`

**Route mounting**:
Routes are centralized in `server/src/routes.js` and imported into `server/src/app.js`:
```javascript
import routes from './routes.js';
app.use('/api', routes);
```

Individual route handlers are in `server/routes/`:
* `server/routes/generate.js` — Generate endpoint logic (dual mode support)
* `server/routes/notion.js` — Notion export and page listing endpoints

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

## React 19 Features & Examples

The project uses **React 19.1.1** with new features and patterns:

**New React 19 Features Used:**
* **Lazy loading with Suspense** — `GeneratedContent` component is lazy-loaded for code splitting
* **Context API improvements** — Used for `LiveAnnouncer` and `Toast` systems
* **Enhanced hooks** — Better support for concurrent rendering

**Example Components** (`client/src/examples/`):
* **`UseTransitionExample.jsx`** — Demonstrates React 19's `useTransition` hook for concurrent UI updates
  * Shows non-blocking state updates
  * Improves perceived performance for heavy operations
  * Example pattern for future optimizations

**Note:** Example components are educational references and not used in production code.

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

---

# Documentation Update Changelog (2025-11-01)

This section tracks major updates to CLAUDE.md to reflect actual implementation.

## ✨ Major Features Documented

### Dual-Mode Documentation System
- **Architecture Documentation Mode** — NEW 6-section structure for documenting system architecture
- **Task Documentation Mode** — Existing 5-section structure (previously the only mode)
- **Mode Toggle UI** — Tab-based switcher with URL synchronization (`?mode=architecture`)
- **Discriminated Union Validation** — Zod schema pattern for mode-specific field validation

### Dynamic Notion Page Selection
- **GET /api/notion/pages** — NEW endpoint to list all shared Notion pages
- **Page Selector Dropdown** — UI component for selecting target Notion page
- **localStorage Persistence** — Selected page ID saved across sessions
- **Pagination Support** — Handles 100+ Notion pages

### Enhanced State & Persistence
- **URL State Sync** — Mode parameter synced to query string for shareable links
- **Form Collapse** — Auto-collapse input form after successful generation
- **Lazy Loading** — GeneratedContent component code-split with React.lazy()
- **Skip Link** — Keyboard navigation accessibility feature

## 🔧 Corrected Information

### Configuration Corrections
- **HTTP Timeout**: 12 seconds (not 30s as previously documented)
- **Rate Limiting**: 200 requests/15min (not 100 as previously documented)
- **Throttle Delay**: **INCONSISTENCY IDENTIFIED** — config.js has 350ms, implementation uses 100ms
- **Notion Service**: 8 files (not 7), added `search.js`

### Dependency Versions
- **React**: v19.1.1 (not "latest")
- **@notionhq/client**: v5.3.0 (not "latest")
- **dotenv**: v17.2.3 (not "latest")
- **cors**: v2.8.5 (not "latest")
- Added **prismjs** v1.30.0 to documented dependencies

### Environment Variables
- **ALLOWED_ORIGINS** — NEW, for dynamic CORS configuration
- **NOTION_PAGE_ID** — Now optional (app uses dynamic page selector)
- **client/.env.example** — Does not exist (documentation corrected)

## 📦 Added Documentation

### New Components
- **ModeToggle.jsx** — Tab-based mode switcher
- **ArchitectureFields.jsx** — Architecture mode input fields
- **useAnnouncer() hook** — Accessibility announcements via Context API

### Enhanced Hook Documentation
- **useToast** convenience methods: `showSuccess()`, `showError()`, `showInfo()`, `clearAllToasts()`
- Duplicate toast prevention
- Configurable auto-dismiss duration

### Testing Infrastructure
- **Client Testing Setup** — React Testing Library, jest-axe, jsdom documented
- **Manual Testing Guide** — Added Architecture mode and Page selection test scenarios

### API Documentation
- **POST /api/generate** — Dual mode support with discriminated union
- **GET /api/notion/pages** — Page listing endpoint
- **POST /api/notion** — Mode-aware export with architecture prefix

### Implementation Details
- **Mock Documentation Mode** — Fallback when GEMINI_API_KEY is missing
- **Auto-focus Validation** — Form focuses first invalid field on error
- **Notion Response Structure** — Returns `{ blocksAdded, chunks, responses }` (not just 2 fields)
- **Gemini Generation Config** — temperature 0.3, maxTokens 4096, topP 0.8, topK 40

## ⚠️ Known Issues Documented

### Critical Inconsistencies
1. **Throttle Delay Mismatch** — config.js (350ms) vs implementation (100ms) - requires resolution
2. **RPS_THROTTLE_MS Constant** — Defined but not used correctly

### Action Items
- Resolve throttle delay inconsistency
- Create `client/.env.example` file (currently missing)
- Consider implementing client-side tests (infrastructure in place)

---

**Last Updated**: 2025-11-01
**Documentation Version**: 2.0
**Covers Implementation**: Current production codebase as of 2025-11-01
