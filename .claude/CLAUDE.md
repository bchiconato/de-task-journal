# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Data Engineering Task Documenter - A full-stack app that generates Brazilian Portuguese technical documentation for data engineering tasks using Google Gemini AI and sends it to Notion with automatic block chunking.

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

## Architecture

### Two-Tier Architecture

**Backend (Express)** → **Frontend (React)**
- Backend runs on port 3001, exposes `/api/generate` and `/api/notion`
- Frontend runs on port 5173, makes fetch calls to backend
- All API keys stay server-side only

### Critical Data Flow

1. **User Input** → `InputForm.jsx` collects context/code/challenges
2. **Generate Request** → `client/utils/api.js` → `POST /api/generate`
3. **Gemini Service** → `server/services/geminiService.js` calls Google Gemini REST API
4. **Response** → Markdown docs in Brazilian Portuguese (8 sections)
5. **Display** → `GeneratedContent.jsx` shows docs with copy/send buttons
6. **Send to Notion** → `POST /api/notion` → `notionService.js` with chunking

### Key Service Responsibilities

**`geminiService.js`**
- Direct REST API calls to Google Gemini (no SDK)
- Uses system instructions to force Brazilian Portuguese output
- Constructs prompts with 8-section structure
- Model configurable via `GEMINI_MODEL` env var (default: `gemini-2.0-flash-exp`)

**`notionService.js`**
- Converts Markdown → Notion block JSON (NOT raw markdown)
- **Critical**: Automatically chunks documents into ≤100 blocks per request
- Sends chunks sequentially with 100ms delays to avoid rate limits
- Truncates text to 2000 chars per block (Notion limit)
- Maps code languages (python, sql, js, etc.)
- **Inline Formatting**: Parses `**bold**`, `*italic*`, `` `code` ``, `~~strikethrough~~` into Notion rich text annotations
- **Lazy Client**: Creates Notion Client instance at runtime (not module-level) to ensure env vars are loaded
- **Code Block Handling**: Detects ``` with whitespace tolerance using `trim()` for robust parsing

### Environment Configuration

**Required Environment Variables** (`.env` at project root):
```
GEMINI_API_KEY=        # From https://aistudio.google.com/app/apikey
GEMINI_MODEL=gemini-2.0-flash-exp
NOTION_API_KEY=        # From https://notion.so/my-integrations
NOTION_PAGE_ID=        # Target Notion page UUID
PORT=3001
```

**Important**:
- `.env` is loaded by `server/index.js` with path `'../.env'` (relative to server dir)
- **CRITICAL**: `dotenv.config()` MUST be called BEFORE any other imports in `server/index.js` to ensure environment variables are available when services initialize their clients

## Generated Documentation Structure

All Gemini responses MUST include these 8 sections in Brazilian Portuguese:
1. Visão Geral da Tarefa
2. Contexto e Motivação
3. Solução Implementada
4. Dificuldades Encontradas
5. Armadilhas e Pontos de Atenção
6. Soluções Aplicadas
7. Lições Aprendidas
8. Recomendações Futuras

This structure is enforced via the `buildPrompt()` function in `geminiService.js`.

## Markdown to Notion Conversion

### Inline Formatting Support

The `parseInlineMarkdown()` function converts markdown inline formatting to Notion rich text annotations:

| Markdown | Notion Annotation | Example |
|----------|------------------|---------|
| `**text**` | Bold | **bold text** |
| `*text*` or `_text_` | Italic | *italic text* |
| `` `text` `` | Code | `inline code` |
| `~~text~~` | Strikethrough | ~~strikethrough~~ |

**Implementation**: Regex-based parser that finds earliest match, handles nested patterns correctly, and generates Notion rich text objects with proper annotations.

### Block Types Supported

- Headings: `#`, `##`, `###` (H1, H2, H3)
- Code blocks: ``` with language detection (python, sql, js, etc.)
- Lists: `- ` or `* ` (bulleted), `1. ` (numbered)
- Paragraphs: All other text

**Critical**: All block types use `parseInlineMarkdown()` for rich text, ensuring consistent formatting across headings, paragraphs, and lists.

### Code Block Detection

Code blocks use whitespace-tolerant detection:
```javascript
line.trim().startsWith('```')  // Opening
lines[i].trim().startsWith('```')  // Closing
```

This handles indented code blocks in nested contexts (e.g., within lists or quotes) without breaking parsing.

## Notion Block Chunking

**Why**: Notion API has a hard limit of 100 blocks per `blocks.children.append` request.

**How**: `notionService.js` implements:
- `chunkBlocks(blocks, maxSize)` - splits array into chunks of ≤100
- Sequential sending with `delay(100)` between chunks
- Returns `{ blocksAdded, chunks }` in response

**When to modify**: If adding new Markdown patterns (e.g., tables, callouts), update `markdownToNotionBlocks()` and ensure chunking still works.

## API Integration Points

### Gemini API
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- Auth: API key in query param (`?key=...`)
- Free tier: 15 RPM, 1500 RPD, 1M TPM
- System instructions force Portuguese output

### Notion API
- Uses `@notionhq/client` SDK
- Endpoint: `notion.blocks.children.append()`
- Auth: Bearer token in client initialization
- Must share page with integration before first use

## Common Pitfalls

1. **Notion "unauthorized" errors**:
   - Page not shared with integration. User must invite integration in Notion UI.
   - **OR** Environment variables not loaded before client initialization. Ensure `dotenv.config()` is the FIRST import in `server/index.js`.

2. **100-block limit**: If adding new block types, always test with >100 block documents to verify chunking works.

3. **Portuguese output**: If Gemini returns English, check:
   - `systemInstruction` is being sent in API call
   - Model supports system instructions (`gemini-2.0-flash-exp` does)

4. **CORS errors**: Backend must run on port 3001. Frontend hardcodes `http://localhost:3001/api` in `client/utils/api.js`.

