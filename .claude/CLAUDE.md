# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. Claude automatically loads `CLAUDE.md` into context at the start of a coding session. Treat every rule here as **non‑negotiable**.

---

## Project Overview

Data Engineering Documentation Generator — A full‑stack app with **triple documentation modes** that generates English technical documentation using Google Gemini AI and sends it to **Notion or Confluence** with automatic block chunking.

**Three Documentation Modes:**

1. **Task Documentation Mode** — Documents completed data engineering tasks with 5-section structure (Summary, Problem Solved, Solution Implemented, Code Highlights, Challenges & Learnings)
2. **Architecture Documentation Mode** — Documents system architecture and design decisions with 5-section structure (Overview, Key Components, Data & Service Flow, Technology Stack, Migration Guide & Developer Workflow)
3. **Meeting Documentation Mode** — Synthesizes meeting transcripts (multilingual PT/EN) into actionable documentation with 6-section structure (Executive Summary, Key Decisions & Definitions, Technical Context Extracted, Action Items & Next Steps, Open Questions & Risks, Meeting Record)

**Two Platform Support:**

Users can send documentation to either **Notion** or **Confluence** (platform selection is dynamic based on configuration). Confluence supports two write modes: **Append** (add to end) or **Overwrite** (replace all content with confirmation).

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

### Testing

```bash
# Run all tests (unit + E2E)
npm test

# Run unit tests only
npm run test:run

# Run E2E tests only
npx playwright test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Linting and Formatting

```bash
# Lint client
npm run lint --prefix ./client

# Lint server
npm run lint --prefix ./server

# Format check (CI mode)
npm run format:check --prefix ./client
npm run format:check --prefix ./server

# Auto-fix formatting
npm run format --prefix ./client
npm run format --prefix ./server
```

### Building for Production

```bash
cd client
npm run build  # Output: client/dist/
```

### Installing Dependencies

```bash
# Install all (root + client + server)
npm install

# Backend only
cd server
npm install

