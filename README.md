# Task Journal

**AI-Powered Documentation Generator for Data Engineers & Technical Teams**

Transform unstructured notes, code snippets, and meeting transcripts into polished, professional technical documentation using Google Gemini AI. Export directly to Notion or Confluence with a single click.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Getting Started](#getting-started)
- [Documentation Modes](#documentation-modes)
- [API Reference](#api-reference)
- [Development](#development)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Accessibility](#accessibility)
- [Troubleshooting](#troubleshooting)

## Overview

**Task Journal** is a full-stack web application that automates technical documentation generation for data engineering teams, software developers, and technical professionals. The application features **three documentation modes** (Task, Architecture, and Meeting) that generate structured, professional documentation in English from any language input.

The system supports two platforms for document export:
- **Notion**: With automatic block chunking for large documents
- **Confluence**: With append and overwrite modes for flexible content management

Perfect for teams that struggle with documentation debt, meeting follow-ups, or keeping architecture records current.

## Key Features

### Documentation Generation
- **Task Mode**: Documents completed tasks with structured sections (Summary, Problem Solved, Solution Implemented, Code Highlights, Challenges & Learnings)
- **Architecture Mode**: Creates comprehensive system documentation (Overview, Key Components, Data & Service Flow, Technology Stack, Migration Guide & Developer Workflow)
- **Meeting Mode**: Synthesizes meeting transcripts into actionable documentation (Executive Summary, Key Decisions, Technical Context, Action Items, Open Questions & Risks)

### Platform Integration
- **Notion Export**: Direct page integration with automatic block chunking (100 blocks per request)
- **Confluence Export**: Support for both append and overwrite modes with visual warnings
- **Dynamic Platform Selection**: Automatically detects and displays configured platforms

### User Experience
- **AI-Powered**: Google Gemini API generates professional documentation
- **In-App Editor**: Live markdown preview and edit capabilities before export
- **Browser Persistence**: Auto-saves form drafts every 500ms to localStorage
- **Generation History**: Restore up to 50 past documentations with searchable history panel
- **Page Search**: Debounced search with caching for Confluence and Notion pages

### Quality & Accessibility
- **WCAG 2.1 Compliant**: Fully accessible with keyboard navigation, ARIA labels, and screen reader support
- **Reduced Motion Support**: Respects user preferences for animations
- **Responsive Design**: Optimized for desktop and mobile experiences
- **Error Boundaries**: Graceful error handling with user-friendly messages

## Tech Stack

### Frontend
- **React 19.1.1** — Modern UI with hooks and concurrent rendering
- **Vite 7.1.7** — Lightning-fast build tool and dev server
- **Tailwind CSS 3.4.18** — Utility-first CSS framework with typography plugin
- **React Markdown 9.0.0** — Markdown rendering
- **React Syntax Highlighter 15.5.0** — Code block syntax highlighting
- **Lucide React 0.552.0** — Icon library
- **Vitest 2.1.9** — Unit testing framework
- **@testing-library/react 16.3.0** — React component testing
- **@playwright/test 1.56.1** — End-to-end testing (root level)

### Backend
- **Node.js ^20.18.0** — JavaScript runtime
- **Express 5.1.0** — Web framework
- **@notionhq/client 5.3.0** — Official Notion SDK
- **Zod 4.1.12** — Schema validation and type safety
- **Helmet 8.1.0** — Security middleware
- **express-rate-limit 8.1.0** — Rate limiting
- **dotenv 17.2.3** — Environment variable management
- **Vitest 2.1.8** — Unit testing
- **MSW 2.11.6** — Mock Service Worker for API mocking
- **Supertest 7.1.4** — HTTP assertion testing

### DevOps
- **GitHub Actions** — CI/CD pipeline (lint, test, E2E)
- **Makefile** — Build automation and development commands
- **ESLint & Prettier** — Code quality and formatting
- **Playwright** — Cross-browser E2E testing

## Prerequisites

Before you begin, ensure you have:

- **Node.js**: v20.18.0 or higher
- **npm**: v9.x or higher
- **Make**: Recommended (optional, can run commands manually)
- **API Keys**:
  - **Google Gemini API Key**: [Get it here](https://aistudio.google.com/app/apikey)
  - **Notion Integration Token**: [Create integration](https://www.notion.so/my-integrations) (optional)
  - **Confluence Domain & API Token**: [Generate API token](https://id.atlassian.com/manage-profile/security/api-tokens) (optional)

**At least one platform (Notion or Confluence) must be configured.**

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/bchiconato/de-task-journal.git
cd de-task-journal
```

### 2. Install Dependencies

Using Make (recommended):
```bash
make install
```

Or manually:
```bash
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
```

### 3. Configure Environment Variables

Create a `.env` file in the `server/` directory:

```bash
# Required
GEMINI_API_KEY=your-google-gemini-api-key
GEMINI_MODEL=gemini-2.0-flash-exp

# Notion Integration (optional, but recommended)
NOTION_API_KEY=your-notion-integration-token

# Confluence Integration (optional)
CONFLUENCE_DOMAIN=your-company.atlassian.net
CONFLUENCE_USER_EMAIL=your-email@company.com
CONFLUENCE_API_TOKEN=your-confluence-api-token

# Server Configuration
PORT=3001
NODE_ENV=development
```

**Optional Client Configuration** (`.env` in `client/` directory):

```bash
VITE_API_BASE=/api
```

### 4. Set Up Notion Integration (Optional)

1. Go to [Notion Developers](https://www.notion.so/my-integrations)
2. Create a new integration and copy the API token
3. Share target Notion pages with your integration
4. Paste the token into your `.env` file

### 5. Set Up Confluence Integration (Optional)

1. Generate an API token at [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Configure `CONFLUENCE_DOMAIN`, `CONFLUENCE_USER_EMAIL`, and `CONFLUENCE_API_TOKEN` in `.env`

## Configuration

### Platform Availability

The application automatically detects which platforms are configured:

| Configuration | Notion Available | Confluence Available | UI Behavior |
|---|---|---|---|
| Only `NOTION_API_KEY` set | ✅ Yes | ❌ No | Notion auto-selected |
| Only Confluence env vars set | ❌ No | ✅ Yes | Confluence auto-selected |
| Both configured | ✅ Yes | ✅ Yes | Platform selector shown |
| Neither configured | ❌ No | ❌ No | Error message displayed |

### Gemini Model Selection

Configure which Gemini model to use via `GEMINI_MODEL`:

```bash
GEMINI_MODEL=gemini-2.0-flash-exp  # Default (recommended)
GEMINI_MODEL=gemini-pro-vision
GEMINI_MODEL=gemini-1.5-pro
```

### Rate Limiting

Express rate limit is configured to **200 requests per 15 minutes per IP**. Adjust in `server/src/app.js` if needed.

## Getting Started

### Development Mode

Start both backend and frontend with hot reload:

```bash
make dev
```

Or manually:
```bash
# Terminal 1 - Backend (port 3001)
cd server && npm run dev

# Terminal 2 - Frontend (port 5173)
cd client && npm run dev
```

Visit **http://localhost:5173** in your browser.

### Production Build

Build the client for production:

```bash
make build
```

Output will be in `client/dist/`. Deploy the backend separately using your preferred Node.js hosting.

### Makefile Commands

```bash
make install       # Install all dependencies
make dev          # Start development servers
make build        # Build client for production
make lint         # Run ESLint on both client and server
make format       # Auto-format code with Prettier
make test         # Run all tests (unit + E2E)
make clean        # Remove dependencies and artifacts
```

## Documentation Modes

### Task Documentation Mode

Ideal for documenting completed tickets, bugfixes, or daily engineering work.

**Input**: Paste unstructured notes, code snippets, challenges, and lessons.

**Output Structure**:
1. **Summary** — 1-2 sentence overview
2. **Problem Solved** — Business or technical problem addressed
3. **Solution Implemented** — Technical approach and decisions
4. **Code Highlights** — Key code snippets with explanations
5. **Challenges & Learnings** — Obstacles, mitigations, and insights

### Architecture Documentation Mode

Perfect for documenting system design, migrations, or component architecture.

**Input**: Paste system overview, components, data flows, decisions, risks, and technical context.

**Output Structure**:
1. **Overview** — System purpose and business context
2. **Key Components** — Services/modules and responsibilities
3. **Data & Service Flow** — Runtime interaction and data movement
4. **Technology Stack** — Technologies, frameworks, and infrastructure
5. **Migration Guide & Developer Workflow** — Setup steps and developer how-to

### Meeting Documentation Mode

Extract actionable documentation from meeting transcripts (supports Portuguese/English mix).

**Input**: Paste meeting transcript or notes (multilingual supported).

**Output Structure**:
1. **Meeting Record** — Topic-focused title
2. **Executive Summary** — 3-5 sentence overview and sentiment
3. **Key Decisions & Definitions** — Explicit agreements made
4. **Technical Context Extracted** — Technologies and architectural items discussed
5. **Action Items & Next Steps** — Tasks with inferred owners and deadlines
6. **Open Questions & Risks** — Unresolved items and potential problems

**Special Features**:
- Filters conversational filler automatically
- Differentiates decisions from suggestions
- Attempts owner inference from speaker context
- Outputs in English regardless of input language

## API Reference

### Platform Configuration

```
GET /api/config
```

Returns which platforms are available based on environment configuration.

**Response**:
```json
{
  "success": true,
  "platforms": {
    "notion": true,
    "confluence": false
  }
}
```

### Generate Documentation

```
POST /api/generate
```

Generates documentation based on mode and context input.

**Request Body**:
```json
{
  "mode": "task|architecture|meeting",
  "context": "Unstructured input (min 10 chars)"
}
```

**Response**:
```json
{
  "documentation": "# Generated Markdown\n\n## Section 1\n...",
  "mode": "task"
}
```

**Status Codes**:
- `200` — Success
- `400` — Invalid input or validation error
- `500` — Server error

### Notion Pages

```
GET /api/notion/pages
```

Lists all Notion pages shared with the integration.

**Response**:
```json
{
  "success": true,
  "pages": [
    {
      "id": "12345678-1234-1234-1234-123456789012",
      "title": "Engineering Notes"
    }
  ]
}
```

### Export to Notion

```
POST /api/notion
```

Appends documentation blocks to a Notion page.

**Request Body**:
```json
{
  "content": "# Markdown Documentation\n\n...",
  "pageId": "12345678-1234-1234-1234-123456789012",
  "mode": "task"
}
```

**Response**:
```json
{
  "success": true,
  "blocksAdded": 42,
  "chunks": 1
}
```

### Search Confluence Pages

```
GET /api/confluence/pages?search=query&limit=50
```

Searches Confluence pages by title or content.

**Query Parameters**:
- `search` (optional): Search term
- `limit` (optional, default: 50, max: 200): Result limit

**Response**:
```json
{
  "success": true,
  "pages": [
    {
      "id": "12345",
      "title": "Architecture Overview",
      "spaceKey": "ENG"
    }
  ],
  "count": 1,
  "query": "architecture",
  "limit": 50
}
```

### Export to Confluence

```
POST /api/confluence
```

Exports documentation to a Confluence page (append or overwrite).

**Request Body**:
```json
{
  "content": "# Markdown Documentation\n\n...",
  "pageId": "12345",
  "mode": "task",
  "writeMode": "append|overwrite"
}
```

**Response**:
```json
{
  "success": true,
  "platform": "confluence",
  "writeMode": "append",
  "message": "Content appended successfully",
  "pageId": "12345",
  "version": 5
}
```

## Development

### Project Structure

```
de-task-journal/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/             # Reusable React components
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── utils/                  # Helper functions (API, validation)
│   │   ├── styles/                 # Global and component styles
│   │   ├── App.jsx                 # Main application component
│   │   └── main.jsx                # Entry point
│   ├── test/                       # Unit and component tests
│   ├── vite.config.js              # Vite build configuration
│   ├── vitest.config.js            # Vitest configuration
│   └── package.json
│
├── server/                          # Node.js/Express backend
│   ├── src/
│   │   ├── app.js                  # Express app setup
│   │   ├── routes.js               # Route aggregator
│   │   ├── config/                 # Configuration and env validation
│   │   ├── middleware/             # Custom middleware (validation, errors)
│   │   ├── lib/                    # Utility libraries (HTTP, retry)
│   │   ├── schemas/                # Zod request schemas
│   │   └── services/               # Business logic (Gemini, Notion, Confluence)
│   ├── routes/                     # API route handlers
│   ├── test/                       # Unit and integration tests
│   ├── index.js                    # Application entry point
│   ├── vitest.config.js            # Vitest configuration
│   └── package.json
│
├── e2e/                             # Playwright E2E tests
│   ├── accessibility.spec.js
│   ├── confirm-dialog.spec.js
│   ├── documentation-flow.spec.js
│   ├── history-panel.spec.js
│   └── write-mode-selector.spec.js
│
├── .github/workflows/               # CI/CD pipelines
│   └── ci.yml
│
├── .claude/                         # Claude AI assistant configs
│   ├── CLAUDE.md                   # Development guidelines
│   ├── agents/                     # AI agents for tasks
│   └── settings.json               # Permissions
│
├── Makefile                         # Build automation
├── playwright.config.js             # Playwright configuration
├── vitest.workspace.js              # Monorepo test workspace
├── package.json                     # Root package dependencies
└── README.md                        # This file
```

### Key Backend Patterns

**Service-Oriented Architecture**: Business logic is organized in modular services:
- `server/src/services/gemini/` — AI documentation generation
- `server/src/services/notion/` — Notion API integration
- `server/src/services/confluence/` — Confluence API integration

**Middleware Stack**:
- Request validation via Zod schemas
- Error handling with terminal middleware
- Rate limiting and security headers
- CORS support

**HTTP Resilience**:
- `fetchWithRetry()` with exponential backoff (12s timeout, 3 attempts)
- Automatic retry on 429 (rate limit) and 5xx errors
- Used by all external API calls

### Key Frontend Patterns

**Component Architecture**:
- Function components with React hooks
- Reusable UI components in `client/src/components/`
- Custom hooks for cross-cutting concerns (`useToast`, `usePageSearch`, `useAbortableRequest`)

**State Management**:
- React `useState` for component-level state
- Context API for toast notifications and screen reader announcements
- localStorage for persistence (form drafts, selected page, history)

**Data Flow**:
1. User selects mode and platform
2. Form validates and auto-saves
3. User clicks Generate → API call to `/api/generate`
4. Generated markdown displayed in editor
5. User selects target page (debounced search)
6. User clicks Send → API call to `/api/notion` or `/api/confluence`

## Testing

### Unit Tests

Run all unit tests:

```bash
npm run test:run
```

Watch mode (auto-reload on changes):

```bash
npm run test:watch
```

With coverage:

```bash
npm run test:coverage
```

### Test Organization

**Frontend** (`client/test/`):
- Component tests (ConfirmDialog, GeneratedContent, HistoryPanel, InputForm, Toast, WriteModeSelector)
- Hook tests (useAbortableRequest, useToast)
- Accessibility tests with jest-axe

**Backend** (`server/test/`):
- API endpoint tests (config, generate, notion, confluence)
- Service tests (Notion markdown conversion, HTTP retry logic)
- Integration tests with MSW mocking

### E2E Tests

Run Playwright E2E tests:

```bash
npx playwright test
```

Interactive mode:

```bash
npx playwright test --ui
```

With browser visible:

```bash
npx playwright test --headed
```

**Test Coverage** (`e2e/`):
- Accessibility (keyboard navigation, ARIA attributes)
- Confirm Dialog (appearance, escape key, cancel/confirm)
- Documentation generation flow (all three modes)
- History Panel (search, filters, item removal)
- Write Mode Selector (mode switching, warnings)

### GitHub Actions CI/CD

The repository includes automated testing on every push to `main`:

1. **Lint & Format Check** — ESLint and Prettier validation
2. **Unit Tests** — Vitest (runs in parallel with lint)
3. **E2E Tests** — Playwright (only after unit tests pass)

All jobs must pass for CI to succeed.

## Project Structure Details

### Client Components

**Form & Input**:
- `InputForm.jsx` — Main form with unified context field and auto-save
- `PlatformSelector.jsx` — Dynamic platform selection (Notion/Confluence)
- `PageSearchSelector.jsx` — Searchable page selector with debounce
- `WriteModeSelector.jsx` — Confluence write mode selector (append/overwrite)

**Output & Interaction**:
- `GeneratedContent.jsx` — Markdown preview and editor (lazy-loaded)
- `HistoryPanel.jsx` — Searchable history with filters
- `ConfirmDialog.jsx` — Modal for destructive action confirmation
- `ModeToggle.jsx` — Documentation mode switcher (tab navigation)

**Utilities & Support**:
- `AppErrorBoundary.jsx` — Error boundary for graceful error handling
- `LoadingSpinner.jsx` — Loading indicator with ARIA live region
- `Toast.jsx` — Notification system
- `LiveAnnouncer.jsx` — Screen reader announcements
- `CharacterCounter.jsx` — Text length display
- `Guide.jsx` — In-app help and onboarding

### Server Routes

**API Endpoints** (mounted under `/api`):
- `routes/config.js` — Platform availability check
- `routes/generate.js` — Documentation generation
- `routes/notion.js` — Notion integration (export & page listing)
- `routes/confluence.js` — Confluence integration (export & page search)

### Services

**Gemini Service** (`server/src/services/gemini/`):
- Direct REST API calls (no SDK)
- Mode-aware prompts and system instructions
- Configurable model via `GEMINI_MODEL` env var
- Mock mode support when API key is unavailable

**Notion Service** (`server/src/services/notion/`):
- **markdown.js** — Markdown to Notion block conversion
- **client.js** — Notion API operations
- **index.js** — Client initialization and retry logic
- **config.js** — Constants and limits (100 blocks per request)
- **search.js** — Page search and listing

**Confluence Service** (`server/src/services/confluence/`):
- **markdown.js** — Markdown to Confluence Storage Format conversion
- **client.js** — REST API operations (append/overwrite)
- **index.js** — Service exports
- **config.js** — API version and configuration
- **search.js** — Page search functionality

## Accessibility

The application is fully compliant with **WCAG 2.1 Level AA** standards:

### Keyboard Navigation
- Tab through all interactive elements
- Escape to close modals and panels
- Arrow keys for tab navigation and option selection
- Home/End keys in tabbed interfaces

### Screen Readers
- Semantic HTML with ARIA labels
- Live regions for status announcements (`useAnnouncer` hook)
- Form validation messages announced to assistive tech
- Focus management in modals

### Visual
- Minimum 4.5:1 color contrast ratio for text
- Focus indicators visible on all interactive elements
- Reduced motion CSS respects `prefers-reduced-motion` media query
- Readable font sizes and line heights

### Assistive Technology
- Compatible with NVDA, JAWS, and VoiceOver
- Proper heading hierarchy
- Form labels linked to inputs
- Error messages explicitly associated with fields

## Troubleshooting

### Platform Configuration Issues

**No platforms appear in the UI**:
1. Check `GET /api/config` response in browser DevTools
2. Verify environment variables are set in `server/.env`
3. Ensure `server/index.js` has `import 'dotenv/config'` as the first line
4. Restart the backend server

**"Unauthorized" errors with Notion**:
- Verify page is shared with the integration in Notion UI
- Check `NOTION_API_KEY` is valid (regenerate at notion.so/my-integrations if needed)
- Ensure correct page ID format (UUID)

**Confluence authentication fails**:
- Verify `CONFLUENCE_DOMAIN` format (e.g., `company.atlassian.net`, not a full URL)
- Check API token validity at atlassian.com/manage-profile
- Ensure user email matches Atlassian account
- Verify page permissions (user must have edit access)

### Generation Issues

**Empty or incorrect documentation**:
- Ensure context field has at least 10 characters
- Check that input is not just whitespace
- Try simplifying context or providing more specific details
- Verify `GEMINI_API_KEY` is valid and has quota

**Timeout errors**:
- Check internet connection
- Verify API key quota (Google Gemini rate limits apply)
- Try with shorter context
- Check server logs for detailed error messages

**Wrong language in output**:
- Verify model supports system instructions (default `gemini-2.0-flash-exp` does)
- Check that `systemInstruction` is in API request
- Restart generation with clearer English instructions

### Notion Export Issues

**429 (Rate Limit) errors**:
- Notion API rate limit hit; implementation automatically retries with backoff
- Check Notion service logs for detailed errors
- Consider spreading requests over time

**"100-block limit" hit**:
- This is handled automatically by chunking logic
- Chunks are sent sequentially with 100ms throttle
- If issues persist, check block structure in generated markdown

### Confluence Export Issues

**Page not found**:
- Verify page ID is correct
- Ensure page is accessible to authenticated user
- Check page still exists in Confluence

**Overwrite confirmation dialog doesn't appear**:
- Ensure `writeMode` is set to `overwrite` in request
- Check browser console for JavaScript errors
- Try refreshing the page

### Development Issues

**Hot reload not working**:
- Ensure both `npm run dev` servers are running
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Check for console errors in DevTools

**Tests failing**:
1. Ensure dependencies are installed: `npm install`
2. Verify Node.js version: `node --version` (should be ^20.18.0)
3. Run `npm run test:run` to see detailed errors
4. Check that no other service is running on ports 3001/5173

**CORS errors**:
- Backend must run on port 3001
- Frontend must run on port 5173
- CORS is enabled in `server/src/app.js`
- Check `VITE_API_BASE` in `client/.env` (defaults to `/api`)