5. **Environment variables loading order**:
   - Backend loads `.env` from project root, not from `server/.env`
   - `dotenv.config()` MUST be called before any other imports, otherwise services will initialize with undefined env vars
   - Notion Client is created lazily inside `sendToNotion()` to ensure env vars are loaded

6. **Markdown formatting not appearing in Notion**:
   - Inline markdown (`**bold**`, `*italic*`, `` `code` ``) is parsed by `parseInlineMarkdown()` function
   - Code blocks use whitespace-tolerant detection with `trim()` to handle indented markdown
   - If formatting breaks, check that all block types use `parseInlineMarkdown()` for rich text

## State Management

Frontend uses React `useState` hooks in `App.jsx`:
- `documentation` - generated markdown string
- `isGenerating` - loading state for Gemini API
- `isSending` - loading state for Notion API
- `error` - error message string

No global state management (Redux, Context) - single-component state is sufficient.

## Testing Approach

Manual testing required:
1. **Basic generation**: Context only → verify 8 sections in Portuguese
2. **With code**: Add code snippet → verify formatted in docs
3. **Notion send**: Click "Send to Notion" → check server logs for chunking
4. **Large docs**: Long context + code → verify >100 blocks get chunked

Check server console for:
```
Generated X Notion blocks
Sending Y chunks to Notion
Sending chunk 1/Y (100 blocks)
```

## Key Files to Modify

**Add new AI providers**: Create new service in `server/services/`, update `server/routes/generate.js` import

**Change documentation structure**: Modify `buildPrompt()` in `geminiService.js`

**Add Notion block types**: Update `markdownToNotionBlocks()` in `notionService.js`

**Add inline markdown patterns**: Update `parseInlineMarkdown()` function in `notionService.js` - add new regex patterns to the `patterns` array

**Change UI**: React components in `client/src/components/`

**Update API base URL**: `client/src/utils/api.js` line 1

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
  // Create client at runtime, not module-level
  const notion = new Client({
    auth: process.env.NOTION_API_KEY,
  });
  // ... rest of function
}
```

This ensures environment variables are loaded before the Notion SDK accesses them.