# Frontend only
cd client
npm install
```

---

## Architecture

### Two‑Tier Architecture

**Backend (Express)** → **Frontend (React)**

* Backend runs on port 3001, exposes API endpoints:
  * `GET /api/config` — Get available platforms (Notion/Confluence)
  * `POST /api/generate` — Generate documentation (task/architecture/meeting mode)
  * `GET /api/notion/pages` — List all Notion pages shared with integration
  * `POST /api/notion` — Export documentation to Notion page
  * `GET /api/confluence/pages` — Search Confluence pages (with query params)
  * `POST /api/confluence` — Export documentation to Confluence page (append or overwrite)
* Frontend runs on port 5173, makes fetch calls to backend
* All API keys stay server‑side only

### Critical Data Flow

**Platform Configuration Flow:**

1. **Configuration Check** → On app mount, `App.jsx` calls `GET /api/config`
2. **Backend Check** → `server/routes/config.js` calls `getAvailablePlatforms()`
3. **Environment Validation** → Checks which platforms have required environment variables configured
4. **Dynamic UI** → `PlatformSelector` renders only if both platforms are available
5. **Auto-selection** → If only one platform is configured, auto-selects it (no selector shown)

**Documentation Generation Flow:**

1. **Mode Selection** → User selects mode via `ModeToggle.jsx` (task/architecture/meeting)
   * Mode synced to URL query parameter (`?mode=architecture` or `?mode=meeting`)
2. **Platform Selection** → User selects platform via `PlatformSelector.jsx` (if both configured)
   * Notion or Confluence
   * Selection persisted to localStorage
3. **User Input** → `InputForm.jsx` collects inputs based on mode:
   * **All Modes:** Single unified `context` field (accepts any input format)
   * **Form Draft Auto-save:** Inputs saved to localStorage every 500ms
   * **Legacy Support:** Migrates old multi-field drafts to unified context
4. **Generate Request** → `client/src/utils/api.js` → `POST /api/generate` with `mode` field
5. **Request Validation** → `validate(GenerateSchema)` middleware validates using discriminated union
6. **Route Handler** → `server/routes/generate.js` processes validated request
7. **Gemini Service** → `server/services/geminiService.js` calls Google Gemini REST API
   * Uses `fetchWithRetry()` from `server/src/lib/http.js` for resilient calls (12s timeout, 3 retries)
   * Generation config: temperature 0.3, maxTokens 4096, topP 0.8, topK 40
8. **Response** → Markdown docs in English (5 or 6 sections depending on mode)
9. **Display** → `GeneratedContent.jsx` lazy-loaded with React.lazy(), renders markdown
   * **Edit Mode:** Toggle between preview and editor for markdown editing
   * **History:** Save to history (last 50 documentations stored in localStorage with filters)

**Page Selection Flow:**

10. **Page List Request** → Based on selected platform:
    * Notion: `GET /api/notion/pages` (loads all shared pages)
    * Confluence: Uses `PageSearchSelector` with search/debounce → `GET /api/confluence/pages?search=...&limit=50`
11. **Page Search** → `usePageSearch` hook provides debounced search with caching
12. **Dropdown Rendering** → `PageSearchSelector` displays searchable dropdown with results
13. **Persistence** → Selected page ID saved to localStorage (`de-task-journal:selected-{platform}-page`)

**Export Flow:**

14. **Write Mode Selection** (Confluence only) → User selects append or overwrite via `WriteModeSelector`
15. **Confirmation Dialog** (Confluence overwrite only) → `ConfirmDialog` prompts user to confirm destructive action
16. **Send Request** → Based on platform:
    * Notion: `POST /api/notion` with `content`, `mode`, `pageId`
    * Confluence: `POST /api/confluence` with `content`, `mode`, `pageId`, `writeMode`
17. **Request Validation** → Validates via `NotionExportSchema` or `ConfluenceExportSchema`
18. **Route Handler** → Processes request in `server/routes/notion.js` or `server/routes/confluence.js`
19. **Markdown Conversion:**
    * Notion: `markdownToNotionBlocks()` → Notion block JSON
    * Confluence: `markdownToConfluenceStorage()` → Confluence Storage Format
20. **Content Append/Overwrite:**
    * Notion: Always appends blocks via `appendBlocksChunked()` (100 blocks per request, 100ms throttle)
    * Confluence: Appends or overwrites based on `writeMode` parameter

### Key Service Responsibilities

**`geminiService.js`**

* Direct REST API calls to Google Gemini (no SDK)
* **Unified input interface:**
  * `generateDocumentation(input)` — Accepts single context object with `mode` field
  * Supports task, architecture, and meeting modes with mode-specific prompts
* Uses mode-aware system instructions:
  * `getSystemInstruction(mode)` — Returns mode-specific instructions
  * Task mode: 5 sections
  * Architecture mode: 5 sections
  * Meeting mode: 6 sections
* All modes generate English output (accepts input in any language)
* Model configurable via `GEMINI_MODEL` env var (default: `gemini-2.0-flash-exp`)
* Generation config: temperature 0.3, maxOutputTokens 4096, topP 0.8, topK 40
* **Mock mode:** Returns placeholder documentation when `GEMINI_API_KEY` is missing (supports all modes)

**Notion Service** (`server/src/services/notion/`)

The Notion integration is organized as a **modular service** with 5 specialized files:

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
  * Request limits: `MAX_BLOCKS_PER_REQUEST = 100`, `MAX_TEXT_LENGTH = 2000`, `RPS_THROTTLE_MS = 100`
  * Safety limits: `MAX_ARRAY_ITEMS = 100`, `MAX_BLOCK_ELEMENTS = 1000`, `MAX_PAYLOAD_BYTES = 500 * 1024`, `MAX_NESTING_LEVELS = 2`
  * API version: `NOTION.version = '2022-06-28'` (pinned)
  * `defaultHeaders(token)` function for API headers

* **`search.js`** — Page search functionality
  * `listSharedPages()` retrieves all pages shared with integration
  * `extractPageTitle()` extracts title from page objects
  * Pagination support for 100+ pages
  * Used by `GET /api/notion/pages` endpoint

**Confluence Service** (`server/src/services/confluence/`)

The Confluence integration mirrors Notion structure with 5 specialized files:

* **`markdown.js`** — Markdown to Confluence Storage Format conversion
  * `markdownToConfluenceStorage(markdown)` converts markdown to Confluence Storage Format (XHTML-like)
  * `parseInlineMarkdown(text)` parses inline formatting to Confluence rich text
  * Supports headings, code blocks, lists, paragraphs, quotes, panels
  * Maps markdown syntax to Confluence storage format tags

* **`client.js`** — Confluence REST API operations
  * `appendToConfluencePage()` appends content to existing page
  * `overwriteConfluencePage()` replaces entire page content
  * `getPageContent()` retrieves current page content and version
  * Uses Basic Auth (email + API token)

* **`index.js`** — Core client and exports
  * Exports main functions: `searchConfluencePages`, `appendToConfluencePage`, `overwriteConfluencePage`
  * `markdownToConfluenceStorage` re-exported from markdown.js

* **`config.js`** — Centralized constants
  * API version: `CONFLUENCE.apiVersion = 'v2'` (Cloud REST API v2)
  * Confluence base URL construction from domain

* **`search.js`** — Page search functionality
  * `searchConfluencePages()` searches pages with intelligent title-only matching
  * **Tiered search strategy:** Exact title → Exact phrase → Token matching → Fuzzy fallback
  * **Title-only search:** Searches only in page titles (not content) for more relevant results
  * **Exact match priority:** Pages with titles matching query exactly appear first
  * **Natural relevance ranking:** Uses Confluence's built-in relevance scoring (no chronological sorting)
  * **Space filtering:** Supports `CONFLUENCE_DEFAULT_SPACE_KEY` env var for scoped searches
  * Returns page id, title, and spaceKey
  * Used by `GET /api/confluence/pages` endpoint with debounced search (500ms)

### Server Application Structure

The backend follows a clean, layered architecture for maintainability and testability:

**`server/index.js`** — Application entry point
* Loads environment variables via `import 'dotenv/config'`
* Imports and starts the Express app from `server/src/app.js`
* Minimal code: just loads config and starts HTTP server

**`server/src/app.js`** — Express application configuration
* Exports configured Express app (enables testing without starting server)
* Applies security middleware (Helmet with CSP disabled for development)
* Configures rate limiting (200 requests per 15 minutes per IP)
* Sets up CORS, JSON parsing, and static file serving
* Mounts all API routes via `server/src/routes.js`
* Adds terminal error‑handling middleware (`notFound`, `errorHandler`)

**`server/src/routes.js`** — Centralized route aggregator
* Imports and mounts all API route modules under `/api`
* Routes: `/api/config`, `/api/generate`, `/api/notion`, `/api/confluence`
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
* Fields:
  * `mode` (enum: 'task' | 'architecture' | 'meeting', required)
  * `context` (string, min 10 chars, required) — Unified input field for all modes
* **Single context dump approach:** All three modes accept the same unified context field
* Returns detailed validation errors for invalid requests

**`server/src/schemas/notion.js`** — Notion endpoint schema

* `NotionExportSchema` — Validates `POST /api/notion` requests
* Required fields: `content` (string, 100-50000 chars), `pageId` (string, 32 chars, UUID format)
* Optional: `mode` (enum: 'task' | 'architecture' | 'meeting', default 'task')
* Ensures content and page ID meet Notion API requirements

**`server/src/schemas/confluence.js`** — Confluence endpoint schema

* `ConfluenceExportSchema` — Validates `POST /api/confluence` requests
* Required fields: `content` (string, 100-50000 chars), `pageId` (string, max 100 chars)
* Optional:
  * `mode` (enum: 'task' | 'architecture' | 'meeting', default 'task')
  * `writeMode` (enum: 'append' | 'overwrite', default 'append')
* Ensures content, page ID, and write mode meet Confluence API requirements

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
  * Used by Gemini, Notion, and Confluence services for reliable external API calls

**`server/src/services/inputOptimizer.js`** — Input optimization for large contexts

* `analyzeInput(context)` — Analyzes input size and determines if optimization is needed
* `optimizeInput(context, mode)` — Intelligently reduces large inputs while preserving key information
* **Thresholds** (aligned with 30k character validation limit):
  * `MAX_CHARS_SAFE = 25000` — No optimization below this threshold
  * `MAX_CHARS_WARNING = 20000` — Warning threshold for large inputs
  * `MAX_CHARS_ABSOLUTE = 30000` — Hard limit matching schema validation
* **Target sizes:** Critical: 20000 chars, Warning: 25000 chars
* **Preservation strategy:**
  * 80% text allocation, 20% code preservation
  * Base 50 code lines, scales with target size
  * Removes filler words, redundant whitespace, and non-essential content
* **Use case:** Automatically optimizes inputs >25k chars to fit LLM context windows
* Used by LLM router before sending to Groq/Gemini providers

### Client Application Structure

The frontend follows React best practices with reusable components, custom hooks, and centralized state management.

**React Components** (`client/src/components/`)

Core UI components:
* **`ModeToggle.jsx`** — Three-tab mode switcher (Task/Architecture/Meeting)
  * ARIA-compliant tab navigation with keyboard support (Arrow keys, Home, End)
  * Updates URL query parameter on mode change
  * Supports onSelect callback for analytics/tracking

* **`PlatformSelector.jsx`** — Platform selector (Notion/Confluence)
  * Radio button group for platform selection
  * Only renders if both platforms are configured
  * Returns null if only one platform available (auto-selected)
  * Persists selection to localStorage

* **`InputForm.jsx`** — Main form for collecting documentation inputs
  * **Unified input:** Single context field for all modes (task/architecture/meeting)
  * **Form draft auto-save:** Saves inputs to localStorage every 500ms (`de-task-journal:formDraft`)
  * **Legacy migration:** Converts old multi-field drafts to unified format
  * **Dynamic page selector:** Shows Notion or Confluence page selector based on selected platform
  * **Persistence:** Selected page ID saved to localStorage (`de-task-journal:selected-{platform}-page`)
  * Character counters for text fields
  * Auto-focus on first invalid field on validation error
  * Collapsible on mobile with "Edit inputs" button

* **`PageSearchSelector.jsx`** — Searchable page dropdown with debounce
  * Uses `usePageSearch` hook for debounced search (500ms default)
  * Displays loading spinner during search
  * Error handling with user-friendly messages
  * Lazy loading: searches only when input is clicked or user types
  * Caching: prevents redundant API calls for same query
  * Shows selected page with "Change" button
  * Limit indicator when results are capped

* **`WriteModeSelector.jsx`** — Write mode selector (Append/Overwrite)
  * Only shown for Confluence platform
  * Radio button group with visual indicators (icons from lucide-react)
  * Append mode: Adds content to end of page
  * Overwrite mode: Replaces entire page content
  * Warning message when overwrite is selected
  * Styled differently based on selection (green for append, amber for overwrite)

* **`GeneratedContent.jsx`** — Displays generated markdown documentation
  * **Lazy-loaded** with React.lazy() for performance
  * **Edit mode:** Toggle between markdown preview and editor for pre-send modifications
  * **Confluence overwrite confirmation:** Shows `ConfirmDialog` before overwrite operation
  * Renders markdown with syntax highlighting (react-markdown + Prism.js)
  * Copy to clipboard button
  * Send to platform button (dynamic label based on selected platform)
  * Accessible with ARIA labels
  * Suspense fallback with loading spinner

* **`ConfirmDialog.jsx`** — Confirmation dialog for destructive actions
  * Modal overlay with backdrop click-to-close
  * Escape key to close
  * Focus management (auto-focus confirm button)
  * Variants: warning (amber) and danger (red)
  * Used for Confluence overwrite confirmation
  * Accessible with ARIA attributes (role="dialog", aria-modal, etc.)

* **`HistoryPanel.jsx`** — Enhanced history panel with search and filters
  * Dropdown panel triggered by Clock icon button
  * Search input with debounce (searches title and content)
  * Filters by mode (task/architecture/meeting) and platform (notion/confluence)
  * Shows filtered count in header
  * Individual item removal with X button (shown on hover)
  * Clear all history button
  * Clear filters button when filters are active
  * Click outside or Escape to close
  * Displays timestamp, mode, and platform for each item

* **`Guide.jsx`** — In-app help and onboarding component
  * Feature walkthrough and troubleshooting guide
  * Accessible via Help (?) icon in header
  * Shown at `view === 'guide'` state

Support components:
* **`AppErrorBoundary.jsx`** — React error boundary for graceful error handling
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
* `mode` — Current documentation mode ('task' | 'architecture' | 'meeting')
  * **Synced to URL** query parameter (`?mode=architecture` or `?mode=meeting`) via useEffect
  * Read from URL on mount for shareable links
* `selectedPlatform` — Current platform ('notion' | 'confluence')
  * **Persisted to localStorage**
  * Auto-selected if only one platform is configured
* `writeMode` — Confluence write mode ('append' | 'overwrite')
  * Only used when selectedPlatform === 'confluence'
  * Persisted to localStorage
* `view` — Current view ('main' | 'guide') for switching between main app and help
* `documentation` — Generated markdown string
* `isGenerating` — Loading state for Gemini API
* `isSending` — Loading state for platform API
* `error` — Error message string
* `formCollapsed` — Form collapse state (auto-collapses after successful generation)
* `availablePlatforms` — Which platforms are configured (`{notion: boolean, confluence: boolean}`)
* `isLoadingPlatforms` — Loading state for platform config fetch
* `notionPages` — List of available Notion pages
* `confluencePages` — List of Confluence pages (managed by PageSearchSelector)
* `isLoadingPages` — Loading state for pages fetch
* `docHistory` — Array of last 50 generated documentations with timestamps, mode, and platform
* Toast notifications managed via `useToast()` hook
* Screen reader announcements via `useAnnouncer()` hook

**Persistence (localStorage):**
* `de-task-journal:selected-platform` — Selected platform (notion/confluence)
* `de-task-journal:selected-notion-page` — Selected Notion page ID
* `de-task-journal:selected-confluence-page` — Selected Confluence page ID
* `de-task-journal:writeMode` — Confluence write mode (append/overwrite)
* `de-task-journal:formDraft` — Form inputs auto-saved every 500ms
* `de-task-journal:docHistory` — Last 50 generated documentations with metadata

**Accessibility:**
* Skip link to main content for keyboard navigation
* Live announcer context for screen reader updates
* Form validation with auto-focus on first invalid field
* Keyboard navigation for ModeToggle (Arrow keys, Home, End)
* Dialog/modal focus trapping and management

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

* **`usePageSearch.js`** — Page search with debounce and caching
  * Returns: `{ pages, isLoading, error, searchQuery, setSearchQuery, triggerSearch, clearSearch }`
  * Debounces search input (default 500ms)
  * Caches results to prevent redundant API calls
  * Uses AbortController to cancel in-flight requests
  * Lazy loading: only searches when triggered or query changes
  * Used by `PageSearchSelector` component

**Client Utilities** (`client/src/utils/`)

* **`api.js`** — API client functions
  * `generateDocumentation(data, signal)` — Calls `POST /api/generate` with mode and context
  * `getAvailablePlatforms(signal)` — Calls `GET /api/config` to check which platforms are configured
  * `getNotionPages(searchQuery, limit, signal)` — Calls `GET /api/notion/pages` (ignores search/limit)
  * `getConfluencePages(searchQuery, limit, signal)` — Calls `GET /api/confluence/pages?search=...&limit=...`
  * `sendToNotion(content, mode, pageId, signal)` — Calls `POST /api/notion`
  * `sendToConfluence(content, mode, pageId, writeMode, signal)` — Calls `POST /api/confluence`
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
NOTION_API_KEY=        # From https://notion.so/my-integrations (optional)
NOTION_PAGE_ID=        # Target Notion page UUID (optional, unused - app uses dynamic page selector)
CONFLUENCE_DOMAIN=     # Confluence domain (e.g., mycompany.atlassian.net) (optional)
CONFLUENCE_USER_EMAIL= # Confluence user email (optional)
CONFLUENCE_API_TOKEN=  # Confluence API token from https://id.atlassian.com/manage-profile/security/api-tokens (optional)
PORT=3001
NODE_ENV=development
```

**Important**:

* `.env` is loaded by `server/src/config/index.js` using `dotenv/config`
* Configuration module uses **Zod schema validation** to validate all variables
* Missing env vars trigger warnings (not hard exits) for flexibility
* All services use the centralized config module (`import { env } from './src/config/index.js'`)
* **Platform availability**: At least one platform (Notion or Confluence) must be configured
  * Notion requires: `NOTION_API_KEY`
  * Confluence requires: `CONFLUENCE_DOMAIN`, `CONFLUENCE_USER_EMAIL`, `CONFLUENCE_API_TOKEN`
* **Dynamic platform detection**: `GET /api/config` returns which platforms are available
* **Rate limiting**: 200 requests per 15 minutes per IP (configured in `server/src/app.js`)

#### Client Environment Variables

**Optional Environment Variables** (`.env` in client folder):

```
VITE_API_BASE=/api                    # API base path (defaults to '/api' if not set)
```

**Important**:

* Client variables MUST be prefixed with `VITE_` to be exposed by Vite
* These variables are loaded at build time and exposed to the browser
* **Never put secrets in client environment variables** - they are publicly visible
* `VITE_API_BASE` defaults to `/api` (relative path) if not set
* In development, CORS handles routing to backend on port 3001

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
* **@types/supertest** (v6.0.3) — TypeScript types for Supertest
* **nodemon** (v3.1.10) — Auto-restart server on file changes
* **eslint** (v8.57.1) — Linter
* **prettier** (v3.6.2) — Code formatter

### Client Dependencies

**Production**:
* **react** (v19.1.1) — UI library (React 19 with new features)
* **react-dom** (v19.1.1) — React DOM renderer
* **@uiw/react-textarea-code-editor** (v2.1.0) — Code editor component
* **react-markdown** (v9.0.0) — Markdown renderer
* **react-syntax-highlighter** (v15.5.0) — Syntax highlighting
* **remark-gfm** (v4.0.0) — GitHub Flavored Markdown support
* **prismjs** (v1.30.0) — Syntax highlighting library
* **lucide-react** (v0.552.0) — Icon library for UI elements (Clock, FileText, HelpCircle, X, Plus, RefreshCw, AlertTriangle, etc.)

**Development**:
* **vite** (v7.1.7) — Build tool and dev server
* **@vitejs/plugin-react** (v5.1.0) — React plugin for Vite
* **tailwindcss** (v3.4.18) — Utility‑first CSS framework
* **@tailwindcss/typography** (v0.5.19) — Typography plugin for prose styling
* **prettier** (v3.6.2) — Code formatter
* **eslint** (v9.36.0) — Linter with React and a11y plugins
* **vitest** (v2.1.9) — Test runner for client-side tests
* **@testing-library/react** (v16.3.0) — React testing utilities
* **@testing-library/dom** (v10.4.1) — DOM testing utilities
* **@testing-library/jest-dom** (v6.9.1) — Custom Jest matchers for DOM
* **@testing-library/user-event** (v14.6.1) — User interaction simulation
* **jest-axe** (v10.0.0) — Accessibility testing
* **jsdom** (v23.2.0) — DOM implementation for testing
* **msw** (v2.11.6) — Mock Service Worker for client tests
* **@playwright/test** (v1.56.1) — E2E testing framework (root level)

**Root Dependencies**:
* **eslint** (v8.57.1) — Root linter config
* **prettier** (v3.6.2) — Root formatter config
* **vitest** (v2.1.8) — Monorepo test runner
* **jsdom** (v27.0.1) — DOM implementation for root tests
* **happy-dom** (v20.0.10) — Alternative DOM implementation
* **@playwright/test** (v1.56.1) — E2E testing

**Important**:
* The project uses **Express 5** (v5.1.0), which has breaking changes from Express 4
* **Node.js version**: ^20.18.0 (specified in root package.json engines)
* Ensure middleware and patterns are compatible with Express 5

---

## Generated Documentation Structure

The system generates documentation in **three different structures** based on the selected mode. All modes accept input in any language but always output in English.

### Task Documentation Mode (5 sections)

Enforced via `buildPrompt()` in `geminiService.js`:

1. **Summary** — 1-2 sentences summarizing the task and its purpose
2. **Problem Solved** — Description of the business or technical problem
3. **Solution Implemented** — Technical approach and key implementation decisions
4. **Code Highlights** — Brief explanation of code snippet with inferred language
5. **Challenges & Learnings** — Main obstacles or insights as bullet points

### Architecture Documentation Mode (5 sections)

Enforced via `buildPrompt()` and `getSystemInstruction(mode)` in `geminiService.js`:

1. **Overview** — High-level description of the system architecture and its purpose
2. **Key Components** — Main architectural components and their responsibilities
3. **Data & Service Flow** — How data and services interact (sources → transformations → destinations)
4. **Technology Stack** — Technologies, patterns, and integrations used
5. **Migration Guide & Developer Workflow** — Implementation guidance, setup steps, and developer considerations

**Notion Export:** Architecture mode documentation is prefixed with `🏗️ # [ARCHITECTURE] - {title} ({date})` when sent to Notion.

### Meeting Documentation Mode (6 sections)

Enforced via `buildMeetingPrompt()` and `getSystemInstruction('meeting')` in `geminiService.js`:

1. **Meeting Record** — Concise, topic-focused title
2. **Executive Summary** — 3-5 sentence summary of meeting objective, outcomes, and sentiment
3. **Key Decisions & Definitions** — Explicit agreements made during the meeting
4. **Technical Context Extracted** — Technologies mentioned, architectural changes, data points discussed
5. **Action Items & Next Steps** — Clear tasks with inferred owners and deadlines
6. **Open Questions & Risks** — Unresolved items or potential problems raised

**Special Features:**
- **Multilingual Input:** Accepts Portuguese/English mix (common in Brazilian tech meetings)
- **Filler Word Filtering:** Automatically discards conversational noise (PT: "Uhum", "É", "Tipo assim"; EN: "Like", "You know", "Okay")
- **Decision Extraction:** Differentiates firm DECISIONS from mere SUGGESTIONS
- **Owner Inference:** Attempts to identify task owners from speaker context

**Notion Export:** Meeting mode documentation is prefixed with `📅 # [MEETING] - {date}` when sent to Notion.

---

## Platform Export Formats

### Notion Block Format

The `parseInlineMarkdown()` function in `server/src/services/notion/markdown.js` converts markdown inline formatting to Notion rich text annotations:

| Markdown             | Notion Annotation | Example           | Status |
| -------------------- | ----------------- | ----------------- | ------ |
| `**text**`           | Bold              | **bold text**     | ✅ Implemented |
| `__text__`           | Bold              | **bold text**     | ✅ Implemented |
| `*text*`             | Italic            | *italic text*     | ✅ Implemented |
| `_text_`             | Italic            | *italic text*     | ✅ Implemented |
| `` `text` ``         | Code              | `inline code`     | ✅ Implemented |
| `[text](url)`        | Link              | [link text](url)  | ✅ Implemented |

**Block Types Supported**:
* Headings: `#`, `##`, `###` (H1, H2, H3)
* Code blocks: ``` with language detection (python, sql, js, etc.)
* Lists: `- ` or `* ` (bulleted), `1. ` (numbered)
* Paragraphs: All other text
* Quotes: `>` prefix for block quotes
* Dividers: `---` or `***` for horizontal rules

**Implementation**:
- Regex‑based parser that finds earliest match among all patterns
- Splits text into rich_text segments with appropriate annotations
- Automatically respects 2000-char limit per rich_text object
- Handles consecutive and multiple formatting types
- Exported for testing: `export { parseInlineMarkdown }`

**Notion Block Chunking**:
* **Why**: Notion API has a hard limit of 100 blocks per `blocks.children.append` request
* **How**: `appendBlocksChunked()` in `server/src/services/notion/client.js`
  * Splits array into chunks of ≤100 blocks
  * Sends chunks sequentially with **100ms delay** between requests
  * Uses `notionCall()` retry wrapper for 429/5xx errors
  * Returns `{ blocksAdded, chunks, responses }` with full API responses

### Confluence Storage Format

The `markdownToConfluenceStorage()` function in `server/src/services/confluence/markdown.js` converts markdown to Confluence Storage Format (XHTML-like):

**Supported Conversions**:
* Headings: `#` → `<h1>`, `##` → `<h2>`, etc.
* Bold: `**text**` → `<strong>text</strong>`
* Italic: `*text*` → `<em>text</em>`
* Code: `` `code` `` → `<code>code</code>`
* Code blocks: ` ```language ` → `<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">language</ac:parameter>...</ac:structured-macro>`
* Lists: `- ` → `<ul><li>`, `1. ` → `<ol><li>`
* Links: `[text](url)` → `<a href="url">text</a>`
* Paragraphs: wrapped in `<p>` tags

**Confluence Write Modes**:
* **Append**: Adds content to the end of existing page content
* **Overwrite**: Replaces entire page content (requires confirmation via `ConfirmDialog`)

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

### Confluence API

* Uses REST API v2 (Cloud)
* Endpoint: `https://{domain}/wiki/api/v2/pages/{id}`
* Auth: Basic Auth (email + API token as password)
* API token from: https://id.atlassian.com/manage-profile/security/api-tokens
* Must have page edit permissions

---

## Common Pitfalls

1. **Platform configuration errors**:
   * If no platforms appear in UI, check `GET /api/config` response
   * Notion requires `NOTION_API_KEY`
   * Confluence requires all three: `CONFLUENCE_DOMAIN`, `CONFLUENCE_USER_EMAIL`, `CONFLUENCE_API_TOKEN`
   * Check server console for configuration warnings on startup

2. **Notion "unauthorized" errors**:
   * Page not shared with integration. User must invite integration in Notion UI.
   * **OR** Environment variables not loaded before client initialization. Ensure `import 'dotenv/config'` is the **FIRST import** in `server/index.js`.
   * **OR** `NOTION_API_KEY` is invalid or expired. Generate new key at https://notion.so/my-integrations

3. **Confluence authentication errors**:
   * Check `CONFLUENCE_DOMAIN` format (should be `company.atlassian.net`, not full URL)
   * Ensure API token is valid (tokens don't expire but can be revoked)
   * Verify user email matches the Atlassian account
   * Check page permissions: user must have edit access to target page

4. **100‑block limit (Notion)**: If adding new block types, always test with >100 block documents to verify chunking works.
   * Chunking logic is in `server/src/services/notion/client.js` (`appendBlocksChunked()`)
   * Verify `MAX_BLOCKS_PER_REQUEST = 100` constant in `config.js`

5. **English output**: If Gemini returns output in the wrong language, check:
   * `systemInstruction` is being sent in API call (see `server/services/geminiService.js`)
   * Model supports system instructions (`gemini-2.0-flash-exp` does)
   * Prompt explicitly states "Output MUST be 100% in ENGLISH"

6. **CORS errors**:
   * Backend must run on port 3001
   * Frontend uses `VITE_API_BASE` env var (defaults to `/api`)
   * In development, ensure CORS is enabled in `server/src/app.js`

7. **Environment variables loading order**:
   * Backend loads `.env` from server folder (`server/.env`)
   * `import 'dotenv/config'` MUST be the first import in `server/index.js`
   * `server/src/config/index.js` validates env vars using Zod schemas
   * Notion/Confluence clients are initialized at module‑level (not lazy)

8. **Markdown formatting not appearing**:
   * Notion: Inline markdown is parsed by `parseInlineMarkdown()` in `server/src/services/notion/markdown.js`
   * Confluence: Inline markdown is converted to Storage Format in `server/src/services/confluence/markdown.js`
   * Code blocks use whitespace‑tolerant detection with `trim()`
   * If formatting breaks, ensure conversion functions are called
   * Check API limits: Notion 2000 chars per rich_text object

9. **Request validation errors**:
   * All requests are validated via Zod schemas before processing
   * Check `server/src/schemas/` for constraints
   * Client‑side validation in `client/src/utils/validation.js` should match server schemas

10. **Rate limiting**:
    * Gemini API: 15 RPM, 1500 RPD, 1M TPM (tokens per minute)
    * Notion API: Uses **100ms delay** between chunk requests
    * Confluence API: No explicit rate limit documented, but uses retry logic
    * Express rate limit: **200 requests per 15 minutes per IP**
    * All use `fetchWithRetry()` with exponential backoff for 429 errors

11. **Mode parameter required**:
    * `POST /api/generate` requires `mode` field in request body ('task' | 'architecture' | 'meeting')
    * Missing or invalid mode will fail schema validation

12. **HTTP timeout**:
    * `fetchWithRetry()` has **12-second timeout** (not 30s)
    * Configurable via `config.timeoutMs` parameter
    * Uses `AbortSignal.timeout()` for cancellation

13. **Confluence overwrite confirmation**:
    * Overwrite mode requires user confirmation via `ConfirmDialog`
    * Dialog appears before API request is sent
    * User can cancel to prevent data loss
    * No undo operation available after overwrite

---

## Testing Approach

### Automated Tests

The project uses **Vitest** for unit tests and **Playwright** for E2E tests.

**Test Configuration**:
* **Root** (`vitest.config.js`) — Monorepo configuration
* **Server** (`server/vitest.config.js`) — Server‑specific test setup with MSW
* **Client** (`client/vitest.config.js`) — Client‑specific test setup with React Testing Library and jsdom

**Run tests**:
```bash
# From root (runs all tests in monorepo)
npm test
npm run test:run
npm run test:watch
npm run test:coverage

# E2E tests
npx playwright test
npx playwright test --ui        # Interactive UI mode
npx playwright test --headed    # With browser visible
```

**Server Test Files** (`server/test/`):
* **`api.generate.test.js`** — Tests for `POST /api/generate` endpoint
* **`api.notion.test.js`** — Tests for Notion endpoints
* **`api.confluence.test.js`** — Tests for Confluence endpoints
* **`http.fetchWithRetry.test.js`** — Tests for HTTP retry utility
* **`notionService.snapshot.test.js`** — Snapshot tests for Notion markdown conversion
* **`setup.js`** — Test setup file with MSW configuration

**Client Test Files** (`client/test/`):
* **`ConfirmDialog.test.jsx`** — Unit tests for ConfirmDialog component
* **`GeneratedContent.test.jsx`** — Unit tests for GeneratedContent component
* **`GeneratedContent.a11y.test.jsx`** — Accessibility tests using jest-axe
* **`HistoryPanel.test.jsx`** — Unit tests for HistoryPanel component
* **`InputForm.test.jsx`** — Unit tests for InputForm component
* **`WriteModeSelector.test.jsx`** — Unit tests for WriteModeSelector component
* **`Toast.test.jsx`** — Unit tests for Toast component
* **`useAbortableRequest.test.jsx`** — Unit tests for useAbortableRequest hook
* **`useToast.test.js`** — Unit tests for useToast hook (in hooks directory)

**E2E Test Files** (`e2e/`):
* **`accessibility.spec.js`** — Accessibility tests (keyboard navigation, ARIA, etc.)
* **`confirm-dialog.spec.js`** — ConfirmDialog E2E tests (appearance, cancel, escape key)
* **`documentation-flow.spec.js`** — Full documentation generation flow tests
* **`history-panel.spec.js`** — History panel E2E tests (open/close, search, filters)
* **`write-mode-selector.spec.js`** — WriteModeSelector E2E tests (mode switching, warnings)

**Testing Libraries**:
* **Vitest** (v2.1.8 server, v2.1.9 client) — Test runner
* **MSW** (v2.11.6) — API mocking
* **Supertest** (v7.1.4) — HTTP assertion library for Express
* **@testing-library/react** (v16.3.0) — React testing utilities
* **@testing-library/jest-dom** (v6.9.1) — DOM matchers
* **@testing-library/user-event** (v14.6.1) — User interaction simulation
* **jest-axe** (v10.0.0) — Accessibility testing
* **@playwright/test** (v1.56.1) — E2E testing framework

### Manual Integration Testing

Required for end-to-end validation:

**Platform Configuration Testing:**
1. **Both platforms configured**: Verify PlatformSelector appears
2. **Only Notion configured**: Verify PlatformSelector doesn't appear, Notion auto-selected
3. **Only Confluence configured**: Verify PlatformSelector doesn't appear, Confluence auto-selected
4. **No platforms configured**: Verify error message or warning appears

**Task Mode Testing:**
5. **Basic generation**: Context only → verify 5 sections in English
6. **With code**: Add code snippet → verify formatted in docs with language inference
7. **Inline formatting**: Use **bold**, *italic*, `code`, [links](url) in input → verify formatting in both Notion and Confluence

**Confluence-Specific Testing:**
8. **Append mode**: Send to Confluence with append → verify content added to end
9. **Overwrite mode**: Send to Confluence with overwrite → verify confirmation dialog appears
10. **Overwrite confirmation**: Click confirm → verify content replaced
11. **Overwrite cancel**: Click cancel or Escape → verify operation cancelled
12. **Page search**: Type in Confluence page search → verify debounced search works
13. **Search results**: Verify pages appear with title and spaceKey

**History Panel Testing:**
14. **History save**: Generate docs → verify saved to history with mode and platform
15. **History search**: Type in search → verify filters by title/content
16. **Mode filter**: Filter by mode → verify only matching items shown
17. **Platform filter**: Filter by platform → verify only matching items shown
18. **Clear filters**: Click clear filters → verify all filters reset
19. **Load from history**: Click history item → verify documentation restored
20. **Remove item**: Hover over item → click X → verify item removed
21. **Clear all**: Click clear all → verify all history removed

**Architecture/Meeting Mode Testing:**
22. **Architecture generation**: Switch to Architecture tab → verify 5 sections
23. **Meeting generation**: Switch to Meeting tab → verify 6 sections
24. **Notion prefix (Architecture)**: Send architecture docs to Notion → verify `🏗️ # [ARCHITECTURE]` prefix
25. **Notion prefix (Meeting)**: Send meeting docs to Notion → verify `📅 # [MEETING]` prefix

---

## GitHub Actions CI/CD

The project includes a GitHub Actions workflow for continuous integration.

**Workflow File**: `.github/workflows/ci.yml`

**Triggers**: Push to `main` branch

**Jobs**:
1. **lint-and-format**: Runs ESLint and Prettier checks for client and server
2. **unit-tests**: Runs Vitest unit tests for server and client (runs in parallel with lint)
3. **e2e-tests**: Runs Playwright E2E tests (only after unit tests pass)

**Key Features**:
* Node.js 20.18.x
* npm dependency caching
* Playwright browser caching
* Uploads Playwright reports and test results as artifacts on failure (7-day retention)
* Parallel execution of lint and unit tests for speed
* Sequential execution of E2E tests (after unit tests pass)

**Status**: All jobs must pass for CI to succeed

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

**Add new platform support**:
* Create new service directory in `server/src/services/` (e.g., `jira/`)
* Create route file in `server/routes/` (e.g., `jira.js`)
* Create Zod schema in `server/src/schemas/` (e.g., `jira.js`)
* Update `server/src/config/index.js` to add platform detection
* Update `client/src/components/PlatformSelector.jsx` to include new platform
* Add API client functions in `client/src/utils/api.js`

**Add Notion block types**:
* Update `markdownToNotionBlocks()` in `server/src/services/notion/markdown.js`
* Add new block type handlers (e.g., tables, callouts, toggles)

**Add Confluence storage format support**:
* Update `markdownToConfluenceStorage()` in `server/src/services/confluence/markdown.js`
* Add new macro handlers for Confluence-specific features

**Add API endpoints**:
* Create new route file in `server/routes/` (e.g., `export.js`)
* Mount route in `server/src/routes.js`
* Create Zod schema in `server/src/schemas/` for validation

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

### Platform Client Initialization

Both Notion and Confluence clients are created at **module‑level**:

```javascript
// server/src/services/notion/index.js
import { Client } from '@notionhq/client';

export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});
```

```javascript
// server/src/services/confluence/client.js
// Uses Basic Auth with email + API token
const auth = Buffer.from(`${email}:${token}`).toString('base64');
const headers = {
  'Authorization': `Basic ${auth}`,
  'Content-Type': 'application/json',
};
```

This works because `server/src/config/index.js` loads `dotenv/config` before services are imported.

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

---

## API Routes

All API routes are mounted under the `/api` prefix via `server/src/routes.js`:

**Current endpoints**:
* `GET /api/config` — Get available platforms (Notion/Confluence)
  * Returns: `{ success: true, platforms: { notion: boolean, confluence: boolean } }`
  * Used by: Frontend to determine which platforms are configured

* `POST /api/generate` — Generate documentation (task/architecture/meeting mode)
  * Requires: `mode` ('task' | 'architecture' | 'meeting') + `context` (unified input field)
  * Returns: `{ documentation: string }` - Markdown documentation

* `GET /api/notion/pages` — List all Notion pages shared with integration
  * Returns: `{ pages: [{ id, title }] }`
  * Used by: Page selector dropdown in UI

* `POST /api/notion` — Export documentation to Notion page
  * Requires: `content` (markdown), `pageId` (UUID), optional `mode`
  * Returns: `{ success, blocksAdded, chunks }`

* `GET /api/confluence/pages` — Search Confluence pages
  * Query params: `search` (optional), `limit` (default 50, max 200)
  * Returns: `{ success: true, pages: [{ id, title, spaceKey }], count, query, limit }`
  * Used by: PageSearchSelector with debounced search

* `POST /api/confluence` — Export documentation to Confluence page
  * Requires: `content` (markdown), `pageId`, optional `mode`, optional `writeMode` ('append' | 'overwrite')
  * Returns: `{ success, platform: 'confluence', writeMode, message, pageId, version }`

**Route mounting**:
```javascript
import routes from './routes.js';
app.use('/api', routes);
```

Individual route handlers are in `server/routes/`:
* `server/routes/config.js` — Platform configuration endpoint
* `server/routes/generate.js` — Generate endpoint logic (triple mode support)
* `server/routes/notion.js` — Notion export and page listing endpoints
* `server/routes/confluence.js` — Confluence export and page search endpoints

---

## ESLint Configuration

### Client (ESLint v9 - Flat Config)

Uses flat config format (`eslint.config.js`):
* `'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }]` → allows **UPPER_SNAKE_CASE** constants without flagging as unused

### Server (ESLint v8 - Legacy Config)

Uses `.eslintrc.json` format:
* Standard recommended rules
* Node.js environment

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
* In development, CORS handles routing to backend on port 3001
* Example: `VITE_API_BASE=http://localhost:3001/api` for direct backend calls

---

## React 19 Features

The project uses **React 19.1.1** with modern features:

**New React 19 Features Used:**
* **Lazy loading with Suspense** — `GeneratedContent` component is lazy-loaded for code splitting
* **Context API improvements** — Used for `LiveAnnouncer` and `Toast` systems
* **Enhanced hooks** — Better support for concurrent rendering

---

# Repository‑Wide Guardrails & Code Style

> **Audience:** Claude Code (claude.ai/code). **Obey all rules below when reading, editing, or generating code in this repo.**

## 1. Comment & Documentation Policy

* **Never** introduce or modify inline code comments such as `// ...` or `/* ... */`. **Zero** explanatory comments in code.
* The **only** allowed in‑code documentation is a structured **docstring block** placed immediately above a declaration using **JSDoc/TSDoc** syntax (`/** ... */`).
* Docstrings must document public surfaces (modules, React components, hooks, functions, classes, Express routes, middlewares). Avoid narrative or speculative prose.
* Keep docstrings concise and precise. Prefer examples over paragraphs.

### Required docstring tags (use as appropriate)

* `@fileoverview` — file‑level overview
* `@module` or `@packageDocumentation` (TS) — module purpose
* `@component` — React components
* `@param`, `@returns`, `@throws`, `@example`, `@async`
* `@typedef` / `@template` (for shapes and generics) or TypeScript types

> Use **JSDoc** for JavaScript files and **TSDoc** for TypeScript. Prefer TypeScript types when available; otherwise annotate with JSDoc types.

## 2. Clean Code & Design Principles

* Favor **small, single‑purpose** functions and components
* Apply **SOLID** principles pragmatically; prefer composition over inheritance
* Eliminate dead code; avoid global mutable state; keep functions **pure** where possible
* Naming: *PascalCase* for components/classes, *camelCase* for variables/functions, *UPPER_SNAKE_CASE* for constants and env var keys

## 3. React (Vite) Standards

* **Function components only.** No class components
* Obey the **Rules of Hooks** (call hooks at the top level; don't call inside loops/conditions; only call from React components or custom hooks). Name custom hooks `useX`
* **File layout:** one component per file in `client/src/components/`; colocate tests as `ComponentName.test.jsx`
* **Props & state:** prefer controlled components; derive state when possible; compute expensive values with `useMemo` and stable callbacks via `useCallback` where beneficial
* **Effects:** include complete dependency arrays; avoid side effects in render; use cleanup functions
* **Exports:** prefer **named exports** to enable tree‑shaking and consistent imports
* **Vite specifics:**
  * Use Node.js **^20.18.0** (per package.json engines)
  * Respect required Node version and Vite's build commands
  * Use `import.meta.env` for client‑side env values (never expose secrets)
  * Keep `index.html` as the entry; assets served from `client/public/`

## 4. Tailwind CSS

* Use the **official Prettier plugin for Tailwind CSS** to auto‑sort classes. Do not hand‑sort
* Prefer **theme tokens** (colors, spacing, breakpoints) over arbitrary values. Only use `[]` arbitrary values when no token exists
* Extract repeated utility patterns with componentization or `@apply` (for small, stable patterns) instead of duplicating class lists
* Keep class strings readable and minimal; avoid conflicting utilities

## 5. Prism.js (Syntax Highlighting)

* Render code blocks with a `language-<lang>` class
* After content updates that inject code snippets, re‑highlight using Prism's API (e.g., `Prism.highlightAll()` or `highlightAllUnder(container)` in a React effect)
* For dynamic languages, use the **Autoloader** plugin to lazy‑load grammars. Avoid bundling all languages

## 6. Node.js & Express (Backend)

* **Routing:** use `express.Router()` to keep routes modular; group by feature; no logic in route files beyond wiring
* **Middleware:** compose small middlewares. Provide a terminal **error‑handling middleware** with signature `(err, req, res, next)` after all routes
* **Security:** enable TLS at the edge; use **Helmet**; validate inputs; set secure cookie flags; never trust user input
* **Performance:** enable gzip/deflate; avoid synchronous calls in the hot path; centralize structured logging; set `NODE_ENV=production` in prod
* **Config:** read configuration via environment variables; never commit secrets; load `.env` early at process start

## 7. Formatting & Linting

* **Prettier** formats codebase. **Do not** manually reflow code or classes
* ESLint with recommended rules plus React and JSX a11y plugins. Fix all lint errors; no `eslint-disable` unless justified at file top with a docstring rationale
* Tailwind Prettier plugin enforces canonical class order

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

* Do **not** insert `//` or `/* */` comments anywhere
* Do **not** remove or rewrite existing docstrings unless they are incorrect
* Do **not** expose secrets or move server‑only values to the client
* Do **not** change public APIs without updating corresponding docstrings and usage sites in the same change

## 10. Quick Checks Before Submitting Changes

* ✅ All new/changed declarations have proper docstrings
* ✅ No inline comments were added
* ✅ Lint and Prettier pass locally
* ✅ React hooks follow the rules; effects have correct deps
* ✅ Tailwind classes are auto‑sorted and extracted when repetitive
* ✅ Prism highlighting still works after UI changes
* ✅ Express error handler remains last in the middleware chain
* ✅ Tests pass (unit and E2E)
* ✅ Platform-specific features work for both Notion and Confluence

---

**Last Updated**: 2025-11-12
**Documentation Version**: 4.1
**Recent Changes**:
* **Confluence Search Improvements** (2025-11-11): Title-only search with exact match priority, tiered search strategy, natural relevance ranking
* **Input Optimization Thresholds** (2025-11-11): Adjusted thresholds to 25k safe, 20k warning, 30k absolute to align with validation limits
* **Repository Cleanup** (2025-11-12): Removed obsolete Python files, duplicate configs, relocated services to correct directories
* **Previous Major Changes** (v4.0): Confluence integration, platform selector, write modes, enhanced history panel, E2E tests, GitHub Actions CI/CD
